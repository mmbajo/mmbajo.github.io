import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';

export default defineConfig({
  site: 'https://mmbajo.github.io',
  output: 'static',
  trailingSlash: 'always',
  redirects: {
    '/writing/': '/blog/',
    '/writing/[...id]': '/blog/[...id]',
  },
  integrations: [mdx()],
  markdown: { shikiConfig: { themes: { light: 'github-light', dark: 'github-dark' } } },
});
