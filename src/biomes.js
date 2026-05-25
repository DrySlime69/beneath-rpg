const ORE_CHUNKS = {
  stone: { id: 'stone', name: 'Stone', inventoryKey: 'stone', yieldAmount: 18, hardness: 1, hp: 12, color: 0x8f8f8f, edge: 0xd5d5d5, glow: 0x000000, requiredTier: 0 },
  copperOre: { id: 'copperOre', name: 'Copper Ore', inventoryKey: 'copperOre', yieldAmount: 18, hardness: 2, hp: 20, color: 0xc06c35, edge: 0xffb06a, glow: 0xff8a3a, requiredTier: 2 },
  ironOre: { id: 'ironOre', name: 'Iron Ore', inventoryKey: 'ironOre', yieldAmount: 18, hardness: 3, hp: 24, color: 0x8ba4c8, edge: 0xd8ecff, glow: 0x82b8ff, requiredTier: 3 },
  obsidianOre: { id: 'obsidianOre', name: 'Obsidian Ore', inventoryKey: 'obsidianOre', yieldAmount: 14, hardness: 3, hp: 28, color: 0x5b2aa0, edge: 0xc086ff, glow: 0xa04cff, requiredTier: 3 },
  goldOre: { id: 'goldOre', name: 'Gold Ore', inventoryKey: 'goldOre', yieldAmount: 14, hardness: 3, hp: 26, color: 0xd89620, edge: 0xffe07a, glow: 0xffc23a, requiredTier: 3 },
  ebonyOre: { id: 'ebonyOre', name: 'Ebony Ore', inventoryKey: 'ebonyOre', yieldAmount: 10, hardness: 4, hp: 34, color: 0x22162f, edge: 0xff4fd8, glow: 0xb845ff, requiredTier: 3 }
};

