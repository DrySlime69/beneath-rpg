function createEmptyMap(scene, width, height) {
  const map = [];
  for (let y = 0; y < height; y++) {
    const row = [];
    for (let x = 0; x < width; x++) {
      row.push(makeTile('caveWall'));
    }
    map.push(row);
  }
  return map;
}

function makeTile(type, extra = {}) {
  const tile = {
    type,
    hardness: type === 'caveWall' ? 999 : 0,
    variation: Phaser.Math ? Phaser.Math.Between(0, 4) : 0,
    detailSeed: Phaser.Math ? Phaser.Math.Between(0, 9999) : 0,
    ...extra
  };

  if (type === 'stone') Object.assign(tile, { hardness: 1, hp: 4, maxHp: 4 });
  if (type === 'wood') Object.assign(tile, { hardness: 0, hp: 3, maxHp: 3 });
  if (type === 'coal') Object.assign(tile, { hardness: 1, hp: 3, maxHp: 3 });
  if (type === 'copper') Object.assign(tile, { hardness: 2, hp: 10, maxHp: 10 });
  if (type === 'copperWall') Object.assign(tile, { hardness: 3, hp: 14, maxHp: 14 });
  if (type === 'largeOreChunk') {
    const ore = typeof getLargeOreChunkDef === 'function' ? getLargeOreChunkDef(extra.oreId || 'stone') : null;
    Object.assign(tile, { hardness: ore?.hardness || 2, hp: ore?.hp || 18, maxHp: ore?.hp || 18 });
  }
  if (type === 'furnace' || type === 'craftingTable' || type === 'woodChest' || type === 'copperChest') tile.hardness = 999;
  if (type === 'torch') Object.assign(tile, { hardness: 0, hp: 1, maxHp: 1, variation: extra.variation ?? (Phaser.Math ? Phaser.Math.Between(0, 3) : 0) });
  if (type === 'exit' || type === 'exitUp' || type === 'exitDown') tile.hardness = 999;
  return tile;
}

function generateMaps(scene) {
  scene.mineLevel = 1;
  scene.maxUnlockedMineLevel = STARTING_UNLOCKED_MINE_LEVELS;
  scene.mineMaps = {};

  for (let level = 1; level <= STARTING_UNLOCKED_MINE_LEVELS; level++) {
    scene.mineMaps[level] = createMineMap(scene, level);
  }

  scene.homeMap = createHomeMap(scene);
  scene.currentMapName = 'mine';
  scene.map = scene.mineMaps[scene.mineLevel];
  scene.currentBiomeId = scene.map.biomeId || getBiomeForLevel(scene.mineLevel).id;
  rebuildTorchLights(scene);
}

function getMineMap(scene, level) {
  if (!scene.mineMaps[level]) scene.mineMaps[level] = createMineMap(scene, level);
  return scene.mineMaps[level];
}

function switchToMine(scene, level = scene.mineLevel || 1) {
  scene.mineLevel = Phaser.Math.Clamp(level, 1, 100);
  scene.map = getMineMap(scene, scene.mineLevel);
  scene.currentMapName = 'mine';
  scene.currentBiomeId = scene.map.biomeId || getBiomeForLevel(scene.mineLevel).id;
  rebuildTorchLights(scene);
  setCameraBounds(scene);
}

function switchToHome(scene) {
  scene.map = scene.homeMap;
  scene.currentMapName = 'home';
  rebuildTorchLights(scene);
  setCameraBounds(scene);
}

function setCameraBounds(scene) {
  if (!scene.cameras || !scene.cameras.main) return;
  scene.cameras.main.setBounds(0, 0, scene.mapWidth * scene.tileSize, scene.mapHeight * scene.tileSize);
}

function darkenColor(color, factor) {
  const r = Math.floor(((color >> 16) & 255) * factor);
  const g = Math.floor(((color >> 8) & 255) * factor);
  const b = Math.floor((color & 255) * factor);
  return (r << 16) + (g << 8) + b;
}

function tintColor(color, amount) {
  const r = Math.min(255, ((color >> 16) & 255) + amount);
  const g = Math.min(255, ((color >> 8) & 255) + amount);
  const b = Math.min(255, (color & 255) + amount);
  return (r << 16) + (g << 8) + b;
}

function seededNoise(x, y, seed = 0) {
  let n = x * 374761393 + y * 668265263 + seed * 1442695041;
  n = (n ^ (n >> 13)) * 1274126177;
  n = n ^ (n >> 16);
  return Math.abs(n % 10000) / 10000;
}

function getTileBaseColor(tile) {
  const biome = getBiomeById(tile?.biome || 'dirtCaves');
  if (tile.type === 'floor' || tile.type === 'torch') return tile.variation % 2 ? tintColor(biome.floor, 8) : biome.floor;
  if (tile.type === 'homeFloor') return tile.variation % 2 ? 0x3a2617 : 0x2a1c12;
  if (tile.type === 'teleportPad') return 0x3344aa;
  if (tile.type === 'furnace') return 0xff4422;
  if (tile.type === 'craftingTable') return 0x8b5a2b;
  if (tile.type === 'woodChest') return 0x9a642e;
  if (tile.type === 'copperChest') return 0xb96a35;
  if (tile.type === 'caveWall') return tile.variation % 2 ? tintColor(biome.wall.base, 10) : biome.wall.base;
  if (tile.type === 'exit' || tile.type === 'exitDown') return 0x00aa00;
  if (tile.type === 'exitUp') return 0x2255cc;
  if (tile.type === 'stone') return biome.id === 'crystalDepths' ? 0x4f6f88 : 0x5a5a5a;
  if (tile.type === 'coal') return 0x333333;
  if (tile.type === 'wood') return biome.id === 'mushroomCaverns' ? 0x5b4aa0 : 0x8a5a2b;
  if (tile.type === 'copper') return biome.id === 'boneHollow' ? 0xc98546 : 0xaa6633;
  if (tile.type === 'copperWall') return 0x7f3f24;
  if (tile.type === 'largeOreChunk') return getLargeOreChunkDef(tile.oreId).color;
  return 0x000000;
}

