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
    amount: amount,
    completed: 0,
    timePerItem: 5000,
    elapsed: 0
  });

  setMessage(
    scene,
    'Started crafting ' + amount + ' Copper Bar(s).'
  );

  updateInventoryUI(scene);
  updateFurnaceMenu(scene);
}

function updateFurnaceQueue(scene, delta) {
  if (
    !scene.furnaceQueue ||
    scene.furnaceQueue.length === 0
  ) {
    return;
  }

  const job = scene.furnaceQueue[0];

  job.elapsed += delta;

  if (job.elapsed >= job.timePerItem) {
    job.elapsed -= job.timePerItem;
    job.completed += 1;
    scene.furnaceOutput.copperBars += 1;

    if (job.completed >= job.amount) {
      scene.furnaceQueue.shift();
      setMessage(scene, 'Furnace job complete.');
    }
  }

  updateFurnaceMenu(scene);
}

function updateFurnaceMenu(scene) {
  const queueItem =
    document.getElementById('furnaceQueueItem');

  const progressBar =
    document.getElementById('furnaceProgressInner');

  const outputItem =
    document.getElementById('furnaceOutputItem');

  if (!queueItem || !progressBar || !outputItem) {
    return;
  }

  if (
    !scene.furnaceQueue ||
    scene.furnaceQueue.length === 0
  ) {
    queueItem.textContent = 'Empty';
    progressBar.style.width = '0%';
  } else {
    const job = scene.furnaceQueue[0];
    const progress = Math.min(
      job.elapsed / job.timePerItem,
      1
    );

    queueItem.textContent =
      job.item + ' ' + job.completed + '/' + job.amount;

    progressBar.style.width = progress * 100 + '%';
  }

  if (scene.furnaceOutput.copperBars > 0) {
    outputItem.textContent =
      'Copper Bars x' + scene.furnaceOutput.copperBars;
  } else {
    outputItem.textContent = 'Empty';
  }
}

function collectFurnaceOutput(scene) {
  if (scene.furnaceOutput.copperBars <= 0) {
    setMessage(scene, 'No completed items.');
    return;
  }

  scene.inventory.copperBars +=
    scene.furnaceOutput.copperBars;

  setMessage(
    scene,
    'Collected ' +
      scene.furnaceOutput.copperBars +
      ' Copper Bar(s).'
  );

  scene.furnaceOutput.copperBars = 0;

  updateInventoryUI(scene);
  updateFurnaceMenu(scene);
}

function toggleCraftingTableMenu(scene) {
  if (scene.craftingTableOpen) {
    closeCraftingTableMenu(scene);
    return;
  }

  const tx = scene.player.x + scene.lastMoveDirection.x;
  const ty = scene.player.y + scene.lastMoveDirection.y;

  const tile = scene.map[ty]
    ? scene.map[ty][tx]
    : null;

  if (!tile || tile.type !== 'craftingTable') {
    setMessage(scene, 'Face the crafting table.');
    return;
  }

  scene.craftingTableOpen = true;
  scene.craftingTableScreen.style.display = 'flex';

  resetCraftingTableDetails(scene);
}

function closeCraftingTableMenu(scene) {
  scene.craftingTableOpen = false;

  if (scene.craftingTableScreen) {
    scene.craftingTableScreen.style.display = 'none';
  }
}

function resetCraftingTableDetails(scene) {
  scene.selectedCraftingTableRecipe = null;

  const name =
    document.getElementById('selectedRecipeName');

  const description =
    document.getElementById('selectedRecipeDescription');

  const requirements =
    document.getElementById('selectedRecipeRequirements');

  if (name) {
    name.textContent = 'Select a Recipe';
  }

  if (description) {
    description.textContent =
      'Choose a recipe from the grid.';
  }

  if (requirements) {
    requirements.textContent = '';
  }

  document.querySelectorAll('.craftRecipeSlot').forEach(button => {
    button.classList.remove('selected');
  });
}

function craftStonePickaxeAtTable(scene) {
  if (scene.pickaxeTier >= 2) {
    setMessage(scene, 'Stone Pickaxe already crafted.');
    return;
  }

  if (scene.inventory.stone < 15) {
    setMessage(scene, 'Need 15 Stone.');
    return;
  }

  scene.inventory.stone -= 15;

  scene.pickaxeTier = 2;
  scene.pickaxeDamage = 2;

  setMessage(scene, 'Crafted Stone Pickaxe.');
  updateInventoryUI(scene);
}

function craftFurnaceAtTable(scene) {
  if (scene.hasFurnace) {
    setMessage(scene, 'Furnace already crafted.');
    return;
  }

  if (scene.inventory.stone < 20) {
    setMessage(scene, 'Need 20 Stone.');
    return;
  }

  scene.inventory.stone -= 20;
  scene.hasFurnace = true;

  setMessage(scene, 'Crafted Furnace.');
  updateInventoryUI(scene);
}

