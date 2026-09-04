/**
 * ENTRY POINT
 *
 * Loaded with <script type="module" src="…/main.js"></script>, which is
 * deferred by default — parsing is never blocked.
 *
 * Every module here enhances markup that already works. If this file fails to
 * load, the site remains readable, navigable and fully usable.
 */

import { initNavigation } from './navigation.js';
import { initDisclosure } from './disclosure.js';
import { initMotion } from './motion.js';
import { initContact } from './contact.js';
import { initStory } from './story.js';
import { initFocus } from './focus.js';
import { initAnalytics } from './analytics.js';
import { initHeroFilm } from './hero-film.js';

function boot() {
  // Before the rest: every other module's links inherit this behaviour.
  initFocus();
  initNavigation();
  initDisclosure();
  initMotion();
  initContact();
  // No-op on every page without chapters, which is every page but one.
  initStory();
  // Decoration, so it runs after everything the page needs to work. No-op on
  // every page but the homepage, and usually a no-op there too — see the
  // four reasons it declines in hero-film.js.
  initHeroFilm();
  // Last: it only listens, and it must never be the reason something else
  // failed to initialise.
  initAnalytics();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
