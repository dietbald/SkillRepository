# Browser Pilot — CLI Command Reference

Base command: `node C:\Users\thiba\Documents\skillTest\src\cli.js`

All commands output JSON to stdout.

---

## Session Management

### `start`
Launch a new browser instance.

```bash
browser-pilot start [--visible] [--width <number>] [--height <number>] [--output-dir <path>]
```

| Flag | Default | Description |
|------|---------|-------------|
| `--visible` | `false` | Launch in non-headless mode (visible browser window) |
| `--width` | `1280` | Viewport width in pixels |
| `--height` | `720` | Viewport height in pixels |
| `--output-dir` | `./output` | Custom output directory for screenshots and recordings |

**Output**:
```json
{
  "success": true,
  "action": "start",
  "headless": false,
  "wsEndpoint": "ws://127.0.0.1:XXXXX/devtools/browser/...",
  "outputDir": "C:\\Users\\...\\output"
}
```

### `stop`
Stop recording if active, close the browser, and clean up the session.

```bash
browser-pilot stop
```

**Output**:
```json
{ "success": true, "action": "stop" }
```

---

## Navigation

### `goto <url>`
Navigate to a URL. **Only allowed once per session** (the initial navigation).

```bash
browser-pilot goto "https://example.com"
```

**Output**:
```json
{
  "success": true,
  "action": "goto",
  "target": "https://example.com",
  "screenshot": "output/screenshots/step-01-goto.png",
  "pageUrl": "https://example.com/",
  "pageTitle": "Example Domain"
}
```

**Error** (if used a second time):
```json
{
  "success": false,
  "action": "goto",
  "error": "Navigation already used. Only one initial \"goto\" is allowed per session."
}
```

---

## Interaction Commands

### `click <text>`
Click an interactive element by its visible text.

```bash
browser-pilot click "Confirm Order"
```

The element finder searches: exact text → partial text → placeholder → label → aria-label → title → value.

**Output**:
```json
{
  "success": true,
  "action": "click",
  "target": "Confirm Order",
  "matchType": "exact-text",
  "matchedText": "Confirm Order",
  "screenshot": "output/screenshots/step-05-click.png",
  "annotatedScreenshot": "output/screenshots/step-05-click-annotated.png",
  "elementBox": { "x": 120, "y": 340, "width": 150, "height": 40 },
  "pageUrl": "https://...",
  "pageTitle": "Purchase Order - Odoo"
}
```

**Error** (element not found):
```json
{
  "success": false,
  "action": "click",
  "target": "Print RFQ",
  "error": "Element not found: no interactive element with text \"Print RFQ\"",
  "screenshot": "output/screenshots/step-10-error.png",
  "suggestions": [
    { "text": "Print", "tag": "button", "similarity": 0.7 },
    { "text": "Render PDF", "tag": "a", "similarity": 0.4 }
  ],
  "pageUrl": "https://...",
  "pageTitle": "PO00012 - Odoo"
}
```

### `type <field> <value>`
Type text into an input field identified by its label, placeholder, or aria-label.

```bash
browser-pilot type "Email" "admin@example.com"
browser-pilot type "Search..." "purchase order"
```

Behavior: click to focus → Ctrl+A to select all → type character-by-character with human-like delays.

**Output**:
```json
{
  "success": true,
  "action": "type",
  "target": "Email",
  "value": "admin@example.com",
  "matchType": "placeholder",
  "matchedText": "Email",
  "screenshot": "output/screenshots/step-03-type.png",
  "annotatedScreenshot": "output/screenshots/step-03-type-annotated.png",
  "elementBox": { "x": 200, "y": 150, "width": 300, "height": 35 },
  "pageUrl": "https://...",
  "pageTitle": "..."
}
```

### `select <field> <value>`
Select an option from a dropdown. Clicks the dropdown first, then clicks the matching option.

```bash
browser-pilot select "Country" "Belgium"
```

### `hover <text>`
Hover over an element (useful for menus that open on hover).

```bash
browser-pilot hover "Settings"
```

### `press <key>`
Press a keyboard key.

```bash
browser-pilot press Enter
browser-pilot press Tab
browser-pilot press Escape
browser-pilot press Backspace
```

Supported keys: any key name recognized by Puppeteer (`Enter`, `Tab`, `Escape`, `Backspace`, `Delete`, `ArrowUp`, `ArrowDown`, `ArrowLeft`, `ArrowRight`, `Home`, `End`, `PageUp`, `PageDown`, `F1`–`F12`).

### `scroll <direction> [pixels]`
Scroll the viewport.

```bash
browser-pilot scroll down
browser-pilot scroll up 500
```

| Argument | Default | Description |
|----------|---------|-------------|
| `direction` | (required) | `up` or `down` |
| `pixels` | `300` | Number of pixels to scroll |

### `wait [seconds]`
Pause execution.

```bash
browser-pilot wait
browser-pilot wait 5
```

Default: 2 seconds.

---

## Inspection Commands

### `find <text>`
Search for elements matching text. Read-only — does not interact with the page.

```bash
browser-pilot find "Order Confirmed"
```

**Output** (found):
```json
{
  "success": true,
  "action": "find",
  "target": "Order Confirmed",
  "found": {
    "matchType": "exact-text",
    "matchedText": "Order Confirmed",
    "boundingBox": { "x": 50, "y": 200, "width": 200, "height": 30 }
  }
}
```

**Output** (not found, with suggestions):
```json
{
  "success": true,
  "action": "find",
  "target": "Order Confirmed",
  "found": null,
  "suggestions": [
    { "text": "Order Cancelled", "tag": "span", "similarity": 0.75 }
  ]
}
```

### `page-info`
Get current page URL, title, and all visible interactive elements.

```bash
browser-pilot page-info
```

**Output**:
```json
{
  "success": true,
  "action": "page-info",
  "pageUrl": "https://...",
  "pageTitle": "...",
  "interactiveElements": [
    { "text": "Confirm", "tag": "button" },
    { "text": "Cancel", "tag": "button" },
    { "text": "Email", "tag": "input", "type": "email" }
  ],
  "elementCount": 15
}
```

---

## Screenshot & Recording

### `screenshot`
Take a screenshot of the current page.

```bash
browser-pilot screenshot
browser-pilot screenshot --name "login-page"
browser-pilot screenshot --full-page
```

| Flag | Default | Description |
|------|---------|-------------|
| `--name` | auto-generated | Custom screenshot name (no extension) |
| `--full-page` | `false` | Capture the entire scrollable page |

### `record-start`
Begin screen recording (WebM via Puppeteer screencast).

```bash
browser-pilot record-start
```

### `record-stop`
Stop screen recording and save the WebM file.

```bash
browser-pilot record-stop
```

---

## Tips for Claude

1. **Always parse JSON** — every command returns a JSON object. Check `success` before proceeding.
2. **Read error screenshots** — when a step fails, read the screenshot to see the actual page state.
3. **Use `page-info`** to discover available elements when unsure what to click.
4. **Use `find`** to verify text exists on the page without changing anything.
5. **Use suggestions** — when `click` fails, the suggestions array shows the closest matching elements.
6. **Wait after navigation** — use `wait 2` or `wait 3` after heavy page loads.
7. **Screenshots are automatic** — every action captures a screenshot. Use standalone `screenshot` only for extra captures.
8. **One `goto` only** — navigate within the app using clicks, not additional `goto` calls.
