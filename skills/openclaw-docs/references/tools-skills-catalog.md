# OpenClaw Tools & Skills Complete Catalog

## Three-Layer Architecture

- **Tools**: Typed functions the agent can invoke (exec, browser, web_search, message, etc.)
- **Skills**: Markdown files injected into system prompts — context, constraints, step-by-step guidance
- **Plugins**: Packages registering channels, providers, tools, skills, speech, image gen, etc.

**Key distinction:** Skills are instruction manuals. Tools control actual capabilities. `tools.allow` determines what the agent CAN do.

---

## Built-in Tools (Complete List)

### File System
| Tool | Purpose | Risk |
|------|---------|------|
| `read` | Read file contents | Low |
| `write` | Create/modify files | Medium |
| `edit` | Edit existing files | Medium |
| `list` | List files/directories | Low |
| `search` | Search file contents (grep-like) | Low |
| `apply_patch` | Multi-hunk file patches | Medium |

### Execution
| Tool | Purpose | Risk |
|------|---------|------|
| `exec` | Run shell commands | **HIGH** |
| `process` | Manage background processes | **HIGH** |
| `code_execution` | Run sandboxed remote Python | Medium |

### Web
| Tool | Purpose | Risk |
|------|---------|------|
| `web_search` | Search the internet | Low |
| `x_search` | Search X/Twitter posts | Low |
| `web_fetch` | Fetch/download page content | Low |

### Browser
| Tool | Purpose | Risk |
|------|---------|------|
| `browser` | Control Chromium (navigate, click, screenshot, fill forms) | Medium |

### Communication
| Tool | Purpose | Risk |
|------|---------|------|
| `message` | Send messages across all channels | Medium |

### Media
| Tool | Purpose | Risk |
|------|---------|------|
| `image` | Analyze images | Low |
| `image_generate` | Generate images (DALL-E, etc.) | Low (costs credits) |
| `canvas` | Drive node Canvas (present, eval, snapshot) | Low |

### Memory
| Tool | Purpose | Risk |
|------|---------|------|
| `memory_search` | Semantic search across memory files | Low |
| `memory_get` | Read specific memory files | Low |

### Session Management
| Tool | Purpose | Risk |
|------|---------|------|
| `sessions_list` | List active sessions | Low |
| `sessions_history` | Read session transcripts | Low |
| `sessions_send` | Send message to another session | Medium |
| `sessions_spawn` | Spawn sub-agent | Medium |
| `sessions_yield` | Yield control in session | Low |
| `subagents` | Manage sub-agents | Medium |
| `session_status` | Check session state | Low |
| `agents_list` | List available agents | Low |

### Automation
| Tool | Purpose | Risk |
|------|---------|------|
| `cron` | Create/manage scheduled jobs (persists after chat!) | **HIGH** |
| `gateway` | Restart gateway, apply config (control-plane changes!) | **HIGH** |

### Devices
| Tool | Purpose | Risk |
|------|---------|------|
| `nodes` | Discover and target paired devices | Medium |

---

## Tool Groups (Shorthands for allow/deny)

| Group | Tools Included |
|-------|---------------|
| `group:runtime` | exec, bash, process, code_execution |
| `group:fs` | read, write, edit, apply_patch |
| `group:sessions` | sessions_list, sessions_history, sessions_send, sessions_spawn, sessions_yield, subagents, session_status |
| `group:memory` | memory_search, memory_get |
| `group:web` | web_search, x_search, web_fetch |
| `group:ui` | browser, canvas |
| `group:automation` | cron, gateway |
| `group:messaging` | message |
| `group:nodes` | nodes |
| `group:openclaw` | All built-in tools (excludes plugin tools) |

---

## Tool Profiles (Preset Allowlists)

| Profile | Description |
|---------|-------------|
| `full` | All tools (default) |
| `coding` | File I/O, runtime, sessions, memory, image |
| `messaging` | Messaging, session list/history/send/status |
| `minimal` | session_status only |

```json5
{ tools: { profile: "messaging" } }
```

---

## Tool Configuration

### Allow/Deny (Deny always wins)
```json5
{
  tools: {
    allow: ["read", "write", "exec", "web_search"],
    deny: ["gateway", "cron", "sessions_spawn"],
  },
}
```

