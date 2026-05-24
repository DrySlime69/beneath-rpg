function setupDevInventory(scene) {
  scene.devItemScreen = document.getElementById('devItemScreen');
  scene.openDevItemsButton = document.getElementById('openDevItemsButton');
  scene.closeDevItemsButton = document.getElementById('closeDevItemsButton');
  scene.devCategoryTabs = document.getElementById('devCategoryTabs');
  scene.devItemList = document.getElementById('devItemList');
  scene.devItemName = document.getElementById('devItemName');
  scene.devItemInfo = document.getElementById('devItemInfo');
  scene.devItemStats = document.getElementById('devItemStats');
  scene.devItemRecipe = document.getElementById('devItemRecipe');
  scene.devItemAmount = document.getElementById('devItemAmount');
  scene.devItemAmountLabel = document.getElementById('devItemAmountLabel');
  scene.addDevItemButton = document.getElementById('addDevItemButton');

  scene.selectedDevCategory = 'resources';
  scene.selectedDevItemId = getItemsByCategory('resources')[0]?.id || null;
  scene.devItemOpen = false;

  scene.openDevItemsButton?.addEventListener('click', () => openDevInventory(scene));
  scene.closeDevItemsButton?.addEventListener('click', () => closeDevInventory(scene));
  scene.devItemAmount?.addEventListener('input', () => {
    scene.devItemAmountLabel.textContent = scene.devItemAmount.value;
  });
  scene.addDevItemButton?.addEventListener('click', () => addSelectedDevItem(scene));

  renderDevInventory(scene);
}

function openDevInventory(scene) {
  scene.devItemOpen = true;
  if (scene.devItemScreen) scene.devItemScreen.style.display = 'flex';
  renderDevInventory(scene);
}

function closeDevInventory(scene) {
  scene.devItemOpen = false;
  if (scene.devItemScreen) scene.devItemScreen.style.display = 'none';
}

function renderDevInventory(scene) {
  if (!scene.devCategoryTabs || !scene.devItemList) return;

  scene.devCategoryTabs.innerHTML = '';
  ITEM_CATEGORIES.forEach(category => {
    const button = document.createElement('button');
    button.className = 'devCategoryButton';
    button.textContent = category.name;
    button.classList.toggle('selected', category.id === scene.selectedDevCategory);
    button.addEventListener('click', () => {
      scene.selectedDevCategory = category.id;
      scene.selectedDevItemId = getItemsByCategory(category.id)[0]?.id || null;
      renderDevInventory(scene);
    });
    scene.devCategoryTabs.appendChild(button);
  });

  scene.devItemList.innerHTML = '';
  getItemsByCategory(scene.selectedDevCategory).forEach(item => {
    const button = document.createElement('button');
    button.className = 'devItemButton';
    button.textContent = item.name;
    button.classList.toggle('selected', item.id === scene.selectedDevItemId);
    button.addEventListener('click', () => {
      scene.selectedDevItemId = item.id;
      renderDevInventory(scene);
    });
    scene.devItemList.appendChild(button);
  });

  updateDevItemDetails(scene);
}

function updateDevItemDetails(scene) {
  const item = getItemDef(scene.selectedDevItemId);
  if (!item) return;

  scene.devItemName.textContent = item.name;
  scene.devItemInfo.textContent = item.info || '';
  scene.devItemStats.textContent = 'Stats:\n' + (getItemStatsText(item) || 'No stats yet.');
  scene.devItemRecipe.textContent = 'Recipe / Source:\n' + getRecipeText(item);

  const maxAmount = item.maxAmount || 99;
  scene.devItemAmount.max = String(maxAmount);
  if (Number(scene.devItemAmount.value) > maxAmount) scene.devItemAmount.value = String(maxAmount);
  if (Number(scene.devItemAmount.value) < 1) scene.devItemAmount.value = '1';
  scene.devItemAmountLabel.textContent = scene.devItemAmount.value;

  scene.addDevItemButton.disabled = false;
  scene.addDevItemButton.textContent = 'Add to Inventory';
}

function ensureHotbarItem(scene, id) {
  if (!scene.hotbarItems.some(item => item && item.id === id)) {
    addItemToFirstOpenSlot(scene, { id });
  }
}

function addSelectedDevItem(scene) {
  const item = getItemDef(scene.selectedDevItemId);
  if (!item) return;

  const amount = Math.max(1, Number(scene.devItemAmount.value) || 1);

  if (item.stackable) {
    scene.inventory[item.id] = (scene.inventory[item.id] || 0) + amount;
    setMessage(scene, 'Added ' + amount + ' ' + item.name + '.');
    updateInventoryUI(scene);
    return;
  }

  if (item.toolType === 'pickaxe') {
    let addedCount = 0;
    for (let i = 0; i < amount; i++) {
      const added = addItemToFirstOpenSlot(scene, createItemInstance(item.id));
      if (!added) break;
      addedCount++;
    }
    scene.pickaxeTier = Math.max(scene.pickaxeTier || 0, item.tier || 0);
    scene.pickaxeDamage = Math.max(scene.pickaxeDamage || 0, item.miningDamage || 0);
    scene.pickaxeDurabilityMax = getPickaxeDurabilityMax(scene.pickaxeTier);
    scene.pickaxeDurability = scene.pickaxeDurabilityMax;
    if (item.tier >= 3) {
      scene.maxUnlockedMineLevel = Math.max(scene.maxUnlockedMineLevel || STARTING_UNLOCKED_MINE_LEVELS, FIRST_LOCKED_MINE_LEVEL);
    }
    setMessage(scene, addedCount > 0 ? 'Added ' + addedCount + ' ' + item.name + '(s).' : 'No inventory space for ' + item.name + '.');
    updateInventoryUI(scene);
    return;
  }

  if (item.category === 'weapons') {
    let addedCount = 0;
    for (let i = 0; i < amount; i++) {
      const added = addItemToFirstOpenSlot(scene, createItemInstance(item.id));
      if (!added) break;
      addedCount++;
    }
    setMessage(scene, addedCount > 0 ? 'Added ' + addedCount + ' ' + item.name + '(s).' : 'No inventory space for ' + item.name + '.');
    updateInventoryUI(scene);
    return;
  }

  if (item.placeable) {
    const stateKey = getHomeObjectInventoryStateKey(item.id);
    if (stateKey) {
      if (scene[stateKey]) {
        setMessage(scene, item.name + ' is already in your inventory.');
        return;
      }
      if (hasPlacedHomeObject(scene, item.id)) {
        setMessage(scene, item.name + ' is currently placed at home. Pick it up first.');
        return;
      }
    }
    let addedCount = 0;
    for (let i = 0; i < amount; i++) {
      const added = addItemToFirstOpenSlot(scene, { id: item.id });
      if (!added) break;
      addedCount++;
      if (stateKey) { scene[stateKey] = true; break; }
    }
    setMessage(scene, addedCount > 0 ? 'Added ' + addedCount + ' ' + item.name + '(s).' : 'No inventory space for ' + item.name + '.');
    updateInventoryUI(scene);
    return;
  }

  if (item.id === 'teleportStone') {
    if (scene.hotbarItems.concat(scene.backpackItems).some(entry => entry && entry.id === 'teleportStone')) {
      setMessage(scene, 'Teleport Stone is already in your inventory.');
      return;
    }
    const added = addItemToFirstOpenSlot(scene, { id: 'teleportStone' });
    setMessage(scene, added ? 'Added Teleport Stone.' : 'No inventory space for Teleport Stone.');
    updateInventoryUI(scene);
  }
}
