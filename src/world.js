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
  if (type === 'coal') Object.assign(tile, { hardness: 1, hp: 3, maxHp: 3 });
  if (type === 'copper') Object.assign(tile, { hardness: 2, hp: 10, maxHp: 10 });
  if (type === 'copperWall') Object.assign(tile, { hardness: 3, hp: 14, maxHp: 14 });
  if (type === 'furnace' || type === 'craftingTable') tile.hardness = 999;
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
}

function getMineMap(scene, level) {
  if (!scene.mineMaps[level]) scene.mineMaps[level] = createMineMap(scene, level);
  return scene.mineMaps[level];
}

function switchToMine(scene, level = scene.mineLevel || 1) {
  scene.mineLevel = Phaser.Math.Clamp(level, 1, 99);
  scene.map = getMineMap(scene, scene.mineLevel);
  scene.currentMapName = 'mine';
  setCameraBounds(scene);
}

function switchToHome(scene) {
  scene.map = scene.homeMap;
  scene.currentMapName = 'home';
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
  if (tile.type === 'floor') return tile.variation % 2 ? 0x151515 : 0x101010;
  if (tile.type === 'homeFloor') return tile.variation % 2 ? 0x211911 : 0x18120d;
  if (tile.type === 'teleportPad') return 0x3344aa;
  if (tile.type === 'furnace') return 0xff4422;
  if (tile.type === 'craftingTable') return 0x8b5a2b;
  if (tile.type === 'caveWall') return tile.variation % 2 ? 0x321c10 : 0x25140b;
  if (tile.type === 'exit' || tile.type === 'exitDown') return 0x00aa00;
  if (tile.type === 'exitUp') return 0x2255cc;
  if (tile.type === 'stone') return 0x5a5a5a;
  if (tile.type === 'coal') return 0x333333;
  if (tile.type === 'copper') return 0xaa6633;
  if (tile.type === 'copperWall') return 0x7f3f24;
  return 0x000000;
}

function isWallLike(tile) {
  return tile && ['caveWall', 'stone', 'coal', 'copper', 'copperWall'].includes(tile.type);
}

function isWalkableTile(tile) {
  return tile && ['floor', 'homeFloor', 'teleportPad', 'exit', 'exitUp', 'exitDown'].includes(tile.type);
}

function getWallMask(scene, x, y) {
  const top = isWallLike(getTile(scene, x, y - 1));
  const right = isWallLike(getTile(scene, x + 1, y));
  const bottom = isWallLike(getTile(scene, x, y + 1));
  const left = isWallLike(getTile(scene, x - 1, y));
  return { top, right, bottom, left };
}

function getWallVisualColors(tile) {
  if (tile.type === 'stone') return { base: 0x5a5a5a, edge: 0xa8a8a8, shadow: 0x262626, speck: 0xc0c0c0 };
  if (tile.type === 'coal') return { base: 0x303030, edge: 0x686868, shadow: 0x111111, speck: 0x777777 };
  if (tile.type === 'copper') return { base: 0x9b5a2e, edge: 0xffb066, shadow: 0x3a1b12, speck: 0xffaa55 };
  if (tile.type === 'copperWall') return { base: 0x71381f, edge: 0xff8844, shadow: 0x28110b, speck: 0xff9a58 };
  return { base: 0x2b180d, edge: 0x7a5238, shadow: 0x0b0503, speck: 0x56321e };
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
  const floorColor = tile.type === 'homeFloor' ? 0x3a2a19 : 0x222222;
  const pebbleColor = darkenColor(floorColor, brightness * 0.85);
  const lightPebble = darkenColor(tintColor(floorColor, 25), brightness * 0.8);

  // Ground texture speckles, deterministic per tile so it does not shimmer.
  scene.worldLayer.fillStyle(pebbleColor, 0.45);
  if (seededNoise(x, y, seed) > 0.25) scene.worldLayer.fillRect(px + 5, py + 6, 2, 2);
  if (seededNoise(x + 11, y + 4, seed) > 0.5) scene.worldLayer.fillRect(px + 17, py + 15, 3, 1);
  scene.worldLayer.fillStyle(lightPebble, 0.35);
  if (seededNoise(x - 8, y + 13, seed) > 0.62) scene.worldLayer.fillRect(px + 10, py + 20, 2, 2);

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

  if (tile.type === 'caveWall') {
    scene.worldLayer.fillStyle(darkenColor(0x56321e, brightness), 0.55);
    scene.worldLayer.fillRect(px + 5, py + 5, 4 + tile.variation, 3);
    scene.worldLayer.fillRect(px + 15, py + 13, 5, 4);
    if ((tile.detailSeed || 0) % 2 === 0) scene.worldLayer.fillRect(px + 8, py + 19, 3, 2);
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

function drawMiner(scene) {
  const px = scene.player.x - scene.tileSize / 2;
  const py = scene.player.y - scene.tileSize / 2;
  const size = scene.tileSize;

  scene.playerLayer.fillStyle(0x111111, 0.35);
  scene.playerLayer.fillEllipse(scene.player.x, scene.player.y + 10, 20, 7);

  scene.playerLayer.fillStyle(0x3366cc);
  scene.playerLayer.fillRect(px + 7, py + 11, size - 14, size - 8);
  scene.playerLayer.fillStyle(0xffcc88);
  scene.playerLayer.fillRect(px + 8, py + 7, size - 16, 8);
  scene.playerLayer.fillStyle(0xd8b000);
  scene.playerLayer.fillRect(px + 7, py + 4, size - 14, 5);
  scene.playerLayer.fillStyle(0xffffaa);
  scene.playerLayer.fillRect(px + size / 2 - 2, py + 3, 4, 3);
  scene.playerLayer.fillStyle(0x111111);
  scene.playerLayer.fillRect(px + 7, py + size - 4, 5, 3);
  scene.playerLayer.fillRect(px + size - 12, py + size - 4, 5, 3);

  scene.playerLayer.fillStyle(0xffaa00);
  scene.playerLayer.fillRect(
    scene.player.x - 2 + scene.lastMoveDirection.x * 11,
    scene.player.y - 2 + scene.lastMoveDirection.y * 11,
    4,
    4
  );
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
      const lightRadius = scene.currentMapName === 'home' ? 10.5 : 8.5;
      const minBrightness = scene.currentMapName === 'home' ? 0.26 : 0.14;
      const lightStrength = Phaser.Math.Clamp(1 - distance / lightRadius, 0, 1);
      const brightness = minBrightness + lightStrength * lightStrength * (1 - minBrightness);
      const color = darkenColor(getTileBaseColor(tile), brightness);

      scene.worldLayer.fillStyle(color);
      scene.worldLayer.fillRect(x * scene.tileSize, y * scene.tileSize, scene.tileSize, scene.tileSize);
      drawTileDetails(scene, tile, x, y, brightness);
    }
  }

  const target = getTargetTile(scene, 1);
  const targetTile = getTile(scene, target.x, target.y);
  if (targetTile && !['floor', 'homeFloor', 'teleportPad', 'exitUp', 'exitDown'].includes(targetTile.type)) {
    scene.playerLayer.lineStyle(1, 0xffcc66, 0.45);
    scene.playerLayer.strokeRect(target.x * scene.tileSize + 2, target.y * scene.tileSize + 2, scene.tileSize - 4, scene.tileSize - 4);
  }

  drawEnemies(scene);
  drawMiner(scene);
}
