
const FIRST_LOCKED_MINE_LEVEL = 6;
const STARTING_UNLOCKED_MINE_LEVELS = 5;

function createMineMap(scene, level = 1) {
  const map = createEmptyMap(scene, scene.mapWidth, scene.mapHeight);
  const startX = 3;
  const startY = 3;
  const downX = scene.mapWidth - 5;
  const downY = scene.mapHeight - 4;
  const levelInfo = getMineLevelInfo(level);

  function carve(x, y) {
    if (x <= 0 || y <= 0 || x >= scene.mapWidth - 1 || y >= scene.mapHeight - 1) return;
    map[y][x] = makeTile('floor');
  }

  function carveBlob(cx, cy, rx, ry) {
    for (let y = cy - ry; y <= cy + ry; y++) {
      for (let x = cx - rx; x <= cx + rx; x++) {
        const nx = (x - cx) / Math.max(1, rx);
        const ny = (y - cy) / Math.max(1, ry);
        const edgeNoise = Math.random() * 0.35;
        if (nx * nx + ny * ny < 1.0 + edgeNoise) carve(x, y);
      }
    }
  }

  carveBlob(startX, startY, 4, 3);

  let cx = startX;
  let cy = startY;
  const roomCount = 12 + level * 2;

  for (let i = 0; i < roomCount; i++) {
    const targetX = Phaser.Math.Between(4, scene.mapWidth - 6);
    const targetY = Phaser.Math.Between(4, scene.mapHeight - 5);

    while (cx !== targetX || cy !== targetY) {
      carveBlob(cx, cy, Phaser.Math.Between(1, 3), Phaser.Math.Between(1, 2));
      if (cx !== targetX && (Math.random() < 0.58 || cy === targetY)) cx += cx < targetX ? 1 : -1;
      else if (cy !== targetY) cy += cy < targetY ? 1 : -1;
    }

    carveBlob(cx, cy, Phaser.Math.Between(2, 4), Phaser.Math.Between(2, 3));
  }

  cx = startX;
  cy = startY;
  while (cx !== downX || cy !== downY) {
    carveBlob(cx, cy, 2, 1);
    if (cx !== downX && (Math.random() < 0.65 || cy === downY)) cx += cx < downX ? 1 : -1;
    else if (cy !== downY) cy += cy < downY ? 1 : -1;
  }

  carveBlob(startX, startY, 4, 3);
  carveBlob(downX, downY, 3, 2);

  placeResourcePocketsOnMap(scene, map, 'stone', 12 + level * 2, 4 + Math.min(level, 3));
  placeResourcePocketsOnMap(scene, map, 'coal', 5 + level, 3 + Math.min(level, 3));

  if (level <= STARTING_UNLOCKED_MINE_LEVELS) {
    placeResourcePocketsOnMap(scene, map, 'copper', 4 + level, 3 + Math.min(level, 4));
  } else {
    placeResourcePocketsOnMap(scene, map, 'copper', 9 + level, 5);
    placeResourcePocketsOnMap(scene, map, 'copperWall', 5, 7);
  }

  map[startY][startX] = makeTile('exitUp', { targetLevel: level - 1 });

  if (level < FIRST_LOCKED_MINE_LEVEL) {
    map[downY][downX] = makeTile('exitDown', { targetLevel: level + 1, requiredPickaxeTier: levelInfo.nextRequiredPickaxeTier });
  } else {
    map[downY][downX] = makeTile('copperWall');
  }

  return map;
}

function getMineLevelInfo(level) {
  return {
    level,
    isUnlockedAtStart: level <= STARTING_UNLOCKED_MINE_LEVELS,
    nextRequiredPickaxeTier: level + 1 >= FIRST_LOCKED_MINE_LEVEL ? 3 : 1
  };
}

function placeResourcePocketsOnMap(scene, map, type, pocketCount, maxTiles) {
  for (let p = 0; p < pocketCount; p++) {
    let x = Phaser.Math.Between(2, scene.mapWidth - 3);
    let y = Phaser.Math.Between(2, scene.mapHeight - 3);

    if (map[y][x].type !== 'floor') continue;

    const tilesToPlace = Phaser.Math.Between(2, maxTiles);
    for (let i = 0; i < tilesToPlace; i++) {
      if (map[y][x].type === 'floor') map[y][x] = makeTile(type);
      const dir = Phaser.Math.Between(0, 3);
      if (dir === 0 && x > 2) x--;
      if (dir === 1 && x < scene.mapWidth - 3) x++;
      if (dir === 2 && y > 2) y--;
      if (dir === 3 && y < scene.mapHeight - 3) y++;
    }
  }
}
