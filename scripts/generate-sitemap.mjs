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

function normalizeBaseUrl(value) {
  const trimmed = String(value || '').trim();
  if (!trimmed) return defaultBaseUrl;

  const withProtocol = /^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  try {
    return new URL(withProtocol).origin;
  } catch {
    return defaultBaseUrl;
  }
}

function normalizeRoute(route) {
  if (route === '/') return '/';
  return String(route).replace(/\/+$/, '');
}

function parseEnvList(value) {
  return String(value || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

const baseUrl = normalizeBaseUrl(rawSiteUrl);

const routerFilePath = path.join(projectRoot, 'src', 'router', 'index.tsx');

const fallbackRoutes = ['/', '/text', '/image', '/json', '/jwt', '/codec'];

const excludeRoutes = new Set(
  (parseEnvList(process.env.SITEMAP_EXCLUDE) || []).length
    ? parseEnvList(process.env.SITEMAP_EXCLUDE)
    : ['/login', '/register', '/settings']
);

let routes = fallbackRoutes;

try {
  const routerSource = await fs.readFile(routerFilePath, 'utf8');
  const routeSet = new Set();

  if (/index:\s*true/.test(routerSource)) routeSet.add('/');

  for (const match of routerSource.matchAll(/path:\s*['"]([^'"]+)['"]/g)) {
    const route = match[1];
    if (!route || !route.startsWith('/')) continue;
    if (route.includes(':')) continue;
    routeSet.add(route);
  }

  routes = Array.from(routeSet)
    .map(normalizeRoute)
    .filter((route) => route === '/' || route.startsWith('/'))
    .filter((route) => !excludeRoutes.has(route))
    .sort((a, b) => {
      if (a === '/' && b !== '/') return -1;
      if (b === '/' && a !== '/') return 1;
      return a.localeCompare(b);
    });
} catch {
  routes = fallbackRoutes.filter((route) => !excludeRoutes.has(route));
}

const lastmod = new Date().toISOString().slice(0, 10);

const urlEntries = routes
  .map((route) => {
    const loc = `${baseUrl}${route === '/' ? '/' : route}`;
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
