// Cosmetic palettes and confirm/cancel state, independent of gameplay and the DOM.
// Seams, visor and ability effects keep their existing signal colors; the
// seventh skin alone gives the existing smiling-eye meshes a white material.
const ROBOT_SKINS=Object.freeze([
  {id:'classic',name:'Classic',panel:0xf7fbff,soft:0xdceaf3,accent:0x168cff,joint:0x263746},
  {id:'red',name:'Red',panel:0xe8424d,soft:0xffeee9,accent:0xffffff,joint:0x263746},
  {id:'blue',name:'Blue',panel:0x267fe0,soft:0xc9d7e6,accent:0xe7eff7,joint:0x263746},
  {id:'green',name:'Green',panel:0x96cf38,soft:0xfff0ce,accent:0xf8e5b5,joint:0x263746},
  {id:'yellow',name:'Yellow',panel:0xffd139,soft:0xffe996,accent:0xf08025,joint:0x263746},
  {id:'purple',name:'Purple',panel:0x9255dc,soft:0xeee4ff,accent:0xffd7f4,joint:0x263746},
  // An original Bellhop homage: the special fields recolor only owned robot
  // parts. The badge is constructed in player-visual.js from simple geometry.
  {id:'web-hero',name:'Web Hero',panel:0xe52b3f,soft:0x1769d1,accent:0x1676d2,joint:0x263746,
    headPanel:0xe52b3f,headSoft:0xe52b3f,headAccent:0xe52b3f,eye:0xffffff,eyeGlow:0xffffff,
    badge:true,badgeBack:0x1253a4,badgeMark:0xffffff}
].map(s=>Object.freeze({
  headPanel:s.panel,headSoft:s.soft,headAccent:s.accent,eye:0x28d7ff,eyeGlow:0xbaf7ff,
  badge:false,badgeBack:0x1253a4,badgeMark:0xffffff,...s
})));
const ROBOT_SKIN_KEY='bellhop.robotSkin';
function robotSkin(id){return ROBOT_SKINS.find(s=>s.id===id)||ROBOT_SKINS[0];}
function createSkinSelection(storage){
  let equipped='classic',pending='classic',open=false;
  try{const store=storage();equipped=robotSkin(store&&store.getItem(ROBOT_SKIN_KEY)).id;}catch(e){}
  pending=equipped;
  return {
    snapshot:()=>({equipped,pending,open}),
    open(){pending=equipped;open=true;return this.snapshot();},
    choose(id){if(open)pending=robotSkin(id).id;return this.snapshot();},
    cancel(){pending=equipped;open=false;return this.snapshot();},
    confirm(){
      if(!open)return false;
      equipped=pending;open=false;
      // Equipping is a session operation even when private browsing denies storage.
      try{const store=storage();if(store)store.setItem(ROBOT_SKIN_KEY,equipped);}catch(e){}
      return true;
    }
  };
}
function applyRobotSkin(root,id){
  const mats=root&&root.userData&&root.userData.skinMaterials;
  if(!mats)return false;
  const skin=robotSkin(id);
  for(const role of ['panel','soft','accent','joint'])mats[role].color.setHex(skin[role]);
  const special=root.userData.skinSpecialMaterials,parts=root.userData.skinSpecialParts;
  if(special){
    for(const role of ['headPanel','headSoft','headAccent','eye','eyeGlow','badgeBack','badgeMark'])special[role].color.setHex(skin[role]);
  }
  if(parts){
    parts.badge.visible=skin.badge;
    parts.chest.visible=!skin.badge;
    parts.chestGlow.visible=!skin.badge;
  }
  root.userData.skinId=skin.id;
  return true;
}
if(typeof module!=='undefined'&&module.exports)module.exports={ROBOT_SKINS,ROBOT_SKIN_KEY,robotSkin,createSkinSelection,applyRobotSkin};
