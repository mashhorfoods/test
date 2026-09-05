# Brief for the screen-reader pass

Written 5 September 2026. `docs/62` B6.

**Thirty to forty minutes, with a screen reader you already use.** VoiceOver on
an iPhone is the most representative device for this site's market; NVDA on
Windows or VoiceOver on macOS are equally welcome.

`/accessibility` publicly states that **no screen reader has been used on this
site by a person**. This brief exists to end that, and to make the time count.

---

## 1. What was already fixed, so it is not re-found

Before writing this, the accessibility tree — the thing a screen reader
actually reads — was dumped for every interactive element on the homepage, in
both languages, and read as a listener would hear it. **Three defects came out
of that, and all three are fixed.** Each had passed every automated check,
because in each case the element *had* an accessible name; the name was just
useless.

| Was announced as | Now announced as |
| --- | --- |
| `button "Copy"` — copy *what*? | `button "Copy the email address"` |
| `link "See what it covers"` — **five times, one per service, identical** | `link "See what it covers in Branding & Design"`, and four more like it |
| `link "Website"` — website of what? | `link "Founder's portfolio"` |

**Worth knowing how the first one nearly went wrong.** The obvious fix — a
visually-hidden span inside the button — would have been silently destroyed on
boot, because that button carries `data-i18n` and the runtime sets
`textContent`, which wipes children. It uses `aria-label` instead, through a
mechanism the site already had. A fix that looks right in the markup and does
nothing in the browser is the failure mode worth naming here.

**What remains duplicated is deliberate:** "Start Your Project" appears four
times and the navigation links twice, always to the same destination. WCAG
permits that, and `docs/30` §11 argued for it.

## 2. What only you can judge

Automated rules catch perhaps a third to a half of real defects, and I have now
taken most of the rest of the mechanical layer. **Everything below is the part
that needs ears.**

### 2.1 Does the page make sense read in order?

Put the cursor at the top and read straight down without touching anything
else. The homepage is nine sections and ~22 screens.

- Does the order match the argument, or does something arrive before the thing
  that explains it?
- **The four service sections have near-identical structure** — heading, four
  images, three price cards, four times. Is that orienting, or is it the point
  where you stop being able to tell where you are?

### 2.2 The headings, as a list alone

Pull up the headings list and read only that.

- Does it work as a table of contents?
- One `<h1>`, thirteen `<h2>`, many `<h3>`. Does any heading promise something
  the section does not deliver?

### 2.3 The images

Twelve service images carry written alt text — *"Brand construction — grid and
logo geometry"*, *"Typography specimen"*, *"A Reel design"*.

- **Do they tell you anything, or do they just occupy time?** These describe
  brand-guideline artwork, which is genuinely hard to convey, and nobody who
  listens to alt text has ever heard these.
- Would you rather they were marked decorative and skipped entirely? That is a
  legitimate answer and easy to apply.

### 2.4 The one interaction that carries the business

Every package button opens WhatsApp with a message already written.

1. Reach a package button and activate it.
2. **Is it clear before activating that this leaves the site and opens
   WhatsApp?**

The name is "Ask about Starter". It does not say WhatsApp. That is a real
question and I do not know the answer.

### 2.5 The mobile menu, and the language toggle

- Open the menu. Are you *in* it — is the page behind unreachable — and does
  Escape close it and return you where you were?
- The language toggle is two buttons, `EN` and `AR`, with `aria-pressed`. Is it
  obvious what they do before pressing? Pressing `AR` changes the whole page's
  direction and language.

### 2.6 Arabic, if you read it

The page direction reverses and every Arabic passage is marked `lang="ar"`, so
a screen reader should switch to an Arabic voice rather than spelling Arabic
out in English.

- **Does the voice actually switch?**
- Do the mixed strings — `Professional — from 990 USD`, phone numbers — read
  sensibly, or does the direction change mangle them?

## 3. What not to spend time on

- **Contrast, target sizes, missing alt, form labels, heading order, landmarks.**
  All machine-checked on every build; axe-core reports zero violations across
  every page at two widths in both languages.
- **The `/styleguide` page.** Internal, never deployed.

## 4. Reporting back

**Plain sentences are ideal.** *"On the pricing cards I couldn't tell which
package the button belonged to"* is more useful than a WCAG reference — the
criterion can be looked up, the experience cannot.

If something is wrong, what helps most is: **the page, roughly where, what you
heard, and what you expected instead.**

## 5. What happens next

Findings become changes, and `/accessibility` is updated — that page currently
states this pass has not happened, and it will say what was found rather than
quietly dropping the sentence. `docs/62` B6 closes when the changes are
applied, not when the pass happens.

**If nothing is found, that is a result too**, and it is the only kind of
evidence that would let `/accessibility` stop saying no person has ever tried.
