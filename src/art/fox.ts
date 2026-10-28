/**
 * The Scrambly fox guide. Returns an <svg> element string sized to its container.
 * No fox reference asset was found in the repository, so this is an original
 * simple vector fox drawn in a friendly Scrambly-orange style.
 * PHASE 2: placeholder; Phase 3 replaces with the final illustration.
 */
export type FoxMood = 'idle' | 'happy' | 'cheer' | 'think';

export function foxSvg(mood: FoxMood = 'idle', cls = ''): string {
  const mouth = mood === 'cheer' ? `<ellipse cx="0" cy="18" rx="7" ry="5" fill="#201338"/>`
    : mood === 'happy' ? `<path d="M-8 16 Q0 24 8 16" stroke="#201338" stroke-width="3" fill="none" stroke-linecap="round"/>`
    : `<path d="M-6 17 Q0 21 6 17" stroke="#201338" stroke-width="3" fill="none" stroke-linecap="round"/>`;
  return `
  <svg class="fox fox--${mood} ${cls}" viewBox="-60 -60 120 120" aria-hidden="true">
    <g class="fox-body">
      <polygon points="-40,-20 -28,-54 -8,-24" fill="#F58324"/>
      <polygon points="40,-20 28,-54 8,-24" fill="#F58324"/>
      <polygon points="-34,-24 -27,-44 -14,-26" fill="#FFF6E8"/>
      <polygon points="34,-24 27,-44 14,-26" fill="#FFF6E8"/>
      <circle r="42" fill="#F58324"/>
      <path d="M-44 6 Q0 60 44 6 Q22 20 0 18 Q-22 20 -44 6Z" fill="#FFF6E8"/>
      <circle cx="-15" cy="-4" r="5" fill="#201338"/>
      <circle cx="15" cy="-4" r="5" fill="#201338"/>
      <circle cx="-13" cy="-6" r="1.8" fill="#fff"/>
      <circle cx="17" cy="-6" r="1.8" fill="#fff"/>
      <ellipse cx="0" cy="8" rx="5" ry="3.5" fill="#201338"/>
      ${mouth}
    </g>
  </svg>`;
}
