// Layered terrain renderer.
// Keeps mining/collision tile based, but renders Spore Grotto with larger blended
// terrain chunks + decals so the floor no longer looks like repeated square tiles.

const SPORE_TERRAIN_ASSETS = [
  'floor_0','floor_1','floor_2','floor_3','floor_4','floor_5','floor_6','floor_7',
  'wall_0','wall_1','wall_2','wall_3','wall_4','wall_5','wall_6','wall_7','wall_8','wall_9','wall_10','wall_11','wall_12','wall_13','wall_14','wall_15',
  'shadow_top','shadow_bottom','shadow_left','shadow_right',
  'floor_chunk_0','floor_chunk_1','floor_chunk_2','floor_chunk_3','floor_chunk_4','floor_chunk_5','floor_chunk_6','floor_chunk_7',
  'floor_decal_0','floor_decal_1','floor_decal_2','floor_decal_3','floor_decal_4','floor_decal_5','floor_decal_6','floor_decal_7','floor_decal_8','floor_decal_9',
  'wall_shadow_blob_0','wall_shadow_blob_1','wall_shadow_blob_2','wall_shadow_blob_3'
];

function preloadTerrainAssets(scene) {
  if (!scene || !scene.load) return;
  SPORE_TERRAIN_ASSETS.forEach(key => {
    scene.load.image('spore_' + key, 'assets/terrain/spore/' + key + '.png');
  });
}

function setupTerrainRenderer(scene) {
  scene.terrainChunkLayer = scene.add.container(0, 0).setDepth(1.08);
  scene.terrainFloorLayer = scene.add.container(0, 0).setDepth(1.15);
  scene.terrainWallLayer = scene.add.container(0, 0).setDepth(1.28);
  scene.terrainDecalLayer = scene.add.container(0, 0).setDepth(1.34);
  scene.terrainOverlayLayer = scene.add.container(0, 0).setDepth(1.42);
  scene.terrainSpriteSignature = '';
  scene.terrainSpritesEnabled = true;
}

function markTerrainRendererDirty(scene) {
  if (!scene || !scene.map) return;
  scene.map._terrainSpriteVersion = (scene.map._terrainSpriteVersion || 0) + 1;
  scene.terrainSpriteSignature = '';
}

function getTerrainSpriteSignature(scene) {
  if (!scene || !scene.map) return 'none';
  const mapId = scene.currentMapName === 'mine' ? ('mine-' + (scene.mineLevel || 1)) : 'home';
  return [
    mapId,
    scene.currentBiomeId || scene.map.biomeId || 'none',
    scene.map._terrainSpriteVersion || 0,
    scene.map.visualDecorVersion || 0
  ].join('|');
}

function isSporeTerrainScene(scene) {
  if (!scene || scene.currentMapName !== 'mine') return false;
  const biomeId = scene.currentBiomeId || scene.map?.biomeId;
  return biomeId === 'sporeGrotto' || (scene.mineLevel || 1) <= 10;
}

function refreshTerrainSprites(scene, force = false) {
  if (!scene || !scene.terrainSpritesEnabled || !scene.terrainFloorLayer || !scene.map) return;
  const signature = getTerrainSpriteSignature(scene);
  if (!force && signature === scene.terrainSpriteSignature) return;

  if (scene.terrainChunkLayer) scene.terrainChunkLayer.removeAll(true);
  scene.terrainFloorLayer.removeAll(true);
  scene.terrainWallLayer.removeAll(true);
  if (scene.terrainDecalLayer) scene.terrainDecalLayer.removeAll(true);
  scene.terrainOverlayLayer.removeAll(true);
  scene.terrainSpriteSignature = signature;

  if (!isSporeTerrainScene(scene)) return;

  addSporeTerrainChunks(scene);
  addSporeFloorDecals(scene);

  for (let y = 0; y < scene.mapHeight; y++) {
    for (let x = 0; x < scene.mapWidth; x++) {
      const tile = scene.map[y]?.[x];
      if (!tile) continue;
      addTerrainSpriteForTile(scene, tile, x, y);
    }
  }
}

function terrainHash(x, y, salt = 0) {
  let n = (x * 374761393 + y * 668265263 + salt * 1442695041) | 0;
  n = (n ^ (n >> 13)) * 1274126177;
  return Math.abs(n ^ (n >> 16));
}

function tileVariantIndex(tile, x, y, max) {
  const seed = (tile?.detailSeed || 0) + x * 31 + y * 17 + (tile?.variation || 0) * 13;
  return Math.abs(seed) % max;
}

function isVisualFloorTile(tile) {
  return tile && ['floor', 'torch', 'exitUp', 'exitDown', 'exit'].includes(tile.type);
}

function isVisualWallTile(tile) {
  return tile && ['caveWall', 'stone', 'coal', 'copper', 'copperWall', 'wood', 'largeOreChunk'].includes(tile.type);
}

function countVisualFloors(scene, startX, startY, width, height) {
  let count = 0;
  for (let y = startY; y < startY + height; y++) {
    for (let x = startX; x < startX + width; x++) {
      if (x < 0 || y < 0 || x >= scene.mapWidth || y >= scene.mapHeight) continue;
      if (isVisualFloorTile(scene.map[y]?.[x])) count++;
    }
  }
  return count;
}

