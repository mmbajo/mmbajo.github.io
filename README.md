# Mark Bajo — personal site

A small static Astro site for writing and playable reinforcement learning experiments.

- Markdown and MDX posts, with draft support and an RSS feed.
- Social preview cards: a `1200x630` Open Graph image per page, `summary_large_image` Twitter cards, and `schema.org` `Person` / `BlogPosting` data.
- A reusable `RLDemo` component that loads an iframe only after **Run demo** is clicked.
- A complete example: tabular Q-learning in a maze, with policy checkpoints, exploration, keyboard/touch controls, and fullscreen.
- A light/dark toggle that starts with the reader's system theme and remembers their choice locally. The preview, code blocks, and running demo follow the selected theme. The preview is inline SVG rather than an `<img>`, so it reads the page's own variables instead of the operating system's color scheme.
- One warm paper/ink/gold palette shared by the site, the preview, and the running experiment, with tokens for type scale, spacing, surfaces, and layout rails in `src/styles/global.css`.
- Monospace for anything you scan — navigation, labels, metadata, headings, code — and a system sans for running prose.
- A personal homepage with a local copy of the `mmbajo` GitHub avatar, leading with the playable experiment, and a blog at `/blog/`. Old `/writing/` links redirect to their new locations.
- Every page shares a full-width reading-progress bar at the top, with three pixel cats: two Russian Blues (6 kg and 5 kg) and a Tonkinese (3.5 kg). They start offscreen, enter as you scroll, and leave the frame one by one at the end. The pack follows the scroll; each cat then follows its own slot in the pack with a lag set by its weight, so the line gives and gathers as the scroll speed changes. They turn one at a time when you scroll back, swishing their tails, and they breathe, blink, look around, and sway their tails while resting. Their sizes and coats differ; their running order is shuffled once per tab and stays the same between pages. Animations pause when the cats are offscreen or the tab is hidden, and reduced-motion preferences disable them.
- Blog posts also have a sticky contents tree, active section tracking, and a small reading meter alongside the article.
- System fonts and local assets. No React runtime, external fonts, analytics, database, or application server.

## Run locally

Use Node.js 24 (`nvm use` if you use nvm):

```sh
npm ci
npm run dev
```

Open the localhost address printed by Astro. To check and preview the production build:

```sh
npm run check
npm test
npm run build
npm run preview
```

`npm test` also guards the cascade layer order. Component CSS can be bundled before `global.css`, and minifiers drop a redundant `@layer a, b, c;` statement, so whichever stylesheet lands first has to declare the order. If it does not, the fallback is first-appearance order and `reset` silently overrides every component rule — every margin, weight, and link color on the site. Each file in `src/styles/` repeats the declaration for that reason.

The browser tests check lazy loading, agent playback, keyboard/touch controls, mobile layout, theme persistence and demo synchronization, routes, feeds, reading without JavaScript, and the cats' entry, staged exit, idle behavior, direction, session order, and reduced-motion support:

```sh
npx playwright install chromium
npm run test:browser
```

On macOS, tests use an installed Google Chrome when available. In CI, Playwright installs Chromium.

## Personalize

- `src/config.ts`: name, description, GitHub links, and contact details. Replace the two `REPLACE-ME` placeholders to publish an email address and profile links. Anything still containing `REPLACE-ME` is skipped, so unfinished links never ship. The address is split into parts and joined in the browser, so the HTML never contains a plain `mailto:`; readers without JavaScript see `user at domain`.
- `src/data/career.ts`: concise experience and education. Employers are anonymous; education has no dates.
- `src/pages/index.astro`: introduction and featured experiment.
- `src/styles/global.css`: design tokens (color, type scale, spacing, layout rails) and every component rule.
- `src/styles/maze.css`: generated from `public/demos/gridworld/palette.js`. Do not edit by hand.
- `public/favicon.svg`: the small grid icon.
- `public/images/avatar.png`: the GitHub profile image, saved locally to avoid a third-party image request. Replace it here after changing your GitHub avatar.
- `public/og/*.png`: generated social cards. Run `npm run og` after adding a post or changing a title.
- `scripts/generate-og-images.mjs`: the card design.
- `src/components/ReadingProgress.astro` and `TableOfContents.astro`: the shared top bar, cats' movement and session order, sidebar reading meter, and automatic navigation generated from article headings.
- `src/components/PixelCat.astro`: the three cats' pixel art, sizes, colors, and individual running cadence.
- `src/styles/cats.css`: running poses and idle animations.

