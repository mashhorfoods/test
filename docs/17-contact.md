# Stage 17 — Contact

The last placeholder on the page. Every CTA on this site has pointed at
`#contact` since Stage 02; from this stage it arrives somewhere that works.

Verified by `scratchpad/contact.js` — 5 groups, both directions, with and
without JavaScript.

---

## 1. The values, and where they live

Three direct channels and three external profiles were supplied. They are the
first business data on this site that is not a price, and they are handled the
same way prices are: **authored once, rendered everywhere, never reformatted.**

| Channel | Shown | Action |
| --- | --- | --- |
| WhatsApp | `+249 962672192` | `https://wa.me/249962672192` |
| Phone | `+249 119005441` | `tel:+249119005441` |
| Email | `muhalabsalah@gmail.com` | `mailto:muhalabsalah@gmail.com` |

| Elsewhere | |
| --- | --- |
| LinkedIn | `https://www.linkedin.com/in/muhalabsalah/` |
| Behance | `https://www.behance.net/MuhalabSalah` |
| Website | `https://muhalabsalah.github.io/muhalabsalah/` |

`CONTACT_CHANNELS` and `SOCIAL_LINKS` in `src/scripts/navigation-map.js` are the
source. The test compares every visible string and every `href` against the
brief character for character, and separately asserts that **no other number and
no other email address appears anywhere on the page** — the failure mode worth
guarding against is not a wrong link, it is a second, stale copy of a number
someone forgot to update.

Nothing was added: no address, no business hours, no other platform. The test
greps the section for each of those and fails if one appears.

## 2. The channels are the section, not a sidebar

They are set at heading scale as full-width rows with a rule between them, and
they come **first in the DOM**. On a phone — where most of this traffic will be
— tapping a number beats typing a message, and a visitor who wants to call
should not have to scroll past three form fields to find the number.

The hover affordance is permanent under `@media (hover: none)`, because a coarse
pointer never hovers and an arrow that only exists on hover does not exist on a
phone.

## 3. The form has no backend, and does not pretend to

§03 forbids inventing an email service. So the form does not have one.

```html
<form action="mailto:muhalabsalah@gmail.com" method="post"
      enctype="text/plain" data-contact-form="muhalabsalah@gmail.com">
```

That `action` is the whole no-JavaScript path: the form genuinely submits to the
approved address with scripting disabled, and the test asserts it. `contact.js`
only **upgrades** it — it intercepts the submit and builds a properly encoded
`mailto:` with a subject and a readable body, so the visitor's mail app opens
pre-filled instead of receiving a raw form dump.

What it does not do is the point:

- **No `fetch`, no `XMLHttpRequest`, no endpoint.** There is no server to call.
  The test greps the module's source and fails if either appears.
- **No fabricated success.** The status line says *"Opens your email app with
  the message ready to send."* — which is what actually happened. It never says
  "Message sent", because nothing here can know that. The test asserts the
  status text and asserts the absence of any delivery claim.

The three fields are labelled and `required`, so an empty submit is blocked by
the browser's own validation rather than by script. When a real form service
arrives it replaces the `action` and the one submit handler; no markup and no
CSS moves.

## 4. The footer's reserved row, filled

Stage 15 shipped the footer with no social links and left a note: the bottom row
"take[s] them the moment they exist." They now exist, so it holds them — rendered
from the same `SOCIAL_LINKS` array the mobile drawer uses, so the two can never
disagree, and seeded in the markup so they survive with JavaScript off.

The direct channels are **not** repeated there. They are one screen above, at
heading scale; a second quieter copy would only compete with them.

## 5. Two bugs this stage found

### The page had been shipping with no JavaScript at all

Removing the Stage 01 `scaffold.css` link took the closing `-->` of its comment
with it. The comment then ran on and swallowed both `<script>` tags:

```html
<!-- Scaffolding for the not-yet-built sections. Deleted as each stage
    <script> … </script>
    <script type="module" src="./src/scripts/main.js"></script>
```

The page still rendered, still navigated and still read correctly — which is
exactly why nothing looked wrong, and is the strongest argument yet for having
built every feature as an enhancement over working markup. It surfaced only
because the Stage 17 RTL check clicked the language toggle and the language did
not change. A test that had merely *looked at* the page would have passed.

### The drawer's social links opened unsafely

`SOCIAL_LINKS` had been empty since Stage 15, so the renderer that fills it had
never actually run. With real data it did — and it set `rel="noopener
noreferrer"` but no `target="_blank"` and no "opens in a new tab" announcement.
Both are now set in the renderer, and the global audit's link check was rewritten
from *"there are no external links"* (true until this stage) to *"every external
link opens safely, and every off-site destination is an approved one."*

## 6. Open

- **The numbers are +249 (Sudan), not +966.** The site is briefed for the Saudi
  market. They are used exactly as supplied, because §02 says not to change
  them — but they are worth a second look.
- **The email and all three profiles are personal, not Pixora-branded.** Same
  reasoning, same flag.
- **Arabic copy for this section's own prose.** The channel and form labels ship
  in both languages; the eyebrow, headline and intro carry `data-i18n-pending`
  like the rest of the page.
- **No form service.** Until one exists, a submitted message depends on the
  visitor having a working mail client.
