// Layered terrain renderer.
// Disciplined layered terrain renderer.
// IMPORTANT: no giant room-painting overlays. Gameplay stays tile based and
// visuals are composed from consistent-scale modular tiles/props.

const SPORE_TERRAIN_ASSETS = [
  'floor_0','floor_1','floor_2','floor_3','floor_4','floor_5','floor_6','floor_7',
  'wall_0','wall_1','wall_2','wall_3','wall_4','wall_5','wall_6','wall_7','wall_8','wall_9','wall_10','wall_11','wall_12','wall_13','wall_14','wall_15',
  'shadow_top','shadow_bottom','shadow_left','shadow_right',
  'floor_chunk_0','floor_chunk_1','floor_chunk_2','floor_chunk_3','floor_chunk_4','floor_chunk_5','floor_chunk_6','floor_chunk_7',
  'floor_decal_0','floor_decal_1','floor_decal_2','floor_decal_3','floor_decal_4','floor_decal_5','floor_decal_6','floor_decal_7','floor_decal_8','floor_decal_9',
  'wall_shadow_blob_0','wall_shadow_blob_1','wall_shadow_blob_2','wall_shadow_blob_3',
  'corridor_blend_0','corridor_blend_1','corridor_blend_2','corridor_blend_3',
  'room_plate_mushroomGrove_0','room_plate_mushroomGrove_1','room_plate_mushroomGrove_2',
  'room_plate_sporePit_0','room_plate_sporePit_1','room_plate_sporePit_2',
  'room_plate_rootCavern_0','room_plate_rootCavern_1','room_plate_rootCavern_2',
  'room_plate_fungalNest_0','room_plate_fungalNest_1','room_plate_fungalNest_2',
  'room_plate_quietChamber_0','room_plate_quietChamber_1','room_plate_quietChamber_2',
  'room_plate_floodedGrotto_0','room_plate_floodedGrotto_1','room_plate_floodedGrotto_2',
  'prop_giant_mushroom_0','prop_giant_mushroom_1','prop_giant_mushroom_2',
  'prop_mushroom_cluster_0','prop_mushroom_cluster_1','prop_mushroom_cluster_2',
  'prop_spore_pool','prop_fungal_nest','prop_root_curtain','prop_spore_bulbs',
  'prop_wall_moss_cascade','prop_wall_glow_vines','prop_wall_fungal_shelf'
];

function preloadTerrainAssets(scene) {
  if (!scene || !scene.load) return;
  SPORE_TERRAIN_ASSETS.forEach(key => {
    scene.load.image('spore_' + key, 'assets/terrain/spore/' + key + '.png');
  });
}

function setupTerrainRenderer(scene) {
  scene.terrainBackdropLayer = scene.add.container(0, 0).setDepth(1.03);
  scene.terrainChunkLayer = scene.add.container(0, 0).setDepth(1.10);
  scene.terrainFloorLayer = scene.add.container(0, 0).setDepth(1.18);
  scene.terrainWallLayer = scene.add.container(0, 0).setDepth(1.32);
  scene.terrainDecalLayer = scene.add.container(0, 0).setDepth(1.45);
  scene.terrainOverlayLayer = scene.add.container(0, 0).setDepth(1.62);
  scene.terrainSpriteSignature = '';
  scene.terrainSpritesEnabled = true;
}

function markTerrainRendererDirty(scene) {
  if (!scene || !scene.map) return;
  scene.map._terrainSpriteVersion = (scene.map._terrainSpriteVersion || 0) + 1;
  scene.terrainSpriteSignature = '';
}

function getTerrainSpriteSignature(scene) {
  if (!scene || !scene.map) return 'none';
  const mapId = scene.currentMapName === 'mine' ? ('mine-' + (scene.mineLevel || 1)) : 'home';
  return [
    mapId,
    scene.currentBiomeId || scene.map.biomeId || 'none',
    scene.map._terrainSpriteVersion || 0,
    scene.map.visualDecorVersion || 0
  ].join('|');
}

