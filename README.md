# Mark Bajo — personal site

A small static Astro site for writing and playable reinforcement learning experiments.

- Markdown and MDX posts, with draft support and an RSS feed.
- A reusable `RLDemo` component that loads an iframe only after **Run demo** is clicked.
- A complete example: tabular Q-learning in a maze, with policy checkpoints, exploration, keyboard/touch controls, and fullscreen.
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

The browser tests check lazy loading, agent playback, keyboard/touch controls, mobile layout, routes, feeds, and reading without JavaScript:

```sh
npx playwright install chromium
npm run test:browser
```

On macOS, tests use an installed Google Chrome when available. In CI, Playwright installs Chromium.

## Personalize

- `src/config.ts`: name, description, and GitHub links.
- `src/pages/index.astro`: introduction and featured experiment.
- `src/styles/global.css`: colors, typography, and layout.
- `public/favicon.svg`: the small grid icon.

The Q-learning article and demo are explicitly marked as an introductory example, not a claim about original research. Keep them, edit them, or replace them with your first experiment.

## Publish a post

Copy `templates/post.mdx` into `src/content/writing/my-post.mdx`. Set the title, description, date, and tags. Set `draft: false` when it is ready. A post's filename becomes its URL, for example `/writing/my-post/`.

Plain `.md` files work too. Use `.mdx` when embedding a component. Draft posts are excluded from the homepage, writing index, routes, RSS, and sitemap.

## Add an experiment

Put a standalone browser demo in `public/demos/my-experiment/`, including its `index.html`, scripts, WebAssembly, model files, and other assets. Use relative URLs inside the demo for its assets. Supply a small poster image in `public/images/`.

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

The bundled example uses plain JavaScript and trains with a fixed seed after opening. A Python environment or PyTorch checkpoint must be ported/exported before it can run in the browser. C/Rust WebAssembly demos can use the same wrapper. Start with a single-threaded build; pthreads/SharedArrayBuffer need appropriate hosting headers.

After changing the example's maze or policy, regenerate its preview:

```sh
node scripts/generate-demo-poster.mjs
```

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
