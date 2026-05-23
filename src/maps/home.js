function createHomeMap(scene) {
  const map = createEmptyMap(
    scene,
    scene.mapWidth,
    scene.mapHeight
  );

  // Starter 3x3 home room
  for (let y = 7; y <= 9; y++) {
    for (let x = 32; x <= 34; x++) {
      map[y][x] = {
        type: 'homeFloor',
        hardness: 0
      };
    }
  }

  // Crafting table at top-center of starter room
  map[7][33] = {
    type: 'craftingTable',
    hardness: 999
  };

  // Teleport pad in center
  map[8][33] = {
    type: 'teleportPad',
    hardness: 0
  };

  // Copper-blocked 3x3 expansion room to the left
  for (let y = 7; y <= 9; y++) {
    for (let x = 28; x <= 30; x++) {
      map[y][x] = {
        type: 'copper',
        hardness: 2,
        hp: 10,
        maxHp: 10
      };
    }
  }

  // Connector copper block between starter room and expansion
  map[8][31] = {
    type: 'copper',
    hardness: 2,
    hp: 10,
    maxHp: 10
  };

  return map;
}
