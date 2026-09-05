# The one sentence from Al Mada — and what stands in until it arrives

## Why this is a separate document

Chapter 05 of the case study ends on what was delivered. Every other gap in
this project has been closed by doing the work; this one cannot be, because the
missing piece is **a fact about someone else's business**. It has to come from
Al Mada or it does not exist.

I was asked to write it from our side. **I have not written a result, and I
will not** — a sentence in our voice describing what changed for Al Mada is an
invented testimonial no matter how carefully it is worded, and this site's own
About page says, in both languages, that there is no invented statistic, client
or testimonial anywhere on it. Publishing one about a named real company would
also be a claim about a third party who never made it.

What I have written instead is in two parts: **the sentence that legitimately
comes from our side**, already on the page, and **the message that gets the
real one**, below.

---

## Part 1 — what now stands in its place (applied)

Chapter 05's aside carried the honest position already. It now carries the
consequence too, so a reader who notices the absence is told why it is there
rather than left to assume we had nothing to show.

**English**

> Prices on the campaign artwork are Al Mada's own. We do not publish results
> we cannot prove: this chapter stops at what was delivered. Any number that
> joins it later will come from Al Mada, and you will be able to check it.

**Arabic**

> الأسعار الظاهرة في تصاميم الحملات تخصّ «المدى». ونحن لا ننشر نتائج لا نستطيع
> إثباتها: يقف هذا الفصل عند ما سُلِّم. وأي رقم يُضاف إليه لاحقًا سيأتي من
> «المدى» نفسها، ويمكنك التحقق منه.

This is a promise about our own conduct, which we can keep, rather than a claim
about Al Mada's business, which we cannot verify. It is the strongest thing
that can truthfully sit in that position — and on a page whose whole argument
is that we do not invent things, an admitted gap is worth more than a filled
one.

---

## Part 2 — the message that gets the real sentence

Send this to Al Mada. It asks for the smallest thing that would work, gives
them an easy way to say a partial yes, and does not put words in their mouth.

**Arabic — send this one**

> السلام عليكم [الاسم]،
>
> نشرنا صفحة تعرض العمل الذي أنجزناه لوكالة المدى — الهوية والموقع والحملات
> والملف التعريفي — ويمكنكم الاطلاع عليها هنا: [الرابط]. لا يوجد فيها أي رقم
> أو ادعاء عنكم؛ كل ما فيها هو ما سُلِّم فعلًا، ويمكنكم مراجعته قبل أي شيء آخر.
>
> ينقص الصفحة شيء واحد فقط: **جملة منكم عمّا تغيّر بعد العمل**. جملة واحدة
> تكفي، وبكلماتكم أنتم. أمثلة لما قد يكون مفيدًا:
>
> - «صار الناس يسألون عن البرنامج بدل أن يسألوا من نحن.»
> - «أصبحنا نرسل الملف التعريفي بدل أن نشرح كل مرة.»
> - «زاد عدد الاستفسارات عبر الموقع.» (مع رقم إن أمكن، وإن لم يمكن فبدونه)
>
> وإن فضّلتم عدم ذكر أي أرقام، فجملة وصفية بلا رقم مقبولة تمامًا. وإن فضّلتم
> ألّا يُنشر شيء، تبقى الصفحة كما هي دون أي إضافة.
>
> شكرًا لكم على الثقة.

**English — if they prefer it**

> Hello [name],
>
> We have published a page showing the work we delivered for Al Mada — the
> identity, the website, the campaigns and the company profile. You can read it
> here: [link]. It contains no figure and no claim about your business; it shows
> only what was delivered, and you are welcome to review it before anything else.
>
> One thing is missing: **a sentence from you about what changed after the
> work**. One sentence is enough, in your own words. Things that would help:
>
> - "People started asking about the programme instead of asking who we are."
> - "We send the profile now instead of explaining every time."
> - "Enquiries through the site went up." (with a number if you have one,
>   without one if you would rather not)
>
> If you would rather not give any figures, a sentence with no number is
> completely fine. If you would rather we publish nothing, the page stays
> exactly as it is.
>
> Thank you for trusting us with the work.

