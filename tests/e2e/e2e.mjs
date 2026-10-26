// End-to-end check of the Kota page in real Edge (Playwright): layout, menu, animations, transitions, working without the script.
// Usage: node e2e.mjs <address> <folder for screenshots>
import { createRequire } from 'node:module';
import path from 'node:path';
import fs from 'node:fs';
const require = createRequire(import.meta.url);
const { chromium, devices } = require('playwright-core');

const url = (process.argv[2] ?? 'http://localhost:5411/').replace(/\/$/, '');
const slike = path.resolve(process.argv[3] ?? './slike-e2e');
fs.mkdirSync(slike, { recursive: true });

let ok = 0, lose = 0;
const t = (naziv, uslov) => { if (uslov) ok++; else { lose++; console.log('GRESKA:', naziv); } };
const bezGlatkog = 'html{scroll-behavior:auto!important}';
const SLUGOVI = ['vila-vrelo', 'kuca-avlija', 'bijela-kuca', 'kula-zavoj', 'dom-krivina', 'paviljon-suma'];

const prosetaj = async s => {
  const h = await s.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < h; y += 300) { await s.evaluate(y => scrollTo(0, y), y); await s.waitForTimeout(45); }
  await s.waitForTimeout(1900);
};
const sirina = async (s, ime) => {
  const r = await s.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth, sc: visualViewport.scale }));
  t(`${ime}: nema horizontalnog skrola (${r.sw} > ${r.cw})`, r.sw <= r.cw);
  t(`${ime}: zumiranje 1`, r.sc === 1);
};

const uredjaji = [
  ['iphone', { ...devices['iPhone 13'] }],
  ['mali-android', { viewport: { width: 360, height: 700 }, isMobile: true, hasTouch: true }],
  ['tablet', { viewport: { width: 820, height: 1100 } }],
  ['desktop', { viewport: { width: 1440, height: 900 } }],
  ['siroki', { viewport: { width: 1920, height: 1080 } }],
  ['tamni-iphone', { ...devices['iPhone 13'], colorScheme: 'dark' }],
];

const b = await chromium.launch({ channel: process.env.BROWSER_CHANNEL ?? 'msedge' });

