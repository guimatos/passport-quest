import type { CostumeId } from '../data/destinations';

/**
 * Capi the capybara: the player character, drawn as an upright, human-like
 * runner (t-shirt, shorts, sneakers) with a capybara head. Original vector art.
 *  - capyGroup(mood, costume): side view, facing right, in a 120x140 box
 *    centered on (0,0). Limbs carry CSS run-cycle animations (runner classes).
 *  - capyPortrait(mood, costume): front-facing half body for HTML screens.
 * Costumes are keyed by costume id: a hat plus shirt colours.
 */
export type CapyMood = 'run' | 'cheer' | 'ouch' | 'happy';

const FUR = '#A5713F', FUR_DARK = '#7E5430', FUR_LIGHT = '#C99263', INK = '#201338', CREAM = '#FFF6E8';
const ORANGE = '#F58324', PURPLE = '#7845D8', YELLOW = '#F2C94C', GREEN = '#1FA463', RED = '#D9534F';

interface Costume { shirt: string; shirtAccent: string; shorts: string; hatSide: string; hatFront: string }

const COSTUMES: Record<CostumeId, Costume> = {
  chef: {
    shirt: CREAM, shirtAccent: '#D8CCBC', shorts: '#2B2A4A',
    hatSide: `<g transform="translate(2 -54)"><path d="M-15 2 q-8 -20 6 -18 q4 -10 14 -4 q12 -6 12 8 Z" fill="${CREAM}" stroke="#D8CCBC" stroke-width="1.5"/><rect x="-15" y="0" width="32" height="8" rx="2" fill="${CREAM}" stroke="#D8CCBC" stroke-width="1.5"/></g>`,
    hatFront: `<g transform="translate(0 -46)"><path d="M-24 4 q-10 -26 8 -22 q6 -12 16 -4 q16 -8 16 10 Z" fill="${CREAM}" stroke="#D8CCBC" stroke-width="1.5"/><rect x="-24" y="2" width="48" height="10" rx="3" fill="${CREAM}" stroke="#D8CCBC" stroke-width="1.5"/></g>`,
  },
  carnival: {
    shirt: YELLOW, shirtAccent: ORANGE, shorts: PURPLE,
    hatSide: `<g transform="translate(4 -52)"><g stroke-width="5" stroke-linecap="round" fill="none"><path d="M-8 0 q-14 -16 -14 -34" stroke="${PURPLE}"/><path d="M-3 -2 q-6 -22 2 -38" stroke="${GREEN}"/><path d="M3 -2 q4 -22 12 -36" stroke="${YELLOW}"/><path d="M8 0 q14 -14 20 -30" stroke="${ORANGE}"/></g><path d="M-14 2 q14 -8 28 0 l0 6 q-14 -6 -28 0 Z" fill="${YELLOW}" stroke="${ORANGE}" stroke-width="1.5"/><g fill="${CREAM}"><circle cx="-7" cy="3" r="1.6"/><circle cx="0" cy="2" r="1.6"/><circle cx="7" cy="3" r="1.6"/></g></g>`,
    hatFront: `<g transform="translate(0 -46)"><g stroke-width="6" stroke-linecap="round" fill="none"><path d="M-18 0 q-18 -14 -22 -34" stroke="${PURPLE}"/><path d="M-9 -2 q-10 -22 -6 -40" stroke="${GREEN}"/><path d="M0 -3 q0 -24 0 -42" stroke="${YELLOW}"/><path d="M9 -2 q10 -22 6 -40" stroke="${ORANGE}"/><path d="M18 0 q18 -14 22 -34" stroke="${PURPLE}"/></g><path d="M-26 4 q26 -12 52 0 l0 8 q-26 -8 -52 0 Z" fill="${YELLOW}" stroke="${ORANGE}" stroke-width="1.5"/><g fill="${CREAM}"><circle cx="-14" cy="5" r="2"/><circle cx="0" cy="3" r="2"/><circle cx="14" cy="5" r="2"/></g></g>`,
  },
  panama: {
    shirt: '#5EC8F2', shirtAccent: CREAM, shorts: '#F3E3B8',
    hatSide: `<g transform="translate(4 -54)"><path d="M-24 6 q24 -8 48 0 q-6 6 -24 6 q-18 0 -24 -6 Z" fill="#F3E3B8" stroke="#C9A96A" stroke-width="1.5"/><path d="M-14 4 q0 -18 14 -18 q14 0 14 18 Z" fill="#F3E3B8" stroke="#C9A96A" stroke-width="1.5"/><path d="M-14 2 h28" stroke="${INK}" stroke-width="4"/></g>`,
    hatFront: `<g transform="translate(0 -46)"><path d="M-40 10 q40 -12 80 0 q-8 8 -40 8 q-32 0 -40 -8 Z" fill="#F3E3B8" stroke="#C9A96A" stroke-width="1.5"/><path d="M-24 8 q0 -26 24 -26 q24 0 24 26 Z" fill="#F3E3B8" stroke="#C9A96A" stroke-width="1.5"/><path d="M-24 4 h48" stroke="${INK}" stroke-width="5"/></g>`,
  },
  saojoao: {
    shirt: RED, shirtAccent: CREAM, shorts: '#2B2A4A',
    hatSide: `<g transform="translate(4 -52)"><path d="M-16 2 q16 -10 32 0" stroke="${GREEN}" stroke-width="4" fill="none" stroke-linecap="round"/><g fill="${RED}"><circle cx="-12" cy="0" r="4"/><circle cx="4" cy="-4" r="4"/><circle cx="14" cy="0" r="4"/></g><g fill="${YELLOW}"><circle cx="-4" cy="-3" r="3.5"/><circle cx="10" cy="-3" r="3"/></g><g fill="${CREAM}"><circle cx="-12" cy="0" r="1.5"/><circle cx="4" cy="-4" r="1.5"/><circle cx="14" cy="0" r="1.5"/></g></g>`,
    hatFront: `<g transform="translate(0 -46)"><path d="M-30 6 q30 -14 60 0" stroke="${GREEN}" stroke-width="5" fill="none" stroke-linecap="round"/><g fill="${RED}"><circle cx="-22" cy="4" r="5"/><circle cx="0" cy="-2" r="5.5"/><circle cx="22" cy="4" r="5"/></g><g fill="${YELLOW}"><circle cx="-11" cy="0" r="4.5"/><circle cx="11" cy="0" r="4.5"/></g><g fill="${CREAM}"><circle cx="-22" cy="4" r="2"/><circle cx="0" cy="-2" r="2"/><circle cx="22" cy="4" r="2"/></g></g>`,
  },
  conductor: {
    shirt: '#2B2A4A', shirtAccent: YELLOW, shorts: '#2B2A4A',
    hatSide: `<g transform="translate(4 -54)"><path d="M-16 4 q16 -14 32 0 Z" fill="#2B2A4A"/><rect x="-16" y="2" width="32" height="6" rx="2" fill="#2B2A4A"/><path d="M8 8 h16 l-2 4 h-14 Z" fill="${INK}"/><circle cx="2" cy="1" r="3" fill="${YELLOW}"/><path d="M-14 6 h28" stroke="${YELLOW}" stroke-width="1.2"/></g>`,
    hatFront: `<g transform="translate(0 -46)"><path d="M-28 6 q28 -20 56 0 Z" fill="#2B2A4A"/><rect x="-28" y="4" width="56" height="8" rx="3" fill="#2B2A4A"/><path d="M-22 12 h44 l-4 5 h-36 Z" fill="${INK}"/><circle cx="0" cy="2" r="4" fill="${YELLOW}"/><path d="M-24 9 h48" stroke="${YELLOW}" stroke-width="1.4"/></g>`,
  },
};

