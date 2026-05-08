# Client-side Error Logging

## What this area covers

A small support surface that captures and reports unexpected errors that occur in the user's browser, so Halingo support and engineering can investigate without the user having to file a detailed report.

## Features in this area

- Error capture — when the user's browser hits an unexpected error, the error is recorded with enough context (the action the user was trying to perform, the page, the user's identity within the practice) for support to triage.

## Key product behaviors

- Error capture is automatic; the user does not need to do anything. A friendly error message is shown to the user; the diagnostic detail goes to support.
- No patient data is included in the captured payload — errors are categorised by action and screen, not by record content.
- Errors are aggregated server-side so that an outage affecting many users surfaces clearly rather than as many isolated reports.
- The user can usually retry the failed action after the error message is dismissed.

## Cross-references

- Identity — the user identity associated with an error helps support follow up if needed.
- All other areas — error capture is cross-cutting and surfaces issues anywhere in the product.
