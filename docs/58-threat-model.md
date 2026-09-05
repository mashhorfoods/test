# Threat model

Written 4 September 2026. The last open item in P1-6, and the document Phase 16
has been missing since the audit.

---

## 1. Method, and what this is not

Read against the source and the built output, in this environment. **No live
penetration test was run** — the egress policy blocks outbound requests to the
production host, and every statement here about the deployed site is inferred
from the artifact that gets uploaded rather than observed on it. Where that
distinction matters, it is marked.

This is a threat model for a **static brochure site run by one person**. It is
deliberately not an enterprise document: most of the OWASP Top 10 does not
apply here, and pretending otherwise would bury the three risks that do.

## 2. What is worth attacking

| Asset | Why someone would want it |
| --- | --- |
| **The domain** | Redirect traffic, take deposits under the studio's name, or hold it to ransom |
| **The hosting account** | Replace the site, or quietly add a payment page |
| **The GitHub account** | Change the source so the next legitimate deploy ships the attacker's code |
| **The studio's name** | The site publishes prices and a WhatsApp number. A convincing copy can take a 50% deposit from a real buyer |
| **Visitor privacy** | Almost nothing to take — see §3 |

Note what is **not** on this list: there is no customer database, no card data,
no credentials store, no user content. The valuable things here are accounts and
reputation, not data.

## 3. The attack surface that does not exist

This is the largest security property the project has, and it was bought by
architecture rather than by controls. Verified in the source:

| Common attack | Why it does not apply |
| --- | --- |
| SQL injection | No database, no server-side code at all |
| Stored XSS | Nothing a visitor sends is stored or re-rendered |
| CSRF | No authenticated actions to forge |
| Auth bypass, session theft | No accounts, no sessions, no login |
| File-upload RCE | No uploads |
| Admin-panel compromise | No admin panel — a scope decision, `docs/36` §4 |
| Dependency vulnerabilities at runtime | **Zero runtime dependencies.** No framework, no npm package reaches the browser |

**DOM-based XSS, checked rather than assumed.** `innerHTML`, `outerHTML`,
`eval`, `new Function` and `document.write` appear **nowhere** in
`src/scripts/`. The two places that read untrusted input both handle it:

- `focus.js` takes the URL fragment, and uses it via `getElementById` and a
  `CSS.escape`d attribute selector inside a `try`/`catch` — a crafted fragment
  finds nothing and throws nothing.
- `navigation.js` reads a stored language and accepts it only if it is exactly
  `ar` or `en`; anything else falls back.

`contact.js` assigns `location.href`, which is the one sink worth naming — the
value is a `mailto:` URL it builds itself with `encodeURIComponent`, so a form
field cannot smuggle a scheme or a newline into it.

## 4. The threats that remain, ranked

Ranked by expected cost, which is not the same as likelihood.

### T1 — Account takeover · **highest**

Registrar, hosting, or GitHub. Any one of them lets an attacker replace what
visitors see; the registrar lets them take the address permanently.

*Current control:* **2FA on the registrar, the host and GitHub, plus the
registrar's transfer lock — confirmed done by the owner, 5 September 2026.**

This section previously read *"Unverified — I cannot see whether two-factor
authentication is enabled on any of them, and that is the single most important
unknown in this document."* It is no longer unknown, and T1 drops from the
largest open risk to a controlled one.

**Still true, and worth keeping in view:** these remain personal accounts
(`docs/60` §3), so account recovery still runs through one person's email and
phone. 2FA protects the front door; it does not change who owns the building.
And since `docs/63` chose Option 0, **the GitHub account is now also the
content management system** — which raises what that one login is worth, and is
another reason the second remote in `docs/57` §4 is not optional.

### T2 — Build-machine compromise · **high impact, low likelihood**

There is no CI. The site is built on one laptop and uploaded by hand, so
whatever that laptop runs is what visitors get. `package-lock.json` is
committed, which pins the three build-time tools. `ffmpeg-static` and
`playwright-core` execute during a build; `axe-core` is read as a string and
injected into a headless browser during `npm run check`, so it never runs in
this process — and none of the three ever reaches a visitor.

*Current control:* the lockfile; three dependencies rather than two hundred;
`npm run check` would catch a *visible* change, not a hidden one.

*What to do:* nothing structural at this scale. Do not run `npm install` on a
machine you would not trust with the domain, and prefer `npm ci`.

### T3 — The one third-party script · **medium**

