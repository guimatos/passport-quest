import type { DestinationDef, ItemId } from '../data/destinations';
import { ITEM_ART, DECOY_ART } from '../art/items';
import { SCENE_ART } from '../art/scenes';
import { svgFromString } from '../lib/dom';

export const SCENE_W = 360;
export const SCENE_H = 720;

export interface SceneHandlers {
  onItem: (id: ItemId, el: SVGGElement, ev: PointerEvent) => void;
  onDecoy: (id: string, el: SVGGElement) => void;
}

export interface Scene {
  el: SVGSVGElement;
  items: Map<ItemId, SVGGElement>;
  setHint(id: ItemId | null): void;
  markCollected(id: ItemId): void;
  destroy(): void;
}

/**
 * Builds the SVG scene for a destination: back art, items, decoys, front art.
 * Pointer input is delegated on the <svg> so there is one listener per scene,
 * attached with the game's AbortSignal.
 */
export function buildScene(dest: DestinationDef, handlers: SceneHandlers, signal: AbortSignal): Scene {
  const art = SCENE_ART[dest.id];

  const itemsMarkup = dest.items.map((it) => `
    <g class="item" data-id="${it.id}" transform="translate(${it.x} ${it.y})">
      <g class="item-wiggle">
        <g class="item-art" transform="rotate(${it.rotate ?? 0}) scale(${it.scale ?? 1})">${ITEM_ART[it.id]()}</g>
      </g>
      <circle class="hit" r="${it.hitRadius}" fill="transparent"/>
    </g>`).join('');

  const decoysMarkup = dest.decoys.map((d) => `
    <g class="decoy" data-id="${d.id}" transform="translate(${d.x} ${d.y})">
      <g class="decoy-art">${DECOY_ART[d.id] ?? ''}</g>
      <circle class="hit" r="${d.hitRadius}" fill="transparent"/>
    </g>`).join('');

  const el = svgFromString(`
    <svg class="scene scene--${dest.id}" viewBox="0 0 ${SCENE_W} ${SCENE_H}" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <g class="layer layer-back">${art.back}</g>
      <g class="layer layer-decoys">${decoysMarkup}</g>
      <g class="layer layer-items">${itemsMarkup}</g>
      <g class="layer layer-front" pointer-events="none">${art.front}</g>
    </svg>`);

  const items = new Map<ItemId, SVGGElement>();
  el.querySelectorAll<SVGGElement>('.item').forEach((g) => items.set(g.dataset.id as ItemId, g));

  el.addEventListener('pointerdown', (ev) => {
    if (!ev.isPrimary) return;
    const target = ev.target as Element;
    const item = target.closest<SVGGElement>('.item');
    if (item && !item.classList.contains('collected')) {
      handlers.onItem(item.dataset.id as ItemId, item, ev);
      return;
    }
    const decoy = target.closest<SVGGElement>('.decoy');
    if (decoy) handlers.onDecoy(decoy.dataset.id!, decoy);
  }, { signal });

  let hinted: SVGGElement | null = null;

  return {
    el,
    items,
    setHint(id) {
      hinted?.classList.remove('hint');
      hinted = id ? items.get(id) ?? null : null;
      hinted?.classList.add('hint');
    },
    markCollected(id) {
      const g = items.get(id);
      if (!g) return;
      g.classList.remove('hint');
      g.classList.add('collected');
      if (hinted === g) hinted = null;
    },
    destroy() { el.remove(); },
  };
}