function sideFace(mood: CapyMood) {
  const eye = mood === 'ouch'
    ? `<path d="M8 -36 l8 8 M16 -36 l-8 8" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`
    : mood === 'cheer'
      ? `<path d="M7 -32 q5 -7 10 0" stroke="${INK}" stroke-width="3" fill="none" stroke-linecap="round"/>`
      : `<circle cx="12" cy="-32" r="4" fill="${INK}"/><circle cx="13.5" cy="-33.5" r="1.4" fill="#fff"/>`;
  const mouth = mood === 'cheer' || mood === 'happy'
    ? `<path d="M24 -16 q6 5 12 -1" stroke="${INK}" stroke-width="2.5" fill="none" stroke-linecap="round"/>`
    : mood === 'ouch'
      ? `<path d="M26 -14 q4 -3 8 0" stroke="${INK}" stroke-width="2.5" fill="none" stroke-linecap="round"/>`
      : `<path d="M26 -16 q4 3 8 -1" stroke="${INK}" stroke-width="2.5" fill="none" stroke-linecap="round"/>`;
  return eye + mouth;
}

/** Upright runner. Hips at (0,24), shoulders at (0,-6), head center (10,-34). */
export function capyGroup(mood: CapyMood = 'run', costume: CostumeId = 'panama'): string {
  const c = COSTUMES[costume];
  return `
    <g class="capy capy--${mood}">
      <g class="r-arm r-arm-b"><path d="M-2 -4 l-10 18" stroke="${FUR}" stroke-width="8" stroke-linecap="round"/><path d="M-12 14 l-4 10" stroke="${FUR}" stroke-width="8" stroke-linecap="round"/><circle cx="-17" cy="25" r="5" fill="${FUR_LIGHT}"/></g>
      <g class="r-leg r-leg-b"><path d="M-2 24 l-6 18" stroke="${FUR}" stroke-width="9" stroke-linecap="round"/><path d="M-8 42 l2 16" stroke="${FUR}" stroke-width="9" stroke-linecap="round"/><path d="M-10 58 h14" stroke="${INK}" stroke-width="7" stroke-linecap="round"/></g>
      <g class="runner-body">
        <path d="M-14 -8 Q-16 -14 -6 -14 L10 -14 Q20 -14 18 -6 L16 26 L-14 26 Z" fill="${c.shirt}"/>
        <path d="M-14 -8 Q-16 -14 -6 -14 L10 -14 Q20 -14 18 -6 L17 -2 L-14 -2 Z" fill="${c.shirtAccent}" opacity="0.9"/>
        <path d="M-14 24 L16 24 L17 40 L-15 40 Z" fill="${c.shorts}"/>
        <g class="runner-head">
          <ellipse cx="12" cy="-52" rx="5" ry="4" fill="${FUR}" transform="rotate(-20 12 -52)"/>
          <ellipse cx="12" cy="-52" rx="2.5" ry="2" fill="${FUR_DARK}" transform="rotate(-20 12 -52)"/>
          <path d="M-10 -46 Q-10 -56 4 -56 L16 -56 Q28 -56 32 -46 L38 -26 Q40 -14 30 -12 L12 -10 Q-10 -12 -10 -26 Z" fill="${FUR}"/>
          <path d="M22 -36 Q40 -38 40 -22 Q40 -12 30 -12 L18 -12 Q12 -22 22 -36 Z" fill="${FUR_LIGHT}"/>
          <ellipse cx="35" cy="-28" rx="4" ry="3" fill="${INK}"/>
          ${sideFace(mood)}
          ${c.hatSide}
        </g>
      </g>
      <g class="r-leg r-leg-a"><path d="M4 24 l6 18" stroke="${FUR}" stroke-width="9" stroke-linecap="round"/><path d="M10 42 l-2 16" stroke="${FUR}" stroke-width="9" stroke-linecap="round"/><path d="M6 58 h14" stroke="${INK}" stroke-width="7" stroke-linecap="round"/></g>
      <g class="r-arm r-arm-a"><path d="M6 -4 l10 16" stroke="${FUR}" stroke-width="8" stroke-linecap="round"/><path d="M16 12 l8 -6" stroke="${FUR}" stroke-width="8" stroke-linecap="round"/><circle cx="26" cy="4" r="5" fill="${FUR_LIGHT}"/></g>
    </g>`;
}

