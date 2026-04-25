# OpenClaw Security Documentation

## Core Security Model

OpenClaw operates on a **personal assistant security model** — one trusted operator boundary per gateway. It is NOT a hostile multi-tenant boundary. For mixed-trust: separate gateways on different OS users/hosts.

## Quick Security Audit
```bash
openclaw security audit             # Basic audit
openclaw security audit --deep      # Deep scan
openclaw security audit --fix       # Auto-fix
openclaw security audit --json      # Machine-readable
```

Identifies: gateway auth exposure, browser control exposure, elevated allowlists, filesystem permissions, permissive execution, open-channel tool exposure.

## Hardened Baseline Config (Copy-Paste)

```json5
{
  gateway: {
    mode: "local",
    bind: "loopback",
    auth: { mode: "token", token: "replace-with-long-random-token" },
  },
  session: { dmScope: "per-channel-peer" },
  tools: {
    profile: "messaging",
    deny: ["group:automation", "group:runtime", "group:fs", "sessions_spawn"],
    fs: { workspaceOnly: true },
    exec: { security: "deny", ask: "always" },
    elevated: { enabled: false },
  },
  channels: {
    whatsapp: { dmPolicy: "pairing", groups: { "*": { requireMention: true } } },
  },
}
```

## Trust Boundary Matrix

| Control | Purpose | NOT |
|---------|---------|-----|
| `gateway.auth` | Authenticates callers to gateway APIs | Per-message signatures |
| `sessionKey` | Routing key for context/session | User auth boundary |
| Prompt guardrails | Reduce model abuse risk | Auth bypass proof |
| `canvas.eval` | Intentional operator capability | Automatic vulnerability |
| Node pairing | Operator-level remote execution | Untrusted user access |

## Credential Storage Map

| Credential | Location |
|-----------|----------|
| WhatsApp | `~/.openclaw/credentials/whatsapp/<accountId>/creds.json` |
| Telegram bot token | config/env or `channels.telegram.tokenFile` |
| Discord bot token | config/env or SecretRef |
| Slack tokens | config/env (`channels.slack.*`) |
| Pairing allowlists | `~/.openclaw/credentials/<channel>-allowFrom.json` |
| Model auth profiles | `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` |
| File-backed secrets | `~/.openclaw/secrets.json` |

## Key Security Audit Findings

| Finding | Severity | Fix |
|---------|----------|-----|
| `fs.state_dir.perms_world_writable` | Critical | Permissions on `~/.openclaw` |
| `fs.config.perms_writable` | Critical | Permissions on config file |
| `gateway.bind_no_auth` | Critical | `gateway.bind` + `gateway.auth.*` |
| `gateway.tailscale_funnel` | Critical | `gateway.tailscale.mode` |
| `security.exposure.open_groups_with_elevated` | Critical | Channel/tool policy |
| `tools.exec.security_full_configured` | Warn/Critical | `tools.exec.security` |

## Gateway Auth Modes

- `token`: Shared bearer token (recommended). Generate: `openclaw doctor --generate-gateway-token`
- `password`: Shared secret via `OPENCLAW_GATEWAY_PASSWORD` or config
- `trusted-proxy`: Trust identity-aware reverse proxy

Auth is **required by default** — no token/password = refuse all WebSocket connections (fail-closed).

## Network Exposure

Gateway multiplexes WebSocket + HTTP on single port (default 18789).

- `gateway.bind: "loopback"` (default): Only local clients
- Non-loopback (`"lan"`, `"tailnet"`, `"custom"`): Needs auth + firewall
- Prefer Tailscale Serve over LAN binds
- **Never** expose unauthenticated on `0.0.0.0`

## Reverse Proxy Config
```yaml
gateway:
  trustedProxies: ["127.0.0.1"]
  allowRealIpFallback: false
  auth:
    mode: password
    password: ${OPENCLAW_GATEWAY_PASSWORD}
```

## File Permissions
- `~/.openclaw/openclaw.json`: `600`
- `~/.openclaw`: `700`
- `openclaw doctor` warns and can tighten permissions

## DM Access Model

| Policy | Behavior |
|--------|----------|
| `pairing` (default) | Unknown senders get pairing code; 1hr expiry, max 3 pending |
| `allowlist` | Block unknown senders, no pairing |
| `open` | Allow anyone (requires `"*"` in allowFrom) |
| `disabled` | Ignore all DMs |

```bash
openclaw pairing list <channel>
openclaw pairing approve <channel> <code>
```

## Sandboxing

Two approaches:
- **Full Gateway in Docker**: Container boundary
- **Tool sandbox**: Host gateway + Docker-isolated tools

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        scope: "agent",         // session | agent | shared
        workspaceAccess: "none", // none | ro | rw
      },
    },
  },
}
```

`tools.elevated` is a global escape hatch running exec on host. Keep `tools.elevated.allowFrom` tight.

## Control Plane Tools Risk

Two tools make persistent changes:
- `gateway` tool: `config.apply`, `config.patch`, `update.run`
- `cron` tool: creates scheduled jobs persisting after chat ends

Deny for untrusted agents:
```json5
{ tools: { deny: ["gateway", "cron", "sessions_spawn", "sessions_send"] } }
```

## Browser Control Risks

- Prefer dedicated browser profile for agent (default: `openclaw`)
- Don't point agent at personal daily-driver profile
- Keep Gateway/node hosts tailnet-only
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: false` for strict mode

## Model Strength & Prompt Injection

- Latest/best-tier models for tool-enabled agents
- Older/weaker models: read-only tools, strong sandboxing, strict allowlists
- Chat-only + trusted input + no tools: smaller models OK

## Plugins Security
- Treat as trusted code (runs in-process)
- Install only from trusted sources
- Prefer `plugins.allow` allowlists
- OpenClaw scans before install; critical findings block by default
- Use `npm install --omit=dev`; prefer pinned versions

## Prompt Injection Mitigations
- Lock down DMs (pairing/allowlists)
- Mention gating in groups
- Treat links/attachments/pasted instructions as hostile
- Sandbox tool execution
- Keep secrets out of reachable filesystem
- Enable `tools.exec.strictInlineEval` for interpreter allowlists

## Incident Response

### Contain
1. Stop gateway: terminate process or stop macOS app
2. Set `gateway.bind: "loopback"`, disable Funnel/Serve
3. Switch DMs/groups to `disabled` / require mentions

### Rotate (if secrets leaked)
1. Rotate `gateway.auth.token` / password, restart
2. Rotate remote client secrets
3. Rotate provider/API credentials

### Audit
1. Check logs: `/tmp/openclaw/openclaw-YYYY-MM-DD.log`
2. Review transcripts: `~/.openclaw/agents/<agentId>/sessions/*.jsonl`
3. Review config changes
4. Re-run `openclaw security audit --deep`

## Log Redaction
- `logging.redactSensitive: "tools"` (default): Redact tool summaries
- `logging.redactPatterns`: Custom patterns
- Prefer `openclaw status --all` (redacted) over raw logs for diagnostics
- Prune old session transcripts

## Reporting Vulnerabilities
Email: security@openclaw.ai — don't post publicly until fixed.
