import type { DestinationId } from '../data/destinations';

/**
 * Scene artwork per destination, as tileable parallax layers.
 * Each layer repeats every `width` scene units and scrolls at `speed` times
 * the world speed. Layers are painted in order; `front` layers are painted
 * over the fox and entities (foreground occluders).
 * Coordinates are in the 360 x 720 scene viewBox. The play band is where
 * the fox and entities move. Ambient motion (waves, palms, boats, clouds)
 * uses CSS classes defined in styles.css; they pause with the game.
 */
export interface ParallaxLayer {
  speed: number;
  width: number;
  markup: string;
}

export interface SceneArt {
  /** Page background color shown around the scene. */
  bg: string;
  /** Vertical band (scene units) where the fox and entities move. */
  band: { top: number; bottom: number };
  /** Static backdrop (sky gradient etc.), not scrolled. */
  backdrop: string;
  layers: ParallaxLayer[];
  front: ParallaxLayer[];
}

// ---------- shared pieces ----------

const palm = (x: number, y: number, h: number, lean = 0, s = 1) => `
  <g class="palm" transform="translate(${x} ${y}) scale(${s})">
    <path d="M0 0 Q${lean * 0.5} ${-h * 0.5} ${lean} ${-h}" stroke="#8B5A2B" stroke-width="11" fill="none" stroke-linecap="round"/>
    <path d="M0 0 Q${lean * 0.5} ${-h * 0.5} ${lean} ${-h}" stroke="#A86D37" stroke-width="5" fill="none" stroke-linecap="round" stroke-dasharray="6 9"/>
    <g transform="translate(${lean} ${-h})"><g class="palm-crown">
      <path d="M0 0 Q-40 -30 -78 -12 Q-44 -12 -8 6 Z" fill="#2E8B57"/>
      <path d="M0 0 Q40 -30 78 -12 Q44 -12 8 6 Z" fill="#2E8B57"/>
      <path d="M0 0 Q-30 -52 -62 -58 Q-34 -34 -6 -4 Z" fill="#3AA66A"/>
      <path d="M0 0 Q30 -52 62 -58 Q34 -34 6 -4 Z" fill="#3AA66A"/>
      <path d="M0 0 Q-8 -60 -26 -74 Q-10 -40 2 -4 Z" fill="#2E8B57"/>
      <path d="M0 0 Q8 -60 30 -70 Q12 -40 -2 -4 Z" fill="#3AA66A"/>
      <path d="M0 2 Q-36 10 -64 34 Q-30 12 -6 10 Z" fill="#27794B"/>
      <path d="M0 2 Q36 10 64 34 Q30 12 6 10 Z" fill="#27794B"/>
      <circle cx="-6" cy="4" r="5" fill="#7A4B2A"/><circle cx="5" cy="6" r="5" fill="#7A4B2A"/><circle cx="0" cy="-2" r="5" fill="#8B5A2B"/>
    </g></g>
  </g>`;

const cloud = (x: number, y: number, s = 1, cls = '') => `
  <g transform="translate(${x} ${y}) scale(${s})"><g class="cloud ${cls}">
    <ellipse cx="0" cy="0" rx="34" ry="14" fill="#FFF6E8"/>
    <circle cx="-12" cy="-8" r="14" fill="#FFF6E8"/><circle cx="8" cy="-10" r="17" fill="#FFF6E8"/><circle cx="24" cy="-2" r="11" fill="#FFF6E8"/>
  </g></g>`;

const umbrella = (x: number, y: number, c1: string, c2: string) => `
  <g transform="translate(${x} ${y})">
    <rect x="-1.5" y="-50" width="3" height="52" fill="#FFF6E8"/>
    <path d="M-34 -48 Q0 -80 34 -48 Z" fill="${c1}"/>
    <path d="M-20 -48 Q-10 -74 0 -78 Q10 -74 20 -48 Z" fill="${c2}"/>
    <path d="M-34 -48 Q-24 -44 -14 -48 Q-4 -44 6 -48 Q16 -44 26 -48 Q30 -47 34 -48" fill="none" stroke="${c1}" stroke-width="3"/>
  </g>`;