function isWallLike(tile) {
  return tile && ['caveWall', 'stone', 'coal', 'copper', 'copperWall', 'wood', 'largeOreChunk'].includes(tile.type);
}

function isWalkableTile(tile) {
  return tile && ['floor', 'homeFloor', 'teleportPad', 'exit', 'exitUp', 'exitDown', 'torch'].includes(tile.type);
}

function getWallMask(scene, x, y) {
  const top = isWallLike(getTile(scene, x, y - 1));
  const right = isWallLike(getTile(scene, x + 1, y));
  const bottom = isWallLike(getTile(scene, x, y + 1));
  const left = isWallLike(getTile(scene, x - 1, y));
  return { top, right, bottom, left };
}

function getWallVisualColors(tile) {
  const biome = getBiomeById(tile?.biome || 'dirtCaves');
  if (tile.type === 'stone') return biome.id === 'crystalDepths'
    ? { base: 0x4f6f88, edge: 0x9be8ff, shadow: 0x172634, speck: 0xbdf4ff }
    : { base: 0x5a5a5a, edge: 0xa8a8a8, shadow: 0x262626, speck: 0xc0c0c0 };
  if (tile.type === 'coal') return { base: 0x303030, edge: 0x686868, shadow: 0x111111, speck: 0x777777 };
  if (tile.type === 'wood') return biome.id === 'mushroomCaverns'
    ? { base: 0x4b3d88, edge: 0xa77cff, shadow: 0x17102a, speck: 0xd0b4ff }
    : { base: 0x7a4a22, edge: 0xd79a55, shadow: 0x2b1407, speck: 0xe2b16d };
  if (tile.type === 'copper') return { base: 0x9b5a2e, edge: 0xffb066, shadow: 0x3a1b12, speck: 0xffaa55 };
  if (tile.type === 'copperWall') return { base: 0x71381f, edge: 0xff8844, shadow: 0x28110b, speck: 0xff9a58 };
  if (tile.type === 'largeOreChunk') {
    const ore = getLargeOreChunkDef(tile.oreId);
    return { base: ore.color, edge: ore.edge, shadow: 0x090909, speck: ore.edge };
  }
  return biome.wall;
}

function drawAutotiledWall(scene, tile, x, y, brightness) {
  if (!isWallLike(tile)) return;

  const px = x * scene.tileSize;
  const py = y * scene.tileSize;
  const s = scene.tileSize;
  const mask = getWallMask(scene, x, y);
  const colors = getWallVisualColors(tile);
  const seed = tile.detailSeed || tile.variation || 0;
  const n1 = seededNoise(x, y, seed);
  const n2 = seededNoise(x + 17, y - 9, seed);

  const base = darkenColor(colors.base, brightness);
  const edge = darkenColor(colors.edge, brightness);
  const shadow = darkenColor(colors.shadow, Math.min(1, brightness + 0.2));

  const insetTop = mask.top ? 0 : 2 + Math.floor(n1 * 3);
  const insetBottom = mask.bottom ? 0 : 2 + Math.floor(n2 * 3);
  const insetLeft = mask.left ? 0 : 2 + Math.floor(seededNoise(x - 3, y, seed) * 3);
  const insetRight = mask.right ? 0 : 2 + Math.floor(seededNoise(x, y + 5, seed) * 3);

  scene.worldLayer.fillStyle(base);
  scene.worldLayer.fillRect(px + insetLeft, py + insetTop, s - insetLeft - insetRight, s - insetTop - insetBottom);

  // Dark cavities against open floor make square tile joins read as rounded cave edges.
  scene.worldLayer.fillStyle(shadow, 0.62);
  if (!mask.top) scene.worldLayer.fillRect(px + 3 + Math.floor(n1 * 3), py, s - 7, 5);
  if (!mask.bottom) scene.worldLayer.fillRect(px + 3, py + s - 5, s - 7 - Math.floor(n2 * 3), 5);
  if (!mask.left) scene.worldLayer.fillRect(px, py + 4, 5, s - 8);
  if (!mask.right) scene.worldLayer.fillRect(px + s - 5, py + 4, 5, s - 8);

  // Highlight rims only where wall touches walkable space.
  scene.worldLayer.lineStyle(1, edge, 0.72);
  if (!mask.top) scene.worldLayer.lineBetween(px + 5, py + insetTop + 1, px + s - 6, py + Math.max(2, insetTop));
  if (!mask.left) scene.worldLayer.lineBetween(px + insetLeft + 1, py + 5, px + Math.max(2, insetLeft), py + s - 6);
  scene.worldLayer.lineStyle(1, shadow, 0.55);
  if (!mask.bottom) scene.worldLayer.lineBetween(px + 5, py + s - insetBottom - 1, px + s - 6, py + s - Math.max(2, insetBottom));
  if (!mask.right) scene.worldLayer.lineBetween(px + s - insetRight - 1, py + 5, px + s - Math.max(2, insetRight), py + s - 6);

  // Rounded inner-corner shadows remove the checkerboard feel at cave bends.
  scene.worldLayer.fillStyle(shadow, 0.5);
  if (!mask.top && !mask.left) scene.worldLayer.fillCircle(px + 4, py + 4, 5);
  if (!mask.top && !mask.right) scene.worldLayer.fillCircle(px + s - 4, py + 4, 5);
  if (!mask.bottom && !mask.left) scene.worldLayer.fillCircle(px + 4, py + s - 4, 5);
  if (!mask.bottom && !mask.right) scene.worldLayer.fillCircle(px + s - 4, py + s - 4, 5);
}

