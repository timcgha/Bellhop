// The picker owns pending selection. Only Use Skin touches the gameplay robot.
const skinSelection=createSkinSelection(()=>window.localStorage);
let skinPreview=null,skinPadDirection=0,lastSkinDisposal=null;
applyRobotSkin(player,skinSelection.snapshot().equipped);
function isSkinPanelOpen(){return skinSelection.snapshot().open;}
function skinMaterialColors(root){
  const mats=root&&root.userData.skinMaterials;if(!mats)return null;
  const out={};for(const role of Object.keys(mats))out[role]=mats[role].color.getHex();return out;
}
function skinButtons(){return ROBOT_SKINS.map(s=>$('skin-'+s.id)).concat([$('skinUse'),$('skinBack')]);}
function focusSkinButton(index){const b=skinButtons()[clamp(index,0,7)];if(b&&b.focus)b.focus();}
function updateSkinCards(){
  const state=skinSelection.snapshot();
  for(const skin of ROBOT_SKINS){
    const el=$('skin-'+skin.id),selected=skin.id===state.pending;
    el.classList.toggle('sel',selected);
    if(el.setAttribute)el.setAttribute('aria-pressed',String(selected));
    $('skin-check-'+skin.id).textContent=selected?'✓':'';
  }
  $('skinName').textContent=robotSkin(state.pending).name;
}
function renderSkinPreview(){
  if(!skinPreview||!isSkinPanelOpen())return;
  const v=skinPreview,r=$('skinPreviewHost').getBoundingClientRect();
  if(r.width<1||r.height<1)return;
  v.renderer.setSize(Math.round(r.width),Math.round(r.height),false);
  v.camera.aspect=r.width/r.height;
  const distance=Math.max(v.size.y,v.size.x/v.camera.aspect)/(2*Math.tan(v.camera.fov*Math.PI/360))*1.22;
  v.camera.position.set(v.center.x+distance*0.28,v.center.y+distance*0.12,v.center.z+distance);
  v.camera.lookAt(v.center);v.camera.updateProjectionMatrix();
  applyRobotSkin(v.robot,skinSelection.snapshot().pending);v.renderer.render(v.scene,v.camera);v.renders++;
}
function createSkinPreview(){
  // The existing headless physics harness has no rendering DOM.
  if(typeof document.querySelector!=='function')return;
  const host=$('skinPreviewHost');
  const r=new THREE.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true});
  r.setPixelRatio(Math.min(window.devicePixelRatio||1,2));r.outputEncoding=THREE.sRGBEncoding;
  r.domElement.setAttribute('aria-label','Robot preview');r.domElement.setAttribute('role','img');host.appendChild(r.domElement);
  const world=new THREE.Scene(),robot=buildRobotVisual(new THREE.Group());robot.scale.setScalar(0.72);world.add(robot);
  world.add(new THREE.HemisphereLight(0xe6f4ff,0x63747e,1.1));
  const light=new THREE.DirectionalLight(0xfff3df,0.95);light.position.set(3,5,5);world.add(light);
  const box=new THREE.Box3().setFromObject(robot),center=box.getCenter(new THREE.Vector3()),size=box.getSize(new THREE.Vector3());
  const camera=new THREE.PerspectiveCamera(32,1,0.01,30);
  const materials=new Set(),geometries=new Set(),shared=new Set([BOXG,SPH,CYL,CONE]);
  robot.traverse(o=>{if(o.material)materials.add(o.material);if(o.geometry&&!shared.has(o.geometry))geometries.add(o.geometry);});
  skinPreview={renderer:r,scene:world,robot,camera,center,size,materials,geometries,renders:0};
  // All six illustrations are renders of the same robot and material definitions.
  r.setSize(128,96,false);camera.aspect=128/96;
  const distance=Math.max(size.y,size.x/camera.aspect)/(2*Math.tan(camera.fov*Math.PI/360))*1.18;
  camera.position.set(center.x+distance*0.28,center.y+distance*0.12,center.z+distance);camera.lookAt(center);camera.updateProjectionMatrix();
  for(const skin of ROBOT_SKINS){
    applyRobotSkin(robot,skin.id);r.render(world,camera);
    const cv=$('skin-art-'+skin.id),ctx=cv.getContext('2d');cv.width=128;cv.height=96;ctx.clearRect(0,0,128,96);ctx.drawImage(r.domElement,0,0,128,96);
  }
  renderSkinPreview();
}
function disposeSkinPreview(){
  if(!skinPreview)return;
  const v=skinPreview;skinPreview=null;
  v.scene.remove(v.robot);v.materials.forEach(m=>m.dispose());v.geometries.forEach(g=>g.dispose());
  v.renderer.dispose();v.renderer.forceContextLoss();v.renderer.domElement.remove();
  lastSkinDisposal={materials:v.materials.size,geometries:v.geometries.size,detached:!v.robot.parent};
}
function openSkins(){
  if(started||isSkinPanelOpen())return;
  clearGameplayInput();skinSelection.open();skinPadDirection=0;updateSkinCards();
  const menu=$('start');menu.inert=true;if(menu.setAttribute)menu.setAttribute('aria-hidden','true');
  $('skinsOverlay').style.display='flex';
  try{createSkinPreview();}catch(e){disposeSkinPreview();$('skinName').textContent='Preview unavailable — try reopening';console.error('Robot preview:',e);}
  focusSkinButton(ROBOT_SKINS.findIndex(s=>s.id===skinSelection.snapshot().equipped));
}
function chooseSkin(id){if(!isSkinPanelOpen())return;skinSelection.choose(id);updateSkinCards();renderSkinPreview();}
function closeSkins(confirm){
  if(!isSkinPanelOpen())return;
  if(confirm){skinSelection.confirm();applyRobotSkin(player,skinSelection.snapshot().equipped);}else skinSelection.cancel();
  disposeSkinPreview();$('skinsOverlay').style.display='none';
  const menu=$('start');menu.inert=false;if(menu.removeAttribute)menu.removeAttribute('aria-hidden');
  clearGameplayInput();skinPadDirection=0;if($('skinsOpen').focus)$('skinsOpen').focus();
}
function handleSkinKey(e){
  if(e.code==='Escape'){e.preventDefault();closeSkins(false);return;}
  const buttons=skinButtons(),at=buttons.indexOf(document.activeElement);
  if(e.code==='Tab'){
    e.preventDefault();focusSkinButton((at+(e.shiftKey?-1:1)+buttons.length)%buttons.length);return;
  }
  const delta={ArrowLeft:-1,ArrowRight:1,ArrowUp:-3,ArrowDown:3}[e.code];
  if(delta){e.preventDefault();const next=clamp(Math.max(at,0)+delta,0,7);focusSkinButton(next);if(next<6)chooseSkin(ROBOT_SKINS[next].id);}
  // Enter and Space retain the focused button's native activation behavior.
}
function handleSkinGamepad(b,axes,edge){
  if(edge(1)){closeSkins(false);return;}
  const direction=b[14]?-1:b[15]?1:b[12]?-3:b[13]?3:Math.abs(axes[0]||0)>0.55?Math.sign(axes[0]):Math.abs(axes[1]||0)>0.55?Math.sign(axes[1])*3:0;
  if(direction&&direction!==skinPadDirection){
    const at=skinButtons().indexOf(document.activeElement),next=clamp(Math.max(at,0)+direction,0,7);
    focusSkinButton(next);if(next<6)chooseSkin(ROBOT_SKINS[next].id);
  }
  skinPadDirection=direction;
  if(edge(0)){const el=document.activeElement;if(skinButtons().includes(el)&&el.click)el.click();}
}
function bindSkinButton(id,fn){
  $(id).addEventListener('pointerdown',e=>e.stopPropagation());
  $(id).addEventListener('click',e=>{e.stopPropagation();fn();});
}
bindSkinButton('skinsOpen',openSkins);
for(const skin of ROBOT_SKINS)bindSkinButton('skin-'+skin.id,()=>chooseSkin(skin.id));
bindSkinButton('skinUse',()=>closeSkins(true));bindSkinButton('skinBack',()=>closeSkins(false));
$('skinsOverlay').addEventListener('pointerdown',e=>e.stopPropagation());
addEventListener('resize',renderSkinPreview);
window.__SKINS=()=>({...skinSelection.snapshot(),gameplay:skinMaterialColors(player),
  preview:skinPreview?{colors:skinMaterialColors(skinPreview.robot),roots:skinPreview.scene.children.length,materials:skinPreview.materials.size,geometries:skinPreview.geometries.size,renders:skinPreview.renders}:null,
  renderLoops:0,lastDisposal:lastSkinDisposal});
