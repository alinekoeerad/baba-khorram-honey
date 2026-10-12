# ADDENDUM A: Order Cart

### A0. Overrides to PROJECT_BRIEF.md

This addendum wins over the brief in these places:
- Brief section 1 ("nothing is sold online", "no e-commerce UI"): replaced by a **cart without payment** (below). Still out of scope: payment gateway, prices, user accounts, order history, order management in the admin, permanent storage of orders or customer data, shipping calculation, stock counts.
- Brief section 8 (future e-commerce): a minimal `ProductOption` model now exists (label + availability only; **no price, no inventory**).
- Brief section 9 ("No buy button"): replaced by an option selector + "add to cart" on the product detail page when the cart is enabled.
- Brief section 6 (contact channels): channels get an `acceptsOrders` flag.
- Brief section 12: order endpoints join the rate-limit list. Section 15: add the expired-share-link cleanup job and an env secret.
- Brief section 17: remove "Online shopping/cart" from out of scope; keep the rest listed above.
- No cookie banner is needed: localStorage is used only for functional cart data.

### A1. Business scenario

No payment gateway. The visitor adds products to a cart, then sends the order text to the business through SMS (phones only) or a messenger (WhatsApp, Telegram, Eitaa, Bale, Rubika). The business receives a message and handles everything manually. The site **does not store orders**.

### A2. Data model

- **ProductOption**: `productId`, `label` (free text such as "نیم کیلو", "یک کیلو"), `isAvailable`, insertion order. Admin can add, edit, delete and toggle availability per option. No price fields in v1 (the model must allow adding price/stock columns later without a rewrite).
- A product can be added to the cart only if the cart is enabled, the product is PUBLISHED and `isAvailable`, and it has at least one available option. Otherwise show no add-to-cart control (the existing "ناموجود" badge logic still applies). Imported products start with no options; the admin adds them later.
- **SiteSettings additions**: `cartEnabled` (default false), `cartNotice` (default "قیمت و هزینه‌ی ارسال پس از تأیید اعلام می‌شود."), `orderIntroText?`, `orderOutroText?` (max 200 chars each, plain text).
- **ContactChannel addition**: `acceptsOrders` (boolean, default false). Valid order channels: PHONE (used for SMS; admin must flag only mobile numbers, show a hint), WHATSAPP, TELEGRAM, EITAA, RUBIKA, BALE. INSTAGRAM can never accept orders.
- **OrderShareLink** (temporary): `code` (unguessable, at least 12 chars from a crypto RNG), `payloadEncrypted` (AES-256-GCM with a key from env `ORDER_LINK_SECRET`), `channelType`, `expiresAt` (30 minutes), `createdAt`. Deleted lazily on access after expiry and by a cleanup job (`pnpm orders:cleanup`) that also runs periodically. Cap active rows (for example 2000) to prevent abuse.

### A3. Cart behavior (client)

- Stored in `localStorage` key `cart:v1`: lines `{optionId, productId, qty}` plus `updatedAt`. **Expires 30 days after the last change.** Closing the browser does not clear it. No cross-device sync. Same option merges into one line. Max 30 lines, quantity 1 to 50 per line. Cross-tab sync via the `storage` event. If localStorage is unavailable (private mode), fall back to in-memory state and show a Persian warning. Implement with a tiny store (`useSyncExternalStore`); avoid heavy state libraries.
- Names/images/availability are never trusted from storage: `/cart` fetches fresh data by ids from a validated, rate-limited server endpoint (max 30 ids). Removed/unpublished/unavailable lines are flagged and must be removed before sending.
- The cart is **not auto-cleared on send** (we cannot know whether the user really pressed send). After sending, show a persistent confirmation: "سفارش را ارسال کردید؟" with "بله، سبد را خالی کن" / "نه، هنوز". 
- Customer details are saved locally only if the user ticks "مرا به خاطر بسپار" (default off) under `cart-customer:v1`.
- Cart is hidden everywhere (icon, `/cart`, `/o/*` return 404) when `cartEnabled=false`.

### A4. Pages and UI

