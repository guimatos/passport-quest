/**
 * The Scrambly fox guide and runner. No fox reference asset was found in the
 * repository, so this is an original simple vector fox in Scrambly orange.
 * `foxGroup` returns an SVG <g> centered on (0,0) in a ~120-unit box; `foxSvg`
 * wraps it in an <svg> for use in HTML screens.
 * PHASE 2: placeholder; Phase 3 replaces with the final illustration.
 */
export type FoxMood = 'idle' | 'happy' | 'cheer' | 'think' | 'ouch' | 'run';

export function foxGroup(mood: FoxMood = 'idle'): string {
  const mouth = mood === 'cheer' ? `<ellipse cx="0" cy="18" rx="7" ry="5" fill="#201338"/>`
    : mood === 'ouch' ? `<path d="M-6 20 Q0 14 6 20" stroke="#201338" stroke-width="3" fill="none" stroke-linecap="round"/>`
    : mood === 'happy' || mood === 'run' ? `<path d="M-8 16 Q0 24 8 16" stroke="#201338" stroke-width="3" fill="none" stroke-linecap="round"/>`
    : `<path d="M-6 17 Q0 21 6 17" stroke="#201338" stroke-width="3" fill="none" stroke-linecap="round"/>`;
  const eyes = mood === 'ouch'
    ? `<path d="M-20 -8 L-10 0 M-10 -8 L-20 0 M10 -8 L20 0 M20 -8 L10 0" stroke="#201338" stroke-width="3" stroke-linecap="round"/>`
    : `<circle cx="-15" cy="-4" r="5" fill="#201338"/><circle cx="15" cy="-4" r="5" fill="#201338"/><circle cx="-13" cy="-6" r="1.8" fill="#fff"/><circle cx="17" cy="-6" r="1.8" fill="#fff"/>`;
  return `
    <g class="fox fox--${mood}">
      <g class="fox-legs">
        <rect class="leg leg-a" x="-26" y="30" width="12" height="22" rx="6" fill="#C5611A"/>
        <rect class="leg leg-b" x="14" y="30" width="12" height="22" rx="6" fill="#C5611A"/>
      </g>
      <g class="fox-body">
        <ellipse cx="-34" cy="22" rx="22" ry="10" fill="#F58324" class="fox-tail"/>
        <polygon points="-40,-20 -28,-54 -8,-24" fill="#F58324"/>
        <polygon points="40,-20 28,-54 8,-24" fill="#F58324"/>
        <polygon points="-34,-24 -27,-44 -14,-26" fill="#FFF6E8"/>
        <polygon points="34,-24 27,-44 14,-26" fill="#FFF6E8"/>
        <circle r="42" fill="#F58324"/>
        <path d="M-44 6 Q0 60 44 6 Q22 20 0 18 Q-22 20 -44 6Z" fill="#FFF6E8"/>
        ${eyes}
        <ellipse cx="0" cy="8" rx="5" ry="3.5" fill="#201338"/>
        ${mouth}
      </g>
    </g>`;
}

export function foxSvg(mood: FoxMood = 'idle', cls = ''): string {
  return `<svg class="fox-svg ${cls}" viewBox="-60 -60 120 120" aria-hidden="true">${foxGroup(mood)}</svg>`;
}
