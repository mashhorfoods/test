# Pixora — Arabic review

**Prepared 6 September 2026. This is the brief to send.** One hour. It replaces
the earlier internal version and is current as of today's build.

---

## 0. What we are asking for

Not a translation check. **The Arabic is complete and it is accurate** — every
English string has an Arabic sibling on every page, the build fails otherwise,
and all 67 clause pairs on the Terms and Accessibility pages have been compared
line by line with no discrepancy found.

What we cannot check ourselves is whether it **sounds right**: register, tone,
and whether the words are the ones this market actually uses.

**A one-word answer to any question below is a complete answer.** Marking a
printout and sending it back is perfectly fine.

---

## 1. Start here — text written this week by a non-native speaker

Everything else in this document is Arabic that came from the client's own
source material and has been in place for weeks. **This section is new, it was
written by us, and it has never been read by an Arabic speaker.** It is
therefore the most likely place for something to be subtly wrong, and it is
short.

### 1.1 Two messages the site writes for the visitor

When someone taps a WhatsApp button, their message is **already composed**. They
send it as-is. These are the words that go out under the client's own name:

| Where | The message |
| --- | --- |
| Any "start a project" button | **مرحبًا بيكسورا — أرغب في بدء مشروع.** |
| A package button | **مرحبًا بيكسورا — أنا مهتم بباقة Starter ضمن الهوية والتصميم (من 490 دولار، لمرة واحدة).** |

Questions: is **أرغب في بدء مشروع** the natural way a business owner would open
this, or does it read as written-for-them? Is **أنا مهتم بـ** right, or too
flat? Does mixing the English package name (*Starter*) into an Arabic sentence
read normally here — we believe it does, because the source material does the
same, but this is the place to say otherwise.

### 1.2 Six phrases we wrote

| Where it appears | Arabic |
| --- | --- |
| Heading above the service chooser | **اختر الخدمة** |
| Link to a service's packages | **اطّلع على باقات الهوية والتصميم** |
| Button opening WhatsApp about a service | **اسأل عن الهوية والتصميم** |
| Name of the scrollable work gallery | **الأعمال المسلَّمة — مرّر للمزيد** |
| Caption on the campaign artwork | **مجموعة الحملة** |
| Caption on the printed profile | **الملف التعريفي** |

The service names inside them (**الهوية والتصميم**, **المواقع الإلكترونية**,
**إدارة وسائل التواصل**, **التسويق الرقمي والإعلانات**) are from the client's
own material and are not in question here — only the wording around them.

**اطّلع على** and **مرّر للمزيد** are the two we are least sure of.

---

## 2. Reading order for the rest

Homepage first — it is what most people see, and it carries the tone everything
else follows. Then Pricing, then the case study, then About. **Terms last**, and
only if time remains: it has already been checked clause by clause for meaning,
so it needs an ear, not an audit.

---

## 3. The seven decisions already open

Each is defensible. The question is which one **this market actually uses** —
Gulf and Egyptian small-business buyers.

| | Currently | The question |
| --- | --- | --- |
| Package | **باقة** | Right for a Gulf/Egypt small-business buyer? |
| Brand identity | **الهوية البصرية** | Or something else? |
| Video editing | **مونتاج الفيديو** | Or **تحرير الفيديو**? |
| Hashtags | **الوسوم** | Or **الهاشتاقات**? |
| Register | Modern Standard throughout | Professional, or stiff? |
| Marketing tone | Matches the English — plain, confident, no superlatives | Arabic marketing here often runs warmer. **Is matching the English itself the wrong choice?** |
| One Arabic for both markets | Gulf **and** Egypt | Does it land better in one? If so, which — and does it matter enough to split? |

The last two are the ones worth the most thought. The first four are one-word
answers.

---

## 4. Please do not spend the hour on

- **Whether a string exists.** Tooling proves it: every English string has an
  Arabic sibling on every page and the build fails otherwise.
- **Direction, mirroring, fonts, line breaking.** Handled and verified in both
  directions.
- **Numerals.** Western `0-9` everywhere in both languages, deliberately and
  enforced by the build — a page whose prices are Western-numeralled and whose
  body text is not asks the reader to switch systems mid-sentence. Settled; not
  reopening it.
- **The English.** Deliberately plain, and not changing. If the Arabic should be
  *warmer* than the English, say so — that is §3's marketing-tone row — but the
  English stays as it is.

---

## 5. Sending it back

A marked printout, a voice note, or a list of line numbers all work equally
well. Every string lives in one of these, English and Arabic side by side in the
same file:

| Content | File |
| --- | --- |
| Homepage | `index.html` |
| About, Pricing, Privacy, Terms, Accessibility | `src/pages/*.html` |
| Prices, package names and features | `src/data/pricing.json` |
| The case study | `src/data/story.json` |
| Buttons, menu labels, the gallery name | `src/scripts/navigation-map.js` |

Naming the English phrase is enough — we can always find the Arabic beside it.

---

## 6. What happens to the answers

Each becomes a change in both languages, or a recorded decision not to change it
and why. The review is finished when that is done, not when the notes arrive.

The two WhatsApp messages in §1.1 are the fastest to fix and the most visible:
they are the first thing a client ever sends us.

---

## Appendix — for our records only

Supersedes `docs/66`. The terminology table in §3 is unchanged from `docs/47`
§5. §1 is new: it lists the Arabic authored during the 6 September session — the
service index (`docs/87`), the gallery (`docs/86`), the reworked service actions
(`docs/88`) and the contact prefill (`docs/82`) — none of which existed when
`docs/66` was written, and all of which were written by a non-native speaker.
Extracted by diffing today's commits, not from memory: 18 Arabic fragments were
added, of which the six distinct new phrases and two messages above are what a
reviewer needs to see.
