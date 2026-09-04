# The rest of the site in Arabic — review checklist

`docs/48` covered the case study. This covers everything else: the homepage and
its nine sections, the twelve packages, the add-ons, the process, contact, the
verification band, the footer and navigation, and the three content pages.

Same split as before — **fixed** where it was wrong, **listed** where it is a
judgement only a native speaker in this market can make.

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

## Part 2 — for the native speaker: twelve decisions

Read the site in Arabic on a phone. Accept, or say which alternative you want.

**Names and terms**

1. **Platform names stay Latin** — *Facebook Ads, Instagram Ads, TikTok Ads,
   Snapchat Ads, Google Ads, Meta, Reels*. Keep, or transliterate
   (فيسبوك، إنستغرام، تيك توك، سناب شات، جوجل، ريلز)? **Whichever you choose
   must be used everywhere** — mixing is what caused fix 5.
2. **Package names are Latin inside Arabic sentences** — *اسأل عن باقة Social
   Growth*, *كل ما في باقة Professional*. Keep as product names, or
   transliterate?
3. **باقة** for package, throughout. Or **حزمة**?
4. **مونتاج الفيديو** or **تحرير الفيديو**? **الوسوم** or **الهاشتاقات**?
   **تتبّع التحويلات** or **تتبع الكونفيرجن**, which is what some teams say?

**Grammar and format**

5. **Prices read `290 دولار`.** Strictly, 11–99 takes the singular accusative —
   `290 دولارًا` — while hundreds take `1200 دولار`. Most sites write plain
   دولار everywhere. Do you want the strict form, or the common one?
6. **Dates read `4 سبتمبر 2026`** (privacy page). Right for both markets, or
   should Egypt see سبتمبر and the Gulf سبتمبر/أيلول differently?
7. **Numerals are Western throughout.** Confirmed as deliberate — say if any
   surface should use Arabic-Indic.

**Register and tone**

8. **The hero and section headlines** are short and declarative in both
   languages. Does the Arabic read confident, or clipped?
9. **The reply promise — نردّ خلال ساعتَي عمل.** Natural, or would
   *خلال ساعتين في أوقات العمل* be clearer?
10. **The privacy page** says ملفات تعريف ارتباط. Keep the formal term, or
    كوكيز, which more readers will recognise instantly?
11. **The About page's "what we will not do" list** is blunt by design in
    English. In Arabic, does blunt read as honest or as negative?
12. **The verification band** — تحقّق بنفسك، نردّ خلال ساعتَي عمل، الأعمال على
    Behance. Does it read as reassurance, or as a claim that needs softening?

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

Marking a printout is fine — send it back and I will apply it.

---

## Part 4 — verified after these changes

`node build.js` · `tools/validate.js` **0** · `tools/qa.js` **0**, bilingual
parity included. No untranslated Arabic string remains except the platform and
package names held Latin by decision, and no Arabic letter is glued to a Latin
one anywhere on the site.
