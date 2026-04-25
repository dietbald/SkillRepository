# OpenClaw Advanced Features

## Sub-Agents

Sub-agents are background agent runs spawned from an existing session. They operate in isolated sessions and announce results back.

### Slash Commands
```
/subagents list                           # View all
/subagents kill <id|#|all>                # Stop
/subagents log <id|#> [limit] [tools]     # Fetch logs
/subagents info <id|#>                    # Metadata
/subagents send <id|#> <message>          # Message
/subagents steer <id|#> <message>         # Guide behavior
/subagents spawn <agentId> <task> [--model <m>] [--thinking <lvl>]
```

### sessions_spawn Tool Parameters
- `task` (required) — the work to perform
- `label?` — identifier
- `agentId?` — spawn under another agent
- `model?` — override model
- `thinking?` — override thinking level
- `runTimeoutSeconds?` — abort timeout (0 = no timeout)
- `thread?` (default false) — request thread binding
- `mode?` (run|session) — `session` requires `thread: true`
- `cleanup?` (delete|keep) — archive after announce
- `sandbox?` (inherit|require) — sandbox enforcement

### Nested Sub-Agents (Depth 2)
```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2,          // allow nesting (default: 1, max: 5)
        maxChildrenPerAgent: 5,    // per session (default: 5, max: 20)
        maxConcurrent: 8,          // global cap (default: 8)
        runTimeoutSeconds: 900,
      },
    },
  },
}
```

| Depth | Role | Can Spawn |
|-------|------|-----------|
| 0 | Main agent | Always |
| 1 | Orchestrator | Only if maxSpawnDepth >= 2 |
| 2 | Leaf worker | Never |

### Security
- `agents.list[].subagents.allowAgents` — allowed agent IDs; `["*"]` = any
- Sub-agent context injects only AGENTS.md + TOOLS.md (no SOUL.md, IDENTITY.md, USER.md)
- Auto-archive after `archiveAfterMinutes` (default: 60)

### Cost Tip
Use cheaper model for sub-agents: `agents.defaults.subagents.model`

---

## ACP Agents (Agent Client Protocol)

ACP sessions run external coding harnesses (Claude Code, Codex, Cursor, Copilot, Gemini CLI, Pi, etc.) through OpenClaw.

### Supported Harnesses (acpx backend)
claude, codex, copilot, cursor, droid, gemini, iflow, kilocode, kimi, kiro, openclaw, opencode, pi, qwen

### Commands
```
/acp spawn <harness> [--mode persistent|oneshot] [--bind here|off] [--cwd <path>]
/acp cancel          # Stop current turn
/acp steer <msg>     # Nudge behavior
/acp close           # Close and unbind
/acp status          # Show runtime
/acp doctor          # Backend health
```

### Configuration
```json5
{
  acp: {
    enabled: true,
    defaultAgent: "codex",
    allowedAgents: ["claude", "codex", "gemini"],
    maxConcurrentSessions: 3,
  },
}
```

### Binding Models
- **Current-conversation**: `--bind here` pins conversation to ACP session
- **Thread-bound**: `thread: true` in sessions_spawn
- **Persistent**: Top-level `bindings[]` with `type: "acp"`

**Note:** Sandboxed sessions cannot spawn ACP (runs on host).

### Permission Modes
- `approve-all` — unrestricted
- `approve-reads` — read-only approved (default)
- `deny-all` — everything blocked
- `nonInteractivePermissions: "deny"` for graceful degradation

---

## Thinking Modes

### Levels
| Level | Maps To | Notes |
|-------|---------|-------|
| off | Disabled | |
| minimal | "think" | |
| low | "think hard" | |
| medium | "think harder" | |
| high | "ultrathink" | Maximum budget |
| xhigh | "ultrathink+" | GPT-5.2 + Codex only |
| adaptive | Provider-managed | Default for Claude 4.6 |

### Commands
```
/t <level>           # Inline directive
/think:<level>       # Alternative syntax
/thinking <level>    # Full syntax
/think               # Query current level
```

### Resolution Priority
1. Inline directive on current message
2. Session override (directive-only message)
3. Per-agent default (`agents.list[].thinkingDefault`)
4. Global default (`agents.defaults.thinkingDefault`)
5. Fallback: adaptive for Claude 4.6, low for other reasoning models, off otherwise

### Provider-Specific
- **Anthropic Claude 4.6**: Defaults to `adaptive`
- **Z.AI**: Binary only (on/off)
- **Moonshot**: Maps off=disabled; non-off=enabled

---

## Fast Mode
```
/fast on|off
```
- OpenAI: sends `service_tier=priority`
- Anthropic: on=`auto`, off=`standard_only`

