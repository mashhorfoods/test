/**
 * AI PROVIDER — the only place in this repository that knows a model vendor
 * exists.
 *
 * The domain knows "an agent executed". It does not know, and must not learn,
 * that a particular company answered an HTTPS request. Everything vendor-shaped
 * — the URL, the header names, the message envelope, the token accounting —
 * lives behind `generateStructuredResult()`, and swapping vendors is writing a
 * second file that exports the same function.
 *
 * THE KEY NEVER LEAVES THIS PROCESS. It is read from the environment at
 * construction, used in a header, and never logged, never returned, never put
 * in an audit line or an error message. `redact()` in config.js reports only
 * whether one is configured.
 */

import { fail } from '../errors.js';

/** What every provider must return, whatever it is underneath. */
const shape = ({ text, model, inputTokens = null, outputTokens = null, latencyMs, raw = null }) => ({
  text, model, inputTokens, outputTokens, latencyMs, raw,
});

/**
 * Anthropic Messages API. A real HTTPS call — no SDK, no dependency.
 *
 * `system` carries the contract and the instruction; the task content goes in a
 * user message, wrapped and labelled as data. That separation is the prompt
 * injection defence: content that says "ignore previous instructions" arrives
 * as something to inspect, not as something to obey (see agent-runtime.js).
 */
export function anthropicProvider(config) {
  return {
    name: 'anthropic',
    model: config.ai.model,
    configured: Boolean(config.ai.apiKey),

    async generateStructuredResult({ system, user, maxTokens = config.ai.maxOutputTokens, timeoutMs = config.ai.timeoutMs }) {
      if (!config.ai.apiKey) {
        /* NOT A SILENT FALLBACK. §44: an unavailable provider fails; it does
           not quietly become a mock. */
        throw fail('PROVIDER_ERROR', 'no API key is configured for the AI provider — the execution cannot run');
      }

      const started = Date.now();
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      let response;
      try {
        response = await fetch(`${config.ai.baseUrl}/v1/messages`, {
          method: 'POST',
          signal: controller.signal,
          headers: {
            'content-type': 'application/json',
            'x-api-key': config.ai.apiKey,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: config.ai.model,
            max_tokens: maxTokens,
            temperature: 0,
            system,
            messages: [{ role: 'user', content: user }],
          }),
        });
      } catch (e) {
        clearTimeout(timer);
        if (e.name === 'AbortError') throw fail('TIMEOUT', `the model did not answer within ${timeoutMs}ms`);
        throw fail('PROVIDER_ERROR', `could not reach the AI provider: ${e.message}`);
      }
      clearTimeout(timer);

      const latencyMs = Date.now() - started;
      const bodyText = await response.text();

      if (!response.ok) {
        /* Classified, because a 429 is worth retrying and a 401 is not. The
           body may quote the key back; it is never included. */
        const code = response.status === 429 ? 'RATE_LIMITED'
          : (response.status === 401 || response.status === 403 ? 'AGENT_PERMISSION_ERROR' : 'PROVIDER_ERROR');
        throw fail(code, `the AI provider refused the request (HTTP ${response.status})`, { status: response.status });
      }

      let parsed;
      try { parsed = JSON.parse(bodyText); } catch {
        throw fail('PROVIDER_ERROR', 'the AI provider returned something that is not JSON');
      }
      const text = (parsed.content || []).filter((c) => c.type === 'text').map((c) => c.text).join('\n').trim();
      if (!text) throw fail('INVALID_AGENT_OUTPUT', 'the model returned no text');

      return shape({
        text,
        model: parsed.model || config.ai.model,
        inputTokens: parsed.usage ? parsed.usage.input_tokens : null,
        outputTokens: parsed.usage ? parsed.usage.output_tokens : null,
        latencyMs,
      });
    },
  };
}

/**
 * A provider that answers from a fixture. FOR TESTS ONLY.
 *
 * Selected only when `PIXORA_AI_PROVIDER=fixture`, which is refused in
 * production. It exists so the whole contract — envelope, schema validation,
 * timeout, retry, escalation, audit — can be exercised without a paid call, and
 * it is never a substitute for one.
 */
export function fixtureProvider(config, script = []) {
  let n = 0;
  return {
    name: 'fixture',
    model: 'fixture-model',
    configured: true,
    isFixture: true,
    async generateStructuredResult() {
      const step = script[Math.min(n, script.length - 1)] || {};
      n += 1;
      if (step.throw) throw step.throw;
      if (step.delayMs) await new Promise((r) => { setTimeout(r, step.delayMs); });
      return shape({ text: step.text ?? '{}', model: 'fixture-model', inputTokens: 100, outputTokens: 50, latencyMs: step.delayMs || 1 });
    },
  };
}

export function createProvider(config, options = {}) {
  if (options.provider) return options.provider;
  if (config.ai.provider === 'fixture') {
    if (config.production) throw new Error('config: the fixture AI provider may not be used in production');
    return fixtureProvider(config, options.script || []);
  }
  return anthropicProvider(config);
}
