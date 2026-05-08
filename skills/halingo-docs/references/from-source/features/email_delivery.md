# Email delivery

> **Provenance:** code-derived from `/home/tj/Repos/Halingo-Main`. Helpdesk coverage: partial — the helpdesk covers invoice mailing and template selection but not deliverability tracking. Verify against running app before promoting to `manual/`.

## What it is

Halingo sends transactional email via **AWS Simple Email Service** (SES) through a thin `HalingoEmails` façade. When a patient invoice is mailed out, a row is written to the `emails` MongoDB collection so that the patient file's email tab can show "we sent this invoice on this date to this address". All other transactional email (password reset, email verification, team invitations, subscription notifications, referral invites) is fire-and-forget and is **not** persisted in the `emails` collection.

## Where it lives in the UI

- Per-patient email history: `app/imports/modules/patientfiles/emails/patient-emails-overview.tsx` renders a list of sent emails for a given `patientFileId`, with the `EmailStatusIcon` next to each (`app/imports/modules/patientfiles/emails/email-status-icon.tsx`).
- No global "sent mail" dashboard was found.
- Mail *sending* is triggered from the patient invoice page via the "Mail invoice" action in `modules/invoices/patient/PatientFileActions.jsx`, which ultimately calls the `invoices.mail` method.

## Data model

### `emails` collection — `app/imports/api/emails/emails.ts`

```ts
export const Emails = new Collection("emails");

export type EmailEntityType = "PATIENT" | "USER";
export type EmailType = "PATIENT_SEND_INVOICE";   // :21 — but see schema below
export type EmailStatus = "SENT" | "DELIVERED" | "BOUNCED" | "FAILED" | 'OPENED' | "UNKNOWN";

const EmailSchema = new SimpleSchema({
  messageId: String,
  entityId: String,
  entityType: { type: String, allowedValues: ["PATIENT", "USER"] },
  email: String,
  type: { type: String, allowedValues: ["PATIENT_INVOICE", "PATIENT_INVOICE_REMINDER"] },
  status: {
    type: String,
    allowedValues: ["SENT", "BOUNCED", "BOUNCED", "FAILED", 'UNKNOWN'] as EmailStatus[],
  },
  sentAt: Date,
  invoiceId: { type: String, optional: true },
});
```

Deny-all insert/update/remove — client cannot write directly (`emails.ts:8-18`).

#### Inconsistencies worth flagging

- The exported `EmailType` alias is the single string `"PATIENT_SEND_INVOICE"` (`:21`), but the schema's `allowedValues` is `["PATIENT_INVOICE", "PATIENT_INVOICE_REMINDER"]` (`:29`). Only the schema is enforced at insert time; the TypeScript alias is dead code.
- The exported `EmailStatus` type includes `DELIVERED` and `OPENED` (`:22`), but the schema's `allowedValues` has **neither**, and lists `BOUNCED` twice (`:32`). Attempting to insert a row with `status: "DELIVERED"` or `"OPENED"` would fail schema validation. Again, only the schema is enforced.
- **No code path anywhere in the repo calls `Emails.update`.** A grep across `app/imports` finds zero matches outside of code_export. Rows are only ever inserted with `status: "UNKNOWN"` and are never updated. See "Notable details" for what this means.

### Row lifecycle — single insertion site

The only place that inserts into `Emails` is `app/imports/api/invoices/patientFileInvoices/server/util.js:686-696`:

```js
if (result.success) {
  Emails.insert({
    messageId: result.result,
    entityId: invoice.patientFileId,
    entityType: "PATIENT",
    email: to,
    type: reminder ? "PATIENT_INVOICE_REMINDER" : "PATIENT_INVOICE",
    status: "UNKNOWN",
    sentAt: new Date(),
    invoiceId: invoice._id,
  });
}
```

`result.result` is the response string returned by nodemailer — effectively the SMTP "Message-ID". The row is created with `status: "UNKNOWN"` and never updated.

## Methods (Meteor)

### `getEmails` — `app/imports/api/emails/methods.ts:7-33`

```ts
export const getEmails = new PermissionValidatedMethod({
  name: "patientFile.view.emails",
  permissions: ["patientFile.view"],
  validate: new SimpleSchema({ patientFileId: { type: String } }).validator(),
  getPermissionData({ patientFileId }) { ... /* returns {patientFileId, practiceId} */ },
  run({ patientFileId }) {
    return Emails.find(
      { entityId: patientFileId, entityType: "PATIENT" },
      { sort: { sentAt: -1 } }
    ).fetch();
  },
});
```

Returns the email history for one patient, sorted newest first. Requires `patientFile.view`.

### The invoice mail trigger