function drawFloorDetails(scene, tile, x, y, brightness) {
  if (!isWalkableTile(tile)) return;

  const px = x * scene.tileSize;
  const py = y * scene.tileSize;
  const s = scene.tileSize;
  const seed = tile.detailSeed || tile.variation || 0;
  const biome = getBiomeById(tile?.biome || 'dirtCaves');
  const floorColor = tile.type === 'homeFloor' ? 0x4a321f : biome.floor;
  const pebbleColor = darkenColor(floorColor, brightness * 0.85);
  const lightPebble = darkenColor(tintColor(floorColor, 25), brightness * 0.8);

  // Ground texture speckles, deterministic per tile so it does not shimmer.
  scene.worldLayer.fillStyle(pebbleColor, 0.45);
  if (seededNoise(x, y, seed) > 0.25) scene.worldLayer.fillRect(px + 5, py + 6, 2, 2);
  if (seededNoise(x + 11, y + 4, seed) > 0.5) scene.worldLayer.fillRect(px + 17, py + 15, 3, 1);
  scene.worldLayer.fillStyle(lightPebble, 0.35);
  if (seededNoise(x - 8, y + 13, seed) > 0.62) scene.worldLayer.fillRect(px + 10, py + 20, 2, 2);
  if (scene.currentMapName === 'mine') {
    scene.worldLayer.lineStyle(1, darkenColor(0x3a3a3a, brightness), 0.26);
    if (seededNoise(x + 29, y - 4, seed) > 0.72) scene.worldLayer.lineBetween(px + 4, py + 12, px + 13, py + 10);
    if (seededNoise(x - 14, y + 21, seed) > 0.78) scene.worldLayer.lineBetween(px + 13, py + 21, px + 22, py + 17);
  }

  // Ambient occlusion beside nearby walls makes caves feel naturally carved.
  const top = isWallLike(getTile(scene, x, y - 1));
  const right = isWallLike(getTile(scene, x + 1, y));
  const bottom = isWallLike(getTile(scene, x, y + 1));
  const left = isWallLike(getTile(scene, x - 1, y));
  scene.worldLayer.fillStyle(0x000000, scene.currentMapName === 'home' ? 0.08 : 0.18);
  if (top) scene.worldLayer.fillRect(px, py, s, 5);
  if (bottom) scene.worldLayer.fillRect(px, py + s - 5, s, 5);
  if (left) scene.worldLayer.fillRect(px, py, 5, s);
  if (right) scene.worldLayer.fillRect(px + s - 5, py, 5, s);
}

