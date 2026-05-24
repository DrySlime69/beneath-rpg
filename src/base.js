
function useTeleportStone(scene) {
  if (scene.currentMapName === 'mine') {
    scene.mineReturnPosition = { x: scene.player.x, y: scene.player.y, level: scene.mineLevel || 1 };
    switchToHome(scene);
    scene.player.x = scene.homePosition.x;
    scene.player.y = scene.homePosition.y;
    setMessage(scene, 'Teleported home.');
  } else {
    switchToMine(scene, scene.mineReturnPosition.level || 1);
    scene.player.x = scene.mineReturnPosition.x;
    scene.player.y = scene.mineReturnPosition.y;
    setMessage(scene, 'Returned to Mine Level ' + scene.mineLevel + '.');
  }
}


function getHomeObjectInventoryStateKey(objectType) {
  if (objectType === 'furnace') return 'hasFurnace';
  if (objectType === 'craftingTable') return 'hasCraftingTable';
  return null;
}

function getHomeObjectDisplayName(objectType) {
  if (objectType === 'furnace') return 'Furnace';
  if (objectType === 'craftingTable') return 'Workbench';
  return 'Object';
}

function isPlaceableHomeItem(item) {
  return item && (item.id === 'furnace' || item.id === 'craftingTable');
}

function getSelectedHotbarPlaceable(scene) {
  const slot = scene.selectedHotbarIndex || 0;
  const item = scene.hotbarItems[slot];
  if (isPlaceableHomeItem(item)) return { item, slot };
  return null;
}

function addItemToFirstOpenSlot(scene, item) {
  for (let i = 0; i < scene.hotbarItems.length; i++) {
    if (!scene.hotbarItems[i]) {
      scene.hotbarItems[i] = item;
      scene.selectedHotbarIndex = i;
      return { area: 'hotbar', slot: i };
    }
  }

  for (let i = 0; i < scene.backpackItems.length; i++) {
    if (!scene.backpackItems[i]) {
      scene.backpackItems[i] = item;
      return { area: 'backpack', slot: i };
    }
  }

  return null;
}

function hasPlacedHomeObject(scene, objectType) {
  if (!scene.map) return false;
  return scene.map.some(row => row.some(tile => tile && tile.type === objectType));
}

function isHomeObject(tile) {
  return tile && (tile.type === 'furnace' || tile.type === 'craftingTable');
}

function placeHeldHomeObject(scene) {
  if (scene.currentMapName !== 'home') {
    setMessage(scene, 'Placeable items can only be placed at home.');
    return;
  }

  const held = getSelectedHotbarPlaceable(scene);
  if (!held) {
    setMessage(scene, 'Select a Furnace or Workbench in your hotbar first.');
    return;
  }

  const objectType = held.item.id;
  const stateKey = getHomeObjectInventoryStateKey(objectType);
  const objectName = getHomeObjectDisplayName(objectType);

  if (!scene[stateKey]) {
    setMessage(scene, objectName + ' is already placed. Pick it up first.');
    return;
  }

  const target = getTargetTile(scene, 1);
  const tile = getTile(scene, target.x, target.y);

  if (!tile || tile.type !== 'homeFloor') {
    setMessage(scene, 'Place it on an open home floor tile.');
    return;
  }

  scene.map[target.y][target.x] = makeTile(objectType);
  scene.hotbarItems[held.slot] = null;
  scene[stateKey] = false;

  setMessage(scene, 'Placed ' + objectName + '.');
  updateInventoryUI(scene);
}

function placeFurnace(scene) {
  placeHeldHomeObject(scene);
}

