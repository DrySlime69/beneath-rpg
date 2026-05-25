// Room-based mine generation framework.
// Step 1 of the curated biome direction: build chambers, corridors, metadata,
// and landmark/theme hooks while keeping the existing tile mining/collision system.

const MINE_MAX_LEVEL = 60;

const ROOM_THEME_BY_BIOME = {
  sporeGrotto: ['mushroomGrove', 'sporePit', 'rootCavern', 'fungalNest', 'quietChamber', 'floodedGrotto'],
  boneHollow: ['boneYard', 'webbedCrypt', 'ribCageHall', 'skullRoom', 'quietChamber'],
  frostfangDepths: ['iceGallery', 'frozenLake', 'snowDriftRoom', 'frostCrystalPocket', 'quietChamber'],
  crystalDepths: ['crystalGarden', 'gemHall', 'glowPoolRoom', 'shardField', 'quietChamber'],
  emberCaverns: ['emberVentRoom', 'ashField', 'lavaCrackHall', 'charredChamber', 'quietChamber'],
  ancientCore: ['machineRoom', 'runeHall', 'coreConduit', 'brokenPlatform', 'quietChamber']
};

function createRoomBasedMineMap(scene, level = 1) {
  const clampedLevel = Phaser.Math.Clamp(level || 1, 1, MINE_MAX_LEVEL);
  if (clampedLevel === 1 && typeof createCuratedSporeLevel1Map === 'function') {
    return createCuratedSporeLevel1Map(scene);
  }
  const biome = getBiomeForLevel(clampedLevel);
  const map = createEmptyMap(scene, scene.mapWidth, scene.mapHeight);
  applyBiomeToMap(map, biome);

  map.generationMode = 'roomGraph';
  map.generationVersion = 1;
  map.maxMineLevel = MINE_MAX_LEVEL;
  map.rooms = [];
  map.connections = [];
  map.landmarks = [];

  const rooms = generateMineRooms(scene, biome, clampedLevel);
  map.rooms = rooms.map(room => ({ ...room }));

  for (const room of rooms) carveRoomIntoMap(scene, map, room);
  connectRoomsInMap(scene, map, rooms);
  addOptionalRoomConnections(scene, map, rooms, clampedLevel);
  tagRoomTiles(map, rooms);

  const entranceRoom = rooms.find(room => room.role === 'entrance') || rooms[0];
  const exitRoom = rooms.find(room => room.role === 'exit') || rooms[rooms.length - 1];

  carveSafePortalPad(scene, map, entranceRoom.cx, entranceRoom.cy, 2);
  carveSafePortalPad(scene, map, exitRoom.cx, exitRoom.cy, 2);

  addBalancedMineResources(scene, map, biome, clampedLevel);
  normalizeMineResourceDensity(scene, map, clampedLevel);

  addRoomBasedBiomeDecorations(scene, map, biome, clampedLevel, rooms);

  // Resource/decor placement can overwrite the first portal pads, so clear them
  // again at the very end. This guarantees the player never starts inside a
  // resource, prop, or wall after entering a generated room level.
  carveSafePortalPad(scene, map, entranceRoom.cx, entranceRoom.cy, 2);
  carveSafePortalPad(scene, map, exitRoom.cx, exitRoom.cy, 2);

  addCaveTorches(scene, map, clampedLevel, [
    { x: entranceRoom.cx + 1, y: entranceRoom.cy },
    { x: exitRoom.cx - 1, y: exitRoom.cy }
  ]);

  map.entrySpawn = { x: entranceRoom.cx, y: entranceRoom.cy };
  map.downSpawn = { x: exitRoom.cx, y: exitRoom.cy };

  map[entranceRoom.cy][entranceRoom.cx] = makeTile('exitUp', { targetLevel: clampedLevel - 1, roomId: entranceRoom.id });

  if (clampedLevel < MINE_MAX_LEVEL) {
    const levelInfo = getMineLevelInfo(clampedLevel);
    map[exitRoom.cy][exitRoom.cx] = makeTile('exitDown', {
      targetLevel: clampedLevel + 1,
      requiredPickaxeTier: levelInfo.nextRequiredPickaxeTier,
      roomId: exitRoom.id
    });
  } else {
    map[exitRoom.cy][exitRoom.cx] = makeTile('floor', { roomId: exitRoom.id, landmark: 'ancientCoreEnd' });
    map.landmarks.push({ type: 'ancientCoreEnd', x: exitRoom.cx, y: exitRoom.cy, roomId: exitRoom.id });
  }

  applyBiomeToMap(map, biome);
  return map;
}