`mailInvoice` is exposed through the `invoices.mail` and `invoices.mail.reminder` Meteor methods (see `api/invoices/patientFileInvoices/methods.js`, not quoted here but search for `_mailInvoice`). Internally it calls `InvoicesUtil.mailInvoice(invoice, reminder)` → `_mailInvoice(invoice, reminder)` (`util.js:612-699`), which generates the PDF, sends the email, then inserts the `Emails` row on success.

## Publications

None. Email history is fetched through the `getEmails` method call, not a publication.

## Send mechanism

### `HalingoEmails` façade — `app/imports/lib/mails/server/mails.tsx`

```ts
export const HalingoEmails = (function () {
  const _sendEmail = function (to, component, props, options) {
    const msg: IMailConfig = {
      to,
      from: { address: "no-reply@halingo.be", name: options.from?.name || "Halingo" },
      replyTo: options.from
        ? { address: options.from.email, name: options.from.name }
        : { address: "no-reply@halingo.be", name: "Halingo" },
      subject: translate(options.subject || " ", props, null, null, { locale: options.locale }),
      html: options.html || Util.componentToStaticHtml(component, props, options.locale),
      headers: { "X-SES-CONFIGURATION-SET": Meteor.settings.SES_CONFIGURATION_SET },
    };

    if (options?.attachments?.length) {
      msg.attachments = options.attachments.map((attach) => ({
        filename: attach.name,
        content: attach.data,
        contentTransferEncoding: "base64",
      }));
    }

    const future = new Future();
    AwsSes.sendEmail(msg)
      .then((res) => future.return({ success: true, result: res, error: null }))
      .catch((err) => future.return({ success: false, result: null, error: err }));

    if (!options.async) return future.wait();
    return { success: true };
  };

  return { sendEmail(to, mailTemplate, props, options) { ... } };
})();
```

Key points:

- **From** is always `no-reply@halingo.be`. Per-practice branding is put into `replyTo` instead, so replies go to the practice / therapist.
- The **template** is a React component (`MailTemplate1` / `MailTemplate2` / …) that is rendered server-side to static HTML via `Util.componentToStaticHtml(component, props, locale)`.
- A `X-SES-CONFIGURATION-SET` header is attached — this is the AWS SES "configuration set" name, which is how AWS groups email streams for per-set bounce / complaint / open tracking on the SES side.
- `options.async` toggles between sync (`future.wait()` — blocks the Meteor fiber until send returns) and async (returns `{success: true}` immediately without waiting). Invoice sending uses sync so that the `Emails.insert` can gate on `result.success`.
- On failure, `_sendEmail` logs `"Error sending email"` to the Meteor console and returns `{success: false}`. Nothing is persisted to MongoDB for a failed send; there is no failure log.

### `AwsSes` — `app/imports/lib/mails/server/aws-ses.tsx`

```ts
import { SES, SendRawEmailCommand } from "@aws-sdk/client-ses";
import { createTransport } from "nodemailer";

class AwsSesFactory {
  public async sendEmail(mailConfig: SendMailOptions): Promise<string> {
    const result = await this.nm.sendMail(mailConfig);
    return result.response;
  }

  public get nm(): Transporter {
    if (!this._nodeMailer) {
      const ses = new SES({
        region: process.env.AWS_REGION || "eu-west-3",
        credentials: {
          accessKeyId: Meteor.settings.AWS_ACCESS_KEY_ID,
          secretAccessKey: Meteor.settings.AWS_SECRET_ACCESS_KEY,
        },
      });
      this._nodeMailer = createTransport({ SES: { ses, aws: { SendRawEmailCommand } } });
    }
    return this._nodeMailer;
  }
}
```

