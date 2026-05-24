
function handleMovement(scene, delta) {
  let dx = 0;
  let dy = 0;

  if (scene.cursors.left.isDown || scene.keys.a.isDown) dx -= 1;
  if (scene.cursors.right.isDown || scene.keys.d.isDown) dx += 1;
  if (scene.cursors.up.isDown || scene.keys.w.isDown) dy -= 1;
  if (scene.cursors.down.isDown || scene.keys.s.isDown) dy += 1;

  if (dx === 0 && dy === 0) {
    notePlayerMovementVisual(scene, false);
    return;
  }

  const length = Math.hypot(dx, dy) || 1;
  dx /= length;
  dy /= length;

  scene.lastMoveDirection = getCardinalDirection(dx, dy);
  notePlayerMovementVisual(scene, true);
  spawnFootstepDust(scene);

  const distance = scene.player.speed * (delta / 1000);
  moveWithCollision(scene, dx * distance, 0);
  moveWithCollision(scene, 0, dy * distance);

}

function getCardinalDirection(dx, dy) {
  if (Math.abs(dx) > Math.abs(dy)) return { x: Math.sign(dx), y: 0 };
  return { x: 0, y: Math.sign(dy) };
}

function moveWithCollision(scene, moveX, moveY) {
  const nextX = scene.player.x + moveX;
  const nextY = scene.player.y + moveY;

  if (!collidesAt(scene, nextX, nextY)) {
    scene.player.x = nextX;
    scene.player.y = nextY;
  }
}

function collidesAt(scene, px, py) {
  const r = scene.player.radius;
  const checkPoints = [
    { x: px - r, y: py - r },
    { x: px + r, y: py - r },
    { x: px - r, y: py + r },
    { x: px + r, y: py + r },
    { x: px, y: py - r },
    { x: px, y: py + r },
    { x: px - r, y: py },
    { x: px + r, y: py }
  ];

  return checkPoints.some(point => {
    const tile = getTileAtPixel(scene, point.x, point.y);
    return !tile || isSolidTile(tile);
  });
}

function isSolidTile(tile) {
  return !['floor', 'homeFloor', 'teleportPad', 'exit', 'exitUp', 'exitDown', 'torch'].includes(tile.type);
}

function getTileAtPixel(scene, px, py) {
  return getTile(scene, Math.floor(px / scene.tileSize), Math.floor(py / scene.tileSize));
}

function getTile(scene, tx, ty) {
  if (!scene.map[ty] || !scene.map[ty][tx]) return null;
  return scene.map[ty][tx];
}

function getPlayerTile(scene) {
  return {
    x: Math.floor(scene.player.x / scene.tileSize),
    y: Math.floor(scene.player.y / scene.tileSize)
  };
}

function getTargetTile(scene, range = 1) {
  const playerTile = getPlayerTile(scene);
  return {
    x: playerTile.x + scene.lastMoveDirection.x * range,
    y: playerTile.y + scene.lastMoveDirection.y * range
  };
}

