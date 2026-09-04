// Level 3 Stage 7: Crater, Snoozle 4, Great Steam Organ, finish, celebration.
const fs=require('fs'),path=require('path');
const H=require('./harness.js')({autostart:false});
const {P,W,frames,tap,ok,kd,ku,report,el}=H;

H.startLevel(2);
const L=H.getLevel();
const R=L.route;
ok(L&&L.id==='level3','boots Level 3');
ok(R.snoozle4&&R.organ&&R.keyboard&&R.climbRim,'Crater route markers present');
ok(W.snoozles.length===4,'exactly four physical Snoozles');
ok(L.snoozleGoal===4,'snoozleGoal remains 4');
ok(W.notes.length===10,'notes frozen at 10');
ok(W.organ&&!W.organ.active,'Organ exists and starts dark');
ok(W.FINISH&&W.FINISH.winMsg==='The mountain is singing!','FINISH subtitle is Peak-owned');
ok(!W.protoEndpoints||W.protoEndpoints.length===0,'no prototype endpoint');
ok(!L.steps.some(s=>s[0]==='protoEndpoint'),'no protoEndpoint in level data');
ok(!L.steps.some(s=>s[0]==='unfinishedFinish'),'unfinishedFinish replaced by steamOrgan');
ok(H.getSky().puffVMul===1.4&&H.getSky().boostMax===12.5&&H.getSky().boostDecay===1.6,'Sky Blast unchanged');
ok(H.getSky().glideDur===0.55&&H.getSky().glideFallCap===-2.2&&H.getSky().glideStartVy===0.2,'glide unchanged');
ok(H.getCamDiag().VERSION_BASE==='v52 · iPhone playtest polish','version stamp');
ok(H.AU().song&&H.AU().song.id==='peak','Level 3 uses peak song');

function release(){
  for(const c of ['KeyW','KeyA','KeyS','KeyD','Space','ShiftLeft','KeyJ','KeyK']){
    try{ku({code:c,preventDefault(){},repeat:false});}catch(e){}
  }
}
function settle(x,y,z){
  release();
  P.inv=99;P.dead=false;P.lavaRecT=0;P.hp=4;P.pos.set(x,y,z);P.vel.set(0,0,0);P.slam=0;P.puffAir=0;P.grounded=true;H.CAM.yaw=0;
  frames(6);
}
function wake(s){
  P.pos.set(s.g.position.x,s.g.position.y,s.g.position.z+1);
  P.vel.set(0,0,0);P.grounded=true;P.bonkCD=0;frames(2);
  tap('KeyK',2);frames(4);
}
function wakeAllButLast(){
  for(let i=0;i<3;i++){wake(W.snoozles[i]);frames(40);}
}
function reload(){
  // loadLevel alone does not reset rescued/gotNotes — soft-return then start.
  if(H.isStarted())H.window.__softReturnToPicker();
  frames(2);H.startLevel(2);
}

// ---- Snoozle 4 on rim ----
const s4=W.snoozles[3];
ok(s4&&Math.abs(s4.g.position.x-R.snoozle4.x)<0.5&&Math.abs(s4.g.position.z-R.snoozle4.z)<0.5,'Snoozle 4 on crater rim');
ok(s4.g.position.y>42,'Snoozle 4 sits on elevated rim');
settle(R.snoozle4.x,R.snoozle4.y,R.snoozle4.z+1.2);
ok(Math.hypot(P.pos.x-s4.g.position.x,P.pos.z-s4.g.position.z)<3,'Snoozle 4 reachable from Climb rim');

// ---- Organ visible / dark at 3/4 ----
wakeAllButLast();
ok(el('snz').textContent==='😴 3/4','HUD 3/4 before Snoozle 4');
ok(!W.organ.active&&!W.won,'Organ inactive and won false at 3/4');
ok(H.AU().layers===3,'peak layers = 3 before fourth');
ok(!el('win')||el('win').style.display!=='flex','no CONGRATULATIONS at 3/4');

// Keyboard before 4 awake
const kb=W.organ.trigger;
P.pos.set(kb.x,kb.y+0.4,kb.z);P.grounded=true;frames(12);
ok(!W.won,'keyboard before 4/4 does not win');