/** Front-facing half body for screens (head, shirt, arms). */
export function capyPortrait(mood: CapyMood = 'happy', costume: CostumeId = 'panama'): string {
  const c = COSTUMES[costume];
  const eyes = mood === 'ouch'
    ? `<path d="M-22 -14 l10 8 M-12 -14 l-10 8 M12 -14 l10 8 M22 -14 l-10 8" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`
    : mood === 'cheer'
      ? `<path d="M-23 -10 q6 -8 12 0 M11 -10 q6 -8 12 0" stroke="${INK}" stroke-width="3.5" fill="none" stroke-linecap="round"/>`
      : `<circle cx="-17" cy="-10" r="4.5" fill="${INK}"/><circle cx="17" cy="-10" r="4.5" fill="${INK}"/><circle cx="-15.5" cy="-11.5" r="1.6" fill="#fff"/><circle cx="18.5" cy="-11.5" r="1.6" fill="#fff"/>`;
  const mouth = mood === 'cheer'
    ? `<path d="M-8 18 q8 9 16 0 Z" fill="${INK}"/>`
    : `<path d="M-7 18 q7 6 14 0" stroke="${INK}" stroke-width="2.5" fill="none" stroke-linecap="round"/>`;
  return `
    <g class="capy-portrait capy-portrait--${mood}">
      <g class="p-arm p-arm-l"><path d="M-34 44 l-14 26" stroke="${FUR}" stroke-width="10" stroke-linecap="round"/><circle cx="-50" cy="72" r="6" fill="${FUR_LIGHT}"/></g>
      <g class="p-arm p-arm-r ${mood === 'cheer' ? 'wave' : ''}"><path d="M34 44 l14 ${mood === 'cheer' ? -26 : 26}" stroke="${FUR}" stroke-width="10" stroke-linecap="round"/><circle cx="50" cy="${mood === 'cheer' ? 16 : 72}" r="6" fill="${FUR_LIGHT}"/></g>
      <path d="M-34 40 Q-36 32 -26 32 L26 32 Q36 32 34 40 L36 90 L-36 90 Z" fill="${c.shirt}"/>
      <path d="M-34 40 Q-36 32 -26 32 L26 32 Q36 32 34 40 L34 46 L-34 46 Z" fill="${c.shirtAccent}" opacity="0.9"/>
      <rect x="-6" y="30" width="12" height="8" rx="3" fill="${FUR}"/>
      <ellipse cx="-30" cy="-36" rx="8" ry="7" fill="${FUR}"/><ellipse cx="-30" cy="-36" rx="4" ry="3.5" fill="${FUR_DARK}"/>
      <ellipse cx="30" cy="-36" rx="8" ry="7" fill="${FUR}"/><ellipse cx="30" cy="-36" rx="4" ry="3.5" fill="${FUR_DARK}"/>
      <path d="M-40 -26 Q-40 -48 0 -48 Q40 -48 40 -26 L42 14 Q42 42 0 42 Q-42 42 -42 14 Z" fill="${FUR}"/>
      <path d="M-26 4 Q-26 34 0 34 Q26 34 26 4 Q12 -2 0 -2 Q-12 -2 -26 4 Z" fill="${FUR_LIGHT}"/>
      <ellipse cx="-10" cy="8" rx="4" ry="3" fill="${INK}"/><ellipse cx="10" cy="8" rx="4" ry="3" fill="${INK}"/>
      ${eyes}${mouth}
      ${mood === 'cheer' ? `<circle cx="-32" cy="0" r="5" fill="#E8A07A" opacity="0.6"/><circle cx="32" cy="0" r="5" fill="#E8A07A" opacity="0.6"/>` : ''}
      ${c.hatFront}
    </g>`;
}

export function capySvg(mood: CapyMood = 'happy', costume: CostumeId = 'panama', cls = ''): string {
  return `<svg class="capy-svg ${cls}" viewBox="-64 -96 128 190" aria-hidden="true">${capyPortrait(mood, costume)}</svg>`;
}
