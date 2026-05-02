#!/usr/bin/env python3
"""Runs on the GPU instance. Installs Ollama if missing, pulls each model,
then measures TTFT and decode speed via Ollama's REST API. Emits JSON.

Per-model metrics (Ollama's /api/generate already reports nanosecond timings):
  - pull_seconds: time to download model
  - load_duration_ms: time to load weights into VRAM (first call)
  - prompt_eval_count, prompt_eval_duration_ms, prompt_eval_rate (tok/s)
  - eval_count, eval_duration_ms, eval_rate (tok/s, decode speed)
  - peak_vram_mb: from nvidia-smi sampled during the call
  - output_chars: response length (sanity check)
"""
import json
import os
import subprocess
import sys
import time
import threading
import urllib.request
import urllib.error

MODELS = [
    "gemma4:e4b",
    "gemma4:26b",
    "huihui_ai/dolphin3-abliterated:8b",
    "dmtx/qwen3.5-9b-abliterated",
    "huihui_ai/qwen3.5-abliterated:27b",
]

PROMPT_1K = (
    "You are a senior systems engineer. Below is a long technical brief on the "
    "design of a low-latency event pipeline serving 50,000 concurrent clients. "
    "Read it carefully and at the end produce a short, structured summary. "
) + (
    "The pipeline ingests JSON events over a TLS-terminated WebSocket gateway, "
    "buffers them in a per-tenant ring queue with adaptive backpressure, and "
    "fans them out to downstream consumers via a topic-based publish-subscribe "
    "layer backed by a sharded Redis cluster. Each shard runs in active-active "
    "replication across two availability zones with eventual quorum reconciliation. "
    "Consumer state is stored in a content-addressable log so replays are "
    "deterministic. Hot keys are detected with a streaming heavy-hitters sketch "
    "(count-min plus space-saving) and routed to dedicated processing threads to "
    "avoid head-of-line blocking. The data plane is written in Rust with a "
    "lock-free MPSC channel between the gateway and the queue, and the control "
    "plane is a small Go service that distributes routing tables via gRPC. " * 5
) + (
    "\n\nBased on the above, list the three biggest scaling risks and a one-line "
    "mitigation for each. Be concise."
)

GEN_MAX = 256
OLLAMA_URL = "http://127.0.0.1:11434"


def log(msg):
    print(f"[ollama-bench] {msg}", file=sys.stderr, flush=True)


def run(cmd, **kw):
    return subprocess.run(cmd, capture_output=True, text=True, **kw)


def ensure_ollama():
    if run(["which", "ollama"]).stdout.strip():
        log("ollama already installed")
    else:
        log("installing ollama...")
        p = subprocess.run("curl -fsSL https://ollama.com/install.sh | sh",
                           shell=True, capture_output=True, text=True)
        if p.returncode != 0:
            raise RuntimeError(f"ollama install failed: {p.stderr[-500:]}")
    # Wait for service
    for _ in range(30):
        try:
            urllib.request.urlopen(f"{OLLAMA_URL}/api/tags", timeout=2)
            log("ollama API ready")
            return
        except Exception:
            time.sleep(1)
    raise RuntimeError("ollama API not reachable on :11434")


def gpu_info():
    r = run(["nvidia-smi", "--query-gpu=name,memory.total,driver_version", "--format=csv,noheader"])
    if r.returncode != 0:
        return {"gpu_name": None}
    name, mem, drv = [x.strip() for x in r.stdout.strip().split(",")]
    return {"gpu_name": name, "vram_total_mb": int(mem.split()[0]), "driver": drv}


def vram_used_mb():
    r = run(["nvidia-smi", "--query-gpu=memory.used", "--format=csv,noheader,nounits"])
    if r.returncode != 0:
        return None
    try:
        return int(r.stdout.strip().split("\n")[0])
    except ValueError:
        return None


def vram_sampler(stop_evt: threading.Event, samples: list, interval=0.25):
    while not stop_evt.is_set():
        v = vram_used_mb()
        if v is not None:
            samples.append(v)
        time.sleep(interval)