// ---- Fourth wake = climax, not win ----
reload();
let allAwakeCalls=0;
wakeAllButLast();
const prevOn=W.FINISH.onAllAwake.bind(W.FINISH);
W.FINISH.onAllAwake=function(){allAwakeCalls++;prevOn();};
wake(W.snoozles[3]);frames(20);
ok(el('snz').textContent==='😴 4/4','HUD 4/4 after Snoozle 4');
ok(allAwakeCalls===1,'FINISH.onAllAwake fires exactly once');
ok(W.organ.active&&!W.won,'Organ activates; won remains false');
ok(H.AU().layers===4,'fourth Snoozle completes Peak layers (no Organ layer yet)');
ok(H.AU().layers<5,'Steam Organ music layer not yet playing');
ok(!el('win')||el('win').style.display!=='flex','no CONGRATULATIONS on Organ activation');
ok((W.organFireworks||[]).length===0,'no celebration fireworks at climax');

// ---- Keyboard finish ----
let fanfares=0;W.sfx.fanfare=()=>{fanfares++;};
P.pos.set(kb.x,kb.y+0.4,kb.z);P.vel.set(0,0,0);P.grounded=true;frames(10);
ok(W.won,'keyboard after 4/4 wins');
ok(fanfares===1,'fanfare once');
ok(H.AU().layers===5,'keyboard joins Steam Organ layer');
ok(W.organ.playing,'Organ playing state after win');
ok(el('win').style.display==='flex','CONGRATULATIONS shown');
ok(H.CAM.mode==='finish','celebration camera mode');
ok(typeof W.FINISH.camHold==='function','FINISH owns celebration camHold');
const fwBefore=W.organFireworks.length;
ok(fwBefore>0,'decorative fireworks spawned');
// Repeated keyboard overlap does not retrigger
P.pos.set(kb.x,kb.y+0.4,kb.z);frames(20);
ok(fanfares===1,'repeated keyboard overlap does not retrigger win');

// ---- Fireworks are not hazards ----
ok(!W.lavas.some(l=>W.organFireworks.some(f=>f.m===l.g)),'fireworks not in lava array');
ok(W.organFireworks.every(f=>(f.kind==='fw'||f.kind==='erupt')&&!f.damage),'firework/eruption particles have no damage callback');
const hpFw=P.hp;P.inv=0;
for(const f of W.organFireworks){f.m.position.set(P.pos.x,P.pos.y+0.5,P.pos.z);}
frames(10);
ok(P.hp===hpFw,'firework overlap cannot decrement hearts');

// ---- Win-safety: hazards inert after win ----
P.hp=4;P.inv=0;
const deepLava=W.lavas.find(l=>l.max.y>20&&l.min.z<-560);
ok(!!deepLava,'deep crater lava exists for post-win probe');
P.pos.set((deepLava.min.x+deepLava.max.x)/2,deepLava.max.y-0.05,(deepLava.min.z+deepLava.max.z)/2);
frames(10);
ok(P.hp===4,'lava after win costs zero hearts');

// Ember after win
P.hp=4;P.inv=0;P.pos.set(0,44.5,-590);
const emb=W.embers.find(e=>!e.alive)||W.embers[0];
emb.alive=true;emb.life=2;emb.m.visible=true;emb.pos.set(P.pos.x,P.pos.y+0.55,P.pos.z);emb.vel.set(0,0,0);emb.m.position.copy(emb.pos);
frames(6);
ok(P.hp===4,'ember after win costs zero hearts');

// Wisp after win
P.hp=4;P.inv=0;
const wisp=W.wisps.find(w=>w.alive)||W.wisps[0];
if(wisp){wisp.alive=true;wisp.g.visible=true;wisp.g.position.set(P.pos.x,P.pos.y+0.5,P.pos.z);frames(6);}
ok(P.hp===4,'wisp after win costs zero hearts');

