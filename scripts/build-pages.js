/* Generates suburb landing pages, guide articles and the guides index from
   js/_local-content.json, using the same header/footer/design as the rest of
   the site. Run: node scripts/build-pages.js */
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const SITE = 'https://ozzystrees.com.au';
const TODAY = '2026-06-24';
const data = JSON.parse(fs.readFileSync(path.join(root, 'js', '_local-content.json'), 'utf8'));

const esc = s => String(s).replace(/&(?!amp;|lt;|gt;|quot;|#)/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const attr = s => String(s).replace(/&(?!amp;|lt;|gt;|quot;|#)/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/* ---- shared SVG ---- */
const PHONE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/></svg>';
const MAIL = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/></svg>';
const PIN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 12-9 12s-9-5-9-12a9 9 0 0 1 18 0Z"/><circle cx="12" cy="10" r="3"/></svg>';
const CLOCK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>';
const STAR = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.9 6.3 6.9.6-5.2 4.5 1.6 6.7L12 16.9 5.8 20.7l1.6-6.7L2.2 8.9l6.9-.6z"/></svg>';
const FB = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M22 12a10 10 0 1 0-11.5 9.9v-7H8v-2.9h2.5V9.5c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.2c-1.2 0-1.6.8-1.6 1.6v1.9h2.7l-.4 2.9h-2.3v7A10 10 0 0 0 22 12Z"/></svg>';
const ARROW = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
const CHEV = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>';
const CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>';
const PLUS = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>';
const GLOGO = '<svg class="g-logo" viewBox="0 0 48 48" aria-hidden="true"><path fill="#4285F4" d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z"/><path fill="#34A853" d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z"/><path fill="#FBBC05" d="M11.69 28.18C11.25 26.86 11 25.45 11 24s.25-2.86.69-4.18v-5.7H4.34C2.85 17.09 2 20.45 2 24s.85 6.91 2.34 9.88l7.35-5.7z"/><path fill="#EA4335" d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.35 5.7c1.73-5.2 6.58-9.07 12.31-9.07z"/></svg>';
const MARK = w => `<svg class="mark" viewBox="0 0 100 100" width="${w}" height="${w}" aria-hidden="true" focusable="false"><path class="trunk" fill="currentColor" d="M46 58 C46 69 45 78 40.5 85 L59.5 85 C55 78 54 69 54 58 Z"/><circle cx="50" cy="34" r="22" fill="currentColor"/><circle cx="34" cy="31" r="13" fill="currentColor"/><circle cx="66" cy="31" r="13" fill="currentColor"/><circle cx="50" cy="22" r="14" fill="currentColor"/><circle cx="28.5" cy="43" r="11" fill="currentColor"/><circle cx="71.5" cy="43" r="11" fill="currentColor"/><circle cx="50" cy="45" r="17.5" fill="currentColor"/></svg>`;
const GRATING = '<a class="grating" href="https://share.google/W8slj1vkMdI9gpjac" target="_blank" rel="noopener" aria-label="Read our 27 reviews on Google, rated 5.0 out of 5">' + GLOGO + '<span class="g-score">5.0</span><span class="g-meta"><span class="g-stars" aria-hidden="true">' + STAR.repeat(5) + '</span><small>27 Google reviews</small></span><span class="g-cta">Read our reviews ' + ARROW + '</span></a>';

const SUBURB_SLUGS = { Chermside: 'chermside', Stafford: 'stafford', Aspley: 'aspley', Kedron: 'kedron' };

function navLi(href, label, active, cur) {
  return `<li><a href="${href}"${active === cur ? ' aria-current="page"' : ''}>${label}</a></li>`;
}
function header(active) {
  return `<header class="site-header over-hero">
  <div class="container">
    <a class="brand" href="./" aria-label="Ozzy's Tree &amp; Stump Services home">
      ${MARK(42)}
      <span class="brand-text"><span class="b1">Ozzy's</span><span class="b2">Tree &amp; Stump Services</span></span>
    </a>
    <nav class="nav" aria-label="Primary">
      <ul class="nav-links">
        ${navLi('./', 'Home', active, 'home')}
        ${navLi('services', 'Services', active, 'services')}
        ${navLi('gallery', 'Gallery', active, 'gallery')}
        ${navLi('about', 'About', active, 'about')}
        ${navLi('guides', 'Guides', active, 'guides')}
        ${navLi('contact', 'Contact', active, 'contact')}
      </ul>
      <div class="nav-actions">
        <a class="nav-phone" href="tel:+61451308349">${PHONE}0451 308 349</a>
        <a class="btn btn--primary" href="contact">Get a free quote</a>
      </div>
      <button class="nav-toggle" aria-label="Open menu" aria-expanded="false" aria-controls="mobileMenu"><span></span><span></span><span></span></button>
    </nav>
  </div>
</header>
<div class="mobile-menu" id="mobileMenu">
  <nav aria-label="Mobile">
    <a href="./">Home ${ARROW}</a>
    <a href="services">Services ${ARROW}</a>
    <a href="gallery">Gallery ${ARROW}</a>
    <a href="about">About ${ARROW}</a>
    <a href="guides">Guides ${ARROW}</a>
    <a href="contact">Contact ${ARROW}</a>
  </nav>
  <div class="mm-foot">
    <a class="btn btn--primary btn--lg" href="contact">Get a free quote</a>
    <a class="btn btn--white" href="tel:+61451308349">Call 0451 308 349</a>
    <div class="mm-contact"><span>Open 24 hours &middot; 7 days</span><span>info@ozzystrees.com.au</span></div>
  </div>
</div>`;
}

function footer() {
  return `<footer class="site-footer">
  <div class="container">
    <div class="footer-grid">
      <div class="footer-brand">
        <a class="brand" href="./" aria-label="Ozzy's Tree &amp; Stump Services home">
          ${MARK(46)}
          <span class="brand-text"><span class="b1">Ozzy's</span><span class="b2">Tree &amp; Stump Services</span></span>
        </a>
        <p>Local, fully insured tree removal, lopping and stump grinding across Brisbane's Northside. Your garden, our pride.</p>
        <div class="footer-social">
          <a href="https://share.google/W8slj1vkMdI9gpjac" target="_blank" rel="noopener" aria-label="Ozzy's on Google">${STAR}</a>
          <a href="https://www.facebook.com/search/top?q=Ozzy%27s%20Tree%20%26%20Stump%20Services" target="_blank" rel="noopener" aria-label="Ozzy's on Facebook">${FB}</a>
          <a href="tel:+61451308349" aria-label="Call Ozzy's">${PHONE}</a>
          <a href="mailto:info@ozzystrees.com.au" aria-label="Email Ozzy's">${MAIL}</a>
        </div>
      </div>
      <div class="footer-col"><h3>Services</h3><ul role="list"><li><a href="services#tree-removal">Tree Removal</a></li><li><a href="services#pruning">Lopping &amp; Pruning</a></li><li><a href="services#stump-grinding">Stump Grinding</a></li><li><a href="services#palms">Palm Removal</a></li><li><a href="services#emergency">Emergency &amp; Storm</a></li><li><a href="services#clearing">Land Clearing</a></li></ul></div>
      <div class="footer-col"><h3>Explore</h3><ul role="list"><li><a href="./">Home</a></li><li><a href="gallery">Gallery</a></li><li><a href="guides">Guides</a></li><li><a href="about">About us</a></li><li><a href="contact">Contact</a></li></ul></div>
      <div class="footer-col"><h3>Service areas</h3><ul role="list"><li><a href="chermside">Chermside</a></li><li><a href="stafford">Stafford</a></li><li><a href="aspley">Aspley</a></li><li><a href="kedron">Kedron</a></li></ul></div>
      <div class="footer-col"><h3>Get in touch</h3><ul role="list" class="footer-contact">
        <li>${PHONE}<a href="tel:+61451308349">0451 308 349</a></li>
        <li>${MAIL}<a href="mailto:info@ozzystrees.com.au">info@ozzystrees.com.au</a></li>
        <li>${PIN}<span>Chermside &amp; Brisbane Northside</span></li>
        <li>${CLOCK}<span>Open 24 hours &middot; 7 days a week</span></li>
        <li>${STAR}<a href="https://share.google/W8slj1vkMdI9gpjac" target="_blank" rel="noopener">5.0 on Google &middot; 27 reviews</a></li>
      </ul></div>
    </div>
    <div class="footer-bottom">
      <span>&copy; <span data-year>2026</span> Ozzy's Tree &amp; Stump Services. All rights reserved.</span>
      <span class="fb-links"><a href="services">Services</a><a href="gallery">Gallery</a><a href="contact">Free quote</a><a href="#main">Back to top</a></span>
    </div>
  </div>
</footer>
<div class="mobile-bar">
  <a class="btn btn--green" href="tel:+61451308349">${PHONE}Call now</a>
  <a class="btn btn--primary" href="contact">Free quote</a>
</div>
<button class="to-top" aria-label="Back to top"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg></button>
<script src="js/main.js" defer></script>
</body>
</html>`;
}

function head({ title, desc, canonical, ogImage, ogImageAlt, preloadImg, jsonld }) {
  ogImage = ogImage || (SITE + '/assets/img/og-image.jpg');
  ogImageAlt = ogImageAlt || "Ozzy's Tree & Stump Services, Brisbane Northside";
  const pl = preloadImg ? `\n<link rel="preload" as="image" href="${preloadImg}" fetchpriority="high">` : '';
  const ld = (jsonld || []).map(j => `<script type="application/ld+json">\n${JSON.stringify(j)}\n</script>`).join('\n');
  return `<!DOCTYPE html>
<html lang="en-AU">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${attr(desc)}">
<link rel="canonical" href="${canonical}">
<meta name="theme-color" content="#2C5740">
<meta name="robots" content="index,follow,max-image-preview:large">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Ozzy's Tree &amp; Stump Services">
<meta property="og:title" content="${attr(title)}">
<meta property="og:description" content="${attr(desc)}">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${ogImage}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${attr(ogImageAlt)}">
<meta property="og:locale" content="en_AU">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${attr(title)}">
<meta name="twitter:description" content="${attr(desc)}">
<meta name="twitter:image" content="${ogImage}">
<link rel="icon" href="favicon.ico" sizes="any">
<link rel="icon" type="image/svg+xml" href="assets/img/favicon.svg">
<link rel="apple-touch-icon" href="assets/img/apple-touch-icon.png">
<link rel="manifest" href="site.webmanifest">
<link rel="preload" as="font" type="font/woff2" href="assets/fonts/bricolage-800.woff2" crossorigin>
<link rel="preload" as="font" type="font/woff2" href="assets/fonts/hanken-400.woff2" crossorigin>${pl}
<link rel="stylesheet" href="css/styles.css">
${ld}
</head>
<body>
<a class="skip-link" href="#main">Skip to content</a>
`;
}

function faqItem(q, a) {
  return `<div class="faq-item"><button class="faq-q" type="button" aria-expanded="false">${esc(q)}<span class="fq-ico">${PLUS}</span></button><div class="faq-a"><div class="faq-a__inner"><p>${esc(a)}</p></div></div></div>`;
}
function faqLd(faqs) {
  return { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faqs.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) };
}
function crumbLd(items) {
  return { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, item: it.url })) };
}