// Curated mine reboot: Level 1 is now a fixed, readable Spore Grotto intro map.
// It keeps all gameplay systems intact, but removes procedural chaos from the
// first level. Only stone ore deposits are mineable here.
function createCuratedSporeLevel1Map(scene) {
  const biome = getBiomeForLevel(1);
  const map = createEmptyMap(scene, scene.mapWidth, scene.mapHeight);

  map.generationMode = 'authoredStaticLevel';
  map.generationVersion = 200;
  map.curatedLevelId = 'spore_grotto_01_static';
  map.staticAuthoredLevel = true;
  map.staticBackgroundKey = 'level_spore_1_bg';
  map.maxMineLevel = MINE_MAX_LEVEL;
  map.rooms = [];
  map.connections = [];
  map.landmarks = [];

  // New mine direction: Level 1 is an authored scene. The visible cave is a
  // single background art layer, while this hidden tile grid only controls
  // collision, portals, enemies, and mineable deposits.
  for (let y = 0; y < scene.mapHeight; y++) {
    for (let x = 0; x < scene.mapWidth; x++) {
      const border = x <= 1 || y <= 1 || x >= scene.mapWidth - 2 || y >= scene.mapHeight - 2;
      map[y][x] = makeTile(border ? 'caveWall' : 'floor');
    }
  }

  // A few invisible collision islands line up with large background structures.
  // Keep Level 1 very open: most of the scene is walkable.
  const blockers = [
    { x: 36, y: 3, w: 4, h: 3 },   // right arch wall mass
    { x: 3, y: 4, w: 3, h: 3 },    // left portal wall mass
    { x: 29, y: 19, w: 3, h: 2 },  // bottom ruin table mass
    { x: 7, y: 5, w: 2, h: 2 },    // large mushroom base
    { x: 24, y: 4, w: 2, h: 2 },   // large mushroom base
    { x: 38, y: 8, w: 2, h: 2 }    // large mushroom base
  ];
  for (const b of blockers) {
    for (let y = b.y; y < b.y + b.h; y++) {
      for (let x = b.x; x < b.x + b.w; x++) {
        if (isInsideMap(scene, x, y, 1)) map[y][x] = makeTile('caveWall');
      }
    }
  }

  // Portals.
  const entry = { x: 4, y: 5 };
  const down = { x: 37, y: 5 };
  carveSafePortalPad(scene, map, entry.x, entry.y, 1);
  carveSafePortalPad(scene, map, down.x, down.y, 1);
  map[entry.y][entry.x] = makeTile('exitUp', { targetLevel: 0 });
  map[down.y][down.x] = makeTile('exitDown', { targetLevel: 2, requiredPickaxeTier: 1 });

  // Level 1: stone ore only. Use largeOreChunk so it reads like a deposit,
  // but keep requiredTier 0 so hands can recover stone if needed.
  const stoneDeposits = [
    { x: 13, y: 17 },
    { x: 22, y: 10 },
    { x: 31, y: 16 },
    { x: 9, y: 12 },
    { x: 35, y: 20 }
  ];
  for (const deposit of stoneDeposits) {
    placeCuratedStoneOreChunk(scene, map, deposit.x, deposit.y);
  }

  map.entrySpawn = { x: 8, y: 12 };
  map.downSpawn = { x: down.x, y: down.y };
  map.landmarks.push(
    { type: 'authoredSporeIntro', x: 8, y: 12 },
    { type: 'stoneDeposit', x: 13, y: 17 },
    { type: 'stoneDeposit', x: 22, y: 10 },
    { type: 'stoneDeposit', x: 31, y: 16 }
  );

  applyBiomeToMap(map, biome);
  map.visualDecorVersion = 200;
  return map;
}

function placeCuratedStoneOreChunk(scene, map, cx, cy) {
  const ore = getLargeOreChunkDef('stone');
  const points = [
    { x: cx, y: cy, anchor: true },
    { x: cx + 1, y: cy },
    { x: cx - 1, y: cy },
    { x: cx, y: cy + 1 },
    { x: cx + 1, y: cy + 1 },
    { x: cx, y: cy - 1 }
  ];
  for (const p of points) {
    if (!isInsideMap(scene, p.x, p.y, 1)) continue;
    const t = map[p.y]?.[p.x];
    if (!t || t.type === 'exitUp' || t.type === 'exitDown') continue;
    map[p.y][p.x] = makeTile('largeOreChunk', {
      oreId: 'stone',
      hardness: ore.hardness,
      hp: ore.hp,
      maxHp: ore.hp,
      biome: 'sporeGrotto',
      chunkAnchor: !!p.anchor
    });
  }
}

