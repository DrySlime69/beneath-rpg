function setMessage(scene,text){scene.messageBox.textContent=text}

function getItemLabel(scene,item){
  if(!item)return'';
  const def=getItemDef(item.id);

  if(def?.stackable){
    return def.name.replace(' ','\n')+'\n'+(scene.inventory[item.id]||0);
  }

  if(item.id==='pickaxe'){
    const pickDef=getPickaxeDefByTier(scene.pickaxeTier||0);
    const name=scene.pickaxeTier<=0?'Hands':pickDef?.name||'Pickaxe';
    return name.replace(' ','\n');
  }

  return (def?.name||item.id||'').replace(' ','\n');
}

function selectHotbarSlot(scene,index){scene.selectedHotbarIndex=Math.max(0,Math.min(7,index));updateInventoryUI(scene)}

function handleHotbarNumberKeys(scene){for(let i=0;i<8;i++){const key=scene.keys['hotbar'+(i+1)];if(key&&Phaser.Input.Keyboard.JustDown(key)){selectHotbarSlot(scene,i);setMessage(scene,'Selected hotbar slot '+(i+1)+'.');return}}}

function decorateHotbarSlot(scene,slot,index,item){slot.textContent=(index+1)+'\n'+getItemLabel(scene,item);slot.classList.toggle('selectedHotbar',index===(scene.selectedHotbarIndex||0))}

function updateInventoryUI(scene){
  for(let i=0;i<scene.hotbarDisplaySlots.length;i++){
    decorateHotbarSlot(scene,scene.hotbarDisplaySlots[i],i,scene.hotbarItems[i]);
  }

  const h=Array.from(scene.hotbarGrid.children);
  const b=Array.from(scene.backpackGrid.children);

  for(let i=0;i<h.length;i++){
    decorateHotbarSlot(scene,h[i],i,scene.hotbarItems[i]);
    h[i].classList.toggle('inventorySelected',scene.selectedInventoryItem&&scene.selectedInventoryItem.area==='hotbar'&&scene.selectedInventoryItem.index===i);
  }

  for(let i=0;i<b.length;i++){
    b[i].textContent=getItemLabel(scene,scene.backpackItems[i]);
    b[i].classList.remove('selectedHotbar');
    b[i].classList.toggle('inventorySelected',scene.selectedInventoryItem&&scene.selectedInventoryItem.area==='backpack'&&scene.selectedInventoryItem.index===i);
  }

  updateInventoryDetailPanel(scene);
}

function getInventoryDetailItem(scene){
  if(!scene.selectedInventoryItem)return null;
  const arr=scene.selectedInventoryItem.area==='hotbar'?scene.hotbarItems:scene.backpackItems;
  return arr?.[scene.selectedInventoryItem.index]||null;
}

function selectInventoryItem(scene,area,index){
  scene.selectedInventoryItem={area,index};
  if(area==='hotbar')scene.selectedHotbarIndex=index;
  updateInventoryUI(scene);
}

function updateInventoryDetailPanel(scene){
  if(!scene.inventoryDetailName||!scene.inventoryDetailInfo||!scene.inventoryDetailStats||!scene.inventoryDetailRecipe)return;

  const item=getInventoryDetailItem(scene);
  if(!item){
    scene.inventoryDetailName.textContent='Select an item';
    scene.inventoryDetailInfo.textContent='Click an item to view its details.';
    scene.inventoryDetailStats.textContent='';
    scene.inventoryDetailRecipe.textContent='';
    return;
  }

  const def=getItemDef(item.id);
  if(!def){
    scene.inventoryDetailName.textContent=item.id||'Unknown Item';
    scene.inventoryDetailInfo.textContent='No item data found.';
    scene.inventoryDetailStats.textContent='';
    scene.inventoryDetailRecipe.textContent='';
    return;
  }

  scene.inventoryDetailName.textContent=def.name;
  scene.inventoryDetailInfo.textContent=def.info||'No description yet.';

  const stats=[];
  if(def.stackable){
    stats.push('Category: '+getInventoryCategoryName(def.category));
    stats.push('Quantity: '+(scene.inventory[def.id]||0));
  }

  if(item.id==='pickaxe'){
    const pickDef=getPickaxeDefByTier(scene.pickaxeTier||0);
    stats.push('Category: Tools');
    stats.push('Tool: Pickaxe');
    if(scene.pickaxeTier<=0){
      stats.push('Status: Broken / hands only');
      stats.push('Mining Damage: 0.25');
      stats.push('Durability: 0 / 0');
    }else{
      stats.push('Tier: '+scene.pickaxeTier);
      stats.push('Mining Damage: '+getPickaxeMiningDamage(scene));
      stats.push('Durability: '+(scene.pickaxeDurability??getPickaxeDurabilityMax(scene.pickaxeTier))+' / '+getPickaxeDurabilityMax(scene.pickaxeTier));
      if(pickDef?.info)scene.inventoryDetailInfo.textContent=pickDef.info;
    }
  }else if(def.toolType==='pickaxe'){
    stats.push('Category: Tools');
    stats.push('Tool: Pickaxe');
    stats.push('Tier: '+def.tier);
    stats.push('Mining Damage: '+def.miningDamage);
    stats.push('Durability: '+(item.durability??def.durabilityMax)+' / '+def.durabilityMax);
  }

  if(def.category==='weapons'){
    stats.push('Category: Weapons');
    stats.push('Type: '+(def.weaponType||'Weapon'));
    stats.push('Damage: '+def.damage);
    stats.push('Speed: '+def.speed);
    stats.push('Durability: '+(item.durability??def.durabilityMax)+' / '+def.durabilityMax);
    stats.push('Effects: '+((def.effects&&def.effects.length)?def.effects.join(', '):'none'));
  }

  if(def.placeable){
    stats.push('Category: Placeables');
    stats.push('Placeable: Home only');
  }

  if(def.category==='special'){
    stats.push('Category: Special');
  }

  scene.inventoryDetailStats.textContent=stats.join('\n');
  scene.inventoryDetailRecipe.textContent='Recipe / Source:\n'+getRecipeText(def);
}

function getInventoryCategoryName(categoryId){
  const cat=ITEM_CATEGORIES.find(c=>c.id===categoryId);
  return cat?.name||categoryId||'Unknown';
}
