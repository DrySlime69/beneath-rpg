
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
  return ['caveWall', 'stone', 'coal', 'copper', 'copperWall'].includes(tile.type);
}

function drawNaturalEdges(scene, tile, x, y, brightness) {
  if (!isWallLike(tile)) return;

  const px = x * scene.tileSize;
  const py = y * scene.tileSize;
  const s = scene.tileSize;
  const shadow = darkenColor(0x000000, brightness + 0.12);
  const rim = darkenColor(0x7a5238, brightness * 0.7);

  const top = getTile(scene, x, y - 1);
  const bottom = getTile(scene, x, y + 1);
  const left = getTile(scene, x - 1, y);
  const right = getTile(scene, x + 1, y);

  scene.worldLayer.fillStyle(shadow, 0.35);
  if (top && !isWallLike(top)) scene.worldLayer.fillRect(px + 2, py, s - 4, 3);
  if (bottom && !isWallLike(bottom)) scene.worldLayer.fillRect(px + 2, py + s - 4, s - 4, 4);
  if (left && !isWallLike(left)) scene.worldLayer.fillRect(px, py + 2, 3, s - 4);
  if (right && !isWallLike(right)) scene.worldLayer.fillRect(px + s - 4, py + 2, 4, s - 4);

  scene.worldLayer.lineStyle(1, rim, 0.55);
  if (top && !isWallLike(top)) scene.worldLayer.lineBetween(px + 4, py + 4, px + s - 5, py + 3);
  if (left && !isWallLike(left)) scene.worldLayer.lineBetween(px + 3, py + 5, px + 4, py + s - 5);
}

function drawTileDetails(scene, tile, x, y, brightness) {
  const px = x * scene.tileSize;
  const py = y * scene.tileSize;
  const size = scene.tileSize;

  drawNaturalEdges(scene, tile, x, y, brightness);

  if (tile.type === 'caveWall') {
    scene.worldLayer.fillStyle(darkenColor(0x3a2114, brightness));
    scene.worldLayer.fillRect(px + 5, py + 5, 4 + tile.variation, 3);
    scene.worldLayer.fillRect(px + 15, py + 13, 5, 4);
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

  drawMiner(scene);
}