function findCuratedLevel1RoomId(rooms, x, y) {
  let best = rooms[0];
  let bestDist = Infinity;
  for (const room of rooms) {
    const d = Phaser.Math.Distance.Between(x, y, room.cx, room.cy);
    if (d < bestDist) {
      best = room;
      bestDist = d;
    }
  }
  return best?.id || 0;
}

function carveCuratedPath(scene, map, x1, y1, x2, y2, radius = 1) {
  let x = x1;
  let y = y1;
  let guard = 0;
  while ((x !== x2 || y !== y2) && guard++ < 200) {
    carveCorridorBrush(scene, map, x, y, radius, true);
    if (x !== x2 && (Math.random() < 0.65 || y === y2)) x += x < x2 ? 1 : -1;
    else if (y !== y2) y += y < y2 ? 1 : -1;
  }
  carveCorridorBrush(scene, map, x2, y2, radius, true);
}

function placeCuratedStoneDeposit(scene, map, cx, cy) {
  const spots = [
    { x: cx, y: cy }, { x: cx + 1, y: cy }, { x: cx, y: cy + 1 },
    { x: cx - 1, y: cy }, { x: cx, y: cy - 1 }
  ];
  for (const spot of spots) {
    if (!isInsideMap(scene, spot.x, spot.y, 1)) continue;
    const tile = map[spot.y]?.[spot.x];
    if (!tile || tile.type === 'exitUp' || tile.type === 'exitDown') continue;
    map[spot.y][spot.x] = makeTile('stone', { roomId: findCuratedLevel1RoomId(map.rooms || [], spot.x, spot.y) });
  }
}

function addCuratedSporeWallDecor(scene, map) {
  const wallChoices = ['hangingMoss', 'sporeVines', 'wallMushrooms'];
  for (let y = 2; y < scene.mapHeight - 2; y++) {
    for (let x = 2; x < scene.mapWidth - 2; x++) {
      const tile = map[y]?.[x];
      if (!tile || tile.type !== 'caveWall') continue;
      const nearFloor = map[y + 1]?.[x]?.type === 'floor' || map[y]?.[x + 1]?.type === 'floor' || map[y]?.[x - 1]?.type === 'floor';
      if (!nearFloor) continue;
      const h = roomNoise(x, y, 31337);
      if (h > 0.24) tile.wallDecor = wallChoices[Math.floor(Math.abs(h * 1000)) % wallChoices.length];
    }
  }
}

function generateMineRooms(scene, biome, level) {
  const rooms = [];
  const themes = ROOM_THEME_BY_BIOME[biome.id] || ['quietChamber'];
  const entrance = makeRoom(0, 'entrance', 'entryChamber', 4, 4, 8, 6);
  const exit = makeRoom(1, 'exit', 'descentChamber', scene.mapWidth - 12, scene.mapHeight - 8, 8, 6);
  rooms.push(entrance);

  const roomCount = Phaser.Math.Clamp(8 + Math.floor(level / 5) + Phaser.Math.Between(0, 2), 8, 11);
  let attempts = 0;
  let id = 2;
  while (rooms.length < roomCount - 1 && attempts < 900) {
    attempts++;
    const w = Phaser.Math.Between(5, 9);
    const h = Phaser.Math.Between(4, 7);
    const x = Phaser.Math.Between(3, scene.mapWidth - w - 3);
    const y = Phaser.Math.Between(3, scene.mapHeight - h - 3);
    const type = Phaser.Utils.Array.GetRandom(themes);
    const room = makeRoom(id, 'standard', type, x, y, w, h);
    const padding = attempts < 350 ? 1 : 0;
    if (rooms.some(other => roomsOverlap(room, other, padding))) continue;
    rooms.push(room);
    id++;
  }

  // If random placement failed, place compact fallback rooms in the remaining open bands.
  const fallbackSlots = [
    { x: 12, y: 4 }, { x: 22, y: 4 }, { x: 31, y: 5 },
    { x: 8, y: 12 }, { x: 19, y: 13 }, { x: 30, y: 13 },
    { x: 14, y: 17 }, { x: 25, y: 17 }
  ];
  for (const slot of fallbackSlots) {
    if (rooms.length >= roomCount - 1) break;
    const room = makeRoom(id, 'standard', Phaser.Utils.Array.GetRandom(themes), slot.x, slot.y, 6, 5);
    if (rooms.some(other => roomsOverlap(room, other, 0))) continue;
    rooms.push(room);
    id++;
  }

  // Keep the descent room last so the primary path has a clear start -> finish.
  rooms.push(exit);
  return orderRoomsIntoPath(rooms);
}

