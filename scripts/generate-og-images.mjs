// Renders the social preview cards every share of this site depends on:
//   node scripts/generate-og-images.mjs
// Writes public/og/default.png plus one card per published post, all committed.
// Uses the Playwright browser that is already a dev dependency, so no extra
// toolchain. Cards are drawn with the same system font stacks as the site, so
// regenerate them from one machine to keep the typography consistent.
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { chromium } from '@playwright/test';

const WIDTH = 1200, HEIGHT = 630;
const CONTENT = new URL('../src/content/writing/', import.meta.url);
const OUT = new URL('../public/og/', import.meta.url);
const macChrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

/** Minimal front-matter reader: these files only use scalars and a flat list. */
function frontMatter(source) {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return {};
  const data = {};
  for (const line of match[1].split(/\r?\n/)) {
    const pair = line.match(/^(\w+):\s*(.*)$/);
    if (!pair) continue;
    const raw = pair[2].trim();
    data[pair[1]] = raw.startsWith('[')
      ? raw.slice(1, -1).split(',').map((item) => item.trim()).filter(Boolean)
      : raw.replace(/^["']|["']$/g, '');
  }
  return data;
}

const escape = (value) => String(value).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

function card({ eyebrow, title, description, footer, tags = [] }) {
  // A dotted trail in the corner echoes the maze preview without crowding the text.
  const trail = Array.from({ length: 23 }, (_, i) => {
    const x = 737 + i * 16;
    const y = 446 + Math.sin(i / 3.1) * 23;
    return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3.5" fill="#d9b674" opacity="${(0.08 + i * 0.026).toFixed(3)}"/>`;
  }).join('');
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    *{box-sizing:border-box;margin:0}
    :root{
      --mono:"SFMono-Regular",Consolas,"Liberation Mono",Menlo,monospace;
      --sans:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;
      --paper:#141310;--ink:#ece9e1;--copy:#c3beb2;--muted:#948f84;--accent:#d9b674;--line:#2b2821;
    }
    body{width:${WIDTH}px;height:${HEIGHT}px;background:var(--paper);color:var(--ink);
      font-family:var(--mono);overflow:hidden;position:relative}
    .grid{position:absolute;inset:0;opacity:.5;
      background-image:radial-gradient(circle,#2b2821 1.4px,transparent 1.4px);background-size:34px 34px}
    .trail{position:absolute;inset:0}
    .bar{position:absolute;inset:0 0 auto;height:6px;background:var(--accent)}
    .frame{position:relative;height:100%;padding:84px 84px 70px;display:flex;flex-direction:column}
    .mark{font-size:24px;font-weight:600;letter-spacing:-.01em;color:var(--ink)}
    .mark span{color:var(--accent)}
    .eyebrow{margin-top:52px;font-size:17px;letter-spacing:.2em;color:var(--muted)}
    h1{margin-top:20px;font-family:var(--mono);font-size:60px;line-height:1.12;letter-spacing:-.045em;
      font-weight:650;max-width:880px;text-wrap:balance;hyphens:none;overflow-wrap:normal;word-break:keep-all;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
    p{margin-top:26px;font-family:var(--sans);font-size:25px;line-height:1.45;color:var(--copy);
      max-width:760px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
    footer{margin-top:auto;padding-top:28px;border-top:1px solid var(--line);
      display:flex;justify-content:space-between;align-items:baseline;font-size:19px;color:var(--muted)}
    .tags{color:var(--accent)}
  </style></head><body>
    <div class="grid"></div>
    <svg class="trail" viewBox="0 0 ${WIDTH} ${HEIGHT}">${trail}</svg>
    <div class="bar"></div>
    <div class="frame">
      <div class="mark"><span>~/</span> mmbajo</div>
      <div class="eyebrow">${escape(eyebrow)}</div>
      <h1>${escape(title)}</h1>
      <p>${escape(description)}</p>
      <footer><span>${escape(footer)}</span><span class="tags">${tags.map((t) => `#${escape(t)}`).join('  ')}</span></footer>
    </div>
  </body></html>`;
}

const files = (await readdir(CONTENT)).filter((name) => /\.mdx?$/.test(name));
const posts = [];
for (const name of files) {
  const data = frontMatter(await readFile(new URL(name, CONTENT), 'utf8'));
  if (data.draft === 'true') continue;
  posts.push({ slug: name.replace(/\.mdx?$/, ''), ...data });
}

const cards = [
  { file: 'default', eyebrow: 'RESEARCH ENGINEER / RL', title: 'Mark Bajo', footer: 'MMBAJO.GITHUB.IO',
    description: 'Notes and playable experiments in reinforcement learning.', tags: ['reinforcement-learning', 'agents'] },
  ...posts.map((post) => ({ file: post.slug, eyebrow: 'NOTE', title: post.title,
    description: post.description, tags: post.tags, footer: 'MARK BAJO · MMBAJO.GITHUB.IO' })),
];

await mkdir(OUT, { recursive: true });
const browser = await chromium.launch(
  process.platform === 'darwin' && existsSync(macChrome) ? { executablePath: macChrome } : {},
);
const page = await browser.newPage({ viewport: { width: WIDTH, height: HEIGHT }, deviceScaleFactor: 1 });
for (const entry of cards) {
  await page.setContent(card(entry), { waitUntil: 'load' });
  await writeFile(new URL(`${entry.file}.png`, OUT), await page.screenshot({ type: 'png' }));
  console.log(`og/${entry.file}.png  ${entry.title}`);
}
await browser.close();
