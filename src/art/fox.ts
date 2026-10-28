/**
 * The Scrambly fox: guide on the screens and runner in the scene.
 * No fox reference asset was found in the repository, so this is an original
 * vector fox drawn in Scrambly orange with a purple scarf.
 *  - foxGroup(mood): side view, facing right, authored in a 120x120 box
 *    centered on (0,0). Legs and tail carry CSS run-cycle animations.
 *  - foxPortrait(mood): front-facing bust for HTML screens.
 */
export type FoxMood = 'idle' | 'happy' | 'cheer' | 'think' | 'ouch' | 'run';

const ORANGE = '#F58324', DARK = '#C5611A', CREAM = '#FFF6E8', INK = '#201338', PURPLE = '#7845D8';

function sideFace(mood: FoxMood) {
  const eye = mood === 'ouch'
    ? `<path d="M26 -18 l8 8 M34 -18 l-8 8" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`
    : mood === 'cheer'
      ? `<path d="M25 -14 q5 -7 10 0" stroke="${INK}" stroke-width="3" fill="none" stroke-linecap="round"/>`
      : `<circle cx="30" cy="-14" r="4.5" fill="${INK}"/><circle cx="31.5" cy="-15.5" r="1.6" fill="#fff"/>`;
  const mouth = mood === 'cheer' || mood === 'happy'
    ? `<path d="M38 -2 q6 6 12 -2" stroke="${INK}" stroke-width="2.5" fill="none" stroke-linecap="round"/>`
    : mood === 'ouch'
      ? `<path d="M40 0 q5 -4 10 0" stroke="${INK}" stroke-width="2.5" fill="none" stroke-linecap="round"/>`
      : `<path d="M40 -2 q5 4 10 0" stroke="${INK}" stroke-width="2.5" fill="none" stroke-linecap="round"/>`;
  return eye + mouth;
}

export function foxGroup(mood: FoxMood = 'run'): string {
  return `
    <g class="fox fox--${mood}">
      <g class="fox-tail"><path d="M-30 6 Q-62 -6 -60 -36 Q-50 -20 -40 -22 Q-56 -4 -30 10 Z" fill="${ORANGE}"/><path d="M-52 -34 Q-60 -22 -56 -12 Q-48 -20 -46 -28 Z" fill="${CREAM}"/></g>
      <g class="fox-legs">
        <g class="leg leg-back-b"><path d="M-14 16 l-8 24" stroke="${DARK}" stroke-width="9" stroke-linecap="round"/></g>
        <g class="leg leg-front-b"><path d="M16 16 l-6 24" stroke="${DARK}" stroke-width="9" stroke-linecap="round"/></g>
      </g>
      <g class="fox-body">
        <ellipse cx="0" cy="6" rx="36" ry="24" fill="${ORANGE}"/>
        <ellipse cx="-4" cy="16" rx="22" ry="12" fill="${CREAM}"/>
        <g class="fox-head">
          <path d="M14 -34 l6 -24 l14 18 Z" fill="${ORANGE}"/><path d="M18 -30 l3 -12 l7 9 Z" fill="${CREAM}"/>
          <path d="M30 -34 l12 -22 l8 24 Z" fill="${ORANGE}"/><path d="M34 -30 l7 -12 l3 11 Z" fill="${CREAM}"/>
          <circle cx="28" cy="-14" r="22" fill="${ORANGE}"/>
          <path d="M30 -8 Q48 -16 56 0 Q50 10 36 8 Q28 4 30 -8 Z" fill="${CREAM}"/>
          <circle cx="54" cy="-2" r="4.5" fill="${INK}"/>
          ${sideFace(mood)}
        </g>
        <path d="M12 -2 Q26 14 46 8" stroke="${PURPLE}" stroke-width="7" fill="none" stroke-linecap="round"/>
        <path class="fox-scarf" d="M14 -2 q-12 -2 -26 -12" stroke="${PURPLE}" stroke-width="6" fill="none" stroke-linecap="round"/>
      </g>
      <g class="fox-legs fox-legs--front">
        <g class="leg leg-back-a"><path d="M-6 18 l-6 24" stroke="${ORANGE}" stroke-width="9" stroke-linecap="round"/><path d="M-12 42 l-2 0" stroke="${INK}" stroke-width="6" stroke-linecap="round"/></g>
        <g class="leg leg-front-a"><path d="M24 18 l-2 24" stroke="${ORANGE}" stroke-width="9" stroke-linecap="round"/><path d="M22 42 l-2 0" stroke="${INK}" stroke-width="6" stroke-linecap="round"/></g>
      </g>
    </g>`;
}

