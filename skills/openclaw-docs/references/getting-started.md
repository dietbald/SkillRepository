# OpenClaw Getting Started & Installation

## Prerequisites
- **Node.js**: Version 24 recommended; Node 22.14+ also supported
- **API Key**: Required from a model provider (Anthropic, OpenAI, Google, or similar)
- **Platform Note**: Windows users can use native Windows or WSL2; WSL2 is recommended

## Installation

**macOS/Linux:**
```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

**Windows (PowerShell):**
```powershell
iwr -useb https://openclaw.ai/install.ps1 | iex
```

Alternative: Docker, Nix, or npm installation available.

## Setup Steps

1. **Onboarding**: `openclaw onboard --install-daemon` — ~2 min process for model selection, API key config, Gateway setup
2. **Verify**: `openclaw gateway status` — confirms Gateway on port 18789
3. **Dashboard**: `openclaw dashboard` — opens Control UI in browser
4. **Test**: Send test message through Control UI chat

## Environment Variables
- `OPENCLAW_HOME` — home directory path
- `OPENCLAW_STATE_DIR` — custom state directory
- `OPENCLAW_CONFIG_PATH` — custom config file path

---

## Onboarding Wizard (`openclaw onboard`)

### Two Modes
- **QuickStart**: Preset defaults (local gateway on 18789, token auth, coding tool profile)
- **Advanced**: Granular control over every step

### Seven Configuration Steps

1. **Model/Auth** — Select provider (API key, OAuth, setup-token, or custom compatible providers). Use `--secret-input-mode ref` for env-backed references instead of plaintext keys.

2. **Workspace** — Agent file location (default: `~/.openclaw/workspace`), generates bootstrap files.

3. **Gateway** — Port, bind address, auth mode, Tailscale exposure. Use `--gateway-token-ref-env <ENV_VAR>` for non-interactive token config.

4. **Channels** — Enable WhatsApp, Telegram, Discord, Google Chat, Mattermost, Signal, BlueBubbles, or iMessage.

5. **Daemon** — Installs systemd user unit (Linux/WSL2) or LaunchAgent (macOS). Validates token resolution before installation.

6. **Health check** — Starts Gateway and verifies status.

7. **Skills** — Installs recommended skills and optional dependencies.

### Important Notes
- Re-running preserves existing config unless `--reset` is used; `--reset-scope full` includes workspace deletion
- `--json` does NOT enable non-interactive mode; use `--non-interactive` for scripting
- Web search provider config (Perplexity, Brave, Gemini, Grok, Kimi) set during onboard or later via `openclaw configure --section web`
- Default DM isolation: `session.dmScope: "per-channel-peer"`

### Reconfiguration
```bash
openclaw configure              # Re-run config wizard
openclaw agents add <name>      # Add new agent
```

### Multi-Agent via Onboard
`openclaw agents add <name>` creates agents with isolated workspaces, sessions, auth. Default workspace: `~/.openclaw/workspace-<agentId>`. Non-interactive flags: `--model`, `--agent-dir`, `--bind`, `--non-interactive`.

---

## Documentation Hub Categories (13 sections, 400+ pages)

- **Start here**: Getting started, onboarding, setup, dashboard, help
- **Installation + updates**: Docker, Nix, updating/rollback, Bun workflow
- **Core concepts**: Architecture, features, agent runtime, memory, streaming, multi-agent, sessions, RPC, OAuth, timezone
- **Providers + ingress**: 17 entries for channels and model providers
- **Gateway + operations**: Network, pairing, health, logging, sandboxing, dashboard, security, troubleshooting
- **Tools + automation**: 20 entries for tools surface, CLI, PDF, exec, elevated, cron, thinking, sub-agents, browser, polling
- **Nodes, media, voice**: Camera, images, audio, location, voice wake, talk mode
- **Platforms**: macOS, iOS, Android, Windows (WSL2), Linux, web
- **macOS companion app**: 24 specialized topics
- **Extensions + plugins**: Plugin dev, manifests, agent tools, bundles, community, voice calls
- **Workspace + templates**: Skills, ClawHub, config, template references
- **Testing + release**: Testing, release policy, device models

Full index: https://docs.openclaw.ai/llms.txt