function drawTileDetails(scene, tile, x, y, brightness) {
  const px = x * scene.tileSize;
  const py = y * scene.tileSize;
  const size = scene.tileSize;

  drawFloorDetails(scene, tile, x, y, brightness);
  drawAutotiledWall(scene, tile, x, y, brightness);

  if (scene.currentMapName === 'home' && tile.decor === 'stringLight') {
    drawHomeStringLight(scene, x, y, brightness);
  }

  if (tile.type === 'caveWall') {
    const wc = getWallVisualColors(tile);
    scene.worldLayer.fillStyle(darkenColor(wc.speck || wc.edge, brightness), 0.48);
    scene.worldLayer.fillRect(px + 5, py + 5, 4 + tile.variation, 3);
    scene.worldLayer.fillRect(px + 15, py + 13, 5, 4);
    if ((tile.detailSeed || 0) % 2 === 0) scene.worldLayer.fillRect(px + 8, py + 19, 3, 2);
    if (tile.wallDecor) drawWallDecoration(scene, tile, x, y, brightness);
  }

  if (tile.type === 'stone') {
    scene.worldLayer.lineStyle(1, darkenColor(0xbbbbbb, brightness), 0.8);
    scene.worldLayer.lineBetween(px + 5, py + 8, px + 14, py + 14);
    scene.worldLayer.lineBetween(px + 14, py + 14, px + 21, py + 9);
    scene.worldLayer.lineBetween(px + 8, py + 20, px + 17, py + 17);
  }

  if (tile.type === 'coal') {
    scene.worldLayer.fillStyle(darkenColor(0x777777, brightness));
    scene.worldLayer.fillRect(px + 6, py + 7, 3, 3);
    scene.worldLayer.fillRect(px + 17, py + 13, 3, 3);
    scene.worldLayer.fillRect(px + 11, py + 20, 2, 2);
  }

  if (tile.type === 'copper' || tile.type === 'copperWall') {
    scene.worldLayer.fillStyle(darkenColor(tile.type === 'copperWall' ? 0xff8844 : 0xffaa55, brightness));
    scene.worldLayer.fillRect(px + 5, py + 6, 4, 4);
    scene.worldLayer.fillRect(px + 16, py + 9, 3, 3);
    scene.worldLayer.fillRect(px + 9, py + 18, 4, 3);
    scene.worldLayer.fillRect(px + 20, py + 19, 2, 2);
  }

  if (tile.type === 'largeOreChunk') {
    drawLargeOreChunk(scene, tile, x, y, brightness);
  }

  if (tile.type === 'craftingTable') {
    scene.worldLayer.fillStyle(darkenColor(0x6b3f1d, brightness));
    scene.worldLayer.fillRect(px + 4, py + 6, size - 8, 8);
    scene.worldLayer.fillStyle(darkenColor(0xb8793a, brightness));
    scene.worldLayer.fillRect(px + 5, py + 5, size - 10, 4);
    scene.worldLayer.fillStyle(darkenColor(0x4a2a12, brightness));
    scene.worldLayer.fillRect(px + 6, py + 15, 4, 8);
    scene.worldLayer.fillRect(px + size - 10, py + 15, 4, 8);
  }

  if (tile.type === 'furnace') {
    const isWorking = scene.furnaceQueue && scene.furnaceQueue.length > 0;
    scene.worldLayer.fillStyle(darkenColor(0x5a1a12, brightness));
    scene.worldLayer.fillRect(px + 4, py + 4, size - 8, size - 8);
    scene.worldLayer.fillStyle(darkenColor(0x2a0c08, brightness));
    scene.worldLayer.fillRect(px + 8, py + 8, size - 16, size - 16);
    scene.worldLayer.fillStyle(darkenColor(isWorking ? 0xffff88 : 0xffaa44, brightness));
    scene.worldLayer.fillRect(px + 10, py + 11, size - 20, size - 20);
  }



  if (tile.type === 'woodChest' || tile.type === 'copperChest') {
    const copper = tile.type === 'copperChest';
    scene.worldLayer.fillStyle(darkenColor(copper ? 0x8f4426 : 0x6b3f1d, brightness));
    scene.worldLayer.fillRect(px + 4, py + 7, size - 8, size - 10);
    scene.worldLayer.fillStyle(darkenColor(copper ? 0xd88445 : 0xb8793a, brightness));
    scene.worldLayer.fillRect(px + 5, py + 6, size - 10, 5);
    scene.worldLayer.fillStyle(darkenColor(copper ? 0xffb066 : 0x3a200d, brightness));
    scene.worldLayer.fillRect(px + 11, py + 14, 4, 4);
    scene.worldLayer.lineStyle(1, darkenColor(copper ? 0xffc080 : 0xd09a5a, brightness), 0.75);
    scene.worldLayer.strokeRect(px + 4, py + 7, size - 8, size - 10);
  }


  if (tile.decor) {
    drawBiomeDecoration(scene, tile, x, y, brightness);
  }

  if (tile.type === 'torch') {
    drawTorch(scene, x, y, brightness);
  }

  if (tile.type === 'teleportPad') {
    scene.worldLayer.lineStyle(2, darkenColor(0x88aaff, brightness), 0.9);
    scene.worldLayer.strokeCircle(px + size / 2, py + size / 2, 8);
    scene.worldLayer.strokeCircle(px + size / 2, py + size / 2, 4);
  }

  if (tile.type === 'exit' || tile.type === 'exitDown' || tile.type === 'exitUp') {
    scene.worldLayer.fillStyle(darkenColor(tile.type === 'exitUp' ? 0x001d48 : 0x002800, brightness));
    scene.worldLayer.fillCircle(px + size / 2, py + size / 2, 10);
    scene.worldLayer.lineStyle(2, darkenColor(tile.type === 'exitUp' ? 0x66aaff : 0x44ff77, brightness), 0.8);
    scene.worldLayer.strokeCircle(px + size / 2, py + size / 2, 11);
  }
}


function drawLargeOreChunk(scene, tile, x, y, brightness) {
  const px = x * scene.tileSize;
  const py = y * scene.tileSize;
  const size = scene.tileSize;
  const ore = getLargeOreChunkDef(tile.oreId);
  const pulse = ore.glow ? 0.85 + Math.sin((scene.visualTime || 0) * 0.004 + x + y) * 0.12 : 1;

  if (ore.glow) {
    scene.worldLayer.fillStyle(ore.glow, 0.08 * pulse * brightness);
    scene.worldLayer.fillCircle(px + size / 2, py + size / 2, 15);
  }

  scene.worldLayer.fillStyle(darkenColor(ore.color, brightness));
  scene.worldLayer.fillCircle(px + 12, py + 16, 9);
  scene.worldLayer.fillCircle(px + 18, py + 18, 7);
  scene.worldLayer.fillCircle(px + 9, py + 21, 6);
  scene.worldLayer.fillStyle(darkenColor(ore.edge, Math.min(1, brightness + 0.2)), 0.9);
  scene.worldLayer.fillRect(px + 8, py + 9, 5, 5);
  scene.worldLayer.fillRect(px + 16, py + 12, 5, 4);
  scene.worldLayer.fillRect(px + 11, py + 19, 7, 3);
  scene.worldLayer.fillStyle(0xffffff, 0.22 * brightness);
  scene.worldLayer.fillRect(px + 10, py + 10, 2, 2);
  scene.worldLayer.fillRect(px + 17, py + 13, 2, 1);
}

