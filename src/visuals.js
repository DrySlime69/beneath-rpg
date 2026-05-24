const TORCH_LIGHT_RADIUS = 5.7;
const PLAYER_LIGHT_RADIUS = 8.4;
const HOME_PLAYER_LIGHT_RADIUS = 12.8;
const HOME_STRING_LIGHT_RADIUS = 4.8;
const HOME_FURNACE_LIGHT_RADIUS = 5.2;

const HOME_STRING_LIGHTS = [
  { x1: 28.6, y1: 5.55, x2: 38.4, y2: 5.55, bulbs: [29.3, 31.1, 33.0, 34.9, 36.8, 38.1] },
  { x1: 29.3, y1: 9.55, x2: 37.7, y2: 9.55, bulbs: [30.0, 32.0, 34.0, 36.0, 37.3] }
];

function setupVisualEffects(scene) {
  scene.visualTime = 0;
  scene.walkBob = 0;
  scene.playerIsMoving = false;
  scene.ambientMotes = [];
  scene.lastFootstepDustAt = 0;

  for (let i = 0; i < 34; i++) {
    scene.ambientMotes.push(createAmbientMote(scene, true));
  }
}

function createAmbientMote(scene, anywhere = false) {
  const cam = scene.cameras?.main;
  const worldX = anywhere || !cam ? Phaser.Math.Between(0, scene.mapWidth * scene.tileSize) : Phaser.Math.Between(cam.worldView.x - 60, cam.worldView.right + 60);
  const worldY = anywhere || !cam ? Phaser.Math.Between(0, scene.mapHeight * scene.tileSize) : Phaser.Math.Between(cam.worldView.y - 60, cam.worldView.bottom + 60);
  return {
    x: worldX,
    y: worldY,
    vx: Phaser.Math.FloatBetween(-2.5, 2.5),
    vy: Phaser.Math.FloatBetween(-5.5, -1.5),
    size: Phaser.Math.Between(1, 2),
    alpha: Phaser.Math.FloatBetween(0.12, 0.35),
    seed: Phaser.Math.FloatBetween(0, Math.PI * 2)
  };
}

function updateVisualEffects(scene, time, delta) {
  scene.visualTime = time || 0;
  const dt = delta / 1000;
  const cam = scene.cameras?.main;
  if (!cam || !scene.ambientMotes) return;

  for (let i = 0; i < scene.ambientMotes.length; i++) {
    const mote = scene.ambientMotes[i];
    mote.x += mote.vx * dt + Math.sin(time * 0.001 + mote.seed) * 0.04;
    mote.y += mote.vy * dt;

    if (mote.x < cam.worldView.x - 80 || mote.x > cam.worldView.right + 80 || mote.y < cam.worldView.y - 80 || mote.y > cam.worldView.bottom + 80) {
      scene.ambientMotes[i] = createAmbientMote(scene, false);
      scene.ambientMotes[i].y = cam.worldView.bottom + Phaser.Math.Between(8, 80);
    }
  }
}

function notePlayerMovementVisual(scene, moving) {
  scene.playerIsMoving = moving;
  if (moving) scene.walkBob = (scene.walkBob || 0) + 0.24;
}

function spawnFootstepDust(scene) {
  const now = scene.time?.now || 0;
  if (now - (scene.lastFootstepDustAt || 0) < 130) return;
  scene.lastFootstepDustAt = now;
  const color = scene.currentMapName === 'home' ? 0x6e4a28 : 0x555555;
  for (let i = 0; i < 2; i++) {
    const particle = scene.add.rectangle(
      scene.player.x + Phaser.Math.Between(-5, 5),
      scene.player.y + Phaser.Math.Between(5, 11),
      Phaser.Math.Between(2, 3),
      Phaser.Math.Between(1, 2),
      color,
      0.5
    );
    particle.setDepth(3);
    scene.tweens.add({
      targets: particle,
      x: particle.x + Phaser.Math.Between(-8, 8),
      y: particle.y + Phaser.Math.Between(1, 6),
      alpha: 0,
      duration: 260,
      onComplete: () => particle.destroy()
    });
  }
}

function getTorchFlicker(scene, x, y) {
  const t = (scene.visualTime || scene.time?.now || 0) * 0.005;
  return 0.84 + Math.sin(t + x * 1.7 + y * 0.9) * 0.10 + Math.sin(t * 2.3 + x) * 0.06;
}

function getTorchLightAt(scene, tileX, tileY) {
  if (!scene.torchLights || scene.currentMapName !== 'mine') return 0;
  let light = 0;
  for (const torch of scene.torchLights) {
    const dist = Phaser.Math.Distance.Between(tileX + 0.5, tileY + 0.5, torch.x + 0.5, torch.y + 0.5);
    if (dist > TORCH_LIGHT_RADIUS) continue;
    const strength = Phaser.Math.Clamp(1 - dist / TORCH_LIGHT_RADIUS, 0, 1);
    light = Math.max(light, strength * strength * getTorchFlicker(scene, torch.x, torch.y));
  }
  return light;
}

