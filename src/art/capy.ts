import type { CostumeId } from '../data/destinations';

/**
 * Capi the capybara: the player character. Original vector art.
 *  - capyGroup(mood, costume): side view, facing right, in a 120x120 box
 *    centered on (0,0). Legs carry CSS run-cycle animations (runner classes).
 *  - capyPortrait(mood, costume): front-facing bust for HTML screens.
 * Costumes are keyed by costume id and drawn on top of the head.
 */
export type CapyMood = 'run' | 'cheer' | 'ouch' | 'happy';

const FUR = '#A5713F', FUR_DARK = '#7E5430', FUR_LIGHT = '#C99263', INK = '#201338', CREAM = '#FFF6E8';
const ORANGE = '#F58324', PURPLE = '#7845D8', YELLOW = '#F2C94C', GREEN = '#1FA463', RED = '#D9534F';

/** Side-view costumes, anchored at the top of the head (head center ≈ (26,-14), top ≈ -34). */
const SIDE_COSTUME: Record<CostumeId, string> = {
  chef: `<g transform="translate(24 -36)">
      <path d="M-15 2 q-8 -20 6 -18 q4 -10 14 -4 q12 -6 12 8 Z" fill="${CREAM}" stroke="#D8CCBC" stroke-width="1.5"/>
      <rect x="-15" y="0" width="32" height="8" rx="2" fill="${CREAM}" stroke="#D8CCBC" stroke-width="1.5"/>
    </g>`,
  panama: `<g transform="translate(26 -36)">
      <path d="M-24 6 q24 -8 48 0 q-6 6 -24 6 q-18 0 -24 -6 Z" fill="#F3E3B8" stroke="#C9A96A" stroke-width="1.5"/>
      <path d="M-14 4 q0 -18 14 -18 q14 0 14 18 Z" fill="#F3E3B8" stroke="#C9A96A" stroke-width="1.5"/>
      <path d="M-14 2 h28" stroke="${INK}" stroke-width="4"/>
    </g>`,
  carnival: `<g transform="translate(26 -34)">
      <g stroke-width="5" stroke-linecap="round" fill="none">
        <path d="M-8 0 q-14 -16 -14 -34" stroke="${PURPLE}"/><path d="M-3 -2 q-6 -22 2 -38" stroke="${GREEN}"/><path d="M3 -2 q4 -22 12 -36" stroke="${YELLOW}"/><path d="M8 0 q14 -14 20 -30" stroke="${ORANGE}"/>
      </g>
      <path d="M-14 2 q14 -8 28 0 l0 6 q-14 -6 -28 0 Z" fill="${YELLOW}" stroke="${ORANGE}" stroke-width="1.5"/>
      <g fill="${CREAM}"><circle cx="-7" cy="3" r="1.6"/><circle cx="0" cy="2" r="1.6"/><circle cx="7" cy="3" r="1.6"/></g>
    </g>`,
  conductor: `<g transform="translate(26 -36)">
      <path d="M-16 4 q16 -14 32 0 Z" fill="#2B2A4A"/>
      <rect x="-16" y="2" width="32" height="6" rx="2" fill="#2B2A4A"/>
      <path d="M8 8 h16 l-2 4 h-14 Z" fill="${INK}"/>
      <circle cx="2" cy="1" r="3" fill="${YELLOW}"/>
      <path d="M-14 6 h28" stroke="${YELLOW}" stroke-width="1.2"/>
    </g>`,
  saojoao: `<g transform="translate(26 -34)">
      <path d="M-16 2 q16 -10 32 0" stroke="${GREEN}" stroke-width="4" fill="none" stroke-linecap="round"/>
      <g fill="${RED}"><circle cx="-12" cy="0" r="4"/><circle cx="4" cy="-4" r="4"/><circle cx="14" cy="0" r="4"/></g>
      <g fill="${YELLOW}"><circle cx="-4" cy="-3" r="3.5"/><circle cx="10" cy="-3" r="3"/></g>
      <g fill="${CREAM}"><circle cx="-12" cy="0" r="1.5"/><circle cx="4" cy="-4" r="1.5"/><circle cx="14" cy="0" r="1.5"/></g>
    </g>`,
};

