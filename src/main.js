
class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  preload() {
    if (typeof preloadGameAssets === 'function') preloadGameAssets(this);
  }

  create() {
    window.__beneathActiveScene = this;
    this.tileSize = 26;
    this.mapWidth = 44;
    this.mapHeight = 24;
    this.mineWidth = 44;

    this.player = {
      x: 2.5 * this.tileSize,
      y: 2.5 * this.tileSize,
      radius: 8,
      speed: 128,
      maxHealth: PLAYER_MAX_HEALTH,
      health: PLAYER_MAX_HEALTH
    };

    this.lastMoveDirection = { x: 1, y: 0 };
    this.mineReturnPosition = { x: this.player.x, y: this.player.y, level: 1 };
    this.homePosition = {
      x: 33.5 * this.tileSize,
      y: 8.5 * this.tileSize
    };

    this.inventory = {
      stone: 0,
      coal: 0,
      copperOre: 0,
      copperBars: 0,
      wood: 0,
      ironOre: 0,
      obsidianOre: 0,
      goldOre: 0,
      ebonyOre: 0
    };

    this.pickaxeTier = 0;
    this.pickaxeDamage = 0;
    this.pickaxeDurabilityMax = 0;
    this.pickaxeDurability = 0;
    this.hasFurnace = false;
    this.hasCraftingTable = false;
    this.selectedHotbarIndex = 0;
    this.mineCooldown = false;

    this.inventoryOpen = false;
    this.craftingOpen = false;
    this.craftingTableOpen = false;
    this.chestOpen = false;

    this.furnaceQueue = [];
    this.furnaceOutput = { copperBars: 0 };
    this.tableQueue = [];
    this.tableOutput = createEmptyCraftingTableOutput();
    this.selectedCraftingTableRecipe = null;

    cacheDom(this);
    setupUiEvents(this);

    this.hotbarItems = [
      null,
      { id: 'teleportStone' },
      null,
      null,
      null,
      null,
      null,
      null
    ];

    this.backpackItems = [
      { id: 'stone' },
      { id: 'coal' },
      { id: 'copperOre' },
      { id: 'copperBars' },
      { id: 'wood' }
    ];

    while (this.backpackItems.length < 24) {
      this.backpackItems.push(null);
    }

    setupInventoryScreen(this);
    setupChestScreen(this);
    setupSaveMenuEvents(this);
    setupDevInventory(this);
    setupDevLevelWarp(this);
    generateMaps(this);
    if (typeof placePlayerAtMineSpawn === 'function') placePlayerAtMineSpawn(this, 'up');

    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys({
      w: Phaser.Input.Keyboard.KeyCodes.W,
      a: Phaser.Input.Keyboard.KeyCodes.A,
      s: Phaser.Input.Keyboard.KeyCodes.S,
      d: Phaser.Input.Keyboard.KeyCodes.D,
      inventory: Phaser.Input.Keyboard.KeyCodes.I,
      teleport: Phaser.Input.Keyboard.KeyCodes.T,
      place: Phaser.Input.Keyboard.KeyCodes.P,
      pickup: Phaser.Input.Keyboard.KeyCodes.X,
      attack: Phaser.Input.Keyboard.KeyCodes.F,
      interact: Phaser.Input.Keyboard.KeyCodes.E,
      escape: Phaser.Input.Keyboard.KeyCodes.ESC,
      hotbar1: Phaser.Input.Keyboard.KeyCodes.ONE,
      hotbar2: Phaser.Input.Keyboard.KeyCodes.TWO,
      hotbar3: Phaser.Input.Keyboard.KeyCodes.THREE,
      hotbar4: Phaser.Input.Keyboard.KeyCodes.FOUR,
      hotbar5: Phaser.Input.Keyboard.KeyCodes.FIVE,
      hotbar6: Phaser.Input.Keyboard.KeyCodes.SIX,
      hotbar7: Phaser.Input.Keyboard.KeyCodes.SEVEN,
      hotbar8: Phaser.Input.Keyboard.KeyCodes.EIGHT
    });

    this.worldLayer = this.add.graphics().setDepth(1);
    this.staticLevelLayer = this.add.container(0, 0).setDepth(1.06);
    this.staticLevelBackgroundKey = '';
    this.staticLevelBackgroundImage = null;
    if (typeof setupTerrainRenderer === 'function') setupTerrainRenderer(this);
    if (typeof setupAssetSpriteLayer === 'function') setupAssetSpriteLayer(this);
    this.playerLayer = this.add.graphics().setDepth(5);
    this.visualLayer = this.add.graphics().setDepth(7);
    setupVisualEffects(this);

    this.followTarget = this.add.zone(this.player.x, this.player.y, 1, 1);
    this.cameras.main.setBounds(0, 0, this.mapWidth * this.tileSize, this.mapHeight * this.tileSize);
    this.cameras.main.startFollow(this.followTarget, true, 0.08, 0.08);
    this.cameras.main.setDeadzone(120, 80);
    this.cameras.main.setZoom(1.5);

    setupCombat(this);
    setMessage(this, 'Mine Level 1. Empty hotbar slots use Hands. Mine stone and wood, then craft a Stone Pickaxe.');
    updateInventoryUI(this);
    if (typeof refreshTerrainSprites === 'function') refreshTerrainSprites(this, true);
    if (typeof refreshAssetSprites === 'function') refreshAssetSprites(this, true);
    redraw(this);
  }

  update(time, delta) {
    updateFurnaceQueue(this, delta);
    updateCraftingTableQueue(this, delta);

    if (Phaser.Input.Keyboard.JustDown(this.keys.escape)) {
      togglePauseMenu(this);
    }

    if (this.pauseMenuOpen || this.saveMenuOpen || this.loadMenuOpen || this.overwriteMenuOpen || this.loadConfirmOpen || this.devItemOpen || this.devLevelWarpOpen) {
      redraw(this);
      return;
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.inventory)) {
      toggleInventoryScreen(this);
    }

    handleHotbarNumberKeys(this);

    if (Phaser.Input.Keyboard.JustDown(this.keys.interact)) {
      handleInteract(this);
    }

    if (this.inventoryOpen || this.craftingOpen || this.craftingTableOpen || this.chestOpen) {
      redraw(this);
      return;
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.teleport)) {
      useTeleportStone(this);
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.place)) {
      placeHeldHomeObject(this);
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.pickup)) {
      pickupHomeObject(this);
    }

    handleMovement(this, delta);
    updateVisualEffects(this, time, delta);
    updateCombat(this, time, delta);

    if (Phaser.Input.Keyboard.JustDown(this.keys.attack)) {
      useSelectedHotbarItem(this, time);
    }

    this.followTarget.x = this.player.x;
    this.followTarget.y = this.player.y;
    redraw(this);
  }
}


