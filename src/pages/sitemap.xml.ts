import { getPosts } from '../lib/posts';
import type { APIContext } from 'astro';

export async function GET({ site }: APIContext) {
  const posts = await getPosts();
  const paths = ['/', '/blog/', '/experiments/', ...posts.map((p) => `/blog/${p.id}/`)];
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${paths.map((path) => `<url><loc>${new URL(path, site).href}</loc></url>`).join('')}</urlset>`, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
}
