// Egyszínű vonalas ikonok a kézikönyv szabályai szerint: 24px rács, 1.75 vonalvastagság,
// kerek végek, currentColor. Ideiglenes rajzok, amíg a design systembe fel nem kerülnek az
// eredeti SVG fájlok (assets/Ikonok); akkor itt kell kicserélni az útvonalakat.
import htm from '../../vendor/htm.module.js';

const html = htm.bind(window.React.createElement);

const UTAK = {
  kocka: html`<rect x="4" y="4" width="16" height="16" rx="3"/><circle cx="8.5" cy="8.5" r="1.1" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.1" fill="currentColor" stroke="none"/><circle cx="15.5" cy="15.5" r="1.1" fill="currentColor" stroke="none"/>`,
  sarkanykocka: html`<path d="M12 3 20 7.5v9L12 21l-8-4.5v-9z"/><path d="M4 7.5 12 12l8-4.5M12 12v9"/>`,
  egeszseg: html`<path d="M12 20s-7.5-4.6-7.5-10.2A4.2 4.2 0 0 1 12 7.2a4.2 4.2 0 0 1 7.5 2.6C19.5 15.4 12 20 12 20z"/>`,
  magia: html`<path d="M12 3.5 13.8 10.2 20.5 12l-6.7 1.8L12 20.5l-1.8-6.7L3.5 12l6.7-1.8z"/>`,
  vedekezes: html`<path d="M12 3.5 19 6.2v5.2c0 4.3-2.9 7.6-7 9.1-4.1-1.5-7-4.8-7-9.1V6.2z"/>`,
  tekercs: html`<path d="M7 4h10.5A1.5 1.5 0 0 1 19 5.5V18a2 2 0 0 1-2 2H8"/><path d="M7 4a2 2 0 0 0-2 2v1.5h2M7 4v14a2 2 0 0 0 2 2"/><path d="M10 9h6M10 12.5h6M10 16h3.5"/>`,
  kard: html`<path d="M19.5 4.5 10 14M19.5 4.5h-3.5M19.5 4.5V8"/><path d="M7 11l6 6M9.5 14.5 5 19M4 18l2 2"/>`,
  terkep: html`<path d="M3.5 6.5 9 4.5l6 2 5.5-2v13l-5.5 2-6-2-5.5 2z"/><path d="M9 4.5v13M15 6.5v13"/>`,
  menu: html`<path d="M4 7h16M4 12h16M4 17h16"/>`,
  bezar: html`<path d="M6 6l12 12M18 6 6 18"/>`,
  kilepes: html`<path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4"/><path d="M9.5 8 5.5 12l4 4M5.5 12H15"/>`,
  felhasznalo: html`<circle cx="12" cy="8.5" r="3.75"/><path d="M4.5 20a7.5 7.5 0 0 1 15 0"/>`,
  konyv: html`<path d="M5 18.5V5.5A2 2 0 0 1 7 3.5h12v14H7a2 2 0 0 0-2 2 2 2 0 0 0 2 2h12"/><path d="M9 7.5h6"/>`,
  torony: html`<path d="M6 20.5V9h12v11.5M6 9V4.5h2.5V7h2V4.5h3V7h2V4.5H18V9"/><path d="M4 20.5h16M10.5 20.5v-4a1.5 1.5 0 0 1 3 0v4"/>`,
  hold: html`<path d="M19.5 14.5A7.5 7.5 0 1 1 9.5 4.5a6 6 0 0 0 10 10z"/>`,
  nap: html`<circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4"/>`,
  vissza: html`<path d="M14.5 6 8.5 12l6 6"/>`,
  plusz: html`<path d="M12 5v14M5 12h14"/>`
};

// Ikon. Felirat nélkül dekoráció (aria-hidden); ha önmagában áll, adj cimke-t.
export function Ikon({ nev, meret = 24, cimke }) {
  return html`<svg className="ikon" width=${meret} height=${meret} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"
    aria-hidden=${cimke ? undefined : 'true'} role=${cimke ? 'img' : undefined} aria-label=${cimke}>${UTAK[nev] || null}</svg>`;
}
