# Self-hosted fonts

Poppins (Latin) and Cairo (Arabic), subset to the scripts this site uses and
served from our own origin — no third-party connection and nothing external on
the critical path.

Generated from Google Fonts. `@font-face` rules live in
`src/styles/00-fonts.css`; `unicode-range` on each face means the browser only
downloads a subset the page actually needs (an English page never fetches the
Arabic file).

| Family | Files | Note |
| --- | --- | --- |
| Poppins | `poppins-<subset>-<weight>.woff2` | Static instances — one file per weight |
| Cairo | `cairo-<subset>-var.woff2` | Variable font — one file covers 400–700 |

Total 156KB across 11 faces.

## Licence

Both families are licensed under the **SIL Open Font License 1.1**, which
permits redistribution and web embedding. The full licence text for each is
included here and must stay with the font files:

- `OFL-Poppins.txt` — Copyright 2020 The Poppins Project Authors
- `OFL-Cairo.txt` — Copyright 2009 The Cairo Project Authors

## Regenerating

Refetch from Google Fonts with `wght@400;500;600;700`, keep the `latin` and
`latin-ext` subsets for Poppins and **only `arabic` for Cairo**, rewrite each
`src:` URL to `../assets/fonts/<file>`, and preserve the `unicode-range`
declarations. Deduplicate by URL — Cairo returns the same variable file for
every requested weight.

Cairo's `latin` and `latin-ext` subsets are deliberately not shipped. Poppins
is the site's only Latin face; Latin runs inside Arabic copy fall through to it
via `--font-arabic`. Re-adding them costs 50KB and puts a second Latin voice on
the page. See the note at the top of `src/styles/00-fonts.css`.
