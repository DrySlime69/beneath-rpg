
function createHomeMap(scene) {
  const map = createEmptyMap(scene, scene.mapWidth, scene.mapHeight);

  // Natural starter home room.
  for (let y = 5; y <= 12; y++) {
    for (let x = 28; x <= 38; x++) {
      const dx = x - 33;
      const dy = y - 8.5;
      if ((dx * dx) / 34 + (dy * dy) / 12 < 1.0) {
        map[y][x] = makeTile('homeFloor');
      }
    }
  }

  // Soft edges/corners so the room feels less square.
  map[5][31] = makeTile('caveWall');
  map[5][36] = makeTile('caveWall');
  map[12][29] = makeTile('caveWall');
  map[12][37] = makeTile('caveWall');

  // Cozy string lights along the upper wall. These are decorative and do not block placement/walking.
  [29, 31, 33, 35, 37].forEach((x, index) => {
    if (map[6] && map[6][x] && map[6][x].type === 'homeFloor') {
      map[6][x] = makeTile('homeFloor', { decor: 'stringLight', lightIndex: index });
    }
  });
  [30, 34, 38].forEach((x, index) => {
    if (map[10] && map[10][x] && map[10][x].type === 'homeFloor') {
      map[10][x] = makeTile('homeFloor', { decor: 'stringLight', lightIndex: index + 5 });
    }
  });

  map[7][33] = makeTile('craftingTable');
  map[8][33] = makeTile('teleportPad');

  // Copper-wall gated expansion to the left.
  for (let y = 6; y <= 11; y++) {
    for (let x = 20; x <= 26; x++) {
      const dx = x - 23;
      const dy = y - 8.5;
      if ((dx * dx) / 13 + (dy * dy) / 8 < 1.0) {
        map[y][x] = makeTile('copper');
      }
    }
  }

  map[8][27] = makeTile('copper');
  map[9][27] = makeTile('copper');

  return map;
}
