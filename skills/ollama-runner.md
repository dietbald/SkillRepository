# Ollama Runner — On-Demand AI Inference on AWS

Launches an on-demand AWS EC2 instance running Ollama, forwards port 11434 locally via SSH tunnel, then auto-terminates after idle timeout.

**CLI:** `/home/tj/ollama-runner/ollama-runner`
**Config:** `/home/tj/ollama-runner/config.env`

## Current Setup
- **Instance:** c5.2xlarge (8 vCPU, 16GB RAM) — GPU unavailable due to account quota
- **Models:** `gemma3:1b` (default) + `gemma3:4b` (available via --model)
- **Port:** 11434 (forwarded locally via SSH tunnel)
- **Idle timeout:** 600s (auto-shutdown when no active requests)
- **Region:** ap-southeast-1 (Singapore)

## Models Available

| Model | Speed | Best for | Accuracy | Response time |
|-------|-------|----------|----------|---------------|
| `gemma3:1b` (default) | ~25 tok/s | Data extraction (amounts, dates, names, emails) | ~90% | **<2s** |
| `gemma3:4b` | ~10 tok/s | Summarization, reasoning, complex analysis | ~98-100% | **5-20s** |

## When TO use ollama-runner

- **Privacy-sensitive data** — emails, financials, HR docs, legal content that must not leave our infrastructure
- **Simple extraction tasks** — pulling a number, date, name, or code from an email or document
- **Bulk processing where cost matters** — 5,000 emails costs ~$0.45 vs $2-8 on APIs
- **User explicitly asks for Ollama / local AI / open-source model**

## When NOT to use ollama-runner

- **High accuracy is critical** — for financial reports, legal analysis, or anything where a 5-10% error rate is unacceptable, use Claude or GPT API instead
- **Complex reasoning or math** — gemma3:1b makes arithmetic errors; use gemma3:4b or an API
- **Long-form generation** — writing emails, reports, code; API models are far better
- **Speed matters and text is long** — a 5-page document takes 3-7s on 1b, but APIs process it in <2s with parallel requests
- **One-off questions** — the instance takes ~90s to cold start; not worth it for a single question
- **Summarization quality matters** — gemma3:4b is decent but takes 15-20s per summary; Claude Haiku does it better for ~$0.0004 per email

## Cost Comparison (5,000 emails, extraction)

| Solution | Cost | Time | Accuracy |
|----------|------|------|----------|
| **ollama gemma3:1b** | **$0.45** | 75 min | ~90% |
| **ollama gemma3:4b** | **$5.00** | 14.5 hrs | ~98% |
| GPT-4o-mini | $0.40 | ~10 min | ~97% |
| Claude Haiku 3.5 | $2.20 | ~10 min | ~98% |
| GPT-4o | $6.60 | ~25 min | ~99% |
| Claude Sonnet 4 | $8.25 | ~15 min | ~99%+ |

**Rule of thumb:** Use ollama for private bulk extraction. Use APIs for anything requiring high accuracy, reasoning, or generation quality.

## Commands

```bash
# Start instance + open SSH tunnel
ollama-runner start

# One-shot query (auto-starts if needed)
ollama-runner ask "Extract the total from this email: ..."
ollama-runner ask "Summarize this text: ..." --model gemma3:4b

# Status / manage
ollama-runner status
ollama-runner list
ollama-runner stop

# Pull additional models onto running instance
ollama-runner pull gemma3:4b
ollama-runner models
ollama-runner logs

# Build pre-baked AMI (run once — makes future launches faster)
ollama-runner setup-ami
```

## After `start` — use like any local Ollama

```bash
# Direct API
curl http://localhost:11434/api/generate \
  -d '{"model":"gemma3:1b","prompt":"Extract the amount: Total $5,000","stream":false}'

# With ollama CLI (if installed locally)
OLLAMA_HOST=http://localhost:11434 ollama run gemma3:1b

# OpenAI-compatible endpoint
curl http://localhost:11434/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"model":"gemma3:1b","messages":[{"role":"user","content":"Hello"}]}'
```

## Known Limitations
- **8 vCPU quota limit** — can't launch larger instances; no GPU spot available
- **Cold start ~90s** — first launch pulls models if not in AMI
- **gemma3:1b accuracy** — struggles with math, sometimes hallucinates on unfamiliar patterns
- **No confidence scores** — Ollama doesn't return probabilities; use format validation to flag suspicious results
