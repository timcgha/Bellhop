// BH-007 deterministic/integration coverage for eligibility, inputs, capture,
// damage retention, lifecycle cleanup and every approved hostile family.
const boot=require('./harness.js');
let failures=0;
function ok(c,m){console.log((c?'PASS ':'FAIL ')+m);if(!c)failures++;}
function click(H,id){const f=H.el(id).listeners.click&&H.el(id).listeners.click[0];if(!f)throw Error('missing click '+id);f({stopPropagation(){},preventDefault(){}});}
function equip(H,id){click(H,'skinsOpen');click(H,'skin-'+id);click(H,'skinUse');}
function start(H,level){H.window.__setPickerIdx(level);H.confirmStart();H.frames(5);}
function events(H,type){return H.window.__WEB_SHOT.snapshot().events.filter(e=>e.type===type);}
function keyFireAt(H,family,index=0){H.window.__WEB_SHOT.evidenceAimAt(family,index,3.5);H.tap('KeyX',1);H.frames(14);}

// Authoritative confirmed state: preview/cancel never grants; confirmation does.
{
  const H=boot({autostart:false});click(H,'skinsOpen');click(H,'skin-web-hero');
  ok(H.window.__SKINS().pending==='web-hero'&&H.window.__SKINS().equipped==='classic','previewing Web Hero does not equip it');
  click(H,'skinBack');start(H,0);H.tap('KeyX',1);H.frames(4);
  ok(!H.window.__WEB_SHOT.snapshot().equipped&&events(H,'shot').length===0,'cancelled preview cannot fire a web');
}
{
  const H=boot({autostart:false});equip(H,'web-hero');start(H,0);
  ok(H.window.__WEB_SHOT.snapshot().available&&!H.el('bX').disabled,'confirmed Web Hero grants the intrinsic ability and touch control');
  keyFireAt(H,'gloop');
  ok(events(H,'shot').length===1&&events(H,'wrapped').length===1,'KeyX follows the real keyboard input path into a visible capture');
  H.tap('KeyX',1);H.frames(2);ok(events(H,'shot').length===1,'cooldown rejects an immediate second shot without removing availability');
  H.frames(30);H.tap('KeyX',1);H.frames(2);ok(events(H,'shot').length===2,'finite cooldown permits a later shot without ammunition or pickup');
}

// Gamepad X/button 2 is Web Hero's web action; B/button 1 remains gust. For
// other skins button 2 retains its historical B alias.
{
  const H=boot({autostart:false});equip(H,'web-hero');start(H,0);const idle=Array(16).fill(false);H.gamepadTick(idle),gustBefore=H.P.gustCD;
  const x=idle.slice();x[2]=true;H.gamepadTick(x);H.gamepadTick(idle);H.frames(3);
  ok(events(H,'shot').length===1&&H.P.gustCD<=gustBefore,'gamepad X fires web without also firing gust for Web Hero');
  H.frames(28);const b=idle.slice();b[1]=true;H.gamepadTick(b);H.gamepadTick(idle);
  ok(H.P.gustCD>0&&events(H,'shot').length===1,'gamepad B retains the existing gust action for Web Hero');
}
{
  const H=boot({autostart:false});start(H,0);const idle=Array(16).fill(false);H.gamepadTick(idle);const x=idle.slice();x[2]=true;H.gamepadTick(x);H.gamepadTick(idle);
  ok(H.P.gustCD>0&&events(H,'shot').length===0,'gamepad button 2 remains the B alias for non-Web-Hero skins');
}
{
  const H=boot({autostart:false});equip(H,'web-hero');start(H,0);H.window.__WEB_SHOT.evidenceAimAt('gloop',0,3.5);H.tapBtn('bX');H.frames(14);
  ok(events(H,'shot').length===1&&events(H,'wrapped').length===1,'visible touch X control fires through its bound pointer path');
}

