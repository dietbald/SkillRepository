# dontsleeponai.com

Status: verified 2026-05-02 — registered + downloaded both Claw Loop .md files.

## Auth

Magic-link only (no password). The register page (`/register?redirect=/<dest>`) emails an 8-digit code AND a click-to-confirm link. Either path works; the code is faster when the registration tab is still open — it has a verify input below the magic-link button.

```
Code regex on the registration page: input[name="code"][placeholder="12345678"]
```

After verify, the page navigates to the redirect target with the user logged in.

## Pre-CTA popup

A YouTube subscribe modal pops up almost immediately on `/claw-loop`. Always dismiss it ("Maybe later") before clicking any CTA — it covers the page and silently swallows clicks.

## Download flow (gated by disclaimer)

The two `⬇ Download <edition> v<version> (.md)` anchors look like buttons but render with `aria-disabled="true"` + `class="… pointer-events-none cursor-not-allowed opacity-40"` until a disclaimer checkbox is ticked.

The checkbox label is "I understand that great care has gone into preparing this prompt…" with a hint underneath: "Check the box above to enable the download buttons."

```javascript
// 1. Tick the checkbox (real click, not .checked = true)
await page.evaluate(() => {
  const cb = [...document.querySelectorAll('input[type=checkbox]')]
    .find(c => /understand that great care/i.test(c.closest('div, label, section')?.innerText || ''));
  if (cb && !cb.checked) cb.click();
});
await sleep(1500);

// 2. Confirm the button is now enabled
//    aria-disabled should flip to "false", pointerEvents to "auto"

// 3. Configure CDP download capture, then trusted mouse.click on each link
const client = await page.target().createCDPSession();
await client.send('Browser.setDownloadBehavior', {
  behavior: 'allow', downloadPath: SAVE_DIR, eventsEnabled: true,
});
```

The anchors have no `href` — clicking fires a JS handler that streams the file via the browser's native download flow. Plain `fetch()` will not work; use `mouse.click()` after `setDownloadBehavior`.

Filenames as served (2026-05-02):
- `the-claw-loop-prompt-v2.4.md` (BMAD edition)
- `the-claw-loop-gsd-v2.3.1.md` (GSD edition)
