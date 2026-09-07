# Pixora — screen-reader pass

**Prepared 7 September 2026. This is the brief to send.** Forty minutes on a
phone. It replaces the internal version in `docs/67`, which was written on
6 September and predates half of what is on the page now.

---

## 0. What we are asking for

Put VoiceOver on and use the site the way you would use any site. **Tell us
where you got stuck, where something was announced badly, and where you could
not tell what was going on.**

We are not asking you to audit against WCAG. A machine already does that on
every change — axe-core, every page, two widths, both languages, zero
violations. **That is exactly why we need you:** everything below was found by
a person or by reading the accessibility tree by hand, and every one of them
passed the machine.

**VoiceOver on iPhone in Safari is the most useful combination**, because it is
what most of this site's Arabic-reading audience uses. If you use something
else, use that instead and tell us which.

`https://zaokalyamamah.online`

---

## 1. Four things already found and fixed — so you do not spend time re-finding them

Each of these passed every automated check. Each was useless to a listener.

| What it announced | Why that is useless | Now |
| --- | --- | --- |
| `button "Copy"` | Copy what? | Names the code it copies |
| Five links, all `"See what it covers"` | Five identical names in one list | Each names its own service |
| `link "Website"` | A word, not a destination | Says where it goes |
| Three scroll regions with **no name at all** | You land in a group and it says nothing. Added 7 Sep when the regions became keyboard-reachable and were given no label | Each names itself |
| Two galleries announcing **the same name** | The page had written two good names and the translation layer overwrote both with one generic string | A name each, in both languages |

The last two were found on 7 September while preparing this brief, and both are
now checked automatically on every change so they cannot come back.

---

## 2. What only you can judge

Six things, roughly in the order you will meet them. **A one-line answer to
each is a complete answer.**

### 2.1 The first thirty seconds

Land on the homepage and do nothing but listen.

**Do you learn what this business does and who it is for, before you get
bored?** The first line is meant to be *"A remote studio for the Gulf and
Egypt."* Tell us where in the announcement order that actually arrives.

### 2.2 Six horizontal scroll regions

The page has six areas that scroll **sideways** rather than down. Each is
keyboard-reachable and each now announces a name — *"Selected work — scroll for
more"*, *"Identity boards — scroll for more"*, and so on.

- **Does the name tell you enough to decide whether to enter?**
- Once inside, **can you get out again** without trapping?
- Is *"scroll for more"* the right instruction, or does it describe a gesture
  you do not make?

This is the part we are least confident about. Sideways scrolling is a visual
convention and we do not know how it lands as audio.

### 2.3 The Brand Challenge

A quiz on the homepage: a scenario, four options, two attempts, then a result.
It changes what is on screen four times without the page navigating.

- When you press **Start**, **are you told the question appeared?**
- The four options are radio buttons in a group. **Is the group's question
  announced before the options**, or do you meet the options first?
- There is an attempts counter. **Do you know how many you have left?**
- On a wrong answer the panel changes. **Are you told?** It is marked as a
  polite live region, which is our guess at the right strength — tell us if it
  is too quiet or too intrusive.
- On a right answer you get a code. **Can you read it, character by character,
  and can you copy it?**

### 2.4 The FAQ — six collapsed questions

Native `<details>` elements, no JavaScript.

- **Is it clear they are expandable before you open one?**
- When one opens, **does the answer follow, or do you have to hunt for it?**

### 2.5 The contact form, and what happens when it fails

The form opens the visitor's email app. **When that does not work, a recovery
block appears** offering WhatsApp and a copy-the-address button.

- Submit it. **Are you told what happened?** Something either sent or it did
  not, and we need to know that the difference is audible.
- If the recovery block appears, **is its arrival announced**, or does it
  appear silently below where you are?

This is the highest-cost item in the document. A visitor who cannot tell
whether their message sent is a lost enquiry.

### 2.6 The language switch

The site is English and Arabic and switching flips the whole page to
right-to-left.

- **Does VoiceOver switch voice** when you move to Arabic, or does it read
  Arabic in an English voice?
- After switching, **where does focus land?** Are you returned somewhere
  sensible, or dropped at the top?

---

## 3. What not to spend time on

- **Colour contrast, heading order, landmarks, alt text presence, focus
  visibility.** All machine-checked, all passing, all re-checked on every
  change. If you notice one anyway, say so — but do not go looking.
- **The styleguide page.** Internal, not linked, not for visitors.
- **Suggesting ARIA.** Tell us what you heard and what you expected to hear;
  what to change is ours to work out.

---

## 4. Sending it back

Whatever is easiest. A voice note is genuinely fine and often better — hearing
you get stuck is worth more than reading that you did.

Useful shape, if you want one:

> **Where:** the FAQ
> **Expected:** to know the questions could be opened
> **Heard:** just the question text
> **Cost:** I would not have opened any of them

Please say **which device, which screen reader and which browser.**

---

## 5. What happens to the answers

Everything you report gets an entry in our tracker with your wording attached.
Anything that changes the site is written up with what it was, why it was
wrong, and what it is now — and where a machine could have caught it, we add a
check so it cannot come back. Two of the five items in §1 got such a check on
the day they were found.

If something is wrong and we do not fix it, we will say why rather than let it
go quiet.

---

## Appendix — for our records only

`docs/67` is the internal version and stays as the record of what was known on
6 September. This pack adds §1's last two rows, §2.2 (six regions, not three),
§2.4 (the FAQ did not exist), and §2.5's recovery block. The three defects in
§1's first three rows were found by dumping the accessibility tree by hand
while writing `docs/67`; the last two were found the same way while writing
this. **Neither pass was prompted by an automated finding**, which is the
argument for this brief existing at all.
