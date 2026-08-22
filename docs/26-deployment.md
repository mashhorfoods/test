# Stage 26 — Deploying to Hostinger

## What to upload

Everything in **`dist/`**, into **`public_html/`**. That is the whole site:

```
dist/
├── index.html      414 KB  →  116 KB gzipped
├── story.html      259 KB  →   97 KB
├── 404.html        233 KB  →   88 KB
├── styleguide.html 259 KB  →   97 KB   (internal; robots-disallowed)
├── .htaccess
└── robots.txt
```

No `src/`, no `node_modules`, no build tools. Each HTML file carries its own
CSS, JavaScript and fonts inline, so there is nothing else to wire up.

**`.htaccess` is a dotfile.** Hostinger's File Manager hides dotfiles by
default — turn on "Show hidden files" or the upload will silently skip it and
you will lose compression, caching and the 404 route.

## Two ways in

**hPanel File Manager** — Files → File Manager → `public_html` → Upload. Fine
for six files; drag them in and confirm `.htaccess` is among them afterwards.

**FTP/SFTP** — hPanel → Files → FTP Accounts for the host, username and port.
Upload to `/public_html`. Nothing here needs shell access.

## Order matters for one thing

**Enable SSL before uploading.** hPanel → Security → SSL, issue the free
certificate and wait for it to go active. `.htaccess` redirects http → https;
if TLS is not working yet, that redirect sends visitors to a URL the server
cannot serve.

HSTS is deliberately **not** in the `.htaccess`. It is cached by the browser
and locks visitors out of a site that cannot serve TLS. Add it once https is
confirmed working, not before.

## After uploading, check four things

1. `https://yourdomain/` loads and the header shows Home · Services · Story ·
   Process.
2. `https://yourdomain/story` (no `.html`) resolves — proves the rewrite rules
   are live, which means `.htaccess` uploaded.
3. `https://yourdomain/nothing-here` shows the 404 page, not Hostinger's.
4. Response headers include `content-encoding: gzip` or `br`. Without it you
   are shipping 414 KB instead of 116 KB.
   `curl -sI -H 'Accept-Encoding: gzip' https://yourdomain/ | grep -i encoding`

## What the build does not know yet

**The domain.** `site.config.json` has one empty field, `url`. While it is
empty the build **skips** `sitemap.xml`, `<link rel="canonical">`, `og:url` and
the hreflang alternates, and says so on every run.

That is deliberate. A canonical pointing at the wrong host is worse than no
canonical — it tells search engines the real page lives somewhere else. Fill in
`url` (no trailing slash), re-run `node build.js`, and all four appear.

**The images.** Twelve product images — the four brand boards, three device
renders and five social modules — are still hotlinked from `i.ibb.co`. On a
live domain that is one hotlink policy away from a page of empty boxes, and it
is why the build reports that `dist/` is not self-contained.

`tools/build-images.js` is ready and waiting. Drop the files into
`src/assets/images/` as `B1.png`, `B2.png`, `B3.png`, `B4.png`, `d01.png`,
`t01.png`, `mo1.png`, `c01.png` … `c05.png`, then:

```
node tools/build-images.js && node build.js
```

It repoints every `src`, reads each file's **real** intrinsic size from its
PNG/JPEG header, and stamps `width`/`height` into the markup. That second half
closes the layout-shift problem open since the images arrived: with the
dimensions present the browser reserves the exact box before the bytes land,
instead of twelve lazy images each snapping the page as they load — on exactly
the connections least able to absorb it. The values cannot be guessed, which is
why the tool reads them rather than inventing them.

Until the files exist the tool changes nothing and says so, so it is safe to
run at any time.

## Not set up

There is no CI and no deploy automation — no GitHub Action, no webhook. This is
a manual upload. If you want a push-to-deploy pipeline, that is a separate
piece of work and worth doing once the domain is settled.