### Per-Provider Restrictions
```json5
{
  tools: {
    byProvider: {
      "openai/*": { deny: ["exec", "browser"] },
    },
  },
}
```

### Per-Agent Tools
```json5
{
  agents: {
    list: [{
      id: "family",
      tools: { allow: ["read", "web_search"], deny: ["exec", "write", "browser"] },
    }],
  },
}
```

---

## Web Search Providers

Configure under `skills.entries` or via `openclaw configure --section web`:

| Provider | API Key Env | Notes |
|----------|-------------|-------|
| Brave Search | `BRAVE_SEARCH_API_KEY` | Default recommended |
| Perplexity | `PERPLEXITY_API_KEY` | AI-powered search |
| Gemini (Google) | `GOOGLE_GEMINI_API_KEY` | Google search via Gemini |
| Grok (xAI) | `XAI_API_KEY` | X/Twitter integrated |
| Kimi (Moonshot) | `MOONSHOT_API_KEY` | Chinese web search |
| Firecrawl | `FIRECRAWL_API_KEY` | Web scraping focused |

---

## Official Bundled Skills (53+)

### Notes & Knowledge
- **obsidian** — Obsidian vault integration
- **notion** — Notion workspace
- **apple-notes** — Apple Notes (macOS)
- **bear-notes** — Bear notes app

### Email & Communication
- **gog** — Google Workspace (Gmail, Calendar, Tasks, Drive, Docs, Sheets) — 14,000+ downloads
- **himalaya** — Email via himalaya CLI (IMAP/SMTP)

### Development
- **github** — GitHub repos, PRs, issues
- **code-review** — Code quality review
- **debug-assistant** — Error debugging
- **test-generator** — Unit test generation

### Productivity
- **summarize** — Extract content from URLs, videos, podcasts, files — 10,000+ downloads
- **task-manager** — Cross-platform task management
- **meeting-summary** — Meeting notes and action items

### Social Media
- **linkedin** — LinkedIn monitoring
- **reddit** — Reddit engagement
- **x** / **instagram-search** — Social media tracking

### Project Management
- **linear** — Linear issue tracking
- **trello** — Trello boards
- **asana** — Asana tasks
- **todoist** — Todoist tasks
- **clickup** — ClickUp workspace

### Health & Fitness
- **whoop** — WHOOP health metrics
- **apple-health** — Apple Health data
- **fitbit** — Fitbit tracking

### Business
- **stripe** — Payment monitoring
- **paypal** — PayPal transactions

### Smart Home
- **openhue** — Philips Hue lights
- **sonos** — Sonos speakers

### Email Marketing
- **kit** / **klaviyo** / **mailchimp** — Email platform campaigns

### Security
- **security-auditor** — Runtime monitoring and audit

### Self-Improvement
- **self-improving-agent** — Analyzes patterns, builds new skills

### Media
- **image-lab** — Image generation/editing
- **news-summary** — Topic monitoring and news digests

### 1Password
- **1password** — Vault access (WARNING: grants access to entire vault)

---

## ClawHub (Community Skills Registry)

- 13,700+ third-party skills
- VirusTotal scanning since Feb 2026
- Install: `openclaw skills install <slug>`
- Update all: `openclaw skills update --all`
- Browse: https://clawhub.com

### Safety Tips for Third-Party Skills
1. Check creator reputation and ratings
2. Review GitHub repo before installing
3. Flag skills requesting unusual permissions
4. Start with read-only access
5. Use sandboxed agents for untrusted skills

---

## Plugin-Provided Tools

| Plugin | Purpose |
|--------|---------|
| **Lobster** | Typed workflow runtime with resumable approvals |
| **LLM Task** | JSON-only LLM step for structured output |
| **Diffs** | Diff viewer and renderer |
| **OpenProse** | Markdown-first workflow orchestration |

---

## Practical Automation Patterns

### Daily Briefing
Combine `cron` (scheduling) + `message` (push notifications):
- Daily news digest to Telegram
- Email triage summary to Discord
- CI/CD status report to Slack

### Task Automation
Skills + tools for end-to-end workflows:
- Flight check-ins via browser automation
- Form submissions
- Competitive research and monitoring
- Payment/subscription monitoring

### Cost Control
- Use cheaper model for sub-agents: `agents.defaults.subagents.model`
- Default to Sonnet for casual tasks, Opus for complex
- Monitor at console.anthropic.com
