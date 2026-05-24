const PLAYER_MAX_HEALTH = 100;
const PLAYER_ATTACK_RANGE = 42;
const PLAYER_ATTACK_COOLDOWN = 520;
const PLAYER_INVULN_MS = 650;

function setupCombat(scene) {
  scene.player.maxHealth = scene.player.maxHealth || PLAYER_MAX_HEALTH;
  scene.player.health = scene.player.health || scene.player.maxHealth;
  scene.player.attackCooldown = false;
  scene.player.invulnerableUntil = 0;
  scene.enemyLayer = scene.add.graphics().setDepth(4);
  scene.combatLayer = scene.add.graphics().setDepth(6);
  scene.mineEnemies = scene.mineEnemies || {};
  ensureEnemiesForCurrentMap(scene);
  updateHealthUI(scene);
}

function ensureEnemiesForCurrentMap(scene) {
  if (scene.currentMapName !== 'mine') {
    scene.enemies = [];
    return;
  }

  if (!scene.mineEnemies[scene.mineLevel]) {
    scene.mineEnemies[scene.mineLevel] = generateEnemiesForLevel(scene, scene.mineLevel);
  }

  scene.enemies = scene.mineEnemies[scene.mineLevel];
}

function generateEnemiesForLevel(scene, level) {
  const enemies = [];
  const count = Phaser.Math.Clamp(2 + Math.floor(level / 2), 2, 8);

  for (let i = 0; i < count; i++) {
    const spot = findEnemySpawnTile(scene);
    if (!spot) break;
    const isBat = level >= 3 && i % 3 === 2;
    enemies.push(makeEnemy(isBat ? 'bat' : 'slime', spot.x * scene.tileSize + scene.tileSize / 2, spot.y * scene.tileSize + scene.tileSize / 2, level));
  }

  return enemies;
}

function findEnemySpawnTile(scene) {
  for (let tries = 0; tries < 200; tries++) {
    const x = Phaser.Math.Between(5, scene.mapWidth - 6);
    const y = Phaser.Math.Between(5, scene.mapHeight - 5);
    const tile = getTile(scene, x, y);
    if (!isWalkableTile(tile)) continue;

    const px = x * scene.tileSize + scene.tileSize / 2;
    const py = y * scene.tileSize + scene.tileSize / 2;
    const dist = Phaser.Math.Distance.Between(px, py, scene.player.x, scene.player.y);
    if (dist > scene.tileSize * 6) return { x, y };
  }
  return null;
}

function makeEnemy(type, x, y, level) {
  const bat = type === 'bat';
  const hp = bat ? 16 + level * 3 : 22 + level * 4;
  return {
    id: 'enemy_' + Date.now() + '_' + Math.floor(Math.random() * 999999),
    type,
    x,
    y,
    radius: bat ? 7 : 9,
    maxHp: hp,
    hp,
    damage: bat ? 7 + Math.floor(level / 2) : 9 + Math.floor(level / 2),
    speed: bat ? 74 + level * 2 : 46 + level * 2,
    aggroRange: bat ? 210 : 165,
    attackRange: bat ? 18 : 20,
    hitCooldownUntil: 0,
    wanderAngle: Math.random() * Math.PI * 2,
    wanderTimer: Phaser.Math.Between(400, 1400),
    knockbackX: 0,
    knockbackY: 0,
    dead: false
  };
}

function updateCombat(scene, time, delta) {
  ensureEnemiesForCurrentMap(scene);


  if (scene.currentMapName !== 'mine') return;

  const dt = delta / 1000;
  for (const enemy of scene.enemies) {
    if (enemy.dead) continue;
    updateEnemy(scene, enemy, time, delta, dt);
  }

  scene.enemies = scene.enemies.filter(enemy => !enemy.dead);
  scene.mineEnemies[scene.mineLevel] = scene.enemies;
}

