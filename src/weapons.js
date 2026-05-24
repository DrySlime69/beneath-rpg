const WEAPONS = {
  stoneSword: {
    id: 'stoneSword',
    name: 'Stone Sword',
    type: 'sword',
    damage: 3,
    speed: 1.0,
    effects: []
  },
  copperSword: {
    id: 'copperSword',
    name: 'Copper Sword',
    type: 'sword',
    damage: 5,
    speed: 1.0,
    effects: []
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
