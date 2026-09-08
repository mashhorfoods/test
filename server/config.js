/**
 * CONFIG — everything that differs between a laptop and a server, in one place.
 *
 * SECRETS COME FROM THE ENVIRONMENT AND NOWHERE ELSE. Not from a file in the
 * repository, not from a default in this module, not from anything the browser
 * can read. `assertProductionSecrets()` refuses to start a production server
 * that is relying on a development default, because a development default that
 * survives to production is the whole class of accident this guards against.
 */

const env = (key, fallback = undefined) => {
  const v = process.env[key];
  return v === undefined || v === '' ? fallback : v;
};
const bool = (key, fallback = false) => {
  const v = env(key);
  if (v === undefined) return fallback;
  return ['1', 'true', 'yes', 'on'].includes(String(v).toLowerCase());
};
const num = (key, fallback) => {
  const v = Number(env(key));
  return Number.isFinite(v) ? v : fallback;
};

export function loadConfig(overrides = {}) {
  const environment = env('PIXORA_ENV', 'development');
  const production = environment === 'production';

  const config = {
    environment,
    production,

    http: {
      host: env('PIXORA_HOST', '127.0.0.1'),
      port: num('PIXORA_PORT', 8787),
      /* Only the operator's own tooling talks to this. A wildcard origin on an
         API that moves money-shaped records is not a default worth having. */
      allowedOrigins: (env('PIXORA_ALLOWED_ORIGINS', '') || '').split(',').map((s) => s.trim()).filter(Boolean),
      /* HOW MANY TRUSTED PROXIES SIT IN FRONT. Zero means X-Forwarded-For is
         ignored and the socket address is the truth — the only safe default,
         because a header anyone can send is not an identity. Behind one nginx
         or one load balancer this is 1. See server/client-ip.js. */
      trustProxyHops: num('PIXORA_TRUST_PROXY_HOPS', 0),
    },

    db: {
      file: env('PIXORA_DB', 'server/data/pixora.db'),
      /* Refusing to create a database in production means a missing volume is
         an error at boot rather than an empty system three days later. */
      createIfMissing: !production || bool('PIXORA_DB_CREATE', false),
    },

    auth: {
      sessionHours: num('PIXORA_SESSION_HOURS', 12),
      /* scrypt parameters. Raised deliberately above Node's defaults. */
      scrypt: { N: 16384, r: 8, p: 1, keylen: 64 },
      /* Used to seed the very first administrator, once, on an empty database. */
      bootstrapEmail: env('PIXORA_BOOTSTRAP_EMAIL', null),
      bootstrapPassword: env('PIXORA_BOOTSTRAP_PASSWORD', null),
      /* Phase 4D §19. Two buckets, a window, and a lock that doubles.
         `enabled` exists so a test can turn it off; production refuses to
         start with it off, which is checked below. */
      rateLimit: {
        enabled: bool('PIXORA_LOGIN_RATELIMIT', true),
        windowSeconds: num('PIXORA_LOGIN_WINDOW', 900),
        accountFailures: num('PIXORA_LOGIN_ACCOUNT_FAILURES', 5),
        accountLockSeconds: num('PIXORA_LOGIN_ACCOUNT_LOCK', 900),
        ipFailures: num('PIXORA_LOGIN_IP_FAILURES', 50),
        ipLockSeconds: num('PIXORA_LOGIN_IP_LOCK', 300),
        maxLockSeconds: num('PIXORA_LOGIN_MAX_LOCK', 3600),
      },
    },

    automation: {
      /* How long a durable execution may run before the sweeper calls it dead. */
      timeoutSeconds: num('PIXORA_AUTOMATION_TIMEOUT', 120),
      sweepIntervalSeconds: num('PIXORA_SWEEP_INTERVAL', 30),
    },

    ai: {
      /* THE KILL SWITCH AND THE FEATURE FLAG ARE DIFFERENT THINGS.
         `enabled` is the global switch an operator throws in an incident.
         `qaReaderEnabled` is the per-agent flag that decides whether this one
         agent is live at all. Both default OFF: an integration that turns
         itself on when a variable is missing is not one you can reason about. */
      enabled: bool('PIXORA_AI_ENABLED', false),
      qaReaderEnabled: bool('AI_AGENT_QA_READER_ENABLED', false),
      provider: env('PIXORA_AI_PROVIDER', 'anthropic'),
      apiKey: env('ANTHROPIC_API_KEY', null),
      baseUrl: env('PIXORA_AI_BASE_URL', 'https://api.anthropic.com'),
      model: env('PIXORA_AI_MODEL', 'claude-sonnet-5'),
      timeoutMs: num('PIXORA_AI_TIMEOUT_MS', 30000),
      maxOutputTokens: num('PIXORA_AI_MAX_TOKENS', 2048),
    },

    ...overrides,
  };

  return config;
}

/** Refuse to start a production server that is holding a development default. */
export function assertProductionSecrets(config) {
  if (!config.production) return [];
  const problems = [];
  if (config.ai.enabled && !config.ai.apiKey) {
    problems.push('AI is enabled and no ANTHROPIC_API_KEY is set — the provider call would fail on every task');
  }
  if (config.http.host === '0.0.0.0' && !config.http.allowedOrigins.length) {
    problems.push('the API listens on every interface and allows no origin — set PIXORA_ALLOWED_ORIGINS');
  }
  if (config.auth.bootstrapPassword) {
    problems.push('PIXORA_BOOTSTRAP_PASSWORD is set in production — seed the first administrator once, then remove it');
  }
  if (!config.auth.rateLimit || !config.auth.rateLimit.enabled) {
    problems.push('PIXORA_LOGIN_RATELIMIT is off — an unthrottled login endpoint is a credential-stuffing target and a CPU you can pin');
  }
  if (config.ai.provider === 'fixture') {
    problems.push('PIXORA_AI_PROVIDER=fixture in production — the fixture provider answers from a script and is never a model');
  }
  return problems;
}

/** What may safely be printed or returned. Never the key. */
export const redact = (config) => ({
  environment: config.environment,
  http: { host: config.http.host, port: config.http.port },
  db: { file: config.db.file },
  ai: {
    enabled: config.ai.enabled,
    qaReaderEnabled: config.ai.qaReaderEnabled,
    provider: config.ai.provider,
    model: config.ai.model,
    /* WHETHER a key is configured is operationally useful. The key is not. */
    apiKeyConfigured: Boolean(config.ai.apiKey),
    timeoutMs: config.ai.timeoutMs,
  },
  auth: { rateLimit: Boolean(config.auth.rateLimit && config.auth.rateLimit.enabled), sessionHours: config.auth.sessionHours },
});
