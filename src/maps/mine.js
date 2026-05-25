// Mine reboot: authored/object-built mine maps only.
// Old procedural rooms/corridors are gone. The mine is now built like a Zelda/RPG cave:
// a painted cavern background + object placement + simple collision + authored ore deposits.

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

function fillAuthoredOpenFloor(scene, map) {
  for (let y = 0; y < scene.mapHeight; y++) {
    for (let x = 0; x < scene.mapWidth; x++) map[y][x] = makeTile('floor');
  }
}

function addBlockerRect(scene, map, x, y, w, h) {
  for (let yy = y; yy < y + h; yy++) {
    for (let xx = x; xx < x + w; xx++) {
      if (isInsideMap(scene, xx, yy, 0)) map[yy][xx] = makeTile('caveWall');
    }
  }
}

function addNaturalBoundaryCollision(scene, map) {
  // Invisible collision that follows the painted cave edges enough to keep the player in the open cavern.
  for (let x = 0; x < scene.mapWidth; x++) {
    for (let y = 0; y < scene.mapHeight; y++) {
      const top = y < 3;
      const bottom = y > scene.mapHeight - 2;
      const left = x < 2;
      const right = x > scene.mapWidth - 3;
      if (top || bottom || left || right) map[y][x] = makeTile('caveWall');
    }
  }

  // Rounded wall massing. These are not visible tiles; the background supplies the art.
  [
    { x: 2, y: 3, w: 4, h: 3 }, { x: 8, y: 3, w: 4, h: 2 }, { x: 15, y: 3, w: 5, h: 2 },
    { x: 24, y: 3, w: 5, h: 2 }, { x: 34, y: 3, w: 7, h: 3 },
    { x: 2, y: 18, w: 4, h: 3 }, { x: 39, y: 18, w: 3, h: 3 }
  ].forEach(b => addBlockerRect(scene, map, b.x, b.y, b.w, b.h));
}

function carveSafePad(scene, map, cx, cy, radius = 1) {
  for (let y = cy - radius; y <= cy + radius; y++) {
    for (let x = cx - radius; x <= cx + radius; x++) {
      if (isInsideMap(scene, x, y, 1)) map[y][x] = makeTile('floor');
    }
  }
}

function addDecor(scene, map, x, y, decor, poi = false) {
  if (!isInsideMap(scene, x, y, 1)) return;
  if (map[y][x].type !== 'floor') return;
  map[y][x].decor = decor;
  map[y][x].poi = !!poi;
}

function addWallDecor(scene, map, x, y, wallDecor) {
  if (!isInsideMap(scene, x, y, 1)) return;
  if (map[y][x].type !== 'floor') return;
  map[y][x].wallDecor = wallDecor;
}

function createAuthoredSporeLevel1Map(scene) {
  const biome = getBiomeForLevel(1);
  const map = createEmptyMap(scene, scene.mapWidth, scene.mapHeight);

  // Level 1 rebuild: FLOOR ONLY.
  // The visible art is a pre-rendered 32x32 repeatable Spore Grotto floor tileset
  // composed into one large open room background. No ore, no props, no mushrooms,
  // no wall decor, no room generator, no corridor generator.
  map.generationMode = 'authoredFloorOnlyTileset';
  map.generationVersion = 502;
  map.curatedLevelId = 'spore_grotto_01_floor_only_v3';
  map.staticAuthoredLevel = true;
  map.staticBackgroundKey = 'level_spore_1_bg';
  map.maxMineLevel = MINE_MAX_LEVEL;
  map.rooms = [];
  map.connections = [];
  map.landmarks = [];

  // Gameplay collision is also floor-only. The entire level is walkable for now.
  fillAuthoredOpenFloor(scene, map);

  // Spawn near center so you can judge the floor art immediately.
  map.entrySpawn = { x: Math.floor(scene.mapWidth / 2), y: Math.floor(scene.mapHeight / 2) };
  map.downSpawn = { x: Math.floor(scene.mapWidth / 2), y: Math.floor(scene.mapHeight / 2) };

  applyBiomeToMap(map, biome);
  map.visualDecorVersion = 502;
  return map;
}

function placeAuthoredStoneDeposit(scene, map, cx, cy) {
  const ore = typeof getLargeOreChunkDef === 'function' ? getLargeOreChunkDef('stone') : null;
  const spots = [
    { x: cx, y: cy, anchor: true },
    { x: cx + 1, y: cy }, { x: cx - 1, y: cy },
    { x: cx, y: cy + 1 }, { x: cx + 1, y: cy + 1 },
    { x: cx, y: cy - 1 }, { x: cx - 1, y: cy + 1 }
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
  map.generationVersion = 400;
  map.curatedLevelId = `authored_placeholder_${level}`;
  map.staticAuthoredLevel = false;
  map.maxMineLevel = MINE_MAX_LEVEL;
  map.rooms = [];
  map.connections = [];
  map.landmarks = [];

  fillAuthoredOpenFloor(scene, map);
  addNaturalBoundaryCollision(scene, map);
  addBlockerRect(scene, map, 7, 5, 3, 3);
  addBlockerRect(scene, map, 18, 14, 5, 2);
  addBlockerRect(scene, map, 31, 7, 3, 4);

  const entry = { x: 5, y: 5 };
  const down = { x: scene.mapWidth - 6, y: scene.mapHeight - 6 };
  carveSafePad(scene, map, entry.x, entry.y, 1);
  carveSafePad(scene, map, down.x, down.y, 1);

  map[entry.y][entry.x] = makeTile('exitUp', { targetLevel: level - 1 });
  if (level < MINE_MAX_LEVEL) {
    const info = getMineLevelInfo(level);
    map[down.y][down.x] = makeTile('exitDown', {
      targetLevel: level + 1,
      requiredPickaxeTier: info.nextRequiredPickaxeTier
    });
  }

  [{ x: 13, y: 9 }, { x: 24, y: 17 }, { x: 34, y: 12 }].forEach(p => placeAuthoredStoneDeposit(scene, map, p.x, p.y));

  map.entrySpawn = { x: entry.x + 2, y: entry.y + 2 };
  map.downSpawn = { x: down.x, y: down.y };

  applyBiomeToMap(map, biome);
  map.visualDecorVersion = 400;
  return map;
}