**Why it is shaped like this.** It leads with what is already published so they
can check we have not overclaimed; it names one small ask instead of a
questionnaire; the three examples show the *shape* of a useful answer without
supplying words they can simply agree to; and it offers two exits — no numbers,
or nothing at all — so a "no" costs them nothing and does not cost us the
relationship.

---

## Part 3 — while you wait, and the check on F1–F3

The same message can close the three unconfirmed facts in `docs/48` at no extra
cost. Add one line:

> وللتأكد فقط: هل وصف «رحلات العمرة وبرامج السفر» دقيق لما تقدّمونه؟ وهل
> أسماء أقسام الموقع كما هي منشورة الآن؟

That settles **F2** and **F3** outright, and **F1** — whether a traveller hands
over documents at booking — is answered by anything they say about how a
booking actually runs.

**When the sentence arrives:** it goes into `src/data/story.json` as a quoted
line in chapter 05, attributed by name and role, in the language they wrote it
in with a translation beside it — never a translation alone presented as the
quote. Then `node build.js`. Nothing else on the page has to move.

**If it never arrives:** the page stays publishable exactly as it is. A case
study that shows the work and admits it has no result is a weaker sales
document and a stronger honesty signal, and this site has already chosen which
of those it optimises for.

---

## Part 4 — status: NOT DELIVERED (corrected 5 September 2026)

> **THIS SECTION WAS WRONG.** It recorded the message as sent. It was sent and
> **it bounced one second later**:
>
> > `550 5.1.1 The email account that you tried to reach does not exist.`
> > — `madatravel@gmail.com`, 4 Sep 2026 02:47:28
>
> **Al Mada never received it.** The bounce sat unread in the inbox while
> `docs/62`, then `docs/69`, carried B2 as *"sent, waiting on Al Mada"* for a
> day. They were not slow to reply; there was nothing to reply to.
>
> The lesson is the one this project keeps relearning in other forms: **a
> thing that reports success is not a thing that worked.** "Sent" was written
> from the act of sending, not from a delivery receipt, and the receipt was
> two inches away in the same mailbox.
>
> One accident worth noting: the bounced message asked Al Mada to confirm the
> section names *«لماذا المدى»* — the exact quotation `docs/76` later found to
> be wrong. Not sending it spared us asking a client to confirm our own error.

## Part 4 (as originally written) — status: sent (4 September 2026)

**Sent to madatravel@gmail.com on 4 September 2026**, Arabic first, with the two verification questions from Part 3 folded in so one
send closes F1–F3 as well as the missing sentence. It also gained a paragraph
that Part 2 did not have — **the offer from our side**:

> ومن جانبنا: نحن نعتبر أنفسنا مسؤولين عن هذا العمل بعد تسليمه. إن احتجتم
> مقاسًا جديدًا لإعلان، أو تعديلًا في الملف التعريفي، أو نسخة من ملفات الهوية،
> راسلونا — التعديلات الصغيرة من هذا النوع لا كلفة عليها.

Asking a past client for a favour reads better when the message also gives them
something, and this is something we can actually honour: small post-handover
changes at no charge. It is also true, which the rest of this project has
insisted on.

**What had to be settled first.** The message links to the case study, and the
GitHub Pages link serves the repository's default branch — which still carried
the *previous* story page, *Connecting ideas to impact*, with no mention of Al
Mada anywhere in it. Sending that link would have invited a client to read a
page about themselves that did not mention them.

