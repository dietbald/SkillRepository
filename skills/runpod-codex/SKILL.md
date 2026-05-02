---
name: runpod-codex
description: Manage the RunPod pod that hosts our local Codex CLI's model. Use when the user asks to start/stop/kill/check status of the codex pod, run codex against it, set up auto-pause for cost control, or asks "is the pod up", "spin up the model", "shut it down", etc. Backed by `runpod-codex` script + a persistent network volume so the model survives pause/resume.
---

# runpod-codex skill

A small CLI (`runpod-codex`, on PATH via `~/bin/runpod-codex` → `/home/tj/gpu-runner/runpod-codex`) for spinning a RunPod H100 pod up and down on demand. Codex CLI then talks to the pod via a local SSH tunnel.

## When to use

- User asks anything about "the codex pod", "the gemma pod", "our model", "the tunnel" — this is the right tool.
- User asks to **start / stop / pause / kill / status** of pod → run the matching subcommand.
- User asks to **run codex** locally against the model → `runpod-codex codex …` (it auto-ensures tunnel + correct flags).
- User asks to **auto-pause when idle** → `runpod-codex idle-watch`.
- User wants to **delete everything to stop billing** → `runpod-codex kill --all` (drops pod *and* the network volume).

## Architecture

- **Persistent network volume** `1dm5z3ou1t` (30 GB, `AP-JP-1`, ~$2.10/mo) — holds the Ollama binary at `/workspace/ollama-bin/` and model weights at `/workspace/ollama-data/models/`. Survives pod stop/kill.
- **Pod** (ephemeral container, `runpod/pytorch:2.4.0…ubuntu22.04` + H100 80GB) — bootstrap script symlinks the volume's ollama binary into `/usr/local/bin/` and starts `ollama serve` as a `setsid` daemon (with `OLLAMA_CONTEXT_LENGTH=32768`).
- **SSH tunnel** in tmux `ollama-tunnel` mapping `127.0.0.1:11435` → pod's port 11434.
- **Auto-resume proxy** (`runpod-codex-proxy.py`) in tmux `codex-proxy`, listens on `127.0.0.1:11434`, forwards to the SSH tunnel on 11435. **Persists across pod stop/start.** When the upstream is unreachable on a new request, it transparently runs `runpod-codex start` (~25-45s) and then forwards. This makes auto-pause invisible to the user — codex's next prompt after a pause just takes ~25s longer.
- **Idle-watch** in tmux `codex-idle` polls `127.0.0.1:11435/api/ps` (the SSH tunnel, NOT the proxy — so the watcher's own polls don't trigger auto-resume). After 5 min of no models loaded, it stops the pod. **Auto-started by `runpod-codex start`** unless `RUNPOD_CODEX_NO_IDLE_WATCH=1`.
- **State file** `~/.runpod-codex.state` holds `POD_ID`, `IP`, `SSH_PORT` between invocations.
- **Codex** is configured (in `~/.codex/config.toml`) with `model = "juilpark/gemma-4-31B-it-uncensored-heretic:q4_k_m"` and `oss_provider = "ollama"`. The script invokes `codex --oss --dangerously-bypass-approvals-and-sandbox -m "$MODEL"`. Codex hits `localhost:11434` (the proxy), so cold-resume after idle-pause is transparent.

### Why the timer can take ~10 min total before pause
Idle-watch resets when Ollama has any model loaded into the GPU. Ollama unloads models 5 min after the last request. Then the watch needs another 5 min of "no models loaded" before pausing. So:
- Active inference → timer reset every poll
- Last request → 5 min Ollama keep-alive → 5 min watcher window → pod stops
- Pod stops, but **proxy stays alive** to auto-resume on next prompt

## Subcommands

