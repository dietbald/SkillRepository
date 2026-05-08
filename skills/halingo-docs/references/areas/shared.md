# Shared / cross-cutting features

## What this area covers

Cross-cutting helpers used by many other areas — the shared error pages and the Belgian ZIP-code lookup widget that auto-completes city / locality from a postal code.

## Features in this area

- Error pages — the user-facing not-found and unexpected-error pages, reached when the user navigates to an invalid URL or an unrecoverable error occurs.
- ZIP code lookup — auto-complete widget that, given a Belgian postal code, suggests the correct city / locality (and the language it falls under). Used wherever the user enters a Belgian address.

## Key product behaviors

- The error pages keep the practice's branding (logo, accent color) so the user knows they are still inside Halingo.
- The ZIP-code lookup uses the official list of Belgian postal codes; it covers the full national dataset (Flemish, Walloon, Brussels, German-speaking community).
- The lookup is forgiving — partial codes return matching candidates, and the user picks from a short list rather than typing the whole locality by hand.

## Cross-references

- Practice Branding — practice name and address use the ZIP lookup at create time.
- Patient Data Privacy — patient address fields use the ZIP lookup at create / edit time.
