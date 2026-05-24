
const BIOMES = {
  dirtCaves: {
    id: 'dirtCaves',
    name: 'Dirt Caves',
    levelRange: '1-2',
    wall: { base: 0x2b180d, edge: 0x7a5238, shadow: 0x0b0503, speck: 0x56321e },
    floor: 0x222222,
    ambientMote: 0xd8c59a,
    darkness: 0.08,
    torch: 0xff9b2d
  },
  mushroomCaverns: {
    id: 'mushroomCaverns',
    name: 'Mushroom Caverns',
    levelRange: '3-5',
    wall: { base: 0x1b1734, edge: 0x7654b6, shadow: 0x080512, speck: 0x9b7cff },
    floor: 0x18182f,
    ambientMote: 0xa77cff,
    darkness: 0.10,
    torch: 0x8d6cff
  },
  copperRuins: {
    id: 'copperRuins',
    name: 'Copper Ruins',
    levelRange: '6-9',
    wall: { base: 0x30180f, edge: 0xc46a37, shadow: 0x0f0603, speck: 0xff9a58 },
    floor: 0x20140f,
    ambientMote: 0xffb066,
    darkness: 0.11,
    torch: 0xff7a2b
  },
  crystalDepths: {
    id: 'crystalDepths',
    name: 'Crystal Depths',
    levelRange: '10+',
    wall: { base: 0x101d34, edge: 0x55bdf7, shadow: 0x030812, speck: 0x9be8ff },
    floor: 0x101722,
    ambientMote: 0x7de8ff,
    darkness: 0.13,
    torch: 0x55dfff
  }
};

function getBiomeForLevel(level) {
  if (level <= 2) return BIOMES.dirtCaves;
  if (level <= 5) return BIOMES.mushroomCaverns;
  if (level <= 9) return BIOMES.copperRuins;
  return BIOMES.crystalDepths;
}

function getBiomeById(id) {
  return BIOMES[id] || BIOMES.dirtCaves;
}

function getCurrentBiome(scene) {
  if (scene.currentMapName !== 'mine') return BIOMES.dirtCaves;
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
  for (let y = 2; y < scene.mapHeight - 2; y++) {
    for (let x = 2; x < scene.mapWidth - 2; x++) {
      if (map[y]?.[x]?.type === 'floor') floorTiles.push({ x, y });
    }
  }

  function decorate(count, decorType) {
    for (let i = 0; i < count && floorTiles.length; i++) {
      const index = Phaser.Math.Between(0, floorTiles.length - 1);
      const spot = floorTiles.splice(index, 1)[0];
      const tile = map[spot.y]?.[spot.x];
      if (!tile || tile.type !== 'floor' || tile.decor) continue;
      tile.decor = decorType;
    }
  }

  if (biome.id === 'mushroomCaverns') {
    decorate(26 + level * 2, 'glowMushroom');
    decorate(10 + level, 'fungusPatch');
  } else if (biome.id === 'copperRuins') {
    decorate(12 + level, 'copperScrap');
    decorate(6 + Math.floor(level / 2), 'ruinSupport');
  } else if (biome.id === 'crystalDepths') {
    decorate(22 + level, 'blueCrystal');
    decorate(8 + Math.floor(level / 2), 'crystalShard');
  } else {
    decorate(8 + level, 'pebbles');
  }
}

function getBiomeEnemyType(level, index) {
  const biome = getBiomeForLevel(level);
  if (biome.id === 'mushroomCaverns') return index % 3 === 2 ? 'bat' : 'sporeSlime';
  if (biome.id === 'copperRuins') return index % 3 === 2 ? 'copperDrone' : 'slime';
  if (biome.id === 'crystalDepths') return index % 2 === 0 ? 'crystalBat' : 'bat';
  return level >= 3 && index % 3 === 2 ? 'bat' : 'slime';
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
