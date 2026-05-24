const SAVE_KEY_PREFIX = 'beneathRpgSaveSlot';

function cacheSaveMenuDom(scene) {
  scene.pauseMenuScreen = document.getElementById('pauseMenuScreen');
  scene.saveMenuScreen = document.getElementById('saveMenuScreen');
  scene.overwriteConfirmScreen = document.getElementById('overwriteConfirmScreen');
  scene.loadMenuScreen = document.getElementById('loadMenuScreen');
  scene.loadConfirmScreen = document.getElementById('loadConfirmScreen');
  scene.openSaveMenuButton = document.getElementById('openSaveMenu');
  scene.openLoadMenuButton = document.getElementById('openLoadMenu');
  scene.exitPauseMenuButton = document.getElementById('exitPauseMenu');
  scene.exitSaveMenuButton = document.getElementById('exitSaveMenu');
  scene.exitOverwriteMenuButton = document.getElementById('exitOverwriteMenu');
  scene.exitLoadMenuButton = document.getElementById('exitLoadMenu');
  scene.exitLoadConfirmMenuButton = document.getElementById('exitLoadConfirmMenu');
  scene.confirmOverwriteYesButton = document.getElementById('confirmOverwriteYes');
  scene.confirmOverwriteNoButton = document.getElementById('confirmOverwriteNo');
  scene.confirmLoadYesButton = document.getElementById('confirmLoadYes');
  scene.confirmLoadNoButton = document.getElementById('confirmLoadNo');
  scene.overwriteSlotLabel = document.getElementById('overwriteSlotLabel');
  scene.loadSlotLabel = document.getElementById('loadSlotLabel');
  scene.saveSlotButtons = Array.from(document.querySelectorAll('.saveSlotButton'));
  scene.loadSlotButtons = Array.from(document.querySelectorAll('.loadSlotButton'));
}

function setupSaveMenuEvents(scene) {
  cacheSaveMenuDom(scene);

  scene.openSaveMenuButton?.addEventListener('click', () => openSaveMenu(scene));
  scene.openLoadMenuButton?.addEventListener('click', () => openLoadMenu(scene));
  scene.exitPauseMenuButton?.addEventListener('click', () => closeAllGameMenus(scene));
  scene.exitSaveMenuButton?.addEventListener('click', () => openPauseMenu(scene));
  scene.exitLoadMenuButton?.addEventListener('click', () => openPauseMenu(scene));
  scene.exitOverwriteMenuButton?.addEventListener('click', () => openSaveMenu(scene));
  scene.exitLoadConfirmMenuButton?.addEventListener('click', () => openPauseMenu(scene));
  scene.confirmOverwriteNoButton?.addEventListener('click', () => openSaveMenu(scene));
  scene.confirmLoadNoButton?.addEventListener('click', () => openPauseMenu(scene));

  scene.confirmOverwriteYesButton?.addEventListener('click', () => {
    if (!scene.pendingSaveSlot) return;
    saveGameToSlot(scene, scene.pendingSaveSlot);
    scene.pendingSaveSlot = null;
    openPauseMenu(scene);
  });

  scene.confirmLoadYesButton?.addEventListener('click', () => {
    if (!scene.pendingLoadSlot) return;
    const loaded = loadGameFromSlot(scene, scene.pendingLoadSlot);
    scene.pendingLoadSlot = null;
    if (loaded) closeAllGameMenus(scene);
    else openLoadMenu(scene);
  });

  scene.saveSlotButtons.forEach(button => {
    button.addEventListener('click', () => {
      const slot = Number(button.dataset.slot);
      askOverwriteSaveSlot(scene, slot);
    });
  });

  scene.loadSlotButtons.forEach(button => {
    button.addEventListener('click', () => {
      const slot = Number(button.dataset.slot);
      askLoadSaveSlot(scene, slot);
    });
  });

  updateSaveSlotLabels(scene);
}

function togglePauseMenu(scene) {
  if (scene.pauseMenuOpen || scene.saveMenuOpen || scene.loadMenuOpen || scene.overwriteMenuOpen || scene.loadConfirmOpen) {
    closeAllGameMenus(scene);
  } else {
    openPauseMenu(scene);
  }
}

