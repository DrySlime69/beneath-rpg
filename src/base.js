function useTeleportStone(scene) {
  if (scene.currentMapName === 'mine') {
    scene.mineReturnPosition = {
      x: scene.player.x,
      y: scene.player.y
    };

    switchToHome(scene);

    scene.player.x = scene.homePosition.x;
    scene.player.y = scene.homePosition.y;

    setMessage(scene, 'Teleported home.');
  } else {
    switchToMine(scene);

    scene.player.x = scene.mineReturnPosition.x;
    scene.player.y = scene.mineReturnPosition.y;

    setMessage(scene, 'Returned to the mine.');
  }

  redraw(scene);
}

function placeFurnace(scene) {
  const furnaceSlot = scene.hotbarItems.findIndex(item => {
    return item && item.id === 'furnace';
  });

  if (scene.currentMapName !== 'home') {
    setMessage(scene, 'Furnace can only be placed at home.');
    return;
  }

  if (!scene.hasFurnace || furnaceSlot === -1) {
    setMessage(scene, 'Move Furnace to hotbar first.');
    return;
  }

  const px = scene.player.x + scene.lastMoveDirection.x;
  const py = scene.player.y + scene.lastMoveDirection.y;

  const tile = scene.map[py]
    ? scene.map[py][px]
    : null;

  if (!tile || tile.type !== 'homeFloor') {
    setMessage(scene, 'Furnace can only be placed on home floor.');
    return;
  }

  scene.map[py][px] = {
    type: 'furnace',
    hardness: 999
  };

  scene.hotbarItems[furnaceSlot] = null;
  scene.hasFurnace = false;

  setMessage(scene, 'Placed Furnace.');
  updateInventoryUI(scene);
  redraw(scene);
}

function toggleCraftingMenu(scene) {
  if (scene.craftingOpen) {
    closeCraftingMenu(scene);
    return;
  }

  const tx = scene.player.x + scene.lastMoveDirection.x;
  const ty = scene.player.y + scene.lastMoveDirection.y;

  const tile = scene.map[ty]
    ? scene.map[ty][tx]
    : null;

  if (!tile || tile.type !== 'furnace') {
    setMessage(scene, 'Face the furnace to craft.');
    return;
  }

  if (!scene.craftingScreen) {
    scene.craftingScreen = document.getElementById('craftingScreen');
  }

  if (!scene.craftingScreen) {
    setMessage(scene, 'Crafting menu is missing from index.html.');
    return;
  }

  scene.craftingOpen = true;
  scene.craftingScreen.style.display = 'flex';
}

function closeCraftingMenu(scene) {
  scene.craftingOpen = false;

  if (scene.craftingScreen) {
    scene.craftingScreen.style.display = 'none';
  }
}

function craftCopperBars(scene) {
  if (scene.inventory.copperOre < 5) {
    setMessage(scene, 'Need 5 Copper Ore.');
    return;
  }

  if (scene.inventory.coal < 2) {
    setMessage(scene, 'Need 2 Coal.');
    return;
  }

  scene.inventory.copperOre -= 5;
  scene.inventory.coal -= 2;
  scene.inventory.copperBars += 5;

  setMessage(scene, 'Crafted 5 Copper Bars.');
  updateInventoryUI(scene);
}
