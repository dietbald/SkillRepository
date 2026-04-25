# OpenClaw Configuration Reference

## Config Basics

OpenClaw reads optional JSON5 config from `~/.openclaw/openclaw.json`. JSON5 supports comments and trailing commas. Safe defaults apply when absent.

### Minimal Config
```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
  channels: { whatsapp: { allowFrom: ["+15555550123"] } },
}
```

## Config Management Methods

| Method | Command/Action |
|--------|---------------|
| Interactive | `openclaw onboard` / `openclaw configure` |
| CLI get | `openclaw config get agents.defaults.workspace` |
| CLI set | `openclaw config set agents.defaults.heartbeat.every "2h"` |
| CLI unset | `openclaw config unset plugins.entries.brave.config.webSearch.apiKey` |
| Control UI | `http://127.0.0.1:18789` Config tab (form + raw JSON editor) |
| Direct edit | Modify `~/.openclaw/openclaw.json` (auto hot-reload by Gateway) |

## Validation

Strict schema enforcement. Unknown keys, malformed types, or invalid values prevent Gateway startup. Only `$schema` key is allowed as root-level exception.

When validation fails:
- Gateway refuses to boot
- Only diagnostic commands work: `openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`
- Fix: `openclaw doctor` to identify issues, `openclaw doctor --fix` or `--yes` for auto-repair

---

## Model Configuration

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "anthropic/claude-sonnet-4-6",
        fallbacks: ["openai/gpt-5.2"],
      },
      models: {
        "anthropic/claude-sonnet-4-6": { alias: "Sonnet" },
        "openai/gpt-5.2": { alias: "GPT" },
      },
      imageMaxDimensionPx: 1200,  // controls vision-token usage
    },
  },
}
```

- `agents.defaults.models` defines catalog AND acts as allowlist for `/model` command
- Model refs use `provider/model` format (e.g., `anthropic/claude-opus-4-6`)
- Custom/self-hosted providers supported via base URL config

---

## Channel Configuration

All channels share DM access patterns under `channels.<provider>`:

**DM Policy Options:**
- `"pairing"` (default) — unknown senders receive one-time pairing code
- `"allowlist"` — only senders in `allowFrom` or paired allow store
- `"open"` — permit all inbound DMs (requires `allowFrom: ["*"]`)
- `"disabled"` — ignore all DMs

```json5
{
  channels: {
    telegram: {
      enabled: true,
      botToken: "123:abc",
      dmPolicy: "pairing",
      allowFrom: ["tg:123"],
    },
  },
}
```

---

## Group Chat Mention Gating

```json5
{
  agents: {
    list: [{
      id: "main",
      groupChat: { mentionPatterns: ["@openclaw", "openclaw"] },
    }],
  },
  channels: {
    whatsapp: { groups: { "*": { requireMention: true } } },
  },
}
```

Mention types: metadata mentions (native @-mentions) and text patterns (regex in `mentionPatterns`).

---

## Session Configuration

```json5
{
  session: {
    dmScope: "per-channel-peer",  // recommended for multi-user
    threadBindings: { enabled: true, idleHours: 24, maxAgeHours: 0 },
    reset: { mode: "daily", atHour: 4, idleMinutes: 120 },
  },
}
```

**DM Scope Options:**
- `main` — shared conversations
- `per-peer` — isolated by user
- `per-channel-peer` — recommended for multi-user
- `per-account-channel-peer` — maximum isolation

---

## Sandboxing

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main",  // off | non-main | all
        scope: "agent",    // session | agent | shared
      },
    },
  },
}
```

Build sandbox image first: `scripts/sandbox-setup.sh`

---

## Heartbeat

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",     // duration string; "0m" to disable
        target: "last",   // last | none | specific channel-id
      },
    },
  },
}
```

---

## Cron Jobs

```json5
{
  cron: {
    enabled: true,
    maxConcurrentRuns: 2,
    sessionRetention: "24h",
    runLog: { maxBytes: "2mb", keepLines: 2000 },
  },
}
```

---

## Webhooks

```json5
{
  hooks: {
    enabled: true,
    token: "shared-secret",
    path: "/hooks",
    defaultSessionKey: "hook:ingress",
    mappings: [{
      match: { path: "gmail" },
      action: "agent",
      agentId: "main",
      deliver: true,
    }],
  },
}
```

---

## Config File Inclusion

```json5
{
  gateway: { port: 18789 },
  agents: { $include: "./agents.json5" },
  broadcast: { $include: ["./clients/a.json5", "./clients/b.json5"] },
}
```

Rules:
- Single file replaces containing object
- Array of files deep-merged in order (later wins)
- Sibling keys merged after includes (override)
- Nested includes supported up to 10 levels
- Relative paths resolved from including file

---

## Config Hot Reload

Gateway watches `~/.openclaw/openclaw.json` and applies changes automatically.

| Mode | Behavior |
|------|----------|
| `hybrid` (default) | Hot-applies safe changes; auto-restarts for critical ones |
| `hot` | Hot-applies only; warns when restart needed |
| `restart` | Restarts on any change |
| `off` | Disables watching |

```json5
{ gateway: { reload: { mode: "hybrid", debounceMs: 300 } } }
```

**Hot-apply (no restart):** Channels, agents, models, automation, sessions, messages, tools, media, UI, bindings
**Restart required:** `gateway.*` (port, bind, auth, tailscale, TLS, HTTP), `discovery`, `canvasHost`, `plugins`

---

## Config RPC (Programmatic)

Rate limited: 3 requests per 60s per `deviceId+clientIp`.

### config.apply
Validates and writes full config, restarts Gateway. **Warning: replaces entire config.**
```bash
openclaw gateway call config.apply --params '{
  "raw": "{ agents: { defaults: { workspace: \"~/.openclaw/workspace\" } } }",
  "baseHash": "<hash>"
}'
```

### config.patch
Merges partial update (JSON merge patch semantics: objects merge recursively, `null` deletes key, arrays replace).
```bash
openclaw gateway call config.patch --params '{
  "raw": "{ channels: { telegram: { groups: { \"*\": { requireMention: false } } } } }",
  "baseHash": "<hash>"
}'
```

---

## Environment Variables

Sources (neither overrides existing env vars):
- `.env` from current working directory
- `~/.openclaw/.env` (global fallback)

### Inline Config
```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

### Shell Environment Import
```json5
{ env: { shellEnv: { enabled: true, timeoutMs: 15000 } } }
```
Or: `OPENCLAW_LOAD_SHELL_ENV=1`

### Variable Substitution in Config
```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```
Rules: Only uppercase `[A-Z_][A-Z0-9_]*` matched. Missing vars throw error. Escape: `$${VAR}`.

### Secret References (SecretRef)
```json5
{
  models: {
    providers: {
      openai: { apiKey: { source: "env", provider: "default", id: "OPENAI_API_KEY" } },
    },
  },
}
```
Types: `env` (environment), `file` (file-based), `exec` (executable-based)

---

## Channel Health Monitoring

```json5
{
  gateway: {
    channelHealthCheckMinutes: 5,
    channelStaleEventThresholdMinutes: 30,
    channelMaxRestartsPerHour: 10,
  },
  channels: {
    telegram: { healthMonitor: { enabled: false } },
  },
}
```

---

## iOS Push Relay

```json5
{
  gateway: {
    push: {
      apns: {
        relay: { baseUrl: "https://relay.example.com", timeoutMs: 10000 },
      },
    },
  },
}
```
CLI: `openclaw config set gateway.push.apns.relay.baseUrl https://relay.example.com`