const craftingTableRecipes = {
  stonePickaxe: {
    name: 'Stone Pickaxe',
    description:
      'A stronger pickaxe that can break copper blocks.',
    requirements: '15 Stone',
    craft: craftStonePickaxeAtTable
  },

  furnace: {
    name: 'Furnace',
    description:
      'A placeable workstation used to smelt ores into bars.',
    requirements: '20 Stone',
    craft: craftFurnaceAtTable
  }
};

function selectCraftingTableRecipe(scene, recipeId) {
  const recipe = craftingTableRecipes[recipeId];

  if (!recipe) {
    setMessage(scene, 'Unknown recipe.');
    return;
  }

  scene.selectedCraftingTableRecipe = recipeId;

  const name =
    document.getElementById('selectedRecipeName');

  const description =
    document.getElementById('selectedRecipeDescription');

  const requirements =
    document.getElementById('selectedRecipeRequirements');

  if (name) {
    name.textContent = recipe.name;
  }

  if (description) {
    description.textContent = recipe.description;
  }

  if (requirements) {
    requirements.textContent =
      'Requires: ' + recipe.requirements;
  }

  document.querySelectorAll('.craftRecipeSlot').forEach(button => {
    button.classList.remove('selected');

    if (button.dataset.recipe === recipeId) {
      button.classList.add('selected');
    }
  });
}

function craftSelectedCraftingTableRecipe(scene) {
  const recipeId = scene.selectedCraftingTableRecipe;

  if (!recipeId) {
    setMessage(scene, 'Select a recipe first.');
    return;
  }

  startCraftingTableRecipe(scene);
}

function setupFurnaceRecipeSelection(scene) {
  const furnaceRecipeButtons = Array.from(
    document.querySelectorAll('.furnaceRecipeSlot')
  );

  furnaceRecipeButtons.forEach(button => {
    button.addEventListener('click', () => {
      document.querySelectorAll('.furnaceRecipeSlot').forEach(slot => {
        slot.classList.remove('selected');
      });

      button.classList.add('selected');

      setMessage(scene, 'Selected Copper Bar recipe.');
    });
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

  if (recipeId === 'stonePickaxe') {
    if (scene.inventory.stone < 15) {
      setMessage(scene, 'Need 15 Stone.');
      return;
    }

    scene.inventory.stone -= 15;

    scene.tableQueue.push({
      item: 'Stone Pickaxe',
      recipeId: 'stonePickaxe',
      amount: 1,
      completed: 0,
      timePerItem: 10000,
      elapsed: 0
    });
  }

  if (recipeId === 'furnace') {
    if (scene.inventory.stone < 20) {
      setMessage(scene, 'Need 20 Stone.');
      return;
    }

    scene.inventory.stone -= 20;

    scene.tableQueue.push({
      item: 'Furnace',
      recipeId: 'furnace',
      amount: 1,
      completed: 0,
      timePerItem: 15000,
      elapsed: 0
    });
  }

  updateInventoryUI(scene);
  updateCraftingTableUI(scene);

  setMessage(scene, 'Crafting started.');
}

function updateCraftingTableQueue(scene, delta) {
  if (!scene.tableQueue || scene.tableQueue.length === 0) {
    return;
  }

  const job = scene.tableQueue[0];

  job.elapsed += delta;

  if (job.elapsed >= job.timePerItem) {
    job.elapsed -= job.timePerItem;

    job.completed += 1;

    scene.tableOutput[job.recipeId] += 1;

    scene.tableQueue.shift();

    setMessage(scene, 'Craft complete.');
  }

  updateCraftingTableUI(scene);
}

function updateCraftingTableUI(scene) {
  const queueItem =
    document.getElementById('tableQueueItem');

  const progressBar =
    document.getElementById('tableProgressInner');

  const outputItem =
    document.getElementById('tableOutputItem');

  if (!queueItem || !progressBar || !outputItem) {
    return;
  }

  if (!scene.tableQueue || scene.tableQueue.length === 0) {
    queueItem.textContent = 'Empty';
    progressBar.style.width = '0%';
  } else {
    const job = scene.tableQueue[0];

    const progress = Math.min(
      job.elapsed / job.timePerItem,
      1
    );

    queueItem.textContent = job.item;

    progressBar.style.width =
      progress * 100 + '%';
  }

  let outputText = '';

  if (scene.tableOutput.stonePickaxe > 0) {
    outputText +=
      'Stone Pickaxe x' +
      scene.tableOutput.stonePickaxe +
      ' ';
  }

  if (scene.tableOutput.furnace > 0) {
    outputText +=
      'Furnace x' +
      scene.tableOutput.furnace;
  }

  outputItem.textContent =
    outputText || 'Empty';
}

function collectCraftingTableOutput(scene) {
  if (
    scene.tableOutput.stonePickaxe <= 0 &&
    scene.tableOutput.furnace <= 0
  ) {
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

  recipe.craft(scene);
}