/* ---------------- SUBURB PAGES ---------------- */
const SUBURB_MEDIA = {
  Chermside: { hero: 'assets/img/feature-safety.jpg', hw: 1800, hh: 1350, intro: 'assets/gallery/large/tree-removal-brisbane-14.jpg', iw: 1600, ih: 1200, ialt: 'Arborist in a cherry picker removing a tree under blue sky near Chermside' },
  Stafford: { hero: 'assets/img/feature-canopy.jpg', hw: 1800, hh: 1350, intro: 'assets/gallery/large/pruning-brisbane-05.jpg', iw: 1200, ih: 1600, ialt: 'Cherry picker pruning a large leafy street tree in a Stafford backyard' },
  Aspley: { hero: 'assets/img/feature-stump.jpg', hw: 1800, hh: 1350, intro: 'assets/gallery/large/stump-grinding-brisbane-26.jpg', iw: 1600, ih: 1200, ialt: 'Stump grinder beside a row of ground tree stumps in an Aspley backyard' },
  Kedron: { hero: 'assets/img/feature-chipper.jpg', hw: 1050, hh: 1400, intro: 'assets/gallery/large/equipment-brisbane-17.jpg', iw: 1200, ih: 1600, ialt: 'Green mini track loader working beside a cut gum stump in a Kedron backyard' },
};