function pickupHomeObject(scene) {
  if (scene.currentMapName !== 'home') {
    setMessage(scene, 'You can only pick up furniture at home.');
    return;
  }

  const target = getTargetTile(scene, 1);
  const tile = getTile(scene, target.x, target.y);

  if (!isHomeObject(tile)) {
    setMessage(scene, 'Face a Furnace or Workbench, then press X to pick it up.');
    return;
  }

  if ((tile.type === 'furnace' && scene.furnaceQueue.length > 0) ||
      (tile.type === 'craftingTable' && scene.tableQueue.length > 0)) {
    setMessage(scene, 'Wait for crafting to finish before moving this.');
    return;
  }

  const stateKey = getHomeObjectInventoryStateKey(tile.type);
  const objectName = getHomeObjectDisplayName(tile.type);

  if (scene[stateKey]) {
    setMessage(scene, objectName + ' is already in your inventory.');
    return;
  }

  const added = addItemToFirstOpenSlot(scene, { id: tile.type });
  if (!added) {
    setMessage(scene, 'No inventory space for ' + objectName + '.');
    return;
  }

  scene[stateKey] = true;
  scene.map[target.y][target.x] = makeTile('homeFloor');

  if (added.area === 'hotbar') {
    setMessage(scene, 'Picked up ' + objectName + ' into hotbar slot ' + (added.slot + 1) + '.');
  } else {
    setMessage(scene, 'Picked up ' + objectName + ', but your hotbar was full so it went to backpack.');
  }
  updateInventoryUI(scene);
}

function handleInteract(scene) {
  const target = getTargetTile(scene, 1);
  const tile = getTile(scene, target.x, target.y);

  if (!tile) {
    setMessage(scene, 'Nothing to interact with.');
    return;
  }

  if (tile.type === 'furnace') {
    toggleCraftingMenu(scene);
    return;
  }

  if (tile.type === 'craftingTable') {
    toggleCraftingTableMenu(scene);
    return;
  }

  if (tile.type === 'exitUp' || tile.type === 'exitDown') {
    tryUseMineExit(scene, tile);
    return;
  }

  if (tile.type === 'teleportPad') {
    useTeleportStone(scene);
    return;
  }

  setMessage(scene, 'Nothing to interact with.');
}

function toggleCraftingMenu(scene) {
  if (scene.craftingOpen) {
    closeCraftingMenu(scene);
    return;
  }

  const target = getTargetTile(scene, 1);
  const tile = getTile(scene, target.x, target.y);

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
  if (scene.craftingScreen) scene.craftingScreen.style.display = 'none';
}

function craftCopperBars(scene) {
  if (scene.furnaceQueue.length > 0) {
    setMessage(scene, 'Furnace already working.');
    return;
  }

  const amount = Number(scene.copperBarAmountSlider.value);
  const neededCopperOre = amount * 5;
  const neededCoal = amount;

  if (scene.inventory.copperOre < neededCopperOre) {
    setMessage(scene, 'Not enough Copper Ore.');
    return;
  }

  if (scene.inventory.coal < neededCoal) {
    setMessage(scene, 'Not enough Coal.');
    return;
  }

  scene.inventory.copperOre -= neededCopperOre;
  scene.inventory.coal -= neededCoal;
  scene.furnaceQueue.push({
    item: 'Copper Bar',
    amount,
    completed: 0,
    timePerItem: 5000,
    elapsed: 0
  });

  setMessage(scene, 'Started crafting ' + amount + ' Copper Bar(s).');
  updateInventoryUI(scene);
  updateFurnaceMenu(scene);
}

function updateFurnaceQueue(scene, delta) {
  if (!scene.furnaceQueue || scene.furnaceQueue.length === 0) return;

  const job = scene.furnaceQueue[0];
  job.elapsed += delta;

  while (job.elapsed >= job.timePerItem && job.completed < job.amount) {
    job.elapsed -= job.timePerItem;
    job.completed += 1;
    scene.furnaceOutput.copperBars += 1;
  }

  if (job.completed >= job.amount) {
    scene.furnaceQueue.shift();
    setMessage(scene, 'Furnace job complete.');
  }

  if (scene.craftingOpen) updateFurnaceMenu(scene);
}