function openPauseMenu(scene) {
  closeInventoryAndCraftingMenus(scene);
  scene.pauseMenuOpen = true;
  scene.saveMenuOpen = false;
  scene.overwriteMenuOpen = false;
  scene.loadMenuOpen = false;
  scene.loadConfirmOpen = false;
  showMenuElement(scene.pauseMenuScreen, true);
  showMenuElement(scene.saveMenuScreen, false);
  showMenuElement(scene.loadMenuScreen, false);
  showMenuElement(scene.overwriteConfirmScreen, false);
  showMenuElement(scene.loadConfirmScreen, false);
}

function openSaveMenu(scene) {
  scene.pauseMenuOpen = false;
  scene.saveMenuOpen = true;
  scene.overwriteMenuOpen = false;
  scene.loadMenuOpen = false;
  scene.loadConfirmOpen = false;
  updateSaveSlotLabels(scene);
  showMenuElement(scene.pauseMenuScreen, false);
  showMenuElement(scene.saveMenuScreen, true);
  showMenuElement(scene.loadMenuScreen, false);
  showMenuElement(scene.overwriteConfirmScreen, false);
  showMenuElement(scene.loadConfirmScreen, false);
}


function openLoadMenu(scene) {
  scene.pauseMenuOpen = false;
  scene.saveMenuOpen = false;
  scene.loadMenuOpen = true;
  scene.overwriteMenuOpen = false;
  scene.loadConfirmOpen = false;
  updateSaveSlotLabels(scene);
  showMenuElement(scene.pauseMenuScreen, false);
  showMenuElement(scene.saveMenuScreen, false);
  showMenuElement(scene.loadMenuScreen, true);
  showMenuElement(scene.overwriteConfirmScreen, false);
  showMenuElement(scene.loadConfirmScreen, false);
}

function askLoadSaveSlot(scene, slot) {
  const data = readSaveSlot(slot);
  if (!data) {
    setMessage(scene, 'Save slot ' + slot + ' is empty.');
    return;
  }

  scene.pendingLoadSlot = slot;
  scene.pauseMenuOpen = false;
  scene.saveMenuOpen = false;
  scene.loadMenuOpen = false;
  scene.overwriteMenuOpen = false;
  scene.loadConfirmOpen = true;
  if (scene.loadSlotLabel) scene.loadSlotLabel.textContent = 'Save Slot ' + slot;
  showMenuElement(scene.pauseMenuScreen, false);
  showMenuElement(scene.saveMenuScreen, false);
  showMenuElement(scene.loadMenuScreen, false);
  showMenuElement(scene.overwriteConfirmScreen, false);
  showMenuElement(scene.loadConfirmScreen, true);
}

function askOverwriteSaveSlot(scene, slot) {
  scene.pendingSaveSlot = slot;
  scene.pauseMenuOpen = false;
  scene.saveMenuOpen = false;
  scene.overwriteMenuOpen = true;
  scene.loadMenuOpen = false;
  scene.loadConfirmOpen = false;
  if (scene.overwriteSlotLabel) scene.overwriteSlotLabel.textContent = 'Save Slot ' + slot;
  showMenuElement(scene.pauseMenuScreen, false);
  showMenuElement(scene.saveMenuScreen, false);
  showMenuElement(scene.loadMenuScreen, false);
  showMenuElement(scene.overwriteConfirmScreen, true);
  showMenuElement(scene.loadConfirmScreen, false);
}

function closeAllGameMenus(scene) {
  scene.pauseMenuOpen = false;
  scene.saveMenuOpen = false;
  scene.overwriteMenuOpen = false;
  scene.loadMenuOpen = false;
  scene.loadConfirmOpen = false;
  scene.pendingSaveSlot = null;
  scene.pendingLoadSlot = null;
  showMenuElement(scene.pauseMenuScreen, false);
  showMenuElement(scene.saveMenuScreen, false);
  showMenuElement(scene.loadMenuScreen, false);
  showMenuElement(scene.overwriteConfirmScreen, false);
  showMenuElement(scene.loadConfirmScreen, false);
}

