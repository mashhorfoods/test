# Acting on the visitor audit — fixes 2, 3, 4 and 5

**7 September 2026.** `docs/108` ended with five things to fix. The owner asked
for four of them; the fifth — a real client testimonial — needs a person, not a
commit.

---

## Fix 2 — the contact form could fail silently

**What I said in the audit, and where it was wrong.** I wrote that the form is
`action="mailto:…" method="post"` and left it there. That is true of the
markup, but `contact.js` already intercepted `submit`, built a properly encoded
`mailto:` with subject and body, and navigated to it — and its module comment
already named the exact risk: *"A `mailto:` that opens nothing is the silent
failure the whole contact section is being rebuilt around."* Half my finding
was answered before I raised it. Correcting that plainly, because the audit
will be read after this.

**What was actually still broken, in two places.**

1. **The no-JavaScript path.** `method="post"` with `enctype="text/plain"` to a
   `mailto:` is the one combination browsers handle worst — Chrome and Safari
   largely do nothing at all. Now `method="get"`, which is what a browser can
   turn into a usable mail draft.

2. **The JavaScript path, at the only moment that mattered.**
   `window.location.href = 'mailto:…'` reports nothing back. If a mail client
   opens, the visitor is gone. If none is registered — a work desktop, a
   browser where nobody ever set one — **nothing happens, silently**, and the
   status line said the message was ready to send. The visitor believes they
   have made contact. Nobody ever hears from them.

   There is no event to listen for, so the honest move is to stop claiming
   success. On every submit the form now reveals a recovery block: *"If your
   email app did not open, nothing has been sent yet"* plus two working routes
   — WhatsApp, and a copy control for the address. A visitor whose mail app did
   open never reads it; one whose did not now has somewhere to go.

   The WhatsApp href is **copied from the channel already on the page** rather
   than written a second time, so `site.config.json` stays the single source
   for that number. If the channel is missing, the button is removed rather
   than left pointing nowhere. The copy control reuses the section's existing
   `[data-copy]` implementation, so there is one answer to "did the clipboard
   actually work".

## Fix 3 — the homepage never said who it was for

*"A remote studio for the Gulf and Egypt"* existed on `/about`, which a visitor
reaches only by clicking. A buyer in Cairo could not tell the site was for
them; a visitor outside the region could not tell it was not.

The same sentence now opens the hero paragraph — the one piece of prose every
visitor reads. No new claim, no new translation: both languages were already
written on `/about`.

## Fix 4 — the best sentence on the site was at screen 10

> *"The difference is not what gets made — it is how much of the coordinating
> you have to do yourself."*

That is the only place the site says what it actually sells: not four services,
but the coordination between them. It sat inside `#integrated`, ten screens
down, long after a visitor had decided whether to keep reading.

It now opens **Services**, the first section after the hero, replacing *"Five
services. Open any one to see what it covers"* — which was an instruction, not
an argument. `#integrated` keeps its section and loses the duplicate sentence;
its lead is now the part only that section makes: *"The same four services,
arranged two ways — as four projects you hold together, or as one you do not."*

That is also one fewer statement of "one partner" on a page that made it four
times (`docs/108` §5).

**And a second, softer step in the hero.** The hero offered exactly one action
— *Start Your Project* — the highest-commitment thing on the site, asked of
someone who arrived ten seconds ago. Beside it now: **See what it costs** →
`/pricing`. Prices are this studio's most unusual card, and `/about` already
argues precisely this: *"we would rather you could decide whether we are worth
a conversation before having one."*

## Fix 5 — what happens after I contact you, and the gmail address

**The question is answered.** Below the form:

> *"Your message goes to Muhalab, who does the design and the build — not to an
> account manager. The first reply asks about the business; nothing gets
> designed before that."*

Both facts are already on the site — `/about` ("you deal with the person doing
the work") and process stage 01 ("understand the business… before anything is
designed"). **No response time is promised, because none has been decided.**
Inventing "we reply within 24 hours" would be the first unbacked claim on a
site whose stated policy is that it does not publish what it cannot prove.

**The address was deliberately NOT changed.** `muhalabsalah@gmail.com` is a
free mailbox on a studio that sells websites and domain setup, and the audit
rates it the second-largest trust cost after the missing testimonial. But
swapping in `hello@…` before that mailbox exists would lose real enquiries,
which is strictly worse than the trust cost. It is **one field** —
`site.config.json → contact.email` — plus `node build.js`, and `qa.js` §19 then
names every page that still disagrees. The warning now sits in that field's own
comment, where the person changing it will read it.

---

## Owner actions still outstanding

| | Action | Why only you can do it |
| --- | --- | --- |
| 🔴 | **One named client testimonial** — ideally Al Mada | It has to be a real quote from a real client. `docs/108` rates it the single largest trust gain available |
| 🟠 | **A mailbox on the domain**, then one field in `site.config.json` | The address has to receive mail before the site can publish it |
| 🟠 | **Decide a response time** | "We reply within X" needs a number you will actually hold to |
| 🟡 | **Arabic review of four new strings** | Written to match the site's existing phrasing, but they belong in the B3 batch (roadmap item 10) before launch |

The new Arabic strings, for that review:

| English | Arabic as written |
| --- | --- |
| A remote studio for the Gulf and Egypt. *(reused verbatim from /about)* | استوديو يعمل عن بُعد في الخليج ومصر. |
| See what it costs | اطّلع على الأسعار |
| The same four services, arranged two ways — as four projects you hold together, or as one you do not. | الخدمات الأربع نفسها، مرتّبة بطريقتين — أربعة مشاريع تتولّى أنت ربطها، أو مشروع واحد لا تفعل. |
| If your email app did not open, nothing has been sent yet. Use either of these instead: | إذا لم يفتح تطبيق البريد لديك، فلم يُرسَل شيء بعد. استخدم أحد هذين البديلين: |
| Send it on WhatsApp / Copy the email address | أرسلها عبر واتساب / انسخ عنوان البريد |
| Your message goes to Muhalab, who does the design and the build — not to an account manager. The first reply asks about the business; nothing gets designed before that. | تصل رسالتك إلى مهلب، الذي ينفّذ التصميم والتطوير — لا إلى مدير حسابات. أول ردّ يسأل عن العمل نفسه؛ ولا يبدأ أي تصميم قبل ذلك. |

---

## Verified

| | |
| --- | --- |
| `validate` | 0 findings |
| `qa` | 0 high, 0 medium, 1 pre-existing low |
| `a11y` | 0 violations |
| Hero lead | opens "A remote studio for the Gulf and Egypt." in both languages |
| Hero actions | `Start Your Project → #contact` · `See what it costs → ./pricing` |
| Services lead | carries the coordination sentence |
| `#integrated` | duplicate sentence gone, section intact |
| Form | `method="get"`, no `enctype`, action unchanged |
| Fallback | hidden at rest, shown after submit, WhatsApp href copied from the live channel, copy button carries the declared address |
| Console errors | 0 |
| i18n | every translatable string carries Arabic; two stale JSON keys retired |