// Every approved level/family path: actual projectile collision enters a timed,
// immobilized/non-hostile wrap, then delegates once to the real defeat handler.
const matrix=[
  {level:0,id:'level1',families:['gloop']},
  {level:1,id:'level2',families:['shark','spikefish']},
  {level:2,id:'level3',families:['cinder','wisp']},
  {level:3,id:'level4',families:['saucer']},
  {level:4,id:'level5',families:[]},
  {level:5,id:'level6',families:['snowman']}
];
for(const row of matrix){
  const H=boot({autostart:false,randomSeed:17});equip(H,'web-hero');start(H,row.level);
  const found=[...new Set(H.window.__WEB_SHOT.eligible().map(x=>x.family))];
  ok(JSON.stringify(found)===JSON.stringify(row.families),row.id+' exposes exactly its approved hostile-family matrix');
  for(const family of row.families){
    const targetInfo=H.window.__WEB_SHOT.eligible().find(t=>t.family===family),target=family==='snowman'?H.window.__WINTER.snowmen[targetInfo.index]:H.W[family==='gloop'?'gloops':family==='shark'?'sharks':family==='spikefish'?'spikefish':family==='cinder'?'cinders':family==='wisp'?'wisps':'saucers'][targetInfo.index];
    keyFireAt(H,family,targetInfo.index);const cap=H.window.__WEB_SHOT.snapshot().captures.find(c=>c.family===family);
    const before=family==='wisp'?[target.g.position.x,target.g.position.y,target.g.position.z]:[target.x,target.y,target.z];
    H.frames(5);const after=family==='wisp'?[target.g.position.x,target.g.position.y,target.g.position.z]:[target.x,target.y,target.z];
    ok(!!cap&&!target.alive&&target.g.visible&&JSON.stringify(before)===JSON.stringify(after),row.id+' '+family+' is visibly wrapped, immobilized and inactive');
    H.frames(55);
    ok(!target.alive&&!target.g.visible&&target.defeatedBy==='web',row.id+' '+family+' disappears through its real defeat adapter');
    ok(events(H,'disappeared').filter(e=>e.family===family&&e.index===targetInfo.index).length===1,row.id+' '+family+' records exactly one completed defeat');
  }
  if(!row.families.length){H.tap('KeyX',1);H.frames(75);ok(events(H,'shot').length===1&&events(H,'wrapped').length===0&&events(H,'shot-ended').some(e=>e.reason==='lifetime'||e.reason==='range'),'Desert deliberately supports fire/miss/finite cleanup without adding enemies');}
}

// Transient projectile and wrap GPU resources have explicit ownership. Normal
// completion and repeated finite misses release each owned resource once; the
// shared SPH geometry is deliberately absent from a projectile's owned set.
{
  const H=boot({autostart:false});equip(H,'web-hero');start(H,4);const before=H.window.__WEB_SHOT.snapshot().resources;
  for(let i=0;i<8;i++){H.tap('KeyX',1);H.frames(75);ok(H.window.__WEB_SHOT.snapshot().resources.liveResources===0,'Desert repeated miss '+(i+1)+' releases its transient resources');}
  const after=H.window.__WEB_SHOT.snapshot().resources;
  ok(after.visualsCreated-before.visualsCreated===8&&after.visualsReleased-before.visualsReleased===8,'eight repeated shots create and release eight projectile visuals');
  ok(after.resourcesCreated-before.resourcesCreated===24&&after.resourcesDisposed-before.resourcesDisposed===24,'eight repeated shots dispose two materials and one owned ring geometry each, but not shared SPH');
}
{
  const H=boot({autostart:false});equip(H,'web-hero');start(H,0);const before=H.window.__WEB_SHOT.snapshot().resources;
  for(let i=0;i<3;i++){const t=H.window.__WEB_SHOT.eligible().find(x=>x.family==='gloop');H.window.__WEB_SHOT.evidenceAimAt('gloop',t.index,1.5);H.tap('KeyX',1);H.frames(8);ok(H.window.__WEB_SHOT.snapshot().captures.some(x=>x.family==='gloop'),'repeated resource test captures Gloop '+(i+1));H.frames(55);ok(H.window.__WEB_SHOT.snapshot().resources.liveResources===0,'completed Gloop capture '+(i+1)+' releases projectile and wrap resources');}
  const after=H.window.__WEB_SHOT.snapshot().resources;
  ok(after.visualsCreated-before.visualsCreated===6&&after.visualsReleased-before.visualsReleased===6,'three captures release all three projectile and three wrap visuals');
  ok(after.resourcesCreated-before.resourcesCreated===30&&after.resourcesDisposed-before.resourcesDisposed===30,'three captures dispose every uniquely owned projectile and wrap resource once');
}
{
  const H=boot({autostart:false});equip(H,'web-hero');start(H,4);const before=H.window.__WEB_SHOT.snapshot().resources;H.tap('KeyX',1);H.frames(2);
  ok(H.window.__WEB_SHOT.snapshot().resources.liveResources===3,'active projectile reports its two materials and owned ring geometry');
  H.window.__WEB_SHOT.clear();const once=H.window.__WEB_SHOT.snapshot().resources;H.window.__WEB_SHOT.clear();const twice=H.window.__WEB_SHOT.snapshot().resources;
  ok(once.resourcesDisposed-before.resourcesDisposed===3&&once.liveResources===0,'explicit state cleanup disposes an in-flight projectile');
  ok(JSON.stringify(once)===JSON.stringify(twice),'repeated cleanup cannot dispose an already released visual twice');
}