The Q-learning article and demo are explicitly marked as an introductory example, not a claim about original research. Keep them, edit them, or replace them with your first experiment.

## Publish a post

Copy `templates/post.mdx` into `src/content/writing/my-post.mdx`. Set the title, description, date, and tags. Set `draft: false` when it is ready. A post's filename becomes its URL, for example `/blog/my-post/`.

Plain `.md` files work too. Use `.mdx` when embedding a component. Draft posts are excluded from the homepage, writing index, routes, RSS, and sitemap.

## Add an experiment

Put a standalone browser demo in `public/demos/my-experiment/`, including its `index.html`, scripts, WebAssembly, model files, and other assets. Use relative URLs inside the demo for its assets. Supply a poster: either inline SVG via `posterSvg` (which can read the site's theme variables) or an image URL via `poster`.

In an MDX article:

```mdx
import RLDemo from '../../components/RLDemo.astro';

<RLDemo
  src="/demos/my-experiment/"
  title="My experiment"
  poster="/images/my-experiment.svg"
  posterAlt="Describe the preview image"
  description="What can the reader try?"
  height={610}
/>
```

The wrapper keeps the experiment unloaded until clicked. **Close demo** removes the iframe entirely. To pause an experiment when it scrolls offscreen, handle the same-origin message `{ type: 'demo:visibility', visible: boolean }` as the example does in `public/demos/gridworld/app.js`. Validate both `event.origin` and `event.source`. Also pause on `document.visibilitychange`. For automatic iframe sizing, send `{ type: 'demo:resize', height }` from a `ResizeObserver` on your demo's main container; the wrapper validates its source and bounds the height.

For matching light/dark themes, include `<script src="/theme.js"></script>` in your demo's `<head>`, style `[data-theme="dark"]`, and listen for `window`'s `themechange` event to repaint a canvas. The wrapper sends `{ type: 'site:theme', theme: 'light' | 'dark' }`; the shared script validates and handles it. Prefer an inline `posterSvg` over a `poster` image URL: an `<img>` is an isolated document and can only follow the operating system with `@media (prefers-color-scheme: dark)`, which disagrees with the site's toggle. Inline SVG reads the page's own `--maze-*` variables, as the bundled preview does.

The bundled example uses plain JavaScript and trains with a fixed seed after opening. A Python environment or PyTorch checkpoint must be ported/exported before it can run in the browser. C/Rust WebAssembly demos can use the same wrapper. Start with a single-threaded build; pthreads/SharedArrayBuffer need appropriate hosting headers.

After changing the example's maze, policy, or palette, regenerate the preview and the shared color tokens:

```sh
npm run poster
```

This writes `src/assets/gridworld-poster.svg` (inlined by `RLDemo`, so it follows the theme toggle) and `src/styles/maze.css` (the `--maze-*` variables the inline preview reads). `palette.js` stays the single source of truth for the canvas, the preview, and the tokens.

After adding or renaming a post, regenerate the social cards:

```sh
npm run og
```

This renders `public/og/default.png` plus one card per published post using the Playwright browser that is already a dev dependency. The cards use system fonts, so regenerate them from one machine to keep the typography consistent.

## Deploy to GitHub Pages

This repository is configured for `https://mmbajo.github.io/`.

1. Open **Settings → Pages** in `mmbajo/mmbajo.github.io`.
2. Under **Build and deployment**, select **GitHub Actions**.
3. Push to `main`, or open **Actions → Check and deploy site → Run workflow**.

The workflow installs dependencies, checks types, tests the learning logic, builds the site, runs browser tests, and deploys `dist/`. Pull requests run validation without deployment.

GitHub Free requires the repository to be public to use Pages. A private repository needs a supported paid GitHub plan, or another static host. Repository visibility is a separate owner decision; this project's setup does not change it.

For another static host, use `npm run build` and publish `dist/`.

For a custom domain, configure it in GitHub Pages and your domain's DNS, then update `site` in `astro.config.mjs` and the sitemap URL in `public/robots.txt`. Keep HTTPS enabled.

## Keep it small

Keep checkpoints and assets for a demo separate from article content and out of the initial page load. Avoid adding a dependency for interactions that a few lines of JavaScript can handle. Check a production build on mobile before publishing a new demo.
