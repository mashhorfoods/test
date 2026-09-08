/**
 * INDEX — the HTTP server.
 *
 * Node's own `http`, no framework. The route table in routes.js is a list of
 * [method, path, guard, handler]; this matches, authenticates, and translates
 * exceptions into the classified responses errors.js defines. It is small on
 * purpose: an HTTP layer is where business rules go to hide, and one you can
 * read in a sitting is one where you would notice.
 */

import http from 'node:http';
import { createApp } from './app.js';
import { createRoutes } from './routes.js';
import { ApiError, toResponse, fail } from './errors.js';

const MAX_BODY = 1024 * 1024; // an order payload is kilobytes; a megabyte is generous

export function createServer(overrides = {}) {
  const app = createApp(overrides);
  const routes = createRoutes(app).map(([method, path, guard, handler]) => ({
    method, guard, handler,
    segments: path.split('/').filter(Boolean),
    path,
  }));

  const match = (method, pathname) => {
    const parts = pathname.split('/').filter(Boolean);
    for (const r of routes) {
      if (r.method !== method || r.segments.length !== parts.length) continue;
      const params = {};
      let hit = true;
      for (const [i, seg] of r.segments.entries()) {
        if (seg.startsWith(':')) params[seg.slice(1)] = decodeURIComponent(parts[i]);
        else if (seg !== parts[i]) { hit = false; break; }
      }
      if (hit) return { route: r, params };
    }
    return null;
  };

  const server = http.createServer(async (req, res) => {
    const started = Date.now();
    const url = new URL(req.url, 'http://localhost');
    const send = (status, body, extra = {}) => {
      const text = JSON.stringify(body);
      res.writeHead(status, {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'no-store',
        /* An API that returns other people's orders should not be framed,
           sniffed or referred elsewhere. */
        'x-content-type-options': 'nosniff',
        'x-frame-options': 'DENY',
        'referrer-policy': 'no-referrer',
        ...extra,
      });
      res.end(text);
      if (process.env.PIXORA_LOG !== 'off') {
        console.log(`${req.method} ${url.pathname} -> ${status} ${Date.now() - started}ms`);
      }
    };

    try {
      const origin = req.headers.origin;
      if (origin && app.config.http.allowedOrigins.length && !app.config.http.allowedOrigins.includes(origin)) {
        throw fail('AUTHORIZATION_ERROR', 'that origin is not allowed');
      }

      const found = match(req.method, url.pathname);
      if (!found) throw fail('NOT_FOUND', `no route for ${req.method} ${url.pathname}`);

      let body = {};
      if (req.method !== 'GET') {
        const chunks = [];
        let size = 0;
        for await (const chunk of req) {
          size += chunk.length;
          if (size > MAX_BODY) throw fail('VALIDATION_ERROR', 'that request body is too large');
          chunks.push(chunk);
        }
        const raw = Buffer.concat(chunks).toString('utf8').trim();
        if (raw) {
          try { body = JSON.parse(raw); } catch { throw fail('VALIDATION_ERROR', 'the request body is not JSON'); }
        }
        if (body === null || typeof body !== 'object' || Array.isArray(body)) {
          throw fail('VALIDATION_ERROR', 'the request body must be a JSON object');
        }
      }

      const ctx = {
        params: found.params,
        query: Object.fromEntries(url.searchParams),
        body,
        headers: req.headers,
        token: null,
        user: null,
      };

      if (found.route.guard === 'auth') {
        const header = req.headers.authorization || '';
        ctx.token = header.startsWith('Bearer ') ? header.slice(7) : null;
        ctx.user = app.auth.authenticate(ctx.token);
      }

      const out = await found.route.handler(ctx);
      send(out.status, out.body);
    } catch (e) {
      if (!(e instanceof ApiError) && process.env.PIXORA_LOG !== 'off') {
        /* The stack is logged here and never sent. */
        console.error('unhandled:', e && e.stack ? e.stack : e);
      }
      const { status, body } = toResponse(e, { production: app.config.production });
      send(status, body);
    }
  });

  return { app, server, routes: routes.map((r) => `${r.method} ${r.path}`) };
}

/** `node server/index.js` starts it. */
if (process.argv[1] && process.argv[1].endsWith('server/index.js')) {
  const { app, server } = createServer();
  const stopSweeper = app.automation.startSweeper();
  server.listen(app.config.http.port, app.config.http.host, () => {
    console.log(`pixora api on http://${app.config.http.host}:${app.config.http.port}`);
    console.log(JSON.stringify(app.info(), null, 2));
  });
  const shutdown = () => { stopSweeper(); server.close(() => process.exit(0)); };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}
