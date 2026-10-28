import type { ItemId } from '../data/destinations';

/**
 * Collectible artwork. Each function returns SVG markup centered on (0,0)
 * inside a ~48x48 box. `silhouette` renders the flat version used by the
 * HUD chips before the item is discovered.
 */
export type ItemArt = (opts?: { silhouette?: boolean }) => string;

const INK = '#201338', CREAM = '#FFF6E8';
const S = 'fill="currentColor"';

const art = (silhouette: string, full: string): ItemArt => (o) => (o?.silhouette ? silhouette : full);

export const ITEM_ART: Record<ItemId, ItemArt> = {
  coconut: art(
    `<circle r="20" ${S}/><rect x="2" y="-30" width="4" height="16" ${S}/>`,
    `<circle r="20" fill="#5FAF4E"/>
     <path d="M-20 0 a20 20 0 0 0 40 0 Z" fill="#4E9A3E"/>
     <ellipse cx="0" cy="-10" rx="11" ry="5" fill="#F4EBC8"/>
     <ellipse cx="0" cy="-10" rx="6" ry="2.5" fill="#FFFDF5"/>
     <path d="M3 -12 l6 -20" stroke="#F58324" stroke-width="4" stroke-linecap="round"/><path d="M9 -32 l5 2" stroke="#F58324" stroke-width="4" stroke-linecap="round"/>
     <path d="M-14 -4 q-4 8 0 16" stroke="#8BD37A" stroke-width="3" fill="none" stroke-linecap="round" opacity="0.8"/>`),
  football: art(
    `<circle r="20" ${S}/>`,
    `<circle r="20" fill="${CREAM}" stroke="${INK}" stroke-width="2"/>
     <polygon points="0,-8 7.6,-2.5 4.7,6.5 -4.7,6.5 -7.6,-2.5" fill="${INK}"/>
     <g stroke="${INK}" stroke-width="2" stroke-linecap="round"><path d="M0 -8 L0 -18 M7.6 -2.5 L16 -6 M4.7 6.5 L10 15 M-4.7 6.5 L-10 15 M-7.6 -2.5 L-16 -6"/></g>
     <g fill="${INK}"><path d="M0 -18 l6 -3 l5 6 l-5 4 Z"/><path d="M16 -6 l4 4 l-2 8 l-6 -3 Z"/><path d="M10 15 l1 5 l-8 1 l-1 -5 Z"/><path d="M-16 -6 l-4 4 l2 8 l6 -3 Z"/></g>
     <circle cx="-7" cy="-9" r="3" fill="#fff" opacity="0.7"/>`),
  acai: art(
    `<path d="M-22 -6 L22 -6 L14 18 L-14 18 Z" ${S}/>`,
    `<path d="M-22 -6 L22 -6 L14 18 L-14 18 Z" fill="${CREAM}" stroke="#D9C9B8" stroke-width="2"/>
     <ellipse rx="21" ry="8" cy="-6" fill="#5B2A86"/>
     <ellipse rx="14" ry="4" cy="-8" fill="#7A3FB0" opacity="0.6"/>
     <circle cx="-9" cy="-9" r="3.5" fill="#F7E27A" stroke="#C9A33D" stroke-width="1"/>
     <circle cx="0" cy="-11" r="3.5" fill="#F7E27A" stroke="#C9A33D" stroke-width="1"/>
     <circle cx="9" cy="-9" r="3.5" fill="#F7E27A" stroke="#C9A33D" stroke-width="1"/>
     <g fill="#A86D37"><circle cx="-14" cy="-6" r="1.5"/><circle cx="5" cy="-5" r="1.5"/><circle cx="14" cy="-7" r="1.5"/></g>
     <path d="M16 -4 l6 -14" stroke="#F58324" stroke-width="3" stroke-linecap="round"/>`),
  azulejo: art(
    `<rect x="-20" y="-20" width="40" height="40" rx="3" ${S}/>`,
    `<rect x="-20" y="-20" width="40" height="40" rx="3" fill="${CREAM}" stroke="#2E6FD8" stroke-width="2"/>
     <g fill="#2E6FD8"><path d="M0 -14 q6 8 0 14 q-6 -6 0 -14 Z"/><path d="M0 14 q6 -8 0 -14 q-6 6 0 14 Z"/><path d="M-14 0 q8 6 14 0 q-6 -6 -14 0 Z"/><path d="M14 0 q-8 6 -14 0 q6 -6 14 0 Z"/></g>
     <circle r="3.5" fill="#2E6FD8"/>
     <g fill="none" stroke="#2E6FD8" stroke-width="1.5"><path d="M-16 -16 q6 2 8 8 M16 -16 q-6 2 -8 8 M-16 16 q6 -2 8 -8 M16 16 q-6 -2 -8 -8"/></g>
     <circle cx="-13" cy="-13" r="1.5" fill="#2E6FD8"/><circle cx="13" cy="-13" r="1.5" fill="#2E6FD8"/><circle cx="-13" cy="13" r="1.5" fill="#2E6FD8"/><circle cx="13" cy="13" r="1.5" fill="#2E6FD8"/>`),
  tram: art(
    `<rect x="-22" y="-14" width="44" height="26" rx="5" ${S}/><rect x="-2" y="-24" width="4" height="10" ${S}/>`,
    `<path d="M-2 -24 l2 -4 l2 4" stroke="${INK}" stroke-width="2" fill="none"/><rect x="-14" y="-23" width="28" height="3" rx="1.5" fill="${INK}"/>
     <rect x="-22" y="-14" width="44" height="26" rx="6" fill="#F2C94C" stroke="${INK}" stroke-width="2"/>
     <rect x="-22" y="-20" width="44" height="8" rx="4" fill="${CREAM}" stroke="${INK}" stroke-width="2"/>
     <rect x="-17" y="-9" width="9" height="10" rx="1.5" fill="#9ED5F5" stroke="${INK}" stroke-width="1.5"/>
     <rect x="-4" y="-9" width="9" height="10" rx="1.5" fill="#9ED5F5" stroke="${INK}" stroke-width="1.5"/>
     <rect x="9" y="-9" width="9" height="10" rx="1.5" fill="#9ED5F5" stroke="${INK}" stroke-width="1.5"/>
     <rect x="-22" y="4" width="44" height="4" fill="#D9534F"/>
     <circle cx="-12" cy="14" r="4" fill="${INK}"/><circle cx="12" cy="14" r="4" fill="${INK}"/>
     <rect x="-6" y="-18" width="12" height="4" rx="1" fill="#D9534F"/>`),
  nata: art(
    `<ellipse rx="21" ry="15" ${S}/>`,
    `<ellipse rx="21" ry="15" fill="#C98A3A"/>
     <path d="M-21 0 a21 15 0 0 0 42 0 Z" fill="#A86A28"/>
     <g fill="#E0A552"><circle cx="-18" cy="-6" r="4"/><circle cx="-11" cy="-11" r="4"/><circle cx="-3" cy="-13" r="4"/><circle cx="5" cy="-13" r="4"/><circle cx="13" cy="-10" r="4"/><circle cx="19" cy="-5" r="4"/></g>
     <ellipse rx="15" ry="10" cy="-1" fill="#F6D98A"/>
     <ellipse rx="11" ry="6" cy="-3" fill="#FFE8A6"/>
     <ellipse cx="-5" cy="-4" rx="4.5" ry="3" fill="#7A3F12"/><ellipse cx="5" cy="0" rx="3.5" ry="2.5" fill="#A05A1E"/><ellipse cx="7" cy="-6" rx="2" ry="1.5" fill="#A05A1E"/>
     <g fill="#8C4F1D" opacity="0.5"><circle cx="-10" cy="1" r="0.9"/><circle cx="0" cy="3" r="0.9"/><circle cx="11" cy="-3" r="0.9"/></g>`),
  francesinha: art(
    `<rect x="-19" y="-16" width="38" height="32" rx="4" ${S}/>`,
    `<rect x="-19" y="-16" width="38" height="32" rx="4" fill="#E8B04B" stroke="#8C4F1D" stroke-width="2"/>
     <rect x="-19" y="-5" width="38" height="6" fill="#A5503A"/>
     <rect x="-19" y="1" width="38" height="5" fill="#F6D98A"/>
     <rect x="-19" y="6" width="38" height="4" fill="#C96A3F"/>
     <path d="M-19 -16 h38 v6 q-10 6 -19 2 q-9 4 -19 -2 Z" fill="#F7A072"/>
     <ellipse cx="2" cy="-12" rx="9" ry="6" fill="${CREAM}"/><circle cx="2" cy="-12" r="3.5" fill="#F2C94C"/>
     <g fill="#F2C94C"><rect x="-26" y="2" width="3" height="12" rx="1"/><rect x="-22" y="-1" width="3" height="15" rx="1" transform="rotate(-8 -21 7)"/></g>`),
  bondinho: art(
    `<path d="M-24 -22 h48" ${S}/><rect x="-16" y="-12" width="32" height="26" rx="6" ${S}/>`,
    `<path d="M-26 -24 h52" stroke="${INK}" stroke-width="2.5"/>
     <path d="M-4 -24 l4 8 l4 -8" stroke="${INK}" stroke-width="2.5" fill="none"/>
     <rect x="-16" y="-14" width="32" height="28" rx="7" fill="${CREAM}" stroke="${INK}" stroke-width="2"/>
     <rect x="-16" y="-14" width="32" height="10" rx="5" fill="#2E6FD8"/>
     <rect x="-12" y="-6" width="9" height="12" rx="2" fill="#9ED5F5" stroke="${INK}" stroke-width="1.5"/>
     <rect x="3" y="-6" width="9" height="12" rx="2" fill="#9ED5F5" stroke="${INK}" stroke-width="1.5"/>
     <rect x="-16" y="8" width="32" height="4" fill="#F58324"/>
     <path d="M-6 -16 l6 -6 l6 6" fill="${INK}"/>`),
  violao: art(
    `<path d="M-6 -24 h8 v14 q14 4 14 16 a12 12 0 0 1 -24 0 a10 10 0 0 1 -6 -10 q0 -4 8 -6 Z" ${S}/>`,
    `<g transform="rotate(-25)">
       <rect x="-3" y="-30" width="6" height="24" fill="#5A3A20"/>
       <rect x="-4.5" y="-32" width="9" height="6" rx="1.5" fill="${INK}"/>
       <path d="M-9 -8 Q-14 -8 -14 0 Q-14 6 -10 8 Q-17 12 -16 20 A16 14 0 0 0 16 20 Q17 12 10 8 Q14 6 14 0 Q14 -8 9 -8 Z" fill="#E8B04B" stroke="#8C4F1D" stroke-width="2" stroke-linejoin="round"/>
       <circle cx="0" cy="6" r="4.5" fill="#3E2412"/>
       <rect x="-5" y="18" width="10" height="3" rx="1" fill="#3E2412"/>
       <path d="M-1.5 -30 v49 M0 -30 v49 M1.5 -30 v49" stroke="${CREAM}" stroke-width="0.8" opacity="0.8"/>
     </g>`),
  pandeiro: art(
    `<circle r="21" ${S}/>`,
    `<circle r="21" fill="#C98A3A"/>
     <circle r="16" fill="#F6E3C0"/>
     <circle r="16" fill="none" stroke="#B27B2E" stroke-width="1.5"/>
     <g fill="#E8E0D0" stroke="#8C6A3A" stroke-width="1"><rect x="-3" y="-22" width="6" height="5" rx="1"/><rect x="-3" y="17" width="6" height="5" rx="1"/><rect x="-22" y="-3" width="5" height="6" rx="1"/><rect x="17" y="-3" width="5" height="6" rx="1"/><rect x="12" y="-18" width="6" height="5" rx="1" transform="rotate(45 15 -15)"/><rect x="-18" y="-18" width="6" height="5" rx="1" transform="rotate(-45 -15 -15)"/><rect x="12" y="13" width="6" height="5" rx="1" transform="rotate(-45 15 15)"/><rect x="-18" y="13" width="6" height="5" rx="1" transform="rotate(45 -15 15)"/></g>
     <path d="M-8 -6 q8 -6 16 0" stroke="#B27B2E" stroke-width="1.5" fill="none" opacity="0.5"/>`),
  mask: art(
    `<path d="M-22 -4 Q-20 -18 0 -16 Q20 -18 22 -4 Q18 14 0 12 Q-18 14 -22 -4 Z" ${S}/>`,
    `<g fill="#F2C94C"><path d="M-12 -16 l-6 -14 l10 8 Z"/><path d="M12 -16 l6 -14 l-10 8 Z"/><path d="M-4 -18 l2 -14 l4 14 Z"/></g>
     <g fill="#7845D8"><path d="M-14 -17 l-4 -10 l8 6 Z"/><path d="M14 -17 l4 -10 l-8 6 Z"/></g>
     <path d="M-22 -4 Q-20 -18 0 -16 Q20 -18 22 -4 Q18 14 0 12 Q-18 14 -22 -4 Z" fill="#7845D8" stroke="#F2C94C" stroke-width="2"/>
     <ellipse cx="-9" cy="-3" rx="6" ry="4" fill="#201338"/><ellipse cx="9" cy="-3" rx="6" ry="4" fill="#201338"/>
     <g fill="#1FA463"><circle cx="-16" cy="-10" r="2.5"/><circle cx="16" cy="-10" r="2.5"/><circle cx="0" cy="-12" r="2.5"/></g>
     <path d="M-6 6 q6 4 12 0" stroke="#F2C94C" stroke-width="2" fill="none" stroke-linecap="round"/>
     <path d="M22 -2 l8 6" stroke="#201338" stroke-width="2.5" stroke-linecap="round"/>`),
  martelinho: art(
    `<rect x="-20" y="-20" width="40" height="18" rx="6" ${S}/><rect x="-4" y="-4" width="8" height="26" rx="3" ${S}/>`,
    `<rect x="-4" y="-6" width="8" height="28" rx="3" fill="#F2C94C" stroke="#201338" stroke-width="1.5"/>
     <rect x="-20" y="-22" width="40" height="20" rx="7" fill="#D9534F" stroke="#201338" stroke-width="1.5"/>
     <rect x="-20" y="-22" width="12" height="20" rx="6" fill="#2E6FD8"/><rect x="8" y="-22" width="12" height="20" rx="6" fill="#2E6FD8"/>
     <circle cx="-14" cy="-12" r="2.5" fill="${CREAM}"/><circle cx="14" cy="-12" r="2.5" fill="${CREAM}"/>
     <path d="M-6 -14 q6 -4 12 0" stroke="${CREAM}" stroke-width="1.5" fill="none" opacity="0.6"/>
     <g fill="#F58324"><circle cx="-24" cy="-26" r="1.6"/><circle cx="24" cy="-26" r="1.6"/><circle cx="0" cy="-28" r="1.6"/></g>`),
  balloon: art(
    `<path d="M-16 -4 Q-16 -26 0 -26 Q16 -26 16 -4 Q16 8 6 14 L-6 14 Q-16 8 -16 -4 Z" ${S}/><rect x="-5" y="18" width="10" height="6" ${S}/>`,
    `<path d="M-16 -4 Q-16 -26 0 -26 Q16 -26 16 -4 Q16 8 6 14 L-6 14 Q-16 8 -16 -4 Z" fill="#F58324" stroke="#C5611A" stroke-width="1.5"/>
     <path d="M-6 -24 Q-10 -6 -5 13" stroke="#F2C94C" stroke-width="3" fill="none"/><path d="M6 -24 Q10 -6 5 13" stroke="#F2C94C" stroke-width="3" fill="none"/>
     <path d="M-15 -10 Q0 -4 15 -10" stroke="#7845D8" stroke-width="2" fill="none"/><path d="M-13 2 Q0 8 13 2" stroke="#7845D8" stroke-width="2" fill="none"/>
     <path d="M-6 14 L-5 20 M6 14 L5 20" stroke="#5A3A20" stroke-width="1.5"/>
     <rect x="-6" y="19" width="12" height="7" rx="2" fill="#8B5A2B" stroke="#5A3A20" stroke-width="1.5"/>
     <circle cx="0" cy="16" r="2.5" fill="#FFD966"/>`),
  rabelo: art(
    `<path d="M-23 6 L23 6 L15 18 L-15 18 Z" ${S}/><rect x="-2" y="-22" width="4" height="28" ${S}/><path d="M2 -20 L18 -6 L2 -2 Z" ${S}/>`,
    `<path d="M-23 6 L23 6 L15 18 L-15 18 Z" fill="#8B5A2B" stroke="#3E2412" stroke-width="2"/>
     <path d="M-23 6 L23 6" stroke="#3E2412" stroke-width="3"/>
     <path d="M-18 10 h36" stroke="#3E2412" stroke-width="1" opacity="0.5"/>
     <rect x="-2" y="-22" width="4" height="28" fill="#3E2412"/>
     <path d="M2 -20 L20 -6 L2 -2 Z" fill="${CREAM}" stroke="#3E2412" stroke-width="1.5"/>
     <g fill="#5A3A20"><ellipse cx="-10" cy="2" rx="5" ry="3.5"/><ellipse cx="0" cy="2" rx="5" ry="3.5"/><ellipse cx="10" cy="2" rx="5" ry="3.5"/></g>
     <path d="M-24 4 l-4 -6" stroke="#3E2412" stroke-width="2" stroke-linecap="round"/>`),
  brigadeiro: art(
    `<circle r="18" ${S}/>`,
    `<circle r="18" fill="#4A2A12"/>
     <circle r="18" fill="none" stroke="#2E1808" stroke-width="2"/>
     <g fill="#6B4323"><circle cx="-8" cy="-6" r="2.2"/><circle cx="2" cy="-12" r="2.2"/><circle cx="10" cy="-4" r="2.2"/><circle cx="-4" cy="6" r="2.2"/><circle cx="8" cy="8" r="2.2"/><circle cx="-12" cy="6" r="2.2"/><circle cx="0" cy="-2" r="2.2"/><circle cx="12" cy="-12" r="1.8"/></g>
     <path d="M-22 14 q22 10 44 0 l-2 6 q-20 8 -40 0 Z" fill="#F58324" opacity="0.9"/>
     <ellipse cx="-6" cy="-10" rx="4" ry="2.5" fill="#fff" opacity="0.25"/>`),
  apito: art(
    `<path d="M-20 -8 h26 a10 10 0 0 1 0 20 h-26 Z" ${S}/><circle cx="12" cy="2" r="12" ${S}/>`,
    `<path d="M-22 -8 h24 v16 h-24 Z" fill="#C0C7D0" stroke="#201338" stroke-width="2"/>
     <circle cx="10" cy="2" r="13" fill="#C0C7D0" stroke="#201338" stroke-width="2"/>
     <circle cx="10" cy="2" r="5" fill="#201338"/>
     <rect x="-22" y="-8" width="6" height="16" fill="#9AA3AD"/>
     <path d="M-16 -4 h12" stroke="#201338" stroke-width="1.5" opacity="0.5"/>
     <g fill="#1FA463"><circle cx="-12" cy="-16" r="2.5"/><circle cx="-4" cy="-18" r="2"/><circle cx="4" cy="-16" r="2.5"/></g>
     <path d="M-24 -10 q-6 10 0 22" stroke="#F2C94C" stroke-width="2.5" fill="none" stroke-linecap="round"/>`),
  sardine: art(
    `<path d="M-22 0 Q-6 -14 12 -8 L22 -16 L20 0 L22 16 L12 8 Q-6 14 -22 0 Z" ${S}/>`,
    `<path d="M-22 0 Q-6 -14 12 -8 L22 -16 L20 0 L22 16 L12 8 Q-6 14 -22 0 Z" fill="#7F9AB3" stroke="#3E4C5C" stroke-width="2"/>
     <path d="M-20 0 Q-6 -8 10 -4 Q-6 6 -20 0 Z" fill="#B9CBDB"/>
     <path d="M-8 -6 q6 -4 12 0 M-10 4 q6 4 12 0" stroke="#3E4C5C" stroke-width="1.5" fill="none" opacity="0.6"/>
     <circle cx="-14" cy="-2" r="2.5" fill="#201338"/><circle cx="-13.5" cy="-2.5" r="0.9" fill="#fff"/>
     <g stroke="#3E4C5C" stroke-width="1.5" opacity="0.7"><path d="M-2 -8 l2 -5 M4 -9 l3 -4 M-2 8 l2 5 M4 9 l3 4"/></g>
     <path d="M-24 18 h48" stroke="#5A3A20" stroke-width="2.5" stroke-linecap="round" opacity="0.6"/>`),
  manjerico: art(
    `<path d="M-14 4 h28 l-4 18 h-20 Z" ${S}/><circle r="16" cy="-8" ${S}/>`,
    `<path d="M-14 4 h28 l-4 18 h-20 Z" fill="#C96A3F" stroke="#8C4F1D" stroke-width="2"/>
     <rect x="-16" y="2" width="32" height="5" rx="2" fill="#E8B04B" stroke="#8C4F1D" stroke-width="1.5"/>
     <g fill="#3AA66A"><circle cx="-9" cy="-6" r="8"/><circle cx="9" cy="-6" r="8"/><circle cx="0" cy="-14" r="9"/><circle cx="0" cy="-3" r="8"/></g>
     <g fill="#6CCB8A" opacity="0.8"><circle cx="-6" cy="-10" r="3"/><circle cx="6" cy="-12" r="3"/><circle cx="2" cy="-2" r="3"/></g>
     <rect x="4" y="-30" width="1.5" height="16" fill="#8C4F1D"/>
     <circle cx="5" cy="-30" r="5" fill="#D9534F"/><circle cx="5" cy="-30" r="2.5" fill="#F08080"/>
     <rect x="-14" y="-24" width="12" height="9" fill="${CREAM}" stroke="#8C4F1D" stroke-width="1" transform="rotate(-10 -8 -20)"/>
     <path d="M-12 -21 h7 M-12 -18 h6" stroke="#7845D8" stroke-width="1" transform="rotate(-10 -8 -20)"/>`),
};

