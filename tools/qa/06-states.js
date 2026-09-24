/* §6 states ---- */

module.exports = async function check({ fail, BASE, browser }) {
  {
    const p = await (await browser.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
    await p.goto(`${BASE}/index.html`, { waitUntil: 'load' }); await p.waitForTimeout(700);
    const states = await p.evaluate(() => {
      const form = document.querySelector('[data-contact-form]');
      /* Measure the <details>, not its child. While closed, the child keeps a
         bounding box that paints nothing (content-visibility: hidden), so
         asking the child whether it is visible gets a confident wrong answer
         — this check reported a bug that did not exist until it was fixed to
         ask the element that actually reserves space. */
      const closed = document.querySelector('.c-tier__terms');
      const summary = closed?.querySelector('summary');
      const shut = closed ? closed.getBoundingClientRect().height : 0;
      const hiddenWhenClosed = closed
        ? !closed.open && Math.abs(shut - summary.getBoundingClientRect().height) < 2 : null;
      closed?.setAttribute('open', '');
      const shownWhenOpen = closed
        ? closed.getBoundingClientRect().height > shut + 10 : null;
      return {
        formValidates: form ? !form.checkValidity() : null,
        status: (document.querySelector('[data-contact-status]')?.textContent || '').trim(),
        hiddenWhenClosed, shownWhenOpen,
        waFallback: [...document.querySelectorAll('[data-wa]')].every((a) => /^https:\/\/wa\.me\//.test(a.getAttribute('href'))),
      };
    });
    if (states.formValidates !== true) fail('HIGH', 'states', 'the empty contact form does not fail validation');
    if (states.status) fail('MED', 'states', `the status line says something before anything happened: "${states.status}"`);
    if (states.hiddenWhenClosed === false) fail('MED', 'states', 'the scope-fact disclosure shows its body while closed');
    if (states.shownWhenOpen === false) fail('HIGH', 'states', 'the scope-fact disclosure stays empty when opened');
    if (!states.waFallback) fail('HIGH', 'states', 'a package CTA is not a real wa.me link');
    await p.goto(`${BASE}/404.html`, { waitUntil: 'load' }); await p.waitForTimeout(400);
    const e404 = await p.evaluate(() => ({ nav: document.querySelectorAll('.c-header a[href]').length, h1: document.querySelectorAll('h1').length }));
    if (e404.nav < 4 || e404.h1 !== 1) fail('MED', 'states', '404 page has lost its navigation or heading');
    await p.context().close();
  }
};