function mineTargetTile(scene) {
  if (scene.mineCooldown) return;

  const target = getTargetTile(scene, 1);
  const tile = getTile(scene, target.x, target.y);
  if (!tile) return;

  const selectedItem = getSelectedHotbarItem(scene);
  const usingHands = !selectedItem;
  const selectedPickaxe = getSelectedPickaxeItem(scene);

  if (selectedItem && !selectedPickaxe) {
    setMessage(scene, 'Select a pickaxe or empty hotbar slot to mine.');
    return;
  }

  scene.mineCooldown = true;
  scene.time.delayedCall(getSelectedPickaxeDelay(scene), () => {
    scene.mineCooldown = false;
  });

  if (tile.type === 'stone') {
    hitResource(scene, tile, target.x, target.y, 'stone', usingHands ? 'stone by hand' : 'stone', 0x888888, '+10 Stone');
    return;
  }

  if (tile.type === 'wood') {
    hitResource(scene, tile, target.x, target.y, 'wood', usingHands ? 'wood by hand' : 'wood', 0xaa7744, '+5 Wood', 5);
    return;
  }

  if (tile.type === 'coal') {
    if (usingHands || getSelectedPickaxeTier(scene) <= 0) {
      setMessage(scene, 'Need a Pickaxe to mine Coal. Empty hands can only mine stone and wood.');
      return;
    }
    hitResource(scene, tile, target.x, target.y, 'coal', 'coal', 0x222222, '+10 Coal');
    return;
  }

  if (tile.type === 'copper') {
    if (usingHands || getSelectedPickaxeTier(scene) < 2) {
      setMessage(scene, 'Select a Stone Pickaxe or better to mine Copper.');
      return;
    }

    hitResource(scene, tile, target.x, target.y, 'copperOre', 'copper', 0xcc7744, '+10 Copper Ore');
    return;
  }

  if (tile.type === 'copperWall') {
    if (usingHands || getSelectedPickaxeTier(scene) < 3) {
      setMessage(scene, 'Select a Copper Pickaxe to break Copper Wall.');
      return;
    }

    hitResource(scene, tile, target.x, target.y, 'copperOre', 'copper wall', 0xff8844, '+5 Copper Ore', 5);
    return;
  }

  if (tile.type === 'caveWall') setMessage(scene, 'Cave wall is too hard to mine.');
  else setMessage(scene, 'Nothing mineable there.');
}

function hitResource(scene, tile, tx, ty, inventoryKey, label, particleColor, successMessage, yieldAmount = 10) {
  scene.cameras.main.shake(55, 0.0022);
  const miningDamage = getPickaxeMiningDamage(scene);
  tile.hp -= miningDamage;
  damagePickaxeDurability(scene, 1);
  spawnParticles(scene, tx, ty, particleColor);

  if (tile.hp <= 0) {
    scene.inventory[inventoryKey] = (scene.inventory[inventoryKey] || 0) + yieldAmount;
    scene.map[ty][tx] = makeTile(scene.currentMapName === 'home' ? 'homeFloor' : 'floor');
    spawnBreakBurst(scene, tx, ty, particleColor);
    setMessage(scene, successMessage);
  } else {
    setMessage(scene, label + ' HP: ' + Math.max(0, Math.ceil(tile.hp)) + '/' + tile.maxHp);
  }

  updateInventoryUI(scene);
}

function spawnParticles(scene, tx, ty, color) {
  spawnMiningParticles(scene, tx, ty, color, 8);
}
function tryUseMineExit(scene, tile) {
  if (scene.exitCooldown) return;
  scene.exitCooldown = true;
  scene.time.delayedCall(550, () => {
    scene.exitCooldown = false;
  });

  if (tile.type === 'exitUp') {
    if (scene.mineLevel <= 1) {
      switchToHome(scene);
      scene.player.x = scene.homePosition.x;
      scene.player.y = scene.homePosition.y;
      setMessage(scene, 'Returned home from Mine Level 1.');
      return;
    }

    switchToMine(scene, scene.mineLevel - 1);
    scene.player.x = (scene.mapWidth - 5.5) * scene.tileSize;
    scene.player.y = (scene.mapHeight - 4.5) * scene.tileSize;
    setMessage(scene, 'Mine Level ' + scene.mineLevel);
    return;
  }

  if (tile.type === 'exitDown') {
    const targetLevel = tile.targetLevel || scene.mineLevel + 1;
    const requiredTier = tile.requiredPickaxeTier || 1;

    if (targetLevel >= FIRST_LOCKED_MINE_LEVEL && scene.pickaxeTier < requiredTier) {
      setMessage(scene, 'Copper Wall blocks Level ' + targetLevel + '. Craft a Copper Pickaxe first.');
      return;
    }

    scene.maxUnlockedMineLevel = Math.max(scene.maxUnlockedMineLevel || STARTING_UNLOCKED_MINE_LEVELS, targetLevel);
    switchToMine(scene, targetLevel);
    scene.player.x = 3.5 * scene.tileSize;
    scene.player.y = 3.5 * scene.tileSize;
    setMessage(scene, 'Mine Level ' + scene.mineLevel);
  }
}
