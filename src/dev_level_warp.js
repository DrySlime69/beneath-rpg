function setupDevLevelWarp(scene) {
  scene.devLevelWarpScreen = document.getElementById('devLevelWarpScreen');
  scene.devLevelWarpGrid = document.getElementById('devLevelWarpGrid');
  scene.closeDevLevelWarpButton = document.getElementById('closeDevLevelWarp');

  if (scene.devLevelWarpGrid && scene.devLevelWarpGrid.children.length === 0) {
    for (let level = 1; level <= 100; level++) {
      const button = document.createElement('button');
      button.className = 'devLevelButton';
      button.textContent = String(level);
      button.dataset.level = String(level);
      button.addEventListener('click', () => warpToMineLevel(scene, level));
      scene.devLevelWarpGrid.appendChild(button);
    }
  }

  scene.closeDevLevelWarpButton?.addEventListener('click', () => closeDevLevelWarp(scene));

  // Backslash can report differently depending on browser/keyboard layout.
  // Listen through both Phaser and the DOM, and also support F10 as a fallback.
  const shouldToggleDevWarp = event => {
    return event.key === '\\' ||
      event.code === 'Backslash' ||
      event.key === 'Backslash' ||
      event.key === '|' ||
      event.code === 'F10' ||
      event.key === 'F10';
  };

  const handleDevWarpKey = event => {
    if (!shouldToggleDevWarp(event)) return;
    event.preventDefault();
    event.stopPropagation?.();
    toggleDevLevelWarp(scene);
  };

  scene.input.keyboard.on('keydown', handleDevWarpKey);

  if (!window.__beneathDevWarpKeyBound) {
    window.__beneathDevWarpKeyBound = true;
    window.addEventListener('keydown', event => {
      const activeScene = window.__beneathActiveScene;
      if (!activeScene || !shouldToggleDevWarp(event)) return;
      event.preventDefault();
      event.stopPropagation();
      toggleDevLevelWarp(activeScene);
    }, true);
  }
}


function toggleDevLevelWarp(scene) {
  if (scene.devLevelWarpOpen) closeDevLevelWarp(scene);
  else openDevLevelWarp(scene);
}

function openDevLevelWarp(scene) {
  closeInventoryAndCraftingMenus(scene);
  if (typeof closeAllGameMenus === 'function') closeAllGameMenus(scene);
  scene.devLevelWarpOpen = true;
  if (scene.devLevelWarpScreen) scene.devLevelWarpScreen.style.display = 'flex';
  refreshDevLevelWarpButtons(scene);
  setMessage(scene, 'Developer level warp opened.');
}

function closeDevLevelWarp(scene) {
  scene.devLevelWarpOpen = false;
  if (scene.devLevelWarpScreen) scene.devLevelWarpScreen.style.display = 'none';
}

function refreshDevLevelWarpButtons(scene) {
  if (!scene.devLevelWarpGrid) return;
  Array.from(scene.devLevelWarpGrid.children).forEach(button => {
    const level = Number(button.dataset.level);
    button.classList.toggle('currentDevLevel', scene.currentMapName === 'mine' && scene.mineLevel === level);
  });
}

function warpToMineLevel(scene, level) {
  closeDevLevelWarp(scene);
  const targetLevel = Phaser.Math.Clamp(Number(level) || 1, 1, 100);
  scene.maxUnlockedMineLevel = Math.max(scene.maxUnlockedMineLevel || 1, targetLevel);
  switchToMine(scene, targetLevel);
  scene.player.x = 3.5 * scene.tileSize;
  scene.player.y = 3.5 * scene.tileSize;
  scene.mineReturnPosition = { x: scene.player.x, y: scene.player.y, level: targetLevel };
  if (scene.mineEnemies && scene.mineEnemies[targetLevel]) scene.enemies = scene.mineEnemies[targetLevel];
  setMessage(scene, 'Dev warp: Mine Level ' + targetLevel + '.');
  updateInventoryUI(scene);
  redraw(scene);
}