function nearbyChips(list) {
  return list.map(n => {
    const slug = SUBURB_SLUGS[n.replace(/\.$/, '').trim()];
    return slug ? `<a href="${slug}">${esc(n)}</a>` : `<span>${esc(n)}</span>`;
  }).join('');
}

function buildSuburb(s) {
  const m = SUBURB_MEDIA[s.name] || SUBURB_MEDIA.Chermside;
  const canonical = `${SITE}/${s.slug}`;
  const ld = [
    crumbLd([{ name: 'Home', url: SITE + '/' }, { name: 'Service areas', url: SITE + '/contact' }, { name: s.name, url: canonical }]),
    {
      '@context': 'https://schema.org', '@type': 'Service', serviceType: 'Tree removal and stump grinding',
      provider: { '@type': 'LocalBusiness', '@id': SITE + '/#business', name: "Ozzy's Tree & Stump Services", telephone: '+61451308349' },
      areaServed: { '@type': 'Place', name: s.name + ', Brisbane, QLD' },
      url: canonical, name: `Tree services in ${s.name}`
    },
    faqLd(s.faqs),
  ];
  const services = [
    ['services#tree-removal', 'Tree removal', 'Safe sectional removal of trees of any size.'],
    ['services#pruning', 'Tree lopping & pruning', 'Reductions, thinning and dead-wooding to AS 4373.'],
    ['services#stump-grinding', 'Stump grinding', 'Stumps ground out below the surface so you can replant.'],
    ['services#palms', 'Palm removal', 'Whole palms or a frond clean-up, carted away.'],
    ['services#emergency', 'Storm & emergency', 'Fallen trees and hanging limbs made safe fast.'],
    ['services#clearing', 'Land clearing', 'Overgrown blocks and fence lines cleared and chipped.'],
  ].map(([h, t, d]) => `<a class="svc-card" href="${h}"><div class="svc-ico">${CHECK}</div><h3>${t}</h3><p>${d}</p><span class="link-arrow">Learn more ${ARROW}</span></a>`).join('\n        ');

  const html = head({
    title: s.metaTitle, desc: s.metaDescription, canonical,
    ogImageAlt: `Ozzy's Tree & Stump Services in ${s.name}`, preloadImg: m.hero, jsonld: ld,
  }) + header(null) + `
<main id="main">
  <section class="page-hero">
    <div class="page-hero__bg"><img src="${m.hero}" alt="" aria-hidden="true" fetchpriority="high" width="${m.hw}" height="${m.hh}"></div>
    <div class="container">
      <div class="page-hero__inner">
        <nav class="breadcrumbs" aria-label="Breadcrumb"><a href="./">Home</a>${CHEV}<span>${esc(s.name)}</span></nav>
        <h1 data-reveal>${esc(s.h1)}</h1>
        <p class="lead" data-reveal style="--d:.08s">${esc(s.heroLine)}</p>
        <div class="btn-row" data-reveal style="--d:.14s;margin-top:1.6rem">
          <a class="btn btn--primary btn--lg" href="contact">Get a free quote</a>
          <a class="btn btn--white btn--lg" href="tel:+61451308349">Call 0451 308 349</a>
        </div>
      </div>
    </div>
  </section>

  <section class="section">
    <div class="container">
      <div class="split">
        <div data-reveal="left">
          <span class="eyebrow"><span class="dot"></span>Tree services in ${esc(s.name)}</span>
          <div class="prose" style="margin-top:1.2rem">${s.introHtml}</div>
          <div class="btn-row" style="margin-top:1.8rem"><a class="btn btn--green" href="contact">Get my free quote</a><a class="link-arrow" href="gallery" style="align-self:center">See our work ${ARROW}</a></div>
        </div>
        <div class="split__media" data-reveal="right">
          <img src="${m.intro}" alt="${attr(m.ialt)}" width="${m.iw}" height="${m.ih}" loading="lazy">
          <div class="badge-float"><span class="bf-ico">${CHECK}</span>Local crew, fast call-outs</div>
        </div>
      </div>
    </div>
  </section>

  <section class="section section--paper2">
    <div class="container">
      <div class="section-head" data-reveal>
        <span class="eyebrow"><span class="dot"></span>What we do here</span>
        <h2>Every tree job in ${esc(s.name)}, sorted</h2>
        <div class="prose" style="margin-top:1rem">${s.localContextHtml}</div>
      </div>
      <div class="svc-grid" data-reveal-stagger>
        ${services}
      </div>
    </div>
  </section>

  <section class="section">
    <div class="container">
      <div class="split split--rev">
        <div data-reveal="left" style="display:flex;align-items:center;justify-content:center">${GRATING}</div>
        <div data-reveal="right">
          <span class="eyebrow"><span class="dot"></span>Why Ozzy's</span>
          <h2 class="mt-1">A ${esc(s.name)} call-out is never far away</h2>
          <div class="prose" style="margin-top:1rem">${s.whyUsHtml}</div>
          <ul class="suburb-chips" style="margin-top:1.4rem;list-style:none;padding:0">${nearbyChips(s.nearbySuburbs)}</ul>
        </div>
      </div>
    </div>
  </section>

  <section class="section section--paper2" id="faq">
    <div class="container">
      <div class="section-head center" data-reveal><span class="eyebrow"><span class="dot"></span>Good to know</span><h2>${esc(s.name)} tree questions</h2></div>
      <div class="faq" data-reveal>
        ${s.faqs.map(f => faqItem(f.q, f.a)).join('\n        ')}
      </div>
    </div>
  </section>

  <section class="cta-band">
    <div class="cta-band__bg"><img src="assets/img/feature-canopy.jpg" alt="" aria-hidden="true" width="1800" height="1350" loading="lazy"></div>
    <div class="container"><div class="inner" data-reveal>
      <h2>Got a tree to sort in ${esc(s.name)}?</h2>
      <p class="lead">Tell us about it and we'll give you a free, no-obligation quote. Most jobs we can price the same week.</p>
      <div class="btn-row"><a class="btn btn--primary btn--lg" href="contact">Get my free quote</a><a class="btn btn--white btn--lg" href="tel:+61451308349">Call 0451 308 349</a></div>
    </div></div>
  </section>
</main>
` + footer();
  fs.writeFileSync(path.join(root, s.slug + '.html'), html);
  console.log('suburb ->', s.slug + '.html');
}