function rebuildTorchLights(scene) {
  scene.torchLights = [];
  if (!scene.map) return;
  for (let y = 0; y < scene.mapHeight; y++) {
    for (let x = 0; x < scene.mapWidth; x++) {
      if (scene.map[y]?.[x]?.type === 'torch') scene.torchLights.push({ x, y });
    }
  }
}


function getHomeWarmLightAt(scene, tileX, tileY) {
  if (scene.currentMapName !== 'home' || !scene.map) return 0;
  let light = 0;
  const t = (scene.visualTime || scene.time?.now || 0) * 0.004;

  for (const strand of HOME_STRING_LIGHTS) {
    for (const bulbX of strand.bulbs) {
      const dist = Phaser.Math.Distance.Between(tileX + 0.5, tileY + 0.5, bulbX, strand.y1 + 0.55);
      if (dist <= HOME_STRING_LIGHT_RADIUS) {
        const flicker = 0.92 + Math.sin(t + bulbX * 1.3 + strand.y1 * 0.7) * 0.07 + Math.sin(t * 2.1 + bulbX) * 0.04;
        const strength = Phaser.Math.Clamp(1 - dist / HOME_STRING_LIGHT_RADIUS, 0, 1);
        light = Math.max(light, strength * strength * flicker * 0.95);
      }
    }
  }

  for (let y = 0; y < scene.mapHeight; y++) {
    for (let x = 0; x < scene.mapWidth; x++) {
      const tile = scene.map[y]?.[x];
      if (!tile) continue;

      if (tile.type === 'furnace') {
        const dist = Phaser.Math.Distance.Between(tileX + 0.5, tileY + 0.5, x + 0.5, y + 0.5);
        if (dist <= HOME_FURNACE_LIGHT_RADIUS) {
          const working = scene.furnaceQueue && scene.furnaceQueue.length > 0;
          const flicker = (working ? 0.95 : 0.78) + Math.sin(t * 1.8 + x) * 0.08;
          const strength = Phaser.Math.Clamp(1 - dist / HOME_FURNACE_LIGHT_RADIUS, 0, 1);
          light = Math.max(light, strength * strength * flicker * 0.55);
        }
      }
    }
  }

  return light;
}

function drawHomeStringLight(scene, x, y, brightness) {
  const px = x * scene.tileSize;
  const py = y * scene.tileSize;
  const s = scene.tileSize;
  const t = (scene.visualTime || 0) * 0.004;
  const glow = 0.88 + Math.sin(t + x * 1.7 + y) * 0.12;

  scene.worldLayer.lineStyle(2, darkenColor(0x1b1008, Math.max(0.7, brightness)), 0.95);
  scene.worldLayer.lineBetween(px + 1, py + 4, px + s - 1, py + 5);

  scene.worldLayer.fillStyle(0xffb02e, 0.22 * glow);
  scene.worldLayer.fillCircle(px + s / 2, py + 12, 18);
  scene.worldLayer.fillStyle(0xffd36a, 0.96);
  scene.worldLayer.fillCircle(px + s / 2, py + 10, 4);
  scene.worldLayer.fillStyle(0xffffd0, 0.85);
  scene.worldLayer.fillCircle(px + s / 2 - 1, py + 9, 2);
}

function drawHomeStringLightStrands(scene) {
  if (scene.currentMapName !== 'home' || !scene.worldLayer) return;
  const s = scene.tileSize;
  const t = (scene.visualTime || 0) * 0.004;

  for (const strand of HOME_STRING_LIGHTS) {
    const y = strand.y1 * s;
    scene.worldLayer.lineStyle(3, 0x140a04, 0.95);
    scene.worldLayer.beginPath();
    scene.worldLayer.moveTo(strand.x1 * s, y);
    scene.worldLayer.lineTo(strand.x2 * s, y);
    scene.worldLayer.strokePath();

    for (const bulbX of strand.bulbs) {
      const bx = bulbX * s;
      const flicker = 0.86 + Math.sin(t + bulbX * 2.3) * 0.12 + Math.sin(t * 1.7 + bulbX) * 0.05;
      scene.worldLayer.lineStyle(1, 0x201006, 1);
      scene.worldLayer.lineBetween(bx, y, bx, y + 7);
      scene.worldLayer.fillStyle(0xffa12a, 0.32 * flicker);
      scene.worldLayer.fillCircle(bx, y + 10, 24);
      scene.worldLayer.fillStyle(0xffc64a, 0.55 * flicker);
      scene.worldLayer.fillCircle(bx, y + 10, 13);
      scene.worldLayer.fillStyle(0xffe27a, 1);
      scene.worldLayer.fillCircle(bx, y + 10, 5);
      scene.worldLayer.fillStyle(0xffffdb, 0.9);
      scene.worldLayer.fillCircle(bx - 1, y + 8, 2);
    }
  }
}