function updateEnemy(scene, enemy, time, delta, dt) {
  enemy.x += enemy.knockbackX * dt;
  enemy.y += enemy.knockbackY * dt;
  enemy.knockbackX *= 0.84;
  enemy.knockbackY *= 0.84;

  const dist = Phaser.Math.Distance.Between(enemy.x, enemy.y, scene.player.x, scene.player.y);
  let dx = 0;
  let dy = 0;

  if (dist <= enemy.aggroRange) {
    dx = scene.player.x - enemy.x;
    dy = scene.player.y - enemy.y;
  } else {
    enemy.wanderTimer -= delta;
    if (enemy.wanderTimer <= 0) {
      enemy.wanderAngle += Phaser.Math.FloatBetween(-1.4, 1.4);
      enemy.wanderTimer = Phaser.Math.Between(700, 1600);
    }
    dx = Math.cos(enemy.wanderAngle);
    dy = Math.sin(enemy.wanderAngle);
  }

  const len = Math.hypot(dx, dy) || 1;
  dx /= len;
  dy /= len;

  const moveAmount = enemy.speed * dt;
  moveEnemyWithCollision(scene, enemy, dx * moveAmount, 0);
  moveEnemyWithCollision(scene, enemy, 0, dy * moveAmount);

  if (dist <= enemy.attackRange && time >= enemy.hitCooldownUntil) {
    damagePlayer(scene, enemy.damage, enemy, time);
    enemy.hitCooldownUntil = time + 900;
  }
}

function moveEnemyWithCollision(scene, enemy, moveX, moveY) {
  const nx = enemy.x + moveX;
  const ny = enemy.y + moveY;
  if (!enemyCollidesAt(scene, enemy, nx, ny)) {
    enemy.x = nx;
    enemy.y = ny;
  } else {
    enemy.wanderAngle += Math.PI / 2;
  }
}

function enemyCollidesAt(scene, enemy, px, py) {
  const r = enemy.radius;
  const points = [
    { x: px - r, y: py - r },
    { x: px + r, y: py - r },
    { x: px - r, y: py + r },
    { x: px + r, y: py + r }
  ];
  return points.some(point => {
    const tile = getTileAtPixel(scene, point.x, point.y);
    return !tile || isSolidTile(tile);
  });
}

function playerAttack(scene, time) {
  if (scene.player.attackCooldown) return;

  const attackStats = getPlayerAttackStats(scene);
  if (!attackStats) {
    setMessage(scene, 'Select a sword in your hotbar to attack.');
    return;
  }
  const cooldown = Math.max(180, Math.round(PLAYER_ATTACK_COOLDOWN / Math.max(0.25, attackStats.speed || 1)));
  scene.player.attackCooldown = true;
  scene.time.delayedCall(cooldown, () => {
    scene.player.attackCooldown = false;
  });

  const dir = scene.lastMoveDirection || { x: 1, y: 0 };
  const ax = scene.player.x + dir.x * 22;
  const ay = scene.player.y + dir.y * 22;
  spawnAttackArc(scene, ax, ay);
  damageSelectedWeaponDurability(scene, 1);

  if (scene.currentMapName !== 'mine') {
    setMessage(scene, 'You swing your ' + attackStats.name + '.');
    return;
  }

  let hit = false;
  for (const enemy of scene.enemies) {
    if (enemy.dead) continue;
    const dist = Phaser.Math.Distance.Between(ax, ay, enemy.x, enemy.y);
    if (dist <= PLAYER_ATTACK_RANGE) {
      damageEnemy(scene, enemy, attackStats.damage * 6, dir);
      spawnFloatingDamage(scene, enemy.x, enemy.y - enemy.radius - 8, attackStats.damage * 6);
      hit = true;
      break;
    }
  }

  if (!hit) setMessage(scene, 'Attack missed.');
}

