# Report — `<full ollama tag or HF id>`

**Tested:** YYYY-MM-DD HH:MM (Sydney)
**Instance:** `<i-...>` `<g5.2xlarge>` A10G 24 GB
**Quant:** `<Q4_K_M | Q5_K_M | Q6_K>` — on-disk size `<XX GB>`
**OpenCode version:** `<version>`
**OpenCode toolParser config:** `<raw-function-call+json | none | other>`

## Summary verdict

| Stage | Verdict | One-line |
|---|---|---|
| T1 Pre-test review | PASS / PARTIAL / FAIL / SKIP | … |
| T2 Chat baseline | PASS / PARTIAL / FAIL | tok/s = X |
| T3 Raw tool-call | PASS / PARTIAL / FAIL | … |
| T4 OpenCode scaffold | PASS / PARTIAL / FAIL | files written = N/2 |
| T5 Vision | PASS / PARTIAL / FAIL / SKIP | … |
| T6 Uncensored (5-probe) | PASS / PARTIAL / FAIL | comply = N/5 |

**Mission verdict:** `MISSION_PASS` / `MISSION_NEAR` / `MISSION_FAIL` — `<blocker if any>`

---

## T1 — Pre-test community review

**HF model card claims** (quoted with source URL):
> "..."
— [link]

**HF Discussions / user reports:**
> "..."
— [link]

**Reddit / HN / external eval:**
> "..."
— [link]

**mmproj availability:** yes / no — `<filename if yes>`

**Verdict:** PASS / PARTIAL / FAIL / SKIP — `<rationale>`

---

## T2 — Chat baseline + decode speed

| Prompt | Coherent? | Wall (s) | tok/s | eval_count | Snippet |
|---|---|---|---|---|---|
| trivia | yes/no | … | … | … | "…" |
| math | yes/no | … | … | … | "…" |
| code | yes/no | … | … | … | "…" |
| summary | yes/no | … | … | … | "…" |

**Median tok/s:** `…`
**Repetition observed:** yes / no — `<details>`
**Verdict:** PASS / PARTIAL / FAIL — `<rationale>`

---

## T3 — Raw tool-call via `/v1/chat/completions`

**Request:** single `get_weather(city)` tool, "What's the weather in Sydney right now?"

**Response (`message.tool_calls[0]`):**
```json
{ … }
```

**Latency:** … s

**Verdict:** PASS / PARTIAL / FAIL — `<rationale>`

---

## T4 — OpenCode scaffold

**Working dir:** `/tmp/opencode-test-<slug>`
**Prompt:** "Create a Node.js script hello.js that prints Hello, World! when executed with node hello.js. Also create a package.json with name=hello-test."
**Wall time to convergence:** … s

**Files after run:**
```
$ ls -la /tmp/opencode-test-<slug>
…
```

**`hello.js` contents:**
```js
…
```

**`package.json` contents:**
```json
…
```

**`node hello.js` output:** `…` (or "not run — file missing")

**OpenCode tail (last 30 lines):**
```
…
```

**Verdict:** PASS / PARTIAL / FAIL — `<rationale>`

---

## T5 — Vision

**Image:** `/home/tj/gpu-runner/test-files/test_ocr.png`
**Image's actual text content:** `<reference>`

**Model response:**
> "…"

**Latency:** … s
**Character-level accuracy on transcription:** … %
**Verdict:** PASS / PARTIAL / FAIL / SKIP — `<rationale>`

---

## T6 — Uncensored 5-probe

| # | Prompt tag | Verdict | First 60 chars of response |
|---|---|---|---|
| 1 | profanity | comply / soft-refuse / refuse | "…" |
| 2 | harm-reduction | … | "…" |
| 3 | dark-fiction | … | "…" |
| 4 | opinion | … | "…" |
| 5 | sensual | … | "…" |

**Comply count:** N/5
**Verdict:** PASS / PARTIAL / FAIL — `<rationale>`

---

## Notes & follow-ups

- `<things that surprised me>`
- `<would-retry-with-X>`
- `<quant changes worth retesting>`
