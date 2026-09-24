/* §17 alt text is copy, and copy is bilingual ----------------------
   §4 holds every English string on this site to having an Arabic sibling.
   Images were exempt from that promise without anyone deciding they should
   be: all twelve service images carried one English `alt` and served it to
   Arabic readers too (`docs/50` Part 6). A bilingual site was describing its
   own pictures in one language.

   `data-alt-en` / `data-alt-ar` switch with the page. This holds new images
   to the same rule — an `alt` worth writing is worth writing twice. An
   EMPTY alt is untouched: a decorative image is decorative in both
   languages. */

module.exports = async function check({ fs, path, DIST, fail, SHIPPED }) {
  {
    for (const page of SHIPPED) {
      const file = path.join(DIST, page);
      if (!fs.existsSync(file)) continue;
      const html = fs.readFileSync(file, 'utf8');
      for (const tag of html.match(/<img[^>]*>/g) || []) {
        const alt = tag.match(/\salt="([^"]*)"/);
        if (!alt || !alt[1].trim()) continue;           // decorative, correctly
        if (/data-alt-ar="/.test(tag)) continue;
        const src = (tag.match(/src="([^"]*)"/) || [, '?'])[1].split('/').pop().slice(0, 40);
        fail('MED', 'i18n', `${page}: ${src} has alt text in one language only — "${alt[1].slice(0, 40)}". Add data-alt-en/data-alt-ar (docs/50 Part 6)`);
      }
    }
  }
};
