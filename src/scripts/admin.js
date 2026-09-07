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
/* THE BRANCH IS ASKED FOR, NOT ASSUMED.

   It was a constant, and the constant was a session working branch. That was
   right when it was written and wrong the moment PR #1 merged and `main`
   became the default: every save would have landed on a branch nothing
   deploys from, so the operator would have changed a price, watched a green
   commit appear, and seen the site not change — with nothing anywhere saying
   why. A dashboard that silently writes to the wrong place is worse than no
   dashboard.

   `signIn()` already calls `GET /repos/{repo}` to prove the token can see
   this repository, and that response carries `default_branch`. So the right
   value is free, it is always current, and it cannot go stale again. The
   fallback is only for a response that somehow omits it. */
const FALLBACK_BRANCH = 'main';
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
  /** Which pricing categories the operator has open, kept across a rerender. */
  openGroups: new Set(),
  /** Resolved from the repository at sign-in — see FALLBACK_BRANCH above. */
  branch: FALLBACK_BRANCH,
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
     otherwise meet on their first save. The same response names the branch
     everything downstream deploys from. */
  const repo = await api(`/repos/${REPO}`);
  state.branch = repo.default_branch || FALLBACK_BRANCH;
  state.user = user;
  writeToken(token, remember);
  return user;
}

/* --- reading and writing -------------------------------------------------- */

async function loadFile(path) {
  const res = await api(`/repos/${REPO}/contents/${path}?ref=${encodeURIComponent(state.branch)}`);
  const text = fromBase64(res.content);
  const data = JSON.parse(text);
  state.files[path] = { sha: res.sha, data, original: text };
  return state.files[path];
}

/* SOMEONE ELSE MAY HAVE SAVED SINCE THIS PAGE LOADED.

   The Contents API refuses a PUT whose `sha` is not the file's current one,
   and the message it returns for that is machine-shaped — "does not match".
   Two people have write access to this repository, and one of them is a
   dashboard that keeps a file in memory for as long as the tab is open, so
   this is a matter of when rather than whether.

   Two cases, and they are not the same:
     · the file is byte-identical to what was loaded and only its sha moved
       (a commit that touched it and changed nothing). Nothing is in conflict:
       take the new sha and save.
     · the content genuinely differs. Saving would erase whatever the other
       person wrote, so it stops and says so in words, naming the recovery.
       The operator's edits are still on screen; nothing is thrown away
       without them choosing it. */
async function commitFile(path, message) {
  const f = state.files[path];
  const text = SERIALISE(f.data);
  if (text === f.original) return { unchanged: true };

  const put = () => api(`/repos/${REPO}/contents/${path}`, {
    method: 'PUT',
    body: JSON.stringify({
      message, content: toBase64(text), sha: f.sha, branch: state.branch,
    }),
  });

  let res;
  try {
    res = await put();
  } catch (e) {
    if (e.status !== 409 && e.status !== 422) throw e;
    const current = await api(`/repos/${REPO}/contents/${path}?ref=${encodeURIComponent(state.branch)}`);
    const serverText = fromBase64(current.content);
    if (serverText !== f.original) {
      const err = new Error(
        'This file was changed on the repository after you opened it, so saving '
        + 'now would overwrite that change. Your edits are still on this page. '
        + 'Copy anything you need, reload, and make them again on the current version.',
      );
      err.status = e.status;
      throw err;
    }
    f.sha = current.sha;
    res = await put();
  }

  f.sha = res.content.sha;
  f.original = text;
  return res;
}

/* --- rendering ------------------------------------------------------------ */

/* THE PAGE DOES NOT REBUILD ITSELF WHILE SOMEBODY IS TYPING IN IT.

   It did, and that made the dashboard unusable for the one job it has. Every
   `input` event called rerender(), which begins with replaceChildren(): the
   input being typed into was destroyed and replaced a character in, focus
   fell back to <body>, the open category collapsed, and every keystroke after
   the first went nowhere. Typing "1234" into a price left "1".

   The acceptance tests all passed, because every one of them used Playwright's
   `fill()` — which sets `value` and fires a single input event. That is not
   typing, and it is why nine phases of tests could not see it. `docs/121` §5b
   said emulation is not a phone; this is the same lesson one level down: a
   synthetic event is not a person.

   So an edit now updates only what an edit can change — the field's own
   message, its category's summary, and the action bar — and never the inputs.
   rerender() still exists for structural changes: signing in, switching file,
   and the moment after a commit. */