function isSporeTerrainScene(scene) {
  if (!scene || scene.currentMapName !== 'mine') return false;
  const biomeId = scene.currentBiomeId || scene.map?.biomeId;
  return biomeId === 'sporeGrotto' || (scene.mineLevel || 1) <= 10;
}

function refreshTerrainSprites(scene, force = false) {
  if (!scene || !scene.terrainSpritesEnabled || !scene.terrainFloorLayer || !scene.map) return;
  const signature = getTerrainSpriteSignature(scene);
  if (!force && signature === scene.terrainSpriteSignature) return;

  if (scene.terrainBackdropLayer) scene.terrainBackdropLayer.removeAll(true);
  if (scene.terrainChunkLayer) scene.terrainChunkLayer.removeAll(true);
  scene.terrainFloorLayer.removeAll(true);
  scene.terrainWallLayer.removeAll(true);
  if (scene.terrainDecalLayer) scene.terrainDecalLayer.removeAll(true);
  scene.terrainOverlayLayer.removeAll(true);
  scene.terrainSpriteSignature = signature;

  if (!isSporeTerrainScene(scene)) return;

  // Render in strict order. Avoid room-sized images: they caused the visual
  // corruption/overlap shown in testing.
  addSporeSoftRoomGroundTint(scene);
  addSporeTerrainChunks(scene);
  addSporeFloorDecals(scene);
  addSporeRoomSetPieces(scene);
  addSporeWallSetPieces(scene);

  for (let y = 0; y < scene.mapHeight; y++) {
    for (let x = 0; x < scene.mapWidth; x++) {
      const tile = scene.map[y]?.[x];
      if (!tile) continue;
      addTerrainSpriteForTile(scene, tile, x, y);
    }
  }
}

function terrainHash(x, y, salt = 0) {
  let n = (x * 374761393 + y * 668265263 + salt * 1442695041) | 0;
  n = (n ^ (n >> 13)) * 1274126177;
  return Math.abs(n ^ (n >> 16));
}

function tileVariantIndex(tile, x, y, max) {
  const seed = (tile?.detailSeed || 0) + x * 31 + y * 17 + (tile?.variation || 0) * 13;
  return Math.abs(seed) % max;
}

function isVisualFloorTile(tile) {
  return tile && ['floor', 'torch', 'exitUp', 'exitDown', 'exit'].includes(tile.type);
}

function isVisualWallTile(tile) {
  return tile && ['caveWall', 'stone', 'coal', 'copper', 'copperWall', 'wood', 'largeOreChunk'].includes(tile.type);
}

function countVisualFloors(scene, startX, startY, width, height) {
  let count = 0;
  for (let y = startY; y < startY + height; y++) {
    for (let x = startX; x < startX + width; x++) {
      if (x < 0 || y < 0 || x >= scene.mapWidth || y >= scene.mapHeight) continue;
      if (isVisualFloorTile(scene.map[y]?.[x])) count++;
    }
  }
  return count;
}


function normalizeSporeRoomType(type) {
  const allowed = ['mushroomGrove', 'sporePit', 'rootCavern', 'fungalNest', 'quietChamber', 'floodedGrotto'];
  return allowed.includes(type) ? type : 'quietChamber';
}



function addSporeSoftRoomGroundTint(scene) {
  if (!scene.map?.rooms || !scene.terrainBackdropLayer) return;
  const s = scene.tileSize;
  for (const room of scene.map.rooms) {
    const cx = (room.cx + 0.5) * s;
    const cy = (room.cy + 0.5) * s;
    const g = scene.add.graphics();
    const type = normalizeSporeRoomType(room.type);
    const accent = type === 'floodedGrotto' ? 0x1fa9a0 :
      type === 'fungalNest' ? 0x6c4778 :
      type === 'sporePit' ? 0x2f9a65 :
      type === 'rootCavern' ? 0x5d4b2e : 0x3d6b35;
    // Subtle room-sized tint only. This is drawn behind tiles and cannot cover gameplay.
    g.fillStyle(0x000000, 0.18);
    g.fillEllipse(cx, cy, (room.w + 3) * s, (room.h + 3) * s);
    g.fillStyle(accent, 0.16);
    g.fillEllipse(cx, cy, (room.w + 1.5) * s, (room.h + 1.2) * s);
    g.setDepth(1.031);
    scene.terrainBackdropLayer.add(g);
  }
}

