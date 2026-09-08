// Behavioral state, material ownership and identical-input gameplay regressions.
const fs=require('fs'),path=require('path'),vm=require('vm');
const {ROBOT_SKINS,ROBOT_SKIN_KEY,robotSkin,createSkinSelection,applyRobotSkin}=require('../src/skin-state.js');
let failures=0;
function ok(c,m){console.log((c?'PASS ':'FAIL ')+m);if(!c)failures++;}
const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const memory=initial=>{const values={...initial},writes=[];return {values,writes,getItem:k=>values[k]??null,setItem(k,v){values[k]=v;writes.push([k,v]);}};};
ok(equal(ROBOT_SKINS.map(s=>s.name),['Classic','Red','Blue','Green','Yellow','Purple']),'exactly six authored palettes');
for(const value of [undefined,null,'','obsolete','RED','"red"','{}',{},17])ok(robotSkin(value).id==='classic','invalid palette falls back: '+String(value));
for(const skin of ROBOT_SKINS){
  const store=memory({unrelated:'keep',[ROBOT_SKIN_KEY]:skin.id});const s=createSkinSelection(()=>store);
  ok(s.snapshot().equipped===skin.id,'restore '+skin.id);
  s.open();s.choose(skin.id==='red'?'blue':'red');
  ok(s.snapshot().equipped===skin.id&&store.writes.length===0,'preview does not equip/persist '+skin.id);
  s.cancel();ok(s.snapshot().pending===skin.id&&!s.snapshot().open&&store.writes.length===0,'cancel discards '+skin.id);
  s.open();s.choose('purple');s.confirm();
  ok(s.snapshot().equipped==='purple'&&!s.snapshot().open&&store.values[ROBOT_SKIN_KEY]==='purple','confirm equips and persists '+skin.id);
  ok(store.writes.length===1&&store.values.unrelated==='keep','only the skin key is saved '+skin.id);
  ok(!s.confirm()&&store.writes.length===1,'closed confirm is inert '+skin.id);
}
for(const initial of ['obsolete','"blue"','{oops',null]){
  const s=createSkinSelection(()=>memory({[ROBOT_SKIN_KEY]:initial}));ok(s.snapshot().equipped==='classic','malformed storage fallback '+initial);
}
for(const store of [()=>{throw Error('denied');},()=>null,()=>({getItem(){throw Error('denied');},setItem(){throw Error('denied');}})]){
  const s=createSkinSelection(store);s.open();s.choose('green');s.confirm();ok(s.snapshot().equipped==='green','storage failure does not prevent session equip');
}
// Exercise the actual visual builder with small observable THREE fixtures.
class V{constructor(x=0,y=0,z=0){Object.assign(this,{x,y,z});}set(x,y,z){Object.assign(this,{x,y,z});return this;}setScalar(s){return this.set(s,s,s);}}
class O{constructor(geometry,material){this.geometry=geometry;this.material=material;this.children=[];this.userData={};this.position=new V();this.rotation=new V();this.scale=new V(1,1,1);this.visible=true;this.parent=null;}add(o){if(o.parent)o.parent.remove(o);this.children.push(o);o.parent=this;}remove(o){this.children=this.children.filter(c=>c!==o);o.parent=null;}traverse(fn){fn(this);this.children.forEach(c=>c.traverse(fn));}}
class C{constructor(v){this.v=v;}setHex(v){this.v=v;}getHex(){return this.v;}}
class M{constructor(o){Object.assign(this,o);this.color=new C(o.color);}}
class G{constructor(...args){this.args=args;}}
const root=new O();root.scale.setScalar(.72);
const fxMat=new M({color:0xff7a1f}),jet=new O(new G(),fxMat),flame=new O(new G(),fxMat);root.add(jet);root.userData={jet,flame};
const context={THREE:{Group:O,Mesh:O,TorusGeometry:G,MeshBasicMaterial:M},player:root,window:{},SPH:new G(),CYL:new G(),BOXG:new G(),pho:(c,s,sp)=>new M({color:c,shininess:s,specular:sp})};
context.mesh=(g,m,x,y,z,sx,sy,sz)=>{const o=new O(g,m);o.position.set(x,y,z);o.scale.set(sx,sy??sx,sz??sx);return o;};
vm.createContext(context);vm.runInContext(fs.readFileSync(path.join(__dirname,'../src/player-visual.js'),'utf8'),context);
function shape(o){return {p:o.position,r:o.rotation,s:o.scale,g:o.geometry&&o.geometry.args,c:o.children.map(shape)};}
const originalShape=JSON.stringify(shape(root)),seams=root.userData.seams.map(s=>s.material.color.getHex()),outsider=new M({color:0xf7fbff});
const preview=context.buildRobotVisual(new O());preview.scale.setScalar(.72);
for(const skin of ROBOT_SKINS){
  applyRobotSkin(root,skin.id);
  ok(Object.keys(root.userData.skinMaterials).every(r=>root.userData.skinMaterials[r].color.getHex()===skin[r]),skin.id+' uses robot-owned palette materials');
  ok(JSON.stringify(shape(root))===originalShape,skin.id+' preserves geometry, dimensions, transforms');
  ok(outsider.color.getHex()===0xf7fbff&&fxMat.color.getHex()===0xff7a1f,skin.id+' leaves world/effect materials unchanged');
  ok(equal(root.userData.seams.map(s=>s.material.color.getHex()),seams),skin.id+' preserves temporary ability-signal base colors');
  const before=Object.fromEntries(Object.entries(root.userData.skinMaterials).map(([r,m])=>[r,m.color.getHex()]));applyRobotSkin(preview,skin.id==='red'?'blue':'red');
  ok(Object.keys(before).every(r=>root.userData.skinMaterials[r].color.getHex()===before[r]&&root.userData.skinMaterials[r]!==preview.userData.skinMaterials[r]),skin.id+' preview materials cannot recolor gameplay');
}
applyRobotSkin(root,'classic');ok(root.userData.skinMaterials.panel.color.getHex()===0xf7fbff&&root.userData.skinMaterials.soft.color.getHex()===0xdceaf3&&root.userData.skinMaterials.accent.color.getHex()===0x168cff,'Classic preserves original appearance');
// Actual generated game with the unchanged repository physics harness.
const boot=require('./harness.js');
function click(H,id){H.el(id).listeners.click[0]({stopPropagation(){}});}
function equip(H,id){click(H,'skinsOpen');click(H,'skin-'+id);click(H,'skinUse');}
function sample(H){const p=H.P;return [p.pos.x,p.pos.y,p.pos.z,p.vel.x,p.vel.y,p.vel.z,p.hp,p.gustCD,p.bonkCD,p.slam,p.fire,p.puff];}
let baseline=null,physics=null;
for(const skin of ROBOT_SKINS){
  const H=boot({autostart:false});const initial=sample(H),phys=JSON.stringify(H.getPhys());equip(H,skin.id);
  ok(equal(sample(H),initial)&&JSON.stringify(H.getPhys())===phys&&!H.isStarted(),'equipping '+skin.id+' does not mutate physics or start gameplay');
  H.confirmStart();H.frames(12);const trajectory=[];
  H.kd('KeyD');for(let i=0;i<18;i++){H.frames(1);trajectory.push(sample(H));}H.ku('KeyD');
  H.kd('KeyW');for(let i=0;i<12;i++){H.frames(1);trajectory.push(sample(H));}H.ku('KeyW');
  H.kd('Space');for(let i=0;i<8;i++){H.frames(1);trajectory.push(sample(H));}H.ku('Space');
  H.tap('KeyK',2);H.tap('KeyJ',2);H.frames(16);trajectory.push(sample(H));
  if(!baseline){baseline=trajectory;physics=JSON.stringify(H.getPhys());}
  ok(equal(trajectory,baseline),'identical movement/jump/ability input produces identical gameplay: '+skin.id);
  ok(JSON.stringify(H.getPhys())===physics&&H.getPlayer().scale.x===.72,'same physics/collision/root dimensions: '+skin.id);
  H.P.dead=true;H.P.deadT=.001;H.frames(3);
  ok(!H.P.dead&&H.window.__SKINS().equipped===skin.id,'death/respawn preserves '+skin.id);
}
const H=boot({autostart:false});H.selectLevel(2);const idx=H.pickerIdx();click(H,'skinsOpen');click(H,'skin-red');
H.tap('ArrowRight');H.tap('Space');H.tapCard(4);H.window.__startGame();
ok(!H.isStarted()&&H.pickerIdx()===idx,'open panel blocks underlying keyboard/card/start routes');
H.tap('Escape');ok(!H.window.__SKINS().open&&H.window.__SKINS().equipped==='classic'&&H.pickerIdx()===idx,'Escape cancels without pause or selection drift');
equip(H,'purple');
for(let i=0;i<6;i++){
  H.window.__setPickerIdx(i);H.confirmStart();H.frames(8);
  ok(H.isStarted()&&H.getLevel().id==='level'+(i+1)&&H.window.__SKINS().equipped==='purple','non-Classic start in level '+(i+1));
  H.tapBtn('pauseBtn');const p=sample(H);H.frames(5);ok(equal(sample(H),p),'equipped skin retains true pause in level '+(i+1));
  H.tapBtn('pauseResume');H.frames(3);ok(H.window.__SKINS().equipped==='purple','Resume preserves skin level '+(i+1));
  H.tapBtn('pauseBtn');H.tapBtn('pauseMenu');ok(!H.isStarted()&&!H.W.won&&H.window.__SKINS().equipped==='purple','nonwinning menu retains skin level '+(i+1));
}
H.confirmStart();ok(H.isStarted()&&H.window.__SKINS().equipped==='purple','clean subsequent restart keeps equipped skin');
const I=boot({autostart:false});for(let i=0;i<10;i++){click(I,'skinsOpen');click(I,'skin-yellow');click(I,'skinBack');}
ok(I.window.__SKINS().equipped==='classic'&&!I.window.__SKINS().open,'repeated cancel leaves equipped state intact');
ok(I.el('skinUse').listeners.click.length===1&&I.el('skinsOpen').listeners.click.length===1,'repeated opening does not add interaction handlers');
const buttons=Array(16).fill(false);buttons[3]=true;I.gamepadTick(buttons);ok(I.window.__SKINS().open&&!I.isStarted(),'gamepad Y opens Skins without launching');I.gamepadTick(Array(16).fill(false));buttons[3]=false;buttons[1]=true;I.gamepadTick(buttons);ok(!I.window.__SKINS().open&&!I.isStarted(),'gamepad B cancels without launching');
if(failures){console.error(failures+' failed');process.exit(1);}console.log('all passed');
