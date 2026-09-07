# What is in here, and what ships

`build.js` copies only the images the markup actually references into
`dist/assets/`, so a file sitting here is not automatically a file a visitor
downloads. Two groups are here on purpose and are **not** referenced:

| | |
| --- | --- |
| `1-1.webp` … `1-7.webp` | **The owner's original photographs**, as uploaded on 7 September. `work-1.webp` … `work-7.webp` are the re-encoded versions the site ships — `docs/114` records 408KB becoming 205KB across the set. These are kept because they are the only copies of the originals in the repository and a re-encode is not reversible. `1-6.webp` (200KB) is the largest. |
| `about3.webp` | A studio photograph that was not used. `about1`, `about2` and `about4` are on `/about`; this one has no place on the page as it stands. |

Nothing here is shipped: `npm run check` would report an image the markup
references and the build cannot find, and `dist/assets/` contains neither
group. Verified 7 September 2026.

**Before deleting anything in this list**, check it is not the only copy of
something a client supplied.