/** Obstacle art keyed by obstacle id, centered on (0,0). */
export const OBSTACLE_ART: Record<string, string> = {
  crab: `
    <g class="crab">
      <g stroke="#C7402E" stroke-width="4" fill="none" stroke-linecap="round"><path d="M-14 4 l-8 8 M-10 8 l-8 10 M14 4 l8 8 M10 8 l8 10"/></g>
      <ellipse rx="17" ry="11" cy="4" fill="#E0533B"/>
      <ellipse rx="10" ry="5" cy="7" fill="#F08A6A" opacity="0.5"/>
      <path d="M-16 -2 q-12 -14 -2 -18 q-4 8 2 10 Z" fill="#E0533B"/><path d="M16 -2 q12 -14 2 -18 q4 8 -2 10 Z" fill="#E0533B"/>
      <circle cx="-6" cy="-8" r="4" fill="${CREAM}"/><circle cx="6" cy="-8" r="4" fill="${CREAM}"/>
      <circle cx="-5" cy="-8" r="2" fill="${INK}"/><circle cx="7" cy="-8" r="2" fill="${INK}"/>
      <path d="M-4 2 q4 3 8 0" stroke="${INK}" stroke-width="1.5" fill="none" stroke-linecap="round"/>
    </g>`,
  urchin: `
    <g class="urchin">
      <g stroke="#3A2A5A" stroke-width="3" stroke-linecap="round"><path d="M0 -14 v-10 M0 14 v10 M-14 0 h-10 M14 0 h10 M-10 -10 l-7 -7 M10 10 l7 7 M10 -10 l7 -7 M-10 10 l-7 7 M-5 -13 l-3 -8 M5 13 l3 8 M13 -5 l8 -3 M-13 5 l-8 3 M5 -13 l3 -8 M-5 13 l-3 8 M13 5 l8 3 M-13 -5 l-8 -3"/></g>
      <circle r="15" fill="#4E3A78"/>
      <circle r="8" fill="#6A52A0"/>
      <circle cx="-4" cy="-4" r="2" fill="${CREAM}" opacity="0.6"/>
    </g>`,
  gull: `
    <g class="gull">
      <path class="wing wing-l" d="M-4 -2 q-14 -14 -28 -6 q10 2 14 10 Z" fill="${CREAM}" stroke="#9AA3AD" stroke-width="1.5"/>
      <path class="wing wing-r" d="M4 -2 q14 -14 28 -6 q-10 2 -14 10 Z" fill="${CREAM}" stroke="#9AA3AD" stroke-width="1.5"/>
      <ellipse rx="12" ry="7" fill="${CREAM}" stroke="#9AA3AD" stroke-width="1.5"/>
      <path d="M-12 2 l-8 4 l8 2 Z" fill="#9AA3AD"/>
      <circle cx="10" cy="-4" r="6" fill="${CREAM}" stroke="#9AA3AD" stroke-width="1.5"/>
      <circle cx="12" cy="-5" r="1.6" fill="${INK}"/>
      <path d="M15 -3 l8 1 l-8 3 Z" fill="#F58324"/>
    </g>`,
  crate: `
    <g class="crate">
      <rect x="-18" y="-16" width="36" height="32" rx="2" fill="#B07A3E" stroke="#5A3A20" stroke-width="2"/>
      <path d="M-18 -6 h36 M-18 6 h36" stroke="#5A3A20" stroke-width="2"/>
      <path d="M-18 -16 l36 32 M18 -16 l-36 32" stroke="#8C5A2E" stroke-width="3" opacity="0.6"/>
      <rect x="-8" y="-5" width="16" height="10" rx="1" fill="${CREAM}"/>
      <text y="2.5" text-anchor="middle" font-size="6" font-weight="700" fill="#5A3A20" font-family="inherit">PORTO</text>
    </g>`,
};

