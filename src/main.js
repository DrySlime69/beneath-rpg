class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  create() {
    this.tileSize = 26;
    this.mineWidth = 25;
    this.mapWidth = 44;
    this.mapHeight = 18;

    this.inventory = {
      stone: 0,
      coal: 0,
      copperOre: 0,
      copperBars: 0
    };

    this.pickaxeTier = 1;
    this.pickaxeDamage = 1;
    this.hasFurnace = false;

    this.mineCooldown = false;
    this.moveCooldown = false;

    this.inventoryOpen = false;
    this.craftingOpen = false;
    this.craftingTableOpen = false;

    this.furnaceQueue = [];

    this.furnaceOutput = {
      copperBars: 0
    };

    this.lastMoveDirection = {
      x: 1,
      y: 0
    };

    this.mineReturnPosition = {
      x: 2,
      y: 2
    };

    this.homePosition = {
      x: 33,
      y: 8
    };

    this.minePlacedObjects = [];
    this.homePlacedObjects = [];

    this.messageBox =
      document.getElementById('message');

    this.hotbarDisplaySlots = Array.from(
      document.querySelectorAll('#inventory .slot')
    );

    this.inventoryScreen =
      document.getElementById('inventoryScreen');

    this.hotbarGrid =
      document.getElementById('hotbarGrid');

    this.backpackGrid =
      document.getElementById('backpackGrid');

    this.craftingScreen =
      document.getElementById('craftingScreen');

    this.craftCopperBarsButton =
      document.getElementById('craftCopperBars');

    this.copperBarAmountSlider =
      document.getElementById('copperBarAmount');

    this.copperBarAmountLabel =
      document.getElementById('copperBarAmountLabel');

    this.collectFurnaceOutputButton =
      document.getElementById('collectFurnaceOutput');

    this.closeCraftingButton =
      document.getElementById('closeCraftingMenu');

    this.craftingTableScreen =
      document.getElementById('craftingTableScreen');

    this.craftStonePickaxeButton =
      document.getElementById('craftStonePickaxe');

    this.craftFurnaceButton =
      document.getElementById('craftFurnace');

    this.closeCraftingTableButton =
      document.getElementById('closeCraftingTable');

    if (this.craftCopperBarsButton) {
      this.craftCopperBarsButton.addEventListener(
        'click',
        () => {
          if (
            typeof craftCopperBars ===
            'function'
          ) {
            craftCopperBars(this);
          }
        }
      );
    }

    if (this.copperBarAmountSlider) {
      this.copperBarAmountSlider.addEventListener(
        'input',
        () => {
          if (this.copperBarAmountLabel) {
            this.copperBarAmountLabel.textContent =
              this.copperBarAmountSlider.value;
          }
        }
      );
    }

    if (this.collectFurnaceOutputButton) {
      this.collectFurnaceOutputButton.addEventListener(
        'click',
        () => {
          if (
            typeof collectFurnaceOutput ===
            'function'
          ) {
            collectFurnaceOutput(this);
          }
        }
      );
    }

    if (this.closeCraftingButton) {
      this.closeCraftingButton.addEventListener(
        'click',
        () => {
          if (
            typeof closeCraftingMenu ===
            'function'
          ) {
            closeCraftingMenu(this);
          }
        }
      );
    }

    if (this.craftStonePickaxeButton) {
      this.craftStonePickaxeButton.addEventListener(
        'click',
        () => {
          if (
            typeof craftStonePickaxeAtTable ===
            'function'
          ) {
            craftStonePickaxeAtTable(this);
          }
        }
      );
    }

    if (this.craftFurnaceButton) {
      this.craftFurnaceButton.addEventListener(
        'click',
        () => {
          if (
            typeof craftFurnaceAtTable ===
            'function'
          ) {
            craftFurnaceAtTable(this);
          }
        }
      );
    }

    if (this.closeCraftingTableButton) {
      this.closeCraftingTableButton.addEventListener(
        'click',
        () => {
          if (
            typeof closeCraftingTableMenu ===
            'function'
          ) {
            closeCraftingTableMenu(this);
          }
        }
      );
    }

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
      { id: 'copperBars' },
      { id: 'furnace' }
    ];

    while (this.backpackItems.length < 24) {
      this.backpackItems.push(null);
    }

    setupInventoryScreen(this);

    this.cursors =
      this.input.keyboard.createCursorKeys();

    this.mineKey =
      this.input.keyboard.addKey(
        Phaser.Input.Keyboard.KeyCodes.SPACE
      );

    this.inventoryKey =
      this.input.keyboard.addKey(
        Phaser.Input.Keyboard.KeyCodes.I
      );

    this.teleportKey =
      this.input.keyboard.addKey(
        Phaser.Input.Keyboard.KeyCodes.T
      );

    this.placeKey =
      this.input.keyboard.addKey(
        Phaser.Input.Keyboard.KeyCodes.P
      );

    this.interactKey =
      this.input.keyboard.addKey(
        Phaser.Input.Keyboard.KeyCodes.E
      );

    generateMaps(this);

    this.player = {
      x: 2,
      y: 2
    };

    this.worldLayer =
      this.add.graphics();

    this.objectLayer =
      this.add.graphics();

    this.playerLayer =
      this.add.graphics();

    this.worldLayer.setDepth(1);
    this.objectLayer.setDepth(4);
    this.playerLayer.setDepth(5);

    this.followTarget = this.add.zone(
      this.player.x * this.tileSize +
        this.tileSize / 2,

      this.player.y * this.tileSize +
        this.tileSize / 2,

      1,
      1
    );

    this.cameras.main.setBounds(
      0,
      0,
      this.mapWidth * this.tileSize,
      this.mapHeight * this.tileSize
    );

    this.cameras.main.startFollow(
      this.followTarget,
      true,
      0.06,
      0.06
    );

    this.cameras.main.setDeadzone(
      120,
      80
    );

    this.cameras.main.setZoom(1.5);

    setMessage(this, '');

    updateInventoryUI(this);

    redraw(this);
  }

  update(time, delta) {
    if (
      typeof updateFurnaceQueue ===
      'function'
    ) {
      updateFurnaceQueue(this, delta);
    }

    if (
      Phaser.Input.Keyboard.JustDown(
        this.inventoryKey
      )
    ) {
      toggleInventoryScreen(this);
    }

    if (
      Phaser.Input.Keyboard.JustDown(
        this.interactKey
      )
    ) {
      this.handleInteract();
    }

    if (
      this.inventoryOpen ||
      this.craftingOpen ||
      this.craftingTableOpen
    ) {
      return;
    }

    if (
      Phaser.Input.Keyboard.JustDown(
        this.teleportKey
      )
    ) {
      useTeleportStone(this);
    }

    if (
      Phaser.Input.Keyboard.JustDown(
        this.placeKey
      )
    ) {
      placeFurnace(this);
    }

    handleMovement(this);

    if (
      Phaser.Input.Keyboard.JustDown(
        this.mineKey
      )
    ) {
      mineAdjacentTile(this);
    }

    this.followTarget.x =
      this.player.x * this.tileSize +
      this.tileSize / 2;

    this.followTarget.y =
      this.player.y * this.tileSize +
      this.tileSize / 2;
  }

  handleInteract() {
    const tx =
      this.player.x +
      this.lastMoveDirection.x;

    const ty =
      this.player.y +
      this.lastMoveDirection.y;

    const tile = this.map[ty]
      ? this.map[ty][tx]
      : null;

    if (!tile) {
      setMessage(this, 'Nothing to interact with.');
      return;
    }

    if (tile.type === 'furnace') {
      if (
        typeof toggleCraftingMenu ===
        'function'
      ) {
        toggleCraftingMenu(this);
      }

      return;
    }

    if (tile.type === 'craftingTable') {
      if (
        typeof toggleCraftingTableMenu ===
        'function'
      ) {
        toggleCraftingTableMenu(this);
      }

      return;
    }

    setMessage(this, 'Nothing to interact with.');
  }
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

    autoCenter:
      Phaser.Scale.CENTER_BOTH
  }
};

new Phaser.Game(config);
