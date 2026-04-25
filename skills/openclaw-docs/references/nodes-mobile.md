# OpenClaw Mobile Nodes & Device Integration

## Node Types
- macOS companion app
- iOS app
- Android app
- Headless node host

All connect via WebSocket to Gateway with specific role designation.

## Device Pairing
Nodes present device identity during connection. Gateway creates pairing request.
```bash
openclaw devices list                    # View pending
openclaw devices approve <requestId>     # Approve
openclaw nodes status                    # List connected nodes
openclaw nodes describe --node <id>      # Node details
```

## Canvas (WebView)

### Screenshots
```bash
openclaw nodes canvas snapshot --node <id> --format png
openclaw nodes canvas snapshot --node <id> --format jpg --max-width 1200 --quality 0.9
```

### Controls
- Present URLs/files
- Hide, navigate
- Evaluate JavaScript
- Push text and JSONL payloads (A2UI/Canvas v0.8)

**Foreground required** — returns `NODE_BACKGROUND_UNAVAILABLE` if app is backgrounded.

## Camera

### Photos
```bash
openclaw nodes camera snap --node <id>
# front/default shows both facings (2 MEDIA lines)
```

### Video
```bash
openclaw nodes camera clip --node <id> --duration 10s
# Optional: --no-audio
# Duration clamped to <=60 seconds
```

### Permissions
Android prompts for `CAMERA`/`RECORD_AUDIO`. Denied = fail with error code.

## Android Device Commands

When capabilities enabled, Android nodes expose:

| Family | Commands |
|--------|----------|
| Device | `device.status`, `device.info`, `device.permissions`, `device.health` |
| Notifications | `notifications.list`, `notifications.actions` |
| Photos | `photos.latest` |
| Contacts | `contacts.search`, `contacts.add` |
| Calendar | `calendar.events`, `calendar.add` |
| Call Log | `callLog.search` |
| SMS | `sms.search`, `sms.send` (requires SMS permission + telephony) |
| Motion | `motion.activity`, `motion.pedometer` |

## Location Services
```
location.get
```
Off by default. Returns lat/lon, accuracy (meters), timestamp.

## Node Execution
`exec host=node` — the only shell-execution path for nodes.
- Requires paired node
- For multiple nodes: set `exec.node` or `tools.exec.node`
- Approval controlled by `~/.openclaw/exec-approvals.json`

### Node Command Policy
- `gateway.nodes.allowCommands` / `denyCommands` — coarse global policy
- Per-node exec approvals file — fine-grained control

## Browser via Node Host
Remote gateway can route browser actions to node with local browser.
- Keep Gateway + node on same tailnet
- `nodeHost.browserProxy.allowProfiles` for least-privilege
- Disable: `gateway.nodes.browser.mode="off"`

## Node Troubleshooting

| Error | Cause | Fix |
|-------|-------|-----|
| `NODE_BACKGROUND_UNAVAILABLE` | App backgrounded | Bring to foreground |
| `*_PERMISSION_REQUIRED` | Missing OS permission | Grant in device settings |
| `SYSTEM_RUN_DENIED: approval required` | Pending exec approval | `openclaw approvals get --node <id>` |
| `SYSTEM_RUN_DENIED: allowlist miss` | Command blocked | Update allowlist |

## Dynamic Skills via Nodes
Connecting a macOS node makes macOS-only skills eligible. Skills execute via `exec` tool with `host=node`.

## Features Summary

### iOS
- Canvas, camera, location, voice
- Pairing + push notifications
- Relay-backed push support

### Android
- Canvas, voice, device commands
- Camera (photo + video)
- SMS, contacts, calendar, notifications
- Location, motion sensors

### macOS
- Full companion app (menu bar)
- Browser proxy
- System.run execution
- WebChat, Canvas
- Voice features, XPC
