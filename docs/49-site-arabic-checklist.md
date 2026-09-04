# The rest of the site in Arabic — review checklist

`docs/48` covered the case study. This covers everything else: the homepage and
its nine sections, the twelve packages, the add-ons, the process, contact, the
verification band, the footer and navigation, and the three content pages.

Same split as before — **fixed** where it was wrong, **decided** where it was a
judgement call. Part 2 was originally twelve open questions for a native
speaker; the owner asked for them to be answered here, so each now carries the
answer and the reason behind it. Nine kept the site as it stood, three changed
it.

---

## Part 1 — fixed

### 1. Five service terms were keyed to themselves

`i18n-ar.json` mapped *Content Strategy*, *Community Monitoring*, *Audience
Targeting*, *Campaign Strategy* and *Audience Research* to **the same English
words**. The Arabic view showed English — while the package cards beside them
already said استراتيجية المحتوى and استهداف الجمهور. **One page, one concept,
two languages.** Now consistent with the cards.

### 2. Four comparison lines were half-English sentences

The lines that explain what separates one tier from the next read like this:

> `Audience Targeting وResearch وSegmentation`
> `Ad Creative وAd Copy وCopywriting`
> `إعداد الحملات وCampaign Monitoring وRetargeting`

An Arabic conjunction glued to a Latin word, three times in a row, in the
sentences whose whole job is to make a buyer choose a tier. Rewritten in Arabic
using the terminology the cards now use:

> استهداف الجمهور وبحثه وتقسيمه
> التصاميم الإعلانية ونصوص الإعلانات وكتابة المحتوى الإعلاني
> إعداد الحملات ومتابعتها وإعادة الاستهداف

### 3. The platform sentence was restructured, not just unglued

`— Ads Starter تغطي منصة واحدة، وAds Growth تغطي Meta` became
`— تغطي Ads Starter منصة واحدة، وتغطي Ads Growth منصات Meta، بينما تغطي Ads
Performance منصات Meta و Google.`

Putting the verb before the Latin name removes the glue without spacing the
conjunction oddly, and *بينما* gives the third clause the contrast the English
has.

### 4. Two smaller things

- **قالب Presentation → قالب عرض تقديمي.** A template name that is a common
  noun, not a product.
- **خطأ ٤٠٤ → خطأ 404** on the error page — the last Arabic-Indic numeral on a
  site that sets numbers in Western digits.

### 5. One of my own fixes, reverted

I had translated `Facebook + Instagram` to `فيسبوك + إنستغرام` in a package,
which then disagreed with the service sections beside it, where the platforms
are Latin. **Platform names stay Latin everywhere** — that is what the rest of
the site does, and what the logos say. See question 1 below.

---

## Part 2 — the twelve decisions, answered

Answered on 4 September 2026 on the owner's instruction, for a Gulf + Egypt
B2B audience in Modern Standard Arabic. **Nine are "keep what is there".
Three changed the site** — marked ✎ — and those three are already applied,
rebuilt and verified. Overrule any of them and it is one edit each.

**Names and terms**

1. **Platform names stay Latin.** *Facebook Ads, Google Ads, Meta, Reels,
   TikTok Ads, Snapchat Ads.* These are product names carrying their own
   logos, and every agency, invoice and ad account in both markets writes
   them in Latin. فيسبوك reads as a news article, not as an ad platform.
   Transliteration would also break the ad-platform names, which have no
   settled Arabic form — إعلانات ميتا is not what anyone types.
   **Rule: any name with a logo stays Latin.**

2. **Package names stay Latin** — *باقة Social Growth*, *كل ما في باقة
   Professional*. Same rule, and a harder reason: the package name travels
   into the WhatsApp message, the invoice and the contract. If the site says
   باقة النمو الاجتماعي and the invoice says Social Growth, the client is
   reconciling two names for one purchase. One SKU, one spelling.

3. **باقة, not حزمة.** باقة is the word both markets already use for a
   priced service tier — every telecom in the Gulf and Egypt sells باقات.
   حزمة reads as a technical bundle of items, closer to *bundle* than to
   *plan*. Kept throughout; no instance of حزمة on the site.

4. **All three current terms are right — no change.**
   - **مونتاج الفيديو**, not تحرير الفيديو. مونتاج is the professional word
     in both markets; تحرير is ambiguous (it is also *editing text* and
     *liberation*).
   - **بحث الوسوم**, not الهاشتاقات. وسم is the standard term and the one in
     X's own Arabic interface. It also sidesteps a dialect trap:
     هاشتاق (Gulf ق) versus هاشتاج (Egypt ج) would force the site to pick a
     side. وسم is read the same in Riyadh and Cairo.
   - **تتبّع التحويلات**, never تتبع الكونفيرجن. Transliterating a term that
     has a settled Arabic equivalent is the single fastest way to look like
     a translated site.