const BIOMES = {
  sporeGrotto: {
    id: 'sporeGrotto',
    name: 'Spore Grotto',
    levelRange: '1-10',
    minLevel: 1,
    maxLevel: 10,
    wall: { base: 0x263f31, edge: 0x9fdd74, shadow: 0x07130c, speck: 0xd4ff9b },
    floor: 0x315038,
    ambientMote: 0xd2ff91,
    darkness: 0.68,
    torch: 0xc8ff75,
    floorDecor: ['glowMushroom', 'fungusPatch', 'sporePods', 'smallBlueCrystal', 'mossClump'],
    wallDecor: ['hangingMoss', 'wallMushrooms', 'sporeVines'],
    oreChunks: ['stone', 'copperOre']
  },
  boneHollow: {
    id: 'boneHollow',
    name: 'Bone Hollow',
    levelRange: '11-20',
    minLevel: 11,
    maxLevel: 20,
    wall: { base: 0x322216, edge: 0xc79b6a, shadow: 0x100804, speck: 0xf0d8a8 },
    floor: 0x3a2a1f,
    ambientMote: 0xe6c18a,
    darkness: 0.56,
    torch: 0xffa64e,
    floorDecor: ['bonePile', 'ribBones', 'skull', 'webPatch', 'smallGreenCrystal'],
    wallDecor: ['wallSkull', 'hangingWeb', 'boneWall'],
    oreChunks: ['stone', 'copperOre', 'ironOre']
  },
  frostfangDepths: {
    id: 'frostfangDepths',
    name: 'Frostfang Depths',
    levelRange: '21-30',
    minLevel: 21,
    maxLevel: 30,
    wall: { base: 0x193149, edge: 0x8fdcff, shadow: 0x06101e, speck: 0xd0f7ff },
    floor: 0x20384a,
    ambientMote: 0xb7efff,
    darkness: 0.58,
    torch: 0x87dfff,
    floorDecor: ['iceCrystal', 'frostPatch', 'frozenStalagmite', 'snowBones', 'smallBlueCrystal'],
    wallDecor: ['icicles', 'frostVeins', 'iceWallCrack'],
    oreChunks: ['stone', 'ironOre', 'obsidianOre']
  },
  crystalDepths: {
    id: 'crystalDepths',
    name: 'Crystal Depths',
    levelRange: '31-40',
    minLevel: 31,
    maxLevel: 40,
    wall: { base: 0x201239, edge: 0xb15dff, shadow: 0x080414, speck: 0xff9dff },
    floor: 0x211833,
    ambientMote: 0xd676ff,
    darkness: 0.56,
    torch: 0xd070ff,
    floorDecor: ['purpleCrystal', 'blueCrystal', 'crystalShard', 'glowPool', 'smallBlueCrystal'],
    wallDecor: ['crystalWallGrowth', 'purpleVeins', 'gemWall'],
    oreChunks: ['ironOre', 'obsidianOre', 'goldOre']
  },
  emberCaverns: {
    id: 'emberCaverns',
    name: 'Ember Caverns',
    levelRange: '41-50',
    minLevel: 41,
    maxLevel: 50,
    wall: { base: 0x35110d, edge: 0xff5f21, shadow: 0x120201, speck: 0xffb135 },
    floor: 0x2f1710,
    ambientMote: 0xff8a2a,
    darkness: 0.56,
    torch: 0xff5a1d,
    floorDecor: ['emberCrystal', 'lavaCrack', 'ashPile', 'charredBones', 'moltenPebbles'],
    wallDecor: ['lavaDrip', 'emberVeins', 'scorchedWall'],
    oreChunks: ['obsidianOre', 'goldOre', 'ebonyOre']
  },
  ancientCore: {
    id: 'ancientCore',
    name: 'Ancient Core',
    levelRange: '51-60',
    minLevel: 51,
    maxLevel: 60,
    wall: { base: 0x142432, edge: 0x31c9ff, shadow: 0x030911, speck: 0x7df2ff },
    floor: 0x182530,
    ambientMote: 0x5be8ff,
    darkness: 0.56,
    torch: 0x24d6ff,
    floorDecor: ['corePillar', 'blueCore', 'ancientPlate', 'cableCoil', 'techRubble'],
    wallDecor: ['runePanel', 'blueConduit', 'coreWallPlate'],
    oreChunks: ['goldOre', 'ebonyOre', 'obsidianOre']
  }
};

function getBiomeForLevel(level) {
  if (level <= 10) return BIOMES.sporeGrotto;
  if (level <= 20) return BIOMES.boneHollow;
  if (level <= 30) return BIOMES.frostfangDepths;
  if (level <= 40) return BIOMES.crystalDepths;
  if (level <= 50) return BIOMES.emberCaverns;
  return BIOMES.ancientCore;
}

function getBiomeById(id) {
  return BIOMES[id] || BIOMES.sporeGrotto;
}

function getCurrentBiome(scene) {
  if (scene.currentMapName !== 'mine') return BIOMES.sporeGrotto;
  return getBiomeById(scene.currentBiomeId || scene.map?.biomeId || getBiomeForLevel(scene.mineLevel || 1).id);
}

function applyBiomeToMap(map, biome) {
  if (!map || !biome) return map;
  map.biomeId = biome.id;
  map.biomeName = biome.name;
  for (let y = 0; y < map.length; y++) {
    for (let x = 0; x < map[y].length; x++) {
      if (map[y][x]) map[y][x].biome = biome.id;
    }
  }
  return map;
}

