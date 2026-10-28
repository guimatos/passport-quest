import type { DestinationId } from '../data/destinations';

/**
 * Scene artwork per destination, as tileable parallax layers.
 * Each layer repeats every `width` scene units and scrolls at `speed` times
 * the world speed. Layers are painted in order; `front` layers are painted
 * over the fox and entities (foreground occluders).
 * Coordinates are in the 360 x 720 scene viewBox.
 * PHASE 2: flat placeholder blocks. Phase 3 replaces these with real art.
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

export const SCENE_ART: Record<DestinationId, SceneArt> = {
  brazil: {
    bg: '#5EC8F2',
    band: { top: 390, bottom: 610 },
    backdrop: `
      <rect width="360" height="720" fill="#5EC8F2"/>
      <circle cx="290" cy="130" r="40" fill="#FFD966"/>
      <rect y="330" width="360" height="60" fill="#2A9DD6"/>
      <rect y="380" width="360" height="340" fill="#F3DFA3"/>
    `,
    layers: [
      { speed: 0.15, width: 720, markup: `
        <path d="M60 332 L150 170 L240 332 Z" fill="#4F8A5B"/>
        <path d="M400 332 L470 240 L540 332 Z" fill="#5E9A68"/>
        <path d="M-40 332 L0 290 L60 332 Z" fill="#5E9A68"/>` },
      { speed: 0.45, width: 480, markup: `
        <rect x="40" y="250" width="12" height="100" fill="#8B5A2B"/>
        <ellipse cx="46" cy="250" rx="46" ry="18" fill="#2E8B57"/>
        <rect x="300" y="270" width="12" height="80" fill="#8B5A2B"/>
        <ellipse cx="306" cy="268" rx="40" ry="16" fill="#2E8B57"/>` },
      { speed: 1, width: 360, markup: `
        <ellipse cx="80" cy="450" rx="30" ry="6" fill="#E9CF8A"/>
        <ellipse cx="250" cy="560" rx="36" ry="7" fill="#E9CF8A"/>
        <ellipse cx="170" cy="640" rx="28" ry="6" fill="#E9CF8A"/>` },
    ],
    front: [
      { speed: 1.25, width: 900, markup: `
        <ellipse cx="820" cy="690" rx="90" ry="40" fill="#E4C57C"/>
        <rect x="340" y="560" width="14" height="160" fill="#7A4B2A"/>
        <ellipse cx="347" cy="560" rx="70" ry="24" fill="#2E8B57"/>` },
    ],
  },
  portugal: {
    bg: '#8FB8E8',
    band: { top: 380, bottom: 600 },
    backdrop: `
      <rect width="360" height="720" fill="#8FB8E8"/>
      <rect y="350" width="360" height="280" fill="#B9B2A6"/>
      <rect y="630" width="360" height="90" fill="#3C6EA5"/>
    `,
    layers: [
      { speed: 0.2, width: 720, markup: `
        <path d="M0 300 Q180 170 360 300" stroke="#5A6470" stroke-width="12" fill="none"/>
        <path d="M360 300 Q540 170 720 300" stroke="#5A6470" stroke-width="12" fill="none"/>
        <rect x="0" y="296" width="720" height="10" fill="#5A6470"/>` },
      { speed: 0.5, width: 480, markup: `
        <rect x="20" y="220" width="60" height="140" fill="#E8B04B"/>
        <rect x="90" y="200" width="56" height="160" fill="#D9534F"/>
        <rect x="156" y="230" width="70" height="130" fill="#5B9BD5"/>
        <rect x="236" y="210" width="76" height="150" fill="#F0E2C8"/>
        <rect x="322" y="230" width="60" height="130" fill="#C96A3F"/>
        <rect x="392" y="215" width="70" height="145" fill="#8E6BB8"/>` },
      { speed: 1, width: 360, markup: `
        <rect x="0" y="352" width="360" height="4" fill="#9E978A"/>
        <rect x="40" y="620" width="80" height="6" fill="#8A8377"/>
        <rect x="220" y="620" width="100" height="6" fill="#8A8377"/>` },
    ],
    front: [
      { speed: 1.3, width: 1000, markup: `
        <path d="M700 720 Q760 660 820 720 Z" fill="#8B4B2A"/>
        <rect x="200" y="590" width="10" height="130" fill="#2F3B46"/>
        <rect x="190" y="580" width="30" height="14" rx="4" fill="#2F3B46"/>` },
    ],
  },
};
