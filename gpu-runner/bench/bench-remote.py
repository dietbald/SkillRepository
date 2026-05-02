#!/usr/bin/env python3
"""Runs on the GPU instance. Loads Whisper, transcribes the given audio file,
emits a single JSON line on stdout describing what happened.

For each model size we measure:
  - cold_seconds: first call (includes model download from cache miss + load + first inference)
  - warm_seconds: second call (model already in RAM; pure inference)

Stderr gets all the chatter; stdout is reserved for the final JSON line so the
local harness can parse it.
"""
import json
import os
import subprocess
import sys
import time

audio_path = sys.argv[1]
result = {}


def log(msg):
    print(msg, file=sys.stderr, flush=True)


# GPU info via nvidia-smi (don't fail if it's a CPU box)
try:
    out = subprocess.run(
        ["nvidia-smi", "--query-gpu=name,memory.total,driver_version", "--format=csv,noheader"],
        capture_output=True, text=True, check=True, timeout=10,
    )
    name, mem, drv = [x.strip() for x in out.stdout.strip().split(",")]
    result["gpu_name"] = name
    result["vram_mb"] = int(mem.split()[0])
    result["driver"] = drv
except Exception as e:
    result["gpu_name"] = None
    result["vram_mb"] = 0
    result["nvidia_smi_error"] = str(e)

import torch  # noqa: E402

result["torch"] = torch.__version__
result["cuda_available"] = torch.cuda.is_available()
result["cuda_version"] = torch.version.cuda

import whisper  # noqa: E402

audio = whisper.load_audio(audio_path)
result["audio_seconds"] = round(len(audio) / whisper.audio.SAMPLE_RATE, 2)

device = "cuda" if torch.cuda.is_available() else "cpu"
use_fp16 = torch.cuda.is_available()


def run_model(size: str) -> dict:
    sub = {}
    log(f"[{size}] cold load + transcribe...")
    t0 = time.time()
    model = whisper.load_model(size, device=device)
    sub["model_load_seconds"] = round(time.time() - t0, 2)

    t0 = time.time()
    out = model.transcribe(audio_path, language="en", fp16=use_fp16, verbose=False, temperature=0)
    sub["cold_transcribe_seconds"] = round(time.time() - t0, 2)
    sub["text_chars"] = len(out["text"].strip())

    log(f"[{size}] warm transcribe...")
    t0 = time.time()
    out2 = model.transcribe(audio_path, language="en", fp16=use_fp16, verbose=False)
    sub["warm_transcribe_seconds"] = round(time.time() - t0, 2)

    if torch.cuda.is_available():
        sub["peak_vram_mb"] = int(torch.cuda.max_memory_allocated() / 1024 / 1024)
        torch.cuda.reset_peak_memory_stats()

    del model
    if torch.cuda.is_available():
        torch.cuda.empty_cache()
    return sub


for size in ("medium", "large"):
    try:
        result[f"whisper_{size}"] = run_model(size)
    except Exception as e:
        result[f"whisper_{size}"] = {"error": str(e)[:300]}

print(json.dumps(result))
