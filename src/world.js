function generateMap(scene) {
  scene.map = [];

  for (let y = 0; y < scene.mapHeight; y++) {
    const row = [];
    for (let x = 0; x < scene.mapWidth; x++) {
      row.push({ type: 'caveWall', hardness: 999 });
    }
    scene.map.push(row);
  }

  generateMineArea(scene);
  generateHomeBase(scene);
}

function generateMineArea(scene) {
  const startX = 2;
  const startY = 2;
  const exitX = 22;
  const exitY = 15;

  for (let sy = startY - 1; sy <= startY + 3; sy++) {
    for (let sx = startX - 1; sx <= startX + 3; sx++) {
      carveMineFloor(scene, sx, sy);
    }
  }

  let cx = startX;
  let cy = startY;

  for (let i = 0; i < 750; i++) {
    carveMineFloor(scene, cx, cy);

    if (Math.random() < 0.25) {
      for (let ry = -1; ry <= 1; ry++) {
        for (let rx = -1; rx <= 1; rx++) {
          carveMineFloor(scene, cx + rx, cy + ry);
        }
      }
    }

    const dir = Phaser.Math.Between(0, 3);
    if (dir === 0 && cx > 2) cx--;
    if (dir === 1 && cx < scene.mineWidth - 3) cx++;
    if (dir === 2 && cy > 2) cy--;
    if (dir === 3 && cy < scene.mapHeight - 3) cy++;
  }

  cx = startX;
  cy = startY;

  while (cx !== exitX || cy !== exitY) {
    carveMineFloor(scene, cx, cy);

    if (cx !== exitX && (Math.random() < 0.55 || cy === exitY)) {
      cx += cx < exitX ? 1 : -1;
    } else if (cy !== exitY) {
      cy += cy < exitY ? 1 : -1;
    }
  }

  for (let ey = exitY - 1; ey <= exitY + 1; ey++) {
    for (let ex = exitX - 1; ex <= exitX + 1; ex++) {
      carveMineFloor(scene, ex, ey);
    }
  }

  placeResourcePockets(scene, 'stone', 10, 4, 4, 4);
  placeResourcePockets(scene, 'coal', 5, 3, 3, 3);
  placeResourcePockets(scene, 'copper', 4, 4, 10, 10);

  for (let sy = startY - 1; sy <= startY + 2; sy++) {
    for (let sx = startX - 1; sx <= startX + 2; sx++) {
      carveMineFloor(scene, sx, sy);
    }
  }

  for (let ey = exitY - 1; ey <= exitY + 1; ey++) {
    for (let ex = exitX - 1; ex <= exitX + 1; ex++) {
      carveMineFloor(scene, ex, ey);
    }
  }

  scene.map[exitY][exitX] = { type: 'exit', hardness: 999 };
}

function generateHomeBase(scene) {
  for (let y = 5; y <= 12; y++) {
    for (let x = 30; x <= 36; x++) {
      scene.map[y][x] = { type: 'homeFloor', hardness: 0 };
    }
  }

  for (let y = 5; y <= 8; y++) {
    scene.map[y][37] = { type: 'stone', hardness: 1, hp: 4, maxHp: 4 };
    for (let x = 38; x <= 42; x++) {
      scene.map[y][x] = { type: 'homeFloor', hardness: 0 };
    }
  }

  for (let y = 9; y <= 12; y++) {
    scene.map[y][37] = { type: 'copper', hardness: 2, hp: 10, maxHp: 10 };
    for (let x = 38; x <= 42; x++) {
      scene.map[y][x] = { type: 'homeFloor', hardness: 0 };
    }
  }

  scene.map[8][32] = { type: 'teleportPad', hardness: 0 };
}

function carveMineFloor(scene, x, y) {
  if (x <= 0 || y <= 0 || x >= scene.mineWidth - 1 || y >= scene.mapHeight - 1) return;
  scene.map[y][x] = { type: 'floor', hardness: 0 };
}

function placeResourcePockets(scene, type, pocketCount, maxTiles, hp, maxHp) {
  for (let p = 0; p < pocketCount; p++) {
    let x = Phaser.Math.Between(2, scene.mineWidth - 3);
    let y = Phaser.Math.Between(2, scene.mapHeight - 3);

    if (scene.map[y][x].type !== 'floor') continue;

    const tilesToPlace = Phaser.Math.Between(2, maxTiles);

    for (let i = 0; i < tilesToPlace; i++) {
      if (scene.map[y][x].type === 'floor') {
        scene.map[y][x] = {
          type: type,
          hardness: type === 'copper' ? 2 : 1,
          hp: hp,
          maxHp: maxHp
        };
      }

      const dir = Phaser.Math.Between(0, 3);
      if (dir === 0 && x > 2) x--;
      if (dir === 1 && x < scene.mineWidth - 3) x++;
      if (dir === 2 && y > 2) y--;
      if (dir === 3 && y < scene.mapHeight - 3) y++;
    }
  }
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
  if (tile.type === 'caveWall') return 0x2a160c;
  if (tile.type === 'exit') return 0x00aa00;

  if (tile.type === 'stone') {
    if (tile.hp <= 1) return 0x999999;
    if (tile.hp <= 2) return 0x777777;
    return 0x555555;
  }

  if (tile.type === 'coal') {
    if (tile.hp <= 1) return 0x666666;
    return 0x333333;
  }

  if (tile.type === 'copper') {
    if (tile.hp <= 3) return 0xffaa66;
    if (tile.hp <= 6) return 0xdd8844;
    return 0xaa6633;
  }

  return 0x000000;
}

function redraw(scene) {
  scene.worldLayer.clear();
  scene.objectLayer.clear();
  scene.playerLayer.clear();

  scene.worldLayer.fillStyle(0x020202);
  scene.worldLayer.fillRect(0, 0, scene.mapWidth * scene.tileSize, scene.mapHeight * scene.tileSize);

  for (let y = 0; y < scene.mapHeight; y++) {
    for (let x = 0; x < scene.mapWidth; x++) {
      const tile = scene.map[y][x];
      let color = getTileBaseColor(tile);

      const distance = Phaser.Math.Distance.Between(x, y, scene.player.x, scene.player.y);
      const lightRadius = 7.5;
      const minBrightness = 0.08;
      const lightStrength = Phaser.Math.Clamp(1 - distance / lightRadius, 0, 1);
      const smoothFalloff = lightStrength * lightStrength;
      const brightness = minBrightness + smoothFalloff * 0.92;

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

  for (const object of scene.placedObjects) {
    if (object.type === 'furnace') {
      scene.objectLayer.fillStyle(0xff6633);
      scene.objectLayer.fillRect(
        object.x * scene.tileSize + 4,
        object.y * scene.tileSize + 4,
        scene.tileSize - 8,
        scene.tileSize - 8
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
    scene.player.x * scene.tileSize + scene.tileSize / 2 - 2 + scene.lastMoveDirection.x * 7,
    scene.player.y * scene.tileSize + scene.tileSize / 2 - 2 + scene.lastMoveDirection.y * 7,
    4,
    4
  );
}