function makeRoom(id, role, type, x, y, w, h) {
  return {
    id,
    role,
    type,
    x,
    y,
    w,
    h,
    cx: Math.floor(x + w / 2),
    cy: Math.floor(y + h / 2),
    organicSeed: Phaser.Math.Between(0, 99999)
  };
}

function roomsOverlap(a, b, padding = 0) {
  return !(
    a.x + a.w + padding < b.x ||
    b.x + b.w + padding < a.x ||
    a.y + a.h + padding < b.y ||
    b.y + b.h + padding < a.y
  );
}

function orderRoomsIntoPath(rooms) {
  const entrance = rooms.find(room => room.role === 'entrance');
  const exit = rooms.find(room => room.role === 'exit');
  const middle = rooms.filter(room => room.role === 'standard');
  middle.sort((a, b) => (a.cx + a.cy * 0.35) - (b.cx + b.cy * 0.35));
  return [entrance, ...middle, exit].filter(Boolean);
}

function carveRoomIntoMap(scene, map, room) {
  const rx = Math.max(2.5, room.w / 2);
  const ry = Math.max(2.2, room.h / 2);
  const centerX = room.cx;
  const centerY = room.cy;

  for (let y = room.y - 1; y <= room.y + room.h; y++) {
    for (let x = room.x - 1; x <= room.x + room.w; x++) {
      if (!isInsideMap(scene, x, y, 1)) continue;
      const nx = (x - centerX) / rx;
      const ny = (y - centerY) / ry;
      const n = roomNoise(x, y, room.organicSeed);
      const shape = nx * nx + ny * ny;
      if (shape <= 1.0 + n * 0.32) {
        map[y][x] = makeTile('floor', { roomId: room.id, roomType: room.type });
      }
    }
  }
}

function connectRoomsInMap(scene, map, rooms) {
  for (let i = 0; i < rooms.length - 1; i++) {
    carveCorridor(scene, map, rooms[i], rooms[i + 1]);
    map.connections.push({ from: rooms[i].id, to: rooms[i + 1].id, mainPath: true });
  }
}

function addOptionalRoomConnections(scene, map, rooms, level) {
  const extraConnections = Phaser.Math.Between(1, 3);
  for (let i = 0; i < extraConnections; i++) {
    const a = Phaser.Utils.Array.GetRandom(rooms.slice(0, -1));
    const candidates = rooms.filter(room => room.id !== a.id && Math.abs(room.id - a.id) > 1);
    if (!candidates.length) continue;
    candidates.sort((r1, r2) => roomDistance(a, r1) - roomDistance(a, r2));
    const b = candidates[0];
    carveCorridor(scene, map, a, b, true);
    map.connections.push({ from: a.id, to: b.id, mainPath: false });
  }
}

function carveCorridor(scene, map, a, b, branch = false) {
  let x = a.cx;
  let y = a.cy;
  const width = branch ? 1 : 2;
  const bendFirst = Phaser.Math.Between(0, 1) === 0;
  const path = [];

  function stepTowardX() {
    if (x !== b.cx) x += x < b.cx ? 1 : -1;
  }
  function stepTowardY() {
    if (y !== b.cy) y += y < b.cy ? 1 : -1;
  }

  while (x !== b.cx || y !== b.cy) {
    path.push({ x, y });
    const shouldStepX = x !== b.cx && (y === b.cy || (bendFirst ? Math.random() < 0.72 : Math.random() < 0.35));
    if (shouldStepX) stepTowardX();
    else if (y !== b.cy) stepTowardY();
    else stepTowardX();
  }
  path.push({ x: b.cx, y: b.cy });

  for (const p of path) {
    carveCorridorBrush(scene, map, p.x, p.y, width);
    if (Phaser.Math.Between(0, 100) < 22) carveCorridorBrush(scene, map, p.x, p.y, width + 1, true);
  }
}

function carveCorridorBrush(scene, map, cx, cy, radius = 1, soft = false) {
  for (let y = cy - radius; y <= cy + radius; y++) {
    for (let x = cx - radius; x <= cx + radius; x++) {
      if (!isInsideMap(scene, x, y, 1)) continue;
      const dist = Math.abs(x - cx) + Math.abs(y - cy);
      if (dist <= radius || (soft && dist <= radius + 1 && Math.random() < 0.45)) {
        map[y][x] = makeTile('floor', { corridor: true });
      }
    }
  }
}

