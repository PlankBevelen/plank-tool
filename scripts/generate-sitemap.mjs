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

const defaultBaseUrl = 'https://tool.plankbevelen.cn';
const baseUrl = (rawSiteUrl || defaultBaseUrl).replace(/\/+$/, '');

const lastmod = new Date().toISOString().slice(0, 10);

const parseCsv = (value) =>
  String(value || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

const readRoutesFromRouter = async () => {
  const routerFile = path.join(projectRoot, 'src', 'router', 'index.tsx');
  const content = await fs.readFile(routerFile, 'utf8');

  const routeSet = new Set();

  if (/\bindex\s*:\s*true\b/.test(content)) {
    routeSet.add('/');
  }

  const pathRegex = /\bpath\s*:\s*['"]([^'"]+)['"]/g;
  for (const match of content.matchAll(pathRegex)) {
    const p = String(match[1] || '').trim();
    if (!p) continue;
    if (!p.startsWith('/')) continue;
    if (p.includes(':')) continue;
    routeSet.add(p);
  }

  return [...routeSet].sort();
};

const routesOverride = parseCsv(process.env.SITEMAP_ROUTES);
const routesFromRouter = routesOverride.length ? routesOverride : await readRoutesFromRouter();

const excluded = new Set(
  parseCsv(process.env.SITEMAP_EXCLUDE || '/login,/register,/settings')
);

const routes = routesFromRouter.filter((r) => !excluded.has(r));

const urlEntries = routes
  .map((route) => {
    const loc = route === '/' ? `${baseUrl}/` : `${baseUrl}${route}`;
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
