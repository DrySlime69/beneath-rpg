
// Mine reboot: authored/static mine maps only.
// This file intentionally replaces the old procedural blob/room mine generation.
// Keep player, inventory, combat, crafting, save, UI, and base systems intact.

const MINE_MAX_LEVEL = 60;
const FIRST_LOCKED_MINE_LEVEL = 6;
const STARTING_UNLOCKED_MINE_LEVELS = 5;

function createMineMap(scene, level = 1) {
  const clampedLevel = Phaser.Math.Clamp(level || 1, 1, MINE_MAX_LEVEL);
  if (clampedLevel === 1) return createAuthoredSporeLevel1Map(scene);
  return createPlaceholderAuthoredMineMap(scene, clampedLevel);
}

function getMineLevelInfo(level) {
  return {
    level,
    isUnlockedAtStart: level <= STARTING_UNLOCKED_MINE_LEVELS,
    nextRequiredPickaxeTier: level + 1 === FIRST_LOCKED_MINE_LEVEL ? 3 : 1
  };
}

function isInsideMap(scene, x, y, margin = 0) {
  return x >= margin && y >= margin && x < scene.mapWidth - margin && y < scene.mapHeight - margin;
}

function carveSafePortalPad(scene, map, cx, cy, radius = 1) {
  for (let y = cy - radius; y <= cy + radius; y++) {
    for (let x = cx - radius; x <= cx + radius; x++) {
      if (!isInsideMap(scene, x, y, 1)) continue;
      map[y][x] = makeTile('floor');
    }
  }
}

function fillOpenAuthoredCollisionMap(scene, map) {
  for (let y = 0; y < scene.mapHeight; y++) {
    for (let x = 0; x < scene.mapWidth; x++) {
      const border = x <= 1 || y <= 1 || x >= scene.mapWidth - 2 || y >= scene.mapHeight - 2;
      map[y][x] = makeTile(border ? 'caveWall' : 'floor');
    }
  }
}

function addBlockerRect(scene, map, x, y, w, h) {
  for (let yy = y; yy < y + h; yy++) {
    for (let xx = x; xx < x + w; xx++) {
      if (isInsideMap(scene, xx, yy, 1)) map[yy][xx] = makeTile('caveWall');
    }
  }
}

function createAuthoredSporeLevel1Map(scene) {
  const biome = getBiomeForLevel(1);
  const map = createEmptyMap(scene, scene.mapWidth, scene.mapHeight);

  map.generationMode = 'authoredStaticLevel';
  map.generationVersion = 300;
  map.curatedLevelId = 'spore_grotto_01_reboot';
  map.staticAuthoredLevel = true;
  map.staticBackgroundKey = 'level_spore_1_bg';
  map.maxMineLevel = MINE_MAX_LEVEL;
  map.rooms = [];
  map.connections = [];
  map.landmarks = [];

  // The background image is now the cave art. This grid is collision/gameplay only.
  fillOpenAuthoredCollisionMap(scene, map);

  // Keep the level open. These invisible blockers should match major art masses only.
  [
    { x: 36, y: 3, w: 4, h: 3 },
    { x: 3, y: 4, w: 3, h: 3 },
    { x: 29, y: 19, w: 3, h: 2 },
    { x: 7, y: 5, w: 2, h: 2 },
    { x: 24, y: 4, w: 2, h: 2 },
    { x: 38, y: 8, w: 2, h: 2 }
  ].forEach(b => addBlockerRect(scene, map, b.x, b.y, b.w, b.h));

  const entry = { x: 4, y: 5 };
  const down = { x: 37, y: 5 };
  carveSafePortalPad(scene, map, entry.x, entry.y, 1);
  carveSafePortalPad(scene, map, down.x, down.y, 1);

  map[entry.y][entry.x] = makeTile('exitUp', { targetLevel: 0 });
  map[down.y][down.x] = makeTile('exitDown', { targetLevel: 2, requiredPickaxeTier: 1 });

  // Level 1 has stone only. No coal, copper, wood pockets, or procedural resource pass.
  [
    { x: 13, y: 17 },
    { x: 22, y: 10 },
    { x: 31, y: 16 },
    { x: 9, y: 12 },
    { x: 35, y: 20 }
  ].forEach(p => placeAuthoredStoneDeposit(scene, map, p.x, p.y));

  map.entrySpawn = { x: 8, y: 12 };
  map.downSpawn = { x: down.x, y: down.y };
  map.landmarks.push(
    { type: 'authoredSporeIntro', x: 8, y: 12 },
    { type: 'stoneDeposit', x: 13, y: 17 },
    { type: 'stoneDeposit', x: 22, y: 10 },
    { type: 'stoneDeposit', x: 31, y: 16 },
    { type: 'stoneDeposit', x: 9, y: 12 },
    { type: 'stoneDeposit', x: 35, y: 20 }
  );

  applyBiomeToMap(map, biome);
  map.visualDecorVersion = 300;
  return map;
}

