# ISUFST — Iloilo State University of Fisheries Science and Technology
# https://isufst.edu.ph/bids-and-awards/

## Status
Verified 2026-05-04 — plain HTTPS works, BrowserControl used for audit only.

## Page structure

WordPress site with a jQuery DataTables table split across 5 campus tabs:
- Main Campus (Tiwi site + Poblacion site)
- Barotac Nuevo Campus
- San Enrique Campus
- Dingle Campus
- Dumangas Campus

All rows for all tabs are in the raw HTML upfront (client-side DataTables). A plain HTTPS fetch gets all 5 campuses' data without clicking any tabs.

Two sections per campus tab:
1. **Bid Opportunities** — active/open bids
2. **Completed Projects** — awarded/closed bids

Row structure:
```html
<tr class="row-N">
  <td class="column-1">Invitation to Bid / Request for Quotation</td>
  <td class="column-2">Title text</td>
  <td class="column-3"><a href="...">View</a></td>
  <td class="column-4">2025</td>
</tr>
```

## Critical: Two link URL patterns — must match BOTH

Main Campus (Tiwi, Poblacion), Dingle, and Dumangas → direct PDF on isufst.edu.ph:
```
https://isufst.edu.ph/bidsandawards/<Campus>/filename.pdf
```

Barotac Nuevo and San Enrique → Google Drive:
```
https://drive.google.com/file/d/<id>/view?usp=sharing
```

**A regex matching only `.pdf` hrefs silently misses all Barotac Nuevo and San Enrique entries**, including construction bids.

Working href regex:
```javascript
/href="((?:https?:\/\/isufst\.edu\.ph\/bidsandawards\/[^"]+|https?:\/\/drive\.google\.com\/[^"]+))"/i
```

## Dedup key

Use the full `href` URL as the dedup key (unique per document upload).

## Construction keywords that appear here

- "Rehabilitation of..." (buildings, roads, driveway)
- "Construction of..." (comfort rooms, training hub, laboratory)
- "INFRA" in bid number
- "Repainting of Building"
- "Materials for Repair"
- "Guardhouse and Gate"

## State file format (seen.json)

```json
{ "https://isufst.edu.ph/bidsandawards/Tiwi/filename.pdf": "2026-05-04" }
```
Value is just a date string (ISO), not an object.

## Plain HTTPS — works fine

No Cloudflare, no JS rendering needed. Use Node.js `https` module. All 175+ entries across 5 campuses are visible in the raw HTML.
