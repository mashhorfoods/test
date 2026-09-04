/**
 * NAVIGATION MAP — the single source of section order.
 *
 * Stage 01 §25: the header nav, the mobile menu, the homepage section order and
 * the footer quick links must never disagree. They cannot, because all three
 * navigation surfaces render from this one array. Reorder here and every
 * surface follows; add a section here and it appears everywhere at once.
 *
 * Order matches the homepage section order exactly (Stage 01 §03/§04):
 *   Home → Services → Process → Contact
 *
 * Two entries have left this list. "Why Us" merged into Integrated Solutions,
 * which argued the same point. "Pricing" went when the packages moved into the
 * service sections: each service now carries its own prices, so there is no
 * separate section to navigate to. Both left rather than pointing at a section
 * that no longer exists.
 *
 * @typedef {object} NavSection
 * @property {string} id        DOM id of the section element on the homepage.
 * @property {string} label     Visible label (en).
 * @property {string} labelAr   Visible label (ar).
 * @property {string} [href]
 *   An explicit destination, for entries that are a PAGE rather than a section
 *   of the homepage. When present it is used verbatim and `id` becomes a
 *   name rather than an anchor target — the scroll spy will not find a section
 *   for it, which is correct: there is nothing on this page to be inside of.
 * @property {boolean} [inNav]     Show in header nav + mobile menu. Default true.
 * @property {boolean} [inFooter]  Show in footer quick links. Default true.
 * @property {NavSection[]} [children]
 *   Sub-destinations. The MOBILE DRAWER renders these as an indented list
 *   under their parent; the header deliberately does not, and still renders a
 *   flat link. That asymmetry is the point: the drawer is a phone's whole map
 *   of the page, a desktop header is not. Extending this into a dropdown or
 *   mega-menu remains possible without touching the header shell, its spacing
 *   or its scroll behaviour. See docs/01-header-navigation.md
 *   §"Extending the Services item".
 */