`https://plausible.io/js/script.js` is the only off-origin code the site loads,
and the CSP permits exactly that origin and no other. If Plausible were
compromised, that script runs on every page.

*Current control:* the CSP confines the damage — the attacker's script could
not load further code from a third origin or exfiltrate to one, because
`connect-src` is `'self'` and plausible.io only.

*Not applied:* Subresource Integrity. Plausible updates that file in place, so
a pinned hash would break analytics silently on their next release — trading a
real availability problem for a small integrity gain. **Self-hosting the script
is the better answer if this ever matters more**, and it removes the origin
from the CSP entirely.

### T4 — Impersonation · **medium, and specific to this business**

The site is a single self-contained file. Anyone can save it, change the
WhatsApp number, and host it elsewhere — with real prices, a real process and
a real-looking studio, taking 50% deposits.

*Current control:* the verification band names a person and links to profiles a
stranger can check, which is exactly the defence against this. `docs/30` PS-01
argued it as a conversion feature; it is a security control too.

*Gap:* nobody is looking. A quarterly search for the studio's own headline text
and price table would find a clone.

### T5 — Email spoofing · **medium**

Quotes and invoices travel by email. Without SPF, DKIM and DMARC on the sending
domain, anyone can send mail that appears to come from the studio — and the
usual target is a client, with changed bank details.

*Current control:* none known. Mail currently goes from a personal Gmail
address, which carries Google's own authentication for `gmail.com` but says
nothing for the studio's domain.

*What to do:* when domain email is set up — which C-6 has been open on since
the audit — publish SPF, DKIM and a DMARC policy at the same time, not later.

### T6 — Loss of the security headers · **medium, and it nearly happened**

`.htaccess` carries the CSP, `nosniff`, the referrer policy, HSTS, the clean
URLs and the custom 404. It is a hidden file, control-panel file managers drop
it, and **the site looks perfect without it**.

*Current control:* `qa.js` §11 now verifies the file's **contents** on every
run — the CSP hashes against the shipped bytes in both directions, the 404
target, the rewrite, HSTS against config, the analytics origin. Check 4 in
`docs/44` §2 verifies it is being **served**. `docs/57` schedules a monthly
re-check.

*Gap:* the file being correct and the file being present are different
questions, and only the first is automated. The monthly serve-check is still a
calendar reminder, not an alarm.

### T7 — Denial of service · **low, and not ours**

A static site on shared hosting. Absorbing traffic is the host's problem, and
there is no application layer to exhaust.

### T8 — Visitor privacy · **low by construction**

No cookies, no accounts, no server-side logging under our control. Plausible is
cookieless and aggregate. The form and the package buttons hand the message to
the visitor's own mail client or WhatsApp — nothing transits our
infrastructure, because we do not have any.

## 5. The three things worth doing

Everything else above is either already controlled or not worth the effort at
this scale.

1. ~~**2FA on the registrar, the host and GitHub**, plus a registrar transfer
   lock.~~ **DONE 5 September 2026.** This was T1, and T1 was the whole model.
2. **SPF, DKIM and DMARC**, at the moment domain email is created rather than
   after.
3. **A quarterly search for a cloned site.** Five minutes, and the verification
   band is what makes the clone lose.

## 6. If something happens

**Defacement or unexpected content.** Rebuild from source and re-upload —
`npm run release`, then the four checks. The repository is the truth; the
server holds a copy. Then find out how they got in, because re-uploading over
an attacker who still has the password just gives them a second turn.

**Domain theft.** Contact the registrar immediately; transfers have a reversal
window that closes. Meanwhile the site can be served from any host on any
address — the build is portable, only `.htaccess` is Apache-specific.

**GitHub compromise.** Assume every branch is untrusted. The deployed zip and
the last known-good commit are both recoverable; **the second remote in
`docs/57` §4 is what makes "known-good" a thing you still have.**

**Plausible compromise or a bad script.** Remove `analytics.provider` from
`site.config.json`, rebuild, upload. Two minutes, and the site loses its only
third-party request rather than its function.

## 7. When to rewrite this

This model assumes a static site with no server-side code, no accounts and no
stored data. **Each of those is load-bearing.** The moment one changes — a
booking form with a backend, a login, a CMS, a payment page — most of §3 stops
being true and this document becomes actively misleading.

Re-open it when the dashboard question in `docs/36` §4 is reopened, or twelve
months from today, whichever comes first.