function closeInventoryAndCraftingMenus(scene) {
  if (scene.inventoryOpen) {
    scene.inventoryOpen = false;
    if (scene.inventoryScreen) scene.inventoryScreen.style.display = 'none';
  }
  closeCraftingMenu(scene);
  closeCraftingTableMenu(scene);
}

function showMenuElement(element, visible) {
  if (element) element.style.display = visible ? 'flex' : 'none';
}

function updateSaveSlotLabels(scene) {
  const allSlotButtons = [
    ...(scene.saveSlotButtons || []),
    ...(scene.loadSlotButtons || [])
  ];
  if (!allSlotButtons.length) return;

  allSlotButtons.forEach(button => {
    const slot = Number(button.dataset.slot);
    const data = readSaveSlot(slot);
    const span = button.querySelector('span');
    if (!span) return;

    if (!data) {
      span.textContent = 'Empty';
    } else {
      span.textContent = 'Level ' + (data.mineLevel || 1) + ' • ' + new Date(data.savedAt).toLocaleString();
    }
  });
}

function getSaveSlotKey(slot) {
  return SAVE_KEY_PREFIX + slot;
}

function readSaveSlot(slot) {
  try {
    const raw = localStorage.getItem(getSaveSlotKey(slot));
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    return null;
  }
}

function saveGameToSlot(scene, slot) {
  const data = buildSaveData(scene);
  localStorage.setItem(getSaveSlotKey(slot), JSON.stringify(data));
  updateSaveSlotLabels(scene);
  setMessage(scene, 'Game saved to slot ' + slot + '.');
}

function buildSaveData(scene) {
  return {
    version: 1,
    savedAt: Date.now(),
    player: {
      x: scene.player.x,
      y: scene.player.y,
      health: scene.player.health,
      maxHealth: scene.player.maxHealth,
      lastMoveDirection: scene.lastMoveDirection
    },
    currentMapName: scene.currentMapName,
    mineLevel: scene.mineLevel,
    maxUnlockedMineLevel: scene.maxUnlockedMineLevel,
    mineReturnPosition: scene.mineReturnPosition,
    inventory: scene.inventory,
    hotbarItems: scene.hotbarItems,
    backpackItems: scene.backpackItems,
    selectedHotbarIndex: scene.selectedHotbarIndex,
    pickaxeTier: scene.pickaxeTier,
    pickaxeDamage: scene.pickaxeDamage,
    pickaxeDurability: scene.pickaxeDurability,
    pickaxeDurabilityMax: scene.pickaxeDurabilityMax,
    hasFurnace: scene.hasFurnace,
    hasCraftingTable: scene.hasCraftingTable,
    furnaceQueue: scene.furnaceQueue,
    furnaceOutput: scene.furnaceOutput,
    tableQueue: scene.tableQueue,
    tableOutput: scene.tableOutput,
    mineMaps: serializeMapCollection(scene.mineMaps),
    homeMap: serializeMap(scene.homeMap),
    mineEnemies: serializeEnemyCollection(scene.mineEnemies)
  };
}

function serializeMapCollection(maps) {
  const output = {};
  Object.keys(maps || {}).forEach(level => {
    output[level] = serializeMap(maps[level]);
  });
  return output;
}

function serializeMap(map) {
  return map.map(row => row.map(tile => ({
    type: tile.type,
    hardness: tile.hardness,
    hp: tile.hp,
    maxHp: tile.maxHp,
    variation: tile.variation,
    detailSeed: tile.detailSeed,
    targetLevel: tile.targetLevel,
    requiredPickaxeTier: tile.requiredPickaxeTier
  })));
}

function serializeEnemyCollection(collection) {
  const output = {};
  Object.keys(collection || {}).forEach(level => {
    output[level] = (collection[level] || []).filter(enemy => !enemy.dead).map(enemy => ({
      id: enemy.id,
      type: enemy.type,
      x: enemy.x,
      y: enemy.y,
      radius: enemy.radius,
      maxHp: enemy.maxHp,
      hp: enemy.hp,
      damage: enemy.damage,
      speed: enemy.speed,
      aggroRange: enemy.aggroRange,
      attackRange: enemy.attackRange,
      hitCooldownUntil: 0,
      wanderAngle: enemy.wanderAngle || 0,
      wanderTimer: enemy.wanderTimer || 800,
      knockbackX: 0,
      knockbackY: 0,
      dead: false
    }));
  });
  return output;
}

