#!/usr/bin/env python3
"""
runpod-codex-proxy: local TCP forwarder that auto-starts the pod on demand.

Listens on 127.0.0.1:$RUNPOD_PROXY_PORT (default 11434) and forwards to
127.0.0.1:$RUNPOD_UPSTREAM_PORT (default 11435), where the SSH tunnel from
runpod-codex puts the pod's Ollama. When upstream is unreachable, runs
`$RUNPOD_CMD start` to bring the pod + tunnel back up, then forwards.

Codex (and anything else hitting localhost:11434) gets transparent auto-start.
"""

import asyncio
import os
import sys
import time

PROXY_PORT = int(os.environ.get("RUNPOD_PROXY_PORT", "11434"))
UPSTREAM_PORT = int(os.environ.get("RUNPOD_UPSTREAM_PORT", "11435"))
RUNPOD_CMD = os.environ.get("RUNPOD_CMD", os.path.expanduser("~/bin/runpod-codex"))
ENSURE_TIMEOUT = float(os.environ.get("RUNPOD_ENSURE_TIMEOUT", "240"))
RECHECK_INTERVAL = float(os.environ.get("RUNPOD_RECHECK_INTERVAL", "30"))

_lock = asyncio.Lock()


def log(msg: str) -> None:
    sys.stderr.write(f"[proxy] {msg}\n")
    sys.stderr.flush()


async def upstream_alive() -> bool:
    try:
        reader, writer = await asyncio.wait_for(
            asyncio.open_connection("127.0.0.1", UPSTREAM_PORT), timeout=2
        )
    except (OSError, asyncio.TimeoutError):
        return False
    writer.close()
    try:
        await writer.wait_closed()
    except Exception:
        pass
    return True


async def ensure_upstream() -> bool:
    """Bring the pod + SSH tunnel up if not reachable. Always probes — no stale cache."""
    async with _lock:
        if await upstream_alive():
            return True
        log("upstream down, running runpod-codex start...")
        proc = await asyncio.create_subprocess_exec(
            RUNPOD_CMD, "start",
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.STDOUT,
        )
        try:
            out_pair = await asyncio.wait_for(proc.communicate(), timeout=ENSURE_TIMEOUT)
            log(f"start returned code={proc.returncode}")
            sys.stderr.write(out_pair[0].decode(errors="replace"))
            sys.stderr.flush()
        except asyncio.TimeoutError:
            proc.kill()
            log(f"start exceeded {ENSURE_TIMEOUT}s; giving up")
            return False
        for _ in range(15):
            if await upstream_alive():
                return True
            await asyncio.sleep(2)
        log("start finished but upstream still unreachable")
        return False


async def pipe(reader: asyncio.StreamReader, writer: asyncio.StreamWriter) -> None:
    try:
        while True:
            data = await reader.read(8192)
            if not data:
                break
            writer.write(data)
            await writer.drain()
    except (BrokenPipeError, ConnectionResetError, asyncio.CancelledError):
        pass
    finally:
        try:
            writer.close()
        except Exception:
            pass


async def handle_client(client_r: asyncio.StreamReader, client_w: asyncio.StreamWriter) -> None:
    peer = client_w.get_extra_info("peername")
    if not await ensure_upstream():
        log(f"refusing client {peer}: upstream unavailable")
        client_w.close()
        return
    try:
        up_r, up_w = await asyncio.open_connection("127.0.0.1", UPSTREAM_PORT)
    except OSError as e:
        log(f"open upstream failed for {peer}: {e}")
        client_w.close()
        return
    await asyncio.gather(
        pipe(client_r, up_w),
        pipe(up_r, client_w),
        return_exceptions=True,
    )


async def main() -> None:
    server = await asyncio.start_server(handle_client, "127.0.0.1", PROXY_PORT)
    log(f"listening on 127.0.0.1:{PROXY_PORT} -> 127.0.0.1:{UPSTREAM_PORT}")
    log(f"runpod-codex cmd: {RUNPOD_CMD}")
    async with server:
        await server.serve_forever()


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        pass