function addSporePaintedRoomBackdrops(scene) {
  if (!scene.map?.rooms || !scene.terrainBackdropLayer) return;
  const s = scene.tileSize;
  for (const room of scene.map.rooms) {
    const cx = (room.cx + 0.5) * s;
    const cy = (room.cy + 0.5) * s;
    const g = scene.add.graphics();
    // Heavy vignette shell: this hides square room boundaries and frames the room
    // like a painted cave illustration.
    g.fillStyle(0x000000, 0.58);
    g.fillEllipse(cx, cy, (room.w + 10.5) * s, (room.h + 9.5) * s);
    g.fillStyle(0x04110d, 0.92);
    g.fillEllipse(cx, cy, (room.w + 7.8) * s, (room.h + 6.8) * s);
    g.fillStyle(0x153827, 0.74);
    g.fillEllipse(cx, cy, (room.w + 5.9) * s, (room.h + 5.0) * s);
    g.fillStyle(0x75e493, 0.10);
    g.fillEllipse(cx, cy, (room.w + 3.4) * s, (room.h + 2.6) * s);
    g.setDepth(1.031);
    scene.terrainBackdropLayer.add(g);
  }
}

function addSporeHeroFloorDecals(scene) {
  if (!scene.map?.rooms || !scene.terrainDecalLayer) return;
  const s = scene.tileSize;
  for (const room of scene.map.rooms) {
    const h = terrainHash(room.cx || 0, room.cy || 0, (room.id || 0) + 910);
    const cx = (room.cx + 0.5) * s;
    const cy = (room.cy + 0.5) * s;
    const g = scene.add.graphics();
    const roomType = normalizeSporeRoomType(room.type);
    const accent = roomType === 'floodedGrotto' ? 0x51e9e5 :
      roomType === 'fungalNest' ? 0xff78c8 :
      roomType === 'sporePit' ? 0x77ffd2 :
      roomType === 'rootCavern' ? 0xb49052 : 0x91ff8f;
    // A few large, obvious painted shapes per room. These are intentionally
    // room-scale, not tile-scale, so the floor stops reading as a repeated grid.
    for (let i = 0; i < 5; i++) {
      const ox = (((h >> (i * 3)) % 13) - 6) * s * 0.42;
      const oy = (((h >> (i * 4 + 1)) % 11) - 5) * s * 0.36;
      g.fillStyle(i % 2 ? 0x0b241b : accent, i % 2 ? 0.16 : 0.07);
      g.fillEllipse(cx + ox, cy + oy, (room.w * (0.30 + i * 0.035)) * s, (room.h * (0.16 + i * 0.025)) * s);
    }
    g.lineStyle(2, accent, 0.13);
    for (let i = 0; i < 7; i++) {
      const y = cy + (((h >> (i * 2)) % 11) - 5) * s * 0.22;
      g.beginPath();
      g.moveTo(cx - room.w * s * 0.38, y);
      g.lineTo(cx - room.w * s * 0.12, y + (((h >> i) % 5) - 2) * s * 0.16);
      g.lineTo(cx + room.w * s * 0.16, y + (((h >> (i+2)) % 5) - 2) * s * 0.16);
      g.lineTo(cx + room.w * s * 0.38, y + (((h >> (i+4)) % 5) - 2) * s * 0.16);
      g.strokePath();
    }
    g.setDepth(1.46);
    scene.terrainDecalLayer.add(g);
  }
}