```text
runpod-codex start          # ensure pod RUNNING + tunnel + proxy + idle-watch
runpod-codex stop           # stop pod (proxy stays alive — next prompt auto-resumes)
runpod-codex kill            # delete pod + tunnel + proxy (volume kept)
runpod-codex kill --all      # delete pod AND volume (full teardown, no monthly disk fee)
runpod-codex status          # pod state, proxy, tunnel, idle-watch, balance
runpod-codex tunnel          # (re)establish SSH tunnel only
runpod-codex idle-watch      # background daemon: stop pod after IDLE_MIN min idle
runpod-codex idle-watch-stop # stop the daemon
runpod-codex codex [args]    # run codex (auto-resumes pod via proxy if paused)
runpod-codex logs <ollama|pull|idle|proxy>
```

`stop` vs `kill`:
- **stop** = pod stays in inventory; can be resumed; you keep paying for the container disk (~$0.20/day for 20GB) AND volume (~$0.07/day for 30GB).
- **kill** = pod is gone, but the volume's ollama+model survive. Next `start` creates a fresh pod attached to the same volume → ~30s bootstrap (no model re-pull).
- **kill --all** = full teardown, no further billing.

For typical "I'm done for the day" → use `stop` (faster resume next session). For "won't use for days" → use `kill` (drops the pod-disk fee). For "won't use indefinitely" → `kill --all`.

## Cost notes

- H100 80GB pod compute: ~$2.99/hr while RUNNING.
- Network volume: ~$0.07/GB/mo → 30GB ≈ **$2.10/mo** while present.
- Stopped pod's container disk: ~$0.20/day → ~$6/mo.
- Idle-watch defaults to 30 min. Override: `RUNPOD_CODEX_IDLE_MIN=15 runpod-codex idle-watch`.

## Configuration env vars

All optional — defaults match the production setup:

```text
RUNPOD_CODEX_MODEL=juilpark/gemma-4-31B-it-uncensored-heretic:q4_k_m
RUNPOD_CODEX_VOLUME=1dm5z3ou1t           # network volume ID in AP-JP-1
RUNPOD_CODEX_DC=AP-JP-1
RUNPOD_CODEX_GPU=["NVIDIA H100 80GB HBM3"]
RUNPOD_CODEX_DISK=20                      # container disk GB (volume is separate, holds ollama + model)
RUNPOD_CODEX_LOCAL_PORT=11434
RUNPOD_CODEX_IDLE_MIN=30
RUNPOD_API_KEY=$(pass show api/runpod-claude)   # auto-resolved if pass entry exists
SSH_KEY=$HOME/.ssh/runpod-claude
```

## Common workflows

**Start working with codex:**
```bash
runpod-codex start          # ~30s if volume is hot, ~5min if model needs to re-pull
runpod-codex idle-watch &   # auto-pause when idle (optional, recommended)
runpod-codex codex 'fix the failing test in src/foo.py'
```

**Done for the day:**
```bash
runpod-codex stop
```

**Clean up entirely:**
```bash
runpod-codex kill --all     # confirms before zero billing
```

**Diagnose a stuck start:**
```bash
runpod-codex logs ollama    # tail ollama serve output on the pod
runpod-codex logs pull      # tail model-pull output
runpod-codex logs idle      # tail local idle-watch log
runpod-codex status         # consolidated state
```

## Important gotchas

- **Pod stop wipes everything outside `/workspace`.** The bootstrap re-installs `tmux` and re-symlinks ollama on every start (handled by `runpod-codex start`). Don't rely on anything in `/root/`, `/usr/local/bin/`, etc., persisting.
- **GPU host capacity:** A "stopped" pod is bound to its physical machine. If that machine has no free H100 when you try to resume, `start` will see the resume fail and fall through to creating a fresh pod attached to the same volume — also fine, just slower (~3 min cold start).
- **Idle-watch checks `/api/ps`.** Ollama unloads models 5 min after the last request; once `models` is empty AND stays empty for `IDLE_MIN` more minutes, the pod is stopped. Tunnel down → API unreachable → looks idle → eventually pauses (intentional, since user can't be using it).
- **Volume only attaches to pods in the same DC** (`AP-JP-1`). If you ever change `RUNPOD_CODEX_DC`, you also need a new volume in that DC.

## Out of scope

- Multi-pod orchestration (one pod at a time per state file).
- Hot model swaps. Setting `RUNPOD_CODEX_MODEL` to a new tag will trigger a pull on next `start`.
