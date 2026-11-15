// node scripts/head.mjs <in.html> <out.html> — the built page with its <title>, description, Open Graph and
// Twitter tags (docs/hero.png as the card image) and an inline SVG favicon.
import fs from 'node:fs';
const [src, out] = process.argv.slice(2);
const URL = 'https://simsi2027.github.io/venturi/';
const TITLE = 'VENTURI 39 · a flat-slide carburetor, part by part';
const DESC = 'An interactive 3D guide to a Keihin flat-slide carburetor: every fiche reference, where it sits and the order it comes off. Visual guide only. Follow the service manual.';
const icon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#15171c"/><circle cx="32" cy="32" r="15" fill="none" stroke="#c9a24b" stroke-width="5"/><rect x="29" y="10" width="6" height="24" rx="2" fill="#c9a24b"/></svg>`;
const esc = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
const meta = [
  `<title>${TITLE}</title>`,
  `<meta name="description" content="${esc(DESC)}">`,
  `<link rel="icon" type="image/svg+xml" href="data:image/svg+xml,${encodeURIComponent(icon)}">`,
  `<meta property="og:type" content="website">`,
  `<meta property="og:url" content="${URL}">`,
  `<meta property="og:title" content="${esc(TITLE)}">`,
  `<meta property="og:description" content="${esc(DESC)}">`,
  `<meta property="og:image" content="${URL}hero.png">`,
  `<meta property="og:image:width" content="1600">`,
  `<meta property="og:image:height" content="900">`,
  `<meta name="twitter:card" content="summary_large_image">`,
  `<meta name="twitter:title" content="${esc(TITLE)}">`,
  `<meta name="twitter:description" content="${esc(DESC)}">`,
  `<meta name="twitter:image" content="${URL}hero.png">`,
  `<meta name="theme-color" content="#15171c">`,
].join('\n');
const html = fs.readFileSync(src, 'utf8').replace(/<title>[^<]*<\/title>/, meta);
if (!html.includes('og:image')) throw new Error('no <title> to replace in ' + src);
fs.writeFileSync(out, html);