function field(label, value, help, onInput, { error = null, path = null } = {}) {
  const wrap = el('label', 'a-field');
  if (path) wrap.dataset.path = path;
  wrap.append(el('span', 'a-field__label', label));
  const input = el('input', `a-field__input${error ? ' is-invalid' : ''}`);
  input.type = 'text';
  input.value = value ?? '';
  input.addEventListener('input', () => { state.result = null; onInput(input.value); revalidate(); });
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
  const note = el('span', error ? 'a-field__error' : 'a-field__help', error || help || '');
  note.hidden = !(error || help);
  note.dataset.help = help || '';
  wrap.append(note);
  return wrap;
}

/* Update one already-rendered field in place. The <input> is not touched:
   it is very likely the element the operator's cursor is in. */
function refreshField(wrap, error) {
  const input = wrap.querySelector('.a-field__input');
  const note = wrap.querySelector('.a-field__error, .a-field__help');
  if (input) input.classList.toggle('is-invalid', !!error);
  if (!note) return;
  const was = note.classList.contains('a-field__error');
  const help = note.dataset.help || '';
  note.className = error ? 'a-field__error' : 'a-field__help';
  note.textContent = error || help;
  note.hidden = !(error || help);
  /* Reported rather than acted on: the bar has not been re-rendered yet at
     this point, so measuring against it here measures the OLD bar. That is
     exactly how the first attempt failed — the idle bar is display:none, so
     the message always looked clear of it and the page never scrolled. */
  return !!error && !was;
}

/* THE STICKY BAR IS STILL BETWEEN THE OPERATOR AND THE MESSAGE.

   docs/121 §5b moved the validity message out of the action bar and down to
   its own field, because a three-line bar pinned to the bottom of an iPhone
   SE was sitting on top of the price it was describing. That was right, and
   it was not the whole fix: on a 667px screen the field being typed into is
   often the LAST thing above the bar, so the message that appears underneath
   it appears underneath the bar.

   Seen in a screenshot, again, with every number healthy — 3.6 screens, no
   overflow, the bar at 27% of the viewport, and the one sentence the
   operator needs invisible.

   So a message that has just appeared scrolls itself clear of the bar, and
   only when it is actually obscured: scrolling the page while somebody types
   is its own defect, so this does nothing at all when the message can
   already be read. */
/* Publish the bar height so the page can end above it rather than under it.
   Zero when the bar is idle and renders nothing, so a page with nothing to
   save pays no whitespace for a control that is not there. */
function syncBarSpace() {
  const bar = document.querySelector('#app .a-commit:not(.a-commit--idle)');
  const h = bar ? Math.ceil(bar.getBoundingClientRect().height) : 0;
  document.documentElement.style.setProperty('--a-bar-h', `${h}px`);
}

function revealBelowBar(note) {
  const bar = document.querySelector('#app .a-commit');
  const floor = window.innerHeight - (bar ? bar.getBoundingClientRect().height : 0);
  const r = note.getBoundingClientRect();
  if (r.bottom <= floor && r.top >= 0) return;
  /* A JavaScript smooth scroll ignores the CSS media query that governs
     every other animation on this project, so the preference is asked for
     here rather than assumed. */
  const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  window.scrollBy({ top: r.bottom - floor + 16, behavior: still ? 'auto' : 'smooth' });
}