function drawWallDecoration(scene, tile, x, y, brightness) {
  const px = x * scene.tileSize;
  const py = y * scene.tileSize;
  const s = scene.tileSize;
  const decor = tile.wallDecor;
  const t = scene.visualTime || 0;

  if (['hangingMoss', 'sporeVines'].includes(decor)) {
    scene.worldLayer.lineStyle(1, darkenColor(0x86d85c, brightness), 0.75);
    scene.worldLayer.lineBetween(px + 7, py + 2, px + 7, py + 16);
    scene.worldLayer.lineBetween(px + 15, py + 1, px + 15, py + 12);
    scene.worldLayer.fillStyle(darkenColor(0xb7ff79, brightness), 0.7);
    scene.worldLayer.fillCircle(px + 7, py + 15, 2);
    scene.worldLayer.fillCircle(px + 15, py + 12, 2);
  }
  if (decor === 'wallMushrooms') {
    scene.worldLayer.fillStyle(darkenColor(0x7ee3ff, brightness), 0.8);
    scene.worldLayer.fillEllipse(px + 6, py + 14, 8, 5);
    scene.worldLayer.fillStyle(darkenColor(0xf15b73, brightness), 0.82);
    scene.worldLayer.fillEllipse(px + 18, py + 8, 7, 4);
  }
  if (['wallSkull', 'boneWall'].includes(decor)) {
    scene.worldLayer.fillStyle(darkenColor(0xd8c7a3, brightness), 0.85);
    scene.worldLayer.fillCircle(px + 13, py + 10, 5);
    scene.worldLayer.fillStyle(darkenColor(0x101010, brightness), 0.8);
    scene.worldLayer.fillCircle(px + 11, py + 9, 1.5);
    scene.worldLayer.fillCircle(px + 15, py + 9, 1.5);
    scene.worldLayer.lineStyle(1, darkenColor(0xe8d8b8, brightness), 0.7);
    scene.worldLayer.lineBetween(px + 5, py + 17, px + 20, py + 13);
  }
  if (decor === 'hangingWeb') {
    scene.worldLayer.lineStyle(1, darkenColor(0xd7d1c6, brightness), 0.5);
    scene.worldLayer.lineBetween(px + 3, py + 3, px + 20, py + 15);
    scene.worldLayer.lineBetween(px + 20, py + 3, px + 4, py + 17);
    scene.worldLayer.strokeCircle(px + 12, py + 10, 8);
  }
  if (['icicles', 'frostVeins', 'iceWallCrack'].includes(decor)) {
    scene.worldLayer.fillStyle(darkenColor(0xaeeeff, brightness), 0.8);
    scene.worldLayer.fillTriangle(px + 6, py + 2, px + 10, py + 2, px + 8, py + 17);
    scene.worldLayer.fillTriangle(px + 16, py + 1, px + 21, py + 1, px + 18, py + 13);
    scene.worldLayer.lineStyle(1, darkenColor(0xd8fbff, brightness), 0.55);
    scene.worldLayer.lineBetween(px + 4, py + 20, px + 20, py + 9);
  }
  if (['crystalWallGrowth', 'purpleVeins', 'gemWall'].includes(decor)) {
    const pulse = 0.75 + Math.sin(t * 0.004 + x) * 0.12;
    scene.worldLayer.fillStyle(darkenColor(0xc06cff, Math.min(1, brightness + 0.2)), 0.75 * pulse);
    scene.worldLayer.fillTriangle(px + 12, py + 4, px + 8, py + 18, px + 16, py + 18);
    scene.worldLayer.lineStyle(1, darkenColor(0xff9cff, brightness), 0.55);
    scene.worldLayer.lineBetween(px + 3, py + 8, px + 22, py + 16);
  }
  if (['lavaDrip', 'emberVeins', 'scorchedWall'].includes(decor)) {
    scene.worldLayer.lineStyle(2, darkenColor(0xff5a1d, brightness), 0.85);
    scene.worldLayer.lineBetween(px + 8, py + 2, px + 8, py + 17);
    scene.worldLayer.lineBetween(px + 17, py + 3, px + 17, py + 12);
    scene.worldLayer.fillStyle(darkenColor(0xffb13a, brightness), 0.75);
    scene.worldLayer.fillCircle(px + 8, py + 18, 2);
  }
  if (['runePanel', 'blueConduit', 'coreWallPlate'].includes(decor)) {
    scene.worldLayer.fillStyle(darkenColor(0x102a38, brightness), 0.85);
    scene.worldLayer.fillRect(px + 5, py + 5, s - 10, s - 10);
    scene.worldLayer.lineStyle(1, darkenColor(0x42dfff, Math.min(1, brightness + 0.25)), 0.85);
    scene.worldLayer.strokeRect(px + 7, py + 7, s - 14, s - 14);
    scene.worldLayer.lineBetween(px + 12, py + 8, px + 12, py + 18);
  }
}

