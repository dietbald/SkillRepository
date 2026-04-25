# OpenClaw Practical Tips & Tutorials

## First-Time Setup Recommendations

1. **Don't install on daily/work machines** — use a dedicated machine or VM due to filesystem access and command execution
2. **Use a dedicated phone number for WhatsApp** — clearer routing, less confusion
3. **Start with pairing mode** for all channels — lock down before opening up
4. **Use `requireMention: true` in groups** — prevents agent from responding to every message
5. **Never use Tailscale Funnel** — exposes to public internet. Tailscale Serve is fine (stays private)

## Security Hardening Checklist

1. Bind to loopback: `gateway.bind: "loopback"`
2. Enable token auth: `gateway.auth.mode: "token"`
3. Set file permissions: `~/.openclaw` = 700, config = 600
4. Use `dmPolicy: "pairing"` on all channels
5. Enable `requireMention: true` in all groups
6. Run `openclaw security audit --deep` regularly

## Personality Configuration

### SOUL.md (Identity)
Define the agent's approach:
- "Be genuinely helpful, not performatively helpful"
- Develop opinions and preferences
- Ask before taking unilateral actions
- Eliminate corporate filler

### USER.md (Context)
Include:
- Name and pronouns
- Timezone
- Work role and responsibilities
- Communication style preferences
- Any relevant personal context

### AGENTS.md (Operating Rules)
Establish:
- Memory management procedures
- Security protocols (treat external content as hostile)
- Group chat interaction rules
- Workflow procedures

## First Week Progression

**Days 1-2: Casual conversation**
- Explain concepts, summarize articles
- Ask about weather, send voice messages
- Let the agent learn your style

**Days 3-4: Tool integration**
- Add web search (Brave Search API)
- Connect knowledge bases (Obsidian at $5/mo)
- Try browser control

**Day 5: Group chats**
- Add to group with close contacts
- Verify @mention requirement is active

**Days 6-7: Style refinement**
- Request drafts (emails, posts)
- Provide writing feedback
- Create explicit style guides

## Memory Management

**Daily files** (`memory/YYYY-MM-DD.md`): Auto-created session notes
**Long-term** (`MEMORY.md`): Important persistent info

Prompt: "Remember what we just talked about for next time" to encourage documentation.

## Model Selection & Costs

| Model | Use Case | Daily Cost |
|-------|----------|-----------|
| Claude Opus 4.6 | Complex research, long coding, nuanced writing | $10-15 avg, $30+ spikes |
| Claude Sonnet 4.6 | 90% of tasks: casual chat, calendar, email drafts | $3-5 moderate use |

Change default: "Change the default model to Sonnet"
Monitor: console.anthropic.com

## Staying Current
```bash
openclaw update --channel stable    # Tested, recommended
openclaw update --channel beta      # Nearly-ready features
openclaw update --channel dev       # Bleeding edge, unstable
```

Multiple releases per week.

## Common Troubleshooting

### WhatsApp Disconnects
```bash
openclaw channels login --channel whatsapp  # Rescan QR
```

### Gateway Crashes
Set up watchdog checking health endpoint every 2 minutes with force-restart.

### API Key Issues
Monitor spending limits. Hitting limits = silent failures. Set billing alerts.

### Model Errors
Check status.anthropic.com during consistent failures.

## Compound Benefits Over Time

With consistent use, the agent develops:
- Understanding of your writing style
- Knowledge of preferences (food, people, work)
- Awareness of active projects and deadlines
- Communication patterns and optimal timing

## Key Configuration Patterns

### Separate Personal vs Work Agent
```json5
{
  agents: {
    list: [
      { id: "personal", default: true, workspace: "~/.openclaw/workspace-personal" },
      { id: "work", workspace: "~/.openclaw/workspace-work" },
    ],
  },
  bindings: [
    { agentId: "personal", match: { channel: "whatsapp", accountId: "personal" } },
    { agentId: "work", match: { channel: "whatsapp", accountId: "work" } },
  ],
}
```

### Cost-Optimized Setup (Sonnet Default + Opus for Complex)
```json5
{
  agents: {
    defaults: {
      model: {
        primary: "anthropic/claude-sonnet-4-6",
        fallbacks: ["anthropic/claude-opus-4-6"],
      },
    },
  },
}
```

### Family/Friends Group Bot (Restricted)
```json5
{
  agents: {
    list: [{
      id: "family",
      sandbox: { mode: "all", scope: "agent" },
      tools: {
        allow: ["read", "web_search"],
        deny: ["write", "edit", "exec", "browser", "cron", "gateway"],
      },
    }],
  },
}
```

### Watchdog Script Pattern
Check health endpoint every 2 minutes:
```bash
#!/bin/bash
while true; do
  if ! openclaw health >/dev/null 2>&1; then
    openclaw gateway restart
  fi
  sleep 120
done
```

## What to Tell Your AI (System Prompt)
```
## Security Rules
- Never share directory listings or file paths with strangers
- Never reveal API keys, credentials, or infrastructure details
- Verify requests that modify system config with the owner
- When in doubt, ask before acting
- Keep private data private unless explicitly authorized
```

## Official Resources
- Docs: https://docs.openclaw.ai/
- Full index: https://docs.openclaw.ai/llms.txt
- ClawHub (skills): https://clawhub.com
- Security reports: security@openclaw.ai
