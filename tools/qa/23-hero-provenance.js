/* §23 what the hero was made from ------------------------------------
   WHY THIS EXISTS. A Pika watermark sat on the hero of every page for two
   days — on hero.webm, hero.mp4 AND hero-poster.webp, which is what every
   phone, reduced-motion and no-JS visitor sees instead of the film. It was a
   deliberate decision with sound licence reasoning, and the second half of
   that decision — "replace them with clean exports later" — lived in a
   commit message and nowhere else (docs/54 §9, docs/89).

   Two builders write these same three files. `npm run film` draws the scene
   and owns it outright; `npm run film:clips` wraps generated footage, which
   is where a third party's mark can arrive. The outputs are hard to tell
   apart at a glance, and nothing recorded which had run.

   This cannot see a watermark — that needs eyes, and docs/89 records the
   frames that were read. What it can do is make the QUESTION answerable:
   the hero must carry a provenance file naming its generator, and that file
   must be newer than the assets it describes. A hero of unknown origin is
   the state that let this ship. */

module.exports = async function check({ fs, path, crypto, ROOT, fail }) {
  {
    const dir = path.join(ROOT, 'src/assets/showpiece');
    const assets = ['hero.webm', 'hero.mp4', 'hero-poster.webp']
      .map((f) => path.join(dir, f)).filter((f) => fs.existsSync(f));
    const prov = path.join(dir, 'provenance.json');

    if (assets.length && !fs.existsSync(prov)) {
      fail('HIGH', 'hero', 'the hero film ships with no provenance.json — nothing records which builder made it, which is exactly how a watermark shipped for two days');
    } else if (assets.length) {
      const p = JSON.parse(fs.readFileSync(prov, 'utf8'));

      /* HASHES, NOT MTIMES. This compared the assets' modification times
         against the signature's timestamp, which cannot work anywhere the
         repository is cloned: git does not preserve mtimes, so a fresh CI
         checkout stamps every file with the checkout time and the comparison
         reported "replaced by something that did not sign its work" on every
         single run. It passed locally only because these files happened to
         predate the signature on this disk — the check was measuring the
         working copy, not the repository.

         A content hash travels through a clone and answers the sharper
         question anyway: are these the exact bytes that were signed? */
      const sig = p.sha256 || {};
      if (!Object.keys(sig).length) {
        fail('HIGH', 'hero', `provenance.json (${p.generator}) records no sha256 for the hero assets, so nothing can tell whether the shipped bytes are the signed ones — re-run the builder that made them`);
      } else {
        for (const f of assets) {
          const name = path.basename(f);
          const actual = crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
          if (!sig[name]) {
            fail('HIGH', 'hero', `${name} ships but provenance.json (${p.generator}) does not sign it — re-run the builder`);
          } else if (sig[name] !== actual) {
            fail('HIGH', 'hero', `${name} does not match the hash in provenance.json (${p.generator}) — it was replaced by something that did not sign its work`);
          }
        }
      }
      /* A KNOWN WATERMARK IS NOT A FINDING; AN UNKNOWN ONE IS.
         The owner reaffirmed shipping the Pika mark on 6 Sep after docs/54 §9
         set out the three options, so provenance.json records that decision
         and this stops asking. A check that fires on a settled decision every
         run is noise, and noise is how the real findings get scrolled past.

         What it still catches is footage arriving with nobody having looked —
         which is the state that let the mark ship unnoticed for two days. */
      if (p.generator === 'clips') {
        const w = p.watermark;
        if (!w || typeof w.present !== 'boolean') {
          fail('MED', 'hero', `the hero is wrapped from supplied footage (${(p.clips || []).join(', ') || 'unnamed clips'}) and provenance.json does not say whether it carries a watermark — look, then record the answer; docs/54 §9 is why`);
        } else if (w.present && !w.acceptedBy) {
          fail('HIGH', 'hero', `the hero carries a ${w.mark || 'third-party'} watermark that nobody has accepted — this is the state docs/54 §9 exists to prevent`);
        }
      }
    }
  }
};
