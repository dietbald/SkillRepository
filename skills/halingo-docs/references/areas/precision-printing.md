# Precision Printing

## What this area covers

The print pipeline for the official Belgian *getuigschrift voor verstrekte hulp* paper certificate — the unique surface in Halingo where pixel-precise alignment to pre-printed stationery is mandatory.

## Features in this area

- Certificate printer mode — print the certificate directly to a matrix printer pre-loaded with the official RIZIV booklets.
- Certificate manual mode — fill in a certificate booklet by hand using values shown on screen, for therapists who do not have a matrix printer.
- Certificate numbering — Halingo tracks the next certificate number per booklet and prevents re-use.

## Key product behaviors

- The reference matrix printer is the EPSON LX-350 (24-pin) loaded with continuous-feed RIZIV-compliant certificate booklets purchased from Medattest.
- Margin calibration is a recurring user pain point; the print modal exposes per-axis offset controls (top / left in tenths of a millimetre) so the therapist can nudge the print into the boxes on the pre-printed paper.
- Certificate numbers are issued sequentially per booklet. A booklet is "loaded" by entering its starting number; Halingo increments from there and warns if the number on screen does not match the next paper slip.
- The therapist can mark certificates as cancelled / spoiled (for misprints), and Halingo skips the number on the next print.
- Manual mode is the fallback: the therapist sees the values to write, fills in the paper certificate by hand, and confirms the action so the certificate number is consumed.
- A duplicate certificate (for a lost original) follows the standard RIZIV duplicate flow and is marked as such on the printed slip.
- Browser-specific rendering quirks (Chrome / Firefox / Edge) are documented in the helpdesk; the print preview makes visible whether the layout will land correctly on paper.

## Belgian / regulatory notes

- The *getuigschrift voor verstrekte hulp* is the legal proof of care delivered; the patient submits it to their mutualiteit to obtain reimbursement.
- The certificate format, numbering rules, duplicate handling, and required fields are all RIZIV-mandated and may not be modified by Halingo.
- Pre-printed certificate booklets are obtained from Medattest in continuous-feed form for matrix printers; no other paper format is accepted.

## Cross-references

- Smart Invoicing — every certificate accompanies an invoice; the two are produced together at billing time.
- Compliance Monitoring — the certificate carries RIZIV codes and the patient's INSZ; both are validated against the rules engine before printing.
- Patient Data Privacy — the certificate contains health-data (codes implying a treated condition); printed copies must be handled accordingly.
