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
  const def = getItemDef(item?.id);
  return !!def && def.toolType === 'pickaxe';
}

function getSelectedPickaxeItem(scene) {
  const item = getSelectedHotbarItem(scene);
  return isPickaxeItem(item) ? item : null;
}

function getSelectedPickaxeDef(scene) {
  const item = getSelectedPickaxeItem(scene);
  return item ? getItemDef(item.id) : null;
}

function isSwordItem(item) {
  return !!getWeaponStats(item);
}

function getSelectedHotbarItem(scene) {
  return scene.hotbarItems?.[scene.selectedHotbarIndex || 0] || null;
}

function useSelectedHotbarItem(scene, time) {
  const item = getSelectedHotbarItem(scene);

  // Empty selected hotbar slot = hands. Hands are not an inventory item;
  // they are only a fallback action so the player can recover from having
  // no pickaxe by slowly mining stone and wood.
  if (!item) {
    mineTargetTile(scene);
    return;
  }

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

  setMessage(scene, 'Select a usable item. Empty hotbar slots use Hands for stone and wood.');
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
  const item = getSelectedPickaxeItem(scene);
  const def = item ? getItemDef(item.id) : null;

  // Hands mining: empty selected hotbar slot. 0.25 damage means stone/wood
  // take 4x as many hits compared with a 1-damage starter pickaxe.
  if (!item || !def) return 0.25;

  if ((item.durability ?? def.durabilityMax) <= 0) return 0;
  return def.miningDamage || 1;
}

function getSelectedPickaxeTier(scene) {
  const item = getSelectedPickaxeItem(scene);
  const def = item ? getItemDef(item.id) : null;
  if (!def) return 0;
  if ((item.durability ?? def.durabilityMax) <= 0) return 0;
  return def.tier || 0;
}

function getSelectedPickaxeDelay(scene) {
  const item = getSelectedPickaxeItem(scene);
  const def = item ? getItemDef(item.id) : null;
  if (!item || !def) return 650; // hands
  if ((item.durability ?? def.durabilityMax) <= 0) return 650;
  if ((def.tier || 0) <= 1) return 450;
  if ((def.tier || 0) === 2) return 350;
  return 260;
}

function damagePickaxeDurability(scene, amount = 1) {
  const index = scene.selectedHotbarIndex || 0;
  const item = scene.hotbarItems?.[index];
  const def = item ? getItemDef(item.id) : null;
  if (!item || !def || def.toolType !== 'pickaxe') return;
  item.durabilityMax = item.durabilityMax || def.durabilityMax;
  item.durability = Math.max(0, (item.durability ?? def.durabilityMax) - amount);
  if (item.durability <= 0) {
    scene.hotbarItems[index] = null;
    if (scene.selectedInventoryItem && scene.selectedInventoryItem.area === 'hotbar' && scene.selectedInventoryItem.index === index) {
      scene.selectedInventoryItem = null;
    }
    setMessage(scene, def.name + ' broke. Empty hotbar slots use Hands to mine stone and wood slowly.');
    updateInventoryUI(scene);
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
