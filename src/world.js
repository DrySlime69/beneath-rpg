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
  const r = Math.floor(
    ((color >> 16) & 255) * factor
  );

  const g = Math.floor(
    ((color >> 8) & 255) * factor
  );

  const b = Math.floor(
    (color & 255) * factor
  );

  return (r << 16) + (g << 8) + b;
}

function getTileBaseColor(tile) {
  if (tile.type === 'floor') {
    return 0x111111;
  }

  if (tile.type === 'homeFloor') {
    return 0x1a1510;
  }

  if (tile.type === 'teleportPad') {
    return 0x3344aa;
  }

  if (tile.type === 'furnace') {
    return 0xff2222;
  }

  if (tile.type === 'caveWall') {
    return 0x2a160c;
  }

  if (tile.type === 'exit') {
    return 0x00aa00;
  }

  if (tile.type === 'stone') {
    if (tile.hp <= 1) {
      return 0x999999;
    }

    if (tile.hp <= 2) {
      return 0x777777;
    }

    return 0x555555;
  }

  if (tile.type === 'coal') {
    if (tile.hp <= 1) {
      return 0x666666;
    }

    return 0x333333;
  }

  if (tile.type === 'copper') {
    if (tile.hp <= 3) {
      return 0xffaa66;
    }

    if (tile.hp <= 6) {
      return 0xdd8844;
    }

    return 0xaa6633;
  }

  return 0x000000;
}

if (tile.type === 'craftingTable') {
  return 0x8b5a2b;
}

function redraw(scene) {
  scene.worldLayer.clear();
  scene.objectLayer.clear();
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

      const distance =
        Phaser.Math.Distance.Between(
          x,
          y,
          scene.player.x,
          scene.player.y
        );

      const lightRadius = 8.5;
      const minBrightness = 0.16;

      const lightStrength =
        Phaser.Math.Clamp(
          1 - distance / lightRadius,
          0,
          1
        );

      const smoothFalloff =
        lightStrength * lightStrength;

      const brightness =
        minBrightness + smoothFalloff * 0.84;

      color = darkenColor(color, brightness);

      scene.worldLayer.fillStyle(color);

      scene.worldLayer.fillRect(
        x * scene.tileSize,
        y * scene.tileSize,
        scene.tileSize - 1,
        scene.tileSize - 1
      );
    }
  }

  scene.playerLayer.fillStyle(0xffff66);

  scene.playerLayer.fillRect(
    scene.player.x * scene.tileSize + 5,
    scene.player.y * scene.tileSize + 5,
    scene.tileSize - 10,
    scene.tileSize - 10
  );

  scene.playerLayer.fillStyle(0xffaa00);

  scene.playerLayer.fillRect(
    scene.player.x * scene.tileSize +
      scene.tileSize / 2 -
      2 +
      scene.lastMoveDirection.x * 7,

    scene.player.y * scene.tileSize +
      scene.tileSize / 2 -
      2 +
      scene.lastMoveDirection.y * 7,

    4,
    4
  );
}
