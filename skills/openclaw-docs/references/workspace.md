# OpenClaw Workspace, Memory & Skills

## Workspace Overview

The workspace is the agent's working directory and memory store, separate from config at `~/.openclaw/`.
Default: `~/.openclaw/workspace` (or `~/.openclaw/workspace-<profile>`)

## Workspace Files

| File | Purpose | Loaded When | Sub-agents? |
|------|---------|-------------|-------------|
| `AGENTS.md` | Boot sequence, checklists, behavioral rules | Every turn | Yes |
| `SOUL.md` | Persona, tone, values, boundaries | Every turn | Yes |
| `TOOLS.md` | Notes about local tools/conventions (guidance only) | Every turn | Yes |
| `USER.md` | Human profile, preferences, address protocol | Every turn | Yes |
| `IDENTITY.md` | Agent name, vibe, emoji | Every turn | Yes |
| `HEARTBEAT.md` | Periodic check tasks (keep brief) | Heartbeat turns | Depends |
| `BOOT.md` | Startup checklist on gateway restart (needs hooks) | Gateway start | No |
| `BOOTSTRAP.md` | One-time init ritual, deleted after completion | New workspaces | No |
| `MEMORY.md` | Curated long-term memory | Main sessions only | No |
| `memory/YYYY-MM-DD.md` | Daily logs (today + yesterday loaded) | Per boot sequence | No |
| `checklists/*.md` | Step-by-step ops guides | On demand | No |
| `skills/` | Workspace-specific skills | Session start | N/A |
| `canvas/` | UI files for node displays | On demand | N/A |

**Security:** MEMORY.md must NEVER load in group chats or sub-agent sessions.

**Token budget:** ~20,000 chars per file, ~150,000 chars total across bootstrap files.

## Critical: NOT in Workspace
Credentials, session transcripts, managed skills reside under `~/.openclaw/` — never version-controlled.

## Git Backup
```bash
git init
git add AGENTS.md SOUL.md TOOLS.md IDENTITY.md USER.md HEARTBEAT.md memory/
git commit -m "initial workspace"
# Add private remote, push
```

## Setup
`openclaw setup --workspace <path>` seeds any missing files.

---

## Memory System

### Core Files
- **MEMORY.md**: Long-term durable facts/preferences/decisions. Loaded at start of each DM session.
- **memory/YYYY-MM-DD.md**: Daily notes. Today + yesterday auto-loaded.

### Memory Tools
- `memory_search`: Hybrid search (vector similarity + keyword matching)
- `memory_get`: Read specific files or line ranges

### Auto-Detection of Embedding Providers
From available API keys: OpenAI, Gemini, Voyage, Mistral

### Memory Backends
1. **Builtin** (default): SQLite, keyword + vector + hybrid search
2. **QMD**: Local-first sidecar with reranking, query expansion, cross-directory indexing
3. **Honcho**: AI-native cross-session memory with user modeling

### Automatic Memory Flush
Before compaction summarizes conversations, a silent turn reminds agent to save context (enabled by default).

### CLI
```bash
openclaw memory status           # Check index/provider
openclaw memory search "query"   # Search
openclaw memory index --force    # Rebuild index
```

---

## Skills System

### SKILL.md Format
```markdown
---
name: skill-name
description: Brief explanation
---
Instructions here. Use {baseDir} for skill folder path.
```

Optional frontmatter:
- `homepage` — URL for Skills UI
- `user-invocable` — Boolean (default: true) for slash command exposure
- `disable-model-invocation` — Boolean (default: false) to exclude from prompts
- `command-dispatch: tool` — Bypass model, dispatch directly
- `command-tool` — Tool name for direct dispatch
- `command-arg-mode` — Default `raw`

### Loading Precedence (highest to lowest)
1. Workspace: `<workspace>/skills`
2. Project agent: `<workspace>/.agents/skills`
3. Personal agent: `~/.agents/skills`
4. Managed/local: `~/.openclaw/skills`
5. Bundled (shipped with install)
6. Extra dirs: `skills.load.extraDirs`

### Metadata & Gating
Single-line JSON in `metadata` frontmatter key:
```
metadata: {"openclaw": {"always": true, "emoji": "...", "os": ["darwin","linux"], "requires": {"bins": ["ffmpeg"], "env": ["API_KEY"]}, "primaryEnv": "API_KEY"}}
```

Gates: `os`, `requires.bins`, `requires.anyBins`, `requires.env`, `requires.config`

### Config Overrides
```json5
{
  skills: {
    entries: {
      "skill-name": {
        enabled: true,
        apiKey: { source: "env", provider: "default", id: "ENV_VAR" },
        env: { VAR: "value" },
        config: { customField: "value" },
      },
    },
    allowBundled: ["skill1", "skill2"],  // optional restrict bundled
  },
}
```

### ClawHub Registry
```bash
openclaw skills install <skill-slug>    # Install from ClawHub
openclaw skills update --all            # Update all
```

### Skills Watcher
Auto-refreshes when SKILL.md files change:
```json5
{ skills: { load: { watch: true, watchDebounceMs: 250 } } }
```

### Token Cost
- Base: 195 chars (when >=1 skill)
- Per-skill: 97 chars + escaped name/description/location
- ~4 chars/token, so ~24 tokens per skill

### Security
- Treat third-party skills as untrusted code
- Sandbox for untrusted inputs
- Skill discovery restricted to configured roots
- `skills.entries.*.env` injects into host process (not sandbox)

### Installation Specs
Supports: brew, node (npm/pnpm/yarn/bun), go, download (with archive extraction)
