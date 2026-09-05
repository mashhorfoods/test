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

## Part 4 — status: sent (4 September 2026)

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