for (const [ime, opc] of uredjaji) {
  const mobilni = (opc.viewport?.width ?? 390) < 820;
  const ctx = await b.newContext(opc);
  const s = await ctx.newPage();
  const greske = [];
  s.on('pageerror', e => greske.push('JS: ' + e.message));
  s.on('console', m => { if (m.type() === 'error') greske.push('konzola: ' + m.text()); });
  s.on('requestfailed', r => greske.push('zahtjev: ' + r.url()));
  s.on('response', r => { if (r.status() >= 400) greske.push(`HTTP ${r.status()}: ${r.url()}`); });
  await s.goto(url + '/'); await s.waitForLoadState('networkidle');
  await s.addStyleTag({ content: bezGlatkog });
  await s.waitForTimeout(1700);

  // ---- hero ----
  t(`${ime}: naslov vidljiv`, await s.locator('.hero-naslov').isVisible());
  t(`${ime}: naslov dostupan čitaču`, (await s.locator('.hero-naslov').getAttribute('aria-label')) === 'Gradimo tišinu.');
  const naslovOk = await s.evaluate(() => [...document.querySelectorAll('.hero-naslov .red > span')].every(e => e.getBoundingClientRect().right <= innerWidth + 1 && getComputedStyle(e).transform === 'none' || getComputedStyle(e).transform === 'matrix(1, 0, 0, 1, 0, 0)'));
  t(`${ime}: naslov završio animaciju i ne izlazi iz ekrana`, naslovOk);
  t(`${ime}: fontovi učitani`, await s.evaluate(() => document.fonts.check('600 20px Bricolage') && document.fonts.check('400 16px Inter')));
  t(`${ime}: sat u 24 sata`, /^\d{2}:\d{2}:\d{2}$/.test((await s.locator('[data-sat]').textContent()).trim()));
  const sat1 = await s.locator('[data-sat]').textContent(); await s.waitForTimeout(1300);
  t(`${ime}: sat otkucava`, sat1 !== await s.locator('[data-sat]').textContent());
  t(`${ime}: sat je sarajevski`, await s.evaluate(() => {
    const sad = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Sarajevo', hour: '2-digit', hourCycle: 'h23' }).format(new Date());
    return document.querySelector('[data-sat]').textContent.startsWith(sad);
  }));
  await sirina(s, `${ime} (vrh)`);
  await s.screenshot({ path: path.join(slike, `${ime}-hero.png`) });

  // ---- first Tab = skip to content ----
  await s.keyboard.press('Tab');
  t(`${ime}: prvi Tab je "Preskoči na sadržaj"`, await s.evaluate(() => document.activeElement?.className === 'preskoci'));
  await s.evaluate(() => document.activeElement.blur());

  // ---- navigation / menu ----
  if (mobilni) {
    t(`${ime}: dugme Meni vidljivo, navigacija sakrivena`, await s.locator('#meni-dugme').isVisible() && !(await s.locator('.nav').isVisible()));
    await s.click('#meni-dugme'); await s.waitForTimeout(800);
    t(`${ime}: meni se otvorio`, await s.evaluate(() => document.documentElement.classList.contains('meni-otvoren')) && (await s.getAttribute('#meni-dugme', 'aria-expanded')) === 'true');
    t(`${ime}: meni ima 4 veze i vidljive su`, await s.locator('.meni nav a:visible').count() === 4);
    await s.screenshot({ path: path.join(slike, `${ime}-meni.png`) });
    await s.keyboard.press('Escape'); await s.waitForTimeout(800);
    t(`${ime}: Escape zatvara meni`, !(await s.evaluate(() => document.documentElement.classList.contains('meni-otvoren'))));
    await s.click('#meni-dugme'); await s.waitForTimeout(700);
    await s.click('.meni nav a[href="/#kontakt"]'); await s.waitForTimeout(1200);
    t(`${ime}: veza u meniju zatvara meni i vodi na kontakt`, !(await s.evaluate(() => document.documentElement.classList.contains('meni-otvoren'))) && await s.evaluate(() => { const r = document.querySelector('#kontakt').getBoundingClientRect(); return r.top < innerHeight * 0.6; }));
    await s.evaluate(() => scrollTo(0, 0)); await s.waitForTimeout(400);
  } else {
    t(`${ime}: navigacija vidljiva, dugme Meni sakriveno`, await s.locator('.nav').isVisible() && !(await s.locator('#meni-dugme').isVisible()));
  }

  // ---- no strip under the header ----
  t(`${ime}: nema trake s uslugama`, await s.locator('.traka').count() === 0);

  // ---- statement: words light up ----
  await s.evaluate(() => scrollTo(0, 0)); await s.waitForTimeout(300);
  const dopola = await s.evaluate(() => document.querySelectorAll('.rijec.upaljena').length);
  await s.evaluate(() => document.querySelector('.onama').scrollIntoView());
  await s.waitForTimeout(300);
  const ukupno = await s.evaluate(() => document.querySelectorAll('.rijec').length);
  t(`${ime}: izjava ima riječi (${ukupno})`, ukupno >= 15);
  await s.evaluate(() => scrollBy(0, innerHeight * 0.7)); await s.waitForTimeout(500);
  const poslije = await s.evaluate(() => document.querySelectorAll('.rijec.upaljena').length);
  t(`${ime}: riječi se pale skrolanjem (${dopola} → ${poslije})`, poslije > dopola);
  t(`${ime}: izjava ostaje čitljiva čitaču`, (await s.locator('.izjava').getAttribute('aria-label'))?.startsWith('Svaka kuća'));

  // ---- the header changes colour ----
  await s.evaluate(() => { const e = document.querySelector('.onama'); scrollTo(0, e.getBoundingClientRect().top + scrollY + 40); });
  await s.waitForTimeout(600);
  t(`${ime}: zaglavlje tamno na svijetloj sekciji`, await s.evaluate(() => !document.querySelector('#zaglavlje').classList.contains('na-tamnom') && getComputedStyle(document.querySelector('.logo')).color === 'rgb(42, 33, 27)'));
  await s.evaluate(() => scrollTo(0, 0)); await s.waitForTimeout(600);
  t(`${ime}: zaglavlje svijetlo na naslovnom dijelu`, await s.evaluate(() => document.querySelector('#zaglavlje').classList.contains('na-tamnom') && getComputedStyle(document.querySelector('.logo')).color === 'rgb(255, 255, 255)'));

  // ---- projects: calm rows, no stacking or overlapping ----
  t(`${ime}: 6 projekata u redovima`, await s.locator('.rad').count() === 6);
  const poz = await s.evaluate(() => document.querySelector('.radovi').getBoundingClientRect().top + scrollY);
  await s.evaluate(([y]) => scrollTo(0, y), [poz + 500]); await s.waitForTimeout(1500);
  const okviri = await s.evaluate(() => [...document.querySelectorAll('.rad')].map(r => { const b = r.getBoundingClientRect(); const i = r.querySelector('.rad-slika').getBoundingClientRect(); return { top: b.top + scrollY, bottom: b.bottom + scrollY, l: i.left, r: i.right }; }));
  t(`${ime}: redovi se ne preklapaju`, okviri.every((o, i) => i === 0 || o.top >= okviri[i - 1].bottom - 1));
  t(`${ime}: slike u okviru ekrana`, okviri.every(o => o.l >= 0 && o.r <= (opc.viewport?.width ?? 390) + 1));
  t(`${ime}: nijedan projekat nije pomaknut ni skaliran (bez slaganja)`, await s.evaluate(() => [...document.querySelectorAll('.rad-veza')].every(a => getComputedStyle(a).transform === 'none')));
  if ((opc.viewport?.width ?? 390) >= 900) {
    const poredak = await s.evaluate(() => [...document.querySelectorAll('.rad')].map(r => Math.round(r.querySelector('.rad-slika').getBoundingClientRect().left)));
    t(`${ime}: slike se naizmjenično pomjeraju lijevo/desno (${poredak})`, poredak[0] < poredak[1] && poredak[2] < poredak[3]);
  }
  await s.screenshot({ path: path.join(slike, `${ime}-projekti.png`) });

  // ---- numbers ----
  await s.evaluate(() => document.querySelector('.onama-brojke').scrollIntoView({ block: 'center' })); await s.waitForTimeout(2600);
  const brojke = await s.evaluate(() => [...document.querySelectorAll('[data-broj]')].map(e => [e.textContent.trim(), e.dataset.broj]));
  t(`${ime}: brojke dosegnu ciljeve ${JSON.stringify(brojke)}`, brojke.length === 3 && brojke.every(([a, c]) => a === c));

  // ---- whole page: everything visible, pictures loaded ----
  await prosetaj(s);
  const nevidljivo = await s.evaluate(() => [...document.querySelectorAll('[data-otkrij]')].filter(e => !e.classList.contains('vidljivo')).length);
  t(`${ime}: svi elementi se otkriju (${nevidljivo} skriveno)`, nevidljivo === 0);
  const slabeSlike = await s.evaluate(async () => {
    const sve = [...document.images];
    sve.forEach(i => { i.loading = 'eager'; });
    await Promise.all(sve.map(i => i.complete ? 0 : new Promise(r => { i.onload = i.onerror = r; })));
    return sve.filter(i => !i.naturalWidth).map(i => i.src);
  });
  t(`${ime}: sve slike se učitale ${slabeSlike}`, slabeSlike.length === 0);
  const bezAlt = await s.evaluate(() => [...document.images].filter(i => i.getAttribute('alt') === null).length);
  t(`${ime}: sve slike imaju alt`, bezAlt === 0);
  const izvan = await s.evaluate(() => [...document.querySelectorAll('h1, h2, h3, .dugme, .kontakt-podaci dd, .tim b')].filter(e => { const r = e.getBoundingClientRect(); return r.width > 0 && (r.right > innerWidth + 1 || r.left < -1); }).map(e => e.className || e.tagName));
  t(`${ime}: naslovi i dugmad ne izlaze iz ekrana ${izvan}`, izvan.length === 0);
  await sirina(s, `${ime} (cijela)`);
  const prazne = await s.evaluate(() => [...document.querySelectorAll('a[href]')].filter(a => !(a.textContent.trim() || a.getAttribute('aria-label'))).length);
  t(`${ime}: sve veze imaju tekst ili aria-label`, prazne === 0);
  t(`${ime}: mailto i tel veze`, await s.locator('a[href^="mailto:"]').count() >= 1 && await s.locator('a[href^="tel:"]').count() >= 1);
  await s.evaluate(() => scrollTo(0, 0));
  await s.screenshot({ path: path.join(slike, `${ime}-puna.png`), fullPage: true });

  // ---- dark-mode phone: the page keeps its own light/dark look ----
  if (ime === 'tamni-iphone') {
    const boje = await s.evaluate(() => [getComputedStyle(document.body).backgroundColor, getComputedStyle(document.querySelector('.studio')).backgroundColor]);
    t(`${ime}: svijetle sekcije ostaju svijetle`, boje.every(c => c === 'rgb(243, 241, 237)'));
  }

  // ---- cursor (mouse only) ----
  if (ime === 'desktop') {
    await s.evaluate(() => document.querySelector('.rad').scrollIntoView({ block: 'center' })); await s.waitForTimeout(500);
    await s.mouse.move(500, 400); await s.mouse.move(520, 420, { steps: 4 }); await s.waitForTimeout(700);
    t(`${ime}: kursor "Otvori" iznad kartice`, await s.evaluate(() => document.querySelector('#kursor').classList.contains('aktivan') && document.querySelector('#kursor span').textContent === 'Otvori'));
    await s.screenshot({ path: path.join(slike, `${ime}-kursor.png`) });
    await s.mouse.move(700, 10); await s.mouse.move(705, 12, { steps: 3 });
    await s.waitForTimeout(400);
    // the button in the contact section moves magnetically
    await s.evaluate(() => document.querySelector('.magnet').scrollIntoView({ block: 'center' })); await s.waitForTimeout(600);
    const r = await s.evaluate(() => { const e = document.querySelector('.magnet').getBoundingClientRect(); return [e.left, e.top, e.width, e.height]; });
    await s.mouse.move(r[0] + r[2] * 0.9, r[1] + r[3] * 0.5, { steps: 6 }); await s.waitForTimeout(300);
    t(`${ime}: magnetno dugme se pomjera`, await s.evaluate(() => document.querySelector('.magnet').style.transform.startsWith('translate(')));
  } else if (mobilni) {
    t(`${ime}: kursor nije prikazan na dodir`, await s.evaluate(() => getComputedStyle(document.querySelector('#kursor')).display === 'none'));
  }

  // ---- project page ----
  for (const slug of SLUGOVI) {
    await s.goto(`${url}/projekti/${slug}`); await s.waitForLoadState('networkidle');
    await s.addStyleTag({ content: bezGlatkog });
    t(`${ime}/${slug}: naslov i slika`, await s.locator('h1').isVisible() && await s.evaluate(() => document.querySelector('.pr-slika img').naturalWidth > 0));
    t(`${ime}/${slug}: ima 3 odluke i 6 podataka`, await s.locator('.pr-odluke li').count() === 3 && await s.locator('.pr-meta div').count() === 6);
    t(`${ime}/${slug}: ime prelaza postoji`, await s.evaluate(sl => getComputedStyle(document.querySelector('.pr-slika img')).viewTransitionName === 'p-' + sl, slug));
    await sirina(s, `${ime}/${slug}`);
  }
  await s.goto(`${url}/projekti/vila-vrelo`); await s.waitForLoadState('networkidle');
  await s.addStyleTag({ content: bezGlatkog });
  await prosetaj(s);
  t(`${ime}: projekat — sve otkriveno`, await s.evaluate(() => [...document.querySelectorAll('[data-otkrij]')].every(e => e.classList.contains('vidljivo'))));
  await s.screenshot({ path: path.join(slike, `${ime}-projekat.png`), fullPage: true });
  await s.click('.pr-dalje'); await s.waitForURL('**/projekti/kuca-avlija');
  t(`${ime}: "Sljedeći projekat" vodi na sljedeći`, s.url().endsWith('/projekti/kuca-avlija'));
  await s.goBack(); await s.waitForURL('**/projekti/vila-vrelo');
  await s.evaluate(() => scrollTo(0, 0)); await s.waitForTimeout(300);
  await s.click('.nazad'); await s.waitForLoadState('networkidle'); await s.waitForTimeout(400);
  t(`${ime}: "Svi projekti" vodi na projekte`, s.url().includes('/#projekti'));

  // ---- clicking a card opens the project ----
  await s.goto(url + '/'); await s.waitForLoadState('networkidle');
  await s.addStyleTag({ content: bezGlatkog });
  await s.evaluate(() => document.querySelectorAll('.rad')[1].scrollIntoView({ block: 'center' })); await s.waitForTimeout(1300);
  await s.locator('.rad').nth(1).locator('a').first().click({ position: { x: 20, y: 60 } });
  await s.waitForURL('**/projekti/**');
  t(`${ime}: klik na drugi projekat vodi na "Kuća Avlija"`, s.url().endsWith('/projekti/kuca-avlija'));

  t(`${ime}: bez grešaka u konzoli (${greske.slice(0, 3).join(' | ')})`, greske.length === 0);
  await ctx.close();
}

