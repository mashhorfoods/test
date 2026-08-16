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

function boot() {
  initNavigation();
  initDisclosure();
  initMotion();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