/** Front-view costumes, anchored at the top of the portrait head (top ≈ -40). */
const FRONT_COSTUME: Record<CostumeId, string> = {
  chef: `<g transform="translate(0 -40)">
      <path d="M-24 4 q-10 -26 8 -22 q6 -12 16 -4 q16 -8 16 10 Z" fill="${CREAM}" stroke="#D8CCBC" stroke-width="1.5"/>
      <rect x="-24" y="2" width="48" height="10" rx="3" fill="${CREAM}" stroke="#D8CCBC" stroke-width="1.5"/>
    </g>`,
  panama: `<g transform="translate(0 -40)">
      <path d="M-40 10 q40 -12 80 0 q-8 8 -40 8 q-32 0 -40 -8 Z" fill="#F3E3B8" stroke="#C9A96A" stroke-width="1.5"/>
      <path d="M-24 8 q0 -26 24 -26 q24 0 24 26 Z" fill="#F3E3B8" stroke="#C9A96A" stroke-width="1.5"/>
      <path d="M-24 4 h48" stroke="${INK}" stroke-width="5"/>
    </g>`,
  carnival: `<g transform="translate(0 -40)">
      <g stroke-width="6" stroke-linecap="round" fill="none">
        <path d="M-18 0 q-18 -14 -22 -34" stroke="${PURPLE}"/><path d="M-9 -2 q-10 -22 -6 -40" stroke="${GREEN}"/><path d="M0 -3 q0 -24 0 -42" stroke="${YELLOW}"/><path d="M9 -2 q10 -22 6 -40" stroke="${ORANGE}"/><path d="M18 0 q18 -14 22 -34" stroke="${PURPLE}"/>
      </g>
      <path d="M-26 4 q26 -12 52 0 l0 8 q-26 -8 -52 0 Z" fill="${YELLOW}" stroke="${ORANGE}" stroke-width="1.5"/>
      <g fill="${CREAM}"><circle cx="-14" cy="5" r="2"/><circle cx="0" cy="3" r="2"/><circle cx="14" cy="5" r="2"/></g>
    </g>`,
  conductor: `<g transform="translate(0 -40)">
      <path d="M-28 6 q28 -20 56 0 Z" fill="#2B2A4A"/>
      <rect x="-28" y="4" width="56" height="8" rx="3" fill="#2B2A4A"/>
      <path d="M-22 12 h44 l-4 5 h-36 Z" fill="${INK}"/>
      <circle cx="0" cy="2" r="4" fill="${YELLOW}"/>
      <path d="M-24 9 h48" stroke="${YELLOW}" stroke-width="1.4"/>
    </g>`,
  saojoao: `<g transform="translate(0 -40)">
      <path d="M-30 6 q30 -14 60 0" stroke="${GREEN}" stroke-width="5" fill="none" stroke-linecap="round"/>
      <g fill="${RED}"><circle cx="-22" cy="4" r="5"/><circle cx="0" cy="-2" r="5.5"/><circle cx="22" cy="4" r="5"/></g>
      <g fill="${YELLOW}"><circle cx="-11" cy="0" r="4.5"/><circle cx="11" cy="0" r="4.5"/></g>
      <g fill="${CREAM}"><circle cx="-22" cy="4" r="2"/><circle cx="0" cy="-2" r="2"/><circle cx="22" cy="4" r="2"/></g>
    </g>`,
};

function sideFace(mood: CapyMood) {
  const eye = mood === 'ouch'
    ? `<path d="M26 -20 l8 8 M34 -20 l-8 8" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`
    : mood === 'cheer'
      ? `<path d="M25 -16 q5 -7 10 0" stroke="${INK}" stroke-width="3" fill="none" stroke-linecap="round"/>`
      : `<circle cx="30" cy="-16" r="4" fill="${INK}"/><circle cx="31.5" cy="-17.5" r="1.4" fill="#fff"/>`;
  const mouth = mood === 'cheer' || mood === 'happy'
    ? `<path d="M42 0 q6 5 12 -1" stroke="${INK}" stroke-width="2.5" fill="none" stroke-linecap="round"/>`
    : mood === 'ouch'
      ? `<path d="M44 2 q4 -3 8 0" stroke="${INK}" stroke-width="2.5" fill="none" stroke-linecap="round"/>`
      : `<path d="M44 0 q4 3 8 -1" stroke="${INK}" stroke-width="2.5" fill="none" stroke-linecap="round"/>`;
  return eye + mouth;
}