// ---------- 404 ----------
{
  const ctx = await b.newContext(devices['iPhone 13']); const s = await ctx.newPage();
  const r = await s.goto(url + '/nema-ove-stranice');
  t('404: status 404', r.status() === 404);
  t('404: naša stranica s vezom na početnu', await s.locator('.greska h1').isVisible() && await s.locator('a.dugme[href="/"]').isVisible());
  await s.screenshot({ path: path.join(slike, '404.png') });
  const r2 = await s.goto(url + '/projekti/nema');
  t('404: nepoznat projekat', r2.status() === 404);
  await ctx.close();
}

// ---------- without JavaScript ----------
{
  const ctx = await b.newContext({ ...devices['iPhone 13'], javaScriptEnabled: false }); const s = await ctx.newPage();
  await s.goto(url + '/'); await s.waitForLoadState('networkidle');
  t('bez JS: naslov vidljiv i na mjestu', await s.evaluate(() => [...document.querySelectorAll('.hero-naslov .red > span')].every(e => getComputedStyle(e).transform === 'none')));
  t('bez JS: svi elementi vidljivi', await s.evaluate(() => [...document.querySelectorAll('[data-otkrij]')].every(e => getComputedStyle(e).opacity === '1')));
  t('bez JS: izjava puna', await s.evaluate(() => getComputedStyle(document.querySelector('.izjava')).opacity === '1'));
  t('bez JS: navigacija vidljiva i zaglavlje ima pozadinu', await s.locator('.nav').isVisible() && await s.evaluate(() => getComputedStyle(document.querySelector('#zaglavlje')).backgroundColor === 'rgb(243, 241, 237)'));
  t('bez JS: brojke imaju prave vrijednosti', await s.evaluate(() => [...document.querySelectorAll('[data-broj]')].every(e => e.textContent.trim() === e.dataset.broj)));
  await sirina(s, 'bez JS');
  await s.screenshot({ path: path.join(slike, 'bez-js.png'), fullPage: true });
  await ctx.close();
}

