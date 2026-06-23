/* Image pipeline (sharp): mozjpeg + WebP variants with blur-up + gallery manifest.
   Replaces optimize-images.ps1 + build-gallery-data.ps1.
   Run: node scripts/build-images.js   (needs `npm install sharp`)            */
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const srcDir = path.join(root, 'assets', 'originals');
const thumbDir = path.join(root, 'assets', 'gallery', 'thumb');
const largeDir = path.join(root, 'assets', 'gallery', 'large');
const imgDir = path.join(root, 'assets', 'img');
[thumbDir, largeDir, imgDir].forEach(d => fs.mkdirSync(d, { recursive: true }));

const cat = JSON.parse(fs.readFileSync(path.join(root, 'js', '_catalogue.json'), 'utf8'));
const catByN = {}; cat.forEach(c => (catByN[c.n] = c));
const srcPath = n => path.join(srcDir, `Ozzys Professional Tree and Stump Services Brisbane (${n}).jpg`);

// Display order (lead with strongest, mix categories)
const order = [14, 5, 29, 34, 1, 11, 8, 17, 28, 26, 31, 6, 21, 3, 9, 22, 24, 19, 12, 2, 7, 18, 30, 10, 4, 33, 20, 27, 13, 25, 16, 15, 32];

const categories = [
  { id: 'all', label: 'All Work' },
  { id: 'tree-removal', label: 'Tree Removal' },
  { id: 'stump-grinding', label: 'Stump Grinding' },
  { id: 'pruning', label: 'Pruning & Lopping' },
  { id: 'land-clearing', label: 'Land Clearing' },
  { id: 'cleanup', label: 'Clean-ups' },
  { id: 'equipment', label: 'Our Gear' },
];

// Uses mozjpeg — for this photo set it beats WebP on thumbnails and ties on
// large images, so we ship a single well-optimised JPEG (no <picture> needed).
async function variants(src, outBase, maxEdge, jpgQ) {
  const base = sharp(src).rotate().resize(maxEdge, maxEdge, { fit: 'inside', withoutEnlargement: true });
  const jpg = await base.clone().jpeg({ quality: jpgQ, mozjpeg: true }).toBuffer({ resolveWithObject: true });
  fs.writeFileSync(outBase + '.jpg', jpg.data);
  return { w: jpg.info.width, h: jpg.info.height };
}

async function lqip(src) {
  const buf = await sharp(src).rotate().resize(26, 26, { fit: 'inside' }).jpeg({ quality: 42 }).toBuffer();
  return 'data:image/jpeg;base64,' + buf.toString('base64');
}

(async () => {
  const items = [];
  for (const n of order) {
    const c = catByN[n]; if (!c) { console.log('skip', n); continue; }
    const slug = `${c.category}-brisbane-${String(n).padStart(2, '0')}`;
    const src = c.src ? path.join(srcDir, c.src) : srcPath(n);
    const T = await variants(src, path.join(thumbDir, slug), 700, 72);
    const L = await variants(src, path.join(largeDir, slug), 1600, 80);
    const lq = await lqip(src);
    items.push({ id: n, cat: c.category, slug, tw: T.w, th: T.h, lw: L.w, lh: L.h, o: T.w >= T.h ? 'landscape' : 'portrait', alt: c.alt, caption: c.caption, lqip: lq });
    process.stdout.write(`.${n}`);
  }
  const data = { base: 'assets/gallery', categories, items };
  fs.writeFileSync(path.join(root, 'js', 'gallery-data.js'),
    '/* Auto-generated gallery manifest. See scripts/build-images.js */\nwindow.OZ_GALLERY = ' + JSON.stringify(data) + ';\n');
  console.log(`\ngallery-data.js: ${items.length} items`);

  // Hero + feature bands (jpg + webp)
  const feats = [
    [14, 'hero', 2400, 82],
    [5, 'feature-pruning', 1400, 82],
    [11, 'feature-canopy', 1800, 80],
    [26, 'feature-stump', 1800, 80],
    [31, 'feature-chipper', 1400, 82],
  ];
  for (const [n, name, edge, jq] of feats) {
    const d = await variants(srcPath(n), path.join(imgDir, name), edge, jq);
    console.log(`${name}: ${d.w}x${d.h}`);
  }
  // Named (non-numbered) sources
  const safety = await variants(path.join(srcDir, 'ozzys trees safety first.jpg'), path.join(imgDir, 'feature-safety'), 1800, 82);
  console.log(`feature-safety: ${safety.w}x${safety.h}`);
  // remove unused legacy features
  ['feature-removal.jpg', 'feature-ewp.jpg', 'feature-climb.jpg', 'feature-chainsaw.jpg', 'feature-action.jpg'].forEach(f => {
    const p = path.join(imgDir, f); if (fs.existsSync(p)) { fs.unlinkSync(p); console.log('removed', f); }
  });
  console.log('DONE');
})().catch(e => { console.error(e); process.exit(1); });
