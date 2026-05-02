#!/usr/bin/env python3
"""Read bench/results.jsonl, print a markdown comparison table with
per-instance pricing. Pricing is on-demand, ap-southeast-2, 2026-Q1; if you
care about exact billing pull from the AWS pricing API."""
import json
import sys
from pathlib import Path

# On-demand $/hr in ap-southeast-2 (Sydney). Spot is ~30-50% lower.
PRICE_PER_HR = {
    "g4dn.xlarge":  0.736,
    "g4dn.2xlarge": 1.052,
    "g5.xlarge":    1.408,
    "g5.2xlarge":   1.696,
    "g6.xlarge":    1.127,
    "g6.2xlarge":   1.361,
}

path = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(__file__).parent / "results.jsonl"
rows = [json.loads(l) for l in path.read_text().splitlines() if l.strip()]

def fmt(v, fallback="—"):
    return f"{v}" if v is not None else fallback

def realtime_factor(audio_s, transcribe_s):
    if not audio_s or not transcribe_s:
        return "—"
    return f"{audio_s / transcribe_s:.1f}×"

print()
print("## GPU stack")
print()
print("| Instance | GPU | VRAM | Driver | Torch | CUDA |")
print("|---|---|---|---|---|---|")
for r in rows:
    print(f"| {r.get('instance_type')} | {fmt(r.get('gpu_name'))} | {r.get('vram_mb','—')} MB | "
          f"{fmt(r.get('driver'))} | {fmt(r.get('torch'))} | {fmt(r.get('cuda_version'))} |")

for size in ("medium", "large"):
    print()
    print(f"## Whisper-{size}  (audio = {rows[0].get('audio_seconds','?')}s)")
    print()
    print("| Instance | Boot s | Model load s | Cold transcribe s | Warm transcribe s | Realtime factor (warm) | Peak VRAM | $/hr | Cost per warm run |")
    print("|---|---|---|---|---|---|---|---|---|")
    for r in rows:
        sub = r.get(f"whisper_{size}", {})
        if "error" in sub:
            print(f"| {r['instance_type']} | {r.get('boot_seconds','?')} | ❌ {sub['error'][:60]} | | | | | | |")
            continue
        warm = sub.get("warm_transcribe_seconds")
        rt = realtime_factor(r.get("audio_seconds"), warm)
        price = PRICE_PER_HR.get(r["instance_type"], 0)
        cost_warm = f"${price * (warm or 0) / 3600:.4f}" if warm else "—"
        print(f"| {r['instance_type']} | {r.get('boot_seconds','?')} | "
              f"{sub.get('model_load_seconds','—')} | "
              f"{sub.get('cold_transcribe_seconds','—')} | "
              f"{sub.get('warm_transcribe_seconds','—')} | "
              f"{rt} | "
              f"{sub.get('peak_vram_mb','—')} MB | "
              f"${price:.3f} | {cost_warm} |")

print()
print("Realtime factor = audio_seconds / warm_transcribe_seconds. Higher is better.")
print("Cost per warm run = $/hr × warm_seconds / 3600. Doesn't include boot/idle time.")
