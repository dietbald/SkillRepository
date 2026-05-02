# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## ⭐ MISSION (set 2026-04-27 — overrides all other goals)

**Goal:** Find a Gemma 4 family model running on AWS on-demand/spot GPU that satisfies ALL of:
1. **Responsive** (decode tok/s acceptable for interactive use)
2. **Multimodal** — handles text AND images
3. **Tool-use** — works with OpenCode (clean OpenAI tool_calls, no repetition loops, no markdown-instead-of-tool fallback)
4. **Uncensored** — refuses no probe prompts (profanity, harm-reduction, dark fiction, controversial opinion, sensual content)

**Hardware constraints (current AWS quotas):**
- Region: ap-southeast-2 (Sydney) only — quota=0 elsewhere; Singapore has only g4dn (T4 16GB, too small)
- Instance types available: g5.xlarge / g5.2xlarge / g6.xlarge / g6.2xlarge (all 1× 24 GB VRAM — A10G or L4)
- 8 vCPU bucket limit (one g5.2xlarge OR one g5.xlarge + g6.xlarge concurrent)
- Capacity in Sydney is intermittent — see `freemodel` script's auto-fallback chain

**Method:**
1. Deep web research (current 2025-2026 data, not training-data assumptions) to find Gemma 4 fine-tunes/abliterations that satisfy the four criteria. Verify each candidate has `mmproj.gguf` for vision, was tested with agents (opencode/aider/cline), and has refusal removal verified.
2. Pull each candidate onto the live `freemodel` instance via `ollama pull`.
3. Real test matrix per candidate:
   - Chat baseline (sanity, decode tok/s)
   - Direct tool-call test via raw `/v1/chat/completions` (proves model CAN emit tool_calls)
   - OpenCode scaffold test in `/tmp/opencode-test` — verify files actually get created (the bar Trevor + huihui Gemma 4 26B both failed)
   - Image test — pass a real image, ask the model to describe it
   - 5-prompt uncensored probe (the set in `bench/run-trevor-uncensored.sh`)
4. Pivot to non-Gemma family if no Gemma 4 variant satisfies the four criteria — with explicit user heads-up that Gemma 4 family appears to be a poor fit for OpenCode tool-use.

**What's KNOWN to fail:**
- `TrevorJS/gemma-4-26B-A4B-it-uncensored` — repetition loops in opencode tool-loop (no mmproj either)
- `huihui_ai/gemma-4-abliterated:26b-q4_K` — does NOT emit tool_calls under opencode's "build" agent prompt; falls back to markdown descriptions ("I would execute the following: `write(...)`"). Direct curl tool-call works fine in isolation. Vision works.
- `DavidAU/gemma-4-31B-...HERETIC-Thinking` family — Thinking variant baked-in CoT trace causes opencode loops

**Live instance:** `i-0fdfd74bb3022c616 @ 13.210.247.100` (g5.2xlarge), SSH tunnel to `localhost:11434` is active in tmux session `freemodel-tunnel`. Both `trevor-26b-a4b-q4km` and `huihui_ai/gemma-4-abliterated:26b-q4_K` are pulled. OpenCode config at `~/.config/opencode/opencode.json` exposes the `freemodel/...` provider.

**Ignore:** all other tasks until this mission completes or is explicitly cancelled.

---


## What this is

`gpu-runner` is a bash CLI (`gpu-task`) that runs heavy local jobs (Whisper transcription, Tesseract OCR, ffmpeg, arbitrary commands) on a temporary AWS EC2 instance in `ap-southeast-1`. There is no build system, no tests, no language toolchain — every change is a shell-script edit.

Configuration lives in `config.env` and is sourced by every script. The key knobs: `INSTANCE_TYPE`, `SPOT_MAX_PRICE`, `BASE_AMI` (plain Ubuntu), `GPU_AMI` (pre-baked AMI with whisper/tesseract/ffmpeg installed — built by `gpu-task setup-ami`). `KEY_PATH=~/.ssh/gpu-runner.pem` and `SECURITY_GROUP` must already exist in the AWS account.

## Common operations

```bash
./gpu-task status             # show warm instance + queue state, list all gpu-runner instances
./gpu-task list               # list tagged instances only
./gpu-task whisper foo.mp3    # default: submit to warm instance (auto-starts if cold)
./gpu-task whisper foo.mp3 --oneoff   # launch fresh instance, run, terminate
./gpu-task batch tesseract *.pdf      # disables idle timer, processes all on one instance
./gpu-task keepwarm 600       # explicitly start warm instance with 600s idle timeout
./gpu-task setup-ami          # rebake GPU_AMI (~10 min); writes new ID into config.env via sed
./gpu-task kill <instance-id> # terminate + clear /tmp/gpu-runner-instance.state
```

When iterating on remote-side code (`tasks/*.sh`, `lib/queue-server.sh`), changes only take effect on a *fresh* instance OR after re-uploading. `lib/queue-server.sh` is `scp`'d up by `ensure_warm()`/`keepwarm` once and runs in a tmux session named `queue` — to pick up edits, kill the warm instance (`gpu-task kill`) so the next job re-uploads it. `tasks/whisper.sh` and `tasks/tesseract.sh` are streamed via `ssh ... bash -s < tasks/foo.sh` only in `--oneoff` and `batch` paths; the warm-mode queue server has its *own* inline implementations of these tasks (in `lib/queue-server.sh`), so changing `tasks/whisper.sh` does **not** affect warm-mode runs.

