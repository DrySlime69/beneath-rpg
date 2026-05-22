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

  scene.craftingOpen = true;
  scene.craftingScreen.style.display = 'flex';

  updateFurnaceMenu(scene);
}

function closeCraftingMenu(scene) {
  scene.craftingOpen = false;

  if (scene.craftingScreen) {
    scene.craftingScreen.style.display = 'none';
  }
}

function craftCopperBars(scene) {
  if (scene.furnaceQueue.length > 0) {
    setMessage(scene, 'Furnace is already working.');
    return;
  }

  if (scene.inventory.copperOre < 5) {
    setMessage(scene, 'Need 5 Copper Ore.');
    return;
  }

  if (scene.inventory.coal < 1) {
    setMessage(scene, 'Need 1 Coal.');
    return;
  }

  scene.inventory.copperOre -= 5;
  scene.inventory.coal -= 1;

  scene.furnaceQueue.push({
    item: 'Copper Bar',
    amount: 1,
    totalTime: 5000,
    elapsed: 0
  });

  setMessage(scene, 'Started crafting Copper Bar.');
  updateInventoryUI(scene);
  updateFurnaceMenu(scene);
}

function updateFurnaceQueue(scene, delta) {
  if (!scene.furnaceQueue || scene.furnaceQueue.length === 0) return;

  const job = scene.furnaceQueue[0];

  job.elapsed += delta;

  if (job.elapsed >= job.totalTime) {
    scene.inventory.copperBars += job.amount;
    scene.furnaceQueue.shift();

    setMessage(scene, 'Finished 1 Copper Bar.');
    updateInventoryUI(scene);
  }

  updateFurnaceMenu(scene);
}

function updateFurnaceMenu(scene) {
  const queueItem = document.getElementById('furnaceQueueItem');
  const progressBar = document.getElementById('furnaceProgressInner');

  if (!queueItem || !progressBar) return;

  if (!scene.furnaceQueue || scene.furnaceQueue.length === 0) {
    queueItem.textContent = 'Empty';
    progressBar.style.width = '0%';
    return;
  }

  const job = scene.furnaceQueue[0];
  const progress = Math.min(job.elapsed / job.totalTime, 1);

  queueItem.textContent = `${job.item} x${job.amount}`;
  progressBar.style.width = `${progress * 100}%`;
}
