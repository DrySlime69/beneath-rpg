
function createMineMap(scene) {
  const map = createEmptyMap(scene, scene.mapWidth, scene.mapHeight);
  const startX = 2;
  const startY = 2;
  const exitX = 39;
  const exitY = 20;

  function carve(x, y) {
    if (x <= 0 || y <= 0 || x >= scene.mapWidth - 1 || y >= scene.mapHeight - 1) return;
    map[y][x] = makeTile('floor');
  }

  function carveBlob(cx, cy, rx, ry) {
    for (let y = cy - ry; y <= cy + ry; y++) {
      for (let x = cx - rx; x <= cx + rx; x++) {
        const nx = (x - cx) / Math.max(1, rx);
        const ny = (y - cy) / Math.max(1, ry);
        if (nx * nx + ny * ny < 1.05 + Math.random() * 0.25) carve(x, y);
      }
    }
  }

  carveBlob(startX + 1, startY + 1, 3, 3);

  let cx = startX + 1;
  let cy = startY + 1;
  for (let i = 0; i < 18; i++) {
    const targetX = Phaser.Math.Between(4, scene.mapWidth - 5);
    const targetY = Phaser.Math.Between(3, scene.mapHeight - 4);

    while (cx !== targetX || cy !== targetY) {
      carveBlob(cx, cy, Phaser.Math.Between(1, 2), Phaser.Math.Between(1, 2));
      if (cx !== targetX && (Math.random() < 0.58 || cy === targetY)) cx += cx < targetX ? 1 : -1;
      else if (cy !== targetY) cy += cy < targetY ? 1 : -1;
    }
  }

  cx = startX + 1;
  cy = startY + 1;
  while (cx !== exitX || cy !== exitY) {
    carveBlob(cx, cy, 2, 1);
    if (cx !== exitX && (Math.random() < 0.65 || cy === exitY)) cx += cx < exitX ? 1 : -1;
    else if (cy !== exitY) cy += cy < exitY ? 1 : -1;
  }

  carveBlob(exitX, exitY, 3, 2);
  placeResourcePocketsOnMap(scene, map, 'stone', 14, 5);
  placeResourcePocketsOnMap(scene, map, 'coal', 7, 4);
  placeResourcePocketsOnMap(scene, map, 'copper', 6, 4);

  carveBlob(startX + 1, startY + 1, 3, 3);
  carveBlob(exitX, exitY, 2, 2);
  map[exitY][exitX] = makeTile('exit');

  return map;
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