function damageEnemy(scene, enemy, amount, dir) {
  enemy.hp -= amount;
  enemy.knockbackX += dir.x * 180;
  enemy.knockbackY += dir.y * 180;
  scene.cameras.main.shake(45, 0.0012);
  enemy.hitFlashUntil = (scene.time?.now || 0) + 140;
  spawnHitParticles(scene, enemy.x, enemy.y, enemy.type === 'bat' ? 0x8844ff : 0x44dd66);

  if (enemy.hp <= 0) {
    enemy.dead = true;
    dropEnemyLoot(scene, enemy);
    setMessage(scene, enemy.type === 'bat' ? 'Bat defeated.' : 'Slime defeated.');
  } else {
    setMessage(scene, (enemy.type === 'bat' ? 'Bat' : 'Slime') + ' HP: ' + Math.max(0, enemy.hp) + '/' + enemy.maxHp);
  }
}

function damagePlayer(scene, amount, enemy, time) {
  if (time < scene.player.invulnerableUntil) return;

  scene.player.health = Math.max(0, scene.player.health - amount);
  scene.player.invulnerableUntil = time + PLAYER_INVULN_MS;

  const dx = scene.player.x - enemy.x;
  const dy = scene.player.y - enemy.y;
  const len = Math.hypot(dx, dy) || 1;
  moveWithCollision(scene, (dx / len) * 14, 0);
  moveWithCollision(scene, 0, (dy / len) * 14);

  scene.cameras.main.shake(90, 0.004);
  updateHealthUI(scene);

  if (scene.player.health <= 0) {
    handlePlayerDefeat(scene);
  } else {
    setMessage(scene, 'Ouch! HP ' + scene.player.health + '/' + scene.player.maxHealth);
  }
}

function handlePlayerDefeat(scene) {
  scene.player.health = scene.player.maxHealth;

  // Death fully resets enemy state. Any damaged/dead enemies are discarded so
  // mine levels repopulate with fresh full-health enemies when revisited.
  scene.mineEnemies = {};
  scene.enemies = [];

  switchToHome(scene);
  scene.player.x = scene.homePosition.x;
  scene.player.y = scene.homePosition.y;
  updateHealthUI(scene);
  setMessage(scene, 'You were knocked out and woke up at home. Enemies have returned to full strength.');
}

function healPlayer(scene, amount) {
  scene.player.health = Math.min(scene.player.maxHealth, scene.player.health + amount);
  updateHealthUI(scene);
}

function updateHealthUI(scene) {
  if (scene.healthText) scene.healthText.textContent = 'HP ' + scene.player.health + '/' + scene.player.maxHealth;
}

function dropEnemyLoot(scene, enemy) {
  if (enemy.type === 'bat') {
    scene.inventory.coal += 2;
    setMessage(scene, '+2 Coal');
  } else {
    scene.inventory.stone += 3;
    if (Phaser.Math.Between(1, 100) <= 25) scene.inventory.coal += 1;
    setMessage(scene, '+3 Stone');
  }
  updateInventoryUI(scene);
}

function spawnAttackArc(scene, x, y) {
  const marker = scene.add.ellipse(x, y, 34, 13, 0xffdd88, 0.40);
  marker.setDepth(30);
  marker.rotation = Math.atan2(scene.lastMoveDirection.y, scene.lastMoveDirection.x);
  scene.tweens.add({
    targets: marker,
    alpha: 0,
    scaleX: 1.9,
    scaleY: 0.35,
    duration: 160,
    onComplete: () => marker.destroy()
  });
}

function spawnHitParticles(scene, x, y, color) {
  for (let i = 0; i < 12; i++) {
    const particle = scene.add.rectangle(x, y, Phaser.Math.Between(2, 5), Phaser.Math.Between(2, 5), color);
    particle.setDepth(30);
    scene.tweens.add({
      targets: particle,
      x: x + Phaser.Math.Between(-18, 18),
      y: y + Phaser.Math.Between(-18, 18),
      alpha: 0,
      scaleX: 0.2,
      scaleY: 0.2,
      duration: Phaser.Math.Between(260, 460),
      onComplete: () => particle.destroy()
    });
  }
}

