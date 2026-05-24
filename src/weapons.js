function getWeaponStats(item) {
  if (!item) return null;
  const def = getItemDef(item.id);
  if (!def || def.category !== 'weapons') return null;
  return def;
}

function getSelectedWeapon(scene) {
  const item = scene.hotbarItems?.[scene.selectedHotbarIndex || 0];
  return getWeaponStats(item);
}

function isPickaxeItem(item) {
  return !!item && item.id === 'pickaxe';
}

function isSwordItem(item) {
  return !!getWeaponStats(item);
}

function getSelectedHotbarItem(scene) {
  return scene.hotbarItems?.[scene.selectedHotbarIndex || 0] || null;
}

function useSelectedHotbarItem(scene, time) {
  const item = getSelectedHotbarItem(scene);

  if (isPickaxeItem(item)) {
    mineTargetTile(scene);
    return;
  }

  if (isSwordItem(item)) {
    playerAttack(scene, time);
    return;
  }

  if (item && (item.id === 'furnace' || item.id === 'craftingTable')) {
    setMessage(scene, 'Press P to place the selected ' + getItemName(item.id) + ' at home.');
    return;
  }

  if (item && item.id === 'teleportStone') {
    setMessage(scene, 'Press T to use the Teleport Stone.');
    return;
  }

  setMessage(scene, 'Select a pickaxe to mine or a sword to attack.');
}

function getPlayerAttackStats(scene) {
  const weapon = getSelectedWeapon(scene);
  if (!weapon) return null;

  return {
    name: weapon.name,
    damage: weapon.damage,
    speed: weapon.speed,
    effects: weapon.effects || []
  };
}

function getPickaxeDefByTier(tier) {
  return Object.values(ITEMS).find(item => item.toolType === 'pickaxe' && item.tier === tier) || null;
}

function getPickaxeDurabilityMax(tier) {
  return getPickaxeDefByTier(tier)?.durabilityMax || 0;
}

function getPickaxeMiningDamage(scene) {
  if ((scene.pickaxeTier || 0) <= 0 || (scene.pickaxeDurability || 0) <= 0) return 0.25;
  return getPickaxeDefByTier(scene.pickaxeTier)?.miningDamage || Math.max(1, scene.pickaxeDamage || 1);
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
  return createItemInstance(id);
}

function getWeaponDurabilityMax(id) {
  return getItemDef(id)?.durabilityMax || 0;
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
