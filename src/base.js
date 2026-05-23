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

  const px =
    scene.player.x +
    scene.lastMoveDirection.x;

  const py =
    scene.player.y +
    scene.lastMoveDirection.y;

  const tile = scene.map[py]
    ? scene.map[py][px]
    : null;

  if (!tile || tile.type !== 'homeFloor') {
    setMessage(
      scene,
      'Furnace can only be placed on home floor.'
    );

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

  const tx =
    scene.player.x +
    scene.lastMoveDirection.x;

  const ty =
    scene.player.y +
    scene.lastMoveDirection.y;

  const tile = scene.map[ty]
    ? scene.map[ty][tx]
    : null;

  if (!tile || tile.type !== 'furnace') {
    setMessage(
      scene,
      'Face the furnace to craft.'
    );

    return;
  }

  scene.craftingOpen = true;

  scene.craftingScreen.style.display =
    'flex';

  updateFurnaceMenu(scene);
}

function closeCraftingMenu(scene) {
  scene.craftingOpen = false;

  if (scene.craftingScreen) {
    scene.craftingScreen.style.display =
      'none';
  }
}

function craftCopperBars(scene) {
  if (scene.furnaceQueue.length > 0) {
    setMessage(
      scene,
      'Furnace already working.'
    );

    return;
  }

  const amount = Number(
    scene.copperBarAmountSlider.value
  );

  const neededCopperOre = amount * 5;

  const neededCoal = amount * 1;

  if (
    scene.inventory.copperOre <
    neededCopperOre
  ) {
    setMessage(
      scene,
      'Not enough Copper Ore.'
    );

    return;
  }

  if (
    scene.inventory.coal <
    neededCoal
  ) {
    setMessage(scene, 'Not enough Coal.');

    return;
  }

  scene.inventory.copperOre -=
    neededCopperOre;

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
    'Started crafting ' +
      amount +
      ' Copper Bar(s).'
  );

  updateInventoryUI(scene);

  updateFurnaceMenu(scene);
}

function updateFurnaceQueue(
  scene,
  delta
) {
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

      setMessage(
        scene,
        'Furnace job complete.'
      );
    }
  }

  updateFurnaceMenu(scene);
}

function updateFurnaceMenu(scene) {
  const queueItem =
    document.getElementById(
      'furnaceQueueItem'
    );

  const progressBar =
    document.getElementById(
      'furnaceProgressInner'
    );

  const outputItem =
    document.getElementById(
      'furnaceOutputItem'
    );

  if (
    !queueItem ||
    !progressBar ||
    !outputItem
  ) {
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
      job.item +
      ' ' +
      job.completed +
      '/' +
      job.amount;

    progressBar.style.width =
      progress * 100 + '%';
  }

  if (
    scene.furnaceOutput.copperBars > 0
  ) {
    outputItem.textContent =
      'Copper Bars x' +
      scene.furnaceOutput.copperBars;
  } else {
    outputItem.textContent = 'Empty';
  }
}

function collectFurnaceOutput(scene) {
  if (
    scene.furnaceOutput.copperBars <= 0
  ) {
    setMessage(
      scene,
      'No completed items.'
    );

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

  const tx =
    scene.player.x +
    scene.lastMoveDirection.x;

  const ty =
    scene.player.y +
    scene.lastMoveDirection.y;

  const tile = scene.map[ty]
    ? scene.map[ty][tx]
    : null;

  if (
    !tile ||
    tile.type !== 'craftingTable'
  ) {
    setMessage(
      scene,
      'Face the crafting table.'
    );

    return;
  }

  scene.craftingTableOpen = true;

  scene.craftingTableScreen.style.display =
    'flex';
}

function closeCraftingTableMenu(scene) {
  scene.craftingTableOpen = false;

  if (scene.craftingTableScreen) {
    scene.craftingTableScreen.style.display =
      'none';
  }
}

function craftStonePickaxeAtTable(scene) {
  if (scene.pickaxeTier >= 2) {
    setMessage(
      scene,
      'Stone Pickaxe already crafted.'
    );

    return;
  }

  if (scene.inventory.stone < 15) {
    setMessage(scene, 'Need 15 Stone.');
    return;
  }

  scene.inventory.stone -= 15;

  scene.pickaxeTier = 2;
  scene.pickaxeDamage = 2;

  setMessage(
    scene,
    'Crafted Stone Pickaxe.'
  );

  updateInventoryUI(scene);
}

function craftFurnaceAtTable(scene) {
  if (scene.hasFurnace) {
    setMessage(
      scene,
      'Furnace already crafted.'
    );

    return;
  }

  if (scene.inventory.stone < 20) {
    setMessage(scene, 'Need 20 Stone.');
    return;
  }

  scene.inventory.stone -= 20;

  scene.hasFurnace = true;

  setMessage(
    scene,
    'Crafted Furnace.'
  );

  const craftingTableRecipes = {
  stonePickaxe: {
    name: 'Stone Pickaxe',
    description: 'A stronger pickaxe that can break copper blocks.',
    requirements: '15 Stone',
    craft: craftStonePickaxeAtTable
  },

  furnace: {
    name: 'Furnace',
    description: 'A placeable workstation used to smelt ores into bars.',
    requirements: '20 Stone',
    craft: craftFurnaceAtTable
  }
};

function selectCraftingTableRecipe(scene, recipeId) {
  scene.selectedCraftingTableRecipe = recipeId;

  const recipe = craftingTableRecipes[recipeId];

  document.getElementById('selectedRecipeName').textContent =
    recipe.name;

  document.getElementById('selectedRecipeDescription').textContent =
    recipe.description;

  document.getElementById('selectedRecipeRequirements').textContent =
    'Requires: ' + recipe.requirements;

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

  const recipe = craftingTableRecipes[recipeId];

  recipe.craft(scene);
}
  updateInventoryUI(scene);
}