const kiosk = (x: number, y: number) => `
  <g transform="translate(${x} ${y})">
    <rect x="-30" y="-46" width="60" height="46" rx="4" fill="#FFF6E8"/>
    <rect x="-30" y="-46" width="60" height="10" fill="#1FA463"/>
    <path d="M-34 -36 Q0 -64 34 -36 Z" fill="#F58324"/>
    <rect x="-20" y="-30" width="40" height="14" rx="2" fill="#5EC8F2"/>
    <circle cx="-8" cy="-23" r="4" fill="#3AA66A"/><circle cx="4" cy="-23" r="4" fill="#3AA66A"/><circle cx="14" cy="-23" r="4" fill="#3AA66A"/>
    <rect x="-24" y="-10" width="48" height="4" fill="#F3DFA3"/>
  </g>`;

const sailboat = (x: number, y: number, s = 1) => `
  <g transform="translate(${x} ${y}) scale(${s})"><g class="boat">
    <path d="M-18 0 L18 0 L12 8 L-12 8 Z" fill="#FFF6E8"/>
    <rect x="-1" y="-30" width="2" height="30" fill="#201338"/>
    <path d="M1 -28 L16 -4 L1 -4 Z" fill="#F58324"/>
    <path d="M-1 -24 L-12 -4 L-1 -4 Z" fill="#FFF6E8"/>
  </g></g>`;

const gullFar = (x: number, y: number) => `<path class="gull-far" d="M${x - 8} ${y} q4 -5 8 0 q4 -5 8 0" stroke="#FFF6E8" stroke-width="2" fill="none" stroke-linecap="round" transform-origin="${x} ${y}"/>`;

// ---------- Rio ----------

const rioFacade = (x: number, w: number, h: number, c: string) => `
  <rect x="${x}" y="${-h}" width="${w}" height="${h}" fill="${c}"/>
  ${Array.from({ length: Math.floor(h / 14) }, (_, r) => Array.from({ length: Math.floor(w / 10) }, (_, k) => ((r + k) % 3 ? `<rect x="${x + 3 + k * 10}" y="${-h + 4 + r * 14}" width="4" height="6" fill="#FFF6E8" opacity="0.5"/>` : '')).join('')).join('')}`;

const ribeiraHouse = (x: number, w: number, h: number, wall: string, roof: string, tile = false) => {
  const floors = Math.floor((h - 16) / 34);
  const cols = Math.max(1, Math.floor((w - 12) / 22));
  let windows = '';
  for (let f = 0; f < floors; f++) {
    for (let c = 0; c < cols; c++) {
      const wx = x + 8 + c * ((w - 16) / cols) + ((w - 16) / cols - 12) / 2;
      const wy = -h + 22 + f * 34;
      windows += `<rect x="${wx}" y="${wy}" width="12" height="20" rx="1.5" fill="#2B2A4A"/>
        <rect x="${wx + 1.5}" y="${wy + 1.5}" width="9" height="8" fill="#7FB6E8" opacity="0.8"/>
        <rect x="${wx - 2}" y="${wy + 20}" width="16" height="3" fill="#201338" opacity="0.45"/>
        ${f > 0 && c % 2 === 0 ? `<path d="M${wx - 3} ${wy + 20} h18" stroke="#201338" stroke-width="1.5" stroke-dasharray="2 2" opacity="0.5"/>` : ''}`;
    }
  }
  return `
    <rect x="${x}" y="${-h}" width="${w}" height="${h}" fill="${wall}"/>
    ${tile ? `<g opacity="0.35">${Array.from({ length: Math.floor(h / 8) }, (_, r) => `<path d="M${x} ${-h + r * 8 + 4} h${w}" stroke="#FFF6E8" stroke-width="1"/>`).join('')}${Array.from({ length: Math.floor(w / 8) }, (_, c) => `<path d="M${x + c * 8 + 4} ${-h} v${h}" stroke="#FFF6E8" stroke-width="1"/>`).join('')}</g>` : ''}
    <rect x="${x - 3}" y="${-h - 10}" width="${w + 6}" height="12" rx="2" fill="${roof}"/>
    ${Array.from({ length: Math.floor(w / 12) }, (_, i) => `<path d="M${x - 3 + i * 12} ${-h - 10} q6 4 12 0" stroke="#201338" stroke-width="1" fill="none" opacity="0.35"/>`).join('')}
    ${windows}
    <rect x="${x + w / 2 - 8}" y="-28" width="16" height="28" rx="2" fill="#2B2A4A"/>
    <rect x="${x + w / 2 - 7}" y="-27" width="14" height="14" fill="#F2C94C" opacity="0.6"/>`;
};