Transport stack: **`@aws-sdk/client-ses` v3 SES client → nodemailer → SES Raw Email**. Region defaults to `eu-west-3` (Paris) but is configurable via env var. Credentials come from Meteor settings (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`).

The `result.response` string returned by nodemailer is used as the `messageId` stored in the `Emails` collection. In nodemailer-SES integration this is the SES raw response ID.

## What gets sent — every `HalingoEmails.sendEmail` call site

| Caller | Template | Type written to `emails` collection | Persisted? |
|---|---|---|---|
| `api/invoices/patientFileInvoices/server/util.js:663` | `InvoiceMailTemplates[practice.settings.invoices.mail.template or 0]` | `PATIENT_INVOICE` or `PATIENT_INVOICE_REMINDER` | **Yes** |
| `api/users/server/util.jsx:35` | `PasswordChangedEmail` | — | No |
| `api/users/server/util.jsx:52` | password reset | — | No |
| `api/users/server/util.jsx:95` | `EmailVerificationEmail` / welcome | — | No |
| `api/practice/server/util.tsx:98` | practice invitation | — | No |
| `api/practice/server/util.tsx:409` | practice-related notification | — | No |
| `api/patientFiles/server/util.js:114` | patient-file-related | — | No |
| `api/subscriptions/server/util.jsx:641` | subscription notification | — | No |
| `api/referrals/server/util.jsx:25` | referral invite | — | No |

Only invoice mailing is tracked. Everything else is fire-and-forget.

## User-visible behaviour

- On the patient file, the "Emails" tab shows a chronological list of invoice emails sent to that patient with an `EmailStatusIcon` next to each. Given the data model, the icon will effectively always render `UNKNOWN` (orange "helpOutline") for rows inserted by the current invoice-mail code.
- Password reset, email verification, team invites, subscription lifecycle messages, referral invites etc. are sent via the same SES transport but the UI offers no visibility into whether they arrived.
- The sender address is always `no-reply@halingo.be`; only the visible "name" in the from header changes per practice, and replies go to the practice / therapist via the `replyTo` header.

## Permissions

- `getEmails` requires `patientFile.view` for the target patient file.
- The `emails` collection is fully denied for client writes (`emails.ts:8-18`); the only way to insert is from the server-side invoice mail helper.
- `HalingoEmails.sendEmail` has no permission wall of its own — it is always invoked from server code after the calling method has done its own permission check.

## Notable details — the deliverability gap

**There is no bounce / delivery / open tracking.** The code stores rows with `status: "UNKNOWN"` and never updates them. The ingredients for deliverability tracking are in place but the pipeline is incomplete:

1. The `X-SES-CONFIGURATION-SET` header is emitted on every send (`mails.tsx:24`), which means AWS SES publishes bounce / complaint / delivery / open events to an SNS topic on the AWS side.
2. The `EmailStatus` TypeScript type and the `EmailStatusIcon` UI component already understand `DELIVERED`, `BOUNCED`, `FAILED`, `OPENED` states.
3. But there is **no HTTP route** in `app/imports/startup/server/rest.jsx` that ingests SES / SNS bounce notifications — the only webhook registered is `/api/webhooks/stripe` (`api/subscriptions/server/webhooks.jsx:18`).
4. And there is **no call to `Emails.update` anywhere in the codebase**.

Net effect: every persisted email row is permanently `"UNKNOWN"`, and the `DELIVERED` / `OPENED` branches in `email-status-icon.tsx` are dead code. AWS SES is tracking the events — nothing is bringing them back to Halingo's database.

> ⚠️ Behaviour inferred from code; needs product validation — is the deliverability pipeline meant to be implemented and not yet wired up, or is the UI intentionally showing "UNKNOWN" until AWS SES reports a failure back through some other channel?

Additional notes:

- **Schema has `BOUNCED` listed twice** in the `allowedValues` array (`emails.ts:32`). Bug, not a double semantic.
- **No retry queue.** A failed `_sendEmail` returns `{success: false}`, the invoice row never gets inserted, and nothing retries. The user would have to manually click "mail" again.
- **Async send does not wait**, so if an async send fails (any `HalingoEmails.sendEmail(..., {async: true})` call), the caller gets `{success: true}` regardless and the error only appears in the server console. Invoice mailing is sync, so this does not affect the persisted rows.

## Helpdesk overlap

The helpdesk covers:

- Invoice mailing as a user action.
- The mail template picker in practice settings (see `email_templates.md`).

The helpdesk does **not** cover:

- The `emails` collection as an audit trail.
- Bounce / delivery tracking (because it isn't actually tracked — see above).
- Which transactional mails are persisted vs fire-and-forget.
- The AWS SES stack or `no-reply@halingo.be` sender.

## Source files

- `app/imports/api/emails/emails.ts` — collection + schema + types
- `app/imports/api/emails/methods.ts` — `getEmails` read method
- `app/imports/lib/mails/server/mails.tsx` — `HalingoEmails` façade
- `app/imports/lib/mails/server/aws-ses.tsx` — SES / nodemailer transport
- `app/imports/api/invoices/patientFileInvoices/server/util.js:612-699` — the only caller that writes to `Emails`
- `app/imports/modules/patientfiles/emails/patient-emails-overview.tsx` — UI list
- `app/imports/modules/patientfiles/emails/email-status-icon.tsx` — status icon component
- `app/imports/api/users/server/util.jsx` — transactional-mail call sites
- `app/imports/api/practice/server/util.tsx` — practice invitation / notification mail
- `app/imports/api/subscriptions/server/util.jsx` — subscription notification mail
- `app/imports/api/referrals/server/util.jsx` — referral invite mail
- `app/imports/startup/server/rest.jsx` — registered HTTP routes (no SNS endpoint)
