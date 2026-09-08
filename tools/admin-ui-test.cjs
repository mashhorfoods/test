/* =============================================================================
   ADMIN-UI-TEST — the dashboard's acceptance test, P2 through P7.

   Every phase in `docs/120` §3 has an acceptance test and this file is five of
   them. The GitHub API is STUBBED — `page.addInitScript` replaces `fetch`
   before any module runs — so the whole flow can be exercised without a real
   token and without touching the repository:

     P2  the shell renders with no token and explains itself
     P3  a bad token is refused with a message that says what to do; a good one
         signs in AND its access to this repository is verified separately
     P4  the file is read and rendered as populated fields
     P5  an invalid value disables Save and names the problem; fixing it
         re-enables — this is the whole reason the dashboard exists
     P6  the PUT carries the edited value, the file's sha, and the exact
         serialisation the round-trip test guarantees
     P7  the confirmation survives the re-render that follows the commit

   P7 is in this list because it failed here first: showResult() prepended a
   box to #app and rerender() called replaceChildren() a tick later, so the
   confirmation was created and destroyed inside one frame. The commit had
   worked and the page never said so.

   Run: node tools/admin-ui-test.mjs   ·   npm run admin:ui
   ============================================================================= */

const {chromium}=require('playwright-core');
const http=require('http'),fs=require('fs'),path=require('path');
const ROOT=process.cwd();
const MIME={'.html':'text/html','.css':'text/css','.js':'text/javascript','.json':'application/json','.svg':'image/svg+xml','.webp':'image/webp','.woff2':'font/woff2'};
const srv=http.createServer((q,s)=>{let u=q.url.split('?')[0];if(u==='/')u='/admin.html';
 const f=path.join(ROOT,decodeURIComponent(u));
 if(!f.startsWith(ROOT)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){console.log('   [server 404]',u);s.writeHead(404);return s.end('404');}
 s.writeHead(200,{'content-type':MIME[path.extname(f)]||'application/octet-stream'});fs.createReadStream(f).pipe(s);});

let fails=0;
const ok=(n)=>console.log(`  ✓ ${n}`);
const no=(n,d)=>{fails++;console.log(`  ✗ ${n}${d?`\n      ${d}`:''}`);};

