function createEmptyMap(scene, width, height) {
  const map = [];

  for (let y = 0; y < height; y++) {
    const row = [];

    for (let x = 0; x < width; x++) {
      row.push({
        type: 'caveWall',
        hardness: 999
      });
    }

    map.push(row);
  }

  return map;
}

function generateMaps(scene) {
  scene.mineMap = createMineMap(scene);
  scene.homeMap = createHomeMap(scene);

  scene.currentMapName = 'mine';
  scene.map = scene.mineMap;
}

function switchToMine(scene) {
  scene.map = scene.mineMap;
  scene.currentMapName = 'mine';
}

function switchToHome(scene) {
  scene.map = scene.homeMap;
  scene.currentMapName = 'home';
}

function darkenColor(color, factor) {
  const r = Math.floor(((color >> 16) & 255) * factor);
  const g = Math.floor(((color >> 8) & 255) * factor);
  const b = Math.floor((color & 255) * factor);

  return (r << 16) + (g << 8) + b;
}

function getTileBaseColor(tile) {
  if (tile.type === 'floor') return 0x111111;
  if (tile.type === 'homeFloor') return 0x1a1510;
  if (tile.type === 'teleportPad') return 0x3344aa;
  if (tile.type === 'furnace') return 0xff2222;
  if (tile.type === 'craftingTable') return 0x8b5a2b;
  if (tile.type === 'caveWall') return 0x2a160c;
  if (tile.type === 'exit') return 0x00aa00;

  if (tile.type === 'stone') return 0x555555;
  if (tile.type === 'coal') return 0x333333;
  if (tile.type === 'copper') return 0xaa6633;

  return 0x000000;
}

function drawTileDetails(scene, tile, x, y, brightness) {
  const px = x * scene.tileSize;
  const py = y * scene.tileSize;
  const size = scene.tileSize;

  if (tile.type === 'caveWall') {
  scene.worldLayer.fillStyle(darkenColor(0x3a2114, brightness));
  scene.worldLayer.fillRect(px + 3, py + 3, size - 6, size - 6);

  scene.worldLayer.fillStyle(darkenColor(0x1c0f08, brightness));
  scene.worldLayer.fillRect(px + 5, py + 6, 5, 4);
  scene.worldLayer.fillRect(px + 15, py + 4, 6, 5);
  scene.worldLayer.fillRect(px + 10, py + 16, 9, 5);

  scene.worldLayer.lineStyle(1, darkenColor(0x5a3320, brightness), 0.8);
  scene.worldLayer.beginPath();
  scene.worldLayer.moveTo(px + 4, py + 13);
  scene.worldLayer.lineTo(px + 11, py + 10);
  scene.worldLayer.lineTo(px + 18, py + 14);
  scene.worldLayer.strokePath();
}

  if (tile.type === 'stone') {
    scene.worldLayer.lineStyle(1, darkenColor(0xaaaaaa, brightness), 0.8);
    scene.worldLayer.beginPath();
    scene.worldLayer.moveTo(px + 5, py + 8);
    scene.worldLayer.lineTo(px + 13, py + 14);
    scene.worldLayer.lineTo(px + 21, py + 10);
    scene.worldLayer.strokePath();

    scene.worldLayer.beginPath();
    scene.worldLayer.moveTo(px + 8, py + 20);
    scene.worldLayer.lineTo(px + 16, py + 17);
    scene.worldLayer.strokePath();
  }

  if (tile.type === 'coal') {
    scene.worldLayer.fillStyle(darkenColor(0x777777, brightness));
    scene.worldLayer.fillRect(px + 6, py + 7, 3, 3);
    scene.worldLayer.fillRect(px + 17, py + 13, 3, 3);
    scene.worldLayer.fillRect(px + 11, py + 20, 2, 2);
  }

  if (tile.type === 'copper') {
    scene.worldLayer.fillStyle(darkenColor(0xffaa55, brightness));
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
    const isWorking =
      scene.furnaceQueue &&
      scene.furnaceQueue.length > 0;

    const glowColor = isWorking ? 0xffdd55 : 0xff7722;
    const coreColor = isWorking ? 0xffff88 : 0xffaa44;

    scene.worldLayer.fillStyle(darkenColor(0x5a1a12, brightness));
    scene.worldLayer.fillRect(px + 4, py + 4, size - 8, size - 8);

    scene.worldLayer.fillStyle(darkenColor(0x2a0c08, brightness));
    scene.worldLayer.fillRect(px + 8, py + 8, size - 16, size - 16);

    scene.worldLayer.fillStyle(darkenColor(glowColor, brightness));
    scene.worldLayer.fillRect(px + 9, py + 10, size - 18, size - 18);

    scene.worldLayer.fillStyle(darkenColor(coreColor, brightness));
    scene.worldLayer.fillRect(px + 12, py + 13, size - 24, size - 24);
  }

  if (tile.type === 'teleportPad') {
    scene.worldLayer.lineStyle(2, darkenColor(0x88aaff, brightness), 0.9);
    scene.worldLayer.strokeCircle(px + size / 2, py + size / 2, 8);
    scene.worldLayer.strokeCircle(px + size / 2, py + size / 2, 4);
  }
}