function addSporeRoomFloorPlates(scene) {
  if (!scene.map?.rooms || !scene.map.rooms.length || !scene.terrainChunkLayer) return;
  const s = scene.tileSize;
  for (const room of scene.map.rooms) {
    if (!room || room.role === 'entrance' || room.role === 'exit') {
      // Entrance/exit still get a subtle foundation so they blend with the cave.
    }
    const roomType = normalizeSporeRoomType(room.type);
    const h = terrainHash(room.cx || room.x || 0, room.cy || room.y || 0, room.id || 0);
    const key = 'spore_room_plate_' + roomType + '_' + (h % 3);
    if (!scene.textures.exists(key)) continue;
    const img = scene.add.image((room.cx + 0.5) * s, (room.cy + 0.5) * s, key);
    img.setDisplaySize((room.w + 9.5) * s, (room.h + 8.0) * s);
    img.setOrigin(0.5);
    img.setAlpha(1.0);
    img.setAngle([0, 0, 0, 180][h % 4]);
    img.setDepth(1.04);
    scene.terrainChunkLayer.add(img);

    const rim = scene.add.graphics();
    rim.fillStyle(0x000000, 0.34);
    rim.fillEllipse((room.cx + 0.5) * s, (room.cy + 0.5) * s, (room.w + 8.8) * s, (room.h + 7.9) * s);
    rim.fillStyle(0x7dff9c, 0.11);
    rim.fillEllipse((room.cx + 0.5) * s, (room.cy + 0.5) * s, (room.w + 2.9) * s, (room.h + 2.4) * s);
    rim.setDepth(1.09);
    scene.terrainChunkLayer.add(rim);
  }
}

function addSporeCorridorBlends(scene) {
  if (!scene.map?.connections || !scene.map?.rooms || !scene.terrainChunkLayer) return;
  const s = scene.tileSize;
  const roomsById = new Map(scene.map.rooms.map(room => [room.id, room]));
  for (const link of scene.map.connections) {
    const a = roomsById.get(link.from);
    const b = roomsById.get(link.to);
    if (!a || !b) continue;
    const midX = ((a.cx + b.cx) / 2 + 0.5) * s;
    const midY = ((a.cy + b.cy) / 2 + 0.5) * s;
    const dx = (b.cx - a.cx) * s;
    const dy = (b.cy - a.cy) * s;
    const len = Math.max(s * 3, Math.sqrt(dx * dx + dy * dy));
    const h = terrainHash(a.id || 0, b.id || 0, scene.mineLevel || 1);
    const key = 'spore_corridor_blend_' + (h % 4);
    if (!scene.textures.exists(key)) continue;
    const img = scene.add.image(midX, midY, key);
    img.setDisplaySize(len * 1.12, s * 4.45);
    img.setOrigin(0.5);
    img.setAlpha(0.98);
    img.setAngle(Math.atan2(dy, dx) * 180 / Math.PI);
    img.setDepth(1.045);
    scene.terrainChunkLayer.add(img);
  }
}

function addSporeRoomSetPieces(scene) {
  if (!scene.map?.rooms || !scene.terrainOverlayLayer) return;
  const s = scene.tileSize;
  for (const room of scene.map.rooms) {
    if (!room || room.role === 'entrance' || room.role === 'exit') continue;
    const type = normalizeSporeRoomType(room.type);
    const h = terrainHash(room.cx || 0, room.cy || 0, (room.id || 0) + 4411);
    const cx = (room.cx + 0.5) * s;
    const cy = (room.cy + 0.5) * s;

    // Controlled, consistent tile scale. These are decorative accents, not
    // full-room paintings. Keep them mostly at room edges so paths stay readable.
    const placements = [];
    if (type === 'mushroomGrove') {
      placements.push(['prop_giant_mushroom_' + (h % 3), cx - room.w * s * 0.25, cy + room.h * s * 0.20, s * 1.7, s * 2.15, 0.95]);
      placements.push(['prop_mushroom_cluster_' + ((h >> 3) % 3), cx + room.w * s * 0.25, cy + room.h * s * 0.22, s * 1.35, s * 1.15, 0.9]);
    } else if (type === 'sporePit' || type === 'floodedGrotto') {
      placements.push(['prop_spore_pool', cx, cy + room.h * s * 0.22, s * 2.25, s * 1.35, 0.72]);
      placements.push(['prop_spore_bulbs', cx - room.w * s * 0.28, cy - room.h * s * 0.12, s * 1.1, s * 1.1, 0.8]);
    } else if (type === 'rootCavern') {
      placements.push(['prop_root_curtain', cx - room.w * s * 0.25, cy - room.h * s * 0.20, s * 1.8, s * 1.55, 0.72]);
      placements.push(['prop_mushroom_cluster_' + (h % 3), cx + room.w * s * 0.28, cy + room.h * s * 0.18, s * 1.25, s * 1.05, 0.85]);
    } else if (type === 'fungalNest') {
      placements.push(['prop_fungal_nest', cx, cy + room.h * s * 0.23, s * 2.1, s * 1.55, 0.82]);
      placements.push(['prop_mushroom_cluster_' + (h % 3), cx - room.w * s * 0.30, cy + room.h * s * 0.18, s * 1.15, s * 0.95, 0.85]);
    } else {
      placements.push(['prop_mushroom_cluster_' + (h % 3), cx - room.w * s * 0.24, cy + room.h * s * 0.18, s * 1.15, s * 0.95, 0.75]);
    }

    for (const [key, x, y, w, ht, alpha] of placements) {
      if (!scene.textures.exists(key)) continue;
      const img = scene.add.image(x, y, key);
      img.setDisplaySize(w, ht);
      img.setOrigin(0.5, 0.72);
      img.setAlpha(alpha);
      img.setDepth(2.15 + (y / 100000));
      scene.terrainOverlayLayer.add(img);
    }
  }
}

