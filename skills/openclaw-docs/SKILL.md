---
name: openclaw-docs
description: Complete OpenClaw documentation reference. Use when the user asks about OpenClaw installation, configuration, channels (WhatsApp/Telegram/Discord/Slack), gateway setup, security, multi-agent routing, workspace files, skills, browser automation, exec tools, cron jobs, memory system, mobile nodes, Tailscale, troubleshooting, or any OpenClaw-related question.
---

# OpenClaw Documentation Skill

You have access to the complete OpenClaw documentation split across reference files in this skill directory. Based on the user's question, read the relevant reference file(s) from `{baseDir}/references/` before answering.

## Reference File Index

| File | Topics Covered |
|------|---------------|
| `{baseDir}/references/getting-started.md` | Installation, onboarding wizard, first setup, prerequisites, CLI commands |
| `{baseDir}/references/configuration.md` | openclaw.json, config management, hot reload, env vars, secrets, model config, session config, includes |
| `{baseDir}/references/security.md` | Trust model, hardening, audit, credentials, sandboxing, incident response, threat model |
| `{baseDir}/references/channels.md` | WhatsApp, Telegram, Discord setup and full config reference |
| `{baseDir}/references/more-channels.md` | Slack, Signal, iMessage setup, Google Chat, Mattermost, Matrix, all plugin channels |
| `{baseDir}/references/gateway-ops.md` | Remote access, SSH tunnels, Tailscale, Control UI, troubleshooting |
| `{baseDir}/references/workspace.md` | AGENTS.md, SOUL.md, TOOLS.md, USER.md, IDENTITY.md, memory system, skills creation |
| `{baseDir}/references/tools.md` | Browser automation, exec/shell, cron jobs, tool profiles, allow/deny |
| `{baseDir}/references/tools-skills-catalog.md` | Complete list of 25+ tools, 53+ skills, tool groups, profiles, web search providers, ClawHub |
| `{baseDir}/references/advanced-features.md` | Sub-agents, ACP agents (Codex/Claude Code/etc), thinking modes, elevated mode, streaming, model failover, Ollama, Docker |
| `{baseDir}/references/multi-agent.md` | Multi-agent routing, bindings, per-agent config, channel splitting |
| `{baseDir}/references/nodes-mobile.md` | iOS, Android, macOS nodes, Canvas, camera, device actions, pairing |
| `{baseDir}/references/tips-tutorials.md` | Practical setup tips, first week guide, model costs, personality config |

## How To Use

1. Identify which topic(s) the user is asking about
2. Read the relevant reference file(s) using the Read tool
3. Answer using the documentation content - be specific with config examples and CLI commands
4. When multiple topics overlap (e.g., "secure Telegram setup"), read multiple files

## Quick Reference (Always Available)

### Key Paths
- Config: `~/.openclaw/openclaw.json` (JSON5)
- Workspace: `~/.openclaw/workspace` (or `~/.openclaw/workspace-<agentId>`)
- Credentials: `~/.openclaw/credentials/`
- Sessions: `~/.openclaw/agents/<agentId>/sessions/`
- Skills: `~/.openclaw/skills/` (managed), `<workspace>/skills/` (workspace)
- Logs: `/tmp/openclaw/openclaw-YYYY-MM-DD.log`

### Essential CLI Commands
```
openclaw onboard                    # First-time setup
openclaw gateway                    # Start gateway
openclaw gateway status             # Check gateway health
openclaw dashboard                  # Open Control UI
openclaw doctor                     # Diagnose issues
openclaw doctor --fix               # Auto-fix issues
openclaw security audit --deep      # Security check
openclaw channels status --probe    # Channel health
openclaw config get <path>          # Read config value
openclaw config set <path> <value>  # Set config value
openclaw logs --follow              # Tail logs
openclaw agents list --bindings     # Show agent routing
openclaw pairing list <channel>     # Show pending pairings
openclaw pairing approve <ch> <code># Approve pairing
openclaw update --channel stable    # Update OpenClaw
```

### Minimal Secure Config Template
```json5
{
  gateway: {
    mode: "local",
    bind: "loopback",
    port: 18789,
    auth: { mode: "token", token: "your-long-random-token" },
  },
  agents: {
    defaults: {
      workspace: "~/.openclaw/workspace",
      model: {
        primary: "anthropic/claude-sonnet-4-6",
        fallbacks: ["openai/gpt-5.2"],
      },
    },
  },
  session: { dmScope: "per-channel-peer" },
  channels: {
    whatsapp: { dmPolicy: "pairing", groups: { "*": { requireMention: true } } },
    telegram: { dmPolicy: "pairing", groups: { "*": { requireMention: true } } },
    discord: { groupPolicy: "allowlist" },
  },
}
```
