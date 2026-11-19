// node scripts/offline.mjs — run 33 (item 6): serves docs/ on localhost, visits once, waits for the service worker to cache the page, blocks the
// network, reloads and checks the full page loads (__READY) with 0 console errors. Prints OFFLINE OK or the failures.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
const skill = path.join(os.homedir(), '.claude/skills/cutaway');
const {chromium} = createRequire(path.join(skill, 'x.js'))('playwright');
const {CHROMIUM_ARGS} = await import(pathToFileURL(path.join(skill, 'paths.mjs')).href);
const types = {'.html': 'text/html', '.js': 'text/javascript', '.png': 'image/png'};
const srv = http.createServer((q, r) => {
  const f = path.join('docs', new URL(q.url, 'http://x').pathname.replace(/\/$/, '/index.html'));
  fs.readFile(f, (e, b) => (e ? (r.writeHead(404), r.end()) : (r.writeHead(200, {'content-type': types[path.extname(f)] || 'application/octet-stream'}), r.end(b))));
}).listen(0);
const base = `http://localhost:${srv.address().port}/`;
const browser = await chromium.launch({args: CHROMIUM_ARGS});
const ctx = await browser.newContext({viewport: {width: 800, height: 500}});
const page = await ctx.newPage();
const errs = [];
page.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
page.on('pageerror', (e) => errs.push(e.message));
await page.goto(base);
await page.waitForFunction(() => window.__READY, null, {timeout: 60000});
const names = await page.evaluate(() => navigator.serviceWorker.ready.then(() => caches.keys()));
const cached = await page.evaluate(async () => { const c = await caches.open((await caches.keys())[0]); return (await c.keys()).map((r) => new URL(r.url).pathname.split('/').pop() + new URL(r.url).search); });
console.log('caches', names, 'entries', cached);
await ctx.setOffline(true);
errs.length = 0;
await page.reload();
const ready = await page.waitForFunction(() => window.__READY, null, {timeout: 60000}).then(() => true, () => false);
await page.waitForTimeout(1000);
const offline = await page.evaluate(() => !navigator.onLine);
console.log('offline', offline, 'ready', ready, 'errors', errs);
console.log(ready && offline && !errs.length && cached.length >= 4 ? 'OFFLINE OK' : 'OFFLINE FAIL');
await browser.close();
srv.close();
