
function useTeleportStone(scene) {
  if (scene.currentMapName === 'mine') {
    scene.mineReturnPosition = { x: scene.player.x, y: scene.player.y };
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
}

function placeFurnace(scene) {
  const furnaceSlot = scene.hotbarItems.findIndex(item => item && item.id === 'furnace');

  if (scene.currentMapName !== 'home') {
    setMessage(scene, 'Furnace can only be placed at home.');
    return;
  }

  if (!scene.hasFurnace || furnaceSlot === -1) {
    setMessage(scene, 'Move Furnace to hotbar first.');
    return;
  }

  const target = getTargetTile(scene, 1);
  const tile = getTile(scene, target.x, target.y);

  if (!tile || tile.type !== 'homeFloor') {
    setMessage(scene, 'Place it on an open home floor tile.');
    return;
  }

  scene.map[target.y][target.x] = makeTile('furnace');
  scene.hotbarItems[furnaceSlot] = null;
  scene.hasFurnace = false;

  setMessage(scene, 'Placed Furnace.');
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
    description: 'A stronger pickaxe that can break copper blocks.',
    requirements: '15 Stone',
    timePerItem: 10000
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

  if (recipeId === 'furnace') {
    if (scene.hasFurnace) {
      setMessage(scene, 'Furnace already crafted or in backpack.');
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
  if (scene.tableOutput.furnace > 0) output.push('Furnace x' + scene.tableOutput.furnace);
  scene.tableOutputItem.textContent = output.join(' ') || 'Empty';
}

function collectCraftingTableOutput(scene) {
  if (scene.tableOutput.stonePickaxe <= 0 && scene.tableOutput.furnace <= 0) {
    setMessage(scene, 'No completed items.');
    return;
  }

  if (scene.tableOutput.stonePickaxe > 0) {
    scene.pickaxeTier = 2;
    scene.pickaxeDamage = 2;
    scene.tableOutput.stonePickaxe = 0;
  }

  if (scene.tableOutput.furnace > 0) {
    scene.hasFurnace = true;
    scene.tableOutput.furnace = 0;
  }

  updateInventoryUI(scene);
  updateCraftingTableUI(scene);
  setMessage(scene, 'Items collected.');
}
