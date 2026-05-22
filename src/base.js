function useTeleportStone(scene) {
  if (scene.currentMapName === 'mine') {
    scene.mineReturnPosition = { x: scene.player.x, y: scene.player.y };
    switchToHome(scene);
    scene.player.x = scene.homePosition.x;
    scene.player.y = scene.homePosition.y;
    setMessage(scene, 'Teleported home.');
  } else {
    switchToMine(scene);
    scene.player.x = scene.mineReturnPosition.x;
    scene.player.y = scene.mineReturnPosition.y;
    setMessage(scene, 'Returned to the mine.');
  }

  redraw(scene);
}

function placeFurnace(scene) {
  const furnaceSlot = scene.hotbarItems.findIndex(item => item && item.id === 'furnace');

  if (scene.currentMapName !== 'home') {
    setMessage(scene, 'Furnace can only be placed at home.');
    return;
  }

  if (!scene.hasFurnace || furnaceSlot === -1) {
    setMessage(scene, 'Move Furnace to hotbar first.');
    return;
  }

  const px = scene.player.x + scene.lastMoveDirection.x;
  const py = scene.player.y + scene.lastMoveDirection.y;
  const tile = scene.map[py] ? scene.map[py][px] : null;

  if (!tile || tile.type !== 'homeFloor') {
    setMessage(scene, 'Furnace can only be placed on home floor.');
    return;
  }

  scene.map[py][px] = {
    type: 'furnace',
    hardness: 999
  };

  scene.hotbarItems[furnaceSlot] = null;
  scene.hasFurnace = false;

  setMessage(scene, 'Placed Furnace.');
  updateInventoryUI(scene);
  redraw(scene);
}