/**
 * The five service categories, in the order the Services section lists them.
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
  { id: 'branding', label: 'Branding & Design', labelAr: 'الهوية والتصميم' },
  { id: 'websites', label: 'Websites', labelAr: 'المواقع الإلكترونية' },
  { id: 'social', label: 'Social Media Management', labelAr: 'إدارة وسائل التواصل' },
  { id: 'marketing', label: 'Digital Marketing & Advertising', labelAr: 'التسويق الرقمي والإعلانات' },
  { id: 'integrated', label: 'Integrated Digital Solutions', labelAr: 'الحلول الرقمية المتكاملة' },
];

/** @type {NavSection[]} */
export const SECTIONS = [
  { id: 'home', label: 'Home', labelAr: 'الرئيسية' },
  /* The five services hang off this entry. On a phone the drawer is the
     ONLY map of the page — the header nav collapses into it — and the page is
     29 screens tall, so a menu that offered three destinations left a visitor
     wanting "Social Media Management" to open Services, find it in the
     accordion, and tap through. They are one tap from the menu now. The
     header still renders this as a flat link: on a desktop the sections are
     visible by scrolling and a dropdown would be chrome for its own sake. */
  { id: 'services', label: 'Services', labelAr: 'خدماتنا', children: SERVICE_LINKS },
  /* A PAGE, not a section — see `href` in the typedef.
     It shipped reachable only from a text link at the bottom of #integrated,
     which measured 68% down the homepage and 20 screens into it on a phone.
     A page nothing links to from the navigation is a page nobody finds. */
  { id: 'pricing', label: 'Pricing', labelAr: 'الأسعار', href: './pricing.html' },
  { id: 'story', label: 'Story', labelAr: 'القصة', href: './story.html' },
  /* Not in the header: Gate 01 froze that row at five items, and wireframe W7
     names them — Home, Services, Pricing, Story, About. Process is a section of
     the homepage, reachable by scrolling and one tap away in the drawer. */
  { id: 'process', label: 'Process', labelAr: 'آلية العمل', inNav: false, inMenu: true },
  /* A PAGE, like Story. Flow B — the buyer who verifies before enquiring —
     had nowhere to land: no About meant no answer to "who are these people?",
     which at these prices is the question asked before the price is. */
  { id: 'about', label: 'About', labelAr: 'من نحن', href: './about.html' },
  // Reached through the primary CTA rather than a sixth nav link, so the
  // header keeps one unambiguous conversion action (§11, §19). It still
  // appears in the footer quick links.
  /* Reached through the primary CTA in the header, and now ALSO a labelled
     destination in the drawer (IA-5): a button is not a way-finding target, and
     a returning visitor looking for a phone number had nothing to scan for. */
  { id: 'contact', label: 'Contact', labelAr: 'تواصل معنا', inNav: false, inMenu: true },
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
export const SOCIAL_LINKS = [
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/muhalabsalah/' },
  { label: 'Behance', href: 'https://www.behance.net/MuhalabSalah' },
  /* Labelled for what it is. As "Website" it read as the agency's own site,
     sitting in a list beside it — the identity mismatch Phase 03 flagged
     (PS-06). The destination is unchanged; only the promise it makes is. */
  { label: "Founder's portfolio", labelAr: 'أعمال المؤسس', href: 'https://muhalabsalah.github.io/muhalabsalah/' },
];

/**
 * The approved contact channels (Stage 17 §02), verbatim.
 *
 * `display` is what the visitor sees and must never be reformatted — the
 * numbers are business data. `href` is the action. Everything that shows a
 * channel reads from here, so the visible number and the dialled number
 * cannot drift apart.
 *
 * @type {{key: string, label: string, labelAr: string, display: string,
 *         href: string, external?: boolean}[]}
 */
export const CONTACT_CHANNELS = [
  {
    key: 'whatsapp',
    label: 'WhatsApp',
    labelAr: 'واتساب',
    display: '+249 962672192',
    href: 'https://wa.me/249962672192',
    external: true,
  },
  {
    key: 'phone',
    label: 'Phone',
    labelAr: 'الهاتف',
    display: '+249 119005441',
    href: 'tel:+249119005441',
  },
  {
    key: 'email',
    label: 'Email',
    labelAr: 'البريد الإلكتروني',
    display: 'muhalabsalah@gmail.com',
    href: 'mailto:muhalabsalah@gmail.com',
  },
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
    footerElsewhere: 'Elsewhere',
    opensNewTab: '(opens in a new tab)',
    backToTop: 'Back to top',
    rights: 'All rights reserved.',
    // Currency SYMBOL only — the price figure itself is business data and is
    // authored in the markup, never here.
    currency: 'USD',
    billingOnce: 'One-time',
    billingMonthly: 'Monthly',
    // Add-ons are quoted as starting prices, never as a final figure.
    priceFrom: 'From',
    // The response promise lives here, once, so the verification band, the
    // contact section and any future page cannot state different windows.
    replyWindow: 'We reply within 2 working hours',
    replyHours: 'Sunday to Thursday',
    verifyHeading: 'Who you are talking to',
    verifyCheck: 'Check us:',
    contactChannels: 'Direct channels',
    contactElsewhere: 'Elsewhere',
    formAbout: 'About',
    copyEmail: 'Copy',
    copied: 'Copied',
    copyFailed: 'Press to select, then copy',
    formName: 'Your name',
    formEmail: 'Your email',
    formMessage: 'What are you looking to build?',
    formSend: 'Send message',
    formNote: 'Opens your email app with the message ready to send.',
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
    footerElsewhere: 'مواقع أخرى',
    opensNewTab: '(يفتح في نافذة جديدة)',
    backToTop: 'العودة إلى الأعلى',
    rights: 'جميع الحقوق محفوظة.',
    currency: 'دولار',
    billingOnce: 'لمرة واحدة',
    billingMonthly: 'شهريًا',
    priceFrom: 'يبدأ من',
    replyWindow: 'نردّ خلال ساعتين في أوقات العمل',
    replyHours: 'من الأحد إلى الخميس',
    verifyHeading: 'مع من تتحدث',
    verifyCheck: 'تحقّق بنفسك:',
    contactChannels: 'قنوات التواصل',
    contactElsewhere: 'روابط أخرى',
    formAbout: 'بخصوص',
    copyEmail: 'نسخ',
    copied: 'تم النسخ',
    copyFailed: 'اضغط للتحديد ثم انسخ',
    formName: 'الاسم',
    formEmail: 'البريد الإلكتروني',
    formMessage: 'ما الذي تريد إنشاءه؟',
    formSend: 'إرسال الرسالة',
    formNote: 'يفتح تطبيق البريد لديك والرسالة جاهزة للإرسال.',
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
  /* THREE SURFACES, NOT TWO (Phase 12).
     The header and the drawer used to share one flag, which forced a false
     choice: an entry was either in both or in neither. The header is a scarce
     row that Gate 01 froze at five items; the drawer is a phone's whole map of
     the site and can afford more. `inMenu` splits them, defaulting to whatever
     `inNav` says, so every existing entry behaves exactly as it did. */
  if (surface === 'footer') return SECTIONS.filter((s) => s.inFooter !== false);
  if (surface === 'menu') {
    return SECTIONS.filter((s) => (s.inMenu !== undefined ? s.inMenu : s.inNav !== false));
  }
  return SECTIONS.filter((s) => s.inNav !== false);
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