**Grammar and format**

5. **Prices keep the plain `290 دولار`.** The strict `290 دولارًا` is correct
   when the number is spelled out or read aloud, but the site sets figures in
   digits, where no case ending is pronounced or visible. Applying it to
   11–99 and not to `1200 دولار` would make one price on the card look
   different from the next for a reason no reader can see. Consistency wins
   over an ending nobody voices.

6. **Dates keep one form — `4 سبتمبر 2026`.** سبتمبر is the month name used
   in both the Gulf and Egypt; أيلول is Levantine and Iraqi, outside the
   target markets. No per-market split, so no second date string to maintain.

7. **Western numerals everywhere, confirmed.** Prices, dates, `خطأ 404` and
   the reply window all use `0–9`. Arabic-Indic digits on a page whose prices
   sit beside Latin package names would read as two typographic systems in
   one card.

**Register and tone**

8. **The hero reads confident, not clipped — keep.**
   `علامتك. حضورك الرقمي. شريك واحد.` The three-beat parallel structure works
   in Arabic for the same reason it works in English, and each fragment is a
   complete noun phrase, so nothing sounds truncated. The lead beneath it
   carries the full sentence, which is what stops the fragments reading as
   telegraphese.

9. ✎ **The reply promise changed:**
   `نردّ خلال ساعتَي عمل` → **`نردّ خلال ساعتين في أوقات العمل`**.
   The dual construct ساعتَي عمل is correct MSA, but undiacritised — and
   diacritics get stripped by copy, by search results, by half the fonts in
   use — it reads as ساعتي عمل, *my working hour*. This is the sentence the
   whole conversion path rests on; it cannot carry a misreading. The new form
   is unambiguous, and the line below it (`من الأحد إلى الخميس`) supplies the
   days. Changed in `navigation-map.js`, where the promise lives once.

10. ✎ **The privacy page gains one gloss:** ملفات تعريف ارتباط **(كوكيز)** on
    first mention, formal term alone thereafter. The formal term is the right
    register for a privacy page and is what a reader checking compliance
    expects; كوكيز is what most readers recognise on sight. The parenthesis
    gives both without a second vocabulary. Standard practice in Arabic
    privacy policies, and it costs four words once.

11. **The "what we will not do" list reads as honest — keep it blunt.**
    Parallel negation (`لا ننشر… لا نبدأ… لا نقبل… لا ننشر…`) is a commitment
    structure in Arabic, not a complaint one; it lands as تعهّد. Softening it
    to قد لا نقوم would drain the paragraph of the exact quality it is there
    to demonstrate. The heading `ما لا نفعله` stays flat on purpose — the
    force belongs in the four lines, not in the label.

12. ✎ **The verification band reads as reassurance — with one heading fix.**
    `تحقّق بنفسك:` followed by two links a reader can actually open is the
    opposite of a claim needing softening; it is the claim being handed over
    for checking. But the heading `من تتحدث إليه` was slightly off — Arabic
    takes تحدّث مع for a person — and it disagreed with the About page, which
    already says `مع من تعمل`. Changed to **`مع من تتحدث`**: natural, and now
    parallel with the About heading.

---
## Part 3 — how to give the answers back

Every string above lives in one of four files, and changing it is one edit plus
`node build.js`:

| Content | File |
| --- | --- |
| Package names, features, prices, scope facts | `src/data/pricing.json` |
| The case study | `src/data/story.json` |
| UI strings — buttons, labels, the reply promise | `src/scripts/navigation-map.js` |
| Everything else on the homepage | `index.html`, both language spans |
| About, Pricing, Privacy | `src/pages/*.html` |

Marking a printout is fine — send it back and I will apply it. The three
changes above are already in these files; the nine "keep" answers changed
nothing, which is the point of writing them down: the next person to touch an
Arabic string can see the rule instead of re-deciding it.

---

## Part 4 — verified after these changes

`node build.js` · `tools/validate.js` **0** · `tools/qa.js` **0**, bilingual
parity included — re-run after the three decisions above were applied. No untranslated Arabic string remains except the platform and
package names held Latin by decision, and no Arabic letter is glued to a Latin
one anywhere on the site.
