import { test, expect } from '@playwright/test';

test('demo assets only load on demand; agent playback, controls, and teardown work', async ({ page }) => {
  const demoRequests: string[] = [];
  const errors: string[] = [];
  page.on('request', (request) => { if (request.url().includes('/demos/')) demoRequests.push(request.url()); });
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Mark Bajo', exact: true })).toBeVisible();
  expect(demoRequests).toHaveLength(0);
  await expect(page.locator('iframe')).toHaveCount(0);
  await page.getByRole('button', { name: 'Run demo' }).click();
  const demo = page.frameLocator('iframe');
  await expect(demo.locator('#episodes')).toHaveText('800');
  await demo.getByRole('button', { name: 'Watch agent' }).click();
  await expect(demo.getByRole('status', { name: 'Experiment status' })).toContainText('Goal reached', { timeout: 15000 });
  await demo.getByRole('button', { name: 'Take control' }).click();
  await demo.locator('#world').press('ArrowDown');
  await expect(demo.locator('#steps')).toHaveText('1');
  await demo.getByRole('button', { name: 'Move down' }).click();
  await expect(demo.locator('#steps')).toHaveText('2');
  await demo.getByRole('button', { name: 'Reset', exact: true }).click();
  await expect(demo.locator('#steps')).toHaveText('0');
  await demo.getByRole('combobox', { name: 'Policy checkpoint' }).selectOption('50');
  await expect(demo.locator('#episodes')).toHaveText('50');
  const frame = page.frames().find((frame) => frame.url().includes('/demos/gridworld/'))!;
  await expect.poll(() => frame.evaluate(() => document.documentElement.scrollHeight <= window.innerHeight)).toBeTruthy();
  await page.getByRole('button', { name: 'Close demo' }).click();
  await expect(page.locator('iframe')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Run demo' })).toBeFocused();
  expect(errors).toEqual([]);
});

test('navigation, article, feeds, and not-found page are present', async ({ page, request }) => {
  await page.goto('/');
  await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Blog', exact: true }).click();
  await page.getByRole('link', { name: /A tiny world for Q-learning/ }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('A tiny world for Q-learning');
  await expect(page.getByRole('navigation', { name: 'In this article' })).toBeVisible();
  await expect(page.locator('iframe')).toHaveCount(0);
  for (const route of ['/experiments/', '/rss.xml', '/sitemap.xml', '/robots.txt', '/demos/gridworld/', '/404.html']) {
    const response = await request.get(route);
    expect(response.ok(), route).toBeTruthy();
  }
});

test('mobile page and running demo fit the viewport with usable touch controls', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
  await page.getByRole('button', { name: 'Run demo' }).click();
  const demo = page.frameLocator('iframe');
  await demo.getByRole('button', { name: 'Take control' }).click();
  await demo.getByRole('button', { name: 'Move down' }).click();
  await expect(demo.locator('#steps')).toHaveText('1');
  const frame = page.frames().find((frame) => frame.url().includes('/demos/gridworld/'))!;
  expect(await frame.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
  await expect.poll(() => frame.evaluate(() => document.documentElement.scrollHeight <= window.innerHeight)).toBeTruthy();
});

test('writing remains readable with JavaScript disabled', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4321/blog/a-tiny-world-for-q-learning/');
  await expect(page.getByRole('heading', { name: 'What the agent learns' })).toBeVisible();
  await expect(page.getByText('Enable JavaScript to run this experiment.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Run demo' })).toHaveCount(0);
  await context.close();
});

test('demo controls wait for the simulation code on a slow connection', async ({ page }) => {
  let release: () => void = () => {};
  const loaded = new Promise<void>((resolve) => { release = resolve; });
  await page.route('**/demos/gridworld/model.js', async (route) => {
    await loaded;
    await route.continue();
  });
  await page.goto('/demos/gridworld/', { waitUntil: 'commit' });
  const watch = page.getByRole('button', { name: 'Watch agent' });
  await expect(watch).toBeDisabled();
  await expect(page.getByRole('status', { name: 'Experiment status' })).toHaveText('Loading the experiment…');
  release();
  await watch.click();
  await expect(page.getByRole('status', { name: 'Experiment status' })).toContainText('Goal reached', { timeout: 15000 });
});