function spawnFloatingDamage(scene, x, y, amount) {
  const text = scene.add.text(x, y, '-' + Math.round(amount), {
    fontFamily: 'monospace',
    fontSize: '12px',
    color: '#ffdd88',
    stroke: '#000000',
    strokeThickness: 3
  });
  text.setOrigin(0.5);
  text.setDepth(35);
  scene.tweens.add({
    targets: text,
    y: y - 18,
    alpha: 0,
    duration: 520,
    onComplete: () => text.destroy()
  });
}

function drawEnemies(scene) {
  if (!scene.enemyLayer) return;
  scene.enemyLayer.clear();
  if (scene.currentMapName !== 'mine' || !scene.enemies) return;

  const time = scene.visualTime || scene.time?.now || 0;

  for (const enemy of scene.enemies) {
    if (enemy.dead) continue;

    const flash = time < (enemy.hitFlashUntil || 0);
    const bob = enemy.type === 'bat'
      ? Math.sin(time * 0.012 + enemy.x * 0.04) * 4
      : Math.abs(Math.sin(time * 0.006 + enemy.x * 0.02)) * 2;
    const drawY = enemy.y + (enemy.type === 'bat' ? bob : -bob);
    const squash = enemy.type === 'slime' ? 1 + Math.sin(time * 0.006 + enemy.x) * 0.08 : 1;

    scene.enemyLayer.fillStyle(0x000000, 0.35);
    scene.enemyLayer.fillEllipse(enemy.x, enemy.y + enemy.radius + 3, enemy.radius * 2.1, 6);

    if (enemy.type === 'bat') {
      const wingFlap = Math.sin(time * 0.018 + enemy.x) * 5;
      scene.enemyLayer.fillStyle(flash ? 0xffffff : 0x5b3baa);
      scene.enemyLayer.fillEllipse(enemy.x, drawY, 16, 11);
      scene.enemyLayer.fillStyle(flash ? 0xffe8ff : 0x7c5cff);
      scene.enemyLayer.fillTriangle(enemy.x - 7, drawY, enemy.x - 18, drawY - 6 - wingFlap, enemy.x - 18, drawY + 6 + wingFlap);
      scene.enemyLayer.fillTriangle(enemy.x + 7, drawY, enemy.x + 18, drawY - 6 - wingFlap, enemy.x + 18, drawY + 6 + wingFlap);
      scene.enemyLayer.fillStyle(0xffffff);
      scene.enemyLayer.fillRect(enemy.x - 4, drawY - 2, 2, 2);
      scene.enemyLayer.fillRect(enemy.x + 3, drawY - 2, 2, 2);
    } else {
      scene.enemyLayer.fillStyle(flash ? 0xffffff : 0x2f9b45);
      scene.enemyLayer.fillEllipse(enemy.x, drawY + 2, 21 * squash, 17 / squash);
      scene.enemyLayer.fillStyle(flash ? 0xdffff0 : 0x65e47a);
      scene.enemyLayer.fillEllipse(enemy.x - 3, drawY - 2, 11 * squash, 8 / squash);
      scene.enemyLayer.fillStyle(0x101010);
      scene.enemyLayer.fillRect(enemy.x - 5, drawY, 2, 2);
      scene.enemyLayer.fillRect(enemy.x + 4, drawY, 2, 2);
    }

    const barWidth = 22;
    const hpPct = Phaser.Math.Clamp(enemy.hp / enemy.maxHp, 0, 1);
    scene.enemyLayer.fillStyle(0x220000, 0.9);
    scene.enemyLayer.fillRect(enemy.x - barWidth / 2, drawY - enemy.radius - 9, barWidth, 4);
    scene.enemyLayer.fillStyle(0xff4444, 0.95);
    scene.enemyLayer.fillRect(enemy.x - barWidth / 2, drawY - enemy.radius - 9, barWidth * hpPct, 4);
  }
}
