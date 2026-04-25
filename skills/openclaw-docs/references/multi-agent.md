# OpenClaw Multi-Agent Routing

## Core Concept

An "agent" is a fully scoped brain with its own:
- Workspace (AGENTS.md, SOUL.md, USER.md, etc.)
- Authentication profiles
- Session storage
- Configuration directory

## Directory Structure
- Config: `~/.openclaw/openclaw.json`
- Workspace: `~/.openclaw/workspace-<agentId>`
- Agent dir: `~/.openclaw/agents/<agentId>/agent`
- Sessions: `~/.openclaw/agents/<agentId>/sessions`
- Auth: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`

**Never reuse `agentDir` across agents** — causes auth/session collisions.

## Creating Agents
```bash
openclaw agents add work
openclaw agents add coding
openclaw agents list --bindings
```

## Basic Multi-Agent Config
```json5
{
  agents: {
    list: [
      { id: "home", default: true, workspace: "~/.openclaw/workspace-home" },
      { id: "work", workspace: "~/.openclaw/workspace-work" },
    ],
  },
  bindings: [
    { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
    { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },
  ],
}
```

## Routing Rules (Specificity Hierarchy)

1. Peer match (exact DM/group/channel ID)
2. Parent peer match (thread inheritance)
3. Guild ID + roles (Discord)
4. Guild ID (Discord)
5. Team ID (Slack)
6. Account ID match
7. Channel-level match
8. Fallback to default agent

Multiple match fields use AND semantics. First config-order match wins in same tier.

## Channel + Model Splitting
```json5
{
  agents: {
    list: [
      { id: "chat", workspace: "~/.openclaw/workspace-chat", model: "anthropic/claude-sonnet-4-6" },
      { id: "opus", workspace: "~/.openclaw/workspace-opus", model: "anthropic/claude-opus-4-6" },
    ],
  },
  bindings: [
    { agentId: "chat", match: { channel: "whatsapp" } },
    { agentId: "opus", match: { channel: "telegram" } },
  ],
}
```

## Per-Peer Routing
```json5
{
  bindings: [
    { agentId: "opus", match: { channel: "whatsapp", peer: { kind: "direct", id: "+15551234567" } } },
    { agentId: "chat", match: { channel: "whatsapp" } },
  ],
}
```
Peer bindings must appear ABOVE channel-wide rules.

## Group-Specific Agent
```json5
{
  agents: {
    list: [{
      id: "family",
      workspace: "~/.openclaw/workspace-family",
      groupChat: { mentionPatterns: ["@family", "@familybot"] },
      sandbox: { mode: "all", scope: "agent" },
      tools: {
        allow: ["exec", "read", "sessions_list", "sessions_history"],
        deny: ["write", "edit", "browser", "canvas"],
      },
    }],
  },
  bindings: [
    { agentId: "family", match: { channel: "whatsapp", peer: { kind: "group", id: "GROUP_ID@g.us" } } },
  ],
}
```

## Discord Multi-Account
```json5
{
  channels: {
    discord: {
      accounts: {
        default: { token: "TOKEN_MAIN" },
        coding: { token: "TOKEN_CODING" },
      },
    },
  },
  bindings: [
    { agentId: "main", match: { channel: "discord", accountId: "default" } },
    { agentId: "coding", match: { channel: "discord", accountId: "coding" } },
  ],
}
```

## WhatsApp Multi-Account
```bash
openclaw channels login --channel whatsapp --account personal
openclaw channels login --channel whatsapp --account biz
```

## Discord Role-Based Routing
```json5
{
  bindings: [
    { agentId: "opus", match: { channel: "discord", guildId: "123", roles: ["111"] } },
    { agentId: "sonnet", match: { channel: "discord", guildId: "123" } },
  ],
}
```

## Per-Agent Sandbox
```json5
{
  agents: {
    list: [
      { id: "personal", sandbox: { mode: "off" } },
      { id: "family", sandbox: { mode: "all", scope: "agent", workspaceAccess: "ro" },
        tools: { allow: ["read"], deny: ["write", "exec", "browser"] } },
      { id: "public", sandbox: { mode: "all", scope: "agent", workspaceAccess: "none" },
        tools: { deny: ["read", "write", "exec", "browser", "canvas", "cron", "gateway"] } },
    ],
  },
}
```

## Cross-Agent Memory Search
`agents.list[].memorySearch.qmd.extraCollections` — let one agent search another's QMD transcripts.

## Supported Multi-Account Channels
WhatsApp, Telegram, Discord, Slack, Signal, iMessage, IRC, Line, Google Chat, Mattermost, Matrix, Nextcloud Talk, Bluebubbles, Zalo, Nostr, Feishu.

## Verification
```bash
openclaw gateway restart
openclaw agents list --bindings
openclaw channels status --probe
```
