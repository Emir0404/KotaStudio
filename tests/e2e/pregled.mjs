// Quick look at Kota's design: screenshots by section (desktop and phone). Usage: node pregled.mjs <address> <folder>
import { createRequire } from 'node:module';
import path from 'node:path';
import fs from 'node:fs';
const require = createRequire(import.meta.url);
const { chromium, devices } = require('playwright-core');
const url = (process.argv[2] ?? 'http://localhost:5410/').replace(/\/$/, '');
const out = path.resolve(process.argv[3] ?? './slike');
fs.mkdirSync(out, { recursive: true });
const b = await chromium.launch({ channel: process.env.BROWSER_CHANNEL ?? 'msedge' });
for (const [ime, opc] of [['desktop', { viewport: { width: 1440, height: 900 } }], ['iphone', { ...devices['iPhone 13'] }]]) {
  const ctx = await b.newContext(opc); const s = await ctx.newPage();
  const greske = [];
  s.on('pageerror', e => greske.push('JS: ' + e.message));
  s.on('console', m => { if (m.type() === 'error') greske.push('konzola: ' + m.text()); });
  await s.goto(url + '/'); await s.waitForLoadState('networkidle');
  await s.addStyleTag({ content: 'html{scroll-behavior:auto!important}' });
  await s.waitForTimeout(1800);
  await s.screenshot({ path: path.join(out, `${ime}-01-hero.png`) });
  const vh = await s.evaluate(() => innerHeight);
  const tacke = await s.evaluate(() => {
    const top = sel => { const e = document.querySelector(sel); return e ? e.getBoundingClientRect().top + scrollY : 0; };
    return { traka: top('.traka'), izjava: top('.onama'), prostori: top('.prostori'), projekti: top('.radovi'),
      pristup: top('.pristup'), studio: top('.studio'), tim: top('.tim'), citat: top('.citat'), kontakt: top('.kontakt'), podnozje: top('.podnozje') };
  });
  const idi = async (y, naziv, cekaj = 1400) => {
    // gradually to the target so the reveal animations run
    const sad = await s.evaluate(() => scrollY);
    const korak = (y - sad) / 6;
    for (let i = 1; i <= 6; i++) { await s.evaluate(v => scrollTo(0, v), sad + korak * i); await s.waitForTimeout(40); }
    await s.waitForTimeout(cekaj);
    await s.screenshot({ path: path.join(out, `${ime}-${naziv}.png`) });
  };
  await idi(tacke.izjava + 120, '03-izjava');
  await idi(tacke.projekti - 60, '04-projekti1');
  await idi(tacke.projekti + vh * 0.9, '05-projekti2');
  await idi(tacke.projekti + vh * 1.8, '06-projekti3');
  await idi(tacke.projekti + vh * 3.4, '07-projekti5');
  await idi(tacke.prostori - 100, '08-prostori', 1800);
  await idi(tacke.pristup, '09-pristup');
  await idi(tacke.pristup + vh * 1.2, '10-pristup2');
  await idi(tacke.studio, '11-studio');
  await idi(tacke.tim - 100, '12-tim');
  await idi(tacke.citat - 100, '13-citat');
  await idi(tacke.kontakt, '14-kontakt');
  await idi(tacke.podnozje - 200, '15-podnozje');
  await s.goto(url + '/projekti/vila-vrelo'); await s.waitForLoadState('networkidle');
  await s.addStyleTag({ content: 'html{scroll-behavior:auto!important}' });
  await s.waitForTimeout(900);
  await s.screenshot({ path: path.join(out, `${ime}-20-projekat.png`) });
  const h2 = await s.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < h2; y += 300) { await s.evaluate(y => scrollTo(0, y), y); await s.waitForTimeout(50); }
  await s.waitForTimeout(1500);
  await s.screenshot({ path: path.join(out, `${ime}-21-projekat-dno.png`) });
  console.log(ime, 'greške:', greske.length ? greske : 'nema');
  await ctx.close();
}
await b.close();
