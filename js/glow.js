/* SHEDITHERS — hover glow: every word you point at lights up in one of the artist's muted colours (picked once, then kept). */
(() => {
  const GLOW = ['#e0473c', '#d9822b', '#d6b13a', '#8fa04a', '#4f9c95', '#5f7fc0', '#9a5bb0', '#c45a86'];
  const SEL = 'a,button,[role=button],label,summary,h1,h2,h3,h4,b,.nm,.fx-name,.tkt,.cu,.pt-bar,.tt-tag,.p-mini-info,.d3-title,.d3-look,.ab-h,.fx-cat-h';
  document.addEventListener('mouseover', e => {
    if (!e.target.closest || e.target.closest('.walk')) return; // the intro flyer is printed paper, it doesn't glow
    const el = e.target.closest(SEL); if (!el|| el.style.getPropertyValue('--glow')) return;
    el.style.setProperty('--glow', GLOW[Math.floor(Math.random() * GLOW.length)]);
  }, { passive: true });
})();