function drawBiomeDecoration(scene, tile, x, y, brightness) {
  const px = x * scene.tileSize;
  const py = y * scene.tileSize;
  const size = scene.tileSize;
  const t = scene.visualTime || 0;
  const decor = tile.decor;

  function mushroom(cap, stem = 0x8b6a4a, glow = 0.75) {
    const pulse = 0.82 + Math.sin(t * 0.004 + x) * 0.14;
    scene.worldLayer.fillStyle(darkenColor(stem, brightness));
    scene.worldLayer.fillRect(px + 11, py + 13, 3, 8);
    scene.worldLayer.fillStyle(darkenColor(cap, Math.min(1, brightness * pulse + 0.15)), 0.92);
    scene.worldLayer.fillEllipse(px + 13, py + 11, 14, 8);
    if (glow) {
      scene.worldLayer.fillStyle(cap, 0.08 * glow * pulse);
      scene.worldLayer.fillCircle(px + 13, py + 12, 16);
    }
  }

  if (decor === 'glowMushroom') mushroom(0x78e7ff, 0x5b4aa0, 1.0);
  if (decor === 'fungusPatch') {
    scene.worldLayer.fillStyle(darkenColor(0x6b4fb4, brightness), 0.72);
    scene.worldLayer.fillCircle(px + 7, py + 19, 3);
    scene.worldLayer.fillCircle(px + 14, py + 17, 4);
    scene.worldLayer.fillCircle(px + 21, py + 20, 2);
    scene.worldLayer.fillStyle(darkenColor(0x9dff65, brightness), 0.75);
    scene.worldLayer.fillCircle(px + 12, py + 20, 1.5);
  }
  if (decor === 'sporePods') {
    scene.worldLayer.fillStyle(darkenColor(0x5bd36e, brightness), 0.85);
    scene.worldLayer.fillCircle(px + 8, py + 18, 4);
    scene.worldLayer.fillCircle(px + 15, py + 16, 3);
    scene.worldLayer.fillCircle(px + 20, py + 20, 2.5);
    scene.worldLayer.fillStyle(darkenColor(0xe8ff9a, brightness), 0.75);
    scene.worldLayer.fillCircle(px + 8, py + 16, 1.2);
  }
  if (decor === 'mossClump') {
    scene.worldLayer.fillStyle(darkenColor(0x5e9d3b, brightness), 0.65);
    scene.worldLayer.fillEllipse(px + 13, py + 19, 20, 7);
  }

  if (decor === 'bonePile' || decor === 'ribBones' || decor === 'snowBones' || decor === 'charredBones') {
    const c = decor === 'charredBones' ? 0x9a8a72 : decor === 'snowBones' ? 0xdff6ff : 0xd8c7a3;
    scene.worldLayer.lineStyle(2, darkenColor(c, brightness), 0.82);
    scene.worldLayer.lineBetween(px + 5, py + 18, px + 20, py + 12);
    scene.worldLayer.lineBetween(px + 7, py + 12, px + 22, py + 20);
    scene.worldLayer.strokeCircle(px + 11, py + 13, 5);
  }
  if (decor === 'skull') {
    scene.worldLayer.fillStyle(darkenColor(0xe0d1b0, brightness), 0.9);
    scene.worldLayer.fillCircle(px + 13, py + 13, 7);
    scene.worldLayer.fillStyle(0x0b0908, 0.8);
    scene.worldLayer.fillCircle(px + 10, py + 12, 2);
    scene.worldLayer.fillCircle(px + 16, py + 12, 2);
    scene.worldLayer.fillRect(px + 11, py + 17, 5, 3);
  }
  if (decor === 'webPatch') {
    scene.worldLayer.lineStyle(1, darkenColor(0xd7d1c6, brightness), 0.45);
    scene.worldLayer.strokeCircle(px + 13, py + 15, 9);
    scene.worldLayer.lineBetween(px + 4, py + 15, px + 22, py + 15);
    scene.worldLayer.lineBetween(px + 13, py + 6, px + 13, py + 24);
    scene.worldLayer.lineBetween(px + 6, py + 8, px + 20, py + 22);
  }

  if (decor === 'iceCrystal' || decor === 'smallBlueCrystal') {
    const color = decor === 'iceCrystal' ? 0x8eefff : 0x55dfff;
    scene.worldLayer.fillStyle(color, 0.07);
    scene.worldLayer.fillCircle(px + 13, py + 15, 15);
    scene.worldLayer.fillStyle(darkenColor(color, Math.min(1, brightness + 0.25)), 0.9);
    scene.worldLayer.fillTriangle(px + 13, py + 4, px + 7, py + 22, px + 18, py + 22);
    scene.worldLayer.fillStyle(0xffffff, 0.25);
    scene.worldLayer.fillTriangle(px + 13, py + 6, px + 11, py + 18, px + 15, py + 18);
  }
  if (decor === 'frostPatch') {
    scene.worldLayer.fillStyle(darkenColor(0x9eeaff, brightness), 0.35);
    scene.worldLayer.fillEllipse(px + 13, py + 18, 21, 8);
    scene.worldLayer.lineStyle(1, darkenColor(0xe4fbff, brightness), 0.45);
    scene.worldLayer.lineBetween(px + 5, py + 18, px + 21, py + 18);
  }
  if (decor === 'frozenStalagmite') {
    scene.worldLayer.fillStyle(darkenColor(0xa8e8ff, brightness), 0.82);
    scene.worldLayer.fillTriangle(px + 8, py + 22, px + 13, py + 8, px + 18, py + 22);
    scene.worldLayer.fillTriangle(px + 17, py + 23, px + 21, py + 13, px + 24, py + 23);
  }

  if (decor === 'purpleCrystal' || decor === 'blueCrystal' || decor === 'crystalShard') {
    const color = decor === 'blueCrystal' ? 0x55dfff : decor === 'crystalShard' ? 0x7de8ff : 0xb85dff;
    const pulse = 0.8 + Math.sin(t * 0.005 + x * 0.5 + y) * 0.25;
    scene.worldLayer.fillStyle(color, 0.08 * pulse);
    scene.worldLayer.fillCircle(px + 13, py + 16, 16);
    scene.worldLayer.fillStyle(darkenColor(color, Math.min(1, brightness * pulse + 0.18)), 0.92);
    scene.worldLayer.fillTriangle(px + 13, py + 4, px + 7, py + 22, px + 18, py + 22);
    scene.worldLayer.fillTriangle(px + 19, py + 20, px + 22, py + 11, px + 25, py + 21);
    scene.worldLayer.fillStyle(0xffffff, 0.22);
    scene.worldLayer.fillTriangle(px + 13, py + 6, px + 11, py + 18, px + 15, py + 18);
  }
  if (decor === 'glowPool') {
    scene.worldLayer.fillStyle(0x27e6ff, 0.12);
    scene.worldLayer.fillEllipse(px + 13, py + 18, 22, 9);
    scene.worldLayer.fillStyle(0x6dffff, 0.28);
    scene.worldLayer.fillEllipse(px + 13, py + 18, 15, 5);
  }

  if (decor === 'emberCrystal') {
    scene.worldLayer.fillStyle(0xff3a1a, 0.12);
    scene.worldLayer.fillCircle(px + 13, py + 16, 15);
    scene.worldLayer.fillStyle(darkenColor(0xff5a1d, brightness), 0.9);
    scene.worldLayer.fillTriangle(px + 13, py + 5, px + 7, py + 22, px + 19, py + 22);
    scene.worldLayer.fillStyle(darkenColor(0xffd35c, brightness), 0.8);
    scene.worldLayer.fillRect(px + 11, py + 12, 4, 6);
  }
  if (decor === 'lavaCrack') {
    scene.worldLayer.lineStyle(2, darkenColor(0xff4a16, Math.min(1, brightness + 0.3)), 0.9);
    scene.worldLayer.lineBetween(px + 4, py + 19, px + 12, py + 15);
    scene.worldLayer.lineBetween(px + 12, py + 15, px + 19, py + 21);
    scene.worldLayer.lineStyle(1, 0xffd36d, 0.6);
    scene.worldLayer.lineBetween(px + 5, py + 19, px + 18, py + 20);
  }
  if (decor === 'ashPile' || decor === 'moltenPebbles') {
    scene.worldLayer.fillStyle(darkenColor(0x4b3830, brightness), 0.6);
    scene.worldLayer.fillEllipse(px + 13, py + 20, 20, 7);
    if (decor === 'moltenPebbles') {
      scene.worldLayer.fillStyle(0xff6a1f, 0.7);
      scene.worldLayer.fillCircle(px + 9, py + 18, 2);
      scene.worldLayer.fillCircle(px + 18, py + 20, 1.5);
    }
  }

  if (decor === 'corePillar' || decor === 'blueCore' || decor === 'coreMachine') {
    scene.worldLayer.fillStyle(darkenColor(0x162f3f, brightness), 0.9);
    scene.worldLayer.fillRect(px + 7, py + 5, 12, 18);
    scene.worldLayer.lineStyle(1, darkenColor(0x42dfff, Math.min(1, brightness + 0.2)), 0.85);
    scene.worldLayer.strokeRect(px + 8, py + 6, 10, 16);
    scene.worldLayer.fillStyle(0x38e5ff, 0.16);
    scene.worldLayer.fillCircle(px + 13, py + 14, 16);
    scene.worldLayer.fillStyle(0x98ffff, 0.75);
    scene.worldLayer.fillCircle(px + 13, py + 14, 3);
  }
  if (decor === 'ancientPlate' || decor === 'techRubble' || decor === 'cableCoil') {
    scene.worldLayer.fillStyle(darkenColor(0x2a4654, brightness), 0.82);
    scene.worldLayer.fillRect(px + 5, py + 15, 16, 6);
    scene.worldLayer.lineStyle(1, darkenColor(0x4edcff, brightness), 0.55);
    scene.worldLayer.lineBetween(px + 6, py + 18, px + 20, py + 18);
    if (decor === 'cableCoil') scene.worldLayer.strokeCircle(px + 13, py + 17, 6);
  }

  if (decor === 'copperScrap' || decor === 'ruinSupport') {
    scene.worldLayer.fillStyle(darkenColor(0xff8a3a, brightness), 0.8);
    scene.worldLayer.fillRect(px + 5, py + 17, 7, 3);
    scene.worldLayer.fillRect(px + 17, py + 8, 4, 8);
    scene.worldLayer.lineStyle(1, darkenColor(0x3a1a0c, brightness), 0.8);
    scene.worldLayer.lineBetween(px + 6, py + 18, px + 22, py + 10);
  }

  if (decor === 'sporeGarden' || decor === 'boneAltar' || decor === 'iceShrine' || decor === 'crystalGate' || decor === 'emberVent') {
    scene.worldLayer.fillStyle(0x000000, 0.2);
    scene.worldLayer.fillEllipse(px + 13, py + 22, 25, 7);
  }
  if (decor === 'sporeGarden') { mushroom(0x9dff65, 0x6d4b2b, 1); }
  if (decor === 'boneAltar') {
    scene.worldLayer.fillStyle(darkenColor(0x5a4433, brightness));
    scene.worldLayer.fillRect(px + 5, py + 12, 17, 10);
    scene.worldLayer.fillStyle(darkenColor(0xe0d1b0, brightness));
    scene.worldLayer.fillCircle(px + 13, py + 10, 6);
  }
  if (decor === 'iceShrine') {
    scene.worldLayer.fillStyle(0x90efff, 0.12);
    scene.worldLayer.fillCircle(px + 13, py + 14, 18);
    scene.worldLayer.fillStyle(darkenColor(0xa8efff, brightness));
    scene.worldLayer.fillTriangle(px + 13, py + 3, px + 4, py + 23, px + 22, py + 23);
  }
  if (decor === 'crystalGate') {
    scene.worldLayer.lineStyle(3, darkenColor(0xb85dff, brightness), 0.85);
    scene.worldLayer.strokeRect(px + 5, py + 5, 16, 18);
    scene.worldLayer.fillStyle(0xb85dff, 0.13);
    scene.worldLayer.fillRect(px + 7, py + 7, 12, 14);
  }
  if (decor === 'emberVent') {
    scene.worldLayer.fillStyle(0xff3415, 0.17);
    scene.worldLayer.fillCircle(px + 13, py + 17, 15);
    scene.worldLayer.fillStyle(darkenColor(0xff6a1f, brightness));
    scene.worldLayer.fillEllipse(px + 13, py + 18, 18, 8);
  }

  if (decor === 'pebbles') {
    scene.worldLayer.fillStyle(darkenColor(0x8a725a, brightness), 0.4);
    scene.worldLayer.fillRect(px + 6, py + 18, 3, 2);
    scene.worldLayer.fillRect(px + 15, py + 10, 2, 2);
    scene.worldLayer.fillRect(px + 21, py + 20, 2, 1);
  }
}