/* ---------------- ARTICLES ---------------- */
const ARTICLE_MEDIA = {
  'tree-lopping-vs-pruning': { img: 'assets/img/feature-pruning.jpg', w: 1050, h: 1400, alt: 'Arborist pruning a large tree from a cherry picker in Brisbane', tag: 'Tree care' },
  'council-approval-tree-removal-brisbane': { img: 'assets/img/feature-canopy.jpg', w: 1800, h: 1350, alt: 'Large protected-looking shade tree in a Brisbane backyard', tag: 'Council & permits' },
  'prepare-trees-storm-season-brisbane': { img: 'assets/gallery/large/tree-removal-brisbane-28.jpg', w: 1200, h: 1600, alt: 'Storm-damaged tree fallen onto a Brisbane home', tag: 'Storm season' },
};

function buildArticle(a) {
  const m = ARTICLE_MEDIA[a.slug] || ARTICLE_MEDIA['tree-lopping-vs-pruning'];
  const canonical = `${SITE}/${a.slug}`;
  const absImg = SITE + '/' + m.img;
  const ld = [
    crumbLd([{ name: 'Home', url: SITE + '/' }, { name: 'Guides', url: SITE + '/guides' }, { name: a.h1, url: canonical }]),
    {
      '@context': 'https://schema.org', '@type': 'Article', headline: a.metaTitle, description: a.metaDescription,
      image: absImg, datePublished: TODAY, dateModified: TODAY,
      author: { '@type': 'Organization', name: "Ozzy's Tree & Stump Services" },
      publisher: { '@type': 'Organization', name: "Ozzy's Tree & Stump Services", logo: { '@type': 'ImageObject', url: SITE + '/assets/img/icon-512.png' } },
      mainEntityOfPage: canonical,
    },
  ];
  if (a.faqs && a.faqs.length) ld.push(faqLd(a.faqs));

  const faqBlock = (a.faqs && a.faqs.length) ? `
      <div class="article" style="margin-top:3rem">
        <h2 style="font-family:var(--font-display);font-weight:800;font-size:clamp(1.45rem,1.2rem + 1vw,1.95rem)">Common questions</h2>
        <div class="faq" style="margin-top:1.2rem">
          ${a.faqs.map(f => faqItem(f.q, f.a)).join('\n          ')}
        </div>
      </div>` : '';

  const html = head({
    title: a.metaTitle, desc: a.metaDescription, canonical,
    ogImage: absImg, ogImageAlt: m.alt, preloadImg: m.img, jsonld: ld,
  }) + header('guides') + `
<main id="main">
  <section class="page-hero">
    <div class="page-hero__bg"><img src="${m.img}" alt="" aria-hidden="true" fetchpriority="high" width="${m.w}" height="${m.h}"></div>
    <div class="container">
      <div class="page-hero__inner article">
        <nav class="breadcrumbs" aria-label="Breadcrumb"><a href="./">Home</a>${CHEV}<a href="guides">Guides</a>${CHEV}<span>${esc(m.tag)}</span></nav>
        <h1 data-reveal>${esc(a.h1)}</h1>
        <p class="lead" data-reveal style="--d:.08s">${esc(a.dek)}</p>
        <div class="article-meta" data-reveal style="--d:.12s">
          <span class="am-item">${CLOCK}${a.readMins} min read</span>
          <span class="am-item">${CHECK}Local Brisbane arborists</span>
        </div>
      </div>
    </div>
  </section>

  <section class="section">
    <div class="container">
      <article class="article">
        <div class="prose" data-reveal>${a.bodyHtml}</div>
        <div class="article-cta">
          <h2>Want a hand from a local crew?</h2>
          <p>We give free, no-obligation quotes across Brisbane's Northside, and we're happy to take a look before you decide anything.</p>
          <div class="btn-row"><a class="btn btn--primary btn--lg" href="contact">Get a free quote</a><a class="btn btn--white btn--lg" href="tel:+61451308349">Call 0451 308 349</a></div>
        </div>
      </article>
      ${faqBlock}
      <div class="article" style="margin-top:2.6rem;text-align:center">
        <a class="link-arrow" href="guides" style="justify-content:center">Back to all guides ${ARROW}</a>
      </div>
    </div>
  </section>
</main>
` + footer();
  fs.writeFileSync(path.join(root, a.slug + '.html'), html);
  console.log('article ->', a.slug + '.html');
}

