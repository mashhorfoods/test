/* =============================================================================
   HERO FILM
   Attaches the hero loop — and, more often, decides not to.

   THE FILE IS NOT IN THE MARKUP. The <video> ships with no src; this module
   supplies one. That is the difference between hiding a video on a phone and
   never asking for it, and it is the whole reason the budget in docs/53 holds:
   a source in the markup is a request the browser may make whatever the CSS
   says about display.

   Four reasons to decline, checked before anything is fetched:
     - the screen is narrow. The phone's version is the still
     - the visitor asked for reduced motion
     - the connection says it is slow, or the visitor asked to save data
     - the tab is hidden, in which case we wait rather than refuse
   ============================================================================= */

/** Below this, the still is the design. Matches hero-film.css. */
const WIDE = '(min-width: 48em)';

/**
 * Would loading ~150KB of video be rude right now?
 *
 * navigator.connection is Chromium-only and absent elsewhere, which is why
 * every reading is optional: an unknown connection is treated as fine, because
 * refusing on ignorance would deny the film to every Safari visitor.
 */
function connectionIsCheap() {
  const c = navigator.connection;
  if (!c) return true;
  if (c.saveData) return false;
  return !/(^|-)2g$/.test(c.effectiveType || '');
}

export function initHeroFilm() {
  const film = document.querySelector('[data-hero-film]');
  if (!film) return;

  const video = film.querySelector('video[data-film-mp4]');
  if (!video) return;

  const wide = window.matchMedia(WIDE);
  const still = window.matchMedia('(prefers-reduced-motion: reduce)');

  let started = false;

  const start = () => {
    if (started) return;
    if (!wide.matches || still.matches || !connectionIsCheap()) return;

    started = true;
    /* <source> children rather than a src, and created here rather than
       written in the markup: a source element in the HTML is a request the
       browser may make on its own, which is exactly what the phone must not
       do. WebM first — everything that can play it should, and it is a third
       of the size; Safari falls through to the MP4. */
    for (const [type, url] of [['video/webm', video.dataset.filmWebm], ['video/mp4', video.dataset.filmMp4]]) {
      if (!url) continue;
      const source = document.createElement('source');
      source.type = type;
      source.src = url;
      video.appendChild(source);
    }
    video.load();
    /* autoplay is set here rather than in the markup: the attribute is only
       meaningful once there is a source, and putting it in the HTML would
       invite a future edit to add a src beside it. */
    video.autoplay = true;

    const reveal = () => film.setAttribute('data-film-playing', '');
    video.addEventListener('playing', reveal, { once: true });

    const play = video.play();
    if (play && typeof play.catch === 'function') {
      /* A refused autoplay is not an error worth surfacing — the still is
         already on screen and the hero is complete without this. */
      play.catch(() => { started = false; });
    }
  };

  /* Starting a video in a background tab wastes the bytes it was given: it
     decodes into nothing and may be throttled mid-fetch. Wait for the tab. */
  if (document.visibilityState === 'hidden') {
    document.addEventListener('visibilitychange', function once() {
      if (document.visibilityState !== 'hidden') {
        document.removeEventListener('visibilitychange', once);
        start();
      }
    });
  } else {
    start();
  }

  /* A visitor who widens the window, or turns motion back on, gets the film
     without a reload. The reverse is deliberately not handled: once the bytes
     are spent, hiding the result would waste them twice. */
  const onChange = () => { if (!still.matches) start(); };
  wide.addEventListener('change', onChange);
  still.addEventListener('change', onChange);
}