function tagRoomTiles(map, rooms) {
  for (const room of rooms) {
    for (let y = room.y - 1; y <= room.y + room.h; y++) {
      for (let x = room.x - 1; x <= room.x + room.w; x++) {
        const tile = map[y]?.[x];
        if (!tile || tile.type !== 'floor') continue;
        if (tile.roomId === undefined) {
          const d = Phaser.Math.Distance.Between(x, y, room.cx, room.cy);
          if (d <= Math.max(room.w, room.h) * 0.7) {
            tile.roomId = room.id;
            tile.roomType = room.type;
          }
        }
      }
    }
  }
}

function carveSafePortalPad(scene, map, cx, cy, radius = 2) {
  for (let y = cy - radius; y <= cy + radius; y++) {
    for (let x = cx - radius; x <= cx + radius; x++) {
      if (!isInsideMap(scene, x, y, 1)) continue;
      map[y][x] = makeTile('floor');
    }
  }
}

function addRoomBasedBiomeDecorations(scene, map, biome, level, rooms) {
  // Spore Grotto now uses room-level sprite set pieces from room metadata.
  // Do not place old single-tile decor there; it fights the painted art direction.
  addBiomeDecorations(scene, map, biome, level);
  if (biome && biome.id === 'sporeGrotto') {
    map.visualDecorVersion = 4;
    return;
  }

  for (const room of rooms) {
    if (room.role === 'entrance' || room.role === 'exit') continue;
    if (Phaser.Math.Between(0, 100) > 38) continue;
    const decor = getRoomLandmarkDecor(biome, room.type);
    if (!decor) continue;
    const spot = findOpenRoomSpot(map, room);
    if (!spot) continue;
    const tile = map[spot.y][spot.x];
    if (tile.type === 'floor') {
      tile.decor = decor;
      tile.poi = true;
      tile.roomId = room.id;
      map.landmarks.push({ type: decor, x: spot.x, y: spot.y, roomId: room.id, roomType: room.type });
    }
  }
}

function getRoomLandmarkDecor(biome, roomType) {
  const byType = {
    mushroomGrove: 'sporeGarden',
    sporePit: 'glowPool',
    rootCavern: 'sporePods',
    fungalNest: 'fungusPatch',
    floodedGrotto: 'glowPool',
    boneYard: 'bonePile',
    webbedCrypt: 'webPatch',
    ribCageHall: 'ribBones',
    skullRoom: 'skull',
    iceGallery: 'iceCrystal',
    frozenLake: 'frostPatch',
    frostCrystalPocket: 'frozenStalagmite',
    crystalGarden: 'purpleCrystal',
    gemHall: 'crystalShard',
    glowPoolRoom: 'glowPool',
    emberVentRoom: 'emberVent',
    ashField: 'ashPile',
    lavaCrackHall: 'lavaCrack',
    machineRoom: 'coreMachine',
    runeHall: 'runePanel',
    coreConduit: 'blueCore'
  };
  return byType[roomType] || Phaser.Utils.Array.GetRandom(biome.floorDecor || []);
}

function findOpenRoomSpot(map, room) {
  const candidates = [];
  for (let y = room.y + 1; y < room.y + room.h - 1; y++) {
    for (let x = room.x + 1; x < room.x + room.w - 1; x++) {
      const tile = map[y]?.[x];
      if (!tile || tile.type !== 'floor' || tile.decor || tile.poi) continue;
      if (Phaser.Math.Distance.Between(x, y, room.cx, room.cy) < 1.5) continue;
      candidates.push({ x, y });
    }
  }
  return candidates.length ? Phaser.Utils.Array.GetRandom(candidates) : null;
}

function roomDistance(a, b) {
  return Phaser.Math.Distance.Between(a.cx, a.cy, b.cx, b.cy);
}

function isInsideMap(scene, x, y, margin = 0) {
  return x >= margin && y >= margin && x < scene.mapWidth - margin && y < scene.mapHeight - margin;
}

function roomNoise(x, y, seed) {
  let n = (x * 73856093) ^ (y * 19349663) ^ (seed * 83492791);
  n = (n << 13) ^ n;
  return 1 - Math.abs(((n * (n * n * 15731 + 789221) + 1376312589) & 0x7fffffff) / 1073741824 - 1);
}