function addBiomeDecorations(scene, map, biome, level) {
  const floorTiles = [];
  const wallTiles = [];
  for (let y = 2; y < scene.mapHeight - 2; y++) {
    for (let x = 2; x < scene.mapWidth - 2; x++) {
      const tile = map[y]?.[x];
      if (!tile) continue;
      if (tile.type === 'floor') floorTiles.push({ x, y });
      if (tile.type === 'caveWall' && touchesWalkableTile(map, x, y)) wallTiles.push({ x, y });
    }
  }

  function decorateFloor(count) {
    for (let i = 0; i < count && floorTiles.length; i++) {
      const index = Phaser.Math.Between(0, floorTiles.length - 1);
      const spot = floorTiles.splice(index, 1)[0];
      const tile = map[spot.y]?.[spot.x];
      if (!tile || tile.type !== 'floor' || tile.decor) continue;
      tile.decor = Phaser.Utils.Array.GetRandom(biome.floorDecor || ['pebbles']);
    }
  }

  function decorateWall(count) {
    for (let i = 0; i < count && wallTiles.length; i++) {
      const index = Phaser.Math.Between(0, wallTiles.length - 1);
      const spot = wallTiles.splice(index, 1)[0];
      const tile = map[spot.y]?.[spot.x];
      if (!tile || tile.type !== 'caveWall' || tile.wallDecor) continue;
      tile.wallDecor = Phaser.Utils.Array.GetRandom(biome.wallDecor || []);
    }
  }

  decorateFloor(95 + Phaser.Math.Between(0, 30));
  decorateWall(65 + Phaser.Math.Between(0, 20));
  addLargeOreChunks(scene, map, biome, level);
  addBiomePointOfInterest(scene, map, biome, level);
}

function touchesWalkableTile(map, x, y) {
  return [map[y - 1]?.[x], map[y + 1]?.[x], map[y]?.[x - 1], map[y]?.[x + 1]]
    .some(tile => tile && ['floor', 'torch', 'exitUp', 'exitDown'].includes(tile.type));
}

function addLargeOreChunks(scene, map, biome, level) {
  const chunkCount = Phaser.Math.Between(7, 11);
  for (let i = 0; i < chunkCount; i++) {
    const oreId = Phaser.Utils.Array.GetRandom(biome.oreChunks || ['stone']);
    placeLargeOreChunk(scene, map, oreId);
  }
}

function placeLargeOreChunk(scene, map, oreId) {
  const ore = ORE_CHUNKS[oreId] || ORE_CHUNKS.stone;
  for (let attempt = 0; attempt < 90; attempt++) {
    const cx = Phaser.Math.Between(5, scene.mapWidth - 7);
    const cy = Phaser.Math.Between(5, scene.mapHeight - 6);
    const points = [
      { x: cx, y: cy }, { x: cx + 1, y: cy }, { x: cx - 1, y: cy },
      { x: cx, y: cy + 1 }, { x: cx + 1, y: cy + 1 },
      ...(Math.random() > 0.45 ? [{ x: cx - 1, y: cy + 1 }] : []),
      ...(Math.random() > 0.55 ? [{ x: cx, y: cy - 1 }] : [])
    ];
    if (!points.every(p => map[p.y]?.[p.x]?.type === 'floor')) continue;
    if (points.some(p => Phaser.Math.Distance.Between(p.x, p.y, 3, 3) < 5)) continue;
    if (points.some(p => Phaser.Math.Distance.Between(p.x, p.y, scene.mapWidth - 5, scene.mapHeight - 4) < 5)) continue;
    for (const p of points) {
      map[p.y][p.x] = makeTile('largeOreChunk', {
        oreId,
        hardness: ore.hardness,
        hp: ore.hp,
        maxHp: ore.hp,
        biome: map.biomeId
      });
    }
    return true;
  }
  return false;
}

function addBiomePointOfInterest(scene, map, biome, level) {
  // Small non-interactive set piece per level; it creates visual identity without blocking paths.
  const poiByBiome = {
    sporeGrotto: 'sporeGarden', boneHollow: 'boneAltar', frostfangDepths: 'iceShrine',
    crystalDepths: 'crystalGate', emberCaverns: 'emberVent', ancientCore: 'coreMachine'
  };
  const decor = poiByBiome[biome.id];
  if (!decor) return;
  for (let attempt = 0; attempt < 80; attempt++) {
    const x = Phaser.Math.Between(7, scene.mapWidth - 9);
    const y = Phaser.Math.Between(7, scene.mapHeight - 8);
    if (map[y]?.[x]?.type !== 'floor') continue;
    if (Phaser.Math.Distance.Between(x, y, 3, 3) < 8) continue;
    if (Phaser.Math.Distance.Between(x, y, scene.mapWidth - 5, scene.mapHeight - 4) < 8) continue;
    map[y][x].decor = decor;
    map[y][x].poi = true;
    return;
  }
}


