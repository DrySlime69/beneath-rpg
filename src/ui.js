function setMessage(scene,text){scene.messageBox.textContent=text}
function getItemLabel(scene,item){
  if(!item)return'';
  const def=getItemDef(item.id);
  if(item.id==='pickaxe'){
    const pickDef=getPickaxeDefByTier(scene.pickaxeTier||0);
    const name=scene.pickaxeTier<=0?'Hands':pickDef?.name||'Pickaxe';
    const dur=scene.pickaxeTier<=0?'Slow':(scene.pickaxeDurability??getPickaxeDurabilityMax(scene.pickaxeTier))+'/'+getPickaxeDurabilityMax(scene.pickaxeTier);
    return name.replace(' ','\n')+'\nDMG '+getPickaxeMiningDamage(scene)+'\nDUR '+dur;
  }
  if(def?.category==='weapons'){
    const dur=(item.durability??def.durabilityMax)+'/'+def.durabilityMax;
    return def.name.replace(' ','\n')+'\nDMG '+def.damage+'\nDUR '+dur;
  }
  if(def?.stackable)return def.name.replace(' ','\n')+'\n'+(scene.inventory[item.id]||0);
  if(item.id==='furnace')return'Furnace\nReady';
  if(item.id==='craftingTable')return'Workbench\nReady';
  return (def?.name||'').replace(' ','\n');
}
function selectHotbarSlot(scene,index){scene.selectedHotbarIndex=Math.max(0,Math.min(7,index));updateInventoryUI(scene)}
function handleHotbarNumberKeys(scene){for(let i=0;i<8;i++){const key=scene.keys['hotbar'+(i+1)];if(key&&Phaser.Input.Keyboard.JustDown(key)){selectHotbarSlot(scene,i);setMessage(scene,'Selected hotbar slot '+(i+1)+'.');return}}}
function decorateHotbarSlot(scene,slot,index,item){slot.textContent=(index+1)+'\n'+getItemLabel(scene,item);slot.classList.toggle('selectedHotbar',index===(scene.selectedHotbarIndex||0))}
function updateInventoryUI(scene){for(let i=0;i<scene.hotbarDisplaySlots.length;i++){decorateHotbarSlot(scene,scene.hotbarDisplaySlots[i],i,scene.hotbarItems[i])}const h=Array.from(scene.hotbarGrid.children);const b=Array.from(scene.backpackGrid.children);for(let i=0;i<h.length;i++){decorateHotbarSlot(scene,h[i],i,scene.hotbarItems[i])}for(let i=0;i<b.length;i++){b[i].textContent=getItemLabel(scene,scene.backpackItems[i]);b[i].classList.remove('selectedHotbar')}}