/* Everything an edit is allowed to change, and nothing else. */
function revalidate() {
  const f = state.files[state.active];
  if (!f) return;
  const problems = validate(state.active, f.data);
  const at = (p) => problems.find((x) => x.path === p)?.message || null;

  let appeared = null;
  document.querySelectorAll('#app [data-path]').forEach((wrap) => {
    if (refreshField(wrap, at(wrap.dataset.path)) && !appeared) {
      appeared = wrap.querySelector('.a-field__error');
    }
  });

  /* A category that has just become invalid opens itself and says so — and a
     category the operator opened is never closed underneath them, which is
     why this only ever sets `open` to true. */
  document.querySelectorAll('#app [data-group]').forEach((sec) => {
    const prefix = `categories[${sec.dataset.group}]`;
    const has = problems.some((x) => x.path.startsWith(prefix));
    const count = sec.querySelector('.a-group__count');
    if (count) count.textContent = `${count.dataset.n}${has ? ' · needs attention' : ''}`;
    if (has) sec.open = true;
  });

  /* A "Saved." box above a form that has since been edited is a lie by
     staleness, and state.result was already cleared by the input handler. */
  const stale = document.querySelector('#app .a-result');
  if (stale && !state.result) stale.remove();

  const bar = document.querySelector('#app .a-commit');
  if (bar) bar.replaceWith(renderCommit(f));
  syncBarSpace();
  if (appeared) revealBelowBar(appeared);
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
    sec.dataset.group = String(ci);
    /* A category holding an invalid value opens itself, so a problem named in
       the bar below is never hidden behind a summary the operator must guess
       at. And one the operator had open stays open across a save — collapsing
       everything after each commit threw away their place on the very screen
       they were working on. */
    const hasProblem = problems.some((x) => x.path.startsWith(`categories[${ci}]`));
    sec.open = hasProblem || state.openGroups.has(ci);
    sec.addEventListener('toggle', () => {
      if (sec.open) state.openGroups.add(ci); else state.openGroups.delete(ci);
    });
    const sum = el('summary', 'a-group__title');
    sum.append(el('span', null, `${c.label} · ${c.labelAr}`));
    const count = el('span', 'a-group__count', `${c.packages.length}${hasProblem ? ' · needs attention' : ''}`);
    count.dataset.n = String(c.packages.length);
    sum.append(count);
    sec.append(sum);
    c.packages.forEach((k, pi) => {
      const card = el('div', 'a-card');
      card.append(el('h4', 'a-card__title', k.name));
      const p = `categories[${ci}].packages[${pi}]`;
      card.append(field('Price (digits only)', k.price,
        'No currency symbol, no comma. The site adds "From" and "USD".',
        (v) => { k.price = v; }, { error: at(`${p}.price`), path: `${p}.price` }));
      card.append(field('Delivery — English', k.facts?.delivery?.en, null,
        (v) => { k.facts.delivery.en = v; }, { error: at(`${p}.facts.delivery.en`), path: `${p}.facts.delivery.en` }));
      card.append(field('Delivery — Arabic', k.facts?.delivery?.ar, null,
        (v) => { k.facts.delivery.ar = v; }, { error: at(`${p}.facts.delivery.ar`), path: `${p}.facts.delivery.ar` }));
      card.append(field('Revisions — English', k.facts?.revisions?.en, null,
        (v) => { k.facts.revisions.en = v; }, { error: at(`${p}.facts.revisions.en`), path: `${p}.facts.revisions.en` }));
      card.append(field('Revisions — Arabic', k.facts?.revisions?.ar, null,
        (v) => { k.facts.revisions.ar = v; }, { error: at(`${p}.facts.revisions.ar`), path: `${p}.facts.revisions.ar` }));
      sec.append(card);
    });
    root.append(sec);
  });
}

function renderI18n(root, f) {
  const keys = Object.keys(f.data).filter((k) => !k.startsWith('_'));
  const search = el('input', 'a-search');
  search.type = 'search';
  search.placeholder = `Filter ${keys.length} strings…`;
  const list = el('div', 'a-list');
  const draw = () => {
    /* Recomputed on every draw, not captured once at render: the list is
       redrawn whenever the filter changes, and by then the operator may have
       fixed or broken something. A stale problem list would mark a field red
       that is now fine. */
    const problems = validate('src/data/i18n-ar.json', f.data);
    list.replaceChildren();
    const q = search.value.trim().toLowerCase();
    keys.filter((k) => !q || k.toLowerCase().includes(q) || String(f.data[k]).toLowerCase().includes(q))
      .slice(0, 60)
      .forEach((k) => {
        list.append(field(k, f.data[k], null, (v) => { f.data[k] = v; },
          { error: problems.find((x) => x.path === k)?.message || null, path: k }));
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
  syncBarSpace();
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
