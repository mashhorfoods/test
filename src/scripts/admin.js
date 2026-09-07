/**
 * ADMIN — the dashboard's behaviour.
 *
 * WHAT THIS IS. A form that writes JSON to git. Everything downstream already
 * exists: a data-only push is classified, built, checked and committed back by
 * `.github/workflows/check.yml`, exactly as it is when the same file is edited
 * in GitHub's own web editor. This page adds one thing that road does not
 * have — VALIDATION BEFORE THE COMMIT (`docs/120` §0).
 *
 * WHAT IT IS NOT. A server. There is none. The only network calls are to
 * api.github.com, authorised by a token the operator pastes and which never
 * leaves their browser.
 *
 * THE RULES LIVE ELSEWHERE, on purpose: `admin-validate.js` is imported by
 * this file and by `tools/admin-test.mjs`, so what the button enforces and
 * what the tests prove cannot drift apart.
 */

import { FILES, SERIALISE, validate } from './admin-validate.js';

const REPO = 'mashhorfoods/test';
const BRANCH = 'claude/webstart-project-audit-l7est2';
const API = 'https://api.github.com';
const KEY = 'pixora:admin:token';

const $ = (sel, root = document) => root.querySelector(sel);
const el = (tag, cls, text) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text !== undefined) n.textContent = text;
  return n;
};

/* --- state ---------------------------------------------------------------- */

const state = {
  token: null,
  user: null,
  /** path -> { sha, data, original } */
  files: {},
  active: null,
  /* THE RESULT LIVES IN STATE, NOT IN THE DOM.

     It did not, at first: showResult() prepended a box to #app, and the very
     next thing to run was rerender(), which begins with replaceChildren() —
     so the confirmation was created and destroyed inside one tick. The commit
     had worked; the page just never said so. Caught by the browser test
     asking for the text it had been told would be there. */
  result: null,
};

/* --- the credential -------------------------------------------------------
   sessionStorage by default: gone when the tab closes. localStorage only on
   an explicit tick, and the page says in a sentence what that means. Both are
   read on load and both are cleared by Forget, because a token remembered in
   one and forgotten from the other is the worst of both. */

function readToken() {
  try { return sessionStorage.getItem(KEY) || localStorage.getItem(KEY) || null; }
  catch { return null; }
}
function writeToken(token, remember) {
  try {
    sessionStorage.setItem(KEY, token);
    if (remember) localStorage.setItem(KEY, token);
    else localStorage.removeItem(KEY);
  } catch { /* private mode — the token simply does not persist */ }
}
function forgetToken() {
  try { sessionStorage.removeItem(KEY); localStorage.removeItem(KEY); } catch { /* nothing to do */ }
  state.token = null;
  state.user = null;
  state.files = {};
}

/* --- the API -------------------------------------------------------------- */