def http_post(path: str, body: dict, timeout=900) -> dict:
    data = json.dumps(body).encode()
    req = urllib.request.Request(f"{OLLAMA_URL}{path}",
                                  data=data, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.loads(r.read())


def pull_model(model: str):
    log(f"pulling {model}...")
    t0 = time.time()
    # Use CLI for streaming progress; API would buffer.
    p = subprocess.run(["ollama", "pull", model], capture_output=False, timeout=1800)
    if p.returncode != 0:
        raise RuntimeError(f"pull failed for {model}")
    return round(time.time() - t0, 2)


def bench_one(model: str) -> dict:
    res = {"model": model}
    try:
        res["pull_seconds"] = pull_model(model)
    except Exception as e:
        res["error"] = f"pull: {e}"
        return res

    # Warm-up call: forces weights into VRAM. Short prompt, short output.
    log(f"warming {model}...")
    try:
        warm = http_post("/api/generate", {
            "model": model, "prompt": "Hi.", "stream": False,
            "options": {"num_predict": 8, "temperature": 0},
        }, timeout=600)
        res["warm_load_duration_ms"] = round(warm.get("load_duration", 0) / 1e6, 2)
    except Exception as e:
        res["error"] = f"warm: {e}"
        return res

    log(f"benching {model} (1k prompt -> {GEN_MAX} tokens)...")
    samples = []
    stop_evt = threading.Event()
    sampler = threading.Thread(target=vram_sampler, args=(stop_evt, samples), daemon=True)
    sampler.start()

    t0 = time.time()
    try:
        out = http_post("/api/generate", {
            "model": model, "prompt": PROMPT_1K, "stream": False,
            "options": {"num_predict": GEN_MAX, "temperature": 0},
        }, timeout=900)
    except Exception as e:
        res["error"] = f"bench: {e}"
        stop_evt.set(); sampler.join(timeout=2)
        return res
    res["wall_seconds"] = round(time.time() - t0, 2)
    stop_evt.set()
    sampler.join(timeout=2)

    pe_count = out.get("prompt_eval_count", 0) or 0
    pe_dur_ns = out.get("prompt_eval_duration", 0) or 0
    e_count = out.get("eval_count", 0) or 0
    e_dur_ns = out.get("eval_duration", 0) or 0
    load_ns = out.get("load_duration", 0) or 0
    total_ns = out.get("total_duration", 0) or 0

    res.update({
        "load_duration_ms": round(load_ns / 1e6, 2),
        "total_duration_ms": round(total_ns / 1e6, 2),
        "prompt_eval_count": pe_count,
        "prompt_eval_duration_ms": round(pe_dur_ns / 1e6, 2),
        "prompt_eval_rate": round(pe_count / (pe_dur_ns / 1e9), 2) if pe_dur_ns else None,
        "eval_count": e_count,
        "eval_duration_ms": round(e_dur_ns / 1e6, 2),
        "eval_rate": round(e_count / (e_dur_ns / 1e9), 2) if e_dur_ns else None,
        "ttft_ms": round((load_ns + pe_dur_ns) / 1e6, 2),
        "output_chars": len(out.get("response", "")),
        "peak_vram_mb": max(samples) if samples else None,
    })

    # Free the model so the next pull/load has the full VRAM budget.
    try:
        http_post("/api/generate", {"model": model, "keep_alive": 0}, timeout=30)
    except Exception:
        pass
    subprocess.run(["ollama", "stop", model], capture_output=True, timeout=30)
    return res


def main():
    ensure_ollama()
    base = gpu_info()
    log(f"GPU: {base.get('gpu_name')} ({base.get('vram_total_mb')} MB)")

    results = {"gpu": base, "models": []}
    for m in MODELS:
        r = bench_one(m)
        results["models"].append(r)
        # Emit incrementally so a timeout still gives partial data
        print(json.dumps({"_partial": True, **r}), flush=True)

    print(json.dumps(results), flush=True)


if __name__ == "__main__":
    main()