test('theme follows the system until chosen, then persists across reloads and pages', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.emulateMedia({ colorScheme: 'light' });
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  const toggle = page.getByRole('button', { name: 'Switch to dark mode' });
  await toggle.focus();
  await toggle.press('Enter');
  await expect(page.getByRole('button', { name: 'Switch to light mode' })).toBeFocused();
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.goto('/blog/a-tiny-world-for-q-learning/');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.locator('pre.astro-code')).toHaveCSS('background-color', 'rgb(36, 41, 46)');
  await page.getByRole('button', { name: 'Switch to light mode' }).click();
  await page.emulateMedia({ colorScheme: 'dark' });
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
});

test('theme updates the open canvas without losing progress, including with storage blocked', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('Storage blocked', 'SecurityError'); } });
  });
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/');
  await page.getByRole('button', { name: 'Switch to dark mode' }).click();
  await page.getByRole('button', { name: 'Run demo' }).click();
  const demo = page.frameLocator('iframe');
  await expect(demo.locator('html')).toHaveAttribute('data-theme', 'dark');
  await demo.getByRole('button', { name: 'Take control' }).click();
  await demo.getByRole('button', { name: 'Move down' }).click();
  await expect(demo.locator('#steps')).toHaveText('1');
  const canvas = demo.locator('canvas');
  const darkImage = await canvas.evaluate((node) => (node as HTMLCanvasElement).toDataURL());
  await page.getByRole('button', { name: 'Switch to light mode' }).click();
  await expect(demo.locator('html')).toHaveAttribute('data-theme', 'light');
  await expect(demo.locator('#steps')).toHaveText('1');
  expect(await canvas.evaluate((node) => (node as HTMLCanvasElement).toDataURL())).not.toBe(darkImage);
  expect(errors).toEqual([]);
});

test('theme toggle fits narrow mobile screens', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/');
  await page.getByRole('button', { name: 'Switch to dark mode' }).click();
  await expect(page.getByRole('button', { name: 'Switch to light mode' })).toBeInViewport();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
});

test('article contents track section jumps and the cat reaches both ends of the progress bar', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/blog/a-tiny-world-for-q-learning/');
  const progress = page.getByRole('progressbar', { name: 'Article reading progress' });
  const toc = page.getByRole('navigation', { name: 'In this article' });
  await expect(progress).toHaveAttribute('aria-valuenow', '0');
  const link = toc.getByRole('link', { name: 'What the agent learns' });
  await link.click();
  await expect(link).toHaveAttribute('aria-current', 'location');
  await expect(page).toHaveURL(/#what-the-agent-learns$/);
  await expect.poll(() => progress.getAttribute('aria-valuenow')).not.toBe('0');
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await expect(progress).toHaveAttribute('aria-valuenow', '100');
  await expect(toc.locator('a').last()).toHaveAttribute('aria-current', 'location');
  await expect(progress.locator('.progress-cat')).toBeInViewport();
  await expect(progress).toHaveAttribute('data-direction', 'right');
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(progress).toHaveAttribute('aria-valuenow', '0');
  await expect(progress).toHaveAttribute('data-direction', 'left');
  await expect(progress).not.toHaveClass(/is-walking/);
});

test('mobile contents collapse after navigation and reduced motion stops cat animation', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/blog/a-tiny-world-for-q-learning/');
  const toggle = page.getByRole('button', { name: 'Contents' });
  const toc = page.getByRole('navigation', { name: 'In this article' });
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await toggle.click();
  await expect(toc).toBeVisible();
  await toc.getByRole('link', { name: 'What the agent learns' }).click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(page.locator('#what-the-agent-learns')).toBeInViewport();
  await expect(page.locator('.cat-pose')).toHaveCSS('animation-name', 'none');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
});

test('previous writing URLs lead to the blog and the homepage uses the GitHub avatar', async ({ page }) => {
  await page.goto('/writing/a-tiny-world-for-q-learning/');
  await expect(page).toHaveURL('/blog/a-tiny-world-for-q-learning/');
  await page.goto('/writing/');
  await expect(page).toHaveURL('/blog/');
  await expect(page.getByRole('heading', { name: 'Blog', exact: true })).toBeVisible();
  await page.goto('/');
  const avatar = page.getByRole('img', { name: 'Mark Bajo’s GitHub avatar' });
  await expect(avatar).toBeVisible();
  expect(await avatar.evaluate((node) => (node as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
});
