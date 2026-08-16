/**
 * NAVIGATION MAP — the single source of section order.
 *
 * Stage 01 §25: the header nav, the mobile menu, the homepage section order and
 * the footer quick links must never disagree. They cannot, because all three
 * navigation surfaces render from this one array. Reorder here and every
 * surface follows; add a section here and it appears everywhere at once.
 *
 * Order matches the homepage section order exactly (Stage 01 §03/§04):
 *   Home → Services → Pricing → Why Us → Process → Contact
 *
 * @typedef {object} NavSection
 * @property {string} id        DOM id of the section element on the homepage.
 * @property {string} label     Visible label (en).
 * @property {string} labelAr   Visible label (ar).
 * @property {boolean} [inNav]     Show in header nav + mobile menu. Default true.
 * @property {boolean} [inFooter]  Show in footer quick links. Default true.
 * @property {NavSection[]} [children]
 *   Reserved extension point (Stage 01 §17). While every entry is a flat
 *   anchor this stays undefined and each item renders as a plain link. When
 *   the services architecture is finalised, populating `children` is what
 *   turns an item into a dropdown or mega-menu — the header shell, its
 *   spacing and its scroll behaviour do not change. See
 *   docs/01-header-navigation.md §"Extending the Services item".
 */

/** @type {NavSection[]} */
export const SECTIONS = [
  { id: 'home', label: 'Home', labelAr: 'الرئيسية' },
  { id: 'services', label: 'Services', labelAr: 'خدماتنا' },
  { id: 'pricing', label: 'Pricing', labelAr: 'الأسعار' },
  { id: 'why-us', label: 'Why Us', labelAr: 'لماذا نحن' },
  { id: 'process', label: 'Process', labelAr: 'آلية العمل' },
  // Reached through the primary CTA rather than a sixth nav link, so the
  // header keeps one unambiguous conversion action (§11, §19). It still
  // appears in the footer quick links.
  { id: 'contact', label: 'Contact', labelAr: 'تواصل معنا', inNav: false },
];

/**
 * The primary conversion action. One per surface — header on desktop, menu
 * footer on mobile (§11, §17 of Stage 00's CTA hierarchy).
 */
export const PRIMARY_CTA = {
  target: 'contact',
  label: 'Start Your Project',
  labelAr: 'ابدأ مشروعك',
};

/**
 * Social profiles for the mobile menu (§13).
 *
 * Deliberately empty: no account is invented here. Add real profiles as
 * `{ label, href }` and they render in the menu automatically — nothing else
 * needs to change.
 *
 * @type {{label: string, href: string}[]}
 */
export const SOCIAL_LINKS = [];

/**
 * The six service categories, in the order the Services section lists them.
 *
 * Same principle as SECTIONS: the footer's services column renders from this
 * array rather than being typed out a second time, so it cannot drift from the
 * Services accordion. A test asserts the two agree — same names, same order,
 * same anchors — in both languages.
 *
 * Every `id` is a real section on the homepage; there are no placeholder
 * targets left in this list.
 *
 * @type {{id: string, label: string, labelAr?: string}[]}
 */
export const SERVICE_LINKS = [
  { id: 'branding', label: 'Branding & Design' },
  { id: 'websites', label: 'Websites' },
  { id: 'ecommerce', label: 'E-Commerce' },
  { id: 'social', label: 'Social Media Management' },
  { id: 'marketing', label: 'Digital Marketing & Advertising' },
  { id: 'integrated', label: 'Integrated Digital Solutions' },
];

/** Header chrome strings. Page content is translated when copy is finalised. */
export const STRINGS = {
  en: {
    brandHome: 'Pixora, Digital Agency — home',
    primaryNav: 'Primary',
    menuNav: 'Menu',
    openMenu: 'Open menu',
    closeMenu: 'Close menu',
    menuEyebrow: 'Menu',
    followUs: 'Follow us',
    language: 'Language',
    footerNav: 'Quick links',
    footerServices: 'Services',
    footerStart: 'Start',
    backToTop: 'Back to top',
    rights: 'All rights reserved.',
    // Currency SYMBOL only — the price figure itself is business data and is
    // authored in the markup, never here.
    currency: 'SAR',
    billingOnce: 'One-time',
    billingMonthly: 'Monthly',
    // Category-level billing summaries for the pricing tabs (Stage 10).
    billingAllOnce: 'One-time projects',
    billingAllMonthly: 'Billed monthly',
    // Add-ons are quoted as starting prices, never as a final figure.
    priceFrom: 'From',
  },
  ar: {
    brandHome: 'بيكسورا، وكالة رقمية — الصفحة الرئيسية',
    primaryNav: 'التنقل الرئيسي',
    menuNav: 'القائمة',
    openMenu: 'فتح القائمة',
    closeMenu: 'إغلاق القائمة',
    menuEyebrow: 'القائمة',
    followUs: 'تابعنا',
    language: 'اللغة',
    footerNav: 'روابط سريعة',
    footerServices: 'خدماتنا',
    footerStart: 'ابدأ',
    backToTop: 'العودة إلى الأعلى',
    rights: 'جميع الحقوق محفوظة.',
    currency: 'ر.س',
    billingOnce: 'لمرة واحدة',
    billingMonthly: 'شهريًا',
    billingAllOnce: 'مشاريع لمرة واحدة',
    billingAllMonthly: 'تُحتسب شهريًا',
    priceFrom: 'يبدأ من',
  },
};

/** Current document language, normalised to a key of STRINGS. */
export function currentLang() {
  return document.documentElement.lang?.startsWith('ar') ? 'ar' : 'en';
}

/**
 * Sections belonging to a given navigation surface, in order.
 *
 * @param {'nav' | 'footer'} surface
 * @returns {NavSection[]}
 */
export function sectionsFor(surface) {
  const key = surface === 'footer' ? 'inFooter' : 'inNav';
  return SECTIONS.filter((section) => section[key] !== false);
}

/**
 * Resolve any label-bearing entry for the current document language.
 *
 * @param {{label: string, labelAr?: string}} entry
 * @returns {string}
 */
export function labelFor(entry) {
  return currentLang() === 'ar' && entry.labelAr ? entry.labelAr : entry.label;
}

/** Look up a chrome string for the current language. */
export function t(key) {
  return STRINGS[currentLang()][key] ?? STRINGS.en[key] ?? key;
}
