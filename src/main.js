
class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  create() {
    this.tileSize = 26;
    this.mapWidth = 44;
    this.mapHeight = 24;
    this.mineWidth = 44;

    this.player = {
      x: 2.5 * this.tileSize,
      y: 2.5 * this.tileSize,
      radius: 8,
      speed: 128
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
      copperBars: 0
    };

    this.pickaxeTier = 1;
    this.pickaxeDamage = 1;
    this.hasFurnace = false;
    this.hasCraftingTable = false;
    this.selectedHotbarIndex = 0;
    this.mineCooldown = false;

    this.inventoryOpen = false;
    this.craftingOpen = false;
    this.craftingTableOpen = false;

    this.furnaceQueue = [];
    this.furnaceOutput = { copperBars: 0 };
    this.tableQueue = [];
    this.tableOutput = { stonePickaxe: 0, copperPickaxe: 0, furnace: 0 };
    this.selectedCraftingTableRecipe = null;

    cacheDom(this);
    setupUiEvents(this);

    this.hotbarItems = [
      { id: 'pickaxe' },
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
      { id: 'copperBars' }
    ];

    while (this.backpackItems.length < 24) {
      this.backpackItems.push(null);
    }

    setupInventoryScreen(this);
    generateMaps(this);

    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys({
      w: Phaser.Input.Keyboard.KeyCodes.W,
      a: Phaser.Input.Keyboard.KeyCodes.A,
      s: Phaser.Input.Keyboard.KeyCodes.S,
      d: Phaser.Input.Keyboard.KeyCodes.D,
      mine: Phaser.Input.Keyboard.KeyCodes.SPACE,
      inventory: Phaser.Input.Keyboard.KeyCodes.I,
      teleport: Phaser.Input.Keyboard.KeyCodes.T,
      place: Phaser.Input.Keyboard.KeyCodes.P,
      pickup: Phaser.Input.Keyboard.KeyCodes.X,
      interact: Phaser.Input.Keyboard.KeyCodes.E,
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
    this.playerLayer = this.add.graphics().setDepth(5);

    this.followTarget = this.add.zone(this.player.x, this.player.y, 1, 1);
    this.cameras.main.setBounds(0, 0, this.mapWidth * this.tileSize, this.mapHeight * this.tileSize);
    this.cameras.main.startFollow(this.followTarget, true, 0.08, 0.08);
    this.cameras.main.setDeadzone(120, 80);
    this.cameras.main.setZoom(1.5);

    setMessage(this, 'Mine Level 1. Levels 1-5 are open. Craft Copper Pickaxe for Level 6.');
    updateInventoryUI(this);
    redraw(this);
  }

  update(time, delta) {
    updateFurnaceQueue(this, delta);
    updateCraftingTableQueue(this, delta);

    if (Phaser.Input.Keyboard.JustDown(this.keys.inventory)) {
      toggleInventoryScreen(this);
    }

    handleHotbarNumberKeys(this);

    if (Phaser.Input.Keyboard.JustDown(this.keys.interact)) {
      handleInteract(this);
    }

    if (this.inventoryOpen || this.craftingOpen || this.craftingTableOpen) {
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

    if (Phaser.Input.Keyboard.JustDown(this.keys.mine)) {
      mineTargetTile(this);
    }

    this.followTarget.x = this.player.x;
    this.followTarget.y = this.player.y;
    redraw(this);
  }
}

function cacheDom(scene) {
  scene.messageBox = document.getElementById('message');
  scene.hotbarDisplaySlots = Array.from(document.querySelectorAll('#inventory .slot'));
  scene.inventoryScreen = document.getElementById('inventoryScreen');
  scene.hotbarGrid = document.getElementById('hotbarGrid');
  scene.backpackGrid = document.getElementById('backpackGrid');
  scene.craftingScreen = document.getElementById('craftingScreen');
  scene.craftingTableScreen = document.getElementById('craftingTableScreen');

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