function drawTorch(scene, x, y, brightness) {
  const px = x * scene.tileSize;
  const py = y * scene.tileSize;
  const s = scene.tileSize;
  const flicker = getTorchFlicker(scene, x, y);
  scene.worldLayer.fillStyle(darkenColor(0x2a1b10, brightness));
  scene.worldLayer.fillRect(px + s / 2 - 2, py + 10, 4, 11);
  scene.worldLayer.fillStyle(darkenColor(getCurrentBiome(scene).torch, Math.min(1, brightness * flicker + 0.2)), 0.95);
  scene.worldLayer.fillCircle(px + s / 2, py + 8, 4 + Math.round((flicker - 0.8) * 4));
  scene.worldLayer.fillStyle(darkenColor(0xffff88, Math.min(1, brightness * flicker + 0.3)), 0.8);
  scene.worldLayer.fillCircle(px + s / 2, py + 7, 2);
}

function drawAmbientEffects(scene) {
  if (!scene.visualLayer) return;
  scene.visualLayer.clear();

  const cam = scene.cameras?.main;
  if (!cam) return;

  if (scene.currentMapName === 'home') {
    for (const mote of scene.ambientMotes || []) {
      if (mote.x < cam.worldView.x - 20 || mote.x > cam.worldView.right + 20 || mote.y < cam.worldView.y - 20 || mote.y > cam.worldView.bottom + 20) continue;
      scene.visualLayer.fillStyle(0xffd38a, Math.min(0.22, mote.alpha * 0.55));
      scene.visualLayer.fillRect(mote.x, mote.y, mote.size, mote.size);
    }

    scene.visualLayer.fillStyle(0xffb45c, 0.035);
    scene.visualLayer.fillRect(cam.worldView.x - 20, cam.worldView.y - 20, cam.worldView.width + 40, cam.worldView.height + 40);
    return;
  }

  // Soft drifting dust/spores, drawn in screen-visible world space only.
  for (const mote of scene.ambientMotes || []) {
    if (mote.x < cam.worldView.x - 20 || mote.x > cam.worldView.right + 20 || mote.y < cam.worldView.y - 20 || mote.y > cam.worldView.bottom + 20) continue;
    scene.visualLayer.fillStyle(getCurrentBiome(scene).ambientMote, mote.alpha);
    scene.visualLayer.fillRect(mote.x, mote.y, mote.size, mote.size);
  }

  // Subtle vignette in world coordinates around the camera to deepen caves.
  scene.visualLayer.fillStyle(0x000000, getCurrentBiome(scene).id === 'crystalDepths' ? 0.10 : 0.16);
  scene.visualLayer.fillRect(cam.worldView.x - 20, cam.worldView.y - 20, cam.worldView.width + 40, 18);
  scene.visualLayer.fillRect(cam.worldView.x - 20, cam.worldView.bottom + 2, cam.worldView.width + 40, 20);
  scene.visualLayer.fillRect(cam.worldView.x - 20, cam.worldView.y - 20, 18, cam.worldView.height + 40);
  scene.visualLayer.fillRect(cam.worldView.right + 2, cam.worldView.y - 20, 20, cam.worldView.height + 40);
}

function spawnMiningParticles(scene, tx, ty, color, count = 10) {
  const cx = tx * scene.tileSize + scene.tileSize / 2;
  const cy = ty * scene.tileSize + scene.tileSize / 2;
  for (let i = 0; i < count; i++) {
    const particle = scene.add.rectangle(
      cx + Phaser.Math.Between(-5, 5),
      cy + Phaser.Math.Between(-5, 5),
      Phaser.Math.Between(2, 4),
      Phaser.Math.Between(2, 4),
      color,
      Phaser.Math.FloatBetween(0.65, 1)
    );
    particle.setDepth(20);
    scene.tweens.add({
      targets: particle,
      x: particle.x + Phaser.Math.Between(-20, 20),
      y: particle.y + Phaser.Math.Between(-18, 14),
      alpha: 0,
      scaleX: 0.35,
      scaleY: 0.35,
      duration: Phaser.Math.Between(280, 520),
      onComplete: () => particle.destroy()
    });
  }
}

function spawnBreakBurst(scene, tx, ty, color) {
  spawnMiningParticles(scene, tx, ty, color, 18);
  const ring = scene.add.circle(tx * scene.tileSize + scene.tileSize / 2, ty * scene.tileSize + scene.tileSize / 2, 4, color, 0.18);
  ring.setDepth(21);
  scene.tweens.add({
    targets: ring,
    radius: 18,
    alpha: 0,
    duration: 260,
    onComplete: () => ring.destroy()
  });
}
