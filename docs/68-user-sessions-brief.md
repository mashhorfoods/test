# Brief for the five user sessions

Written 5 September 2026. `docs/62` B5, and WEBSTART Phase 12's outstanding half.

**Five people, twenty minutes each, on their own phone.**

`docs/33` §9 already has the tasks and the pass criteria and they are good —
they are kept verbatim below. What has never been written is **how to run the
session**, which is where these usually go wrong: a moderator who helps turns a
test into a demonstration, and a demonstration always passes.

---

## 1. Why five, and why it is worth the afternoon

Five is the standard number because the fifth person rarely shows you something
the first four did not. It is not a sample; it is a net for the obvious.

**A concrete argument for doing it.** Until 4 September, **eight of thirteen
package buttons were `display: none` on phones** — a real defect, live, that
every automated check passed because each one counted links at one width. A
single session on a real phone would have found it in the first two minutes,
because the participant would have been unable to do task 1 at all.

That is the class of thing this finds. `docs/62` §B lists six items needing a
person; this is the one that finds defects rather than judging quality.

## 2. Who counts as a participant

**A real buyer**, meaning: someone who runs a small business, or decides what it
spends on marketing.

- **Not** a designer, a developer, or anyone who has seen the site.
- **Not** a friend who will be kind. Kindness is the main threat to this
  exercise, and it is why "would you use this?" is a useless question — everyone
  says yes.
- **At least two should read Arabic** and be given the site in Arabic. Half the
  audience reads that way and none of it has been watched.
- Gulf or Egypt if possible. If not, someone who buys this kind of work anywhere
  is still worth more than nobody.

## 3. The rules that decide whether it works

Four, and the first is the one that matters.

1. **Do not help.** When they get stuck, say nothing. Count to ten. Being stuck
   *is the finding* — the moment you point, the finding is gone and cannot be
   recovered. If they truly cannot proceed, write down where, then move on.
2. **Ask them to think out loud**, and when they go quiet, ask *"what are you
   thinking?"* — never *"what would you click?"*
3. **Never ask whether they like it.** Ask what they expected to happen, and
   what happened instead.
4. **Give the task and stop talking.** Read it once, verbatim, then be silent.

## 4. The five tasks — `docs/33` §9, in plain words

Read each aloud, verbatim. The pass criterion is what to watch for, not
something to read out.

| | Say this | It passes if |
| --- | --- | --- |
| **1** | *"Find the package you would choose, and start a conversation about it."* | They reach WhatsApp with the package named, without backtracking |
| **2** | *"For that price, what would you get — and what would you not get?"* | They answer both, without asking you |
| **3** | *"Who would you be hiring here, and how would you check they are real?"* | They name the person and open one proof link |
| **4** | *"Send us a brief about your project."* | **Nobody believes they sent something that did not send** |
| **5** | *"Roughly what would your project cost?"* | They land within one tier of the right answer |

**Task 4 is the one to watch hardest.** The form opens the visitor's own mail
client rather than submitting — if someone walks away believing they made
contact when no message exists, that is the most expensive defect on the site
and no harness can detect it.

## 5. The sixth thing — watch, do not ask

Not a task. Something to notice while they do the others.

**The four service sections are half the page and share one structure** —
heading, four images, three price cards, four times. `docs/55` §6 named this as
the largest unresolved question on the site and refused to guess between the
three structural fixes, because each trades something the project has decided
it wants.

So: **while they scroll, does the repetition orient them or exhaust them?**
Watch for the moment they start scrolling faster, or say a version of *"is this
the same thing again?"*

**This is a question five buyers can answer better than any reference site
can.** The WEBSTART X analysis will show what other companies do; these sessions
show what *your* buyers do with what *you* built. If they diverge, the sessions
win.

## 6. What changed since `docs/33` §9 was written

- **Branding is now $490 / $990 / $1,990** (was $290 / $590 / $1,200), so
  task 5's "right answer" moved. Nothing else about the task changes.
- **The phone package buttons work**, so task 1 is genuinely testable on a phone
  for the first time.
- There is a **homepage proof band** naming a real client, and a **case study**.
  Task 3 has more to find than it did.

## 7. Recording it

A phone propped up, recording the screen and the voice, is enough — with
permission. Failing that, one line per participant per task:

> *What they did · where they hesitated · what they said · pass or fail*

**Do not clean it up while writing.** *"Scrolled past the pricing twice, said
'where are the prices'"* is the finding. *"Minor navigation confusion"* is not.

## 8. What happens with the results

Anything two or more participants hit is a defect and gets fixed. Anything one
person hit is a note, unless it is task 4, where **one is enough** — a person
who believes they sent a message that does not exist is a lost client.

`docs/41` Gate 02 accepted the absence of these sessions as a knowingly-carried
risk, which is not the same as retiring it. **This is what retires it**, and
`docs/62` B5 closes when the findings are applied rather than when the sessions
are run.
