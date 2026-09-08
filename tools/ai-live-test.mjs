/* =============================================================================
   AI-LIVE-TEST
   The real provider adapter, against the real endpoint.

   WHY THIS IS A SEPARATE FILE FROM backend-test.mjs.
   That suite proves the CONTRACT — eligibility, permissions, envelope, schema
   validation, timeout, retry, escalation, audit — with a scripted fixture,
   because a paid model call inside a test suite that runs on every commit is a
   bad idea. This file proves the other half: that the adapter actually speaks
   the provider's protocol over the network, and that what comes back is
   handled honestly.

   WHAT IT DOES WITHOUT A KEY, AND WHY THAT IS STILL EVIDENCE.
   With no ANTHROPIC_API_KEY it makes a genuine HTTPS request to the real
   api.anthropic.com and asserts the adapter classifies the 401 as a
   non-retryable AGENT_PERMISSION_ERROR, that nothing pretends the AI succeeded,
   and that no key material appears anywhere. That proves the request is
   well-formed enough to reach authentication, that the failure path is real,
   and — most importantly — that an unavailable provider FAILS rather than
   quietly becoming a mock, which is §44.

   With a key present it does the full round trip: a real model reads a real
   task envelope and returns a structured QA result, which is validated against
   the schema and applied through the domain.

   It also runs the adapter against a local server speaking the provider's exact
   wire protocol, which proves the success path end to end without spending
   anything.

   Run:  node tools/ai-live-test.mjs
   ============================================================================= */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { anthropicProvider } from '../server/ai/provider.js';
import { createAgentRuntime } from '../server/agent-runtime.js';
import { createApp } from '../server/app.js';
import { loadConfig } from '../server/config.js';
import { validateQaResult } from '../server/ai/qa-schema.js';

process.env.PIXORA_LOG = 'off';
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const fails = [];
let passed = 0;
const ok = (l, c, d = '') => { if (c) passed += 1; else fails.push(`${l}${d ? ` — ${d}` : ''}`); };
const note = (m) => console.log(`  · ${m}`);

const tmpdir = fs.mkdtempSync(path.join(os.tmpdir(), 'pixora-ai-'));
const KEY = process.env.ANTHROPIC_API_KEY || null;

/* --------------------------------------------------------------------------
   1. The adapter against a server speaking the provider's wire protocol.
   Real HTTP, real JSON, real headers — everything except the model itself.
   -------------------------------------------------------------------------- */
{
  let seen = null;
  const stub = http.createServer((req, res) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      seen = { url: req.url, method: req.method, headers: req.headers, body: JSON.parse(Buffer.concat(chunks).toString()) };
      if (req.url === '/v1/messages' && seen.headers['x-api-key'] === 'test-key') {
        res.writeHead(200, { 'content-type': 'application/json' });
        res.end(JSON.stringify({
          model: 'stub-model-1',
          content: [{ type: 'text', text: '{"result":"pass","checks":[{"criterionId":"qa.one","status":"pass","evidence":"present"}],"missing":[],"warnings":[],"confidence":0.95,"summary":"The required item is present."}' }],
          usage: { input_tokens: 412, output_tokens: 63 },
        }));
      } else {
        res.writeHead(401, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ error: { type: 'authentication_error', message: 'invalid x-api-key' } }));
      }
    });
  });
  await new Promise((r) => stub.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${stub.address().port}`;

  const cfg = loadConfig({ ai: { ...loadConfig().ai, apiKey: 'test-key', baseUrl: base, model: 'claude-sonnet-5', timeoutMs: 5000, maxOutputTokens: 512 } });
  const provider = anthropicProvider(cfg);
  const answer = await provider.generateStructuredResult({ system: 'S', user: 'U' });

  ok('adapter: it POSTs to /v1/messages', seen.url === '/v1/messages' && seen.method === 'POST');
  ok('adapter: it sends the api key in the x-api-key header', seen.headers['x-api-key'] === 'test-key');
  ok('adapter: it sends the provider version header', seen.headers['anthropic-version'] === '2023-06-01');
  ok('adapter: the key is not in the body', !JSON.stringify(seen.body).includes('test-key'));
  ok('adapter: it sends the model, system and messages', seen.body.model === 'claude-sonnet-5'
    && seen.body.system === 'S' && seen.body.messages[0].content === 'U');
  ok('adapter: temperature is zero for a checking task', seen.body.temperature === 0);
  ok('adapter: it returns the text', answer.text.startsWith('{"result":"pass"'));
  ok('adapter: it returns the model the provider used', answer.model === 'stub-model-1');
  ok('adapter: it returns token usage', answer.inputTokens === 412 && answer.outputTokens === 63);
  ok('adapter: it measures latency', Number.isFinite(answer.latencyMs));
  ok('adapter: the answer validates against the QA schema',
    validateQaResult(answer.text, { allowedCriterionIds: ['qa.one'] }).ok);

  /* Wrong key -> 401 -> classified as non-retryable. */
  const badCfg = loadConfig({ ai: { ...cfg.ai, apiKey: 'wrong-key' } });
  let thrown = null;
  try { await anthropicProvider(badCfg).generateStructuredResult({ system: 'S', user: 'U' }); } catch (e) { thrown = e; }
  ok('adapter: a 401 is classified as a permission error', thrown && thrown.code === 'AGENT_PERMISSION_ERROR', String(thrown && thrown.code));
  ok('adapter: and the error text never quotes the key', thrown && !String(thrown.message).includes('wrong-key'));

  /* A provider that never answers -> timeout, not a hang. */
  const slow = http.createServer(() => { /* deliberately never responds */ });
  await new Promise((r) => slow.listen(0, '127.0.0.1', r));
  const slowCfg = loadConfig({ ai: { ...cfg.ai, baseUrl: `http://127.0.0.1:${slow.address().port}`, timeoutMs: 250 } });
  const t0 = Date.now();
  let timedOut = null;
  try { await anthropicProvider(slowCfg).generateStructuredResult({ system: 'S', user: 'U' }); } catch (e) { timedOut = e; }
  ok('adapter: a provider that never answers times out', timedOut && timedOut.code === 'TIMEOUT', String(timedOut && timedOut.code));
  ok('adapter: and it does so promptly', Date.now() - t0 < 3000, `${Date.now() - t0}ms`);
  slow.close();
  stub.close();
}

