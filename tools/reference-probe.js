/*
  reference-probe.js — the measurement half of B1, run from a browser console.

  THIS DOES NOT RUN IN NODE. It is a snippet to paste into the developer
  console of a reference site, because this project's build container cannot
  reach the open web: the egress proxy answers 403 to CONNECT for anything
  outside the package registries and GitHub. `docs/80` §4 records the attempt.

  It reads only what is already rendered — no network, no writes, no storage.
  It reports the numbers a screenshot cannot carry: computed type ramp,
  control heights and padding, section order and vertical rhythm, and the
  scroll cost of the page in screenfuls.

  HOW TO USE
    1. Open the reference site.
    2. Sizing follows the window, so set the window first:
       desktop pass at a maximised window, phone pass in device toolbar
       (F12 -> the phone icon -> iPhone 14 Pro, 393x852).
    3. F12 -> Console. Chrome asks you to type "allow pasting" once.
    4. Paste this whole file, press Enter.
    5. It scrolls the page to the bottom and back to wake reveal animations,
       waits, then copies JSON to the clipboard and prints it.
    6. Paste the result into the chat. Repeat for each width.

  Nothing here is specific to one site.
*/

(async () => {
  const px = (v) => Math.round(parseFloat(v) * 10) / 10;
  const vis = (el) => {
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.opacity !== '0';
  };
  /* Own text only: an ancestor would otherwise be credited with its children's words. */
  const ownText = (el) =>
    [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent.trim()).join(' ').trim();

  /* Wake whatever reveals on scroll, then come back. "Sections fade up" hides
     from a probe that never scrolls. */
  const step = Math.round(innerHeight * 0.75);
  for (let y = 0; y < document.body.scrollHeight; y += step) {
    scrollTo(0, y);
    await new Promise((r) => setTimeout(r, 140));
  }
  scrollTo(0, 0);
  await new Promise((r) => setTimeout(r, 1200));

  const type = new Map();
  document.querySelectorAll('*').forEach((el) => {
    if (!vis(el)) return;
    const t = ownText(el);
    if (t.length < 2) return;
    const cs = getComputedStyle(el);
    const key = `${px(cs.fontSize)}px / ${px(cs.lineHeight)} / ${cs.fontWeight} / ls ${cs.letterSpacing}`;
    if (!type.has(key)) type.set(key, { count: 0, tag: el.tagName.toLowerCase(), sample: t.slice(0, 50), color: cs.color });
    type.get(key).count++;
  });

  const controls = [];
  document.querySelectorAll('button,a,[role="button"],input,textarea,summary').forEach((el) => {
    if (!vis(el)) return;
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    const styled = cs.borderRadius !== '0px' || cs.backgroundColor !== 'rgba(0, 0, 0, 0)' || px(cs.borderTopWidth) > 0;
    if (!styled || r.height < 18) return;
    controls.push({
      text: (el.innerText || el.placeholder || el.getAttribute('aria-label') || '').trim().slice(0, 34),
      tag: el.tagName.toLowerCase(),
      w: Math.round(r.width),
      h: Math.round(r.height),
      /* Touch target is the whole box; 44 is the floor we hold ourselves to. */
      meets44: r.height >= 44 && r.width >= 44,
      padX: `${px(cs.paddingLeft)}/${px(cs.paddingRight)}`,
      padY: `${px(cs.paddingTop)}/${px(cs.paddingBottom)}`,
      radius: cs.borderRadius,
      font: `${px(cs.fontSize)}/${cs.fontWeight}`,
      fill: cs.backgroundImage !== 'none' ? `image: ${cs.backgroundImage.slice(0, 60)}` : cs.backgroundColor,
      color: cs.color,
      /* Where in the scroll it sits — the number that decides CTA reach. */
      atScrollPct: Math.round(((r.top + scrollY) / document.body.scrollHeight) * 100),
    });
  });

  const root = document.querySelector('main') || document.body;
  const sections = [...root.children].filter(vis).map((el) => {
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    /* THE SECTION-BY-SECTION FIELDS.
       Order, height and rhythm were always here. What a design comparison
       also needs is what each section is DOING: does it ask for anything,
       does it carry evidence, how much reading does it cost. The hero is
       excluded from the comparison deliberately — it is the one section this
       project has already settled (docs/53, docs/80 §2.3) and the one where
       every agency site looks the same. Everything after it is where the
       differences live. */
    const words = (el.innerText || '').trim().split(/\s+/).filter(Boolean).length;
    const ctas = [...el.querySelectorAll('a,button')].filter((c) => {
      if (!vis(c)) return false;
      const cr = c.getBoundingClientRect();
      return cr.height >= 32 && (c.innerText || '').trim().length > 0;
    });
    return {
      tag: el.tagName.toLowerCase(),
      cls: (el.getAttribute('class') || '').slice(0, 44),
      height: Math.round(r.height),
      screenfuls: +(r.height / innerHeight).toFixed(2),
      padY: `${px(cs.paddingTop)}/${px(cs.paddingBottom)}`,
      bg: cs.backgroundColor,
      heading: (el.querySelector('h1,h2,h3')?.innerText || '').trim().slice(0, 70),
      /* --- added for the section-by-section pass --- */
      words,
      /* Reading cost at roughly 200 wpm, in seconds — a section that takes
         90 seconds to read is a decision, not an accident. */
      readSec: Math.round((words / 200) * 60),
      ctaCount: ctas.length,
      ctaLabels: ctas.slice(0, 3).map((c) => (c.innerText || '').trim().slice(0, 28)),
      imgs: el.querySelectorAll('img,picture,svg').length,
      video: el.querySelectorAll('video,iframe').length,
      /* A horizontal scroller or a slide container, which is the question
         docs/86 answered for us and worth asking of everyone else. */
      slider: !!el.querySelector('[class*="slid"],[class*="carousel"],[class*="swiper"],[class*="marquee"]'),
      listItems: el.querySelectorAll('li').length,
    };
  });

  const b = getComputedStyle(document.body);
  const out = {
    url: location.href,
    title: document.title,
    viewport: `${innerWidth}x${innerHeight}`,
    dpr: devicePixelRatio,
    pageHeight: document.body.scrollHeight,
    screenfuls: +(document.body.scrollHeight / innerHeight).toFixed(2),
    body: { font: b.fontFamily, size: px(b.fontSize), bg: b.backgroundColor, color: b.color },
    lang: document.documentElement.lang || '(unset)',
    dir: document.documentElement.dir || '(unset)',
    reducedMotionHonoured: matchMedia('(prefers-reduced-motion: reduce)').matches
      ? 'probe ran WITH reduce on — compare against a run without it'
      : 'probe ran with motion allowed',
    typeRamp: [...type.entries()]
      .map(([k, v]) => ({ style: k, ...v }))
      .sort((a, b2) => parseFloat(b2.style) - parseFloat(a.style)),
    controls,
    sections,
  };

  const json = JSON.stringify(out, null, 1);
  try {
    await navigator.clipboard.writeText(json);
    console.log('%cCopied to clipboard — paste it into the chat.', 'color:#0a0;font-weight:bold');
  } catch {
    console.log('%cClipboard blocked. Select the JSON below and copy it by hand.', 'color:#a60;font-weight:bold');
  }
  console.log(json);
  return out;
})();