export function foxPortrait(mood: FoxMood = 'happy'): string {
  const eyes = mood === 'ouch'
    ? `<path d="M-20 -8 l10 8 M-10 -8 l-10 8 M10 -8 l10 8 M20 -8 l-10 8" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`
    : mood === 'cheer'
      ? `<path d="M-21 -6 q6 -8 12 0 M9 -6 q6 -8 12 0" stroke="${INK}" stroke-width="3.5" fill="none" stroke-linecap="round"/>`
      : `<circle cx="-15" cy="-6" r="5" fill="${INK}"/><circle cx="15" cy="-6" r="5" fill="${INK}"/><circle cx="-13" cy="-8" r="1.8" fill="#fff"/><circle cx="17" cy="-8" r="1.8" fill="#fff"/>`;
  const mouth = mood === 'cheer'
    ? `<path d="M-8 19 q8 10 16 0 Z" fill="${INK}"/><path d="M-3 24 q3 2 6 0 Z" fill="#F08080"/>`
    : mood === 'think'
      ? `<path d="M-5 21 q5 -3 10 0" stroke="${INK}" stroke-width="3" fill="none" stroke-linecap="round"/>`
      : `<path d="M-8 19 q8 8 16 0" stroke="${INK}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
  return `
    <g class="fox-portrait fox-portrait--${mood}">
      <path d="M-42 -22 l-8 -40 l30 20 Z" fill="${ORANGE}"/><path d="M-38 -26 l-5 -22 l16 12 Z" fill="${CREAM}"/>
      <path d="M42 -22 l8 -40 l-30 20 Z" fill="${ORANGE}"/><path d="M38 -26 l5 -22 l-16 12 Z" fill="${CREAM}"/>
      <path d="M-46 -10 Q-50 30 -22 44 Q0 54 22 44 Q50 30 46 -10 Q40 -40 0 -42 Q-40 -40 -46 -10 Z" fill="${ORANGE}"/>
      <path d="M-22 12 Q-14 32 0 32 Q14 32 22 12 Q12 20 0 18 Q-12 20 -22 12 Z" fill="${CREAM}"/>
      <path d="M-14 -30 q14 -8 28 0 q-6 -2 -14 -1 q-8 -1 -14 1 Z" fill="${DARK}" opacity="0.5"/>
      <ellipse cx="0" cy="12" rx="6" ry="4" fill="${INK}"/>
      ${eyes}${mouth}
      <path d="M-30 40 q30 14 60 0" stroke="${PURPLE}" stroke-width="9" fill="none" stroke-linecap="round"/>
      <path d="M-26 44 q-10 8 -8 20" stroke="${PURPLE}" stroke-width="7" fill="none" stroke-linecap="round"/>
      ${mood === 'cheer' ? `<circle cx="-30" cy="4" r="5" fill="#F7A072" opacity="0.7"/><circle cx="30" cy="4" r="5" fill="#F7A072" opacity="0.7"/>` : ''}
    </g>`;
}

export function foxSvg(mood: FoxMood = 'happy', cls = ''): string {
  return `<svg class="fox-svg ${cls}" viewBox="-60 -66 120 136" aria-hidden="true">${foxPortrait(mood)}</svg>`;
}