So `claude/master-design-system-setup-5oy6mo` was fast-forwarded to this
branch (no divergence, nothing overwritten, with the owner's permission), and
`https://mashhorfoods.github.io/test/story.html` now resolves to
*Al Mada — one brand, four surfaces*. Verified in git, not in a browser: this
environment cannot reach github.io, so the live page has not been opened by
anyone here.

**Open until Al Mada replies:** the missing sentence, and F1-F3. If the reply
answers any of them, the edits go into `src/data/story.json` and
`docs/48-story-arabic-checklist.md`.

---

## Part 5 — B2 is two tasks with two different owners, 5 September 2026

Checked while the owner was recording the reference material. **B2 has been
carried on `docs/69` as one item owned by Al Mada. Half of it is not theirs.**

| | What | Owner | Status |
| --- | --- | --- | --- |
| **B2a** | The result sentence, and F1–F3 | **Al Mada** | **Sent 4 Sep.** Waiting. Nothing to do |
| **B2b** | **The four deliverable images** | **The owner — we made them** | **Not sent, not asked for, not in the repository** |

Al Mada will never deliver B2b, because Al Mada did not make those files. We
did. `docs/57` §2 records them as *"Nowhere. No. Already lost once. They were
pasted into chat, never uploaded."* — the only row in that table whose asset is
both irreplaceable and unbacked.

**So B2b has been sitting behind a reply that cannot contain it.** That is
`docs/69` §6's rule failing in the other direction: a task filed under the
wrong blocker.

### What the case study shows today, measured

The page is **fully illustrated** — and it is worth being precise, because a
first look for `<img>` elements returns zero and that is misleading:

| | |
| --- | --- |
| Figures | **5**, one per chapter |
| Each | 580×435px, inline SVG, 20–23 drawn shapes |
| Share of the page | **33% of 6,525px** |
| Photographs or screenshots of the work | **0** |

The five sketches are good and deliberate: hand-drawn schematics that carry
meaning without images, in a screen reader, and under reduced motion
(`build-story.js` §25). They are not a defect and they should stay.

**What they illustrate is the argument, not the artefact.** The figures are
*"Four separate boxes, tilted at different angles"*, *"The same four boxes,
with dashed lines searching between them"*, *"The four boxes aligned in a
row"*. Beside them, the chapter headings promise:

> *"The flight path draws the letter."*
> *"Not a logo. A kit that survives the next designer."*
> *"Arabic first, on the screen the customer actually uses."*
> *"The same brand, on the poster and in the brochure."*

**A case study about visual identity work, on a design agency's site, contains
no picture of the logo, the kit, the website or the poster.** A third of the
page is illustration and none of it is the work.

### What to do

**Find the four files.** They are the logo/identity, the brand kit, the Arabic
website, and the poster or company profile — our own deliverables, so they may
still exist in the design tool that made them, in the handover sent to Al Mada,
or in the chat they were pasted into. **Any resolution is better than none**,
and a screenshot of the live Al Mada site covers one of the four immediately.

Once they exist as files, placing them is not a redesign: `story.json`'s
chapters already carry a `sketch` field per chapter, and adding a photograph
alongside it is a schema addition rather than a layout change. That work is
mine and it is small — **but it cannot start until the files exist**, which is
why this is filed as an owner task rather than left implicit.

**If they are genuinely gone**, say so and the page stays exactly as it is —
`Part 3` already argued that a case study which shows the work and admits it
has no result is the honest trade this project keeps choosing. But losing them
twice would be a different thing from choosing not to show them.


---

## Part 6 — B2b closed, 5 September 2026

The four files arrived. What was done with them:

| | |
| --- | --- |
| **Originals** | `src/assets/originals/`, full resolution, 3.1MB. Never shipped — the build only processes images referenced in markup. This is the archive `docs/57` §2 was missing |
| **Shipped** | `src/assets/images/al-mada-{identity,campaign,profile,website}.webp`, 34–85KB, matching the 14–61KB band the other images already use |
| **Placed** | Identity in chapter 02, website in 04, campaign and profile in 05. Chapters 01 and 03 keep their sketch alone |
| **Alt text** | Written per image in both languages, describing what is in the picture rather than naming it |

**The sketches stay.** They are not placeholders the photographs replace: the
sketch carries the argument — four boxes searching for each other, then aligned
— and the photograph carries the artefact. `Part 5` argued for both and both
are there.

**Three things the measurement caught before they shipped:**

1. **The deliverables rendered 70px wide on desktop.** The markup made them a
   third child of the chapter's twelve-column grid, so they fell into an
   implicit column. They now span the full twelve on their own row.
2. **The campaign sheet was upscaled 1.32×** — 900px of image in a 1192px
   column, which goes soft. `build-story.js` now reads each WebP's real
   dimensions from its header and emits `width`, `height` and a cap, so
   nothing is ever displayed larger than it is. The `width`/`height` pair also
   removes the layout shift as each image loads.
3. **Alt text was English in both languages** — as it is for the twelve
   service images, and as it had been everywhere on this site. Any image with
   `data-alt-en` / `data-alt-ar` now switches with the page. **The twelve
   service images still carry a single English alt** and could adopt the same
   pair; that is a real remaining gap, recorded rather than quietly widened
   into.

Weight: `/story` is **492KB total transfer** against `qa.js` §9's 1MB budget,
and the HTML itself grew 196.7KB → 202.4KB, because images above 12KB are
copied to `assets/` and cached rather than inlined.

`validate: 0 · qa: 0 high · a11y: 0`, alt present on every image, nothing
upscaled at 390, 768, 1440 or 1920, in both languages.

**Still open with Al Mada:** the result sentence, F1, F2 and F2a. One reply
closes all four.

---

## Part 7 — the message, ready to send

Written 5 September 2026, after the bounce. **Shorter than the original**: F3
is retired (chapter 04 no longer quotes the section names, so there is nothing
to confirm), and F2a is added — the question the deliverables raised.

**It has not been sent.** `madatravel@gmail.com` does not exist, and no other
address for Al Mada is known. Two routes, either of which works:

- **WhatsApp `+966 508531560`** — the number on their own campaign posters,
  marked with the WhatsApp icon. In this market that is the normal way to
  reach a travel agency, and it is the channel this entire site is built
  around. Paste the Arabic below.
- **A working email address**, if you have one. Say the word and it goes.

### Subject

> صفحة عن العمل الذي أنجزناه لوكالة المدى — أربعة أسئلة قصيرة

### Arabic

> السلام عليكم ورحمة الله وبركاته،
>
> نشرنا في موقع بيكسورا صفحة تعرض العمل الذي أنجزناه لوكالة المدى للسفر
> والسياحة — الهوية البصرية، والموقع الإلكتروني، وحملات عروض العمرة، والملف
> التعريفي:
> https://mashhorfoods.github.io/test/story.html
>
> وقبل أي شيء: الصفحة لا تتضمن أي رقم أو نتيجة أو ادعاء عن نشاطكم. كل ما فيها
> هو ما سُلِّم فعلًا، والأسعار الظاهرة في تصاميم الحملات مكتوب أنها تخصكم
> أنتم. وإن رأيتم فيها ما لا يناسبكم، نعدّله أو نحذف الصفحة بالكامل — القرار
> قراركم.
>
> وأربعة أسئلة قصيرة، يكفي سطر واحد لكل منها:
>
> **١)** عند الحجز، متى يسلّم المسافر مستنداته ومواعيده والمبلغ — في لحظة
> الحجز نفسها، أم في مرحلة لاحقة؟
>
> **٢)** كيف تصفون نشاطكم بكلماتكم أنتم؟ نكتب حاليًا «رحلات العمرة وبرامج
> السفر»، فإن كان الأدق غير ذلك فلنكتبه كما تقولونه.
>
> **٣)** في إعلانات العمرة التي صمّمناها، الرحلات بين بورتسودان وجدة ذهابًا
> وإيابًا. فمن هم المسافرون عادةً — قادمون من السودان، أم مقيمون في السعودية،
> أم الاثنان معًا؟ كنا قد كتبنا «لعملاء في السعودية» ثم حذفناها، لأننا لا نريد
> أن نصف عملكم بما لم تقولوه.
>
> **٤)** وإن كان لديكم جملة واحدة عمّا تغيّر بعد العمل، بكلماتكم أنتم، ننشرها
> منسوبة إليكم كما كتبتموها. وإن لم تكن هناك جملة، تبقى الصفحة كما هي، ولا
> مشكلة إطلاقًا.
>
> ومن جانبنا: نحن نعتبر أنفسنا مسؤولين عن هذا العمل بعد تسليمه. إن احتجتم
> مقاسًا جديدًا لإعلان، أو تعديلًا في الملف التعريفي، أو نسخة من ملفات الهوية،
> راسلونا — التعديلات الصغيرة من هذا النوع لا كلفة عليها.
>
> شكرًا لثقتكم بنا في هذا العمل.
>
> مهلب صلاح
> بيكسورا