function cacheDom(scene) {
  scene.messageBox = document.getElementById('message');
  scene.hotbarDisplaySlots = Array.from(document.querySelectorAll('#inventory .slot'));
  scene.healthText = document.getElementById('healthText');
  scene.inventoryScreen = document.getElementById('inventoryScreen');
  scene.hotbarGrid = document.getElementById('hotbarGrid');
  scene.backpackGrid = document.getElementById('backpackGrid');
  scene.inventoryDetailName = document.getElementById('inventoryDetailName');
  scene.inventoryDetailInfo = document.getElementById('inventoryDetailInfo');
  scene.inventoryDetailStats = document.getElementById('inventoryDetailStats');
  scene.inventoryDetailRecipe = document.getElementById('inventoryDetailRecipe');
  scene.deleteItemDropZone = document.getElementById('deleteItemDropZone');
  scene.deleteItemConfirmScreen = document.getElementById('deleteItemConfirmScreen');
  scene.deleteItemConfirmText = document.getElementById('deleteItemConfirmText');
  scene.confirmDeleteItemYes = document.getElementById('confirmDeleteItemYes');
  scene.confirmDeleteItemNo = document.getElementById('confirmDeleteItemNo');
  scene.craftingScreen = document.getElementById('craftingScreen');
  scene.craftingTableScreen = document.getElementById('craftingTableScreen');
  scene.chestScreen = document.getElementById('chestScreen');
  scene.chestTitle = document.getElementById('chestTitle');
  scene.chestGrid = document.getElementById('chestGrid');
  scene.closeChestButton = document.getElementById('closeChestButton');

  scene.craftCopperBarsButton = document.getElementById('craftCopperBars');
  scene.copperBarAmountSlider = document.getElementById('copperBarAmount');
  scene.copperBarAmountLabel = document.getElementById('copperBarAmountLabel');
  scene.collectFurnaceOutputButton = document.getElementById('collectFurnaceOutput');
  scene.closeCraftingButton = document.getElementById('closeCraftingMenu');
  scene.furnaceQueueItem = document.getElementById('furnaceQueueItem');
  scene.furnaceProgressInner = document.getElementById('furnaceProgressInner');
  scene.furnaceOutputItem = document.getElementById('furnaceOutputItem');

  scene.craftSelectedRecipeButton = document.getElementById('craftSelectedRecipe');
  scene.closeCraftingTableButton = document.getElementById('closeCraftingTable');
  scene.collectTableOutputButton = document.getElementById('collectTableOutput');
  scene.tableQueueItem = document.getElementById('tableQueueItem');
  scene.tableProgressInner = document.getElementById('tableProgressInner');
  scene.tableOutputItem = document.getElementById('tableOutputItem');
  scene.craftingRecipeGrid = document.getElementById('craftingRecipeGrid');
  if (scene.craftingRecipeGrid) {
    scene.craftingRecipeGrid.innerHTML = '';
    Object.values(craftingTableRecipes).forEach(recipe => {
      const button = document.createElement('button');
      button.className = 'craftRecipeSlot';
      button.dataset.recipe = recipe.id;
      button.textContent = recipe.name;
      scene.craftingRecipeGrid.appendChild(button);
    });
  }
  scene.craftingRecipeButtons = Array.from(document.querySelectorAll('.craftRecipeSlot'));
}

function setupUiEvents(scene) {
  scene.hotbarDisplaySlots.forEach((slot, index) => {
    slot.addEventListener('click', () => selectHotbarSlot(scene, index));
  });
  scene.craftCopperBarsButton?.addEventListener('click', () => craftCopperBars(scene));
  scene.copperBarAmountSlider?.addEventListener('input', () => {
    scene.copperBarAmountLabel.textContent = scene.copperBarAmountSlider.value;
  });
  scene.collectFurnaceOutputButton?.addEventListener('click', () => collectFurnaceOutput(scene));
  scene.closeCraftingButton?.addEventListener('click', () => closeCraftingMenu(scene));

  scene.craftingRecipeButtons.forEach(button => {
    button.addEventListener('click', () => selectCraftingTableRecipe(scene, button.dataset.recipe));
  });

  scene.craftSelectedRecipeButton?.addEventListener('click', () => startCraftingTableRecipe(scene));
  scene.closeCraftingTableButton?.addEventListener('click', () => closeCraftingTableMenu(scene));
  scene.collectTableOutputButton?.addEventListener('click', () => collectCraftingTableOutput(scene));
}

const config = {
  type: Phaser.AUTO,
  width: 900,
  height: 620,
  backgroundColor: '#000000',
  scene: [GameScene],
  pixelArt: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  }
};

new Phaser.Game(config);
