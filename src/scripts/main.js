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

function boot() {
  // Before the rest: every other module's links inherit this behaviour.
  initFocus();
  initNavigation();
  initDisclosure();
  initMotion();
  initContact();
  // No-op on every page without chapters, which is every page but one.
  initStory();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