function updateFurnaceMenu(scene) {
  if (!scene.furnaceQueueItem || !scene.furnaceProgressInner || !scene.furnaceOutputItem) return;

  if (!scene.furnaceQueue || scene.furnaceQueue.length === 0) {
    scene.furnaceQueueItem.textContent = 'Empty';
    scene.furnaceProgressInner.style.width = '0%';
  } else {
    const job = scene.furnaceQueue[0];
    const progress = Math.min(job.elapsed / job.timePerItem, 1);
    scene.furnaceQueueItem.textContent = job.item + ' ' + job.completed + '/' + job.amount;
    scene.furnaceProgressInner.style.width = progress * 100 + '%';
  }

  scene.furnaceOutputItem.textContent =
    scene.furnaceOutput.copperBars > 0 ? 'Copper Bars x' + scene.furnaceOutput.copperBars : 'Empty';
}

function collectFurnaceOutput(scene) {
  if (scene.furnaceOutput.copperBars <= 0) {
    setMessage(scene, 'No completed items.');
    return;
  }

  scene.inventory.copperBars += scene.furnaceOutput.copperBars;
  setMessage(scene, 'Collected ' + scene.furnaceOutput.copperBars + ' Copper Bar(s).');
  scene.furnaceOutput.copperBars = 0;
  updateInventoryUI(scene);
  updateFurnaceMenu(scene);
}

const craftingTableRecipes = {
  stonePickaxe: {
    name: 'Stone Pickaxe',
    description: 'A stronger pickaxe that can break copper ore blocks.',
    requirements: '15 Stone',
    timePerItem: 10000
  },
  copperPickaxe: {
    name: 'Copper Pickaxe',
    description: 'Breaks copper walls and unlocks Mine Level 6.',
    requirements: '10 Copper Bars + 20 Stone',
    timePerItem: 15000
  },
  furnace: {
    name: 'Furnace',
    description: 'A placeable workstation used to smelt ores into bars.',
    requirements: '20 Stone',
    timePerItem: 15000
  }
};

function toggleCraftingTableMenu(scene) {
  if (scene.craftingTableOpen) {
    closeCraftingTableMenu(scene);
    return;
  }

  const target = getTargetTile(scene, 1);
  const tile = getTile(scene, target.x, target.y);

  if (!tile || tile.type !== 'craftingTable') {
    setMessage(scene, 'Face the crafting table.');
    return;
  }

  scene.craftingTableOpen = true;
  scene.craftingTableScreen.style.display = 'flex';
  updateCraftingTableUI(scene);
}

function closeCraftingTableMenu(scene) {
  scene.craftingTableOpen = false;
  if (scene.craftingTableScreen) scene.craftingTableScreen.style.display = 'none';
}

function selectCraftingTableRecipe(scene, recipeId) {
  const recipe = craftingTableRecipes[recipeId];
  if (!recipe) return;

  scene.selectedCraftingTableRecipe = recipeId;
  document.getElementById('selectedRecipeName').textContent = recipe.name;
  document.getElementById('selectedRecipeDescription').textContent = recipe.description;
  document.getElementById('selectedRecipeRequirements').textContent = 'Requires: ' + recipe.requirements;

  scene.craftingRecipeButtons.forEach(button => {
    button.classList.toggle('selected', button.dataset.recipe === recipeId);
  });
}

function startCraftingTableRecipe(scene) {
  const recipeId = scene.selectedCraftingTableRecipe;
  if (!recipeId) {
    setMessage(scene, 'Select a recipe first.');
    return;
  }

  if (scene.tableQueue.length > 0) {
    setMessage(scene, 'Crafting table busy.');
    return;
  }

  const recipe = craftingTableRecipes[recipeId];

  if (recipeId === 'stonePickaxe') {
    if (scene.pickaxeTier >= 2) {
      setMessage(scene, 'Stone Pickaxe already crafted.');
      return;
    }
    if (scene.inventory.stone < 15) {
      setMessage(scene, 'Need 15 Stone.');
      return;
    }
    scene.inventory.stone -= 15;
  }

  if (recipeId === 'copperPickaxe') {
    if (scene.pickaxeTier >= 3) {
      setMessage(scene, 'Copper Pickaxe already crafted.');
      return;
    }
    if (scene.inventory.copperBars < 10 || scene.inventory.stone < 20) {
      setMessage(scene, 'Need 10 Copper Bars and 20 Stone.');
      return;
    }
    scene.inventory.copperBars -= 10;
    scene.inventory.stone -= 20;
  }

  if (recipeId === 'furnace') {
    if (scene.hasFurnace || hasPlacedHomeObject(scene, 'furnace')) {
      setMessage(scene, 'You already have a Furnace.');
      return;
    }
    if (scene.inventory.stone < 20) {
      setMessage(scene, 'Need 20 Stone.');
      return;
    }
    scene.inventory.stone -= 20;
  }

  scene.tableQueue.push({
    item: recipe.name,
    recipeId,
    amount: 1,
    completed: 0,
    timePerItem: recipe.timePerItem,
    elapsed: 0
  });

  setMessage(scene, 'Crafting started.');
  updateInventoryUI(scene);
  updateCraftingTableUI(scene);
}

