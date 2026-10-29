import type { CostumeId, ItemId, ObstacleId } from '../data/destinations';
import { MeshBuilder, hex, type RGB } from '../gl/mesh';
import { makeMesh, type Mesh } from '../gl/renderer';
import { COSTUME_COLORS } from '../art/capy';

/**
 * Low-poly models for the 3D runner, built from primitives with vertex
 * colours (no textures, no assets). Capi is split into body, head, leg and
 * arm meshes so the runner can animate limbs with matrices. Items are about
 * 0.6 units tall and centred on the origin; obstacles sit on the ground.
 */
const FUR = hex('#A5713F'), FUR_DARK = hex('#7E5430'), FUR_LIGHT = hex('#C99263'), INK = hex('#201338'), CREAM = hex('#FFF6E8');

export interface CapiMeshes { body: Mesh; head: Mesh; leg: Mesh; arm: Mesh }

export function buildCapi(costume: CostumeId): CapiMeshes {
  const c = COSTUME_COLORS[costume];
  const shirt = hex(c.shirt), accent = hex(c.shirtAccent), shorts = hex(c.shorts);
  const body = new MeshBuilder();
  body.box(0.72, 0.62, 0.46, shirt, { p: [0, 1.0, 0] });
  body.box(0.74, 0.14, 0.48, accent, { p: [0, 1.25, 0] });
  body.box(0.7, 0.3, 0.44, shorts, { p: [0, 0.62, 0] });
  const head = new MeshBuilder();
  head.box(0.62, 0.52, 0.56, FUR, { p: [0, 0, 0] });
  head.box(0.4, 0.3, 0.3, FUR_LIGHT, { p: [0, -0.1, -0.36] });     // snout (faces -z)
  head.box(0.16, 0.08, 0.1, INK, { p: [0, -0.02, -0.52] });         // nose
  head.box(0.1, 0.1, 0.06, INK, { p: [-0.18, 0.1, -0.29] });        // eyes
  head.box(0.1, 0.1, 0.06, INK, { p: [0.18, 0.1, -0.29] });
  head.box(0.14, 0.14, 0.1, FUR, { p: [-0.24, 0.3, 0.05] });        // ears
  head.box(0.14, 0.14, 0.1, FUR, { p: [0.24, 0.3, 0.05] });
  head.box(0.08, 0.08, 0.04, FUR_DARK, { p: [-0.24, 0.3, 0.0] });
  head.box(0.08, 0.08, 0.04, FUR_DARK, { p: [0.24, 0.3, 0.0] });
  const leg = new MeshBuilder();
  leg.box(0.2, 0.5, 0.24, FUR, { p: [0, -0.25, 0] });
  leg.box(0.22, 0.12, 0.34, INK, { p: [0, -0.52, -0.04] });         // sneaker
  const arm = new MeshBuilder();
  arm.box(0.16, 0.46, 0.18, FUR, { p: [0, -0.23, 0] });
  arm.box(0.18, 0.14, 0.2, FUR_LIGHT, { p: [0, -0.5, 0] });          // paw
  return { body: makeMesh(body.build()), head: makeMesh(head.build()), leg: makeMesh(leg.build()), arm: makeMesh(arm.build()) };
}

const ITEM_COLORS: Record<ItemId, RGB> = {
  coconut: hex('#5FAF4E'), acai: hex('#5B2A86'), brigadeiro: hex('#5A3A22'), bondinho: hex('#F58324'), violao: hex('#C9803A'), football: CREAM,
  pandeiro: hex('#D9A066'), mask: hex('#7845D8'), apito: hex('#C0C0C0'), nata: hex('#F2C94C'), francesinha: hex('#D9534F'), sardine: hex('#7FA7C9'),
  azulejo: hex('#2E6FD8'), tram: hex('#F2C94C'), rabelo: hex('#8B5A2B'), martelinho: hex('#D9534F'), balloon: hex('#F58324'), manjerico: hex('#1FA463'),
};
const OBSTACLE_COLORS: Record<ObstacleId, RGB> = { crab: hex('#D9534F'), urchin: INK, gull: CREAM, crate: hex('#A86D37') };

/** Placeholder until the full item set lands: a coloured block with a lighter top. */
export function buildItem(id: ItemId): Mesh {
  const b = new MeshBuilder();
  b.box(0.5, 0.5, 0.5, ITEM_COLORS[id]);
  return makeMesh(b.build());
}

export function buildObstacle(id: ObstacleId): Mesh {
  const b = new MeshBuilder();
  b.box(0.7, 0.5, 0.6, OBSTACLE_COLORS[id], { p: [0, 0.25, 0] });
  return makeMesh(b.build());
}

/** Soft ground shadow: a dark disc drawn with alpha, unlit. */
export function buildShadow(): Mesh {
  const b = new MeshBuilder();
  b.disc(0.5, 12, INK, undefined, 0);
  return makeMesh(b.build());
}
