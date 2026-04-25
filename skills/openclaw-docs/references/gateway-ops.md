# OpenClaw Gateway Operations

## Remote Access

### Architecture
"One gateway service owns state + channels. Nodes are peripherals."
Message flow: Channel message -> Gateway processes -> Gateway calls node via WebSocket -> node returns result -> Gateway replies

**Only one gateway should run per host** unless intentionally isolated profiles.

### Three Common Patterns

1. **Always-on Gateway in tailnet**: Run on persistent host (VPS/home server), access via Tailscale/SSH
2. **Home desktop Gateway + remote laptop**: Laptop connects via macOS app Remote over SSH mode
3. **Laptop Gateway + remote access**: Keep local, expose via SSH tunnel or Tailscale Serve

### SSH Tunnel
```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

### CLI Remote Config
Set `gateway.mode: "remote"` with remote URL/token.

### Credential Precedence
1. Explicit credentials always win
2. CLI URL overrides never reuse implicit credentials
3. Environment URL overrides use env credentials only
4. Local mode defaults: env vars priority
5. Remote mode defaults: gateway.remote settings priority

---

## Tailscale Integration

### Three Modes
- **Serve** (recommended): Tailnet-only HTTPS via `tailscale serve`, Gateway stays on loopback
- **Funnel**: Public HTTPS via `tailscale funnel` (requires password auth)
- **Off**: Default, no Tailscale automation

### Serve Config
```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve" },
  },
}
```
CLI: `openclaw gateway --tailscale serve`
Access: `https://<magicdns>/`

### Tailscale Identity
When `gateway.auth.allowTailscale: true` (default for Serve), Control UI/WebSocket auth via Tailscale identity headers — no token needed. HTTP API endpoints still require token/password.

### Funnel (Public)
```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "funnel" },
    auth: { mode: "password", password: "replace-me" },
  },
}
```
**Refuses startup without password auth.** Prefer `OPENCLAW_GATEWAY_PASSWORD` env var.

### Requirements
- Tailscale CLI installed + authenticated
- Funnel: v1.38.3+, MagicDNS, HTTPS, funnel node attribute
- `resetOnExit`: Undo Serve/Funnel config on shutdown
- macOS Funnel: Requires open-source Tailscale variant

---

## Control UI

Vite + Lit SPA hosted by Gateway at `http://127.0.0.1:18789/`.

### Device Pairing
New browsers require one-time pairing approval (even on Tailscale).
- Local (127.0.0.1): Auto-approved
- Remote: Requires `openclaw devices approve <requestId>`

### Capabilities
- Chat (send, history, stream, inject, abort)
- Channel management (status, config, QR login)
- Sessions (list, per-session overrides)
- Cron jobs (CRUD, run history)
- Skills (enable/disable, install, API keys)
- Nodes (listing, capabilities)
- Exec approvals
- Config editing (form + raw JSON, base-hash guard)
- Debugging (status, health, models, event log, live log tailing)
- Updates

### Localization
English, Simplified Chinese, Traditional Chinese, Portuguese (BR), German, Spanish. Auto-detects browser locale.

### Remote Dev
Point UI to remote Gateway: `http://localhost:5173/?gatewayUrl=ws://<gateway-host>:18789`
Token via fragment: `#token=<gateway-token>`

---

## Troubleshooting

### Initial Diagnostics
```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Healthy: "Runtime: running", "RPC probe: ok", no blocking doctor issues.

### Common Issues

**Anthropic 429 Rate Limiting (Long Context)**
- Check if model has `params.context1m: true`
- Verify API key eligibility
- Solution: Disable `context1m`, use billing-enabled key, or configure fallbacks

**No Channel Replies**
- Check `openclaw channels status --probe`
- Look for: "drop guild message (mention required", "pairing request", "blocked"/"allowlist"
- Verify: pending pairing, mention config, allowlist matches

**Control UI Connection Issues**
- "device identity required" — non-secure context
- "AUTH_TOKEN_MISMATCH" — token mismatch, run recovery
- "PAIRING_REQUIRED" — `openclaw devices approve <requestId>`

**Gateway Won't Start**
- "set gateway.mode=local" — needs `gateway.mode="local"` config
- "refusing to bind ... without auth" — non-loopback needs token/password
- "EADDRINUSE" — port conflict

**Channel Connected But Dead**
- Check DM policy, group allowlist, mention requirements
- Look for: "mention required", "missing_scope", "Forbidden", "401/403"

**Cron/Heartbeat Issues**
- `openclaw cron status`, `openclaw cron list`, `openclaw cron runs --id <jobId>`
- "scheduler disabled", "quiet-hours", "unknown accountId", "dm-blocked"

**Node/Tool Failures**
- "NODE_BACKGROUND_UNAVAILABLE" — app needs foreground
- "*_PERMISSION_REQUIRED" — missing OS permissions
- "SYSTEM_RUN_DENIED" — pending approval or allowlist miss

**Browser Issues**
- "unknown command 'browser'" — `plugins.allow` excludes browser
- "Failed to start Chrome CDP" — browser launch failed
- "browser.executablePath not found" — invalid path

**Post-Upgrade**
- Check `gateway.mode`, `gateway.remote.url`, `gateway.auth.mode`
- Non-loopback binds need `gateway.auth.token` (not old `gateway.token`)
- Reinstall: `openclaw gateway install --force && openclaw gateway restart`

### macOS Persistent SSH Tunnel
1. SSH config with `LocalForward 127.0.0.1:18789`
2. `ssh-copy-id` for key auth
3. `openclaw config set gateway.remote.token "<token>"`
4. LaunchAgent plist with KeepAlive + RunAtLoad
5. `launchctl bootstrap gui/$UID ~/Library/LaunchAgents/ai.openclaw.ssh-tunnel.plist`
