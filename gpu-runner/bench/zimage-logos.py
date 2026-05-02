#!/usr/bin/env python3
"""Generate 10 logo prompts on Z-Image-Turbo and time each one.

Runs on the freemodel EC2 instance. Saves PNGs to ~/zimage-logos/ and writes a
results JSON with per-image timing + GPU VRAM usage.
"""
import json
import os
import subprocess
import time
from pathlib import Path

import torch
from diffusers import ZImagePipeline


PROMPTS = [
    ("01-tech-startup",  "Minimalist tech startup logo, abstract geometric mark, clean blue-and-white sans-serif typography, white background"),
    ("02-coffee-shop",   "Vintage coffee shop logo, warm browns and cream, hand-drawn coffee bean, retro serif typography, badge style"),
    ("03-fitness-brand", "Bold fitness brand logo, dynamic red and black, abstract athletic figure in motion, modern bold sans-serif"),
    ("04-eco-product",   "Eco-friendly product logo, soft greens, stylized leaf merging into letter, minimalist, calm and natural feel"),
    ("05-music-app",     "Music streaming app logo, gradient purple to magenta, abstract sound-wave motif, glossy modern flat design"),
    ("06-restaurant",    "Elegant fine-dining restaurant logo, gold script wordmark on deep navy, refined and luxurious"),
    ("07-photo-studio",  "Photography studio logo, monochrome black-and-white, minimal camera aperture icon, thin sans-serif wordmark"),
    ("08-kids-toys",     "Children toy brand logo, bright primary colors, bouncy rounded letterforms, playful star and balloon accents"),
    ("09-law-firm",      "Classic law firm logo, navy blue and gold, elegant serif wordmark, subtle scales-of-justice mark, traditional"),
    ("10-gaming-brand",  "Futuristic gaming brand logo, neon cyan and magenta on black, geometric angular mark, cyberpunk vibe"),
]

OUT_DIR = Path.home() / "zimage-logos"
OUT_DIR.mkdir(exist_ok=True)


def gpu_mem_used_mib():
    try:
        out = subprocess.check_output(
            ["nvidia-smi", "--query-gpu=memory.used", "--format=csv,noheader,nounits"],
            text=True,
        )
        return int(out.strip().splitlines()[0])
    except Exception:
        return None


def main():
    print("loading Z-Image-Turbo...", flush=True)
    t_load = time.time()
    pipe = ZImagePipeline.from_pretrained(
        "Tongyi-MAI/Z-Image-Turbo",
        torch_dtype=torch.bfloat16,
        low_cpu_mem_usage=False,
    ).to("cuda")
    load_secs = time.time() - t_load
    print(f"loaded in {load_secs:.1f}s, VRAM used: {gpu_mem_used_mib()} MiB", flush=True)

    # warmup so the first timed run is a fair number
    print("warming up...", flush=True)
    _ = pipe(
        prompt="warmup",
        height=512, width=512,
        num_inference_steps=9, guidance_scale=0.0,
        generator=torch.Generator("cuda").manual_seed(0),
    ).images[0]

    results = {
        "model": "Tongyi-MAI/Z-Image-Turbo",
        "load_seconds": round(load_secs, 2),
        "load_vram_mib": gpu_mem_used_mib(),
        "settings": {"size": 1024, "steps": 9, "guidance": 0.0, "dtype": "bfloat16"},
        "logos": [],
    }

    for slug, prompt in PROMPTS:
        t0 = time.time()
        img = pipe(
            prompt=prompt,
            height=1024, width=1024,
            num_inference_steps=9, guidance_scale=0.0,
            generator=torch.Generator("cuda").manual_seed(42),
        ).images[0]
        wall = time.time() - t0
        path = OUT_DIR / f"{slug}.png"
        img.save(path)
        vram = gpu_mem_used_mib()
        print(f"{slug}: {wall:.2f}s  VRAM={vram} MiB  -> {path.name}", flush=True)
        results["logos"].append({
            "slug": slug,
            "prompt": prompt,
            "wall_seconds": round(wall, 2),
            "vram_mib": vram,
            "path": str(path),
        })

    waits = [r["wall_seconds"] for r in results["logos"]]
    results["summary"] = {
        "n": len(waits),
        "min_s": min(waits), "max_s": max(waits),
        "avg_s": round(sum(waits) / len(waits), 2),
        "total_s": round(sum(waits), 2),
    }

    json_path = OUT_DIR / "results.json"
    json_path.write_text(json.dumps(results, indent=2))
    print(f"\nwrote {json_path}\n")
    print(json.dumps(results["summary"], indent=2))


if __name__ == "__main__":
    main()