/** Small ticket icon used for coupons. */
export const TICKET_SVG = `<svg viewBox="0 0 32 24" class="ticket" aria-hidden="true"><path d="M2 4 h28 v5 a3 3 0 0 0 0 6 v5 h-28 v-5 a3 3 0 0 0 0 -6 z" fill="currentColor"/><path d="M11 6 v12" stroke="#FFF6E8" stroke-width="2" stroke-dasharray="2 2"/></svg>`;

/** Theme glyphs for the choice card and passport, centered on (0,0) in a ~28 box. */
export const THEME_ICONS: Record<string, string> = {
  food: `<path d="M-8 -11 v9 a4 4 0 0 0 8 0 v-9 M-4 -11 v20" stroke="currentColor" stroke-width="2.4" fill="none" stroke-linecap="round"/><path d="M5 -11 q6 2 6 9 l-3 2 v11" stroke="currentColor" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
  party: `<path d="M-6 8 a3.5 3.5 0 1 0 0.1 0 M7 4 a3.5 3.5 0 1 0 0.1 0 M-2.5 8 v-16 l13 -3 v15" stroke="currentColor" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
  culture: `<path d="M-11 -4 l11 -7 l11 7 Z" fill="currentColor"/><path d="M-8 -3 v10 M-3 -3 v10 M3 -3 v10 M8 -3 v10" stroke="currentColor" stroke-width="2.2"/><rect x="-11" y="8" width="22" height="3" fill="currentColor"/>`,
};