## Architecture

Two execution modes, selected by the absence/presence of `--oneoff`:

**Warm mode (default).** `ensure_warm()` in `gpu-task` checks `/tmp/gpu-runner-instance.state` (written as `INSTANCE_ID=...`/`PUBLIC_IP=...`), verifies the instance is still `running` and SSH-reachable, and if not, calls `lib/launch.sh` (which falls back from spot → on-demand on failure) and uploads `lib/queue-server.sh` into a tmux session. Jobs are submitted via `lib/queue-client.sh`, which `scp`s the input file to `~/input_<job_id>/` on the remote and writes a `~/queue/<job_id>.job` spec file. The remote `queue-server.sh` polls `~/queue/*.job` every 3s, dispatches by `TASK_TYPE`, and `mv`s the spec to `~/done/<job_id>.done` when finished. `lib/queue-wait.sh` polls for the `.done` file (5s × 120 attempts = 10 min cap), then `scp -r` downloads `~/output/<job_id>/` to the local `--output` dir. After `IDLE_TIMEOUT` (default 300s) of no jobs, `queue-server.sh` calls `sudo shutdown -h now` — the instance terminates itself; subsequent jobs trigger a fresh `ensure_warm()`.

**One-off mode (`--oneoff`).** `launch_instance` → `upload_inputs` (rsync for >10 files, scp otherwise) → stream the matching `tasks/<name>.sh` over SSH → `download_outputs` → `terminate_instance`. No queue, no state file written.

**Batch mode (`gpu-task batch <task> <files...>`).** Always behaves like one-off but explicitly `pkill`s any queue-server and cancels the `shutdown` so the instance won't auto-terminate mid-run. For `batch whisper`, the python loop is inlined in `gpu-task` itself (not in `tasks/whisper.sh`).

**Cost discipline.** Multiple things will terminate or shutdown an instance: explicit `kill`, `terminate_instance` after one-off/batch, `queue-server.sh` idle timeout, manual `sudo shutdown` over SSH. Always assume a stranded instance is possible after a script crash — `gpu-task list` (filters on `Tag:ManagedBy=gpu-task`) is the source of truth, and `/tmp/gpu-runner-instance.state` can drift out of sync with reality. The `status` command reconciles by re-querying AWS and clearing stale state.

**AMI lifecycle.** `setup-ami` boots an on-demand instance from `BASE_AMI`, installs the toolchain, calls `aws ec2 create-image --no-reboot`, polls every 15s for `available`, then rewrites `GPU_AMI=...` in `config.env` via `sed -i`. `lib/launch.sh` always prefers `GPU_AMI` if set, falling back to `BASE_AMI`. `install_tools_if_needed()` only runs if `GPU_AMI` is empty — so after a successful `setup-ami` run, cold-start time drops from ~5min to ~90s.

## Sibling tool: `freemodel`

A standalone script (`/home/tj/gpu-runner/freemodel`, with skill doc at `~/.claude/skills/freemodel.md`) — **not** a `gpu-task` subcommand and intentionally separate so it can't conflict with the queue/state of the warm-mode instance. Launches a g5.xlarge from `CHAT_AMI` (a separate AMI containing only the `trevor-26b-a4b-q4km` ollama model — TrevorJS/gemma-4-26B-A4B-it-uncensored Q4_K_M, 16.8 GB), waits for SSH + ollama API, pre-warms the model onto the GPU, then `exec ssh -t … ollama run`.

**Three-state lifecycle** (none / stopped / running) with cost discipline baked in:
- `freemodel` is smart-resume: if running, reuse; if stopped, `start-instances` (~60s warm); if no instance, fresh launch from `CHAT_AMI` (~5–8 min cold due to EBS lazy hydration of the 17 GB model file).
- `freemodel --pause` calls `stop-instances` — keeps EBS at ~$13/mo idle but allows ~60s warm restart.
- `freemodel --kill` terminates fully — drops EBS, leaves only the snapshot at ~$3.50/mo.
- After resume, **public IP changes** (no EIP) — script handles via `refresh_ip()` which rewrites `/tmp/freemodel.state`.

State file `/tmp/freemodel.state` (separate from `/tmp/gpu-runner-instance.state`) survives stop/start cycles; only `--kill` removes it. Subcommands also include `--no-attach`, `--status`, `--type <type>`. Auto-fallback through candidate instance types (g5.xlarge → g5.2xlarge → g6.* → g4dn.*) on `InsufficientCapacity` / `VcpuLimitExceeded`.

The model has very verbose baked-in chain-of-thought (`Thinking… …done thinking.`) — visible in CLI stdout but stripped from `/api/generate` response field.

**AMI bake.** `bench/bake-freemodel-ami.sh` is the canonical bake — uses `BASE_AMI` (plain DLAMI, not `GPU_AMI`) so the resulting image excludes Whisper/torch/ffmpeg/tesseract bloat. Final image ~70 GB on a 100 GB volume (DLAMI base alone is ~51 GB; ollama + Trevor model adds ~19 GB). Older `bench/bake-trevor-ami.sh` baked from `GPU_AMI` onto a 300 GB volume (heavier; superseded). The script writes `CHAT_AMI=ami-xxx` to `config.env` on success and runs `fstrim` before snapshot to drop unused blocks. Old AMIs aren't auto-deregistered — they keep billing snapshot storage until manually cleaned with `aws ec2 deregister-image` + `aws ec2 delete-snapshot`.
