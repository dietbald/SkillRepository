# OpenClaw Tools Reference

## Browser Automation

### Profiles
- **openclaw**: Separate, isolated agent browser (default)
- **user**: Attach to existing signed-in Chrome via Chrome MCP
- **Custom**: Named configs with different CDP ports, colors, drivers

### Configuration
```json5
{
  browser: {
    enabled: true,
    defaultProfile: "openclaw",
    executablePath: "/path/to/browser",  // override auto-detection
    ssrfPolicy: {
      dangerouslyAllowPrivateNetwork: false,
      hostnameAllowlist: ["*.example.com"],
    },
  },
}
```

Auto-detection order: Chrome, Brave, Edge, Chromium, Chrome Canary.

### Control Architecture
- Local: Gateway starts loopback control on ports 18791+
- Remote CDP: `browser.profiles.<name>.cdpUrl`
- Node host: Auto-route to node with local browser
- Hosted: Browserless, Browserbase, or any WebSocket CDP

### Key Commands
```bash
openclaw browser start --browser-profile openclaw
openclaw browser status
openclaw browser tabs
openclaw browser open <url>
openclaw browser snapshot                    # AI snapshot (numeric refs)
openclaw browser snapshot --interactive      # Role snapshot (e12 refs)
openclaw browser snapshot --efficient        # Compact interactive
openclaw browser screenshot                  # Viewport capture
openclaw browser screenshot --full-page      # Full page
openclaw browser click <ref>
openclaw browser type <ref> "text" --submit
openclaw browser press <key>
openclaw browser hover <ref>
openclaw browser select <ref> <options>
openclaw browser download <ref> <filename>
openclaw browser upload <filepath>
openclaw browser cookies
openclaw browser console --level error
openclaw browser pdf
```

### Snapshot Modes
- `--format ai` (default): Numeric refs for actions
- `--format aria`: Accessibility tree, no refs
- `--interactive`: Flat list of interactive elements
- `--efficient`: Compact interactive
- `--labels`: Viewport screenshot with ref overlays

Refs are NOT stable across navigations — re-run snapshot after navigation.

### State Management
```bash
openclaw browser set offline on|off
openclaw browser set headers --headers-json '{"X-Debug":"1"}'
openclaw browser set credentials <user> <pass>
openclaw browser set geo <lat> <lon> --origin "<url>"
openclaw browser set media dark|light
openclaw browser set timezone America/New_York
openclaw browser set device "iPhone 14"
```

### Existing-Session (Chrome MCP)
Attaches to running browser via Chrome DevTools. Reuses login state. **Higher risk.**
- Browser 144+, remote debugging enabled
- User must approve connection
- `driver: "existing-session"`, `attachOnly: true`

### Remote Services
- **Browserless**: `cdpUrl: "wss://production-sfo.browserless.io?token=<KEY>"`
- **Browserbase**: `cdpUrl: "wss://connect.browserbase.com?apiKey=<KEY>"` (auto-creates session)

---

## Exec Tool (Shell Execution)

### Parameters
- `command` (required)
- `workdir`, `env`, `yieldMs` (10s default), `background`, `timeout` (1800s), `pty`
- `host`: `auto | sandbox | gateway | node`
- `security`: `deny | allowlist | full`
- `ask`: `off | on-miss | always`

### Host Defaults
- `auto`: sandbox if active, else gateway
- Sandboxed: `security=deny` default
- Gateway/Node: `security=allowlist` default

### Security Modes
- **deny**: All commands blocked
- **allowlist**: Only explicitly allowed binaries
- **full**: All commands allowed

### Safe Bins
`tools.exec.safeBins`: Stdin-only binaries that run without allowlist. **Never add interpreters** (python3, node, bash).

### Strict Inline Eval
`tools.exec.strictInlineEval: true` — requires approval for `python -c`, `node -e`, `ruby -e`, `perl -e`, etc.

### Approval Gates
Returns `status: "approval-pending"` with approval ID. Controlled by `~/.openclaw/exec-approvals.json`.

### PATH Handling
- Gateway: Merges login-shell PATH; rejects `env.PATH` overrides
- Sandbox: Runs `sh -lc`; prepends `env.PATH`
- Node: Rejects `env.PATH`; configure via service environment

### Session Override
```
/exec host=auto security=allowlist ask=on-miss node=mac-1
```

### Apply Patch (Sub-tool)
```json5
{
  tools: {
    exec: {
      applyPatch: {
        enabled: true,
        workspaceOnly: true,
      },
    },
  },
}
```

---

## Cron Jobs

### Configuration
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

### CLI
```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
```

### Delivery Modes
- Isolated jobs: announcement summary delivery
- Main-session jobs: webhook and none modes
- Webhook: `delivery.mode = "webhook"`, `delivery.to = "https://..."`, optional `cron.webhookToken`

### Features
- Delete-after-run capability
- Agent model/thinking overrides
- Cron expression stagger/exact options
- Best-effort delivery toggles

---

## Tool Profiles

Common tool deny patterns for security:
```json5
{
  tools: {
    profile: "messaging",  // predefined profile
    deny: ["group:automation", "group:runtime", "group:fs", "sessions_spawn"],
    fs: { workspaceOnly: true },
    exec: { security: "deny", ask: "always" },
    elevated: { enabled: false },
  },
}
```

### Per-Agent Tool Config
```json5
{
  agents: {
    list: [{
      id: "family",
      tools: {
        allow: ["read"],
        deny: ["write", "edit", "apply_patch", "exec", "process", "browser"],
      },
    }],
  },
}
```

### Read-Only Mode
- `agents.defaults.sandbox.workspaceAccess: "ro"` (or `"none"`)
- Deny: `write`, `edit`, `apply_patch`, `exec`, `process`
- `tools.exec.applyPatch.workspaceOnly: true` (default)
- `tools.fs.workspaceOnly: true` (optional)
