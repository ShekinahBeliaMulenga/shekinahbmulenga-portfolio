# Shekinah Belia Mulenga — Portfolio

Static site. No build step, no dependencies.

## Deploy
Drag this folder onto Netlify (or Vercel / GitHub Pages). `index.html` must stay at the top level.

The site is set up for **https://shekinahbmulenga-portfolio.netlify.app**. If you use a different
address, change it in `index.html` in three places: `og:url`, `canonical` and `og:image`
(plus `"url"` in the JSON-LD block).

## Files
- `index.html` — all content
- `styles.css` — design tokens (top of file) + components, light/dark themes
- `main.js` — theme, mobile menu, scroll-spy, reveal, project filters, image viewer, copy-email
- `lab.js` — the animated demo lab in the hero (programming, AI, networking, security, systems)
- `assets/` — screenshots, certificates, CV, favicon, social image (`og-image.jpg`)
- `netlify.toml` — security + caching headers · `404.html` · `robots.txt`

## Editing
- Colours/fonts: the `:root` variables at the top of `styles.css`.
- Add a project: copy an `<article class="case">` block; set `data-cat` to any of `ai software data web systems`.
- Add a certificate: copy a `.cert` block into `#credentials`.
- Demo lab captions and links: the `SCENES` list near the bottom of `lab.js`.
- The lab pauses off-screen and shows a still frame for visitors who prefer reduced motion.