### English, for the record

> We have published a page on the Pixora site showing the work we delivered for
> Al Mada Travel & Tourism — the visual identity, the website, the Umrah offer
> campaigns and the company profile.
>
> Before anything else: the page carries no figure, no result and no claim
> about your business. It shows only what was delivered, and the prices in the
> campaign artwork are marked as yours. If anything on it does not suit you, we
> change it or take it down — that is your call.
>
> Four short questions, one line each is plenty:
>
> **1)** At booking, when does a traveller hand over documents, dates and
> payment — at the booking itself, or later?
> **2)** How do you describe the business in your own words? We currently write
> "Umrah trips and travel programmes."
> **3)** The Umrah campaigns we designed route Port Sudan to Jeddah and back.
> Who usually travels — people coming from Sudan, people resident in Saudi
> Arabia, or both? We had written "for Saudi customers" and removed it, because
> we do not want to describe your business in words you did not use.
> **4)** If you have one sentence about what changed after the work, in your
> words, we publish it attributed to you. If there is no sentence, the page
> stays as it is.
>
> And from our side: we consider ourselves responsible for this work after
> handover. A new ad size, a change to the profile, a copy of the identity
> files — write to us, small changes carry no charge.

**Which questions this closes:** F1 (§1), F2 (§2), **F2a** (§3), and the
missing result sentence (§4). F3 needs nothing — the quotation it was about is
gone.


