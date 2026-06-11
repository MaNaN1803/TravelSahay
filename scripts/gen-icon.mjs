import { Resvg } from '@resvg/resvg-js';
import fs from 'node:fs';
import path from 'node:path';

const OUT = path.resolve('assets/images');

// Location-pin + open-diary mark. Blue brand, gold pages.
function mark(scale = 1, translate = 0) {
  return `
  <g transform="translate(${translate},${translate}) scale(${scale})">
    <!-- pin teardrop -->
    <path d="M512 866 C 428 724 308 600 308 426 A 204 204 0 1 1 716 426 C 716 600 596 724 512 866 Z"
      fill="#FFFFFF"/>
    <!-- inner ring -->
    <circle cx="512" cy="426" r="150" fill="url(#ring)"/>
    <!-- open book pages -->
    <path d="M512 372 C 482 354 436 350 400 362 L400 472 C 436 460 482 464 512 484 Z" fill="url(#gold)"/>
    <path d="M512 372 C 542 354 588 350 624 362 L624 472 C 588 460 542 464 512 484 Z" fill="url(#goldB)"/>
    <!-- spine -->
    <rect x="506" y="368" width="12" height="120" rx="6" fill="#B8901F"/>
    <!-- page lines -->
    <path d="M430 392 C 458 384 486 386 504 396" stroke="#9C7A18" stroke-width="7" fill="none" stroke-linecap="round"/>
    <path d="M430 420 C 458 412 486 414 504 424" stroke="#9C7A18" stroke-width="7" fill="none" stroke-linecap="round"/>
    <path d="M520 396 C 538 386 566 384 594 392" stroke="#9C7A18" stroke-width="7" fill="none" stroke-linecap="round"/>
    <path d="M520 424 C 538 414 566 412 594 420" stroke="#9C7A18" stroke-width="7" fill="none" stroke-linecap="round"/>
    <!-- sparkle -->
    <path d="M690 250 l14 34 34 14 -34 14 -14 34 -14 -34 -34 -14 34 -14 z" fill="#D4AF37"/>
  </g>`;
}

const defs = `
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#0B1B3A"/>
      <stop offset="1" stop-color="#2563EB"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.72" cy="0.22" r="0.7">
      <stop offset="0" stop-color="#D4AF37" stop-opacity="0.28"/>
      <stop offset="1" stop-color="#D4AF37" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#F2D272"/>
      <stop offset="1" stop-color="#C9A227"/>
    </linearGradient>
    <linearGradient id="goldB" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#E7C463"/>
      <stop offset="1" stop-color="#B8901F"/>
    </linearGradient>
    <radialGradient id="ring" cx="0.5" cy="0.45" r="0.6">
      <stop offset="0" stop-color="#10306A"/>
      <stop offset="1" stop-color="#0B1B3A"/>
    </radialGradient>
  </defs>`;

const full = `<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  ${defs}
  <rect width="1024" height="1024" fill="url(#bg)"/>
  <rect width="1024" height="1024" fill="url(#glow)"/>
  ${mark(0.86, 72)}
</svg>`;

const transparent = `<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  ${defs}
  ${mark(0.62, 195)}
</svg>`;

const bgOnly = `<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  ${defs}
  <rect width="1024" height="1024" fill="url(#bg)"/>
  <rect width="1024" height="1024" fill="url(#glow)"/>
</svg>`;

function render(svg, size, out) {
  const r = new Resvg(svg, { fitTo: { mode: 'width', value: size } });
  fs.writeFileSync(path.join(OUT, out), r.render().asPng());
  console.log('✓', out, size);
}

render(full, 1024, 'icon.png');
render(transparent, 1024, 'splash-icon.png');
render(transparent, 1024, 'android-icon-foreground.png');
render(bgOnly, 1024, 'android-icon-background.png');
render(full, 64, 'favicon.png');
console.log('done');