export function capyGroup(mood: CapyMood = 'run', costume: CostumeId = 'panama'): string {
  return `
    <g class="capy capy--${mood}">
      <g class="runner-legs">
        <g class="leg leg-back-b"><path d="M-22 18 l-4 22" stroke="${FUR_DARK}" stroke-width="10" stroke-linecap="round"/></g>
        <g class="leg leg-front-b"><path d="M14 18 l-3 22" stroke="${FUR_DARK}" stroke-width="10" stroke-linecap="round"/></g>
      </g>
      <g class="runner-body">
        <path d="M-42 -4 Q-44 -22 -24 -22 L24 -20 Q40 -20 40 -2 L40 14 Q40 26 26 26 L-28 26 Q-42 26 -42 14 Z" fill="${FUR}"/>
        <path d="M-34 8 Q-30 26 -10 26 L20 26 Q34 26 34 10 Q10 18 -34 8 Z" fill="${FUR_LIGHT}"/>
        <g class="runner-head">
          <ellipse cx="30" cy="-30" rx="6" ry="5" fill="${FUR}" transform="rotate(-20 30 -30)"/>
          <ellipse cx="30" cy="-30" rx="3" ry="2.5" fill="${FUR_DARK}" transform="rotate(-20 30 -30)"/>
          <path d="M8 -34 Q8 -40 22 -40 L34 -40 Q46 -40 50 -30 L56 -10 Q58 2 48 4 L30 6 Q8 4 8 -10 Z" fill="${FUR}"/>
          <path d="M40 -20 Q58 -22 58 -6 Q58 4 48 4 L36 4 Q30 -6 40 -20 Z" fill="${FUR_LIGHT}"/>
          <ellipse cx="53" cy="-12" rx="4" ry="3" fill="${INK}"/>
          ${sideFace(mood)}
          ${SIDE_COSTUME[costume]}
        </g>
      </g>
      <g class="runner-legs runner-legs--front">
        <g class="leg leg-back-a"><path d="M-12 20 l-3 22" stroke="${FUR}" stroke-width="10" stroke-linecap="round"/><path d="M-16 42 l0 0" stroke="${FUR_DARK}" stroke-width="7" stroke-linecap="round"/></g>
        <g class="leg leg-front-a"><path d="M24 20 l-1 22" stroke="${FUR}" stroke-width="10" stroke-linecap="round"/><path d="M22 42 l0 0" stroke="${FUR_DARK}" stroke-width="7" stroke-linecap="round"/></g>
      </g>
    </g>`;
}

export function capyPortrait(mood: CapyMood = 'happy', costume: CostumeId = 'panama'): string {
  const eyes = mood === 'ouch'
    ? `<path d="M-22 -8 l10 8 M-12 -8 l-10 8 M12 -8 l10 8 M22 -8 l-10 8" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`
    : mood === 'cheer'
      ? `<path d="M-23 -4 q6 -8 12 0 M11 -4 q6 -8 12 0" stroke="${INK}" stroke-width="3.5" fill="none" stroke-linecap="round"/>`
      : `<circle cx="-17" cy="-4" r="4.5" fill="${INK}"/><circle cx="17" cy="-4" r="4.5" fill="${INK}"/><circle cx="-15.5" cy="-5.5" r="1.6" fill="#fff"/><circle cx="18.5" cy="-5.5" r="1.6" fill="#fff"/>`;
  const mouth = mood === 'cheer'
    ? `<path d="M-8 24 q8 9 16 0 Z" fill="${INK}"/>`
    : `<path d="M-7 24 q7 6 14 0" stroke="${INK}" stroke-width="2.5" fill="none" stroke-linecap="round"/>`;
  return `
    <g class="capy-portrait capy-portrait--${mood}">
      <ellipse cx="-30" cy="-30" rx="8" ry="7" fill="${FUR}"/><ellipse cx="-30" cy="-30" rx="4" ry="3.5" fill="${FUR_DARK}"/>
      <ellipse cx="30" cy="-30" rx="8" ry="7" fill="${FUR}"/><ellipse cx="30" cy="-30" rx="4" ry="3.5" fill="${FUR_DARK}"/>
      <path d="M-40 -20 Q-40 -42 0 -42 Q40 -42 40 -20 L42 20 Q42 48 0 48 Q-42 48 -42 20 Z" fill="${FUR}"/>
      <path d="M-26 10 Q-26 40 0 40 Q26 40 26 10 Q12 4 0 4 Q-12 4 -26 10 Z" fill="${FUR_LIGHT}"/>
      <ellipse cx="-10" cy="14" rx="4" ry="3" fill="${INK}"/><ellipse cx="10" cy="14" rx="4" ry="3" fill="${INK}"/>
      ${eyes}${mouth}
      ${mood === 'cheer' ? `<circle cx="-32" cy="6" r="5" fill="#E8A07A" opacity="0.6"/><circle cx="32" cy="6" r="5" fill="#E8A07A" opacity="0.6"/>` : ''}
      ${FRONT_COSTUME[costume]}
    </g>`;
}

export function capySvg(mood: CapyMood = 'happy', costume: CostumeId = 'panama', cls = ''): string {
  return `<svg class="capy-svg ${cls}" viewBox="-64 -88 128 150" aria-hidden="true">${capyPortrait(mood, costume)}</svg>`;
}