---

## Part 8 — the WhatsApp version, 5 September 2026

Email is out: `madatravel@gmail.com` does not exist (Part 4). **WhatsApp is the
route**, and the number is on Al Mada's own campaign posters — the one with the
WhatsApp mark beside it, `+966 508531560`.

**This session has no WhatsApp connector**, so it cannot send. What it can do
is the same thing this site does twelve times on its own pricing cards: a
`wa.me` link with the message already written. Opening it starts the chat with
the text in the box; the owner presses send.

**Shorter than the email deliberately.** A formal letter pasted into WhatsApp
reads like a letter pasted into WhatsApp. This is 753 characters, keeps all
four questions, and drops the paragraph of reassurance to one line.

### The message

```
السلام عليكم ورحمة الله، معكم مهلب من بيكسورا.

نشرنا صفحة تعرض العمل الذي أنجزناه لكم — الهوية، والموقع، وحملات العمرة، والملف التعريفي:
https://mashhorfoods.github.io/test/story.html

ليس فيها أي رقم أو نتيجة عن نشاطكم، وإن لم يناسبكم شيء فيها نعدّله أو نحذفها — القرار قراركم.

وأربعة أسئلة قصيرة، سطر لكل منها:

١) متى يسلّم المسافر مستنداته والمبلغ — عند الحجز أم لاحقًا؟

٢) كيف تصفون نشاطكم بكلماتكم؟ نكتب حاليًا «رحلات العمرة وبرامج السفر».

٣) إعلانات العمرة صمّمناها بين بورتسودان وجدة — فمن هم المسافرون عادةً؟ قادمون من السودان، أم مقيمون في السعودية، أم الاثنان؟

٤) وإن كان لديكم جملة عمّا تغيّر بعد العمل، بكلماتكم، ننشرها منسوبة إليكم. وإن لم تكن، تبقى الصفحة كما هي.

وأي تعديل على التصاميم بعد التسليم فهو علينا بلا كلفة. شكرًا لثقتكم.
```

### The link