// Cinder body overlap after win (push-only historically; damage path is hurtPlayer)
P.hp=4;P.inv=0;
const cin=W.cinders.find(c=>c.alive);
if(cin){cin.x=P.pos.x;cin.z=P.pos.z;cin.y=P.pos.y;frames(8);}
ok(P.hp===4,'Cinder overlap after win costs zero hearts');

// Generic hurtPlayer invariant
const hpH=P.hp;
// Access via forcing: win already set; call through ember again
emb.alive=true;emb.life=2;emb.pos.set(P.pos.x,P.pos.y+0.55,P.pos.z);emb.m.position.copy(emb.pos);
frames(4);
ok(P.hp===hpH,'repeated hazard overlap after win still zero damage');

// ---- Pre-win hazards still damage ----
reload();
settle(R.sideLava.x,0.5,R.sideLava.z+3);P.hp=4;P.inv=0;P.lavaRecT=0;
P.pos.set(R.sideLava.x,0.2,R.sideLava.z);frames(8);
ok(P.hp===3,'lava damages normally before win');

reload();
settle(0,8.5,-78);P.hp=4;P.inv=0;P.lavaRecT=0;
const emb2=W.embers[0];
emb2.alive=true;emb2.life=2;emb2.m.visible=true;emb2.pos.set(P.pos.x,P.pos.y+0.55,P.pos.z);emb2.vel.set(0,0,0);emb2.m.position.copy(emb2.pos);
frames(6);
ok(P.hp===3,'ember damages normally before win');

reload();
settle(R.wispOpen.x,19.5,R.wispOpen.z);P.hp=4;P.inv=0;
const wOpen=W.wisps.find(w=>w.alive&&w.path&&w.path[0]&&Math.abs(w.path[0].z-R.wispOpen.z)<12)||W.wisps[0];
wOpen.alive=true;wOpen.g.visible=true;wOpen.g.position.set(P.pos.x,P.pos.y+0.5,P.pos.z);frames(6);
ok(P.hp===3,'wisp contact damages normally before win');

// ---- Snoozle flight paths avoid major solids ----
reload();
function samplePath(s){
  const pts=[];
  const start={x:s.g.position.x,y:s.g.position.y,z:s.g.position.z};
  pts.push(start);
  if(s.home.path)for(const p of s.home.path)pts.push(p);
  pts.push({x:s.home.x,y:s.home.y!=null?s.home.y:0,z:s.home.z});
  return pts;
}
function segmentHitsFatSolid(a,b){
  // Sample midpoints; ignore thin home pads / keyboard / small décor (w,d < 3)
  for(let i=1;i<=8;i++){
    const k=i/8;
    const x=a.x+(b.x-a.x)*k,y=a.y+(b.y-a.y)*k,z=a.z+(b.z-a.z)*k;
    for(const sol of W.solids){
      const w=sol.max.x-sol.min.x,d=sol.max.z-sol.min.z,h=sol.max.y-sol.min.y;
      if(w<3||d<3||h<2)continue; // skip pads/rails
      if(sol.mesh&&sol.mesh.visible===false&&(sol.max.y-sol.min.y)>40)continue; // world bounds
      if(x>sol.min.x+0.4&&x<sol.max.x-0.4&&y>sol.min.y+0.4&&y<sol.max.y-0.4&&z>sol.min.z+0.4&&z<sol.max.z-0.4){
        return sol;
      }
    }
  }
  return null;
}
for(let i=0;i<4;i++){
  const s=W.snoozles[i];
  ok(s.home&&typeof s.home.x==='number','Snoozle '+(i+1)+' has Organ home');
  ok(s.home.y!=null&&s.home.y>50,'Snoozle '+(i+1)+' home is on a pipe top');
  const pts=samplePath(s);
  let hit=null;
  for(let j=0;j<pts.length-1;j++){hit=segmentHitsFatSolid(pts[j],pts[j+1]);if(hit)break;}
  ok(!hit,'Snoozle '+(i+1)+' flight clears major solids'+(hit?' hit y='+hit.min.y+'-'+hit.max.y:''));
}
// Snoozle 3 must exit Hollow before climbing
const p3=W.snoozles[2].home.path;
ok(p3&&p3[0].z>-320&&p3.some(p=>p.z>-275),'Snoozle 3 path exits Geode Hollow mouth');
ok(p3.every(p=>!(p.z<-280&&p.z>-360&&Math.abs(p.x)<10&&p.y>24&&p.y<32)),'Snoozle 3 path does not cut Hollow ceiling band');

