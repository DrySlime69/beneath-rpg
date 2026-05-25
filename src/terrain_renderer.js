// Layered terrain renderer.
// This moves biome terrain away from pure Graphics rectangles and into cached sprite tile layers.
// Step 1 focuses on Spore Grotto (levels 1-10), while the old renderer remains as fallback.

const SPORE_TERRAIN_ASSETS = [
  'floor_0','floor_1','floor_2','floor_3','floor_4','floor_5','floor_6','floor_7',
  'wall_0','wall_1','wall_2','wall_3','wall_4','wall_5','wall_6','wall_7','wall_8','wall_9','wall_10','wall_11','wall_12','wall_13','wall_14','wall_15',
  'shadow_top','shadow_bottom','shadow_left','shadow_right'
];

function preloadTerrainAssets(scene) {
  if (!scene || !scene.load) return;
  SPORE_TERRAIN_ASSETS.forEach(key => {
    scene.load.image('spore_' + key, 'assets/terrain/spore/' + key + '.png');
  });
}

function setupTerrainRenderer(scene) {
  scene.terrainFloorLayer = scene.add.container(0, 0).setDepth(1.15);
  scene.terrainWallLayer = scene.add.container(0, 0).setDepth(1.28);
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

  scene.terrainFloorLayer.removeAll(true);
  scene.terrainWallLayer.removeAll(true);
  scene.terrainOverlayLayer.removeAll(true);
  scene.terrainSpriteSignature = signature;

  if (!isSporeTerrainScene(scene)) return;

  for (let y = 0; y < scene.mapHeight; y++) {
    for (let x = 0; x < scene.mapWidth; x++) {
      const tile = scene.map[y]?.[x];
      if (!tile) continue;
      addTerrainSpriteForTile(scene, tile, x, y);
    }
  }
}

function tileVariantIndex(tile, x, y, max) {
  const seed = (tile?.detailSeed || 0) + x * 31 + y * 17 + (tile?.variation || 0) * 13;
  return Math.abs(seed) % max;
}

function wallMaskValue(scene, x, y) {
  const mask = typeof getWallMask === 'function' ? getWallMask(scene, x, y) : { top: true, right: true, bottom: true, left: true };
  return (mask.top ? 1 : 0) + (mask.right ? 2 : 0) + (mask.bottom ? 4 : 0) + (mask.left ? 8 : 0);
}

function addTerrainSpriteForTile(scene, tile, x, y) {
  const s = scene.tileSize;
  const cx = x * s + s / 2;
  const cy = y * s + s / 2;
  const isFloor = ['floor', 'torch', 'exitUp', 'exitDown', 'exit'].includes(tile.type);
  const isWall = ['caveWall', 'stone', 'coal', 'copper', 'copperWall', 'wood', 'largeOreChunk'].includes(tile.type);

  if (isFloor) {
    const idx = tileVariantIndex(tile, x, y, 8);
    const img = scene.add.image(cx, cy, 'spore_floor_' + idx);
    img.setDisplaySize(s + 1, s + 1);
    img.setOrigin(0.5);
    img.setAlpha(tile.type === 'floor' ? 1 : 0.78);
    scene.terrainFloorLayer.add(img);

    addSporeFloorMicroOverlays(scene, tile, x, y);
  }

  if (isWall) {
    if (tile.type === 'caveWall') {
      const mask = wallMaskValue(scene, x, y);
      const img = scene.add.image(cx, cy, 'spore_wall_' + mask);
      img.setDisplaySize(s + 2, s + 2);
      img.setOrigin(0.5);
      img.setAlpha(1);
      scene.terrainWallLayer.add(img);
      addSporeEdgeShadowSprites(scene, x, y);
    }
  }
}

function addSporeFloorMicroOverlays(scene, tile, x, y) {
  // Tiny deterministic overlay dots drawn with Phaser sprites is overkill; use Graphics once into overlay layer.
  // These are cached as simple small circles/rectangles and avoid redrawing every frame.
  const s = scene.tileSize;
  const px = x * s;
  const py = y * s;
  const seed = (tile.detailSeed || 0) + x * 131 + y * 97;
  if (seed % 5 === 0) {
    const g = scene.add.graphics();
    g.fillStyle(0xbfff85, 0.52);
    g.fillCircle(px + 7 + (seed % 13), py + 8 + (seed % 11), 1.4);
    g.fillStyle(0x6bffd0, 0.32);
    g.fillCircle(px + 15 + (seed % 7), py + 16 + (seed % 9), 2.2);
    scene.terrainOverlayLayer.add(g);
  }
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
    img.setAlpha(0.55);
    scene.terrainOverlayLayer.add(img);
  });
}