function placeAuthoredStoneDeposit(scene, map, cx, cy) {
  const ore = typeof getLargeOreChunkDef === 'function' ? getLargeOreChunkDef('stone') : null;
  const spots = [
    { x: cx, y: cy, anchor: true },
    { x: cx + 1, y: cy },
    { x: cx - 1, y: cy },
    { x: cx, y: cy + 1 },
    { x: cx + 1, y: cy + 1 },
    { x: cx, y: cy - 1 }
  ];

  for (const p of spots) {
    if (!isInsideMap(scene, p.x, p.y, 1)) continue;
    const t = map[p.y]?.[p.x];
    if (!t || t.type === 'exitUp' || t.type === 'exitDown') continue;
    map[p.y][p.x] = makeTile('largeOreChunk', {
      oreId: 'stone',
      hardness: ore?.hardness || 1,
      hp: ore?.hp || 12,
      maxHp: ore?.hp || 12,
      biome: 'sporeGrotto',
      chunkAnchor: !!p.anchor
    });
  }
}

function createPlaceholderAuthoredMineMap(scene, level) {
  const biome = getBiomeForLevel(level);
  const map = createEmptyMap(scene, scene.mapWidth, scene.mapHeight);

  map.generationMode = 'authoredPlaceholder';
  map.generationVersion = 300;
  map.curatedLevelId = `authored_placeholder_${level}`;
  map.staticAuthoredLevel = false;
  map.maxMineLevel = MINE_MAX_LEVEL;
  map.rooms = [];
  map.connections = [];
  map.landmarks = [];

  fillOpenAuthoredCollisionMap(scene, map);

  // Simple non-procedural test layout so deeper portals still work while we author levels one by one.
  addBlockerRect(scene, map, 7, 5, 3, 3);
  addBlockerRect(scene, map, 18, 14, 5, 2);
  addBlockerRect(scene, map, 31, 7, 3, 4);

  const entry = { x: 5, y: 5 };
  const down = { x: scene.mapWidth - 6, y: scene.mapHeight - 6 };
  carveSafePortalPad(scene, map, entry.x, entry.y, 1);
  carveSafePortalPad(scene, map, down.x, down.y, 1);

  map[entry.y][entry.x] = makeTile('exitUp', { targetLevel: level - 1 });
  if (level < MINE_MAX_LEVEL) {
    const info = getMineLevelInfo(level);
    map[down.y][down.x] = makeTile('exitDown', {
      targetLevel: level + 1,
      requiredPickaxeTier: info.nextRequiredPickaxeTier
    });
  }

  // Placeholder levels also avoid the old resource generator. Stone only for now.
  [
    { x: 13, y: 9 },
    { x: 24, y: 17 },
    { x: 34, y: 12 }
  ].forEach(p => placeAuthoredStoneDeposit(scene, map, p.x, p.y));

  map.entrySpawn = { x: entry.x + 2, y: entry.y + 2 };
  map.downSpawn = { x: down.x, y: down.y };

  applyBiomeToMap(map, biome);
  map.visualDecorVersion = 300;
  return map;
}