/* ---------------- GUIDES INDEX ---------------- */
function buildGuides(articles) {
  const canonical = SITE + '/guides';
  const ld = [crumbLd([{ name: 'Home', url: SITE + '/' }, { name: 'Guides', url: canonical }])];
  const cards = articles.map(a => {
    const m = ARTICLE_MEDIA[a.slug];
    return `<a class="guide-card" href="${a.slug}">
          <div class="guide-card__img"><img src="${m.img}" alt="${attr(m.alt)}" width="${m.w}" height="${m.h}" loading="lazy"></div>
          <div class="guide-card__body">
            <span class="gc-tag">${esc(m.tag)}</span>
            <h3>${esc(a.h1)}</h3>
            <p>${esc(a.dek)}</p>
            <span class="link-arrow">Read the guide ${ARROW}</span>
          </div>
        </a>`;
  }).join('\n        ');

  const html = head({
    title: 'Tree Care Guides &amp; Advice | Ozzy\'s Trees Brisbane',
    desc: 'Straight-talking tree care guides for Brisbane homeowners: tree lopping vs pruning, council removal rules, and getting your trees ready for storm season.',
    canonical, preloadImg: 'assets/img/feature-pruning.jpg', jsonld: ld,
  }) + header('guides') + `
<main id="main">
  <section class="page-hero">
    <div class="page-hero__bg"><img src="assets/img/feature-pruning.jpg" alt="" aria-hidden="true" fetchpriority="high" width="1050" height="1400"></div>
    <div class="container">
      <div class="page-hero__inner">
        <nav class="breadcrumbs" aria-label="Breadcrumb"><a href="./">Home</a>${CHEV}<span>Guides</span></nav>
        <h1 data-reveal>Tree care guides &amp; advice</h1>
        <p class="lead" data-reveal style="--d:.08s">Honest, practical advice from a local Brisbane crew. No jargon, no upselling, just the stuff worth knowing before you touch a tree.</p>
      </div>
    </div>
  </section>
  <section class="section">
    <div class="container">
      <div class="guide-grid" data-reveal-stagger>
        ${cards}
      </div>
    </div>
  </section>
  <section class="cta-band">
    <div class="cta-band__bg"><img src="assets/img/feature-canopy.jpg" alt="" aria-hidden="true" width="1800" height="1350" loading="lazy"></div>
    <div class="container"><div class="inner" data-reveal>
      <h2>Still not sure? Just ask.</h2>
      <p class="lead">A quick chat with a local who actually shows up beats guessing. Free quotes and honest advice, 7 days.</p>
      <div class="btn-row"><a class="btn btn--primary btn--lg" href="contact">Get a free quote</a><a class="btn btn--white btn--lg" href="tel:+61451308349">Call 0451 308 349</a></div>
    </div></div>
  </section>
</main>
` + footer();
  fs.writeFileSync(path.join(root, 'guides.html'), html);
  console.log('guides index -> guides.html');
}

data.suburbs.forEach(buildSuburb);
data.articles.forEach(buildArticle);
buildGuides(data.articles);
console.log('DONE:', data.suburbs.length, 'suburbs +', data.articles.length, 'articles + guides index');