Resolution: inline → session → per-agent → model config → off

---

## Verbose & Reasoning Display
```
/verbose on|full|off     # Tool call visibility
/reasoning on|off|stream # Thinking block visibility (stream=Telegram only)
```

---

## Elevated Mode

Allows sandboxed agents to execute on gateway host.

### Commands
```
/elevated on|ask     # Execute on host with approvals
/elevated full       # Execute on host, bypass approvals
/elevated off        # Return to sandbox
/elevated            # Show current level
```

### Authorization (ALL must pass)
1. `tools.elevated.enabled: true`
2. Sender in `tools.elevated.allowFrom`
3. Per-agent `agents.list[].tools.elevated.enabled`
4. Per-agent `agents.list[].tools.elevated.allowFrom`

Only changes behavior when agent is sandboxed.

---

## Streaming & Chunking

### Two Layers
1. **Block streaming**: Completed blocks as channel messages (not token deltas)
2. **Preview streaming**: Temporary preview message updated during generation

### Block Streaming Config
```json5
{
  agents: {
    defaults: {
      blockStreamingDefault: "on",
      blockStreamingBreak: "text_end",    // or "message_end"
      blockStreamingChunk: { minChars: 200, maxChars: 800 },
      humanDelay: "natural",              // off | natural | custom
    },
  },
}
```

### Preview Streaming (per-channel)
`channels.<ch>.streaming`: off | partial | block | progress

| Channel | partial | block | progress |
|---------|---------|-------|----------|
| Telegram | edit preview | chunked edits | maps to partial |
| Discord | edit preview | draft chunks | maps to partial |
| Slack | native streaming API | append drafts | status + final |

### Chunking Algorithm
- Low bound: don't emit until >= minChars
- High bound: prefer splits before maxChars
- Break hierarchy: paragraph > newline > sentence > whitespace > hard break
- Code fence protection: never split inside fences

---

## Model Failover & Auth Rotation

### Two-Stage Failure Handling
1. Auth profile rotation within current provider
2. Model fallback to next in `fallbacks` array

### Cooldown Escalation
Failed profiles enter cooldown: 1min → 5min → 25min → 1hr (cap)

### Billing Disables
Credit failures: 5hr starting, doubles per failure, max 24hr. Reset after 24hr clean.

### Session Stickiness
Auth profile pinned per session until: session reset, compaction, or cooldown.

### Manual Override
`/model <model>@<profileId>` — user-pinned, won't auto-rotate.

---

## Ollama Integration (Local Models)

### Setup
```bash
ollama pull glm-4.7-flash
export OLLAMA_API_KEY="ollama-local"   # enables auto-discovery
openclaw onboard                       # select Ollama
```

**CRITICAL:** Use native URL `http://host:11434` — NOT `/v1` OpenAI-compatible URL (breaks tool calling).

### Auto-Discovery
With `OLLAMA_API_KEY="ollama-local"`:
- Queries `/api/tags` for available models
- Reads context windows via `/api/show`
- Identifies reasoning models by name heuristics
- Sets costs to zero

### Cloud Models
`kimi-k2.5:cloud`, `glm-5:cloud` — no local pull needed. Sign in: `ollama signin`

---

## Docker Deployment

### Quick Setup
```bash
./scripts/docker/setup.sh    # Build + onboard + start
```

Pre-built images: `ghcr.io/openclaw/openclaw:latest` (tags: main, latest, version-specific)

### Key Environment Variables
| Variable | Purpose |
|----------|---------|
| `OPENCLAW_IMAGE` | Use remote image |
| `OPENCLAW_DOCKER_APT_PACKAGES` | Extra apt packages |
| `OPENCLAW_EXTENSIONS` | Pre-install extensions |
| `OPENCLAW_EXTRA_MOUNTS` | Extra bind mounts |
| `OPENCLAW_HOME_VOLUME` | Persist /home/node |
| `OPENCLAW_SANDBOX` | Enable sandbox (1/true/yes) |
| `OPENCLAW_DOCKER_SOCKET` | Custom socket path |

### Health Endpoints (No Auth)
```bash
curl -fsS http://127.0.0.1:18789/healthz   # liveness
curl -fsS http://127.0.0.1:18789/readyz     # readiness
```

### Storage
Bind-mounts: `OPENCLAW_CONFIG_DIR` → config, `OPENCLAW_WORKSPACE_DIR` → workspace

### Requirements
- Docker Desktop or Engine with Compose v2
- At least 2GB RAM (pnpm install OOM at 1GB)
- Runs as non-root `node` user (uid 1000)

### Fix Permissions
```bash
sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
```
