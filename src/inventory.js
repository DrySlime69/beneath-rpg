function setupInventoryScreen(scene) {
  scene.hotbarGrid.innerHTML = '';
  scene.backpackGrid.innerHTML = '';
  scene.dragData = null;

  for (let i = 0; i < 8; i++) {
    scene.hotbarGrid.appendChild(createInventorySlot(scene, 'hotbar', i));
  }

  for (let i = 0; i < 24; i++) {
    scene.backpackGrid.appendChild(createInventorySlot(scene, 'backpack', i));
  }
}

function createInventorySlot(scene, area, index) {
  const slot = document.createElement('div');
  slot.className = 'invSlot';
  slot.draggable = true;

  slot.addEventListener('dragstart', event => {
    scene.dragData = { area: area, index: index };
    slot.classList.add('dragging');
    event.dataTransfer.setData('text/plain', area + ':' + index);
  });

  slot.addEventListener('dragend', () => {
    slot.classList.remove('dragging');
    document.querySelectorAll('.invSlot').forEach(s => s.classList.remove('dropTarget'));
  });

  slot.addEventListener('dragover', event => {
    event.preventDefault();
    slot.classList.add('dropTarget');
  });

  slot.addEventListener('dragleave', () => {
    slot.classList.remove('dropTarget');
  });

  slot.addEventListener('drop', event => {
    event.preventDefault();
    slot.classList.remove('dropTarget');

    if (!scene.dragData) return;

    moveInventoryItem(scene, scene.dragData.area, scene.dragData.index, area, index);
    scene.dragData = null;
  });

  return slot;
}

function getItemArray(scene, area) {
  if (area === 'hotbar') return scene.hotbarItems;
  return scene.backpackItems;
}

function moveInventoryItem(scene, fromArea, fromIndex, toArea, toIndex) {
  const fromArray = getItemArray(scene, fromArea);
  const toArray = getItemArray(scene, toArea);
  const fromItem = fromArray[fromIndex];
  const toItem = toArray[toIndex];

  fromArray[fromIndex] = toItem;
  toArray[toIndex] = fromItem;

  updateInventoryUI(scene);
}

function toggleInventoryScreen(scene) {
  scene.inventoryOpen = !scene.inventoryOpen;
  scene.inventoryScreen.style.display = scene.inventoryOpen ? 'flex' : 'none';
  updateInventoryUI(scene);
}
