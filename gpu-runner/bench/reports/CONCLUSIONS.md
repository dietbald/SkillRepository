# Model Evaluation — Conclusions

**Mission (CLAUDE.md, 2026-04-27):** find a single open-weight model on AWS GPU that is responsive + multimodal + clean-tool-call (OpenCode/Codex) + uncensored.

**Hardware constraint:** g5.2xlarge / A10G 24 GB VRAM, ap-southeast-2 (Sydney).

---

## Summary scoreboard

| Model | Family | Quant | T2 chat | T3 raw tool | T4 OpenCode scaffold | T5 vision | T6 uncensored | Mission |
|---|---|---|---|---|---|---|---|---|
| TrevorJS/gemma-4-26B-A4B-it-uncensored | Gemma 4 26B-A4B | Q4_K_M | – | – | **FAIL** (CLAUDE.md prior) | – | – | **FAIL** |
| huihui_ai/gemma-4-abliterated:26b-q4_K | Gemma 4 26B-A4B | Q4_K_M | – | – | **FAIL** (CLAUDE.md prior) | works | – | **FAIL** |
| Jiunsong/supergemma4-26b-abliterated-multimodal | Gemma 4 26B-A4B | Q4_K_M | PASS (78 tok/s) | PASS | **FAIL** (`<\|channel>` leak) | PASS | PASS 5/5 | **FAIL** |
| jenerallee78/gemma-4-26B-A4B-it-ara-abliterated (prutser ARA) | Gemma 4 26B-A4B | Q5_K_M | PASS (73 tok/s) | PASS | **FAIL** (`<call:write{...}>` malformed) | PASS | PASS 5/5 | **FAIL** |
| huihui-ai/Qwen2.5-VL-7B-Instruct-abliterated | Qwen 2.5-VL 7B | Q6_K | PASS (54 tok/s) | PASS | PASS (one-shot) | PASS | PASS 5/5* | **PASS** but weak |
| huihui-ai/Qwen2.5-VL-32B-Instruct-abliterated | Qwen 2.5-VL 32B | i1-Q4_K_M | PASS | PASS | PARTIAL (uses tools but loops on errors) | PASS | PASS | **NEAR PASS** |

*7B sanitizes profanity prompts vs 26B Gemma which drops F-bombs cleanly — softer compliance.

---

## Root-cause findings

### Gemma 4 26B-A4B family is structurally incompatible with OpenCode's heavy build-agent prompt
All 4 abliterations of `google/gemma-4-26b-a4b-it` we tested produced *malformed* tool-call output under OpenCode's 15K-token build agent prompt:
- supergemma4 → `<channel|>` thinking-token leakage into `content`
- prutser ARA → `<call:write{...}>` (missing the opening `<\|tool_call>` markers)
- Trevor → repetition loops
- huihui → markdown narration ("I would execute …")

Direct curl with one tool + simple prompt: **all four pass T3 cleanly**. The break happens specifically under OpenCode's heavy prompt + 30 tools. This is structural to the Gemma 4 26B-A4B chat template + llama.cpp's tool-call extractor's strict markers, not solvable by changing abliteration variant.

### Qwen 2.5-VL family uses Hermes-style `<tool_call>` JSON
Native llama.cpp + OpenCode + Codex all parse it cleanly with no `toolParser` workaround. T3 + T4 pass.

### Vision-language models hit the agentic skill ceiling
Qwen 2.5-VL is *vision-language* (image-understanding → text), not coding-agent. It can call tools, but mid-tier agent skill:
- 7B: lapses into "describe the steps" narration in mid-sentence; lies about completing tasks ("Yes, I've created scrape.js" — no tool call ever made)
- 32B: actually calls tools (`mkdir src`, `touch src/fetch.js`) and tracks plans, but picks primitive tools (`echo > file` instead of file-write) and loops on its own mistakes (re-ran the same broken `echo` twice, hit ENOENT twice, planned a third round)

Neither failure is the *client*'s fault — both opencode and codex hit the same wall on Qwen 2.5-VL 32B. Coding-specialized models (Qwen 2.5-Coder-32B, GLM-4.6, DevStral) are trained specifically for this and don't have the failure mode. Trade-off: those don't have vision.

---

## Hardware sizing learnings

A10G 24 GB VRAM is **tight** for any 32B model + vision encoder + agentic context window:

| Setting | VRAM cost | Notes |
|---|---|---|
| Qwen 2.5-VL 32B i1-Q4_K_M | 19.85 GB | weights only |
| mmproj-f16 | 1.38 GB | image projector |
| mmproj-Q8 | 0.73 GB | smaller, ~no quality loss for VL |
| KV cache q8 @ 16K | ~2 GB | |
| KV cache q4 @ 16K | ~1 GB | |
| KV cache q4 @ 24K | ~1.5 GB | |
| **Image encoding (peak alloc)** | **+1.86 GB** | one-shot during vision request |
| **Total budget** | 22.5 GB | A10G usable VRAM |

Working settings for 32B-VL with vision: `i1-Q4_K_M + mmproj-Q8 + -c 12288 + q4 KV`. Pure text-only could go higher context (20K+) by skipping mmproj.

---

## Codex CLI vs OpenCode

| Aspect | OpenCode | Codex CLI |
|---|---|---|
| System prompt size | ~15K tokens (build agent + 30 tools) | smaller, more focused |
| Tool-call format | OpenAI `tool_calls` | OpenAI Responses API `output[]` |
| Local-server compat | needs `wire_api`-style equivalents (toolParser config) | llama-server natively supports `/v1/responses` (verified) |
| Sandbox | `external_directory` rule auto-rejects /tmp writes in non-interactive mode | `--full-auto` = workspace-write sandbox |
| Behavior on Qwen-VL 32B | model lapses into narration | model uses tools but with primitive choices |

**Codex got tools called more reliably** on the same model. The bottleneck still ended up being model coding-agent skill, not the client.

---

## Live setup (post-mission)

- llama-server (docker `ghcr.io/ggml-org/llama.cpp:server-cuda`) on remote `i-0fdfd74bb3022c616`, port 8089
- SSH tunnel `localhost:8089` → remote (tmux session `llamaserver-tunnel`)
- ~/.codex/config.toml: `freemodel_llama` provider, model `qwen-vl-32b-ab`
- ~/.config/opencode/opencode.json: same provider, also visible to opencode

Switch model: stop docker, swap `-m` path, start docker, change `--alias` + opencode/codex model name.

---

## Open follow-ups

- Test **Qwen 2.5-Coder-32B abliterated** (no vision, but real coding-agent training) — see if proactive tool-use is clean. Hybrid possibility: keep VL for image questions, route coding through Coder.
- Test **Qwen 3-VL family** when more abliterations become available — newer family, may close the agent-skill gap.
- Consider routing: VL for image-input, Coder for tool-loop work.
