const fs = require('fs');
const path = require('path');
const D = __dirname;
const css = fs.readFileSync(path.join(D, '_base.css'), 'utf8');
const FONTS = '<link rel="preconnect" href="https://fonts.googleapis.com">\n'
  + '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n'
  + '<link rel="stylesheet" href="https://fonts.googleapis.com/css2'
  + '?family=Archivo:wght@600;700'
  + '&family=IBM+Plex+Sans:wght@400;500;600'
  + '&family=IBM+Plex+Sans+Arabic:wght@400;500;600'
  + '&family=IBM+Plex+Mono:wght@400'
  + '&display=swap">';
const packs = [
  { id: 'b3', title: 'Does the Arabic Sound Right' },
  { id: 'b4', title: 'Pixora Terms Review' },
  { id: 'b5', title: 'Five Buyer Sessions' },
  { id: 'b6', title: 'Forty Minutes with VoiceOver' },
];
for (const p of packs) {
  const body = fs.readFileSync(path.join(D, `${p.id}-body.html`), 'utf8');
  const out = `<title>${p.title}</title>\n${FONTS}\n<style>\n${css}</style>\n\n${body}`;
  fs.writeFileSync(path.join(D, `${p.id}.html`), out);
  console.log(`${p.id}.html  ${(out.length / 1024).toFixed(1)}KB  "${p.title}"`);
}