function loadGameFromSlot(scene, slot) {
  const data = readSaveSlot(slot);
  if (!data) {
    setMessage(scene, 'Save slot ' + slot + ' is empty.');
    return false;
  }

  scene.player.x = data.player?.x ?? scene.player.x;
  scene.player.y = data.player?.y ?? scene.player.y;
  scene.player.maxHealth = data.player?.maxHealth || PLAYER_MAX_HEALTH;
  scene.player.health = data.player?.health || scene.player.maxHealth;
  scene.lastMoveDirection = data.player?.lastMoveDirection || { x: 1, y: 0 };
  scene.mineLevel = data.mineLevel || 1;
  scene.maxUnlockedMineLevel = data.maxUnlockedMineLevel || STARTING_UNLOCKED_MINE_LEVELS;
  scene.mineReturnPosition = data.mineReturnPosition || scene.mineReturnPosition;
  scene.inventory = Object.assign({ stone: 0, coal: 0, copperOre: 0, copperBars: 0, wood: 0 }, data.inventory || scene.inventory);
  scene.hotbarItems = data.hotbarItems || scene.hotbarItems;
  scene.backpackItems = data.backpackItems || scene.backpackItems;
  scene.selectedHotbarIndex = data.selectedHotbarIndex || 0;
  scene.pickaxeTier = data.pickaxeTier ?? 1;
  scene.pickaxeDamage = data.pickaxeDamage ?? (scene.pickaxeTier <= 0 ? 0 : scene.pickaxeTier);
  scene.pickaxeDurabilityMax = data.pickaxeDurabilityMax ?? getPickaxeDurabilityMax(scene.pickaxeTier);
  scene.pickaxeDurability = data.pickaxeDurability ?? scene.pickaxeDurabilityMax;
  scene.hasFurnace = !!data.hasFurnace;
  scene.hasCraftingTable = !!data.hasCraftingTable;
  scene.furnaceQueue = data.furnaceQueue || [];
  scene.furnaceOutput = data.furnaceOutput || { copperBars: 0 };
  scene.tableQueue = data.tableQueue || [];
  scene.tableOutput = Object.assign(createEmptyCraftingTableOutput(), data.tableOutput || {});
  scene.mineMaps = deserializeMapCollection(data.mineMaps || {});
  scene.homeMap = deserializeMap(data.homeMap || scene.homeMap);
  scene.mineEnemies = deserializeEnemyCollection(data.mineEnemies || {});

  if (data.currentMapName === 'home') switchToHome(scene);
  else switchToMine(scene, scene.mineLevel || 1);

  ensureEnemiesForCurrentMap(scene);
  updateInventoryUI(scene);
  updateHealthUI(scene);
  redraw(scene);
  setMessage(scene, 'Loaded save slot ' + slot + '.');
  return true;
}

function deserializeMapCollection(maps) {
  const output = {};
  Object.keys(maps || {}).forEach(level => {
    output[level] = deserializeMap(maps[level]);
  });
  return output;
}

function deserializeMap(map) {
  return map.map(row => row.map(data => makeTile(data.type, data)));
}


function deserializeEnemyCollection(collection) {
  const output = {};
  Object.keys(collection || {}).forEach(level => {
    output[level] = (collection[level] || []).map(enemy => ({
      id: enemy.id || ('enemy_' + level + '_' + Math.random()),
      type: enemy.type || 'slime',
      x: enemy.x || 0,
      y: enemy.y || 0,
      radius: enemy.radius || 8,
      maxHp: enemy.maxHp || 20,
      hp: enemy.hp || enemy.maxHp || 20,
      damage: enemy.damage || 8,
      speed: enemy.speed || 45,
      aggroRange: enemy.aggroRange || 160,
      attackRange: enemy.attackRange || 18,
      hitCooldownUntil: 0,
      wanderAngle: enemy.wanderAngle || 0,
      wanderTimer: enemy.wanderTimer || 800,
      knockbackX: 0,
      knockbackY: 0,
      dead: false
    }));
  });
  return output;
}