function drawMiner(scene) {
  const size = scene.tileSize;
  const bob = scene.playerIsMoving ? Math.sin(scene.walkBob || 0) * 1.8 : Math.sin((scene.visualTime || 0) * 0.003) * 0.5;
  const px = scene.player.x - size / 2;
  const py = scene.player.y - size / 2 + bob;
  const legOffset = scene.playerIsMoving ? Math.sign(Math.sin(scene.walkBob || 0)) * 2 : 0;

  scene.playerLayer.fillStyle(0x111111, 0.35);
  scene.playerLayer.fillEllipse(scene.player.x, scene.player.y + 10, 20, 7);

  scene.playerLayer.fillStyle(0x224fbd);
  scene.playerLayer.fillRect(px + 7, py + 11, size - 14, size - 8);
  scene.playerLayer.fillStyle(0x4779f0, 0.9);
  scene.playerLayer.fillRect(px + 9, py + 13, size - 18, 4);
  scene.playerLayer.fillStyle(0xffcc88);
  scene.playerLayer.fillRect(px + 8, py + 7, size - 16, 8);
  scene.playerLayer.fillStyle(0xd8b000);
  scene.playerLayer.fillRect(px + 7, py + 4, size - 14, 5);
  scene.playerLayer.fillStyle(0xffffaa, 0.95);
  scene.playerLayer.fillRect(px + size / 2 - 2, py + 3, 4, 3);
  scene.playerLayer.fillStyle(0x111111);
  scene.playerLayer.fillRect(px + 7 + legOffset, py + size - 4, 5, 3);
  scene.playerLayer.fillRect(px + size - 12 - legOffset, py + size - 4, 5, 3);

  const dir = scene.lastMoveDirection || { x: 1, y: 0 };
  scene.playerLayer.fillStyle(0xffc94a, 0.85);
  scene.playerLayer.fillCircle(scene.player.x + dir.x * 11, scene.player.y + dir.y * 11, 3);
}
function redraw(scene) {
  scene.worldLayer.clear();
  scene.playerLayer.clear();

  const worldWidth = scene.mapWidth * scene.tileSize;
  const worldHeight = scene.mapHeight * scene.tileSize;

  scene.worldLayer.fillStyle(0x020202);
  scene.worldLayer.fillRect(0, 0, worldWidth, worldHeight);

  const playerTileX = scene.player.x / scene.tileSize;
  const playerTileY = scene.player.y / scene.tileSize;

  for (let y = 0; y < scene.mapHeight; y++) {
    for (let x = 0; x < scene.mapWidth; x++) {
      const tile = scene.map[y][x];
      const distance = Phaser.Math.Distance.Between(x + 0.5, y + 0.5, playerTileX, playerTileY);
      const lightRadius = scene.currentMapName === 'home' ? HOME_PLAYER_LIGHT_RADIUS : PLAYER_LIGHT_RADIUS;
      const minBrightness = scene.currentMapName === 'home' ? 0.68 : getCurrentBiome(scene).darkness;
      const playerLightStrength = Phaser.Math.Clamp(1 - distance / lightRadius, 0, 1);
      const torchLightStrength = getTorchLightAt(scene, x, y);
      const homeWarmLightStrength = getHomeWarmLightAt(scene, x, y);
      const combinedLight = Math.max(playerLightStrength * playerLightStrength, torchLightStrength, homeWarmLightStrength);
      const brightness = minBrightness + combinedLight * (1 - minBrightness);
      const color = darkenColor(getTileBaseColor(tile), brightness);

      scene.worldLayer.fillStyle(color);
      scene.worldLayer.fillRect(x * scene.tileSize, y * scene.tileSize, scene.tileSize, scene.tileSize);
      drawTileDetails(scene, tile, x, y, brightness);
    }
  }

  if (scene.currentMapName === 'home' && typeof drawHomeStringLightStrands === 'function') {
    drawHomeStringLightStrands(scene);
  }

  const target = getTargetTile(scene, 1);
  const targetTile = getTile(scene, target.x, target.y);
  if (targetTile && !['floor', 'homeFloor', 'teleportPad', 'exitUp', 'exitDown'].includes(targetTile.type)) {
    scene.playerLayer.lineStyle(1, 0xffcc66, 0.45);
    scene.playerLayer.strokeRect(target.x * scene.tileSize + 2, target.y * scene.tileSize + 2, scene.tileSize - 4, scene.tileSize - 4);
  }

  drawEnemies(scene);
  drawMiner(scene);
  drawAmbientEffects(scene);
}
