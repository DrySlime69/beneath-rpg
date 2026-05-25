// Asset pipeline for real sprite-based biome art.
// These are small hand-authored/generated placeholder sprites that replace pure shape drawing.
// Later, higher-quality pixel art can replace the PNGs without changing map generation logic.

const BIOME_ASSET_BASE = 'assets/biome/';

const BIOME_ASSET_FILES = [
  'ore_stone', 'ore_copperOre', 'ore_ironOre', 'ore_obsidianOre', 'ore_goldOre', 'ore_ebonyOre',
  'decor_glowMushroom', 'decor_fungusPatch', 'decor_sporePods', 'decor_mossClump', 'decor_smallBlueCrystal',
  'decor_bonePile', 'decor_ribBones', 'decor_skull', 'decor_webPatch',
  'decor_iceCrystal', 'decor_frostPatch', 'decor_frozenStalagmite', 'decor_snowBones',
  'decor_purpleCrystal', 'decor_blueCrystal', 'decor_crystalShard', 'decor_glowPool',
  'decor_emberCrystal', 'decor_lavaCrack', 'decor_ashPile', 'decor_charredBones', 'decor_moltenPebbles',
  'decor_corePillar', 'decor_blueCore', 'decor_ancientPlate', 'decor_cableCoil', 'decor_techRubble',
  'decor_sporeGarden', 'decor_boneAltar', 'decor_iceShrine', 'decor_crystalGate', 'decor_emberVent', 'decor_coreMachine',
  'wall_hangingMoss', 'wall_sporeVines', 'wall_wallMushrooms',
  'wall_wallSkull', 'wall_boneWall', 'wall_hangingWeb',
  'wall_icicles', 'wall_frostVeins', 'wall_iceWallCrack',
  'wall_crystalWallGrowth', 'wall_purpleVeins', 'wall_gemWall',
  'wall_lavaDrip', 'wall_emberVeins', 'wall_scorchedWall',
  'wall_runePanel', 'wall_blueConduit', 'wall_coreWallPlate',
  'prop_portal'
];

function preloadGameAssets(scene) {
  BIOME_ASSET_FILES.forEach(key => {
    scene.load.image(key, BIOME_ASSET_BASE + key + '.png');
  });
}

function setupAssetSpriteLayer(scene) {
  scene.assetSpriteLayer = scene.add.container(0, 0).setDepth(3);
  scene.assetSpriteSignature = '';
  scene.assetSpritesEnabled = true;
}

function markAssetSpritesDirty(scene) {
  if (!scene || !scene.map) return;
  scene.map._assetSpriteVersion = (scene.map._assetSpriteVersion || 0) + 1;
  scene.assetSpriteSignature = '';
}

function getCurrentAssetSpriteSignature(scene) {
  if (!scene || !scene.map) return 'none';
  const mapId = scene.currentMapName === 'mine' ? ('mine-' + (scene.mineLevel || 1)) : 'home';
  return [
    mapId,
    scene.currentBiomeId || scene.map.biomeId || 'none',
    scene.map.visualDecorVersion || 0,
    scene.map._assetSpriteVersion || 0
  ].join('|');
}

function refreshAssetSprites(scene, force = false) {
  if (!scene || !scene.assetSpritesEnabled || !scene.assetSpriteLayer || !scene.map) return;
  const signature = getCurrentAssetSpriteSignature(scene);
  if (!force && signature === scene.assetSpriteSignature) return;

  scene.assetSpriteLayer.removeAll(true);
  scene.assetSpriteSignature = signature;

  for (let y = 0; y < scene.mapHeight; y++) {
    for (let x = 0; x < scene.mapWidth; x++) {
      const tile = scene.map[y]?.[x];
      if (!tile) continue;
      addAssetSpritesForTile(scene, tile, x, y);
    }
  }
}

function addAssetSpritesForTile(scene, tile, x, y) {
  const centerX = x * scene.tileSize + scene.tileSize / 2;
  const centerY = y * scene.tileSize + scene.tileSize / 2;
  const s = scene.tileSize;

  if (tile.type === 'largeOreChunk') {
    const key = 'ore_' + (tile.oreId || 'stone');
    addBiomeSprite(scene, key, centerX, centerY + 1, s * 1.55, s * 1.55, 0.98, x, y);
  }

  if (tile.wallDecor) {
    const key = 'wall_' + tile.wallDecor;
    addBiomeSprite(scene, key, centerX, centerY - 1, s * 1.25, s * 1.25, 0.88, x, y);
  }

  if (tile.decor) {
    const key = 'decor_' + tile.decor;
    const poiScale = tile.poi ? 1.85 : 1.2;
    const yOffset = tile.poi ? -4 : 1;
    addBiomeSprite(scene, key, centerX, centerY + yOffset, s * poiScale, s * poiScale, tile.poi ? 1.0 : 0.9, x, y);
  }

  if (tile.type === 'exit' || tile.type === 'exitUp' || tile.type === 'exitDown') {
    addBiomeSprite(scene, 'prop_portal', centerX, centerY - 2, s * 1.3, s * 1.3, 0.95, x, y);
  }
}

function addBiomeSprite(scene, key, x, y, width, height, alpha, tileX, tileY) {
  if (!scene.textures || !scene.textures.exists(key)) return null;
  const image = scene.add.image(x, y, key);
  image.setDisplaySize(width, height);
  image.setAlpha(alpha);
  image.setOrigin(0.5, 0.5);
  image.setDepth(3 + (tileY || 0) * 0.0001 + (tileX || 0) * 0.000001);
  image.setData('biomeAsset', true);
  scene.assetSpriteLayer.add(image);
  return image;
}