async function api(pathname, options = {}) {
  const res = await fetch(`${API}${pathname}`, {
    ...options,
    headers: {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      Authorization: `Bearer ${state.token}`,
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    let detail = '';
    try { detail = (await res.json()).message || ''; } catch { /* no body */ }
    const err = new Error(detail || `${res.status} ${res.statusText}`);
    err.status = res.status;
    throw err;
  }
  return res.status === 204 ? null : res.json();
}

/* GitHub returns base64 with newlines; and the content is UTF-8, so atob
   alone mangles Arabic. TextDecoder is the part people forget. */
const fromBase64 = (b64) => new TextDecoder().decode(
  Uint8Array.from(atob(b64.replace(/\n/g, '')), (c) => c.charCodeAt(0)),
);
const toBase64 = (text) => {
  const bytes = new TextEncoder().encode(text);
  let bin = '';
  bytes.forEach((b) => { bin += String.fromCharCode(b); });
  return btoa(bin);
};

/* --- signing in ----------------------------------------------------------- */

async function signIn(token, remember) {
  state.token = token;
  const user = await api('/user');
  /* Verifying the account is not enough — a token can be valid and have no
     access to THIS repository, which is the failure the operator would
     otherwise meet on their first save. */
  await api(`/repos/${REPO}`);
  state.user = user;
  writeToken(token, remember);
  return user;
}

/* --- reading and writing -------------------------------------------------- */

async function loadFile(path) {
  const res = await api(`/repos/${REPO}/contents/${path}?ref=${encodeURIComponent(BRANCH)}`);
  const text = fromBase64(res.content);
  const data = JSON.parse(text);
  state.files[path] = { sha: res.sha, data, original: text };
  return state.files[path];
}

async function commitFile(path, message) {
  const f = state.files[path];
  const text = SERIALISE(f.data);
  if (text === f.original) return { unchanged: true };
  const res = await api(`/repos/${REPO}/contents/${path}`, {
    method: 'PUT',
    body: JSON.stringify({
      message, content: toBase64(text), sha: f.sha, branch: BRANCH,
    }),
  });
  f.sha = res.content.sha;
  f.original = text;
  return res;
}

/* --- rendering ------------------------------------------------------------ */

/* Any edit clears the last confirmation. A "Saved" box sitting above a form
   the operator has since changed is a lie by staleness. */
function field(label, value, help, onInput, { error = null } = {}) {
  const wrap = el('label', 'a-field');
  wrap.append(el('span', 'a-field__label', label));
  const input = el('input', `a-field__input${error ? ' is-invalid' : ''}`);
  input.type = 'text';
  input.value = value ?? '';
  input.addEventListener('input', () => { state.result = null; onInput(input.value); });
  wrap.append(input);
  /* THE MESSAGE GOES UNDER ITS OWN FIELD.

     It used to live only in the action bar, as a bulleted list. On an
     iPhone SE that bar is pinned to the bottom of the screen, and a
     three-line message made it tall enough to COVER THE FIELD IT WAS ABOUT —
     the instruction to fix the price sat on top of the price. Visible in a
     screenshot and invisible in the measurements, which reported a healthy
     1.4-screen page.

     At the field, the message is next to the thing it describes and the bar
     shrinks to one line. */
  if (error) wrap.append(el('span', 'a-field__error', error));
  else if (help) wrap.append(el('span', 'a-field__help', help));
  return wrap;
}

/* CATEGORIES COLLAPSE, AND THE REASON IS A PHONE.

   Rendering all four categories open puts 12 cards and 61 inputs on one
   page. Measured on an iPhone SE that is 10.5 screens, and the Save button
   sits at the bottom of all of it — so changing one price meant scrolling
   past every other price to commit it. Fine on a desktop, unusable on the
   device this was built to be used from.

   Native <details>, the same mechanism the site's FAQ uses: it works with no
   JavaScript, it is a real disclosure to a screen reader, and the browser
   handles the keyboard. All four start closed — an operator opening this
   knows which package they came for, and a closed page opens in one screen. */
function renderPricing(root, f) {
  const problems = validate('src/data/pricing.json', f.data);
  const at = (p) => problems.find((x) => x.path === p)?.message || null;

  f.data.categories.forEach((c, ci) => {
    const sec = el('details', 'a-group');
    /* A category holding an invalid value opens itself, so a problem named in
       the bar below is never hidden behind a summary the operator must guess
       at. */
    const hasProblem = problems.some((x) => x.path.startsWith(`categories[${ci}]`));
    sec.open = hasProblem;
    const sum = el('summary', 'a-group__title');
    sum.append(el('span', null, `${c.label} · ${c.labelAr}`));
    sum.append(el('span', 'a-group__count', `${c.packages.length}${hasProblem ? ' · needs attention' : ''}`));
    sec.append(sum);
    c.packages.forEach((k, pi) => {
      const card = el('div', 'a-card');
      card.append(el('h4', 'a-card__title', k.name));
      const p = `categories[${ci}].packages[${pi}]`;
      card.append(field('Price (digits only)', k.price,
        'No currency symbol, no comma. The site adds "From" and "USD".',
        (v) => { k.price = v; rerender(); }, { error: at(`${p}.price`) }));
      card.append(field('Delivery — English', k.facts?.delivery?.en, null,
        (v) => { k.facts.delivery.en = v; rerender(); }, { error: at(`${p}.facts.delivery.en`) }));
      card.append(field('Delivery — Arabic', k.facts?.delivery?.ar, null,
        (v) => { k.facts.delivery.ar = v; rerender(); }, { error: at(`${p}.facts.delivery.ar`) }));
      card.append(field('Revisions — English', k.facts?.revisions?.en, null,
        (v) => { k.facts.revisions.en = v; rerender(); }, { error: at(`${p}.facts.revisions.en`) }));
      card.append(field('Revisions — Arabic', k.facts?.revisions?.ar, null,
        (v) => { k.facts.revisions.ar = v; rerender(); }, { error: at(`${p}.facts.revisions.ar`) }));
      sec.append(card);
    });
    root.append(sec);
  });
}

function renderI18n(root, f) {
  const problems = validate('src/data/i18n-ar.json', f.data);
  const keys = Object.keys(f.data).filter((k) => !k.startsWith('_'));
  const search = el('input', 'a-search');
  search.type = 'search';
  search.placeholder = `Filter ${keys.length} strings…`;
  const list = el('div', 'a-list');
  const draw = () => {
    list.replaceChildren();
    const q = search.value.trim().toLowerCase();
    keys.filter((k) => !q || k.toLowerCase().includes(q) || String(f.data[k]).toLowerCase().includes(q))
      .slice(0, 60)
      .forEach((k) => {
        list.append(field(k, f.data[k], null, (v) => { f.data[k] = v; rerender(); },
          { error: problems.find((x) => x.path === k)?.message || null }));
      });
  };
  search.addEventListener('input', draw);
  root.append(search, list);
  draw();
}

/* --- the shell ------------------------------------------------------------ */

function rerender() {
  const app = $('#app');
  app.replaceChildren();

  if (!state.token || !state.user) { renderSignIn(app); return; }

  if (state.result) app.append(resultBox(state.result));
  app.append(renderBar());

  const tabs = el('nav', 'a-tabs');
  FILES.forEach((f) => {
    const b = el('button', `a-tab${state.active === f.path ? ' is-active' : ''}`, f.label.en);
    b.type = 'button';
    b.addEventListener('click', async () => {
      state.active = f.path;
      if (!state.files[f.path]) { await withStatus(`Loading ${f.path}…`, () => loadFile(f.path)); }
      rerender();
    });
    tabs.append(b);
  });
  app.append(tabs);

  if (!state.active) {
    app.append(el('p', 'a-note', 'Choose what to edit. Nothing is loaded until you do.'));
    return;
  }

  const f = state.files[state.active];
  if (!f) { app.append(el('p', 'a-note', 'Loading…')); return; }

  const body = el('div', 'a-body');
  if (state.active === 'src/data/pricing.json') renderPricing(body, f);
  else renderI18n(body, f);
  app.append(body);

  app.append(renderCommit(f));
}

function renderBar() {
  const bar = el('div', 'a-bar');
  bar.append(el('span', 'a-bar__who', `Signed in as ${state.user.login}`));
  const forget = el('button', 'a-btn a-btn--ghost', 'Forget token');
  forget.type = 'button';
  forget.addEventListener('click', () => { forgetToken(); rerender(); });
  bar.append(forget);
  return bar;
}

/* THE COMMIT BUTTON IS THE POINT OF THE WHOLE PAGE. It is disabled while
   anything is invalid, and the reasons are listed above it by name. This is
   the thing GitHub's web editor cannot do: there, the same mistake is a red
   CI run ten minutes later. */
/* THE ACTION BAR IS STICKY, for the same reason the categories collapse.

   It carried the validity state, the message field and the Save button at the
   very bottom of the page — 6,956px down on an iPhone SE. A control you have
   to hunt for is a control that gets used wrong. It now stays on screen, so
   the answer to "can I save this yet" is always visible while editing. */
function renderCommit(f) {
  const problems = validate(state.active, f.data);
  const changed = SERIALISE(f.data) !== f.original;

  /* NOTHING TO SAVE MEANS NO BAR AT ALL.

     The first version always rendered the status line, the message field and
     the button. Pinned to the bottom of an iPhone SE that is ~200px of a
     667px screen — 30% of the display, permanently, saying "No changes yet"
     and offering a disabled button. Looking at a screenshot showed one
     category visible where four fit.

     So the bar earns its space by having something to say. Until an edit is
     made there is nothing to commit and nothing to warn about, and the
     screen belongs to the thing being edited. */
  if (!changed && !problems.length) return el('div', 'a-commit a-commit--idle');

  const wrap = el('div', 'a-commit');

  if (problems.length) {
    /* One line. The detail is at each field, where it belongs — see the note
       in field() above. A bar that lists problems is a bar that covers them. */
    wrap.append(el('p', 'a-problems__title',
      `${problems.length} thing${problems.length === 1 ? '' : 's'} to fix before this can be saved — see the fields marked in red`));
  } else {
    wrap.append(el('p', 'a-note a-note--ok', 'Valid. Saving commits to the repository; the site rebuilds itself.'));
  }

  const msg = el('input', 'a-field__input');
  msg.type = 'text';
  msg.placeholder = 'What changed, in a few words';
  msg.value = `Update ${state.active.split('/').pop()} from the dashboard`;

  const save = el('button', 'a-btn a-btn--primary', 'Save and commit');
  save.type = 'button';
  save.disabled = problems.length > 0 || !changed;
  save.addEventListener('click', async () => {
    await withStatus('Committing…', async () => {
      const res = await commitFile(state.active, msg.value.trim() || 'Update from the dashboard');
      if (res.unchanged) { setStatus('Nothing to commit.'); return; }
      state.result = res;
    });
  });

  wrap.append(msg, save);
  return wrap;
}

/* --- P7: what happens next ------------------------------------------------ */

function resultBox(res) {
  const box = el('div', 'a-result');
  box.append(el('h3', null, 'Saved.'));
  const sha = res.commit?.sha || '';
  const link = el('a', 'a-link', `Commit ${sha.slice(0, 7)}`);
  link.href = res.commit?.html_url || `https://github.com/${REPO}`;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  box.append(link);
  box.append(el('p', 'a-note',
    'The build now runs automatically: it rebuilds the site from this file, '
    + 'runs the five checks, and commits the result back. Give it about four '
    + 'minutes, then reload the live site.'));
  const checks = el('a', 'a-link', 'Watch the checks');
  checks.href = `https://github.com/${REPO}/actions`;
  checks.target = '_blank';
  checks.rel = 'noopener noreferrer';
  box.append(checks);
  return box;
}

/* --- status + sign-in ----------------------------------------------------- */

function setStatus(text, kind = '') {
  const s = $('#status');
  s.textContent = text || '';
  s.className = `a-status ${kind}`;
}
async function withStatus(text, fn) {
  setStatus(text);
  try { const r = await fn(); setStatus(''); rerender(); return r; }
  catch (e) { setStatus(e.message || String(e), 'is-error'); return null; }
}

function renderSignIn(app) {
  const form = el('form', 'a-signin');
  form.append(el('h2', null, 'Sign in'));
  form.append(el('p', 'a-note',
    'Paste a GitHub fine-grained personal access token with access to this '
    + 'repository only, and Contents set to Read and write. Give it an expiry.'));

  const input = el('input', 'a-field__input');
  input.type = 'password';
  input.placeholder = 'github_pat_…';
  input.autocomplete = 'off';
  input.required = true;
  form.append(input);

  const rememberWrap = el('label', 'a-check');
  const remember = el('input');
  remember.type = 'checkbox';
  rememberWrap.append(remember, el('span', null,
    'Remember on this device. Without this the token is forgotten when you close the tab.'));
  form.append(rememberWrap);

  const go = el('button', 'a-btn a-btn--primary', 'Sign in');
  go.type = 'submit';
  form.append(go);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const token = input.value.trim();
    if (!token) return;
    setStatus('Checking the token…');
    try {
      await signIn(token, remember.checked);
      setStatus('');
      rerender();
    } catch (err) {
      state.token = null;
      setStatus(err.status === 401
        ? 'That token was not accepted. Check it was copied whole and has not expired.'
        : err.status === 404
          ? 'The token is valid but cannot see this repository. Check its Repository access.'
          : err.message, 'is-error');
    }
  });

  app.append(form);
}

/* --- boot ----------------------------------------------------------------- */

(async function boot() {
  const saved = readToken();
  if (saved) {
    state.token = saved;
    try { state.user = await api('/user'); }
    catch { forgetToken(); }
  }
  rerender();
}());
