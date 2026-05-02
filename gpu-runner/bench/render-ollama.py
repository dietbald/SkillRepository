#!/usr/bin/env python3
"""Read bench/ollama-results.jsonl, print markdown comparison tables grouped by
model. Per-instance pricing is on-demand, ap-southeast-2."""
import json
import sys
from pathlib import Path

# On-demand $/hr in ap-southeast-2
PRICE_PER_HR = {
    "g4dn.xlarge":  0.736,
    "g4dn.2xlarge": 1.052,
    "g5.xlarge":    1.408,
    "g5.2xlarge":   1.696,
    "g6.xlarge":    1.127,
    "g6.2xlarge":   1.361,
}

path = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(__file__).parent / "ollama-results.jsonl"
rows = [json.loads(l) for l in path.read_text().splitlines() if l.strip()]
# Latest result per instance type wins
by_type = {}
for r in rows:
    by_type[r["instance_type"]] = r
rows = list(by_type.values())

# Detect models present across runs
all_models = []
seen = set()
for r in rows:
    for m in r.get("models", []):
        if m["model"] not in seen:
            seen.add(m["model"])
            all_models.append(m["model"])

def get_model(r, model_name):
    for m in r.get("models", []):
        if m["model"] == model_name:
            return m
    return None

print("# Ollama LLM benchmark — Sydney, prompt=1k tokens, decode=256 tokens\n")

print("## GPU stack\n")
print("| Instance | GPU | VRAM | $/hr |")
print("|---|---|---|---|")
for r in sorted(rows, key=lambda r: r["instance_type"]):
    gpu = r.get("gpu", {})
    p = PRICE_PER_HR.get(r["instance_type"], 0)
    print(f"| {r['instance_type']} | {gpu.get('gpu_name','-')} | {gpu.get('vram_total_mb','-')} MB | ${p:.3f} |")

for model in all_models:
    print(f"\n## `{model}`\n")
    print("| Instance | GPU | TTFT (ms) | Decode (tok/s) | Peak VRAM (MB) | Cost / 256-tok run |")
    print("|---|---|---|---|---|---|")
    for r in sorted(rows, key=lambda r: r["instance_type"]):
        m = get_model(r, model)
        gpu_short = (r.get("gpu", {}).get("gpu_name") or "?").replace("NVIDIA ", "").replace("Tesla ", "")
        if m is None:
            print(f"| {r['instance_type']} | {gpu_short} | — | — | — | — |")
            continue
        if "error" in m:
            print(f"| {r['instance_type']} | {gpu_short} | ❌ {m['error'][:50]} | | | |")
            continue
        ttft = m.get("ttft_ms", "-")
        eval_rate = m.get("eval_rate", "-")
        vram = m.get("peak_vram_mb", "-")
        # Cost per run = $/hr × wall-time / 3600. Use total_duration_ms.
        td_ms = m.get("total_duration_ms", 0) or 0
        price = PRICE_PER_HR.get(r["instance_type"], 0)
        cost = price * (td_ms / 1000) / 3600 if td_ms else None
        cost_s = f"${cost:.5f}" if cost else "—"
        print(f"| {r['instance_type']} | {gpu_short} | {ttft} | {eval_rate} | {vram} | {cost_s} |")

print("\n---")
print("\n**TTFT** = time to first token (model load + prompt eval). On a hot instance, the load is amortized; second prompt's TTFT ≈ prompt-eval-only.")
print("\n**Decode rate** = tokens/sec sustained during generation. Higher is better.")
print("\n**Cost per 256-token run** is just the wall time of one query × $/hr. Doesn't include boot or idle.")
