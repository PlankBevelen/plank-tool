import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const publicDir = path.join(projectRoot, 'public');

const rawSiteUrl = String(
  process.env.SITE_URL ||
    process.env.VITE_SITE_URL ||
    process.env.PUBLIC_URL ||
    ''
).trim();

const baseUrl = 'http://tool.plankbevelen.cn';

const routes = ['/', '/text', '/image', '/json', '/jwt', '/codec', '/login', '/register'];
const lastmod = new Date().toISOString().slice(0, 10);

const urlEntries = routes
  .map((route) => {
    const loc = `${baseUrl}${route}`;
    return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n  </url>`;
  })
  .join('\n');

const sitemapXml =
  `<?xml version="1.0" encoding="UTF-8"?>\n` +
  `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  `${urlEntries}\n` +
  `</urlset>\n`;

const robotsTxt = `User-agent: *\nAllow: /\nSitemap: ${baseUrl}/sitemap.xml\n`;

await fs.mkdir(publicDir, { recursive: true });
await fs.writeFile(path.join(publicDir, 'sitemap.xml'), sitemapXml, 'utf8');
await fs.writeFile(path.join(publicDir, 'robots.txt'), robotsTxt, 'utf8');

process.stdout.write(`Generated public/sitemap.xml and public/robots.txt (base: ${baseUrl})\n`);
