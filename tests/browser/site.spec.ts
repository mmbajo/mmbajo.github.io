import { test, expect } from '@playwright/test';

test('demo assets only load on demand; agent playback, controls, and teardown work', async ({ page }) => {
  const demoRequests: string[] = [];
  const errors: string[] = [];
  page.on('request', (request) => { if (request.url().includes('/demos/')) demoRequests.push(request.url()); });
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Learning by trying things.' })).toBeVisible();
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
  await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Writing', exact: true }).click();
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
  await page.goto('http://127.0.0.1:4321/writing/a-tiny-world-for-q-learning/');
  await expect(page.getByRole('heading', { name: 'What the agent learns' })).toBeVisible();
  await expect(page.getByText('Enable JavaScript to run this experiment.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Run demo' })).toHaveCount(0);
  await context.close();
});
