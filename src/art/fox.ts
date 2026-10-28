/**
 * The Scrambly fox guide, drawn as an upright, human-like character in a
 * purple hoodie: half body with arms for the HUD and screens. No fox
 * reference asset was found in the repository, so this is original art
 * in Scrambly orange and purple.
 */
export type FoxMood = 'idle' | 'happy' | 'cheer' | 'think' | 'ouch';

const ORANGE = '#F58324', DARK = '#C5611A', CREAM = '#FFF6E8', INK = '#201338', PURPLE = '#7845D8', PURPLE_DARK = '#5a2fb0';

export function foxPortrait(mood: FoxMood = 'happy'): string {
  const eyes = mood === 'ouch'
    ? `<path d="M-20 -14 l10 8 M-10 -14 l-10 8 M10 -14 l10 8 M20 -14 l-10 8" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`
    : mood === 'cheer'
      ? `<path d="M-21 -12 q6 -8 12 0 M9 -12 q6 -8 12 0" stroke="${INK}" stroke-width="3.5" fill="none" stroke-linecap="round"/>`
      : `<circle cx="-15" cy="-12" r="5" fill="${INK}"/><circle cx="15" cy="-12" r="5" fill="${INK}"/><circle cx="-13" cy="-14" r="1.8" fill="#fff"/><circle cx="17" cy="-14" r="1.8" fill="#fff"/>`;
  const mouth = mood === 'cheer'
    ? `<path d="M-8 13 q8 10 16 0 Z" fill="${INK}"/><path d="M-3 18 q3 2 6 0 Z" fill="#F08080"/>`
    : mood === 'think'
      ? `<path d="M-5 15 q5 -3 10 0" stroke="${INK}" stroke-width="3" fill="none" stroke-linecap="round"/>`
      : `<path d="M-8 13 q8 8 16 0" stroke="${INK}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
  const waving = mood === 'happy' || mood === 'cheer';
  return `
    <g class="fox-portrait fox-portrait--${mood}">
      <g class="p-arm p-arm-l"><path d="M-34 44 l-12 26" stroke="${PURPLE}" stroke-width="11" stroke-linecap="round"/><circle cx="-48" cy="72" r="6" fill="${ORANGE}"/></g>
      <g class="p-arm p-arm-r ${waving ? 'wave' : ''}"><path d="M34 44 l12 ${waving ? -28 : 26}" stroke="${PURPLE}" stroke-width="11" stroke-linecap="round"/><circle cx="48" cy="${waving ? 14 : 72}" r="6" fill="${ORANGE}"/></g>
      <path d="M-34 40 Q-36 30 -24 30 L24 30 Q36 30 34 40 L36 90 L-36 90 Z" fill="${PURPLE}"/>
      <path d="M-14 30 L0 44 L14 30 Z" fill="${PURPLE_DARK}"/>
      <path d="M-28 70 h56" stroke="${PURPLE_DARK}" stroke-width="2" opacity="0.6"/>
      <rect x="-6" y="26" width="12" height="8" rx="3" fill="${ORANGE}"/>
      <path d="M-42 -28 l-8 -40 l30 20 Z" fill="${ORANGE}"/><path d="M-38 -32 l-5 -22 l16 12 Z" fill="${CREAM}"/>
      <path d="M42 -28 l8 -40 l-30 20 Z" fill="${ORANGE}"/><path d="M38 -32 l5 -22 l-16 12 Z" fill="${CREAM}"/>
      <path d="M-46 -16 Q-50 24 -22 38 Q0 48 22 38 Q50 24 46 -16 Q40 -46 0 -48 Q-40 -46 -46 -16 Z" fill="${ORANGE}"/>
      <path d="M-22 6 Q-14 26 0 26 Q14 26 22 6 Q12 14 0 12 Q-12 14 -22 6 Z" fill="${CREAM}"/>
      <path d="M-14 -36 q14 -8 28 0 q-6 -2 -14 -1 q-8 -1 -14 1 Z" fill="${DARK}" opacity="0.5"/>
      <ellipse cx="0" cy="6" rx="6" ry="4" fill="${INK}"/>
      ${eyes}${mouth}
      ${mood === 'cheer' ? `<circle cx="-30" cy="-2" r="5" fill="#F7A072" opacity="0.7"/><circle cx="30" cy="-2" r="5" fill="#F7A072" opacity="0.7"/>` : ''}
    </g>`;
}

export function foxSvg(mood: FoxMood = 'happy', cls = ''): string {
  return `<svg class="fox-svg ${cls}" viewBox="-64 -72 128 166" aria-hidden="true">${foxPortrait(mood)}</svg>`;
}