function ensureBiomeVisualDecor(scene, map, level) {
  if (!map) return;
  const biome = getBiomeById(map.biomeId) || getBiomeForLevel(level || 1);
  applyBiomeToMap(map, biome);
  if (map.visualDecorVersion >= 3) return;

  // Add an obvious biome pass to old/generated maps without destroying mined paths.
  const floorTiles = [];
  const wallTiles = [];
  for (let y = 2; y < scene.mapHeight - 2; y++) {
    for (let x = 2; x < scene.mapWidth - 2; x++) {
      const tile = map[y]?.[x];
      if (!tile) continue;
      if (tile.type === 'floor' || tile.type === 'torch') floorTiles.push({ x, y });
      if (tile.type === 'caveWall' && touchesWalkableTile(map, x, y)) wallTiles.push({ x, y });
    }
  }

  const floorTarget = Math.min(floorTiles.length, 85 + Phaser.Math.Between(0, 30));
  for (let i = 0; i < floorTarget && floorTiles.length; i++) {
    const idx = Phaser.Math.Between(0, floorTiles.length - 1);
    const spot = floorTiles.splice(idx, 1)[0];
    const tile = map[spot.y]?.[spot.x];
    if (!tile || tile.type !== 'floor' || tile.decor || tile.poi) continue;
    tile.decor = Phaser.Utils.Array.GetRandom(biome.floorDecor || ['pebbles']);
  }

  const wallTarget = Math.min(wallTiles.length, 55 + Phaser.Math.Between(0, 18));
  for (let i = 0; i < wallTarget && wallTiles.length; i++) {
    const idx = Phaser.Math.Between(0, wallTiles.length - 1);
    const spot = wallTiles.splice(idx, 1)[0];
    const tile = map[spot.y]?.[spot.x];
    if (!tile || tile.type !== 'caveWall' || tile.wallDecor) continue;
    tile.wallDecor = Phaser.Utils.Array.GetRandom(biome.wallDecor || []);
  }

  // Make sure every level has several visible set pieces and large ore clusters.
  for (let i = 0; i < 5; i++) addBiomePointOfInterest(scene, map, biome, level || 1);
  addLargeOreChunks(scene, map, biome, level || 1);
  addLargeOreChunks(scene, map, biome, level || 1);
  map.visualDecorVersion = 3;
}

function getBiomeEnemyType(level, index) {
  const biome = getBiomeForLevel(level);
  if (biome.id === 'sporeGrotto') return index % 3 === 2 ? 'sporeSlime' : 'slime';
  if (biome.id === 'boneHollow') return index % 2 === 0 ? 'bat' : 'slime';
  if (biome.id === 'frostfangDepths') return index % 2 === 0 ? 'crystalBat' : 'bat';
  if (biome.id === 'crystalDepths') return index % 2 === 0 ? 'crystalBat' : 'bat';
  if (biome.id === 'emberCaverns') return index % 2 === 0 ? 'copperDrone' : 'bat';
  return index % 2 === 0 ? 'copperDrone' : 'crystalBat';
}

function getEnemyDisplayName(type) {
  return {
    slime: 'Slime',
    bat: 'Bat',
    sporeSlime: 'Spore Slime',
    copperDrone: 'Copper Drone',
    crystalBat: 'Crystal Bat'
  }[type] || 'Enemy';
}

function getLargeOreChunkDef(id) {
  return ORE_CHUNKS[id] || ORE_CHUNKS.stone;
}
