# OpenClaw Additional Channels: Slack, Signal, iMessage

---

## Slack

### Socket Mode Setup (Default)
1. Create Slack app, enable Socket Mode
2. Create App Token (`xapp-...`) with `connections:write` scope
3. Install app, copy Bot Token (`xoxb-...`)
4. Configure:
```json5
{
  channels: {
    slack: {
      enabled: true,
      mode: "socket",
      appToken: "xapp-...",
      botToken: "xoxb-...",
    },
  },
}
```
Env fallback: `SLACK_APP_TOKEN`, `SLACK_BOT_TOKEN` (default account only)

### HTTP Events API Mode
```json5
{
  channels: {
    slack: {
      enabled: true,
      mode: "http",
      botToken: "xoxb-...",
      signingSecret: "your-signing-secret",
      webhookPath: "/slack/events",
    },
  },
}
```

### Required Bot Events
`app_mention`, `message.channels`, `message.groups`, `message.im`, `message.mpim`, `reaction_added`, `reaction_removed`, `member_joined_channel`, `member_left_channel`, `channel_rename`, `pin_added`, `pin_removed`

### Required Bot Scopes
`chat:write`, `channels:history`, `channels:read`, `groups:history`, `im:history`, `im:read`, `im:write`, `mpim:history`, `mpim:read`, `mpim:write`, `users:read`, `app_mentions:read`, `assistant:write`, `reactions:read`, `reactions:write`, `pins:read`, `pins:write`, `emoji:read`, `commands`, `files:read`, `files:write`

### Features
- **Native Streaming**: `nativeStreaming: true` (default) uses Slack AI Apps API (`chat.startStream/appendStream/stopStream`)
- **Interactive Replies**: `capabilities.interactiveReplies: true` — agents emit `[[slack_buttons:...]]` and `[[slack_select:...]]` directives
- **Slash Commands**: Single command mode or native commands
- **User Token**: Optional `xoxp-...` for read-only directory/search access
- **Typing Reaction**: `typingReaction: "hourglass_flowing_sand"` during processing
- **Threading**: `replyToMode`, `replyToModeByChatType`, `thread.historyScope`

### Access Control
Same pattern as other channels: `dmPolicy`, `allowFrom`, `groupPolicy`, `channels.<id>`, `channels.<id>.users`, `channels.<id>.requireMention`

### Troubleshooting
- Socket not connecting: Check both tokens + Socket Mode enabled in Slack
- HTTP not receiving: Check signing secret, webhook path, Request URLs
- No replies in channels: Check `groupPolicy`, channel allowlist, `requireMention`

---

## Signal

### Prerequisites
- `signal-cli` installed on gateway host
- Phone number for SMS verification (or QR link to existing account)

### Setup
**QR Linking** (easiest): `signal-cli link -n "OpenClaw"` — scan in Signal app
**Dedicated Registration**: Register new number with SMS verification

**Warning:** Registering with signal-cli can de-authenticate your main Signal app.

### Configuration
```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15551234567",
      cliPath: "signal-cli",
      dmPolicy: "pairing",
      allowFrom: ["+15557654321"],
    },
  },
}
```

### Key Settings
| Field | Default | Purpose |
|-------|---------|---------|
| `account` | — | Bot E.164 number |
| `cliPath` | "signal-cli" | Path to CLI |
| `dmPolicy` | "pairing" | DM access |
| `httpUrl` | — | External daemon URL |
| `autoStart` | true | Auto-spawn daemon |
| `groupPolicy` | "allowlist" | Group access |
| `historyLimit` | 50 | Group context |
| `textChunkLimit` | 4000 | Message length |
| `mediaMaxMb` | 8 | Media size cap |

### External Daemon Mode
For avoiding JVM cold starts:
```json5
{ channels: { signal: { httpUrl: "http://localhost:8080", autoStart: false } } }
```

### Delivery Targets
- DMs: `signal:+1555...` or bare E.164
- UUID: `uuid:<id>`
- Groups: `signal:group:<groupId>`

---

## iMessage

### Status
Legacy integration — **new deployments should use BlueBubbles instead**.

### Requirements
- macOS with Messages signed in
- Full Disk Access for the process running OpenClaw/imsg
- `imsg` CLI installed: `brew install imsg`

### Configuration
```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "imsg",
      dbPath: "~/Library/Messages/chat.db",
      dmPolicy: "pairing",
      allowFrom: ["+15551234567"],
    },
  },
}
```

### Remote Mac via SSH
```json5
{
  channels: {
    imessage: {
      cliPath: "/path/to/ssh-wrapper.sh",
      remoteHost: "user@mac-host",
    },
  },
}
```

### Deployment Patterns
- **Dedicated bot macOS user**: Separate Apple ID, isolated Messages
- **Remote Mac via Tailscale**: Gateway on Linux, imsg on Mac in tailnet
- **Multi-account**: `channels.imessage.accounts` with per-account overrides

### ACP Bindings
`/acp spawn codex --bind here` works in iMessage conversations. Persistent bindings via top-level `bindings[]` with `type: "acp"`.

### Key Settings
- `includeAttachments`: Enable inbound attachment ingestion
- `attachmentRoots` / `remoteAttachmentRoots`: Allowed paths for attachments
- `textChunkLimit`: 4000 (default)
- `mediaMaxMb`: 16 (default)

### Mention Detection
iMessage lacks native mentions — uses regex patterns from `mentionPatterns` config.

---

## Other Plugin Channels (Brief)

### Google Chat
Plugin-based. Requires Google Workspace service account. Config under `channels.googlechat` with `serviceAccountRef` for authentication.

### Mattermost
Plugin-based. Bot token auth. Config under `channels.mattermost`.

### Matrix
Plugin-based. Homeserver URL + access token. Config under `channels.matrix`.

### Microsoft Teams
Plugin-based. Azure AD app registration. Config under `channels.teams`.

### Nostr
Plugin-based. NIP-04 encrypted DMs. Config under `channels.nostr`.

### IRC / Line / Zalo / Feishu / Nextcloud Talk / BlueBubbles
All plugin-based with channel-specific configuration under `channels.<name>`.

### Supported Multi-Account Channels (Full List)
WhatsApp, Telegram, Discord, Slack, Signal, iMessage, IRC, Line, Google Chat, Mattermost, Matrix, Nextcloud Talk, BlueBubbles, Zalo, Nostr, Feishu