- **Product detail**: option selector (only available options), quantity stepper, "افزودن به سبد" with an accessible live-region confirmation. Not on cards in v1.
- **Header**: cart icon with a count badge (client island, appears only when enabled).
- **`/cart`**: lines (change option/quantity, remove), `cartNotice`, then the customer form, then the channel chooser. `noindex`, never cached.
- **Customer form** (server-validated with Zod, Persian errors): first name, last name, Iranian mobile (`09xxxxxxxxx`; accept Persian/Arabic digits and convert to Latin), province, city, address (max 500, multiline), postal code (optional, 10 digits), notes (optional, max 300). **Delivery only, no in-person pickup option.** Show this privacy line: the data is not stored on the site; only for QR generation it is held temporarily (30 minutes, encrypted).
- **Channel chooser** shows only active channels with `acceptsOrders`. Device logic: detect mobile vs desktop (userAgentData/UA + coarse pointer + width) and always offer a small override ("با گوشی هستم" / "با کامپیوتر هستم").
  - **Mobile**: SMS (if a flagged PHONE channel exists) plus all flagged messengers. Selecting opens the target app with the text prefilled where verified.
  - **Desktop**: messengers only (no SMS). After selecting a messenger show a panel with: a button to open that messenger (web/desktop app), a **copy order text** button, and a **QR code for that messenger**.
- **QR rule**: the QR encodes only a **short URL** `SITE_URL/o/<code>`, never the order text or personal data. Generate the QR **in the browser** (dynamic import of a small library such as `qrcode`; no external QR service). The page `/o/<code>` is mobile-friendly and shows: the read-only order text, buttons "ارسال در <پیام‌رسان>" (prefilled deep link where verified, otherwise copy-then-open) and "کپی متن", an expiry notice; expired or unknown codes show a friendly message. Headers: `noindex`, `Cache-Control: no-store`, `Referrer-Policy: no-referrer`.
- **Fallback for messengers that cannot prefill text**: copy the text automatically, open the chat, and show "متن کپی شد، در گفتگو Paste کنید".

### A5. Server-side order building (the only trusted source of message text)

A rate-limited server action `buildOrder(cartLines, customer, channelType)`:
1. Re-validate everything: schema, line limits, each option exists and is available, product PUBLISHED, channel exists/active/`acceptsOrders`, cart enabled.
2. Strip control characters, enforce max lengths, treat everything as plain text (no HTML/markdown injection).
3. Generate a short **reference code** (e.g. `A7K3-92`, unambiguous alphabet, shown to the customer; it is not stored, so it is a reference only).
4. Build the text from a fixed template:
   - Full format (messengers): intro line (admin-editable), reference code, name, mobile, province/city/address, postal code, numbered item list (`product name - option label x quantity`), notes, outro line (admin-editable).
   - Compact format (SMS): reference code, full name, mobile, items, city plus address truncated, aim for at most about 300 characters (truncate the address first).
   - Persian digits for generated counts; Latin digits for mobile, postal code and reference code.
5. Return `{text, orderCode, links}` (deep link per channel built server-side from the verified pattern table) and, when a QR is requested, create an `OrderShareLink` and return the short URL.
6. **Never log customer fields or message text** (log only ids, counts, outcome).

### A6. Link patterns (verify, do not guess)

Verify each against official documentation and test on real devices; report which ones you could not verify and use the copy-then-open fallback for them:
- SMS: `sms:` URI with encoded body (Android and iOS differ; test both).
- WhatsApp: `https://wa.me/<number>?text=<urlencoded>` (international number, digits only).
- Telegram, Eitaa, Bale, Rubika: confirm what each supports (direct chat link by username, prefilled text or not). Do not claim prefill works unless verified.
- Always URL-encode with `encodeURIComponent`, including newlines.

### A7. Admin changes

- Product form: "گزینه‌های سفارش" editor (label, availability, add/edit/delete). Product list shows the option count.
- Settings: new "سبد خرید" tab (enable switch, notice text, intro/outro lines). Contact channel rows get the `acceptsOrders` checkbox.
- All changes are audited. There is no order list in the admin because orders are not stored.

### A8. Security and privacy

Rate limits on `buildOrder`, the cart-lookup endpoint and share-link creation. Tampering tests (fake optionId, quantity 0/999, unavailable option, draft product, oversized fields, control characters, markup in text). `ORDER_LINK_SECRET` required at boot in production. Encrypt payloads at rest, exclude `OrderShareLink` data from backups, keep it out of logs and error reports.