// ---------- reduced motion ----------
{
  const ctx = await b.newContext({ ...devices['iPhone 13'], reducedMotion: 'reduce' }); const s = await ctx.newPage();
  const greske = []; s.on('pageerror', e => greske.push(e.message));
  await s.goto(url + '/'); await s.waitForLoadState('networkidle'); await s.waitForTimeout(500);
  t('manje pokreta: naslov odmah na mjestu', await s.evaluate(() => [...document.querySelectorAll('.hero-naslov .red > span')].every(e => getComputedStyle(e).transform === 'none')));
  t('manje pokreta: izjava puna', await s.evaluate(() => getComputedStyle(document.querySelector('.izjava')).opacity === '1' && !document.querySelector('.rijec')));
  t('manje pokreta: brojke odmah tačne', await s.evaluate(() => [...document.querySelectorAll('[data-broj]')].every(e => e.textContent.trim() === e.dataset.broj)));
  t('manje pokreta: bez pomaka naslovne slike', await s.evaluate(async () => { scrollTo(0, 300); await new Promise(r => setTimeout(r, 300)); return document.querySelector('.hero-slika').style.transform === ''; }));
  t('manje pokreta: bez grešaka', greske.length === 0);
  await ctx.close();
}

await b.close();
console.log(`\nProšlo: ${ok}, palo: ${lose}`);
process.exit(lose ? 1 : 0);