// Solid scenery blocks before capture; target dummies, trapped sharks and all
// friendly/scenery arrays remain outside eligibility.
{
  const H=boot({autostart:false});equip(H,'web-hero');start(H,0);const t=H.window.__WEB_SHOT.eligible()[0];H.window.__WEB_SHOT.evidenceAimAt('gloop',t.index,4);
  H.W.solids.push({min:{x:t.x-1,y:t.y-1,z:t.z+1.5},max:{x:t.x+1,y:t.y+1,z:t.z+2.5}});H.tap('KeyX',1);H.frames(22);
  ok(events(H,'shot-ended').some(e=>e.reason==='solid')&&events(H,'wrapped').length===0&&H.W.gloops[t.index].alive,'blocking scenery stops the projectile before the enemy');
}
{
  const H=boot({autostart:false});equip(H,'web-hero');start(H,3);const dummies=H.W.saucers.filter(e=>e.targetDummy);
  ok(dummies.length>0&&H.window.__WEB_SHOT.eligible().every(t=>!H.W.saucers[t.index].targetDummy),'Space tutorial dummies are explicitly non-eligible');
}
{
  const H=boot({autostart:false});equip(H,'web-hero');start(H,1);const before=H.window.__WEB_SHOT.eligible().filter(t=>t.family==='shark').length;H.W.sharks[0].state='trapped';
  ok(H.window.__WEB_SHOT.eligible().filter(t=>t.family==='shark').length===before-1,'bubble-trapped sharks are not recaptured or double-defeated');
  ok(H.W.fish.length>0&&H.W.clams.length>0&&H.window.__WEB_SHOT.eligible().every(t=>!['fish','clam'].includes(t.family)),'friendly Deep creatures and objectives are excluded');
}

// A real hostile contact takes one heart under the existing invulnerability
// rules, while confirmed Web Hero immediately remains able to shoot again.
for(const damage of[
  {level:1,family:'shark',enemy:H=>H.W.sharks[0]},
  {level:3,family:'saucer',enemy:H=>H.W.saucers.find(e=>!e.targetDummy)},
  {level:5,family:'snowman',enemy:H=>H.window.__WINTER.snowmen[0]}
]){
  const H=boot({autostart:false,randomSeed:9});equip(H,'web-hero');start(H,damage.level);const enemy=damage.enemy(H),hp=H.P.hp;H.P.inv=0;H.P.pos.set(enemy.x,enemy.y,enemy.z);H.frames(2);
  ok(H.P.hp===hp-1&&H.window.__WEB_SHOT.snapshot().available,damage.family+' contact removes one heart but not the intrinsic web ability');
  const target=H.window.__WEB_SHOT.eligible().find(t=>t.family===damage.family);H.window.__WEB_SHOT.evidenceAimAt(damage.family,target.index,3.5);H.tap('KeyX',1);H.frames(16);
  ok(events(H,'wrapped').length===1,damage.family+' damage journey can shoot and wrap again without re-equipping or pickup');
}
{
  const H=boot({autostart:false,randomSeed:11});equip(H,'web-hero');start(H,0);const q=H.W.goos[0],hp=H.P.hp;q.alive=true;q.ref=false;q.life=2;q.pos.set(H.P.pos.x,H.P.pos.y+.4,H.P.pos.z);q.vel.set(0,0,0);q.m.visible=true;H.P.inv=0;H.frames(2);
  ok(H.P.hp===hp-1&&H.window.__WEB_SHOT.snapshot().available,'real goo-projectile update path removes one heart without removing web eligibility');
}

// Family adapters preserve once-only reward and held-collectible behavior.
for(const held of[
  {level:1,family:'spikefish',index:5,get:H=>H.W.spikefish[5]},
  {level:2,family:'wisp',index:1,get:H=>H.W.wisps[1]},
  {level:3,family:'saucer',index:0,get:H=>H.W.saucers[0]}
]){
  const H=boot({autostart:false,randomSeed:23});equip(H,'web-hero');start(H,held.level);const e=held.get(H),note=e.note;
  ok(note&&note.hidden&&!note.g.visible,held.family+' begins with its real held note hidden');keyFireAt(H,held.family,held.index);H.frames(55);
  ok(!note.hidden&&note.g.visible&&!note.got,held.family+' web defeat releases its real held note exactly once');const disappeared=events(H,'disappeared').length;H.frames(70);
  ok(events(H,'disappeared').length===disappeared,held.family+' cannot repeat its defeat/reward callback after removal');
}
{
  const H=boot({autostart:false});equip(H,'web-hero');start(H,0);H.P.hp=H.P.maxHp-1;const hearts=H.W.hearts.length;keyFireAt(H,'gloop');H.frames(55);
  ok(H.W.hearts.length===hearts+1,'Gloop web removal delegates once to its normal heart reward path');H.frames(70);ok(H.W.hearts.length===hearts+1,'completed capture cannot duplicate its normal reward');
}

