#!/usr/bin/env python3
"""Z-Image-Turbo dashboard server.

Loads Z-Image-Turbo once at startup, then serves:
  - GET /            → the HTML dashboard
  - POST /generate   → JSON {prompt, width, height, steps, seed} → PNG bytes
  - GET /health      → readiness check

Listens on 0.0.0.0:8090. Single-file, stdlib-only HTTP server (no FastAPI).
Pipeline calls are serialized with a Lock since one A10G can't run two at once.
"""
import argparse
import io
import json
import logging
import sys
import threading
import time
import traceback
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

import base64
import torch
from PIL import Image
from diffusers import ZImagePipeline, ZImageImg2ImgPipeline


HTML = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Z-Image-Turbo</title>
<style>
:root { color-scheme: dark; }
* { box-sizing: border-box; }
body { font: 14px/1.4 -apple-system, system-ui, "Segoe UI", sans-serif;
       margin: 0; padding: 24px; background: #0e1014; color: #e6e8ec; }
h1 { margin: 0 0 18px; font-size: 18px; font-weight: 600; letter-spacing: -.01em; }
h1 small { color: #8b95a8; font-weight: 400; margin-left: 8px; }
.row { display: flex; gap: 24px; align-items: flex-start; flex-wrap: wrap; }
.col-controls { flex: 0 0 380px; max-width: 380px; }
.col-image { flex: 1 1 540px; min-width: 360px; }
label { display: block; margin: 12px 0 6px; color: #b3bccd; font-size: 12px;
        text-transform: uppercase; letter-spacing: .04em; }
textarea, input, select, button {
  font: inherit; color: inherit; background: #1a1d24; border: 1px solid #2a2f3a;
  border-radius: 6px; padding: 10px 12px; width: 100%; outline: none;
}
textarea { resize: vertical; min-height: 110px; }
textarea:focus, input:focus, select:focus { border-color: #4f6cff; }
.grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
button#gen {
  margin-top: 18px; background: #4f6cff; border-color: #4f6cff;
  color: #fff; font-weight: 600; cursor: pointer; padding: 12px;
}
button#gen:hover:not(:disabled) { background: #5a78ff; }
button#gen:disabled { opacity: .5; cursor: progress; }
.status { margin-top: 12px; font-size: 12px; color: #8b95a8; min-height: 16px; }
.status.err { color: #ff6b6b; }
.image-frame {
  background: #1a1d24; border: 1px solid #2a2f3a; border-radius: 6px;
  padding: 16px; min-height: 540px; display: flex; align-items: center;
  justify-content: center; position: relative;
}
.image-frame img { max-width: 100%; max-height: 800px; border-radius: 4px;
                   display: block; }
.image-frame .placeholder { color: #5d6678; font-size: 13px; text-align: center; }
.spinner {
  width: 28px; height: 28px; border: 3px solid #2a2f3a; border-top-color: #4f6cff;
  border-radius: 50%; animation: s 1s linear infinite;
}
@keyframes s { to { transform: rotate(360deg); } }
.meta { display: flex; gap: 14px; flex-wrap: wrap; margin-top: 12px;
        font-size: 12px; color: #8b95a8; }
.meta b { color: #cfd5e1; font-weight: 600; }
</style>
</head>
<body>
<h1>Z-Image-Turbo <small>Tongyi-MAI · 9-step distill · A10G</small></h1>

<div class="row">
  <div class="col-controls">
    <label for="prompt">Prompt</label>
    <textarea id="prompt" placeholder="describe the image..."></textarea>

    <div class="grid">
      <div>
        <label for="width">Width</label>
        <select id="width">
          <option>512</option>
          <option selected>1024</option>
          <option>1280</option>
        </select>
      </div>
      <div>
        <label for="height">Height</label>
        <select id="height">
          <option>512</option>
          <option selected>1024</option>
          <option>1280</option>
        </select>
      </div>
      <div>
        <label for="steps">Steps</label>
        <input id="steps" type="number" min="4" max="40" value="9">
      </div>
      <div>
        <label for="seed">Seed (blank = random)</label>
        <input id="seed" type="text" placeholder="42">
      </div>
    </div>

    <button id="gen">Generate</button>
    <div id="status" class="status"></div>
    <div class="meta" id="meta"></div>
  </div>

  <div class="col-image">
    <div class="image-frame" id="frame">
      <div class="placeholder">image will appear here</div>
    </div>
  </div>
</div>

<script>
const $ = id => document.getElementById(id);
const btn = $("gen"), status = $("status"), frame = $("frame"), meta = $("meta");

function setStatus(msg, err = false) {
  status.textContent = msg;
  status.classList.toggle("err", err);
}

btn.addEventListener("click", async () => {
  const prompt = $("prompt").value.trim();
  if (!prompt) { setStatus("enter a prompt", true); return; }

  const body = {
    prompt,
    width: parseInt($("width").value, 10),
    height: parseInt($("height").value, 10),
    steps: parseInt($("steps").value, 10),
  };
  const seed = $("seed").value.trim();
  if (seed) body.seed = parseInt(seed, 10);

  btn.disabled = true;
  meta.innerHTML = "";
  frame.innerHTML = '<div class="spinner"></div>';
  setStatus("generating...");
  const t0 = performance.now();

  try {
    const r = await fetch("/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!r.ok) {
      const err = await r.text();
      throw new Error(`HTTP ${r.status}: ${err}`);
    }
    const t = ((performance.now() - t0) / 1000).toFixed(1);
    const usedSeed = r.headers.get("X-Seed") || "?";
    const blob = await r.blob();
    const url = URL.createObjectURL(blob);

    frame.innerHTML = "";
    const img = document.createElement("img");
    img.src = url;
    frame.appendChild(img);

    setStatus(`done in ${t}s`);
    meta.innerHTML = `
      <span><b>${body.width}×${body.height}</b></span>
      <span><b>${body.steps}</b> steps</span>
      <span>seed <b>${usedSeed}</b></span>
      <span><a href="${url}" download="zimage.png" style="color:#4f6cff">download</a></span>
    `;
  } catch (e) {
    frame.innerHTML = '<div class="placeholder">generation failed</div>';
    setStatus(e.message, true);
  } finally {
    btn.disabled = false;
  }
});

$("prompt").addEventListener("keydown", e => {
  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) btn.click();
});
</script>
</body>
</html>
""".encode("utf-8")


PIPE = None        # ZImagePipeline (text -> image)
PIPE_I2I = None    # ZImageImg2ImgPipeline (image+text -> image), shares components
PIPE_LOCK = threading.Lock()
LOAD_DONE = threading.Event()


def load_pipeline():
    global PIPE, PIPE_I2I
    print("loading Z-Image-Turbo...", flush=True)
    t0 = time.time()
    pipe = ZImagePipeline.from_pretrained(
        "Tongyi-MAI/Z-Image-Turbo",
        torch_dtype=torch.bfloat16,
        low_cpu_mem_usage=False,
    ).to("cuda")
    print(f"loaded in {time.time() - t0:.1f}s, warming up text-to-image...", flush=True)
    _ = pipe(
        prompt="warmup",
        height=512, width=512,
        num_inference_steps=9, guidance_scale=0.0,
        generator=torch.Generator("cuda").manual_seed(0),
    ).images[0]
    print("warming up img2img...", flush=True)
    pipe_i2i = ZImageImg2ImgPipeline(**pipe.components)
    _ = pipe_i2i(
        prompt="warmup",
        image=Image.new("RGB", (512, 512), (200, 200, 200)),
        strength=0.6,
        num_inference_steps=9, guidance_scale=0.0,
        generator=torch.Generator("cuda").manual_seed(0),
    ).images[0]
    PIPE = pipe
    PIPE_I2I = pipe_i2i
    LOAD_DONE.set()
    print("ready.", flush=True)


def generate(prompt: str, width: int, height: int, steps: int, seed: int):
    g = torch.Generator("cuda").manual_seed(seed)
    img = PIPE(
        prompt=prompt,
        width=width, height=height,
        num_inference_steps=steps, guidance_scale=0.0,
        generator=g,
    ).images[0]
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


def edit(prompt: str, image_b64: str, strength: float, steps: int, seed: int,
         max_side: int = 1024):
    raw = base64.b64decode(image_b64)
    img = Image.open(io.BytesIO(raw)).convert("RGB")
    # Cap longest side to keep VRAM happy + match the model's training distribution
    w, h = img.size
    scale = max_side / max(w, h)
    if scale < 1.0:
        img = img.resize((int(w * scale), int(h * scale)), Image.LANCZOS)
    # Z-Image expects multiples of 16 for height/width
    w, h = img.size
    w16 = (w // 16) * 16
    h16 = (h // 16) * 16
    if (w16, h16) != (w, h):
        img = img.resize((w16, h16), Image.LANCZOS)
    g = torch.Generator("cuda").manual_seed(seed)
    out = PIPE_I2I(
        prompt=prompt,
        image=img,
        strength=max(0.05, min(1.0, float(strength))),
        num_inference_steps=steps, guidance_scale=0.0,
        generator=g,
    ).images[0]
    buf = io.BytesIO()
    out.save(buf, format="PNG")
    return buf.getvalue(), out.size


class Handler(BaseHTTPRequestHandler):
    def log_message(self, fmt, *args):
        sys.stderr.write(f"[{self.address_string()}] {fmt % args}\n")

    def _send_bytes(self, status, content_type, body, extra_headers=None):
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        for k, v in (extra_headers or {}).items():
            self.send_header(k, v)
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        if self.path in ("/", "/index.html"):
            self._send_bytes(200, "text/html; charset=utf-8", HTML)
            return
        if self.path == "/health":
            ready = LOAD_DONE.is_set()
            self._send_bytes(
                200 if ready else 503,
                "application/json",
                json.dumps({"ready": ready}).encode(),
            )
            return
        self._send_bytes(404, "text/plain", b"not found")

    def do_POST(self):
        if self.path not in ("/generate", "/edit"):
            self._send_bytes(404, "text/plain", b"not found")
            return
        if not LOAD_DONE.is_set():
            self._send_bytes(503, "text/plain", b"model still loading")
            return

        n = int(self.headers.get("Content-Length", "0"))
        # /edit needs room for a base64-encoded image; /generate stays small
        max_body = 32_000_000 if self.path == "/edit" else 64_000
        if n <= 0 or n > max_body:
            self._send_bytes(400, "text/plain", b"missing/oversize body")
            return
        try:
            body = json.loads(self.rfile.read(n))
        except Exception:
            self._send_bytes(400, "text/plain", b"invalid JSON")
            return

        prompt = (body.get("prompt") or "").strip()
        if not prompt:
            self._send_bytes(400, "text/plain", b"missing prompt")
            return
        steps = max(4, min(40, int(body.get("steps", 9))))
        seed = body.get("seed")
        seed = int(time.time() * 1000) & 0x7fffffff if seed is None else int(seed)

        if self.path == "/generate":
            width = max(256, min(1536, int(body.get("width", 1024))))
            height = max(256, min(1536, int(body.get("height", 1024))))
            try:
                with PIPE_LOCK:
                    t0 = time.time()
                    png = generate(prompt, width, height, steps, seed)
                    wall = time.time() - t0
            except Exception:
                tb = traceback.format_exc()
                print(tb, flush=True)
                self._send_bytes(500, "text/plain", tb.encode()[-2000:])
                return
            print(f"gen: {wall:.2f}s  {width}x{height} steps={steps} seed={seed}  '{prompt[:60]}'",
                  flush=True)
            self._send_bytes(200, "image/png", png, extra_headers={
                "X-Seed": str(seed),
                "X-Wall-Seconds": f"{wall:.2f}",
                "X-Mode": "generate",
            })
            return

        # /edit: image + prompt -> image
        image_b64 = body.get("image") or ""
        if not image_b64:
            self._send_bytes(400, "text/plain", b"missing image (base64)")
            return
        # Strip data URL prefix if present
        if image_b64.startswith("data:"):
            image_b64 = image_b64.split(",", 1)[-1]
        strength = float(body.get("strength", 0.6))
        max_side = max(256, min(1536, int(body.get("max_side", 1024))))
        try:
            with PIPE_LOCK:
                t0 = time.time()
                png, out_size = edit(prompt, image_b64, strength, steps, seed, max_side)
                wall = time.time() - t0
        except Exception:
            tb = traceback.format_exc()
            print(tb, flush=True)
            self._send_bytes(500, "text/plain", tb.encode()[-2000:])
            return
        ow, oh = out_size
        print(f"edit: {wall:.2f}s  {ow}x{oh} strength={strength} steps={steps} seed={seed}  '{prompt[:60]}'",
              flush=True)
        self._send_bytes(200, "image/png", png, extra_headers={
            "X-Seed": str(seed),
            "X-Wall-Seconds": f"{wall:.2f}",
            "X-Mode": "edit",
            "X-Strength": str(strength),
            "X-Out-Size": f"{ow}x{oh}",
        })


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--host", default="0.0.0.0")
    ap.add_argument("--port", type=int, default=8090)
    args = ap.parse_args()

    threading.Thread(target=load_pipeline, daemon=True).start()
    print(f"http://{args.host}:{args.port}/  (model loads in background)", flush=True)
    ThreadingHTTPServer((args.host, args.port), Handler).serve_forever()


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    main()
