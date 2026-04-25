# OpenClaw Channel Documentation

## Supported Channels

**Built-in:** WhatsApp, Telegram, Discord, iMessage
**Plugin-based:** Mattermost, Matrix, Microsoft Teams, Nostr, Slack, Signal, Google Chat

---

# WhatsApp

## Setup
1. Install: `openclaw channels login --channel whatsapp` (or `openclaw onboard`)
2. Configure access policy in `channels.whatsapp`
3. Start gateway: `openclaw gateway`
4. Approve pairing: `openclaw pairing approve whatsapp <CODE>` (codes expire 1hr, max 3 pending)

**Dedicated number recommended** — clearer routing, less self-chat confusion.

## Config
```json5
{
  channels: {
    whatsapp: {
      dmPolicy: "pairing",        // pairing | allowlist | open | disabled
      allowFrom: ["+15555550123"],
      groupPolicy: "allowlist",   // open | allowlist | disabled
      groupAllowFrom: [],
      groups: { "*": { requireMention: true } },
      textChunkLimit: 4000,
      chunkMode: "length",        // length | newline
      mediaMaxMb: 50,
      sendReadReceipts: true,
      reactionLevel: "minimal",   // off | ack | minimal | extensive
      historyLimit: 50,           // 0 disables
    },
  },
}
```

## Multi-Account
```bash
openclaw channels login --channel whatsapp --account personal
openclaw channels login --channel whatsapp --account biz
```

## Key Behaviors
- Web-based implementation using Baileys
- Status/broadcast chats ignored
- Group sessions isolated: `agent:<agentId>:whatsapp:group:<jid>`
- Ack reactions configurable per DM/group
- Media: image, video, audio (PTT voice notes), documents
- `selfChatMode: true` for personal-number usage

## Troubleshooting
- Not linked: `openclaw channels login --channel whatsapp`
- Disconnected: `openclaw doctor` + `openclaw logs --follow`
- Group ignored: Check `groupPolicy`, `groupAllowFrom`, `groups` allowlist, mention gating
- **Bun incompatible** — use Node for WhatsApp/Telegram gateway

---

# Telegram

## Setup
1. Create bot via @BotFather (`/newbot`)
2. Configure:
```json5
{
  channels: {
    telegram: {
      enabled: true,
      botToken: "123:abc",       // or env: TELEGRAM_BOT_TOKEN
      dmPolicy: "pairing",
      groups: { "*": { requireMention: true } },
    },
  },
}
```
3. Start gateway: `openclaw gateway`
4. Approve: `openclaw pairing approve telegram <CODE>`

## Privacy Mode
Bots receive limited group messages by default. To get all: disable privacy via `/setprivacy` in BotFather OR grant admin status.

## Access Control
- `dmPolicy`: pairing | allowlist | open | disabled
- `allowFrom`: numeric Telegram user IDs (find via logs: `from.id`)
- `groupPolicy`: open | allowlist | disabled
- `groups`: per-group config (negative group/supergroup IDs)

### Per-Group Example
```json5
{
  channels: {
    telegram: {
      groups: {
        "-1001234567890": {
          groupPolicy: "open",
          requireMention: false,
        },
      },
    },
  },
}
```

## Features
- **Streaming**: `off | partial | block | progress` (default: `partial`)
- **Inline buttons**: `off | dm | group | all | allowlist`
- **Forum topics**: `:topic:<threadId>` appended to session keys, per-topic agent routing
- **Reply tags**: `[[reply_to_current]]`, `[[reply_to:<id>]]`
- **Audio**: `[[audio_as_voice]]` tag for voice notes
- **Video notes**: `asVideoNote: true`
- **Stickers**: Static WEBP processed, animated TGS/WEBM skipped
- **Reactions**: `reactionNotifications: off | own | all`, `reactionLevel: off | ack | minimal | extensive`
- **Native commands**: `commands.native: "auto"`, custom via `customCommands`
- **Exec approvals**: Button-based in DMs and channels
- **Polls**: `openclaw message poll --channel telegram --target <id> --poll-question "?" --poll-option "A" --poll-option "B"`