// Pause freezes the timed wrap. Death/respawn and return/menu remove transient
// shots/effects while preserving confirmed capability. Temporary powers coexist.
{
  const H=boot({autostart:false});equip(H,'web-hero');start(H,0);H.P.fire=true;H.P.bubble=true;H.P.hasSkyBlast=true;H.P.hasStarBeam=true;keyFireAt(H,'gloop');
  const left=H.window.__WEB_SHOT.snapshot().captures[0].left;H.tapBtn('pauseBtn');H.frames(20);
  ok(H.window.__WEB_SHOT.snapshot().captures[0].left===left,'pause freezes projectile/capture time');
  const shots=events(H,'shot').length;H.tap('KeyX',1);H.frames(3);ok(events(H,'shot').length===shots,'paused keyboard input cannot arm or fire a stale web shot');
  H.tapBtn('pauseResume');H.frames(55);ok(H.P.fire&&H.P.bubble&&H.P.hasSkyBlast&&H.P.hasStarBeam,'distinct web action does not consume temporary powers');
}
{
  const H=boot({autostart:false});equip(H,'web-hero');start(H,0);const target=H.W.gloops[0],before=H.window.__WEB_SHOT.snapshot().resources;keyFireAt(H,'gloop');H.P.dead=true;H.P.deadT=.2;H.frames(2);
  ok(H.window.__WEB_SHOT.snapshot().captures.length===0&&target.alive&&target.g.visible,'death clears wrap and restores an unfinished captured enemy');
  const deathResources=H.window.__WEB_SHOT.snapshot().resources;ok(deathResources.resourcesCreated-before.resourcesCreated===10&&deathResources.resourcesDisposed-before.resourcesDisposed===10&&deathResources.liveResources===0,'death releases one projectile and one active wrap without touching shared geometry');
  H.frames(15);ok(!H.P.dead&&H.window.__WEB_SHOT.snapshot().available,'respawn restores immediate Web Hero availability');
  keyFireAt(H,'gloop');H.tapBtn('pauseBtn');H.tapBtn('pauseMenu');
  ok(!H.isStarted()&&H.window.__WEB_SHOT.snapshot().shots.length===0&&H.window.__WEB_SHOT.snapshot().captures.length===0,'return to menu clears all transient web state');
  equip(H,'classic');start(H,0);H.tap('KeyX',1);H.frames(5);ok(!H.window.__WEB_SHOT.snapshot().available&&events(H,'shot').filter(e=>e.time>0).length>=1,'confirming another skin removes access without altering prior evidence history');
}
{
  const H=boot({autostart:false});equip(H,'web-hero');start(H,0);const idle=Array(16).fill(false),held=idle.slice();held[2]=true;H.gamepadTick(idle);H.tapBtn('pauseBtn');H.gamepadTick(held);H.tapBtn('pauseResume');H.frames(8);
  ok(events(H,'shot').length===0&&H.window.__INPUT_STATE().gamepadBlocked,'a gamepad X held across pause/resume remains blocked until neutral');H.gamepadTick(idle);H.gamepadTick(held);H.gamepadTick(idle);ok(events(H,'shot').length===1,'neutralizing then pressing gamepad X fires normally');
}
{
  const values={'bellhop.robotSkin':'web-hero'},storage={getItem:k=>values[k]||null,setItem(k,v){values[k]=v;}};
  const H=boot({autostart:false,localStorage:storage});start(H,0);
  ok(H.window.__SKINS().equipped==='web-hero'&&H.window.__WEB_SHOT.snapshot().available,'persisted confirmed Web Hero restores with web ability after reload');
}

// Supported update schedules preserve the same wrap/disappearance state order.
for(const ms of[8.33,16.67,33.33]){
  const H=boot({autostart:false});equip(H,'web-hero');start(H,0);H.window.__WEB_SHOT.evidenceAimAt('gloop',0,3.5);H.kd('KeyX');for(let i=0;i<Math.ceil(1.5*1000/ms);i++)H.step(ms);H.ku('KeyX');
  const order=H.window.__WEB_SHOT.snapshot().events.filter(e=>['shot','wrapped','disappeared'].includes(e.type)).map(e=>e.type);
  ok(JSON.stringify(order.slice(0,3))===JSON.stringify(['shot','wrapped','disappeared']),'stable '+ms+' ms schedule keeps shot → wrap → disappearance ordering');
}

if(failures){console.error(failures+' failed');process.exit(1);}console.log('all passed');
