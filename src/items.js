const ITEM_CATEGORIES = [
  { id: 'resources', name: 'Resources' },
  { id: 'tools', name: 'Tools' },
  { id: 'weapons', name: 'Weapons' },
  { id: 'armor', name: 'Armor' },
  { id: 'placeables', name: 'Placeables' },
  { id: 'special', name: 'Special' }
];

const ITEMS = {
  stone: {
    id: 'stone', name: 'Stone', category: 'resources', stackable: true, maxAmount: 999,
    info: 'Basic mined resource. Used for early tools, weapons, and furnaces.',
    source: 'Found by mining stone blocks.'
  },
  coal: {
    id: 'coal', name: 'Coal', category: 'resources', stackable: true, maxAmount: 999,
    info: 'Fuel resource used by the furnace.',
    source: 'Found by mining coal blocks.'
  },
  copperOre: {
    id: 'copperOre', name: 'Copper Ore', category: 'resources', stackable: true, maxAmount: 999,
    info: 'Ore resource smelted into Copper Bars.',
    source: 'Found by mining copper ore blocks.'
  },
  copperBars: {
    id: 'copperBars', name: 'Copper Bars', category: 'resources', stackable: true, maxAmount: 999,
    info: 'Refined copper used for copper tools and weapons.',
    source: 'Furnace: Copper Ore + Coal.'
  },
  wood: {
    id: 'wood', name: 'Wood', category: 'resources', stackable: true, maxAmount: 999,
    info: 'Handle material used for tools.',
    source: 'Found by mining wood blocks in the mine.'
  },

  rustyPickaxe: {
    id: 'rustyPickaxe', name: 'Rusty Pickaxe', category: 'tools', toolType: 'pickaxe', tier: 1,
    miningDamage: 1, durabilityMax: 70, maxAmount: 1,
    info: 'Starter pickaxe. Can mine basic stone and coal.',
    source: 'Starter item.'
  },
  stonePickaxe: {
    id: 'stonePickaxe', name: 'Stone Pickaxe', category: 'tools', toolType: 'pickaxe', tier: 2,
    miningDamage: 2, durabilityMax: 120, maxAmount: 1,
    info: 'Stronger pickaxe. Can break copper ore blocks.',
    recipe: { station: 'Crafting Table', costs: { stone: 10, wood: 2 }, timePerItem: 10000 }
  },
  copperPickaxe: {
    id: 'copperPickaxe', name: 'Copper Pickaxe', category: 'tools', toolType: 'pickaxe', tier: 3,
    miningDamage: 3, durabilityMax: 180, maxAmount: 1,
    info: 'Copper-tier pickaxe. Breaks copper walls and unlocks deeper mine levels.',
    recipe: { station: 'Crafting Table', costs: { copperBars: 5, wood: 2 }, timePerItem: 15000 }
  },

  stoneSword: {
    id: 'stoneSword', name: 'Stone Sword', category: 'weapons', weaponType: 'sword',
    damage: 3, speed: 1.0, effects: [], durabilityMax: 80, maxAmount: 1,
    info: 'Balanced early melee weapon.',
    recipe: { station: 'Crafting Table', costs: { stone: 10 }, timePerItem: 5000 }
  },
  copperSword: {
    id: 'copperSword', name: 'Copper Sword', category: 'weapons', weaponType: 'sword',
    damage: 5, speed: 1.0, effects: [], durabilityMax: 120, maxAmount: 1,
    info: 'Stronger balanced melee weapon.',
    recipe: { station: 'Crafting Table', costs: { copperBars: 5 }, timePerItem: 7000 }
  },

  furnace: {
    id: 'furnace', name: 'Furnace', category: 'placeables', placeable: true, maxAmount: 1,
    info: 'Placeable home workstation used to smelt ores into bars.',
    recipe: { station: 'Crafting Table', costs: { stone: 20 }, timePerItem: 15000 }
  },
  woodChest: {
    id: 'woodChest', name: 'Wood Chest', category: 'placeables', placeable: true, storageSlots: 8, maxAmount: 1,
    info: 'Small placeable storage chest for your home base.',
    recipe: { station: 'Crafting Table', costs: { wood: 10 }, timePerItem: 6000 }
  },
  copperChest: {
    id: 'copperChest', name: 'Copper Chest', category: 'placeables', placeable: true, storageSlots: 16, maxAmount: 1,
    info: 'Larger placeable storage chest for your home base.',
    recipe: { station: 'Crafting Table', costs: { copperBars: 10, wood: 4 }, timePerItem: 9000 }
  },
  craftingTable: {
    id: 'craftingTable', name: 'Workbench', category: 'placeables', placeable: true, maxAmount: 1,
    info: 'Placeable home workstation used to craft tools, weapons, and placeables.',
    source: 'Starter home object; can be picked up and moved.'
  },
  teleportStone: {
    id: 'teleportStone', name: 'Teleport Stone', category: 'special', maxAmount: 1,
    info: 'Returns you between home and your last mine position.',
    source: 'Starter item.'
  }
};