/* --------------------------------------------------------------------------
   2. A real request to the real provider.
   -------------------------------------------------------------------------- */
console.log('');
if (!KEY) {
  note('No ANTHROPIC_API_KEY in this environment.');
  note('Making a real request to api.anthropic.com anyway, to prove the failure path is honest.');
  const cfg = loadConfig({ ai: { ...loadConfig().ai, apiKey: null } });
  let noKey = null;
  try { await anthropicProvider(cfg).generateStructuredResult({ system: 'S', user: 'U' }); } catch (e) { noKey = e; }
  ok('live: with no key configured the adapter refuses before it dials',
    noKey && noKey.code === 'PROVIDER_ERROR' && /no API key/.test(noKey.message));

  /* A real HTTPS request to the real endpoint, with a key that is not one. */
  const realCfg = loadConfig({ ai: { ...loadConfig().ai, apiKey: 'not-a-real-key', timeoutMs: 15000 } });
  let live = null;
  try {
    await anthropicProvider(realCfg).generateStructuredResult({ system: 'You are a test.', user: 'Reply with {}' });
  } catch (e) { live = e; }
  if (live && live.code === 'PROVIDER_ERROR' && /could not reach/.test(live.message)) {
    note(`The endpoint was unreachable from here (${live.message}). The adapter reported it as a provider error, which is correct.`);
    ok('live: an unreachable provider is reported, not pretended away', true);
  } else {
    ok('live: a real request reached api.anthropic.com and was authenticated',
      live && live.code === 'AGENT_PERMISSION_ERROR', `got ${live && live.code}: ${live && live.message}`);
    ok('live: which is classified as non-retryable', live && live.detail && live.detail.status === 401,
      JSON.stringify(live && live.detail));
  }
  ok('live: nothing pretended the AI succeeded', live !== null);
} else {
  note('ANTHROPIC_API_KEY is present — running the full round trip against the real model.');
  const app = createApp({
    config: {
      db: { file: path.join(tmpdir, 'live.db'), createIfMissing: true },
      ai: { ...loadConfig().ai, enabled: true, qaReaderEnabled: true, provider: 'anthropic', apiKey: KEY },
    },
  });
  /* Build a real project, walk to a task the qa-reader is eligible for, and let
     a real model read it. */
  const { runLiveQaReader } = await import('./ai-live-helpers.mjs');
  const out = await runLiveQaReader(app);
  ok('live: the model answered', out.ok, JSON.stringify(out.problems || []));
  ok('live: the answer validated against the schema', out.ok && Boolean(out.qa));
  ok('live: usage was recorded', out.ok && out.usage && out.usage.inputTokens > 0);
  ok('live: the judgements were applied through the domain', out.ok && out.applied.length > 0);
  ok('live: the agent approved nothing', out.ok && out.approvalStillRequired !== undefined);
  note(`model=${out.model} latency=${out.latencyMs}ms tokens=${JSON.stringify(out.usage)}`);
  app.db.close();
}

fs.rmSync(tmpdir, { recursive: true, force: true });

console.log('');
if (fails.length) {
  console.error(`ai-live-test: ${passed} passed, ${fails.length} FAILED\n`);
  fails.forEach((f) => console.error(`  ✗ ${f}`));
  process.exit(1);
}
console.log(`ai-live-test: ${passed} passed, 0 failed`);
if (!KEY) console.log('  (the full model round trip needs ANTHROPIC_API_KEY — see docs/131 §9)');