function addSporeWallSetPieces(scene) {
  if (!scene.map?.rooms || !scene.terrainOverlayLayer) return;
  const s = scene.tileSize;
  for (const room of scene.map.rooms) {
    const h = terrainHash(room.cx || 0, room.cy || 0, (room.id || 0) + 7733);
    const wallKeys = ['prop_wall_moss_cascade','prop_wall_glow_vines','prop_wall_fungal_shelf'];
    const count = room.role === 'standard' ? 2 : 1;
    for (let i = 0; i < count; i++) {
      const key = wallKeys[(h + i) % wallKeys.length];
      if (!scene.textures.exists(key)) continue;
      const side = (h + i * 7) % 4;
      let x = (room.cx + 0.5) * s;
      let y = (room.cy + 0.5) * s;
      if (side === 0) { x = (room.x + 1 + (h % Math.max(1, room.w - 2))) * s; y = (room.y + 0.7) * s; }
      if (side === 1) { x = (room.x + room.w - 0.5) * s; y = (room.y + 1 + (h % Math.max(1, room.h - 2))) * s; }
      if (side === 2) { x = (room.x + 1 + (h % Math.max(1, room.w - 2))) * s; y = (room.y + room.h - 0.3) * s; }
      if (side === 3) { x = (room.x + 0.5) * s; y = (room.y + 1 + (h % Math.max(1, room.h - 2))) * s; }
      const img = scene.add.image(x, y, key);
      img.setDisplaySize(s * 3.0, s * 3.0);
      img.setOrigin(0.5);
      img.setAlpha(0.48);
      img.setDepth(1.95 + y / 100000);
      scene.terrainOverlayLayer.add(img);
    }
  }
}

function addSporeTerrainChunks(scene) {
  const s = scene.tileSize;
  // Large overlapping chunks hide the 1-tile grid while collision/mining stays tile based.
  for (let y = 0; y < scene.mapHeight; y += 4) {
    for (let x = 0; x < scene.mapWidth; x += 4) {
      const floorCount = countVisualFloors(scene, x, y, 5, 5);
      if (floorCount < 7) continue;
      const h = terrainHash(x, y, scene.mineLevel || 1);
      const key = 'spore_floor_chunk_' + (h % 8);
      const img = scene.add.image((x + 2.5) * s, (y + 2.5) * s, key);
      img.setDisplaySize(s * 3.2, s * 3.2);
      img.setOrigin(0.5);
      img.setAlpha(0.42 + ((h % 6) / 100));
      img.setAngle([0, 90, 180, 270][h % 4]);
      scene.terrainChunkLayer.add(img);
    }
  }
}

