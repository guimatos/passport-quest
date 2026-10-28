import type { DestinationId } from '../data/destinations';

/**
 * Scene artwork per destination. Each scene is split in two layers:
 *   back  — everything painted behind the collectibles (sky, sea, buildings)
 *   front — occluders painted over the collectibles (palm fronds, railings,
 *           sand mounds). The front layer never receives pointer events so
 *           taps go through to the item hit areas below.
 * Coordinates are in the 360 x 720 scene viewBox.
 * PHASE 2: flat placeholder blocks. Phase 3 replaces these with real art.
 */
export interface SceneArt {
  /** Page background color shown around the scene while loading / in letterboxed frames. */
  bg: string;
  back: string;
  front: string;
}

export const SCENE_ART: Record<DestinationId, SceneArt> = {
  brazil: {
    bg: '#5EC8F2',
    back: `
      <rect width="360" height="720" fill="#5EC8F2"/>
      <circle cx="290" cy="120" r="40" fill="#FFD966"/>
      <path d="M0 330 L70 220 L140 330 Z" fill="#4F8A5B"/>
      <rect y="330" width="360" height="110" fill="#2A9DD6"/>
      <rect y="440" width="360" height="280" fill="#F3DFA3"/>
      <rect x="40" y="250" width="14" height="130" fill="#8B5A2B"/>
    `,
    front: `
      <ellipse cx="47" cy="250" rx="60" ry="22" fill="#2E8B57"/>
      <ellipse cx="300" cy="470" rx="46" ry="16" fill="#E9CF8A"/>
      <ellipse cx="236" cy="536" rx="40" ry="12" fill="#E9CF8A"/>
    `,
  },
  portugal: {
    bg: '#8FB8E8',
    back: `
      <rect width="360" height="720" fill="#8FB8E8"/>
      <rect x="20" y="200" width="70" height="160" fill="#E8B04B"/>
      <rect x="100" y="180" width="60" height="180" fill="#D9534F"/>
      <rect x="170" y="210" width="80" height="150" fill="#5B9BD5"/>
      <rect x="260" y="190" width="80" height="170" fill="#F0E2C8"/>
      <rect y="360" width="360" height="40" fill="#8C8578"/>
      <rect y="400" width="360" height="320" fill="#3C6EA5"/>
      <path d="M0 392 Q180 300 360 392" stroke="#5A6470" stroke-width="10" fill="none"/>
    `,
    front: `
      <rect x="96" y="286" width="26" height="30" fill="#D9534F" opacity="0.9"/>
      <rect x="250" y="396" width="110" height="14" fill="#6B7C8C"/>
      <ellipse cx="60" cy="540" rx="34" ry="12" fill="#2F5C8E"/>
    `,
  },
};
