function useTeleportStone(scene) {
  if (!scene.isHome) {
    scene.mineReturnPosition = { x: scene.player.x, y: scene.player.y };
    scene.player.x = scene.homePosition.x;
    scene.player.y = scene.homePosition.y;
    scene.isHome = true;
    setMessage(scene, 'Teleported home.');
  } else {
    scene.player.x = scene.mineReturnPosition.x;
    scene.player.y = scene.mineReturnPosition.y;
    scene.isHome = false;
    setMessage(scene, 'Returned to the mine.');
  }

  redraw(scene);
}

function placeFurnace(scene) {
  let hasFurnaceInHotbar = false;

  for (const item of scene.hotbarItems) {
    if (item && item.id === 'furnace') hasFurnaceInHotbar = true;
  }

  if (!scene.hasFurnace || !hasFurnaceInHotbar) {
    setMessage(scene, 'Build Furnace and move it to hotbar first.');
    return;
  }

  const px = scene.player.x + scene.lastMoveDirection.x;
  const py = scene.player.y + scene.lastMoveDirection.y;
  const tile = scene.map[py] ? scene.map[py][px] : null;

  if (!tile || (tile.type !== 'floor' && tile.type !== 'homeFloor' && tile.type !== 'teleportPad')) {
    setMessage(scene, 'Cannot place Furnace there.');
    return;
  }

  for (const object of scene.placedObjects) {
    if (object.x === px && object.y === py) {
      setMessage(scene, 'Something is already there.');
      return;
    }
  }

  scene.placedObjects.push({ type: 'furnace', x: px, y: py });
  setMessage(scene, 'Placed Furnace.');
  redraw(scene);
}
