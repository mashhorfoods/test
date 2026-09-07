# Pixora — five buyer sessions, the moderator's pack

**Prepared 7 September 2026. This is the sheet to run a session from.** Print
it or keep it on a second screen. `docs/68` is the reasoning behind it and does
not need to be open while you moderate.

Forty minutes each, five people, one afternoon.

---

## 0. Before the first one

| | |
| --- | --- |
| **What they use** | Their own phone, their own network. Not your laptop |
| **Where they start** | `https://zaokalyamamah.online` — the real site, not a preview |
| **Language** | Two of the five should do the whole session in Arabic |
| **What you say first** | *"I did not build this and you cannot hurt my feelings. If something is confusing, that is the site's fault, not yours."* It is a lie and it is the single most effective thing you will say |
| **Recording** | Their screen, and their voice. Ask first. If they say no, run it anyway and take notes |

### The one rule that decides whether this works

> **Do not help.**

When they get stuck, count to ten before you speak. **Being stuck is the
finding.** Every time you rescue someone you delete the most valuable data in
the session.

If they ask you a direct question, answer with: *"What would you do if I
weren't here?"*

---

## 1. The five tasks

Read each **aloud, verbatim**. Do not paraphrase — the wording is the same for
all five people so the answers can be compared. The right-hand column is what
you watch for; do not read it out.

| | Say this | It passes if |
| --- | --- | --- |
| **1** | *"Find the package you would choose, and start a conversation about it."* | They reach WhatsApp with the package named, **without backtracking** |
| **2** | *"For that price, what would you get — and what would you not get?"* | They answer both, without asking you |
| **3** | *"Who would you be hiring here, and how would you check they are real?"* | They name the person and open one proof link |
| **4** | *"Send us a brief about your project."* | **Nobody believes they sent something that did not send** |
| **5** | *"Roughly what would your project cost?"* | They land within one tier of the right answer |

### Task 1 — record the route, not just the outcome

The packages are **not on the homepage**. There are three ways through, and
which one they take is the most useful single observation of the afternoon:

1. the **Pricing** link in the navigation;
2. a service block's **"See all … packages"** link;
3. the **service index** at the top of `/pricing`, once they arrive.

Routes 2 and 3 were built on reasoning, not evidence. **Five people will settle
whether they work better than any further argument can.**

### Task 4 — the one to watch hardest

The contact form opens the visitor's own mail app rather than submitting. If
someone walks away believing they made contact when **no message exists**, that
is the most expensive defect on the site, and no harness can detect it.

The form is on the **homepage only**. If they are on `/pricing` when you read
task 4, getting back is part of the task — note it if they cannot.

**One participant is enough to make this a defect.** Not three. One.

---

## 2. Three things to watch for, never to ask about

### 2.1 Do our four service names name what they want?

Branding & Design · Websites · Social Media · Marketing & Ads. **Every one
names an output.** Watch for someone who reads all four and still cannot tell
which is theirs, who picks one and changes their mind after opening it, or who
describes their own need in words none of the four use.

**Write down the words they use.** Those words are the finding, and they are
worth more than any preference they could state.

### 2.2 Does anyone fail to find a price at all?

On the homepage the first figure is **5.8 screenfuls down** on a phone. If
someone gives up before reaching it, or asks *"where are the prices"*, that is
a decision of ours being wrong — and it is reversible in one line of
`build-pricing.js`.

### 2.3 Does the page end before they do?

The homepage is **26 screenfuls on a phone.** Watch for the moment scrolling
speeds up, or they stop reading and start skimming. **Note the section they
were in when it happened.** That is worth more than any opinion about length,
including theirs.

---

## 3. Three new things since these tasks were last revised

All added on 7 September, none of them yet observed by anyone.

### 3.1 The FAQ — six questions, near the end

*Who will I work with · Where are you based · How long does it take · What if I
don't like the design · Who owns the files · Why are you cheaper.*

These were written from the questions a first-pass audit said a buyer would
still have. **Nobody has checked whether they are the questions real buyers
actually ask.**

> **Watch, do not ask:** does anyone ask you, out loud, a question that the FAQ
> already answers? If they do, **the FAQ is in the wrong place, not missing an
> entry.** Note where they were on the page when they asked it.

### 3.2 Seven photographs of real work

Selected Work now shows real branding work — a monogram, a business card,
signage, a shop interior, a shopfront, packaging, a colour palette — instead of
placeholders.

> **Watch:** do they stop on it? Does anyone ask *whose* work it is? The site
> does not currently say, and if two people ask, that is the answer to whether
> a caption should name the client.

### 3.3 The Brand Challenge — a quiz that gives a discount

Near the end of the page. A scenario, four options, two attempts, a code.

> **Watch, and be honest with yourself about the answer:** does anyone play it?
> Does anyone who plays it then behave differently — go to pricing, start a
> conversation? Or does it read as a promotional gimmick on a site otherwise
> arguing for craft?
>
> **If nobody plays it, or if it cheapens the impression, say so in the notes.**
> It was commissioned and built deliberately, and it can be removed the same
> way the previous prize mechanic was. Five people not touching it is a result.

---

## 4. Recording it, in the moment

One line per event. Do not write essays during the session.

```
P3 · task 1 · route 2 · 4m10s · found it, but opened Websites first
P3 · task 4 · SENT NOTHING AND BELIEVED THEY HAD ← flag
P3 · unprompted · "is this the same thing again?" at section 7
P3 · FAQ · asked me how long it takes, never opened the FAQ
```

Afterwards, one paragraph per participant while it is fresh. **What they did,
not what they said about what they did.**

---

## 5. What happens with the results

They go into `docs/62` §B5 and then into the tracker as individual items, each
carrying the participant's own words.

Three specific things these sessions can **overturn**, and which nothing else
can:

| | What five people can settle |
| --- | --- |
| Prices off the homepage | Revert if anyone fails to find a price |
| Service names by output, not outcome | Rename if their words are consistently different from ours |
| The Brand Challenge | Remove if it is ignored or if it cheapens the impression |

These are not hypotheticals we are defending. **Each has a written revert, and
the sessions are the only evidence that would trigger one.**

---

## 6. If you only get three people

Run tasks **1, 4 and 5**, and watch §2.2 and §3.1. Task 4 alone justifies the
afternoon.
