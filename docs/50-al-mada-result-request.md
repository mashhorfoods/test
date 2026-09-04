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

## Part 4 — status: drafted, not sent (4 September 2026)

The message is written and sitting as a **Gmail draft** in the agency account,
Arabic first, with the two verification questions from Part 3 folded in so one
send closes F1–F3 as well as the missing sentence. It also gained a paragraph
that Part 2 did not have — **the offer from our side**:

> ومن جانبنا: نحن نعتبر أنفسنا مسؤولين عن هذا العمل بعد تسليمه. إن احتجتم
> مقاسًا جديدًا لإعلان، أو تعديلًا في الملف التعريفي، أو نسخة من ملفات الهوية،
> راسلونا — التعديلات الصغيرة من هذا النوع لا كلفة عليها.

Asking a past client for a favour reads better when the message also gives them
something, and this is something we can actually honour: small post-handover
changes at no charge. It is also true, which the rest of this project has
insisted on.

**Two things are missing before it can go out, and neither is mine to invent:**

1. **An address for Al Mada.** There is none in this repository, and a search
   of the agency mailbox found no correspondence with them — every hit was a
   newsletter or a mada-card promotion. Guessing an address for a real company
   is not an option.
2. **A URL that actually serves the page.** The draft links to the case study,
   and nothing has been deployed from this environment. The link must point at
   a page the client can open, on the day it is sent.

Fill both in and send. Everything else in the message is final.