`https://wa.me/966508531560?text=%D8%A7%D9%84%D8%B3%D9%84%D8%A7%D9%85%20%D8%B9%D9%84%D9%8A%D9%83%D9%85%20%D9%88%D8%B1%D8%AD%D9%85%D8%A9%20%D8%A7%D9%84%D9%84%D9%87%D8%8C%20%D9%85%D8%B9%D9%83%D9%85%20%D9%85%D9%87%D9%84%D8%A8%20%D9%85%D9%86%20%D8%A8%D9%8A%D9%83%D8%B3%D9%88%D8%B1%D8%A7.%0A%0A%D9%86%D8%B4%D8%B1%D9%86%D8%A7%20%D8%B5%D9%81%D8%AD%D8%A9%20%D8%AA%D8%B9%D8%B1%D8%B6%20%D8%A7%D9%84%D8%B9%D9%85%D9%84%20%D8%A7%D9%84%D8%B0%D9%8A%20%D8%A3%D9%86%D8%AC%D8%B2%D9%86%D8%A7%D9%87%20%D9%84%D9%83%D9%85%20%E2%80%94%20%D8%A7%D9%84%D9%87%D9%88%D9%8A%D8%A9%D8%8C%20%D9%88%D8%A7%D9%84%D9%85%D9%88%D9%82%D8%B9%D8%8C%20%D9%88%D8%AD%D9%85%D9%84%D8%A7%D8%AA%20%D8%A7%D9%84%D8%B9%D9%85%D8%B1%D8%A9%D8%8C%20%D9%88%D8%A7%D9%84%D9%85%D9%84%D9%81%20%D8%A7%D9%84%D8%AA%D8%B9%D8%B1%D9%8A%D9%81%D9%8A%3A%0Ahttps%3A%2F%2Fmashhorfoods.github.io%2Ftest%2Fstory.html%0A%0A%D9%84%D9%8A%D8%B3%20%D9%81%D9%8A%D9%87%D8%A7%20%D8%A3%D9%8A%20%D8%B1%D9%82%D9%85%20%D8%A3%D9%88%20%D9%86%D8%AA%D9%8A%D8%AC%D8%A9%20%D8%B9%D9%86%20%D9%86%D8%B4%D8%A7%D8%B7%D9%83%D9%85%D8%8C%20%D9%88%D8%A5%D9%86%20%D9%84%D9%85%20%D9%8A%D9%86%D8%A7%D8%B3%D8%A8%D9%83%D9%85%20%D8%B4%D9%8A%D8%A1%20%D9%81%D9%8A%D9%87%D8%A7%20%D9%86%D8%B9%D8%AF%D9%91%D9%84%D9%87%20%D8%A3%D9%88%20%D9%86%D8%AD%D8%B0%D9%81%D9%87%D8%A7%20%E2%80%94%20%D8%A7%D9%84%D9%82%D8%B1%D8%A7%D8%B1%20%D9%82%D8%B1%D8%A7%D8%B1%D9%83%D9%85.%0A%0A%D9%88%D8%A3%D8%B1%D8%A8%D8%B9%D8%A9%20%D8%A3%D8%B3%D8%A6%D9%84%D8%A9%20%D9%82%D8%B5%D9%8A%D8%B1%D8%A9%D8%8C%20%D8%B3%D8%B7%D8%B1%20%D9%84%D9%83%D9%84%20%D9%85%D9%86%D9%87%D8%A7%3A%0A%0A%D9%A1%29%20%D9%85%D8%AA%D9%89%20%D9%8A%D8%B3%D9%84%D9%91%D9%85%20%D8%A7%D9%84%D9%85%D8%B3%D8%A7%D9%81%D8%B1%20%D9%85%D8%B3%D8%AA%D9%86%D8%AF%D8%A7%D8%AA%D9%87%20%D9%88%D8%A7%D9%84%D9%85%D8%A8%D9%84%D8%BA%20%E2%80%94%20%D8%B9%D9%86%D8%AF%20%D8%A7%D9%84%D8%AD%D8%AC%D8%B2%20%D8%A3%D9%85%20%D9%84%D8%A7%D8%AD%D9%82%D9%8B%D8%A7%D8%9F%0A%0A%D9%A2%29%20%D9%83%D9%8A%D9%81%20%D8%AA%D8%B5%D9%81%D9%88%D9%86%20%D9%86%D8%B4%D8%A7%D8%B7%D9%83%D9%85%20%D8%A8%D9%83%D9%84%D9%85%D8%A7%D8%AA%D9%83%D9%85%D8%9F%20%D9%86%D9%83%D8%AA%D8%A8%20%D8%AD%D8%A7%D9%84%D9%8A%D9%8B%D8%A7%20%C2%AB%D8%B1%D8%AD%D9%84%D8%A7%D8%AA%20%D8%A7%D9%84%D8%B9%D9%85%D8%B1%D8%A9%20%D9%88%D8%A8%D8%B1%D8%A7%D9%85%D8%AC%20%D8%A7%D9%84%D8%B3%D9%81%D8%B1%C2%BB.%0A%0A%D9%A3%29%20%D8%A5%D8%B9%D9%84%D8%A7%D9%86%D8%A7%D8%AA%20%D8%A7%D9%84%D8%B9%D9%85%D8%B1%D8%A9%20%D8%B5%D9%85%D9%91%D9%85%D9%86%D8%A7%D9%87%D8%A7%20%D8%A8%D9%8A%D9%86%20%D8%A8%D9%88%D8%B1%D8%AA%D8%B3%D9%88%D8%AF%D8%A7%D9%86%20%D9%88%D8%AC%D8%AF%D8%A9%20%E2%80%94%20%D9%81%D9%85%D9%86%20%D9%87%D9%85%20%D8%A7%D9%84%D9%85%D8%B3%D8%A7%D9%81%D8%B1%D9%88%D9%86%20%D8%B9%D8%A7%D8%AF%D8%A9%D9%8B%D8%9F%20%D9%82%D8%A7%D8%AF%D9%85%D9%88%D9%86%20%D9%85%D9%86%20%D8%A7%D9%84%D8%B3%D9%88%D8%AF%D8%A7%D9%86%D8%8C%20%D8%A3%D9%85%20%D9%85%D9%82%D9%8A%D9%85%D9%88%D9%86%20%D9%81%D9%8A%20%D8%A7%D9%84%D8%B3%D8%B9%D9%88%D8%AF%D9%8A%D8%A9%D8%8C%20%D8%A3%D9%85%20%D8%A7%D9%84%D8%A7%D8%AB%D9%86%D8%A7%D9%86%D8%9F%0A%0A%D9%A4%29%20%D9%88%D8%A5%D9%86%20%D9%83%D8%A7%D9%86%20%D9%84%D8%AF%D9%8A%D9%83%D9%85%20%D8%AC%D9%85%D9%84%D8%A9%20%D8%B9%D9%85%D9%91%D8%A7%20%D8%AA%D8%BA%D9%8A%D9%91%D8%B1%20%D8%A8%D8%B9%D8%AF%20%D8%A7%D9%84%D8%B9%D9%85%D9%84%D8%8C%20%D8%A8%D9%83%D9%84%D9%85%D8%A7%D8%AA%D9%83%D9%85%D8%8C%20%D9%86%D9%86%D8%B4%D8%B1%D9%87%D8%A7%20%D9%85%D9%86%D8%B3%D9%88%D8%A8%D8%A9%20%D8%A5%D9%84%D9%8A%D9%83%D9%85.%20%D9%88%D8%A5%D9%86%20%D9%84%D9%85%20%D8%AA%D9%83%D9%86%D8%8C%20%D8%AA%D8%A8%D9%82%D9%89%20%D8%A7%D9%84%D8%B5%D9%81%D8%AD%D8%A9%20%D9%83%D9%85%D8%A7%20%D9%87%D9%8A.%0A%0A%D9%88%D8%A3%D9%8A%20%D8%AA%D8%B9%D8%AF%D9%8A%D9%84%20%D8%B9%D9%84%D9%89%20%D8%A7%D9%84%D8%AA%D8%B5%D8%A7%D9%85%D9%8A%D9%85%20%D8%A8%D8%B9%D8%AF%20%D8%A7%D9%84%D8%AA%D8%B3%D9%84%D9%8A%D9%85%20%D9%81%D9%87%D9%88%20%D8%B9%D9%84%D9%8A%D9%86%D8%A7%20%D8%A8%D9%84%D8%A7%20%D9%83%D9%84%D9%81%D8%A9.%20%D8%B4%D9%83%D8%B1%D9%8B%D8%A7%20%D9%84%D8%AB%D9%82%D8%AA%D9%83%D9%85.`

**If the link is awkward on a phone**, the block above is the message — paste
it into a normal chat with `+966 508531560`. The wording is what matters, not
the mechanism.

### What each question closes

| | Question | Closes |
| --- | --- | --- |
| ١ | When documents and payment change hands | **F1** |
| ٢ | How they describe the business in their own words | **F2** |
| ٣ | Who actually travels, given Port Sudan ↔ Jeddah | **F2a** |
| ٤ | One sentence about what changed | **the result sentence**, and chapter 05's number |

**F3 is not asked**, because chapter 04 no longer quotes their section names.
That is one fewer thing to ask a client, bought by fixing our own page.
