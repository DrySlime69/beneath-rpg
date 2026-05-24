const WEAPONS = {
  stoneSword: {
    id: 'stoneSword',
    name: 'Stone Sword',
    type: 'sword',
    damage: 3,
    speed: 1.0,
    effects: [],
    durabilityMax: 80
  },
  copperSword: {
    id: 'copperSword',
    name: 'Copper Sword',
    type: 'sword',
    damage: 5,
    speed: 1.0,
    effects: [],
    durabilityMax: 120
  }
};

function getWeaponStats(item) {
  if (!item || !WEAPONS[item.id]) return null;
  return WEAPONS[item.id];
}

function getSelectedWeapon(scene) {
  const item = scene.hotbarItems?.[scene.selectedHotbarIndex || 0];
  return getWeaponStats(item);
}

function getPlayerAttackStats(scene) {
  const weapon = getSelectedWeapon(scene);
  if (weapon) {
    return {
      name: weapon.name,
      damage: weapon.damage,
      speed: weapon.speed,
      effects: weapon.effects || []
    };
  }

  return {
    name: 'Pickaxe',
    damage: Math.max(1, scene.pickaxeDamage || 1),
    speed: 0.85,
    effects: []
  };
}


const PICKAXE_DURABILITY = {
  0: 0,
  1: 70,
  2: 120,
  3: 180
};

function getPickaxeDurabilityMax(tier) {
  return PICKAXE_DURABILITY[tier || 0] || 0;
}

function getPickaxeMiningDamage(scene) {
  if ((scene.pickaxeTier || 0) <= 0 || (scene.pickaxeDurability || 0) <= 0) return 0.25;
  return Math.max(1, scene.pickaxeDamage || 1);
}

function damagePickaxeDurability(scene, amount = 1) {
  if ((scene.pickaxeTier || 0) <= 0) return;
  scene.pickaxeDurability = Math.max(0, (scene.pickaxeDurability ?? getPickaxeDurabilityMax(scene.pickaxeTier)) - amount);
  if (scene.pickaxeDurability <= 0) {
    scene.pickaxeTier = 0;
    scene.pickaxeDamage = 0;
    scene.pickaxeDurabilityMax = 0;
    setMessage(scene, 'Your pickaxe broke. You can still mine stone by hand, but it is much slower.');
  }
}

function createWeaponItem(id) {
  const stats = WEAPONS[id];
  if (!stats) return { id };
  return { id, durability: stats.durabilityMax, durabilityMax: stats.durabilityMax };
}

function getWeaponDurabilityMax(id) {
  return WEAPONS[id]?.durabilityMax || 0;
}

function damageSelectedWeaponDurability(scene, amount = 1) {
  const index = scene.selectedHotbarIndex || 0;
  const item = scene.hotbarItems?.[index];
  const stats = getWeaponStats(item);
  if (!stats) return;
  item.durabilityMax = item.durabilityMax || stats.durabilityMax;
  item.durability = Math.max(0, (item.durability ?? stats.durabilityMax) - amount);
  if (item.durability <= 0) {
    scene.hotbarItems[index] = null;
    setMessage(scene, stats.name + ' broke.');
  }
}
