
const FIRST_LOCKED_MINE_LEVEL = 6;
const STARTING_UNLOCKED_MINE_LEVELS = 5;

function createMineMap(scene, level = 1) {
  if (typeof createRoomBasedMineMap === 'function') {
    return createRoomBasedMineMap(scene, level);
  }

  const biome = getBiomeForLevel(level);
  const map = createEmptyMap(scene, scene.mapWidth, scene.mapHeight);
  applyBiomeToMap(map, biome);
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
  // Keep cave fullness stable at deeper levels. Earlier builds scaled room/resource
  // counts directly with level, which eventually filled the whole map with ore.
  const caveDensityLevel = Math.min(level, 6);
  const roomCount = Phaser.Math.Clamp(12 + caveDensityLevel * 2, 14, 22);

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

  addBalancedMineResources(scene, map, biome, level);

  normalizeMineResourceDensity(scene, map, level);

  addBiomeDecorations(scene, map, biome, level);

  addCaveTorches(scene, map, level, [
    { x: startX + 2, y: startY },
    { x: downX - 2, y: downY }
  ]);

  map[startY][startX] = makeTile('exitUp', { targetLevel: level - 1 });

  // Every generated level should have a deeper portal. The copper pickaxe gate
  // belongs on the level 5 -> 6 transition, not by deleting portals after 6.
  map[downY][downX] = makeTile('exitDown', {
    targetLevel: level + 1,
    requiredPickaxeTier: levelInfo.nextRequiredPickaxeTier
  });

  applyBiomeToMap(map, biome);
  return map;
}

function addBalancedMineResources(scene, map, biome, level) {
  // Resource density is intentionally capped so level 50 does not become more
  // crowded than level 6. Biomes change flavor, not total map fullness.
  const densityLevel = Math.min(level, 6);
  const base = {
    stonePockets: Phaser.Math.Clamp(10 + densityLevel * 2, 12, 22),
    stoneSize: 4,
    coalPockets: Phaser.Math.Clamp(4 + densityLevel, 5, 10),
    coalSize: 3,
    woodPockets: Phaser.Math.Clamp(3 + Math.floor(densityLevel / 2), 4, 7),
    woodSize: 3,
    copperPockets: Phaser.Math.Clamp(level <= STARTING_UNLOCKED_MINE_LEVELS ? 4 + densityLevel : 8, 5, 10),
    copperSize: level <= STARTING_UNLOCKED_MINE_LEVELS ? 4 : 5,
    copperWallPockets: 0,
    copperWallSize: 5
  };

  if (biome.id === 'sporeGrotto') {
    base.coalPockets += 1;
    base.woodPockets += 2;
    base.copperPockets += 1;
  } else if (biome.id === 'boneHollow') {
    base.stonePockets += 2;
    base.coalPockets += 1;
    base.copperPockets = 8;
  } else if (biome.id === 'frostfangDepths') {
    base.stonePockets += 2;
    base.coalPockets += 1;
    base.copperPockets = 6;
    base.copperWallPockets = 1;
  } else if (biome.id === 'crystalDepths') {
    base.stonePockets += 1;
    base.coalPockets += 1;
    base.copperPockets = 6;
    base.copperWallPockets = 1;
  } else if (biome.id === 'emberCaverns') {
    base.coalPockets += 2;
    base.copperPockets = 5;
    base.copperWallPockets = 2;
  } else if (biome.id === 'ancientCore') {
    base.stonePockets += 1;
    base.coalPockets += 1;
    base.copperPockets = 5;
    base.copperWallPockets = 2;
  }

  placeResourcePocketsOnMap(scene, map, 'stone', base.stonePockets, base.stoneSize);
  placeResourcePocketsOnMap(scene, map, 'coal', base.coalPockets, base.coalSize);
  placeResourcePocketsOnMap(scene, map, 'wood', base.woodPockets, base.woodSize);
  placeResourcePocketsOnMap(scene, map, 'copper', base.copperPockets, base.copperSize);
  if (base.copperWallPockets > 0) {
    placeResourcePocketsOnMap(scene, map, 'copperWall', base.copperWallPockets, base.copperWallSize);
  }
}

function getMineLevelInfo(level) {
  return {
    level,
    isUnlockedAtStart: level <= STARTING_UNLOCKED_MINE_LEVELS,
    nextRequiredPickaxeTier: level + 1 === FIRST_LOCKED_MINE_LEVEL ? 3 : 1
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


function normalizeMineResourceDensity(scene, map, level) {
  // Safety cap for both new maps and loaded old saves. Deep maps should not
  // become resource-filled; they should stay close to levels 1-6 density.
  const resourceTypes = new Set(['stone', 'coal', 'copper', 'copperWall', 'wood', 'largeOreChunk']);
  const resources = [];
  let openishTiles = 0;

  for (let y = 1; y < scene.mapHeight - 1; y++) {
    for (let x = 1; x < scene.mapWidth - 1; x++) {
      const tile = map[y]?.[x];
      if (!tile) continue;
      if (tile.type === 'floor' || tile.type === 'torch' || tile.type === 'exitUp' || tile.type === 'exitDown') openishTiles++;
      if (resourceTypes.has(tile.type)) {
        resources.push({ x, y, type: tile.type });
        openishTiles++;
      }
    }
  }

  const maxResourceRatio = level <= STARTING_UNLOCKED_MINE_LEVELS ? 0.30 : 0.28;
  const maxResources = Math.floor(openishTiles * maxResourceRatio);
  if (resources.length <= maxResources) return;

  // Prefer trimming common resource blocks first, keeping rarer copper walls/ore.
  const trimPriority = { stone: 1, wood: 2, coal: 3, copperWall: 4, copper: 5 };
  resources.sort((a, b) => (trimPriority[a.type] || 9) - (trimPriority[b.type] || 9) || Math.random() - 0.5);

  const removeCount = resources.length - maxResources;
  for (let i = 0; i < removeCount; i++) {
    const spot = resources[i];
    map[spot.y][spot.x] = makeTile('floor');
  }
}

function addCaveTorches(scene, map, level, forcedSpots = []) {
  const spots = [...forcedSpots];
  const torchCount = Phaser.Math.Clamp(5 + Math.floor(Math.min(level, 6) / 2), 5, 8);

  for (let i = 0; i < torchCount; i++) {
    spots.push({
      x: Phaser.Math.Between(4, scene.mapWidth - 6),
      y: Phaser.Math.Between(4, scene.mapHeight - 5)
    });
  }

  for (const spot of spots) {
    let placed = false;
    for (let r = 0; r < 4 && !placed; r++) {
      for (let yy = spot.y - r; yy <= spot.y + r && !placed; yy++) {
        for (let xx = spot.x - r; xx <= spot.x + r && !placed; xx++) {
          if (!map[yy] || !map[yy][xx] || map[yy][xx].type !== 'floor') continue;
          if (!touchesWallForTorch(map, xx, yy)) continue;
          map[yy][xx] = makeTile('torch');
          placed = true;
        }
      }
    }
  }
}

function touchesWallForTorch(map, x, y) {
  const neighbors = [
    map[y - 1]?.[x],
    map[y + 1]?.[x],
    map[y]?.[x - 1],
    map[y]?.[x + 1]
  ];
  return neighbors.some(tile => tile && ['caveWall', 'stone', 'coal', 'copper', 'copperWall', 'wood', 'largeOreChunk'].includes(tile.type));
}