srv.listen(4801, async()=>{
 const b=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM});
  /* 390x667 — an iPhone SE, the device docs/121 §5b measured and the one
    the phone defects all live on. The suite used to run at 420x900, which
    is taller than any phone and where a message hidden behind the sticky
    bar is comfortably above it. */
 const ctx=await b.newContext({viewport:{width:390,height:667},isMobile:true,hasTouch:true});
 const page=await ctx.newPage();
 const errs=[]; page.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
 page.on('pageerror',e=>errs.push('pageerror: '+e.message));
 page.on('requestfailed',r=>console.log('   [failed]',r.url()));
 page.on('response',r=>{if(r.status()===404)console.log('   [404]',r.url());});

 // Stub api.github.com before any module runs.
 const pricing = fs.readFileSync('src/data/pricing.json','utf8');
 await page.addInitScript(({pricing})=>{
   window.__calls=[];
   const b64=(t)=>{const bytes=new TextEncoder().encode(t);let s='';bytes.forEach(x=>s+=String.fromCharCode(x));return btoa(s);};
   window.fetch=async(url,opts={})=>{
     window.__calls.push({url:String(url),method:opts.method||'GET',body:opts.body});
     const auth=(opts.headers||{}).Authorization||'';
     const json=(o,status=200)=>({ok:status<400,status,statusText:'',json:async()=>o});
     if(!/Bearer ghp_good/.test(auth)) return json({message:'Bad credentials'},401);
     if(/\/user$/.test(url)) return json({login:'mashhorfoods'});
     if(/\/repos\/[^/]+\/[^/]+$/.test(url)) return json({full_name:'mashhorfoods/test', default_branch:'main'});
     if(/contents\/src\/data\/pricing\.json/.test(url) && (opts.method||'GET')==='GET')
       return json({sha: window.__serverSha||'abc123', content:b64(window.__serverText||pricing)});
     if((opts.method)==='PUT'){
       /* One armed conflict, so the stale-sha path is exercised rather than
          assumed. It disarms itself, exactly as a real 409 stops once the sha
          has been refreshed. */
       if(window.__conflictOnce){ window.__conflictOnce=false; return json({message:'does not match'},409); }
       return json({content:{sha:'def456'}, commit:{sha:'0123456789abcdef', html_url:'https://github.com/x/y/commit/0123456'}});
     }
     return json({message:'unexpected '+url},404);
   };
 },{pricing});

 await page.goto('http://localhost:4801/admin.html',{waitUntil:'load'});
 await page.waitForTimeout(600);

 // ---- P2: the shell renders with no token and explains itself
 const signin = await page.$('.a-signin');
 const explains = (await page.textContent('.a-head p')||'').includes('checked before it can be saved');
 if (signin && explains) ok('P2 — renders with no token, asks for one, explains what it is');
 else no('P2 — shell', `signin=${!!signin} explains=${explains}`);

 // ---- P3: a bad token is rejected with a useful message
 await page.fill('.a-signin input[type=password]','ghp_bad');
 await page.click('.a-signin button[type=submit]');
 await page.waitForTimeout(400);
 const err = await page.textContent('#status');
 if (/not accepted|expired/i.test(err)) ok('P3 — a bad token is refused with a message that says what to do');
 else no('P3 — bad token', `status was "${err}"`);

 // ---- P3: a good token signs in
 await page.fill('.a-signin input[type=password]','ghp_good');
 await page.click('.a-signin button[type=submit]');
 await page.waitForTimeout(500);
 const who = await page.textContent('.a-bar__who').catch(()=>'');
 if (/mashhorfoods/.test(who)) ok('P3 — a good token signs in and names the account');
 else no('P3 — good token', `bar said "${who}"`);

 // repo access is verified, not just the account
 const calls = await page.evaluate(()=>window.__calls.map(c=>c.url));
 if (calls.some(u=>/\/repos\/mashhorfoods\/test$/.test(u))) ok('P3 — repository access verified, not just the account');
 else no('P3 — repo check', calls.join(' | ').slice(0,200));

 // ---- P4: read and render
 await page.click('.a-tab');
 await page.waitForTimeout(600);
 const inputs = await page.$$eval('.a-card .a-field__input', els=>els.length);
 const cards = await page.$$eval('.a-card', els=>els.length);
 if (cards >= 12 && inputs >= 60) ok(`P4 — ${cards} packages rendered, ${inputs} fields, populated from the API`);
 else no('P4 — read', `cards=${cards} inputs=${inputs}`);

 // ---- P10: the phone fix — categories start closed, and the page is short
 const closed = await page.$$eval('.a-group', gs=>gs.filter(g=>!g.open).length);
 const groups  = await page.$$eval('.a-group', gs=>gs.length);
 const screens = await page.evaluate(()=>+(document.body.scrollHeight/window.innerHeight).toFixed(1));
 if (closed === groups && screens < 3) ok(`P10 — all ${groups} categories closed, page opens in ${screens} screens (was 10.5)`);
 else no('P10 — collapsed', `closed=${closed}/${groups} screens=${screens}`);

 // the action bar is reachable without hunting for it
 const barSticky = await page.$eval('.a-commit', b=>getComputedStyle(b).position);
 if (barSticky === 'sticky') ok('P10 — the action bar is sticky, so Save is always on screen');
 else no('P10 — sticky bar', `position was ${barSticky}`);

 // open the first category to edit — this is now the real interaction
 await page.click('.a-group__title');
 await page.waitForTimeout(300);

 // ---- P5: invalid blocks the commit
 const priceInput = await page.$('.a-card .a-field__input');
 await priceInput.fill('$490');
 await page.waitForTimeout(300);
 const disabled = await page.$eval('.a-btn--primary', b=>b.disabled);
 /* The message must be AT THE FIELD, not only in the bar: the bar is pinned
    to the bottom of a phone screen and a multi-line message there covered the
    very input it was about. Asserting the field carries it is what stops that
    coming back. */
 const atField = await page.$eval('.a-card .a-field__error', e=>e.textContent).catch(()=>'');
 const summary = await page.textContent('.a-problems__title').catch(()=>'');
 if (disabled && /must be a number/.test(atField) && /1 thing to fix/.test(summary)) {
   ok('P5 — an invalid price disables Save, names the problem AT the field, and summarises it in one line');
 } else no('P5 — validation', `disabled=${disabled} atField="${atField.slice(0,60)}" summary="${summary.slice(0,50)}"`);

 // the bar must not be tall enough to cover what it is describing
 const barH = await page.$eval('.a-commit', b=>Math.round(b.getBoundingClientRect().height));
 const vh   = await page.evaluate(()=>window.innerHeight);
 if (barH < vh*0.35) ok(`P10 — the action bar is ${barH}px of a ${vh}px screen (${Math.round(barH/vh*100)}%)`);
 else no('P10 — bar height', `${barH}px of ${vh}px — tall enough to cover the field it describes`);

 // a problem must never hide behind a closed summary
 const problemGroupOpen = await page.$$eval('.a-group', gs=>gs.some(g=>g.open && /needs attention/.test(g.querySelector('summary')?.textContent||'')));
 if (problemGroupOpen) ok('P10 — the category holding the invalid value opens itself and says so');
 else no('P10 — auto-open', 'the invalid value is hidden behind a closed summary');

 // ---- P10b: the message is ABOVE the sticky bar, not behind it
 {
   /* docs/121 §5b moved the validity message from the bar down to its own
      field, because the bar was sitting on top of the price it described.
      Right, and not the whole fix: on a 667px screen the field being typed
      into is usually the last thing above the bar, so the message that
      appears under it appears under the bar. Every number was healthy when
      that was true — 3.6 screens, no overflow, bar at 27% — and a
      screenshot showed the one sentence the operator needs invisible. */
   await page.waitForTimeout(700); // the reveal scroll is smooth
   const r = await page.evaluate(()=>{
     const note = document.querySelector('.a-card .a-field__error');
     const bar = document.querySelector('.a-commit');
     if (!note || !bar) return null;
     const n = note.getBoundingClientRect(), b = bar.getBoundingClientRect();
     return { top: Math.round(n.top), bottom: Math.round(n.bottom),
       barTop: Math.round(b.top), vh: window.innerHeight };
   });
   if (r && r.top >= 0 && r.bottom <= r.barTop)
     ok(`P10b — the field's message is fully visible above the bar (ends at ${r.bottom}px, bar starts at ${r.barTop}px)`);
   else no('P10b — message behind the bar', JSON.stringify(r));
 }
 // ---- P5: valid re-enables
 await (await page.$('.a-card .a-field__input')).fill('520');
 await page.waitForTimeout(300);
 const enabled = await page.$eval('.a-btn--primary', b=>!b.disabled);
 if (enabled) ok('P5 — fixing it re-enables Save');
 else no('P5 — re-enable', 'still disabled after a valid edit');

 // ---- P6: write
 await page.click('.a-btn--primary');
 await page.waitForTimeout(600);
 const put = await page.evaluate(()=>window.__calls.find(c=>c.method==='PUT'));
 if (put) {
   const body = JSON.parse(put.body);
   const sent = new TextDecoder().decode(Uint8Array.from(atob(body.content), c=>c.charCodeAt(0)));
   const parsed = JSON.parse(sent);
   /* A NUMBER on the wire. It was a string of digits until 8 September; the
      dashboard's box is still text, because a text box is what a phone shows
      well, but what it writes into the file is the amount. */
   const priceOk = parsed.categories[0].packages[0].price===520;
   const shaOk = body.sha==='abc123';
   const trailing = sent.endsWith('\n');
   if (priceOk && shaOk && trailing) ok('P6 — PUT carries the edited value, the file sha, and the exact serialisation');
   else no('P6 — write', `price=${parsed.categories[0].packages[0].price} sha=${body.sha} newline=${trailing}`);
 } else no('P6 — write', 'no PUT was made');

 // ---- P7: what happens next
 await page.waitForTimeout(400);
 const result = await page.textContent('.a-result').catch(()=>'');
 if (/Saved/.test(result) && /rebuild/i.test(result)) ok('P7 — shows the commit and says what happens next');
 else no('P7 — result', result.slice(0,90));

 // ---- P11: a PERSON can type into it
 {
   /* THE TEST THAT NINE PHASES OF TESTS COULD NOT DO. Every check above uses
      Playwright's fill(), which sets .value and fires ONE input event. A
      person presses one key at a time, and the page used to call rerender()
      on each of them — replaceChildren(), so the input being typed into was
      destroyed a character in, focus fell to <body>, the open category
      collapsed, and every keystroke after the first went nowhere. Typing
      "1234" into a price left "1", and the dashboard was unusable for its
      only job.

      fill() could never see it. This types. */
   const box = await page.$('.a-card .a-field__input');
   await box.click();
   await page.keyboard.press('Control+a');
   for (const ch of '1234') { await page.keyboard.type(ch); await page.waitForTimeout(90); }
   const r = await page.evaluate(()=>{
     const i = document.querySelector('.a-card .a-field__input');
     return { value: i && i.value, focused: document.activeElement === i,
       caret: i && i.selectionStart, open: document.querySelector('.a-group').open };
   });
   if (r.value === '1234' && r.focused && r.caret === 4 && r.open)
     ok('P11 — four keystrokes produce four characters, focus stays, the category stays open');
   else no('P11 — typing', `value="${r.value}" focused=${r.focused} caret=${r.caret} open=${r.open}`);
   /* Back to the committed value: nothing to save, so the bar goes idle —
      which is itself the behaviour P10 asserts. */
   await (await page.$('.a-card .a-field__input')).fill('520');
   await page.waitForTimeout(300);
 }

 // ---- P6b: the commit goes to the repository's DEFAULT branch
 {
   const put = await page.evaluate(()=>window.__calls.find(c=>c.method==='PUT'));
   const body = JSON.parse(put.body);
   /* This was a hard-coded session working branch until 7 September, and it
      went stale the moment PR #1 merged. Everything downstream deploys from
      the default branch, so a save anywhere else is a green commit that
      changes nothing a visitor sees — the worst kind of failure, because it
      looks exactly like success. */
   if (body.branch === 'main') ok('P6b — the commit targets the repository default branch, read from the API');
   else no('P6b — branch', `the PUT wrote to "${body.branch}"`);
 }

 // ---- P6c: a sha that moved but the content did not — re-read and save
 {
   /* The server now holds exactly what P6 committed — the sha moved, the
      bytes did not. That is the benign case, and it is the common one: any
      commit that touches a file without changing it lands here. */
   const committed = JSON.parse(pricing);
   /* A NUMBER, because that is what a price is in this file since 8 September.
      This line held '520' and the dashboard now writes 520, so the two differed
      by type and the benign case was being read as a real conflict — the test
      encoding the old contract, not the dashboard getting it wrong. */
   committed.categories[0].packages[0].price = 520;
   await page.evaluate((t)=>{ window.__calls=[]; window.__conflictOnce=true;
     window.__serverSha='newsha'; window.__serverText=t; },
     JSON.stringify(committed, null, 2)+'\n');
   await (await page.$('.a-card .a-field__input')).fill('530');
   await page.waitForTimeout(300);
   await page.click('.a-btn--primary');
   await page.waitForTimeout(800);
   const puts = await page.evaluate(()=>window.__calls.filter(c=>c.method==='PUT'));
   const status = (await page.textContent('#status')||'').trim();
   const sha = puts.length ? JSON.parse(puts[puts.length-1].body).sha : '';
   if (puts.length === 2 && sha === 'newsha' && !status)
     ok('P6c — a sha that moved with identical content is re-read and the save goes through');
   else no('P6c — benign conflict', `puts=${puts.length} sha=${sha} status="${status}"`);
 }

 // ---- P6d: a REAL conflict refuses to overwrite and says what to do
 {
   const changed = JSON.parse(pricing);
   changed.categories[0].packages[0].price = 999;
   await page.evaluate((t)=>{ window.__calls=[]; window.__conflictOnce=true; window.__serverText=t; },
     JSON.stringify(changed, null, 2)+'\n');
   await (await page.$('.a-card .a-field__input')).fill('540');
   await page.waitForTimeout(300);
   await page.click('.a-btn--primary');
   await page.waitForTimeout(800);
   const status = (await page.textContent('#status')||'');
   const kept = await page.$eval('.a-card .a-field__input', e=>e.value);
   const puts = await page.evaluate(()=>window.__calls.filter(c=>c.method==='PUT').length);
   /* Two people have write access here, so this is a matter of when, not
      whether. Refusing is the easy half; keeping the operator's unsaved work
      on screen while refusing is the half that makes it usable. */
   if (/changed on the repository/i.test(status) && kept === '540' && puts === 1)
     ok('P6d — a real conflict refuses to overwrite, explains it, and keeps the edits on screen');
   else no('P6d — real conflict', `puts=${puts} kept="${kept}" status="${status.slice(0,70)}"`);
 }

 if (errs.length) no('console', errs.slice(0,2).join(' | '));
 else ok('0 console errors');

 await b.close(); srv.close();
 console.log(`\nadmin-ui: ${fails===0?'all checks passed':fails+' FAILED'}\n`);
 process.exit(fails?1:0);
});
