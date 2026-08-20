// Stage 3: Level 2 creatures and bubble power.
let failures=0;
function ok(cond,msg){
  if(!cond) failures++;
  console.log((cond?'PASS ':'FAIL ')+msg);
}
function report(){
  if(failures){console.log(`\n${failures} FAILED`);process.exit(1);}
  console.log('\nall passed');
}
function boot(opts){return require('./harness.js')(Object.assign({autostart:false},opts));}
function startL2(H){H.startLevel(1);}
function aim(H,x,z){H.P.yaw=Math.atan2(x-H.P.pos.x,z-H.P.pos.z);}
function gust(H){H.P.gustCD=0;H.tap('KeyJ',2);}
function grantBubble(H){
  H.P.pos.set(2,0,3);H.P.vel.set(0,0,0);H.frames(12);
  return H.P.bubble;
}
function noteShark(H){return H.W.sharks.find(s=>s.note);}
function noteSpike(H){return H.W.spikefish.find(s=>s.note);}
function noteFish(H){return H.W.fish.find(f=>f.kind==='note');}
function ordFish(H){return H.W.fish.find(f=>f.kind==='ordinary'&&f.alive);}
function aliveBubbles(H){return H.W.bubbleShots.filter(b=>b.alive).length;}
function revealed(n){return !n.hidden;}
function bubbleTarget(H,target){
  grantBubble(H);
  aim(H,target.x,target.z);
  H.P.pos.set(target.x-2*Math.sin(H.P.yaw),(target.y||1)-0.5,target.z-2*Math.cos(H.P.yaw));
  aim(H,target.x,target.z);
  const fx=Math.sin(H.P.yaw),fz=Math.cos(H.P.yaw);
  const mx=H.P.pos.x+fx*0.35,my=H.P.pos.y+0.85,mz=H.P.pos.z+fz*0.35;
  target.x=mx;target.y=my;target.z=mz;
  if(target.hy!=null)target.hy=my;
  if(target.yBase!=null)target.yBase=my;
  if(target.vx!=null)target.vx=target.vy=target.vz=0;
  H.frames(2);gust(H);
}
function bubbleShark(H,s){
  grantBubble(H);
  aim(H,s.x,s.z);
  H.P.pos.set(s.x-2*Math.sin(H.P.yaw),s.y-0.5,s.z-2*Math.cos(H.P.yaw));
  aim(H,s.x,s.z);
  const fx=Math.sin(H.P.yaw),fz=Math.cos(H.P.yaw);
  const mx=H.P.pos.x+fx*0.35,my=H.P.pos.y+0.85,mz=H.P.pos.z+fz*0.35;
  H.P.gustCD=0;
  H.kd({code:'KeyJ',preventDefault(){},repeat:false});
  for(let i=0;i<240;i++){
    s.x=mx;s.y=my;s.z=mz;s.yBase=my;
    H.frames(1);
    if(revealed(s.note))break;
    if(i===3)H.ku({code:'KeyJ'});
  }
}

// ---- powered / unpowered underwater gust ----
{
  const H=boot();startL2(H);
  H.P.pos.set(0,1.5,0);H.P.vel.set(0,0,0);H.P.bubble=true;H.frames(2);
  gust(H);H.frames(3);
  ok(aliveBubbles(H)>0,'powered underwater gust creates a bubble');
}
{
  const H=boot();startL2(H);
  H.P.pos.set(0,1.5,0);H.P.vel.set(0,0,0);H.P.bubble=false;H.frames(2);
  gust(H);H.frames(3);
  ok(aliveBubbles(H)===0,'unpowered underwater gust does not create a bubble');
}

// ---- counted-note model ----
{
  const H=boot();startL2(H);
  const n0=H.W.notes.length;
  const fish=noteFish(H);
  ok(n0>=3,'notes.length already includes hidden held notes ('+n0+')');
  ok(fish.note.hidden&&!fish.note.got,'note fish holds a hidden note at build time');
  ok(H.W.notes.indexOf(fish.note)>=0,'held note is in notes array from build time');
  bubbleTarget(H,fish);
  for(let i=0;i<120;i++){H.frames(1);if(!fish.alive||revealed(fish.note))break;}
  ok(revealed(fish.note),'bubbling note fish reveals its existing held note');
  ok(H.W.notes.length===n0,'revealing held note did not append to notes.length');
}

// ---- held note only revealed once ----
{
  const H=boot();startL2(H);
  const fish=noteFish(H);
  bubbleTarget(H,fish);
  for(let i=0;i<120;i++){H.frames(1);if(revealed(fish.note))break;}
  const n0=H.W.notes.length;
  fish.alive=true;fish.g.visible=true;
  ok(revealed(fish.note),'revealed held note stays revealed if creature respawns');
  ok(H.W.notes.filter(n=>n===fish.note).length===1,'held note exists only once in notes array');
  ok(H.W.notes.length===n0,'respawn did not append another counted note');
}

// ---- shark note: same note for spin, jet, bubble ----
function testSharkNoteReveal(defeatFn,label){
  const H=boot();startL2(H);
  const shark=noteShark(H);
  const n0=H.W.notes.length;
  const ref=shark.note;
  ok(ref&&ref.hidden,'shark holds hidden note before defeat');
  defeatFn(H,shark);
  ok(revealed(ref),label+' reveals the held note');
  ok(H.W.notes.length===n0,label+' did not change notes.length');
  ok(shark.note===ref,label+' reveals the same note object');
}
testSharkNoteReveal((H,s)=>{
  H.P.pos.set(s.x,s.y,s.z-2);H.P.vel.set(0,0,0);H.frames(3);
  H.tap('KeyK',2);H.frames(3);
},'spin defeat');
testSharkNoteReveal((H,s)=>{
  H.P.pos.set(s.x,s.y+0.9,s.z);H.P.vel.set(0,0,0);H.P.puff=true;H.frames(3);
  H.kd({code:'Space',preventDefault(){},repeat:false});H.frames(2);H.ku({code:'Space'});H.frames(20);
},'jump-jet defeat');
testSharkNoteReveal((H,s)=>{bubbleShark(H,s);},'bubble defeat');

