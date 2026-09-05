# Backup and monitoring

Written 4 September 2026. Closes the second half of P1-6, and the Gate 03
criterion that has been open since the release.

---

## 1. Start by being honest about the size of the problem

Most backup plans are written for systems with a database, user accounts and
state that only exists in one place. **This site has none of that**, and saying
so plainly is what keeps the plan from becoming ceremony:

- No database, no backend, no sessions, no accounts.
- No file uploads, no user-generated content.
- Nothing a visitor does is stored on the server. The contact form opens the
  visitor's own mail client; the package buttons open WhatsApp. `docs/17` and
  the privacy page both say this, and it is true.
- The deployed site is **entirely reproducible** from the repository with one
  command.

So the site itself does not need backing up. `npm run release` rebuilds it
byte-for-byte from source. What needs protecting is much smaller, and mostly
is not code.

## 2. What can actually be lost

| Asset | Where it lives | Backed up? | If lost |
| --- | --- | --- | --- |
| Source, docs, content data | GitHub `mashhorfoods/test` | **Single remote only** | The project. Every price, every string, every decision |
| Built site | `dist/`, committed, and Hostinger | Yes, twice over | Nothing — rebuildable in minutes |
| The 12 service images | `src/assets/`, committed | Yes | — |
| Hero film, share card | Committed, **and regenerable** | Yes, twice | — |
| ~~**Al Mada's four deliverable images**~~ | **The repository, and both remotes** | **Yes** | **CLOSED 5 September 2026.** Uploaded to `src/assets/originals/` at full resolution — 3.1MB across four files — and mirrored by A2's second remote. The shipped `.webp` derivatives live in `src/assets/images/`. This was the only row here whose asset was both irreplaceable and unbacked |
| Domain registration | Registrar account | N/A | The address. The single most expensive failure here |
| Hosting account | Hostinger | N/A | A weekend, and the site is down meanwhile |
| Plausible account and its history | Plausible | No export scheduled | Every measurement Phase 20 is built on |
| Enquiry history | The owner's email and WhatsApp | Whatever those providers do | The actual business record — worth more than the site |

**Read that table once more.** The three genuinely irreplaceable things — the
domain, the analytics history, and the enquiry conversations — are none of them
in the repository, and none of them are what a "website backup" usually means.

## 3. The gaps, in the order they would hurt

> **Three of these five closed on 5 September 2026** — the second remote, the
> uptime monitor and the domain-expiry alarm. Left in place rather than deleted,
> because the order they are in is the argument for doing them. Gaps 2 and 5
> remain open and are `docs/62` B2 and the follow-on to A7.

1. ~~**One git remote, one account.**~~ **Closed 5 Sep 2026.** If the GitHub account is lost or the repo
   is deleted, the project is gone: 29MB of source, twelve documents of
   reasoning, and every content decision made since the audit. `dist/` being
   committed means the *site* survives on the server, but the ability to change
   it does not.
2. **Al Mada's images are not on disk.** Recorded in `docs/48` and still true.
   If that case study ever needs rebuilding, the artwork has to come from the
   client again.
3. ~~**No uptime monitoring.**~~ **Closed 5 Sep 2026** — UptimeRobot, keyword
   mode. This was the Gate 03 criterion, and closing it made that gate a plain
   go (`docs/46` §9).
4. ~~**No domain-expiry alarm.**~~ **Closed 5 Sep 2026** — auto-renew on, plus
   the 30-day reminder. Originally: A lapsed domain is recoverable for a while and
   then is not, and it is the failure most often discovered by a customer.
5. **No Plausible export.** The free tier keeps history, but the account is a
   single point of failure for the only numbers this project measures.

## 4. Backup: what to actually do

**Weekly, automatic — a second git remote.** Ten minutes, once.

Create an empty private repository somewhere that is not GitHub — GitLab,
Bitbucket, Codeberg — and add it as a second push target:

```
git remote set-url --add --push origin https://github.com/mashhorfoods/test
git remote set-url --add --push origin <the second remote>
```

After that, `git push` writes to both. One command, two providers, and the
project stops depending on one company's account recovery process.

**Both lines, in that order — and the first one is not redundant.** Verified 5
September 2026 in a throwaway repository, because these are commands the owner
runs rather than ones any harness covers.

Adding a push URL *replaces* the implicit one. So running only the second line
leaves `origin` pushing to the new host **and to nothing else**:

```
$ git remote set-url --add --push origin <the second remote>   # second line only
$ git remote -v | grep push
origin  <the second remote> (push)          <-- GitHub is gone
```

`git push` then succeeds, says nothing, and quietly stops sending anything to
GitHub. That is the worst shape a backup mistake can take: it looks like it
worked, and it is discovered when you go looking for the thing you thought was
being backed up.

**Check it once, straight after setting it up:**

```
git remote -v | grep push      # must list BOTH hosts
```

Two lines out means it is working. One line out means the first command was
skipped, and whichever host is missing has been receiving nothing.

**Monthly, manual — the things git cannot hold.** Fifteen minutes, into
whatever cloud drive is already in use:

- A note of the registrar, the hosting account and the renewal dates.
- A Plausible CSV export (Settings → Export).
- The client deliverables that are not in the repo, starting with Al Mada's.

**Never — a database dump.** There is no database. If a future feature adds
one, this section stops being true and the plan needs rewriting; that is worth
saying out loud, because "we have backups" tends to outlive the architecture
it was written for.

## 5. Monitoring: four things, one of them free

| What | Why | How | Alert when |
| --- | --- | --- | --- |
| **The site responds** | The obvious one | UptimeRobot free tier, 5-minute interval, on the apex | Two consecutive failures |
| **The page still has content** | A 200 that returns an empty page is the failure a status check misses — a bad upload looks healthy | Same monitor, keyword mode, watch for `One Partner` | The word disappears |
| **The security headers survive** | `.htaccess` is hidden, file managers lose it, and the site looks perfect without it | `curl -sI` monthly, or securityheaders.com | `content-security-policy` missing |
| **The domain and certificate** | The most expensive failure and the most forgotten | Registrar auto-renew ON, plus a calendar reminder 30 days before | — |

**Why keyword monitoring rather than status alone.** Every failure this site has
actually had would have returned 200: the `.htaccess` going missing, a partial
extract, a build uploaded with a broken page. A monitor that only asks "did the
server answer" would have said yes to all of them.

**Plausible is not monitoring.** It tells you about traffic, and a fall to zero
does eventually mean something is wrong — but it takes a day to be sure, and by
then anyone who tried to hire you has gone elsewhere.

## 6. Recovery: three scenarios, with real times

**The site is down or serving the wrong thing.** ~15 minutes.

1. Check Hostinger is up before assuming it is you.
2. `npm run release` locally — all three harnesses must end with zero.
3. Upload `pixora-site.zip` to `public_html` and extract.
4. Confirm `.htaccess` is there (hidden files on) and re-run the four checks in
   `docs/44` §2.

**The hosting account is lost.** ~2 hours, most of it waiting for DNS.

The site is not on the server in any sense that matters — it is in the repo.
Point the domain at any static host, upload the same zip, done. `.htaccess` is
Apache-specific, so on a host that is not Apache the compression, headers,
clean URLs and custom 404 need re-creating; everything else is portable.

**The GitHub account is lost.** Currently: **the project is unrecoverable
beyond the deployed files.** After §4's second remote: ~5 minutes, clone and
carry on. That difference is the whole argument for the ten-minute task.

## 7. What to do this week

Everything above is either free or under twenty minutes. In order:

1. ~~**Add the second git remote.**~~ **Done 5 Sep 2026.**
2. ~~**Add the UptimeRobot monitor** with the keyword check.~~ **Done 5 Sep
   2026** — and it closed the last open Gate 03 criterion, as predicted.
3. ~~**Confirm registrar auto-renew is on**, and put a 30-day reminder in the
   calendar.~~ **Done 5 Sep 2026.**
4. **Ask Al Mada for their four images** — the same message that asks for the
   result sentence. **Still the only item here still open**, and the only
   irreplaceable asset in `docs/57` §2 that is backed up nowhere. **Closed 5 Sep 2026** — the files are in the repository and on both remotes.

## 8. Review

This plan assumes a static site with no database and no stored user data. If
any of those three change — a booking form with a server behind it, a login, a
CMS — **stop and rewrite this document before shipping the feature.** A backup
plan quietly inherited by a system it was not written for is worse than none,
because it is believed.

Next review: when the dashboard question in `docs/36` §4 is reopened, or twelve
months from today, whichever comes first.
