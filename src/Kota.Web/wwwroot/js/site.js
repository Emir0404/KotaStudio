// Kota: JavaScript only "brings the page to life" (menu, clock, reveal on scroll, parallax, cursor).
// All content comes from C#; without this file the page is fully readable.
(() => {
  'use strict';
  const manjePokreta = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const miš = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const $ = (s, k = document) => k.querySelector(s);
  const $$ = (s, k = document) => [...k.querySelectorAll(s)];
  const ogranici = (v, a, b) => Math.min(b, Math.max(a, v));

  // ---------- Clock in Sarajevo (24 hours) ----------
  const sat = $('[data-sat]');
  if (sat) {
    try {
      const f = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Sarajevo', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' });
      const osvjezi = () => { sat.textContent = f.format(new Date()); };
      osvjezi();
      setInterval(osvjezi, 1000);
    } catch { /* ostaje prazan prikaz */ }
  }

  // ---------- Full-screen menu ----------
  const dugme = $('#meni-dugme');
  const meni = $('#meni');
  const postavi = (otvoren) => {
    document.documentElement.classList.toggle('meni-otvoren', otvoren);
    dugme.setAttribute('aria-expanded', String(otvoren));
    meni.setAttribute('aria-hidden', String(!otvoren));
    $('.meni-tekst', dugme).textContent = otvoren ? 'Zatvori' : 'Meni';
  };
  if (dugme && meni) {
    dugme.addEventListener('click', () => postavi(!document.documentElement.classList.contains('meni-otvoren')));
    $$('a', meni).forEach((a) => a.addEventListener('click', () => postavi(false)));
    addEventListener('keydown', (e) => { if (e.key === 'Escape') postavi(false); });
    // A wide screen does not need the menu, so we close it.
    matchMedia('(min-width: 820px)').addEventListener('change', (e) => { if (e.matches) postavi(false); });
  }

  // ---------- Statement: words light up while scrolling ----------
  const izjava = $('[data-rijeci]');
  let rijeci = [];
  if (izjava && !manjePokreta) {
    izjava.setAttribute('aria-label', izjava.textContent.replace(/\s+/g, ' ').trim());
    // We turn every word (also inside highlighted parts) into its own span that lights up on scroll.
    const razbij = (roditelj) => {
      for (const cvor of [...roditelj.childNodes]) {
        if (cvor.nodeType === Node.ELEMENT_NODE) { razbij(cvor); continue; }
        if (cvor.nodeType !== Node.TEXT_NODE) continue;
        const dijelovi = cvor.textContent.split(/(\s+)/).filter((d) => d !== '');
        const okvir = document.createDocumentFragment();
        for (const d of dijelovi) {
          if (/^\s+$/.test(d)) { okvir.appendChild(document.createTextNode(' ')); continue; }
          const s = document.createElement('span');
          s.className = 'rijec';
          s.setAttribute('aria-hidden', 'true');
          s.textContent = d;
          okvir.appendChild(s);
          rijeci.push(s);
        }
        roditelj.replaceChild(okvir, cvor);
      }
    };
    razbij(izjava);
  }

  // ---------- Reveal on scroll (by position, not IntersectionObserver, which skips elements on fast scrolling) ----------
  const otkrij = $$('[data-otkrij]');
  $$('.tim, .brojke').forEach((lista) => $$(':scope > li', lista).forEach((li, i) => li.style.setProperty('--kasni', `${i * 0.09}s`)));

  // ---------- Counting ----------
  const brojevi = $$('[data-broj]');
  const brojanje = new WeakSet();
  const izbroji = (el) => {
    const cilj = Number(el.dataset.broj);
    if (manjePokreta) return;
    const poc = performance.now(), trajanje = 1700;
    const korak = (t) => {
      const p = ogranici((t - poc) / trajanje, 0, 1);
      el.textContent = Math.round(cilj * (1 - Math.pow(1 - p, 4)));
      if (p < 1) requestAnimationFrame(korak);
    };
    requestAnimationFrame(korak);
  };
  if (!manjePokreta) brojevi.forEach((el) => { el.textContent = '0'; });

  const zaglavlje = $('#zaglavlje');
  const tamne = $$('.hero-okvir, .pr-okvir, .pr-dalje, .kontakt, .podnozje, .studio-slika');

  // ---------- Parallax ----------
  const paralaksa = $$('[data-paralaksa]');
  const paralaksaUnutra = $$('[data-paralaksa-unutra]');

  const crtaj = () => {
    const vh = innerHeight;
    const y = scrollY;

    // words
    if (rijeci.length) {
      const r = izjava.getBoundingClientRect();
      const p = ogranici((vh * 0.82 - r.top) / (r.height + vh * 0.28), 0, 1);
      const n = Math.round(p * rijeci.length);
      rijeci.forEach((s, i) => s.classList.toggle('upaljena', i < n));
    }

    // header: white letters when a photo or a dark section is under it
    if (zaglavlje) {
      const ispod = tamne.some((s) => { const r = s.getBoundingClientRect(); return r.top <= 36 && r.bottom >= 36; });
      zaglavlje.classList.toggle('na-tamnom', ispod);
      zaglavlje.classList.toggle('s-pozadinom', !ispod && y > 30);
    }

    // reveal
    for (const el of otkrij) {
      if (el.classList.contains('vidljivo')) continue;
      if (el.getBoundingClientRect().top < vh * 0.9) el.classList.add('vidljivo');
    }

    // numbers
    for (const el of brojevi) {
      if (brojanje.has(el)) continue;
      if (el.getBoundingClientRect().top < vh * 0.92) { brojanje.add(el); izbroji(el); }
    }

    if (manjePokreta) return;

    // parallax of the hero image
    for (const el of paralaksa) {
      if (y < vh * 1.3) el.style.transform = `translate3d(0, ${y * Number(el.dataset.paralaksa)}px, 0)`;
    }
    for (const el of paralaksaUnutra) {
      const r = el.getBoundingClientRect();
      if (r.bottom < 0 || r.top > vh) continue;
      const p = (r.top + r.height / 2 - vh / 2) / vh; // -1..1
      const img = el.firstElementChild;
      img.style.transform = `translate3d(0, ${p * Number(el.dataset.paralaksaUnutra) * -100}px, 0)`;
    }

  };

  let zakazano = false;
  const zatrazi = () => {
    if (zakazano) return;
    zakazano = true;
    requestAnimationFrame(() => { zakazano = false; crtaj(); });
  };
  addEventListener('scroll', zatrazi, { passive: true });
  addEventListener('resize', zatrazi);
  addEventListener('load', zatrazi);
  crtaj();

  // ---------- Cursor and magnetic buttons (mouse only) ----------
  const kursor = $('#kursor');
  if (miš && kursor && !manjePokreta) {
    const natpis = $('span', kursor);
    let x = -100, y = -100, cx = x, cy = y, cilj = null;
    addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      x = e.clientX; y = e.clientY;
      const el = e.target.closest ? e.target.closest('[data-kursor]') : null;
      if (el !== cilj) {
        cilj = el;
        kursor.classList.toggle('aktivan', !!el);
        if (el) natpis.textContent = el.dataset.kursor;
      }
    }, { passive: true });
    document.documentElement.addEventListener('pointerleave', () => { cilj = null; kursor.classList.remove('aktivan'); });
    const prati = () => {
      cx += (x - cx) * 0.2; cy += (y - cy) * 0.2;
      kursor.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
      requestAnimationFrame(prati);
    };
    prati();

    $$('.magnet').forEach((el) => {
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const dx = (e.clientX - (r.left + r.width / 2)) / r.width;
        const dy = (e.clientY - (r.top + r.height / 2)) / r.height;
        el.style.transform = `translate(${dx * 16}px, ${dy * 12}px)`;
      });
      el.addEventListener('pointerleave', () => { el.style.transform = ''; });
    });
  }
})();