// ---- shark combat ----
{
  const H=boot();startL2(H);
  const s=H.W.sharks.find(x=>!x.note);
  H.P.pos.set(s.x,s.y,s.z-0.6);H.P.vel.set(0,0,0);H.P.inv=999;H.frames(3);
  H.tap('KeyK',2);H.frames(5);
  ok(!s.alive,'spin defeats a shark');
}
{
  const H=boot();startL2(H);
  const s=H.W.sharks.find(x=>!x.note);
  H.P.pos.set(s.x,s.y+0.9,s.z);H.P.vel.set(0,0,0);H.P.puff=true;H.frames(3);
  H.kd({code:'Space',preventDefault(){},repeat:false});H.frames(2);H.ku({code:'Space'});H.frames(25);
  ok(!s.alive,'jump-jet defeats a shark');
}

// ---- ordinary fish harmless ----
{
  const H=boot();startL2(H);
  const f=ordFish(H);
  const hp=H.P.hp,n0=H.W.notes.length,g0=parseInt(H.el('nts').textContent.split('/')[0].replace('♪ ',''),10);
  H.P.pos.set(f.x,f.y,f.z);H.P.vel.set(0,0,0);H.P.inv=999;
  for(let i=0;i<90;i++)H.frames(1);
  ok(H.P.hp===hp,'ordinary fish contact costs no heart');
  bubbleTarget(H,f);
  for(let i=0;i<120;i++){H.frames(1);if(!f.alive)break;}
  ok(!f.alive,'bubbling ordinary fish pops it');
  ok(H.W.notes.length===n0,'bubbling ordinary fish did not change notes.length');
  ok(parseInt(H.el('nts').textContent.split('/')[0].replace('♪ ',''),10)===g0,'bubbling ordinary fish did not increase gotNotes');
}

// ---- spikefish ----
{
  const H=boot();startL2(H);
  const sp=H.W.spikefish.find(x=>!x.note);
  H.P.pos.set(sp.x,sp.y,sp.z-0.5);H.P.vel.set(0,0,0);H.P.inv=999;H.frames(3);
  H.tap('KeyK',2);H.frames(5);
  ok(sp.alive,'spin does not defeat a spikefish');
}
{
  const H=boot();startL2(H);
  const sp=H.W.spikefish.find(x=>!x.note);
  H.P.pos.set(sp.x,sp.y+0.9,sp.z);H.P.vel.set(0,0,0);H.P.puff=true;H.frames(3);
  H.kd({code:'Space',preventDefault(){},repeat:false});H.frames(2);H.ku({code:'Space'});H.frames(25);
  ok(sp.alive,'jump-jet does not defeat a spikefish');
}
{
  const H=boot();startL2(H);
  const sp=H.W.spikefish.find(x=>!x.note);
  H.P.pos.set(sp.x,sp.y,sp.z);H.P.vel.set(0,0,0);H.P.hp=4;H.P.inv=0;
  for(let i=0;i<120;i++){H.frames(1);if(H.P.hp<4)break;}
  ok(H.P.hp===3,'spikefish contact costs one heart');
}
{
  const H=boot();startL2(H);
  const sp=noteSpike(H);
  const ref=sp.note;
  bubbleTarget(H,sp);
  for(let i=0;i<180;i++){H.frames(1);if(!sp.alive)break;}
  ok(!sp.alive,'bubble removes/defeats a spikefish');
  ok(revealed(ref),'note-bearing spikefish reveals held note when bubbled');
}

// ---- renewable clam and bubble power loss ----
{
  const H=boot();startL2(H);
  ok(grantBubble(H),'renewable clam grants bubble power');
  ok(H.P.bubble&&H.el('bubble').style.display!=='none','bubble HUD shown with power');
}
{
  const H=boot();startL2(H);
  grantBubble(H);
  const sp=H.W.spikefish.find(x=>!x.note);
  H.P.pos.set(sp.x,sp.y,sp.z);H.P.vel.set(0,0,0);H.P.hp=4;H.P.inv=0;
  for(let i=0;i<120;i++){H.frames(1);if(H.P.hp<4)break;}
  ok(!H.P.bubble,'player damage removes bubble power');
  H.frames(100);
  ok(grantBubble(H),'same clam grants bubble power again after loss');
}

// ---- Level 1 fire power unchanged ----
{
  const H=boot({autostart:true,level:0});
  const c=H.W.crates.find(x=>x.item==='fire');
  H.P.pos.set(c.x+1.2,0,c.z);H.P.vel.set(0,0,0);H.frames(2);H.tap('KeyK',2);H.frames(4);
  const w=H.W.powers[0];
  H.P.pos.set(w.x,w.y-0.6,w.z);H.P.vel.set(0,0,0);H.frames(4);
  ok(H.P.fire===true,'Level 1 fire power still works');
  H.P.pos.set(0,4,10);H.P.vel.set(0,0,0);H.frames(2);H.tap('KeyJ',2);
  ok(H.P.slam>0,'Level 1 air B still slams');
}

report();
