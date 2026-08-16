/**
 * NAVIGATION MAP — the single source of section order.
 *
 * Rule 18: the header, the mobile drawer and the footer quick links must all
 * present the SAME sections in the SAME order. They do, because all three are
 * rendered from this one array. Reorder here and every surface follows.
 *
 * The order below mirrors the guided journey defined in Stage 00 §15:
 *   Who We Are → What We Do → Explore Services → Choose a Solution →
 *   Pricing → What's Included → Take Action
 *
 * `label` values are structural placeholders. Stage 01 replaces them with the
 * final approved wording (and adds `labelAr`) once content is signed off.
 * No business data — services, packages, prices — belongs in this file.
 *
 * @typedef {object} NavSection
 * @property {string} id       DOM id of the section element.
 * @property {string} label    Visible label, LTR/English.
 * @property {string} [labelAr] Visible label, RTL/Arabic.
 * @property {boolean} [inNav] Show in header + drawer. Default true.
 * @property {boolean} [inFooter] Show in footer quick links. Default true.
 * @property {boolean} [isCta] Render as the primary CTA rather than a link.
 */

/** @type {NavSection[]} */
export const SECTIONS = [
  { id: 'about', label: 'About' },
  { id: 'services', label: 'Services' },
  { id: 'solutions', label: 'Solutions' },
  { id: 'pricing', label: 'Pricing' },
  { id: 'included', label: "What's Included" },
  { id: 'contact', label: 'Contact', isCta: true },
];

/**
 * Sections that should appear in a given navigation surface, in order.
 *
 * @param {'nav' | 'footer'} surface
 * @returns {NavSection[]}
 */
export function sectionsFor(surface) {
  const key = surface === 'footer' ? 'inFooter' : 'inNav';
  return SECTIONS.filter((section) => section[key] !== false);
}

/**
 * Resolve a section's label for the document's current language.
 *
 * @param {NavSection} section
 * @param {string} [lang] BCP-47 tag; defaults to the document language.
 * @returns {string}
 */
export function labelFor(section, lang = document.documentElement.lang) {
  return lang?.startsWith('ar') && section.labelAr
    ? section.labelAr
    : section.label;
}
