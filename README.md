# mohit soni · portfolio

Personal site. Plain HTML, CSS and JavaScript: no build step, no framework, no trackers.

```
index.html                 the page (sections are marked: HERO, EXPERIENCE, WORK, STACK, WRITING, ABOUT, CONTACT)
404.html                   self-contained 404 page
assets/css/site.css        design tokens at the top, then components
assets/js/site.js          theme, live clock and durations, trace, Writing list, ⌘K menu
assets/img/                favicon, touch icon, social preview (og.png, 1200×630)
assets/Mohit_Soni_Resume.pdf
content/posts.js           ← your Medium posts go here
content/medium-feed.js     written by the sync script, don't edit by hand
scripts/sync-medium.mjs    pulls new posts from Medium's RSS feed
.github/workflows/         runs the sync daily on GitHub
```

## Preview it

Double-click `index.html`, or serve the folder (closer to production):

```sh
python3 -m http.server 8000   # then open http://localhost:8000
```

## Add a Medium post

Open `content/posts.js`, copy the example block into `posts`, and fill it in:

```js
{
  title: "Idempotency keys: how we stopped paying out twice",
  url: "https://medium.com/@your-handle/your-post-slug-1a2b3c4d5e6f",
  date: "2026-10-01",              // YYYY-MM-DD, required
  summary: "One or two sentences.", // optional
  tags: ["Django", "Payments"],    // optional; topics shared by 2+ posts become filters
  readTime: 8,                     // optional, minutes
  featured: true                   // optional, pins it to the top
},
```

Save and refresh. Newest posts come first, the first six show by default, and the rest sit behind "Show all". Posts also show up in the ⌘K menu. A post missing its title, url or date is skipped, with a warning in the browser console.

## Let new posts appear on their own (optional)

1. Set your handle in `content/posts.js`: `medium: "@your-handle"`. This also switches on the Medium links in the Writing and Contact sections.
2. Run `node scripts/sync-medium.mjs` (Node 18+). It reads your Medium RSS feed and writes `content/medium-feed.js`.
3. On GitHub, `.github/workflows/sync-medium.yml` does the same every day at 08:47 IST and commits any new posts. To run it now: **Actions → Sync Medium posts → Run workflow**.

Medium's feed only carries the ten latest stories. The sync keeps every post it has already seen, so the list grows over time; add older posts by hand in `posts.js`. An entry in `posts.js` with the same URL as a synced post overrides it (rewrite the summary or tags), and `hidden: true` hides it.

## Deploy

**GitHub Pages (free)**

1. Create a public repository named `m0hits0ni.github.io`.
2. Push the contents of this folder to its `main` branch.
3. In the repository: **Settings → Pages → Deploy from a branch → `main` / root**.
4. The site goes live at `https://m0hits0ni.github.io/` within a couple of minutes.

A different repository name (say `portfolio`) serves the site at `https://m0hits0ni.github.io/portfolio/`. Everything works there except the 404 page's "Back to the homepage" link, which points at `/`.

**Netlify, Vercel or Cloudflare Pages:** import the repository (or drag the folder onto Netlify Drop). There is no build command; publish the root folder.

**Custom domain or different URL:** search for `m0hits0ni.github.io` and replace it in `index.html` (canonical, Open Graph and JSON-LD tags), `robots.txt` and `sitemap.xml`. Social previews need that absolute URL to find `og.png`.

## Editing notes

- **Durations stay current.** "1y 9m", "6+ years" and the trace bars are calculated from today's date in the browser. If a date changes, edit the `data-span`, `data-range` and `data-years-since` attributes in `index.html`.
- **Case studies** in the Work section are written from the résumé. Add real specifics where you can (the fix for the Redis leak, how Green Channel decides eligibility); detail is what makes them read like your own.
- **Contact:** the phone number is left off the public page on purpose. It's still in the résumé PDF.
- **Résumé:** replace `assets/Mohit_Soni_Resume.pdf` and keep the filename.
- **Keyboard:** ⌘K / Ctrl K or `/` opens the command menu. On phones, the Menu button opens it.
- **Theme** follows the system until someone picks one with the toggle; the choice is remembered in that browser.
- **Print:** the page prints as a clean résumé (navigation and controls are hidden, links show their URLs).