export const SCENE_ART: Record<DestinationId, SceneArt> = {
  brazil: {
    bg: '#5EC8F2',
    band: { top: 400, bottom: 610 },
    backdrop: `
      <defs>
        <linearGradient id="rio-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3FB3EE"/><stop offset="0.55" stop-color="#8FDCF8"/><stop offset="1" stop-color="#CDEFFB"/></linearGradient>
        <linearGradient id="rio-sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1E8FD0"/><stop offset="1" stop-color="#36B5E8"/></linearGradient>
        <linearGradient id="rio-sand" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F7E6B5"/><stop offset="1" stop-color="#EBCF8F"/></linearGradient>
      </defs>
      <rect width="360" height="720" fill="url(#rio-sky)"/>
      <circle cx="284" cy="128" r="42" fill="#FFE07A"/>
      <circle cx="284" cy="128" r="56" fill="#FFE07A" opacity="0.25"/>
      <rect y="330" width="360" height="70" fill="url(#rio-sea)"/>
      <rect y="396" width="360" height="324" fill="url(#rio-sand)"/>
      <path d="M0 400 Q90 392 180 400 T360 400 L360 410 L0 410 Z" fill="#FFF6E8" opacity="0.8"/>
    `,
    layers: [
      // Clouds + far birds
      { speed: 0.08, width: 900, markup: `
        ${cloud(120, 90, 1, 'cloud--a')}${cloud(520, 60, 0.7, 'cloud--b')}${cloud(760, 150, 0.85, 'cloud--a')}
        ${gullFar(300, 170)}${gullFar(322, 160)}${gullFar(650, 120)}` },
      // Sugarloaf, Corcovado hill, distant city
      { speed: 0.14, width: 1080, markup: `
        <path d="M-40 332 Q40 300 120 310 Q220 320 300 332 Z" fill="#6FA37A"/>
        <path d="M160 332 Q210 150 262 164 Q300 180 320 250 Q336 300 350 332 Z" fill="#4F8A5B"/>
        <path d="M262 332 Q300 240 352 236 Q400 250 440 332 Z" fill="#5E9A68"/>
        <path d="M230 232 L212 332 L372 332 L350 238 Z" fill="#4F8A5B" opacity="0"/>
        <path d="M100 332 Q180 230 262 170" stroke="#FFF6E8" stroke-width="1.5" fill="none" opacity="0.7"/>
        <rect x="178" y="268" width="6" height="5" fill="#F58324"/>
        <rect x="222" y="226" width="6" height="5" fill="#F58324"/>
        <path d="M560 332 Q620 200 700 210 Q740 230 760 332 Z" fill="#5E9A68"/>
        <path d="M680 214 l0 -22 M672 200 l16 0 M676 192 l8 0" stroke="#FFF6E8" stroke-width="3" stroke-linecap="round"/>
        <g transform="translate(820 332)">${rioFacade(0, 22, 60, '#B9D4E0')}${rioFacade(26, 18, 80, '#D7E7EE')}${rioFacade(48, 26, 50, '#C8DEE8')}${rioFacade(78, 20, 92, '#B9D4E0')}${rioFacade(102, 30, 66, '#D7E7EE')}</g>
        <path d="M940 332 Q1000 260 1080 332 Z" fill="#6FA37A"/>` },
      // Sea: waves and boats
      { speed: 0.4, width: 720, markup: `
        <g class="waves">
          <path d="M-20 350 q15 -6 30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0" stroke="#FFF6E8" stroke-width="2" fill="none" opacity="0.55"/>
          <path d="M-35 372 q15 -5 30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0" stroke="#FFF6E8" stroke-width="2" fill="none" opacity="0.4"/>
        </g>
        ${sailboat(140, 352, 0.9)}${sailboat(560, 346, 0.7)}` },
      // Beach furniture and palms at the shoreline
      { speed: 0.7, width: 720, markup: `
        ${palm(60, 404, 150, 16, 1)}
        ${umbrella(210, 412, '#F58324', '#FFF6E8')}
        <rect x="186" y="404" width="46" height="8" rx="4" fill="#7845D8"/>
        ${kiosk(330, 410)}
        ${palm(470, 406, 120, -12, 0.85)}
        ${umbrella(600, 414, '#7845D8', '#FFF6E8')}
        ${palm(680, 404, 160, 10, 1.05)}
        <path d="M250 410 q10 -6 20 0" stroke="#3AA66A" stroke-width="3" fill="none"/>
        <path d="M540 408 q10 -6 20 0" stroke="#3AA66A" stroke-width="3" fill="none"/>` },
      // Sand details (ground speed)
      { speed: 1, width: 540, markup: `
        <ellipse cx="90" cy="470" rx="30" ry="5" fill="#E4C57C" opacity="0.6"/>
        <ellipse cx="300" cy="590" rx="40" ry="6" fill="#E4C57C" opacity="0.6"/>
        <ellipse cx="460" cy="500" rx="26" ry="5" fill="#E4C57C" opacity="0.6"/>
        <g fill="#D9B86A" opacity="0.8"><ellipse cx="150" cy="520" rx="4" ry="2.5"/><ellipse cx="162" cy="530" rx="4" ry="2.5"/><ellipse cx="174" cy="520" rx="4" ry="2.5"/><ellipse cx="186" cy="530" rx="4" ry="2.5"/></g>
        <g fill="#D9B86A" opacity="0.8"><ellipse cx="380" cy="640" rx="4" ry="2.5"/><ellipse cx="392" cy="650" rx="4" ry="2.5"/><ellipse cx="404" cy="640" rx="4" ry="2.5"/></g>
        <path d="M40 660 q6 -14 12 0 M48 662 q6 -16 12 0 M56 660 q6 -12 12 0" stroke="#7FBF6A" stroke-width="3" fill="none" stroke-linecap="round"/>
        <path d="M420 690 q6 -14 12 0 M428 692 q6 -16 12 0" stroke="#7FBF6A" stroke-width="3" fill="none" stroke-linecap="round"/>
        <circle cx="250" cy="640" r="5" fill="#FFB38A"/><circle cx="262" cy="648" r="3" fill="#FFF6E8"/>` },
    ],
    front: [
      // Foreground: palm trunk + fronds and rocks at the bottom edge
      { speed: 1.3, width: 1000, markup: `
        <g transform="translate(300 830)">${palm(0, 0, 150, 20, 1.15)}</g>
        <path d="M700 720 Q740 670 800 690 Q860 700 880 720 Z" fill="#9A9284"/>
        <path d="M720 720 Q750 690 790 700 Q830 706 846 720 Z" fill="#B3AB9C"/>
        <path d="M-20 720 Q30 700 80 710 Q120 716 140 720 Z" fill="#E4C57C"/>` },
    ],
  },

  portugal: {
    bg: '#F6C9A8',
    band: { top: 395, bottom: 600 },
    backdrop: `
      <defs>
        <linearGradient id="porto-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7FA7E8"/><stop offset="0.6" stop-color="#F6C9A8"/><stop offset="1" stop-color="#FFE1B8"/></linearGradient>
        <linearGradient id="porto-river" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2F5C8E"/><stop offset="1" stop-color="#1F4470"/></linearGradient>
        <linearGradient id="porto-quay" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#C9C2B4"/><stop offset="1" stop-color="#ADA698"/></linearGradient>
      </defs>
      <rect width="360" height="720" fill="url(#porto-sky)"/>
      <circle cx="70" cy="150" r="30" fill="#FFE8A8" opacity="0.9"/>
      <rect y="380" width="360" height="236" fill="url(#porto-quay)"/>
      <rect y="612" width="360" height="108" fill="url(#porto-river)"/>
    `,
    layers: [
      // Clouds + gulls
      { speed: 0.08, width: 900, markup: `
        ${cloud(200, 70, 0.8, 'cloud--b')}${cloud(640, 110, 1, 'cloud--a')}
        ${gullFar(420, 150)}${gullFar(445, 142)}${gullFar(800, 90)}` },
      // Hills of Porto with Clérigos tower, cathedral, and the Dom Luís I bridge
      { speed: 0.16, width: 1200, markup: `
        <path d="M0 290 Q120 215 260 236 Q380 250 480 222 Q600 196 700 236 Q820 276 960 226 Q1080 206 1200 290 L1200 330 L0 330 Z" fill="#B88FA8"/>
        <g fill="#A77C97"><rect x="80" y="258" width="22" height="42"/><rect x="110" y="266" width="30" height="34"/><rect x="150" y="248" width="18" height="52"/><rect x="300" y="238" width="26" height="40"/><rect x="330" y="250" width="40" height="28"/></g>
        <rect x="196" y="160" width="14" height="110" fill="#8F6B86"/><path d="M194 160 L203 140 L212 160 Z" fill="#8F6B86"/><rect x="199" y="200" width="8" height="12" fill="#FFE1B8" opacity="0.8"/>
        <g fill="#8F6B86"><rect x="520" y="214" width="34" height="40"/><rect x="516" y="204" width="10" height="50"/><rect x="548" y="204" width="10" height="50"/><path d="M516 204 l5 -10 l5 10 Z M548 204 l5 -10 l5 10 Z"/></g>
        <g class="bridge">
          <path d="M700 330 Q850 150 1000 330" stroke="#4A5560" stroke-width="10" fill="none"/>
          <path d="M700 330 Q850 150 1000 330" stroke="#6B7580" stroke-width="4" fill="none"/>
          <rect x="690" y="186" width="320" height="8" fill="#4A5560"/>
          <g stroke="#4A5560" stroke-width="3"><path d="M740 194 v120 M780 194 v70 M820 194 v30 M860 194 v22 M900 194 v34 M940 194 v78 M980 194 v128"/></g>
          <g stroke="#6B7580" stroke-width="2"><path d="M700 186 l20 -14 l20 14 l20 -14 l20 14 l20 -14 l20 14 l20 -14 l20 14 l20 -14 l20 14 l20 -14 l20 14 l20 -14 l20 14 l20 -14 l20 14"/></g>
          <g class="bridge-tram"><rect x="0" y="172" width="40" height="14" rx="3" fill="#F2C94C"/><rect x="4" y="175" width="8" height="7" fill="#9ED5F5"/><rect x="16" y="175" width="8" height="7" fill="#9ED5F5"/><rect x="28" y="175" width="8" height="7" fill="#9ED5F5"/><rect x="0" y="183" width="40" height="3" fill="#D9534F"/></g>
        </g>` },
      // Ribeira façades
      { speed: 0.55, width: 780, markup: `
        <g transform="translate(0 382)">
          ${ribeiraHouse(0, 64, 128, '#E8B04B', '#B5452F')}
          ${ribeiraHouse(64, 56, 156, '#D9534F', '#8E3A2A')}
          ${ribeiraHouse(120, 70, 112, '#5B9BD5', '#B5452F', true)}
          ${ribeiraHouse(190, 60, 144, '#F0E2C8', '#B5452F')}
          ${ribeiraHouse(250, 66, 124, '#3AA66A', '#8E3A2A')}
          ${ribeiraHouse(316, 58, 160, '#F2C94C', '#B5452F')}
          ${ribeiraHouse(374, 72, 116, '#FFF6E8', '#B5452F', true)}
          ${ribeiraHouse(446, 60, 140, '#C96A3F', '#8E3A2A')}
          ${ribeiraHouse(506, 68, 152, '#8E6BB8', '#B5452F')}
          ${ribeiraHouse(574, 62, 120, '#5B9BD5', '#8E3A2A', true)}
          ${ribeiraHouse(636, 70, 146, '#E8B04B', '#B5452F')}
          ${ribeiraHouse(706, 74, 132, '#F0E2C8', '#8E3A2A')}
          <g class="laundry"><path d="M70 -100 q30 8 60 0" stroke="#201338" stroke-width="1" fill="none" opacity="0.5"/><rect x="82" y="-100" width="8" height="12" fill="#FFF6E8"/><rect x="98" y="-99" width="8" height="12" fill="#7845D8"/><rect x="114" y="-100" width="8" height="12" fill="#F58324"/></g>
          <g class="laundry"><path d="M460 -104 q30 8 60 0" stroke="#201338" stroke-width="1" fill="none" opacity="0.5"/><rect x="472" y="-104" width="8" height="12" fill="#5EC8F2"/><rect x="490" y="-103" width="8" height="12" fill="#FFF6E8"/><rect x="506" y="-104" width="8" height="12" fill="#F2C94C"/></g>
          <g transform="translate(140 0)"><rect x="-22" y="-26" width="44" height="6" rx="3" fill="#D9534F"/><rect x="-14" y="-20" width="4" height="20" fill="#7A4B2A"/><rect x="10" y="-20" width="4" height="20" fill="#7A4B2A"/><circle cx="0" cy="-8" r="8" fill="#FFF6E8"/><rect x="-1" y="-8" width="2" height="8" fill="#7A4B2A"/></g>
        </g>` },
      // Cobbles and quay edge details
      { speed: 1, width: 480, markup: `
        <g fill="#B9B2A6" opacity="0.35">${Array.from({ length: 14 }, (_, r) => Array.from({ length: 20 }, (_, c) => `<rect x="${c * 24 + (r % 2) * 12}" y="${398 + r * 15}" width="20" height="10" rx="4"/>`).join('')).join('')}</g>
        <rect y="606" width="480" height="8" fill="#8A8377"/>
        <g fill="#5A5248"><rect x="20" y="596" width="10" height="14" rx="3"/><rect x="180" y="596" width="10" height="14" rx="3"/><rect x="340" y="596" width="10" height="14" rx="3"/></g>
        <path d="M30 600 q75 16 150 0 M190 600 q75 16 150 0" stroke="#5A5248" stroke-width="2" fill="none"/>
        <rect x="90" y="650" width="60" height="4" fill="#FFF6E8" opacity="0.15"/><rect x="300" y="680" width="50" height="4" fill="#FFF6E8" opacity="0.12"/>` },
      // River: rabelo boats bobbing
      { speed: 1.1, width: 900, markup: `
        <g class="boat"><g transform="translate(120 660)"><path d="M-40 0 L40 0 L28 14 L-28 14 Z" fill="#7A4B2A"/><path d="M-40 0 L40 0" stroke="#3E2412" stroke-width="3"/><rect x="-2" y="-40" width="4" height="40" fill="#3E2412"/><path d="M2 -38 L30 -12 L2 -8 Z" fill="#FFF6E8"/><g fill="#5A3A20"><ellipse cx="-16" cy="-4" rx="7" ry="5"/><ellipse cx="0" cy="-4" rx="7" ry="5"/><ellipse cx="16" cy="-4" rx="7" ry="5"/></g></g></g>
        <g class="boat boat--b"><g transform="translate(560 676)"><path d="M-32 0 L32 0 L22 11 L-22 11 Z" fill="#8B5A2B"/><rect x="-2" y="-32" width="4" height="32" fill="#3E2412"/><path d="M2 -30 L24 -10 L2 -6 Z" fill="#F2C94C"/></g></g>
        <g stroke="#FFF6E8" opacity="0.25" stroke-width="2" fill="none"><path d="M200 700 h40 M260 690 h24 M700 696 h50 M820 710 h30"/></g>` },
    ],
    front: [
      // Foreground: lamp post, railing, awning corner
      { speed: 1.3, width: 1100, markup: `
        <g transform="translate(260 720)"><rect x="-5" y="-200" width="10" height="200" fill="#2F3B46"/><rect x="-12" y="-214" width="24" height="18" rx="5" fill="#2F3B46"/><rect x="-8" y="-210" width="16" height="10" fill="#FFE1B8"/><circle cy="-224" r="5" fill="#2F3B46"/></g>
        <g transform="translate(700 720)"><rect x="-5" y="-200" width="10" height="200" fill="#2F3B46"/><rect x="-12" y="-214" width="24" height="18" rx="5" fill="#2F3B46"/><rect x="-8" y="-210" width="16" height="10" fill="#FFE1B8"/><circle cy="-224" r="5" fill="#2F3B46"/></g>
        <g transform="translate(980 700)"><ellipse rx="40" ry="10" fill="#4A5560"/><rect x="-6" y="-40" width="12" height="40" fill="#4A5560"/><rect x="-30" y="-46" width="60" height="8" rx="4" fill="#D9534F"/></g>` },
    ],
  },
};
