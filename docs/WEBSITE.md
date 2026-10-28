# The public KISC PeopleHub website

The project now includes two experiences:

- `/`: public introduction to PeopleHub. No sign-in or database required.
- `/app`: the existing development HR application. Requires the Express API, PostgreSQL and a development account.

The public site has a responsive homepage, feature descriptions with accurate implementation status, proposed seven-school/three-campus structure, interactive fictional workforce preview, expandable FAQs, privacy/project notice and a downloadable project overview. It is an independent concept, not an official KISC website. The crest is a temporary wordmark.

## Website first: run it without a database

From the project directory, install with `npm ci --cache /tmp/peoplehub-npm`, then run `npm run dev`. Use the address shown by Vite. The homepage does not call the HR API. The staff workspace link only works fully when the application backend is also running.

## Publish only the website

Run `npm run build:website`. This creates `website-dist/`, a self-contained static website. In this build, workspace links become preview links, and the HR application is not offered as a functioning login. This is the recommended first public deployment; it contains no `.env`, database, passwords or personnel records.

A ready-made ZIP is available at the repository root: `kisc-peoplehub-website.zip`. Extract it to a folder; the folder must contain `index.html`, `assets/`, and `peoplehub-overview.txt` directly inside it.

For a beginner-friendly manual publication:

1. Open https://app.netlify.com/drop and sign in or create an account as requested.
2. Upload the **extracted website folder**, not the application repository or `.env` file.
3. When deployment finishes, Netlify provides the public website URL. You can later rename the site or connect a domain.

This third-party publication is performed in your hosting account. The current coding environment has no connected hosting/deployment tool, so no public deployment or live URL has been created. Review host pricing/settings when creating your account.

Other static hosts also work if they serve `index.html` and root-relative `/assets/` URLs from the domain root. A GitHub Pages subdirectory requires configuring Vite's `base` and changing root-relative download links; do not assume this ZIP works unchanged under a subdirectory.

## Checks

`npm run build` builds the website plus application frontend. `npm run build:website` builds the standalone website. `node tests/website.mjs` checks the site served by the app on port 3001. Set `WEBSITE_URL` to a local static server to test the standalone build independently. Chromium must be installed; override `CHROMIUM_PATH` if needed.

Browser checks cover desktop/mobile rendering, no horizontal mobile overflow, menu open/close, FAQ expansion, school-preview filter, project-overview download and no public-page API calls. These are smoke tests, not an accessibility certification. Existing app browser tests now visit `/app` and still pass.

## What comes next

Use the public website to review branding and explain the project. The larger HR application remains under development according to ROADMAP.md. No contact inbox, public job applications or payments have been connected. The public site avoids nonfunctional contact forms and makes no claim that planned HR workflows are complete.

## Open a single HTML file

`KISC-PeopleHub.html` is the self-contained public website, with JavaScript, styles, fonts and the downloadable overview embedded. Download it and open it in a modern browser; no hosting, Node.js or PostgreSQL is needed. Recreate it after `npm run build:website` using `python scripts/package-html.py`. The self-contained content was rendered offline and its filter, FAQ and embedded overview link verified without network requests. Direct `file://` navigation was blocked by this environment's managed browser policy, so the automated check loaded the same HTML content into the browser instead. The HTML contains the public concept website only, not the HR backend.

## Business themes update

The website and development application now share Light/Dark controls. Light uses crisp white, maroon, gold and green; Dark uses charcoal, muted green, warm gold and a brighter maroon accent. Preferences persist locally where storage is available, and system colour preference is used initially. Controls remain usable when local storage is blocked.

`KISC-PeopleHub-Light-Dark.html` is a second, clearly named copy of the self-contained HTML. It opens the public website and includes interactive head-office/school/employee illustrations. These illustrations use fictional data; they do not implement additional HR workflows. The supplied KISC screenshot/logo and organization description ground the palette and employee-focused narrative. The original eagle-logo image was visible in chat but not accessible as a binary workspace asset; it has not been redrawn or claimed to be embedded. The design uses a separate PeopleHub product wordmark.

Theme browser checks: `node tests/themes.mjs`, `node tests/app-themes.mjs`, and `node tests/offline-html.mjs`. Website Light/Dark desktop/mobile layouts, saved preference, keyboard-operable workspace tabs, mobile navigation and offline controls passed. The existing website/app smoke scripts also passed. No additional backend, payroll or security-compliance claims accompany this visual update.