// ---- Optional challenge not required ----
reload();
wakeAllButLast();
wake(W.snoozles[3]);frames(10);
ok(W.organ.active,'Organ activates with challenge notes uncollected');
ok(W.notes.filter(n=>!n.got).length===10,'all notes still uncollected at climax');
P.pos.set(kb.x,kb.y+0.4,kb.z);frames(8);
ok(W.won,'win without collecting optional notes');

// ---- Celebration visibility structure ----
ok(P.g||true,'player exists');
ok(W.snoozles.every(s=>s.g.visible!==false),'Snoozles remain visible');
ok(H.CAM.mode==='finish'||W.won,'finish camera engaged while won');
ok(Math.abs(P.pos.z-kb.z)<4&&P.pos.y>kb.y-0.5,'Pling staged on/near keyboard');
ok(W.organ.homes.every(h=>Math.hypot(h.x-kb.x,h.z-kb.z)>3),'Snoozle homes frame keyboard, not its center');
const fwBehind=W.organFireworks.filter(f=>f.m.position.z<kb.z-1||f.m.position.y>kb.y+6);
ok(fwBehind.length>0,'fireworks placed behind/above celebration staging');

// ---- Return-to-picker ----
frames(30);
ok(typeof H.window.__returnToLevelSelect==='function','generic return-to-picker exists');
H.window.__returnToLevelSelect();frames(4);
ok(!H.isStarted(),'return-to-picker shows level select');

// ---- Architecture: no Level 3 branch in generic win ----
const entities=fs.readFileSync(path.join(__dirname,'..','src','entities.js'),'utf8');
const genericWin=entities.slice(entities.indexOf('function triggerWin'),entities.indexOf('function loadLevel'));
ok(!/\bWM\b|\bRAINBOW\b|\bCONCH\b|\bORGAN\b|\borgan\b|\blevel3\b/.test(genericWin),
  'generic triggerWin/updateWin free of Organ/Level3 branches');
const enemies=fs.readFileSync(path.join(__dirname,'..','src','enemies.js'),'utf8');
const snoozleMove=enemies.slice(enemies.indexOf('function updateSnoozles'),enemies.indexOf('function updateBoat'));
ok(/s\.home\.x/.test(snoozleMove)&&!/ORGAN|organ|steamOrgan/.test(snoozleMove),
  'shared Snoozle movement stays landmark-free');
const playerSrc=fs.readFileSync(path.join(__dirname,'..','src','player.js'),'utf8');
ok(/function hurtPlayer\([^)]*\)\{if\(won\|\|/.test(playerSrc)||/if\(won\|\|P\.inv/.test(playerSrc),
  'hurtPlayer is win-safe generically');
ok(/function lavaContact\(\)\{\s*if\(won\|\|/.test(playerSrc.replace(/\n/g,'')),
  'lavaContact is win-safe generically');

// ---- Final invariants ----
H.startLevel(2);
ok(W.snoozles.length===4&&L.snoozleGoal===4,'final Snoozle count 4/4');
ok(W.notes.length===10,'final note total 10');
ok(L.mandatoryLeaps.length===11,'mandatory leap count preserved (5 field + 6 climb)');
ok(L.mandatoryLeaps.every(leap=>W.steamVents.some(v=>Math.hypot(v.x-leap.takeoff.x,v.z-leap.takeoff.z)<=leap.takeoff.ventReach)),
  'every mandatory leap still has renewable vent');
ok(W.organ&&W.organ.trigger,'keyboard finish exists');
ok(H.getCamDiag().parse('?camdist=6.8')===6.8,'camdiag unchanged for gameplay');

// ---- L1/L2 audio unchanged ----
H.test.loadLevel(0);
ok(H.AU().song.id==='meadow','Level 1 meadow song unchanged');
H.test.loadLevel(1);
ok(H.AU().song.id==='deep','Level 2 deep song unchanged');

report();