function getItemDef(id) {
  if (!id) return null;
  if (id === 'pickaxe') return getItemDef('rustyPickaxe');
  return ITEMS[id] || null;
}

function getItemName(id) {
  return getItemDef(id)?.name || id || '';
}

function getItemsByCategory(categoryId) {
  return Object.values(ITEMS).filter(item => item.category === categoryId);
}

function formatCosts(costs) {
  if (!costs) return '';
  return Object.entries(costs)
    .map(([id, amount]) => amount + ' ' + getItemName(id))
    .join(' + ');
}

function getRecipeText(item) {
  if (item.recipe) return item.recipe.station + ': ' + formatCosts(item.recipe.costs) + '.';
  return item.source || 'No recipe/source listed yet.';
}

function getItemStatsText(item) {
  const lines = [];
  if (item.category === 'resources') lines.push('Stacked resource.');
  if (item.toolType === 'pickaxe') {
    lines.push('Tool: Pickaxe');
    lines.push('Damage: ' + item.miningDamage);
    lines.push('Durability: ' + item.durabilityMax);
  }
  if (item.category === 'weapons') {
    lines.push('Type: ' + (item.weaponType || 'weapon'));
    lines.push('Damage: ' + item.damage);
    lines.push('Speed: ' + item.speed);
    lines.push('Effects: ' + ((item.effects && item.effects.length) ? item.effects.join(', ') : 'none'));
    lines.push('Durability: ' + item.durabilityMax);
  }
  if (item.placeable) lines.push('Placeable: Home only.');
  if (item.storageSlots) lines.push('Storage Slots: ' + item.storageSlots);
  if (item.category === 'special') lines.push('Utility item.');
  return lines.join('\n');
}

function createItemInstance(id) {
  const item = getItemDef(id);
  if (!item) return { id };
  const instance = { id };
  if (item.category === 'weapons' || item.toolType === 'pickaxe') {
    instance.durability = item.durabilityMax;
    instance.durabilityMax = item.durabilityMax;
  }
  return instance;
}

function getCraftingTableRecipes() {
  const ids = ['stonePickaxe', 'copperPickaxe', 'stoneSword', 'copperSword', 'furnace', 'woodChest', 'copperChest'];
  const recipes = {};
  ids.forEach(id => {
    const item = getItemDef(id);
    if (!item?.recipe) return;
    recipes[id] = {
      id,
      name: item.name,
      description: item.info + (item.category === 'weapons' ? ' Damage ' + item.damage + ', Speed ' + item.speed + ', Effects ' + ((item.effects && item.effects.length) ? item.effects.join(', ') : 'none') + '.' : ''),
      requirements: formatCosts(item.recipe.costs),
      costs: item.recipe.costs,
      timePerItem: item.recipe.timePerItem
    };
  });
  return recipes;
}

function createEmptyCraftingTableOutput() {
  const output = {};
  Object.keys(getCraftingTableRecipes()).forEach(id => output[id] = 0);
  return output;
}
