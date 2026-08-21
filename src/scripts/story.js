/**
 * SUCCESS STORY — draw-on activation.
 *
 * The whole animation lives in CSS (components/story.css). This adds one
 * class, once, when a chapter reaches the viewport, and then stops caring
 * about it: the observer unobserves on the first intersection, so a chapter
 * cannot redraw itself when the reader scrolls back up (§18).
 *
 * It is a no-op on any page without chapters, which is every page but one —
 * main.js can call it unconditionally.
 *
 * REDUCED MOTION is handled in the stylesheet, not here: the animated state
 * only exists inside a `prefers-reduced-motion: no-preference` query, so
 * adding the class under `reduce` changes nothing and the final drawing is
 * simply what renders. That means the story is never gated on this script —
 * with JavaScript off, every stroke is already at its finished position.
 */

const CHAPTERS = '.c-chapter, .c-chapter__joint';

export function initStory() {
  const targets = [...document.querySelectorAll(CHAPTERS)];
  if (targets.length === 0) return;

  // No IntersectionObserver: draw everything now rather than nothing ever.
  if (!('IntersectionObserver' in window)) {
    targets.forEach((el) => el.classList.add('is-drawing'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-drawing');
        // Once drawn, it is drawn. Nothing here runs a second time.
        observer.unobserve(entry.target);
      });
    },
    {
      /* Start the drawing a little before the chapter is centred, so the
         first stroke is already down by the time the reader settles on it —
         but not so early that it finishes off-screen. */
      rootMargin: '0px 0px -18% 0px',
      threshold: 0.15,
    }
  );

  targets.forEach((el) => observer.observe(el));
}
