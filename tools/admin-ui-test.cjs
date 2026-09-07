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
 const ctx=await b.newContext({viewport:{width:420,height:900},isMobile:true,hasTouch:true});
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
     if(/\/repos\/[^/]+\/[^/]+$/.test(url)) return json({full_name:'mashhorfoods/test'});
     if(/contents\/src\/data\/pricing\.json/.test(url) && (opts.method||'GET')==='GET')
       return json({sha:'abc123', content:b64(pricing)});
     if((opts.method)==='PUT')
       return json({content:{sha:'def456'}, commit:{sha:'0123456789abcdef', html_url:'https://github.com/x/y/commit/0123456'}});
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
 if (disabled && /digits only/.test(atField) && /1 thing to fix/.test(summary)) {
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
   const priceOk = parsed.categories[0].packages[0].price==='520';
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

 if (errs.length) no('console', errs.slice(0,2).join(' | '));
 else ok('0 console errors');

 await b.close(); srv.close();
 console.log(`\nadmin-ui: ${fails===0?'all checks passed':fails+' FAILED'}\n`);
 process.exit(fails?1:0);
});