function addSporeFloorDecals(scene) {
  const s = scene.tileSize;
  for (let y = 0; y < scene.mapHeight; y++) {
    for (let x = 0; x < scene.mapWidth; x++) {
      const tile = scene.map[y]?.[x];
      if (!isVisualFloorTile(tile)) continue;
      const h = terrainHash(x, y, (scene.mineLevel || 1) + 77);
      if (h % 100 > 18) continue;
      const key = 'spore_floor_decal_' + (h % 10);
      const dx = ((h >> 3) % 11) - 5;
      const dy = ((h >> 7) % 11) - 5;
      const img = scene.add.image(x * s + s / 2 + dx, y * s + s / 2 + dy, key);
      const scale = 0.75 + ((h % 7) * 0.05);
      img.setDisplaySize(s * scale, s * scale);
      img.setOrigin(0.5);
      img.setAlpha(0.32);
      img.setAngle([0, 90, 180, 270][(h >> 2) % 4]);
      scene.terrainDecalLayer.add(img);
    }
  }
}

function wallMaskValue(scene, x, y) {
  const mask = typeof getWallMask === 'function' ? getWallMask(scene, x, y) : { top: true, right: true, bottom: true, left: true };
  return (mask.top ? 1 : 0) + (mask.right ? 2 : 0) + (mask.bottom ? 4 : 0) + (mask.left ? 8 : 0);
}

function addTerrainSpriteForTile(scene, tile, x, y) {
  const s = scene.tileSize;
  const cx = x * s + s / 2;
  const cy = y * s + s / 2;

  // Do not place one square sprite per floor tile anymore. The floor is now made
  // from large overlapping terrain chunks and decals to avoid obvious repetition.
  if (isVisualFloorTile(tile)) {
    addSporeFloorMicroOverlays(scene, tile, x, y);
  }

  if (isVisualWallTile(tile)) {
    if (tile.type === 'caveWall') {
      const mask = wallMaskValue(scene, x, y);
      const img = scene.add.image(cx, cy, 'spore_wall_' + mask);
      img.setDisplaySize(s + 2, s + 2);
      img.setOrigin(0.5);
      img.setAlpha(0.98);
      scene.terrainWallLayer.add(img);
      addSporeEdgeShadowSprites(scene, x, y);
      addSporeWallShadowBlob(scene, x, y);
    }
  }
}

function addSporeFloorMicroOverlays(scene, tile, x, y) {
  const s = scene.tileSize;
  const px = x * s;
  const py = y * s;
  const seed = (tile.detailSeed || 0) + x * 131 + y * 97;
  if (seed % 11 === 0) {
    const g = scene.add.graphics();
    g.fillStyle(0xbfff85, 0.28);
    g.fillCircle(px + 7 + (seed % 13), py + 8 + (seed % 11), 1.2);
    g.fillStyle(0x6bffd0, 0.20);
    g.fillCircle(px + 15 + (seed % 7), py + 16 + (seed % 9), 1.8);
    scene.terrainOverlayLayer.add(g);
  }
}

function addSporeWallShadowBlob(scene, x, y) {
  const s = scene.tileSize;
  const h = terrainHash(x, y, 203);
  if (h % 100 > 11) return;
  const img = scene.add.image(x * s + s / 2, y * s + s / 2, 'spore_wall_shadow_blob_' + (h % 4));
  img.setDisplaySize(s * 1.15, s * 1.15);
  img.setOrigin(0.5);
  img.setAlpha(0.18);
  scene.terrainOverlayLayer.add(img);
}

function addSporeEdgeShadowSprites(scene, x, y) {
  const s = scene.tileSize;
  const cx = x * s + s / 2;
  const cy = y * s + s / 2;
  const mask = typeof getWallMask === 'function' ? getWallMask(scene, x, y) : { top: true, right: true, bottom: true, left: true };
  const open = [
    ['top', !mask.top, cx, cy, 0],
    ['bottom', !mask.bottom, cx, cy, 0],
    ['left', !mask.left, cx, cy, 0],
    ['right', !mask.right, cx, cy, 0]
  ];
  open.forEach(([name, should, xPos, yPos]) => {
    if (!should) return;
    const img = scene.add.image(xPos, yPos, 'spore_shadow_' + name);
    img.setDisplaySize(s + 1, s + 1);
    img.setOrigin(0.5);
    img.setAlpha(0.46);
    scene.terrainOverlayLayer.add(img);
  });
}