function addSporeTerrainChunks(scene) {
  const s = scene.tileSize;
  // Large overlapping chunks hide the 1-tile grid while collision/mining stays tile based.
  for (let y = -1; y < scene.mapHeight; y += 3) {
    for (let x = -1; x < scene.mapWidth; x += 3) {
      const floorCount = countVisualFloors(scene, x, y, 5, 5);
      if (floorCount < 7) continue;
      const h = terrainHash(x, y, scene.mineLevel || 1);
      const key = 'spore_floor_chunk_' + (h % 8);
      const img = scene.add.image((x + 2.5) * s, (y + 2.5) * s, key);
      img.setDisplaySize(s * 5.15, s * 5.15);
      img.setOrigin(0.5);
      img.setAlpha(0.88 + ((h % 9) / 100));
      img.setAngle([0, 90, 180, 270][h % 4]);
      scene.terrainChunkLayer.add(img);
    }
  }
}

function addSporeFloorDecals(scene) {
  const s = scene.tileSize;
  for (let y = 0; y < scene.mapHeight; y++) {
    for (let x = 0; x < scene.mapWidth; x++) {
      const tile = scene.map[y]?.[x];
      if (!isVisualFloorTile(tile)) continue;
      const h = terrainHash(x, y, (scene.mineLevel || 1) + 77);
      if (h % 100 > 18) continue;
      const key = 'spore_floor_decal_' + (h % 10);
      const dx = ((h >> 3) % 11) - 5;
      const dy = ((h >> 7) % 11) - 5;
      const img = scene.add.image(x * s + s / 2 + dx, y * s + s / 2 + dy, key);
      const scale = 1.25 + ((h % 7) * 0.09);
      img.setDisplaySize(s * scale, s * scale);
      img.setOrigin(0.5);
      img.setAlpha(0.55);
      img.setAngle([0, 90, 180, 270][(h >> 2) % 4]);
      scene.terrainDecalLayer.add(img);
    }
  }
}

function wallMaskValue(scene, x, y) {
  const mask = typeof getWallMask === 'function' ? getWallMask(scene, x, y) : { top: true, right: true, bottom: true, left: true };
  return (mask.top ? 1 : 0) + (mask.right ? 2 : 0) + (mask.bottom ? 4 : 0) + (mask.left ? 8 : 0);
}

function addTerrainSpriteForTile(scene, tile, x, y) {
  const s = scene.tileSize;
  const cx = x * s + s / 2;
  const cy = y * s + s / 2;

  // Do not place one square sprite per floor tile anymore. The floor is now made
  // from large overlapping terrain chunks and decals to avoid obvious repetition.
  if (isVisualFloorTile(tile)) {
    addSporeFloorMicroOverlays(scene, tile, x, y);
  }

  if (isVisualWallTile(tile)) {
    if (tile.type === 'caveWall') {
      const mask = wallMaskValue(scene, x, y);
      const img = scene.add.image(cx, cy, 'spore_wall_' + mask);
      img.setDisplaySize(s + 2, s + 2);
      img.setOrigin(0.5);
      img.setAlpha(0.98);
      scene.terrainWallLayer.add(img);
      addSporeEdgeShadowSprites(scene, x, y);
      addSporeWallShadowBlob(scene, x, y);
    }
  }
}

function addSporeFloorMicroOverlays(scene, tile, x, y) {
  const s = scene.tileSize;
  const px = x * s;
  const py = y * s;
  const seed = (tile.detailSeed || 0) + x * 131 + y * 97;
  if (seed % 11 === 0) {
    const g = scene.add.graphics();
    g.fillStyle(0xbfff85, 0.28);
    g.fillCircle(px + 7 + (seed % 13), py + 8 + (seed % 11), 1.2);
    g.fillStyle(0x6bffd0, 0.20);
    g.fillCircle(px + 15 + (seed % 7), py + 16 + (seed % 9), 1.8);
    scene.terrainOverlayLayer.add(g);
  }
}

function addSporeWallShadowBlob(scene, x, y) {
  const s = scene.tileSize;
  const h = terrainHash(x, y, 203);
  if (h % 100 > 11) return;
  const img = scene.add.image(x * s + s / 2, y * s + s / 2, 'spore_wall_shadow_blob_' + (h % 4));
  img.setDisplaySize(s * 2.35, s * 2.35);
  img.setOrigin(0.5);
  img.setAlpha(0.28);
  scene.terrainOverlayLayer.add(img);
}

function addSporeEdgeShadowSprites(scene, x, y) {
  const s = scene.tileSize;
  const cx = x * s + s / 2;
  const cy = y * s + s / 2;
  const mask = typeof getWallMask === 'function' ? getWallMask(scene, x, y) : { top: true, right: true, bottom: true, left: true };
  const open = [
    ['top', !mask.top, cx, cy, 0],
    ['bottom', !mask.bottom, cx, cy, 0],
    ['left', !mask.left, cx, cy, 0],
    ['right', !mask.right, cx, cy, 0]
  ];
  open.forEach(([name, should, xPos, yPos]) => {
    if (!should) return;
    const img = scene.add.image(xPos, yPos, 'spore_shadow_' + name);
    img.setDisplaySize(s + 1, s + 1);
    img.setOrigin(0.5);
    img.setAlpha(0.46);
    scene.terrainOverlayLayer.add(img);
  });
}