function updateCraftingTableQueue(scene, delta) {
  if (!scene.tableQueue || scene.tableQueue.length === 0) return;

  const job = scene.tableQueue[0];
  job.elapsed += delta;

  if (job.elapsed >= job.timePerItem) {
    scene.tableOutput[job.recipeId] += 1;
    scene.tableQueue.shift();
    setMessage(scene, 'Craft complete.');
  }

  if (scene.craftingTableOpen) updateCraftingTableUI(scene);
}

function updateCraftingTableUI(scene) {
  if (!scene.tableQueueItem || !scene.tableProgressInner || !scene.tableOutputItem) return;

  if (!scene.tableQueue || scene.tableQueue.length === 0) {
    scene.tableQueueItem.textContent = 'Empty';
    scene.tableProgressInner.style.width = '0%';
  } else {
    const job = scene.tableQueue[0];
    scene.tableQueueItem.textContent = job.item;
    scene.tableProgressInner.style.width = Math.min(job.elapsed / job.timePerItem, 1) * 100 + '%';
  }

  const output = [];
  if (scene.tableOutput.stonePickaxe > 0) output.push('Stone Pickaxe x' + scene.tableOutput.stonePickaxe);
  if (scene.tableOutput.copperPickaxe > 0) output.push('Copper Pickaxe x' + scene.tableOutput.copperPickaxe);
  if (scene.tableOutput.furnace > 0) output.push('Furnace x' + scene.tableOutput.furnace);
  scene.tableOutputItem.textContent = output.join(' ') || 'Empty';
}

function collectCraftingTableOutput(scene) {
  if (scene.tableOutput.stonePickaxe <= 0 && scene.tableOutput.copperPickaxe <= 0 && scene.tableOutput.furnace <= 0) {
    setMessage(scene, 'No completed items.');
    return;
  }

  if (scene.tableOutput.stonePickaxe > 0) {
    scene.pickaxeTier = Math.max(scene.pickaxeTier, 2);
    scene.pickaxeDamage = Math.max(scene.pickaxeDamage, 2);
    scene.tableOutput.stonePickaxe = 0;
  }

  if (scene.tableOutput.copperPickaxe > 0) {
    scene.pickaxeTier = Math.max(scene.pickaxeTier, 3);
    scene.pickaxeDamage = Math.max(scene.pickaxeDamage, 3);
    scene.maxUnlockedMineLevel = Math.max(scene.maxUnlockedMineLevel || STARTING_UNLOCKED_MINE_LEVELS, FIRST_LOCKED_MINE_LEVEL);
    if (!scene.mineMaps[FIRST_LOCKED_MINE_LEVEL]) scene.mineMaps[FIRST_LOCKED_MINE_LEVEL] = createMineMap(scene, FIRST_LOCKED_MINE_LEVEL);
    scene.tableOutput.copperPickaxe = 0;
  }

  if (scene.tableOutput.furnace > 0) {
    const added = addItemToFirstOpenSlot(scene, { id: 'furnace' });
    if (!added) {
      setMessage(scene, 'No inventory space for Furnace.');
      updateInventoryUI(scene);
      updateCraftingTableUI(scene);
      return;
    }
    scene.hasFurnace = true;
    scene.tableOutput.furnace = 0;
  }

  updateInventoryUI(scene);
  updateCraftingTableUI(scene);
  setMessage(scene, 'Items collected.');
}