## Webhook Mode (Alternative to Long Polling)
```json5
{
  channels: {
    telegram: {
      webhookUrl: "[public_url]",
      webhookSecret: "[secret]",
      webhookPort: 8787,
    },
  },
}
```

## Config Reference Keys
`enabled`, `botToken`, `tokenFile`, `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `streaming`, `textChunkLimit`, `chunkMode`, `linkPreview`, `mediaMaxMb`, `timeoutSeconds`, `retry`, `replyToMode`, `capabilities.inlineButtons`, `actions.*`, `reactionNotifications`, `reactionLevel`, `ackReaction`, `configWrites`, `historyLimit`, `dmHistoryLimit`, `customCommands`, `webhookUrl/Secret/Path/Host/Port`, `proxy`, `network.*`, `execApprovals.*`

## Troubleshooting
- Unresponsive in groups: Check privacy mode (`/setprivacy`), `requireMention`, membership
- Polling issues: Try `proxy: "socks5://..."`, `network.dnsResultOrder: "ipv4first"`
- `BOT_COMMANDS_TOO_MUCH`: Reduce commands or disable native menus

---

# Discord

## Setup
1. Create app at Discord Developer Portal
2. Enable intents: **Message Content** (required), **Server Members** (recommended), **Presence** (optional)
3. Generate bot token
4. OAuth2 URL with scopes `bot` + `applications.commands`, permissions: View Channels, Send Messages, Read Message History, Embed Links, Attach Files, Add Reactions
5. Configure:
```bash
export DISCORD_BOT_TOKEN="YOUR_TOKEN"
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN
openclaw config set channels.discord.enabled true --strict-json
openclaw gateway
```
6. Approve pairing: `openclaw pairing approve discord <CODE>`

## Guild Configuration
```json5
{
  channels: {
    discord: {
      groupPolicy: "allowlist",
      guilds: {
        "SERVER_ID": {
          requireMention: true,
          ignoreOtherMentions: true,
          users: ["USER_ID"],
          roles: ["ROLE_ID"],
          channels: {
            general: { allow: true },
            help: { allow: true, requireMention: true },
          },
        },
      },
    },
  },
}
```

## Features
- **Components v2**: Buttons, select menus, modals, media galleries
- **Streaming**: `off | partial | block | progress` (default: `off` — rate limit concern)
- **Thread bindings**: `/focus`, `/unfocus`, `/agents`, `/session idle/max-age`
- **Reply tags**: `[[reply_to_current]]`, `[[reply_to:<id>]]`
- **Voice channels**: Join/leave via `/vc`, auto-join config, DAVE encryption
- **Voice messages**: OGG/Opus with auto-waveform (requires ffmpeg)
- **Presence**: Status, activity types (Playing/Streaming/Listening/Watching/Custom/Competing)
- **Auto presence**: Maps runtime health to Discord status
- **Reactions**: `off | own | all | allowlist`
- **PluralKit**: Resolve proxied messages to system members
- **Exec approvals**: Button-based
- **Role-based routing**: `bindings[].match.roles` for per-role agent assignment
- **Persistent ACP bindings**: Stable always-on ACP workspaces in channels

## Action Gates (Default: enabled unless noted)
- Enabled: reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions
- Disabled by default: roles, moderation, presence

## Troubleshooting
- Missing intents: Enable in Developer Portal, restart gateway
- Guild blocked: Check `groupPolicy`, guild allowlist, channel allowlist
- `requireMention: false` still blocked: Check `groupPolicy="allowlist"` + missing guild entry
- Bot loops: Use `allowBots: "mentions"` instead of `true`
- Listener timeouts: Increase `eventQueue.listenerTimeout`, `inboundWorker.runTimeoutMs`
