# Ozzy's Tree &amp; Stump Services — Website

A fast, modern, fully static website for **Ozzy's Tree &amp; Stump Services**, Brisbane Northside. Hand-built with HTML, CSS and vanilla JavaScript — no frameworks, no build step, no tracking. Designed to be dropped straight onto Hostinger (or any web host).

**Live domain:** https://ozzystrees.com.au

---

## What's in here

| Path | What it is |
| --- | --- |
| `index.html` `services.html` `gallery.html` `about.html` `contact.html` `404.html` | The pages |
| `css/styles.css` | The whole design system (fonts, components, animations, responsive) |
| `js/main.js` | Interactions: nav, scroll reveals, counters, gallery filter + lightbox, video, FAQ, contact form |
| `js/gallery-data.js` | Auto-generated photo manifest (categories, alt text, captions, blur-up placeholders) |
| `js/video-data.js` | Auto-generated video manifest |
| `php/send.php` | Contact-form handler that emails enquiries via **Resend** |
| `php/config.sample.php` | Template for your private Resend key (copy to `config.php`) |
| `assets/img/` | Logo, favicons, social share image, hero &amp; feature photos |
| `assets/gallery/` | Optimised gallery photos (`thumb/` + `large/`) |
| `assets/video/` | Job videos |
| `assets/fonts/` | Self-hosted woff2 fonts |
| `.htaccess` | HTTPS + non-www redirects, caching, compression, security headers |
| `sitemap.xml` `robots.txt` `site.webmanifest` | SEO + PWA basics |
| `scripts/` | Build helpers (image optimisation, fonts, favicons, gallery data). Not needed to run the site. |

---

## Deploying to Hostinger

1. In hPanel, open **File Manager** and go to `public_html` (clear out any old WordPress files first, or back them up).
2. Upload **everything in this repo except** the `scripts/` folder and `assets/originals/` (those are build-only). The simplest way is to zip the project and use File Manager's "Upload → extract".
   - Make sure hidden files `.htaccess` is included.
3. Confirm the site loads at your domain. That's it — it's static, so there's nothing to "install".

> Connecting the domain: point `ozzystrees.com.au` to your Hostinger hosting (via Hostinger's domain settings or your registrar's nameservers), then enable the free SSL certificate in hPanel so HTTPS works.

---

## Turning on the quote form (Resend)

The contact form posts to `php/send.php`, which sends you an email through [Resend](https://resend.com). Hostinger runs PHP, so this works out of the box once you add a key:

1. Create a free Resend account → **API Keys** → create a key (looks like `re_...`).
2. Copy `php/config.sample.php` to `php/config.php` and paste your key + the inbox you want enquiries sent to.
3. **Sender address:** until you verify your domain in Resend, leave `mail_from` as the test sender `onboarding@resend.dev` (it only delivers to your Resend account email). Once you've added and verified `ozzystrees.com.au` in Resend (**Domains**), switch `mail_from` to something like `Ozzy's Website <quote@ozzystrees.com.au>` so mail comes from your own domain and lands reliably.
4. `config.php` is git-ignored, so your key never goes into the repo.

If no key is set, the form politely tells visitors to call instead, and never silently fails.

## Bot protection (Cloudflare Turnstile)

The quote form uses [Cloudflare Turnstile](https://www.cloudflare.com/products/turnstile/) to stop spam bots. It works standalone, so you don't need your DNS on Cloudflare.

1. At [dash.cloudflare.com](https://dash.cloudflare.com) go to **Turnstile → Add site**, enter `ozzystrees.com.au`, and create the widget. You'll get two keys.
2. Put the **Site key** in `contact.html` (find `data-sitekey="1x00000000000000000000AA"` and replace the value).
3. Put the **Secret key** in `php/config.php` as `turnstile_secret`.

Until you swap them, the site uses Cloudflare's public test keys (the widget shows and always passes, so nothing breaks). Server-side verification only enforces once `turnstile_secret` is set, so the form keeps working either way.

---

## Things to update with your real details

A few spots use sensible placeholders. Search-and-replace when you have the real info:

- **Google reviews link** — the "Read &amp; leave a Google review" button (home page) and the Facebook icons point to a Google/Facebook search for the business. Once your Google Business Profile and Facebook page URLs are known, swap them in (search `google.com/search?q=Ozzy` and `facebook.com/search`).
- **Testimonials** — when you send real reviews, drop them into the commented testimonial template in `index.html` (search `TESTIMONIALS:`). Nothing fake is shown until then.
- **Business address** — the structured data and footer use Chermside, QLD 4032 as the base. If you have a specific street address or different suburb, update it in each page's JSON-LD and the footer.
- **Email** — set to `info@ozzystrees.com.au`. Change everywhere if you'd rather use the Gmail address.

---

## Rebuilding the assets (optional)

You only need this if you add or replace photos. The image pipeline uses [sharp](https://sharp.pixelplumbing.com/) (mozjpeg) for the best quality-per-byte:

```bash
npm install            # installs sharp (one time)
node scripts/build-images.js
```

This regenerates every gallery thumbnail + large image and the hero/feature crops as optimised JPEGs, rebuilds `js/gallery-data.js` (with blur-up placeholders, categories and alt text from `js/_catalogue.json`), and removes unused crops. Drop new full-size photos into `assets/originals/` first, named like the existing files, and add their entry to `js/_catalogue.json`.

> Why JPEG, not WebP? For this photo set, mozjpeg actually beats WebP on thumbnails and ties on the large images, so a single well-tuned JPEG is the simplest and lightest option (no `<picture>` needed).

### Adding suburb pages or guides

The 4 suburb landing pages, 3 guide articles and the guides index are generated from `js/_local-content.json` by a template script, so they all share the same header, footer and design:

```bash
node scripts/build-pages.js
```

To add another suburb or article, add an entry to `js/_local-content.json` (copy the shape of an existing one), then re-run the command and add the new URL to `sitemap.xml`. Keep suburb copy genuinely local and specific, near-duplicate "doorway" pages get penalised by Google.

Other helpers (PowerShell, Windows):

- `scripts/fetch-fonts.ps1` — re-downloads the self-hosted fonts.
- `scripts/make-favicons.ps1` — regenerates favicons + the social share image from the logo.
- `scripts/preview-server.js` — `node scripts/preview-server.js` then open http://localhost:8123 for a local preview.

---

## Design notes

- **Type:** Bricolage Grotesque (display) + Hanken Grotesk (body), self-hosted for speed and privacy.
- **Palette:** eucalyptus greens with a warm timber-amber accent, cream paper background.
- **Performance:** images are resized + compressed with blur-up placeholders and lazy-loaded; fonts and the hero image are preloaded; JS is deferred; everything is cached aggressively via `.htaccess`.
- **Accessibility:** semantic landmarks, skip link, keyboard-friendly gallery lightbox, focus styles, and full `prefers-reduced-motion` support.
- **SEO:** per-page titles/descriptions, canonicals, Open Graph + Twitter cards, `LocalBusiness`/`TreeService`, `FAQPage` and `BreadcrumbList` structured data, sitemap and robots.

&copy; Ozzy's Tree &amp; Stump Services. Built to last.
