function setMessage(scene, text) {
  scene.messageBox.textContent = text;
}

function updateInventoryUI(scene) {
  for (let i = 0; i < scene.hotbarDisplaySlots.length; i++) {
    scene.hotbarDisplaySlots[i].textContent = getItemLabel(scene, scene.hotbarItems[i]);
  }

  const hotbarSlots = Array.from(scene.hotbarGrid.children);
  const backpackSlots = Array.from(scene.backpackGrid.children);

  for (let i = 0; i < hotbarSlots.length; i++) {
    hotbarSlots[i].textContent = getItemLabel(scene, scene.hotbarItems[i]);
  }

  for (let i = 0; i < backpackSlots.length; i++) {
    backpackSlots[i].textContent = getItemLabel(scene, scene.backpackItems[i]);
  }
}

function getItemLabel(scene, item) {
  if (!item) return '';

  if (item.id === 'pickaxe') {
    const name = scene.pickaxeTier === 1 ? 'Rusty\nPickaxe' : 'Stone\nPickaxe';
    return name + '\nDMG ' + scene.pickaxeDamage;
  }

  if (item.id === 'teleportStone') return 'Teleport\nStone';
  if (item.id === 'stone') return 'Stone\n' + scene.inventory.stone;
  if (item.id === 'coal') return 'Coal\n' + scene.inventory.coal;
  if (item.id === 'copperOre') return 'Copper\nOre\n' + scene.inventory.copperOre;
  if (item.id === 'copperBars') return 'Copper\nBars\n' + scene.inventory.copperBars;
  if (item.id === 'furnace') return scene.hasFurnace ? 'Furnace\nBuilt' : 'Furnace\nNone';

  return '';
}
