# Practice chat

> **🔥 DO NOT MAINTAIN OR EXTEND THIS DOCUMENTATION.** Practice chat is a deprecated feature that will be deleted. Confirmed by the product owner 2026-04-07: "for the chat just make a note that we dont need to document it as its a deprecated function that will be deleted". See [`../deprecation_list.md` #1](../deprecation_list.md).
>
> The technical content below is preserved as a historical record of what the feature did, but it should **not** be ported to the curated `manual/`, **not** be referenced from the user guide, and **not** be extended with new findings if more code-reading happens. If the chat code changes between now and removal, it is acceptable for this page to drift out of date — accuracy is no longer required. Do **not** port to the mono repo.
>
> **Provenance:** code-derived from `/home/tj/Repos/Halingo-Main`. Helpdesk coverage: partial — the helpdesk only documents how to *disable* the chat (`../../full_documentation/settings_practice_management.md` §"Praktijk chat uitschakelen"); the chat's normal day-to-day usage is undocumented.

## What it is

A lightweight one-channel text chat shared by every member (therapist) of a single praktijk. It is exposed as a floating chat bubble pinned to the bottom-right of every authenticated page; clicking it opens a popover with the message history and a message input. There are no threads, no private messages, no attachments, no typing indicators, and no channels — there is exactly one chat per praktijk, shared by everyone who has access to that praktijk. Messages are text-only (with emoji rendering), every recipient's reads are tracked, and the praktijk owner can disable the feature entirely from practice settings.

## Where it lives in the UI

- Floating bubble, mounted once at the app layout level · `ChatWidget` · `app/imports/ui/pages/practices/chat/ChatWidget.jsx:108` (wrapper), `:49` (inner class), mounted at `app/imports/ui/layouts/AppLayout.jsx:10`, `:118-120` where it is passed `practiceId={props.currentPracticeId}`
- Popover contents (history + input) · `PracticeChat` · `app/imports/ui/pages/practices/chat/PracticeChat.jsx:52`
- Reactive data tracker for the popover · `PracticeChatContainer` · `app/imports/ui/pages/practices/chat/PracticeChatContainer.jsx:13`
- Single message renderer · `Message` · `app/imports/ui/pages/practices/chat/Message.jsx:25`
- Input form schema · `Definition` · `app/imports/lib/formSchemas/practices/chatInput.jsx:8`
- Settings toggle form · `PracticeSettingsChat` · `app/imports/lib/formSchemas/practices/settings/practiceSettingsChat.jsx:10`, mounted in `app/imports/ui/pages/practices/settings/PracticeSettingsPage.jsx:5`, `:57-58`

There is no standalone `/chat` route; the chat lives exclusively in the floating bubble.

## Data model

Collection: `practicechat` · `app/imports/api/practice/practiceChat.jsx:5`

Exported as `PracticeChatCol` (the name `PracticeChat` is taken by the React component).

| Field | Type | Meaning |
|---|---|---|
| `createdAt` | `Date` | Timestamp the message was posted. Sort key (ascending in the UI, descending in the publication). `practiceChat.jsx:14` |
| `message` | `String` | The message text. Rendered through `ReactEmoji.emojify()` before display. `practiceChat.jsx:15`, `Message.jsx:85` |
| `userId` | `String` (Mongo `_id`) | The author. Set by the method to `this.userId`. `practiceChat.jsx:16`, `app/imports/api/practice/methods.jsx:33` |
| `practiceId` | `String` (Mongo `_id`) | The praktijk the message belongs to. Provided by the client; the permission check rejects the call if the caller does not have `practice.chat` on that praktijk. `practiceChat.jsx:17`, `methods.jsx:32` |
| `readBy` | `Array<String>` | User ids of everyone who has marked this message as read. `practiceChat.jsx:18-19`. Included on insert as an empty array (`methods.jsx:34`). |
| `removed` | `Boolean` (optional) | Soft-delete scaffold. Unused in the code path inspected. `practiceChat.jsx:20` |
| `removedAt` | `Date` (optional) | Same as above. `practiceChat.jsx:21` |

Client-side writes are denied:

```js
PracticeChatCol.deny({
    insert() { return true; },
    update() { return true; },
    remove() { return true; }
});
```
`practiceChat.jsx:7-11`

All mutations flow through the Meteor methods.

### Practice-level setting

The `practices` schema carries a single chat-related flag:

- `settings.chat.disabled` — `Boolean` (optional). When `true`, `ChatWidget` returns `null` and the bubble is never rendered. `app/imports/api/practice/practices.jsx:67-68`, `ChatWidget.jsx:83`

## Methods (Meteor)

Both live in `app/imports/api/practice/methods.jsx` and use `PermissionValidatedMethod`, which in turn requires the caller to be logged in and to pass the `practice.chat` / `practice.chat.read` permission check against the practice. `app/imports/lib/permissions/PermissionValidatedMethod.jsx:6-41`

### `practice.chat`

- File · `methods.jsx:24-38`
- Parameters · `{ practiceId: String, message: String (optional) }` — validated against `chatSchema`. `methods.jsx:19-22`
- Permission · `practice.chat` checked against `practiceId`. `methods.jsx:25`, `app/imports/startup/lib/bootstrap/permissions.jsx:6-8`
- Effect · Inserts a new row:

  ```js
  PracticeChatCol.insert({
      message,
      practiceId,
      userId: this.userId,
      readBy: []
  });
  ```
  `methods.jsx:30-35`
- Return · the new document id (server path only; `isSimulation` returns `undefined`).
- Note: the schema marks `message` as optional, but the caller (`PracticeChatContainer`) short-circuits empty messages before invoking the method. `app/imports/lib/formSchemas/practices/chatInput.jsx:28-30`

### `practice.chat.read`

- File · `methods.jsx:48-69`
- Parameters · `{ practiceId: String, messages: Object (blackbox) }` — validated against `chatSchemaRead`. `methods.jsx:40-46`
- Permission · `practice.chat.read` checked against `practiceId`. `methods.jsx:49`
- Effect · For each message in the passed map:
  - If the message already has a `readBy` array and the caller's id is not in it, `$push` the caller's id onto `readBy`.
  - Otherwise (no `readBy` yet) `$set` `readBy: [this.userId]`.

  `methods.jsx:52-67`
- Note: the method walks the messages with `_.map` (not `_.each`) and does not return anything meaningful; it is fire-and-forget.
- Trigger: called automatically inside `PracticeChatContainer.withTracker` on every re-computation (`PracticeChatContainer.jsx:26`) — i.e., every time the popover receives a data update.

## Publications

### `practicechat` (composite)

- File · `app/imports/api/practice/server/publications.jsx:98-148`
- Parameters · `{ practiceId: String, limit: Number }`
- Permission gate · `PracticeUsersUtil.checkUserPermission("practice.chat", this.userId, practiceId)`; if the caller lacks the permission, the publication returns empty. `publications.jsx:99-108`
- Counts sub-publication · `Counts.publish` named `chat.practice.new.count`, counting `PracticeChatCol.find({practiceId, readBy: {$ne: this.userId}})`. This is the per-user unread counter consumed by the floating bubble's badge. `publications.jsx:110-118`, `ChatWidget.jsx:114`
- Primary cursor · `PracticeChatCol.find({practiceId}, {limit, sort: {createdAt: -1}})` — the newest `limit` messages for the praktijk. Note that the client re-sorts ascending to render them chronologically. `publications.jsx:122-127`, `PracticeChatContainer.jsx:20`
- Child cursor · For each message, publishes the `Meteor.users` document of the author with `{emails: 1, profile: 1, image: 1}` — so `PracticeChat.render` can look up each author's name and avatar. `publications.jsx:128-145`
- A legacy plain `Meteor.publish('practicechat', ...)` version is commented out immediately above the composite definition. `publications.jsx:89-96`

## User-visible behaviour

### The floating bubble

1. `AppLayout` mounts `<ChatWidget practiceId={currentPracticeId} />` inside the main authenticated layout branch. `AppLayout.jsx:118-120`
2. `ChatWidget` subscribes to `practice` (to get `settings.chat.disabled`) and to `practicechat` with `limit: 10` (to drive the unread counter). `ChatWidget.jsx:108-117`
3. If `practice.settings.chat.disabled` is truthy, the widget returns `null` — no bubble, no badge. `ChatWidget.jsx:83`
4. Otherwise the bubble renders as a circular Material-UI `Button` with a `ChatBubble` icon. When `chat.practice.new.count > 0` the button is wrapped in a `Badge` showing the unread count. `ChatWidget.jsx:68-80`
5. Clicking the bubble opens a Material-UI `Popover` anchored to the button, which renders `PracticeChatContainer` for the current `practiceId`. `ChatWidget.jsx:86-101`

### The chat popover (`PracticeChat`)

1. `PracticeChatContainer` subscribes to `practicechat` with an initial `limit` of 10. `PracticeChatContainer.jsx:10`, `:18`
2. It fetches the messages, re-sorts them ascending (oldest → newest), and deduplicates with `oldMessages` via `_.unionBy` to stabilise order across re-renders. `PracticeChatContainer.jsx:20-25`
3. For every recomputation it calls `updateRead({practiceId, messages})`, which marks every visible message as read by the current user via `practice.chat.read`. `PracticeChatContainer.jsx:26`
4. Inside `PracticeChat.render`, consecutive messages by the same author are grouped into a single visual block. `PracticeChat.jsx:102-117`
5. For each group, the author's name is shown above (or to the left of) the bubbles; the current user's own avatar is omitted, other users get a circular avatar from `Meteor.users.findOne({_id}).image()` or a placeholder. `PracticeChat.jsx:159-170`, `:161-170`
6. Each message is rendered by `Message`:
   - Own messages use `styleMine` (navy bubble, right-aligned); other users' messages use `styleOther` (blue bubble, left-aligned). `Message.jsx:13-24`, `:44-46`, `:62-68`
   - `ReactEmoji.emojify` is applied to the text so `:) :(` etc. render as emoji. `Message.jsx:85`
   - A dividing timestamp (`DD/MM, H:mm` or `H:mm`) is inserted when the gap to the previous message exceeds `dateInterval` (60 · 60 = 3600 seconds = 1 hour). `PracticeChat.jsx:182-185`, `PracticeChatContainer.jsx:42`, `Message.jsx:55-60`
   - A Material-UI `Tooltip` on hover shows the full date/time and the text `"<N> gelezen"` (`practice.chat.readBy`). `Message.jsx:73-87`
7. Scrolling behaviour:
   - On initial load and when a new message arrives, the scrollbar auto-scrolls to the bottom. `PracticeChat.jsx:73-88`
   - On history reload (more messages appear at the top), the scroll position is preserved so the user doesn't jump. `PracticeChat.jsx:91-95`
   - When the user scrolls to the top (`scrollTop < 1`), `loadMore()` is called, bumping the subscription `limit` by 10. `PracticeChat.jsx:65-68`, `PracticeChatContainer.jsx:35-37`
   - A "load more history" button (`practice.chat.loadMore`, `"Meer laden"`) also appears at the top of the scroll area when at least `limit` messages are present. `PracticeChat.jsx:143-154`
8. The message input is a `Form` using `chatInput` `Definition`. Submitting triggers `addChatMessage.call({message, practiceId})`, then `data.cb_f()` which scrolls to the bottom, and `hideOnSuccess` clears the input. `PracticeChat.jsx:215-227`, `chatInput.jsx:24-31`
9. A `HalIcon` with icon `"send"` next to the input provides an explicit send button that calls `this.form.onSubmit()`. `PracticeChat.jsx:229-236`
10. The entire chat area is wrapped in `PermissionRender('practice.chat', ...)` — a client-side permission gate. Users without the `practice.chat` permission see nothing inside the box. `PracticeChat.jsx:133-141`, `app/imports/lib/permissions/PermissionRender.js:4-11`

> ⚠️ Behaviour inferred from code; needs product validation. The container calls `updateRead` unconditionally on every reactive re-render (`PracticeChatContainer.jsx:26`), which means opening the popover will mark everything on screen as read — there is no distinction between "opened the popover" and "scrolled past a message". The `Tooltip` on each message shows a read-by count, which implies the feature was designed to be aware of who has read what, but the UI never lists the readers by name.

### Disabling the chat for a praktijk

1. The owner (`Praktijkverantwoordelijke`) or beheerder (`admin`) opens `/practices/settings`. The `PracticeSettingsPage` shows a "Praktijk chat" box containing the `PracticeSettingsChat` form. `PracticeSettingsPage.jsx:55-61`
2. The form is a single `Checkbox` bound to `chat.disabled` with label `practice.settings.chat.disabled.label` (`"Schakel chat uit"`). `practiceSettingsChat.jsx:10-29`, `nl.i18n.js:1002-1005`
3. Changing the checkbox calls `updateSettings({chat: {disabled: true|false}})` via `LiveEditableForm`. The input is `readOnly` when the practice has no active subscription (`hasActiveSub === false`). `PracticeSettingsPage.jsx:58-60`
4. Once `settings.chat.disabled === true`, the `ChatWidget` returns `null` and the bubble disappears for every member of that praktijk. `ChatWidget.jsx:83`

## Permissions

Two named permissions, declared in `app/imports/api/practiceUsers/practiceUsers.jsx`:

- `practice.chat` — required to post messages and to subscribe to the publication. Granted to **all three roles**: `owner` (line 38), `admin` (line 103), `default` (line 149).
- `practice.chat.read` — required to mark messages as read via `practice.chat.read`. Granted to all three roles: `owner` (line 39), `admin` (line 104), `default` (line 150).

Mapping to product language (see `../../glossary.md`):

- `owner` = **Praktijkverantwoordelijke**
- `admin` = **Beheerder**
- `default` = **Lid**

So every member of a praktijk can read, post, and mark messages as read — there is no finer-grained gating. What a member *cannot* do:

- Disable / re-enable the chat (that flips `settings.chat.disabled` via `updateSettings`, which requires the `practice.settings.update` permission — `owner` and `admin` only).
- Delete a message. There is no delete method; only the soft-delete scaffold fields on the schema.
- Edit a message. There is no edit method.

The permission check flows: client-side `PermissionRender('practice.chat', ...)` and server-side `PermissionValidatedMethod._execute` both end up calling `PermissionsUtil.checkPermission`, which in turn runs the whitelist hook registered in `app/imports/startup/lib/bootstrap/permissions.jsx:6-8` — `PracticeUsersUtil.checkUserPermission(permission, userId, data.practiceId)` — which looks up the caller's `PracticeUsers` row for the praktijk and consults the `roles[role].permissions` array.

## Notable details

- **One chat per praktijk, not one per conversation.** The collection carries only `practiceId`, never a target or thread id. If a user belongs to multiple praktijken, each praktijk has its own separate chat; switching `currentPracticeId` switches which chat the bubble talks to, because `ChatWidget` is keyed off `currentPracticeId` in `AppLayout`. `AppLayout.jsx:118-120`
- **`practice.chat` method requires-subscription flag is commented out.** `methods.jsx:26`: `//subscription: true` — the chat method explicitly does **not** require an active SaaS subscription to post. `methods.jsx:51` does the same for `practice.chat.read`.
- **`readBy` is a flat array of user ids.** It is `$push`-ed, never pulled back out. There is no "unread" transition other than removing the caller from `readBy` (which doesn't happen) or waiting until a new message arrives. `methods.jsx:54-65`
- **Unread counter is per user, per praktijk.** The counter is `PracticeChatCol.find({practiceId, readBy: {$ne: this.userId}})`, so each user sees only their own unread count. `publications.jsx:113-115`
- **Auto-read on open.** See the warning under "User-visible behaviour" — `updateRead` runs on every container re-computation. Practically this means the act of opening the popover marks everything visible as read; you cannot preview the chat and keep messages unread.
- **Composite publication joins author metadata.** The `publishComposite` pattern means the author's `profile`, `emails`, and `image` fields are published as a side-effect of the chat subscription, so `Meteor.users.findOne({_id: message.userId}).name()` and `.image()` work on the client without a separate subscription. `publications.jsx:128-145`
- **Author grouping collapses runs of consecutive messages by the same user.** The grouping loop in `PracticeChat.jsx:102-117` buckets consecutive messages from the same `userId`, which is why only the first message of each run shows the author's avatar.
- **Emoji rendering is text-only.** `ReactEmoji.emojify` turns `:)` into emoji but there is no emoji picker, attachment button, or rich text input. `Message.jsx:85`
- **Timezone / locale of timestamps.** Timestamps are rendered with `moment(createdAt).format("DD/MM, H:mm")` — client locale, 24-hour, day/month. `Message.jsx:58`
- **Message input placeholder.** `forms.placeholder.newMessage` — `"Nieuw bericht..."` (NL) / `"Nouveau message..."` (FR). `nl.i18n.js:71`, `fr.i18n.js:71`
- **i18n labels.**
  - `practice.chat.title` — `"Praktijk chat"` (NL) / `"Chat du cabinet"` (FR). `nl.i18n.js:860`, `fr.i18n.js:859`
  - `practice.chat.loadMore` — `"Meer laden"` (NL) / `"Montrer plus"` (FR). `nl.i18n.js:861`, `fr.i18n.js:860`
  - `practice.chat.readBy` — `"gelezen"` (NL) / `"Lu"` (FR). `nl.i18n.js:862`, `fr.i18n.js:861`
  - `practice.settings.chat.disabled.label` — `"Schakel chat uit"` (NL). `nl.i18n.js:1004`
- **The code_export.txt file in `app/imports/` appears to be a full-text dump of the source tree** — not an import, just a build artefact. Every grep hit matching this file is a duplicate of the real source and can be ignored.

## Helpdesk overlap

`../../full_documentation/settings_practice_management.md` §"Praktijk chat uitschakelen" (lines 82-103) explains how to disable the chat from practice settings. It is a three-step article with screenshots. It does not describe the chat's normal use (posting, reading, load-more, unread counter, permissions) nor the floating bubble UX — those are undocumented in the helpdesk.

## Source files

- `app/imports/api/practice/practiceChat.jsx`
- `app/imports/api/practice/methods.jsx` (functions `chatSchema`, `addChatMessage`, `chatSchemaRead`, `updateRead`)
- `app/imports/api/practice/server/publications.jsx` (publication `practicechat`)
- `app/imports/api/practice/practices.jsx` (`settings.chat.disabled` on `Practices` schema)
- `app/imports/api/practiceUsers/practiceUsers.jsx` (role → permission map containing `practice.chat` and `practice.chat.read`)
- `app/imports/api/practiceUsers/util.jsx` (`checkUserPermission`)
- `app/imports/api/collection.js`
- `app/imports/startup/lib/bootstrap/permissions.jsx` (wires permission checks to `PracticeUsers`)
- `app/imports/lib/permissions/PermissionValidatedMethod.jsx`
- `app/imports/lib/permissions/LoggedInValidatedMethod.jsx`
- `app/imports/lib/permissions/Permissions.jsx`
- `app/imports/lib/permissions/PermissionRender.js`
- `app/imports/lib/formSchemas/practices/chatInput.jsx`
- `app/imports/lib/formSchemas/practices/settings/practiceSettingsChat.jsx`
- `app/imports/ui/pages/practices/chat/ChatWidget.jsx`
- `app/imports/ui/pages/practices/chat/PracticeChat.jsx`
- `app/imports/ui/pages/practices/chat/PracticeChatContainer.jsx`
- `app/imports/ui/pages/practices/chat/Message.jsx`
- `app/imports/ui/pages/practices/settings/PracticeSettingsPage.jsx`
- `app/imports/ui/layouts/AppLayout.jsx`
- `app/imports/i18n/resources/client/nl.i18n.js` (keys `practice.chat.*`, `practice.settings.chat.disabled.label`, `forms.placeholder.newMessage`)
- `app/imports/i18n/resources/client/fr.i18n.js` (same keys in French)