function drawMiner(scene) {
  const px = scene.player.x * scene.tileSize;
  const py = scene.player.y * scene.tileSize;
  const size = scene.tileSize;

  // Body
  scene.playerLayer.fillStyle(0x3366cc);
  scene.playerLayer.fillRect(px + 7, py + 11, size - 14, size - 8);

  // Face
  scene.playerLayer.fillStyle(0xffcc88);
  scene.playerLayer.fillRect(px + 8, py + 7, size - 16, 8);

  // Helmet
  scene.playerLayer.fillStyle(0xd8b000);
  scene.playerLayer.fillRect(px + 7, py + 4, size - 14, 5);

  // Helmet lamp
  scene.playerLayer.fillStyle(0xffffaa);
  scene.playerLayer.fillRect(px + size / 2 - 2, py + 3, 4, 3);

  // Feet
  scene.playerLayer.fillStyle(0x111111);
  scene.playerLayer.fillRect(px + 7, py + size - 4, 5, 3);
  scene.playerLayer.fillRect(px + size - 12, py + size - 4, 5, 3);

  // Facing indicator
  scene.playerLayer.fillStyle(0xffaa00);
  scene.playerLayer.fillRect(
    px + size / 2 - 2 + scene.lastMoveDirection.x * 7,
    py + size / 2 - 2 + scene.lastMoveDirection.y * 7,
    4,
    4
  );
}

function redraw(scene) {
  scene.worldLayer.clear();
  scene.playerLayer.clear();

  scene.worldLayer.fillStyle(0x020202);
  scene.worldLayer.fillRect(
    0,
    0,
    scene.mapWidth * scene.tileSize,
    scene.mapHeight * scene.tileSize
  );

  for (let y = 0; y < scene.mapHeight; y++) {
    for (let x = 0; x < scene.mapWidth; x++) {
      const tile = scene.map[y][x];

      let color = getTileBaseColor(tile);

      const distance = Phaser.Math.Distance.Between(
        x,
        y,
        scene.player.x,
        scene.player.y
      );

      const lightRadius = 8.5;
      const minBrightness = 0.16;

      const lightStrength = Phaser.Math.Clamp(
        1 - distance / lightRadius,
        0,
        1
      );

      const brightness =
        minBrightness + lightStrength * lightStrength * 0.84;

      color = darkenColor(color, brightness);

      scene.worldLayer.fillStyle(color);
      scene.worldLayer.fillRect(
        x * scene.tileSize,
        y * scene.tileSize,
        scene.tileSize - 1,
        scene.tileSize - 1
      );

      drawTileDetails(scene, tile, x, y, brightness);
    }
  }

  drawMiner(scene);
}
