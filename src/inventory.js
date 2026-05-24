function setupInventoryScreen(scene){
  scene.hotbarGrid.innerHTML='';
  scene.backpackGrid.innerHTML='';
  scene.dragData=null;
  scene.pendingDeleteItem=null;
  scene.selectedInventoryItem=null;
  for(let i=0;i<8;i++)scene.hotbarGrid.appendChild(createInventorySlot(scene,'hotbar',i));
  for(let i=0;i<24;i++)scene.backpackGrid.appendChild(createInventorySlot(scene,'backpack',i));
  setupInventoryDeleteZone(scene);
  updateInventoryUI(scene)
}

function createInventorySlot(scene,area,index){
  const slot=document.createElement('div');
  slot.className='invSlot';
  slot.draggable=true;

  slot.addEventListener('click',()=>selectInventoryItem(scene,area,index));

  slot.addEventListener('dragstart',e=>{
    const item=getItemArray(scene,area)?.[index];
    if(!item){e.preventDefault();return;}
    scene.dragData={area,index};
    slot.classList.add('dragging');
    e.dataTransfer.setData('text/plain',area+':'+index)
  });
  slot.addEventListener('dragend',e=>{
    slot.classList.remove('dragging');
    document.querySelectorAll('.invSlot').forEach(s=>s.classList.remove('dropTarget'));

    // Some browsers do not reliably fire a drop event on the delete zone
    // when dragging from custom inventory slots, so dragend also checks
    // whether the mouse was released over the visible red X.
    if(scene.dragData && isPointerOverDeleteZone(scene,e)){
      queueInventoryItemDelete(scene);
      return;
    }

    scene.deleteItemDropZone?.classList.remove('dragOverDelete');
    if(!scene.pendingDeleteItem)scene.dragData=null;
  });
  slot.addEventListener('dragover',e=>{e.preventDefault();slot.classList.add('dropTarget')});
  slot.addEventListener('dragleave',()=>slot.classList.remove('dropTarget'));
  slot.addEventListener('drop',e=>{
    e.preventDefault();
    slot.classList.remove('dropTarget');
    if(!scene.dragData)return;
    moveInventoryItem(scene,scene.dragData.area,scene.dragData.index,area,index);
    scene.dragData=null
  });
  return slot
}

function getItemArray(scene,area){return area==='hotbar'?scene.hotbarItems:scene.backpackItems}

function moveInventoryItem(scene,fromArea,fromIndex,toArea,toIndex){
  const a=getItemArray(scene,fromArea),b=getItemArray(scene,toArea);
  const item=a[fromIndex];
  a[fromIndex]=b[toIndex];
  b[toIndex]=item;
  if(toArea==='hotbar')scene.selectedHotbarIndex=toIndex;
  scene.selectedInventoryItem={area:toArea,index:toIndex};
  updateInventoryUI(scene)
}

function toggleInventoryScreen(scene){scene.inventoryOpen=!scene.inventoryOpen;scene.inventoryScreen.style.display=scene.inventoryOpen?'flex':'none';updateInventoryUI(scene)}


function setupInventoryDeleteZone(scene){
  const zone=scene.deleteItemDropZone;
  if(!zone||zone.dataset.ready==='true')return;
  zone.dataset.ready='true';

  zone.addEventListener('dragover',e=>{
    if(!scene.dragData)return;
    e.preventDefault();
    zone.classList.add('dragOverDelete');
  });

  zone.addEventListener('dragleave',()=>zone.classList.remove('dragOverDelete'));

  zone.addEventListener('drop',e=>{
    e.preventDefault();
    queueInventoryItemDelete(scene);
  });

  scene.confirmDeleteItemYes?.addEventListener('click',()=>confirmDeleteInventoryItem(scene));
  scene.confirmDeleteItemNo?.addEventListener('click',()=>cancelDeleteInventoryItem(scene));
}

function isPointerOverDeleteZone(scene,e){
  const zone=scene.deleteItemDropZone;
  if(!zone||!e)return false;
  const rect=zone.getBoundingClientRect();
  const x=e.clientX;
  const y=e.clientY;
  return x>=rect.left&&x<=rect.right&&y>=rect.top&&y<=rect.bottom;
}

function queueInventoryItemDelete(scene){
  scene.deleteItemDropZone?.classList.remove('dragOverDelete');
  if(!scene.dragData)return;

  const arr=getItemArray(scene,scene.dragData.area);
  const item=arr?.[scene.dragData.index];
  if(!item){scene.dragData=null;return;}

  scene.pendingDeleteItem={area:scene.dragData.area,index:scene.dragData.index,item};
  scene.dragData=null;
  openDeleteItemConfirm(scene,item);
}

function openDeleteItemConfirm(scene,item){
  const def=getItemDef(item.id);
  const itemName=def?.name||item.id||'this item';
  if(scene.deleteItemConfirmText)scene.deleteItemConfirmText.textContent='Are you sure you want to delete this item? '+itemName+' will be removed from your inventory.';
  if(scene.deleteItemConfirmScreen)scene.deleteItemConfirmScreen.style.display='flex';
}

function closeDeleteItemConfirm(scene){
  if(scene.deleteItemConfirmScreen)scene.deleteItemConfirmScreen.style.display='none';
}

function confirmDeleteInventoryItem(scene){
  const pending=scene.pendingDeleteItem;
  if(!pending){closeDeleteItemConfirm(scene);return;}

  const arr=getItemArray(scene,pending.area);
  const item=arr?.[pending.index];

  if(item && item===pending.item){
    const def=getItemDef(item.id);
    if(def?.stackable){
      scene.inventory[item.id]=0;
      arr[pending.index]=null;
    }else{
      arr[pending.index]=null;
    }

    if(scene.selectedInventoryItem&&scene.selectedInventoryItem.area===pending.area&&scene.selectedInventoryItem.index===pending.index){
      scene.selectedInventoryItem=null;
    }

    setMessage(scene,'Deleted '+(def?.name||item.id||'item')+'.');
  }

  scene.pendingDeleteItem=null;
  closeDeleteItemConfirm(scene);
  updateInventoryUI(scene);
}

function cancelDeleteInventoryItem(scene){
  scene.pendingDeleteItem=null;
  closeDeleteItemConfirm(scene);
  updateInventoryUI(scene);
}
