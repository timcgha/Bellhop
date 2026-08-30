// Level 3 post-playtest patch 2: Geode entrance fade, Snoozle 3 chamber clarity,
// crater volcano presence, win eruption / lava-fireworks payoff.
const fs=require('fs'),path=require('path');
const H=require('./harness.js')({autostart:false});
const {P,W,frames,tap,ok,kd,ku,report,el}=H;

H.startLevel(2);
const L=H.getLevel();
const R=L.route;
ok(L&&L.id==='level3','boots Level 3');
ok(H.getCamDiag().VERSION_BASE==='v43 · Candy Planet','version stamp');
ok(L.snoozleGoal===4&&W.snoozles.length===4,'Snoozles = 4');
ok(W.notes.length===10,'notes frozen at 10');
ok(L.mandatoryLeaps.length===11,'mandatory leaps preserved');
ok(H.getSky().puffVMul===1.4&&H.getSky().boostMax===12.5,'Sky Blast unchanged');
ok(H.getSky().glideDur===0.55&&H.getSky().glideFallCap===-2.2,'glide unchanged');

function release(){
  for(const c of ['KeyW','KeyA','KeyS','KeyD','Space','ShiftLeft','KeyJ','KeyK']){
    try{ku({code:c,preventDefault(){},repeat:false});}catch(e){}
  }
}
function settle(x,y,z){
  release();
  P.inv=99;P.dead=false;P.lavaRecT=0;P.hp=4;P.pos.set(x,y,z);P.vel.set(0,0,0);
  P.slam=0;P.puffAir=0;P.grounded=true;P.leapBoost.set(0,0,0);P.glideT=0;P.glideArmed=false;P.wingsOut=false;
  H.CAM.yaw=0;frames(8);
}
function wake(s){
  P.pos.set(s.g.position.x,s.g.position.y,s.g.position.z+1);
  P.vel.set(0,0,0);P.grounded=true;P.bonkCD=0;frames(2);
  tap('KeyK',2);frames(4);
}
function reload(){
  if(H.isStarted()&&typeof H.window.__softReturnToPicker==='function')H.window.__softReturnToPicker();
  frames(2);H.startLevel(2);
}

// ---- A. Geode entrance shell fade ----
const shell=W.geodeShell;
ok(shell&&shell.meshes&&shell.meshes.length>8,'Geode entrance registers shell meshes for fade');
ok(shell.fade===1&&!shell.inside,'shell starts opaque outside');
ok(L.steps.some(s=>s[0]==='solid'&&s[8]&&s[8].geodeShell),'entrance corridor walls tagged geodeShell');
settle(0,20.4,-250);
frames(40);
ok(!shell.inside&&shell.fade>0.85,'approach outside mouth keeps shell opaque');
settle(0,20.4,-270);
frames(90);
ok(shell.inside,'entering Hollow / mouth sets shellInside');
ok(shell.fade<0.4,'inside Geode entrance shell fades below 40% opacity');
const sample=shell.meshes[0];
ok(sample&&sample.material&&sample.material.opacity<0.45,'a shell mesh opacity tracks the fade');
// Collision still honest while faded — push into west mouth mass.
settle(-2.2,20.4,-268);
for(let i=0;i<80;i++){P.vel.x=-5;frames(1);}
ok(P.pos.x>-4.8,'faded mouth shell still collides — west mass blocks');
settle(0,20.4,-250);
frames(90);
ok(!shell.inside&&shell.fade>0.85,'leaving Geode restores shell opacity');

// ---- B. Snoozle 3 cracked chamber clarity (main route, not secret) ----
const cg=W.crackedGeode;
ok(cg&&cg.g&&cg.openFacing==='+z','cracked geode chamber faces approach (+Z)');
ok(cg.mainRoute===true,'Snoozle 3 chamber flagged as main-route');
ok(cg.g.userData&&cg.g.userData.chamber===true,'chamber userData marks readable open chamber');
ok(!cg.g.userData.secret,'chamber is not marked as secret');
const sn3=W.snoozles[2];
ok(sn3&&Math.abs(sn3.g.position.x-R.snoozle3.x)<0.5&&Math.abs(sn3.g.position.z-R.snoozle3.z)<0.5,'Snoozle 3 still at authored chamber spot');
ok(Math.abs(cg.x-R.snoozle3.x)<0.2&&Math.abs(cg.z-R.snoozle3.z)<0.2,'chamber centered on Snoozle 3');
// Approach from +Z into the open mouth — wake without parting the optional curtain.
ok(W.steamCurtains.some(c=>!c.parted),'optional secret curtain still closed');
settle(R.snoozle3.x,20.6,R.snoozle3.z+2.4);
ok(Math.hypot(P.pos.x-sn3.g.position.x,P.pos.z-sn3.g.position.z)<3.2,'open chamber approach reaches Snoozle 3');
wake(sn3);
ok(sn3.state!=='sleep','Snoozle 3 wakes via normal shared wake (spin)');
ok(el('snz').textContent==='😴 1/4','HUD 1/4 after Snoozle 3 alone');
ok(!W.won,'waking Snoozle 3 does not win');
ok(W.steamCurtains.every(c=>!c.parted)||W.steamCurtains.some(c=>!c.parted),'secret curtain remains optional / separate');

// Secret alcove still optional and separate from Snoozle 3
ok(R.secretCurtain&&Math.abs(R.secretCurtain.x+7)<1,'secret curtain stays west of main route');
ok(Math.abs(R.snoozle3.x-3.2)<0.1,'Snoozle 3 stays on east main-chamber offset');
ok(Math.abs(R.snoozle3.x-R.secretCurtain.x)>8,'Snoozle 3 is not behind the secret curtain');

// ---- C. Crater / volcano presence + eruption payoff ----
reload();
ok(L.steps.filter(s=>s[0]==='volcanoLandmark').length>=3,'multiple volcano landmarks along the Peak');
ok(L.steps.some(s=>s[0]==='volcanoLandmark'&&s[3]<-500),'late-route volcano landmark near Climb/Crater');
ok(W.organ&&W.organ.eruptColumn&&W.organ.eruptPlume,'Organ builds eruption column/plume meshes');
ok(!W.organ.eruptionActive&&!W.organ.eruptColumn.visible,'eruption idle before win');

function wakeAllButLast(){
  for(let i=0;i<3;i++){wake(W.snoozles[i]);frames(30);}
}
wakeAllButLast();
ok(el('snz').textContent==='😴 3/4','3/4 before Snoozle 4');
const kb=W.organ.trigger;
P.pos.set(kb.x,kb.y+0.4,kb.z);frames(10);
ok(!W.won,'keyboard before 4/4 still does not win');
wake(W.snoozles[3]);frames(12);
ok(W.organ.active&&!W.won,'Snoozle 4 activates Organ; does not win');
ok(el('snz').textContent==='😴 4/4','4/4 at climax');
P.pos.set(kb.x,kb.y+0.4,kb.z);P.grounded=true;frames(10);
ok(W.won,'keyboard after 4/4 wins');
ok(W.organ.playing&&W.organ.eruptionActive,'win sets Organ playing + eruptionActive');
ok(W.organ.eruptionBurst>=1,'at least one eruption burst spawned');
ok(W.organFireworks.some(f=>f.kind==='erupt'),'lava eruption jets present in celebration pool');
ok(W.organFireworks.some(f=>f.kind==='fw'),'sky firework bursts still present');
ok(W.organ.eruptColumn.visible&&W.organ.eruptPlume.visible,'persistent eruption plume visible on win');
ok(H.CAM.mode==='finish','finish camera mode');
ok(H.CAM.pos.z>kb.z+10,'finish camera pulled back to show crater/eruption');
ok(H.CAM.look.y>kb.y+2,'finish look raised toward eruption sky');
ok(W.FINISH.winMsg==='The mountain is singing!','FINISH subtitle unchanged');

// Architecture: shared win stays landmark-agnostic
const entities=fs.readFileSync(path.join(__dirname,'..','src','entities.js'),'utf8');
const genericWin=entities.slice(entities.indexOf('function triggerWin'),entities.indexOf('function loadLevel'));
ok(!/\bORGAN\b|\borgan\b|\blevel3\b|\beruption\b/.test(genericWin),
  'generic win flow has no Level 3 / eruption branches');

// Final counts
ok(W.snoozles.length===4&&L.snoozleGoal===4,'final Snoozle count intact');
ok(W.notes.length===10,'final note count intact');

// L1 / L2 unchanged smoke
H.test.loadLevel(0);
ok(H.AU().song.id==='meadow','Level 1 song unchanged');
ok(!H.W.geodeShell||H.W.geodeShell.meshes.length===0,'Level 1 has no Geode shell');
H.test.loadLevel(1);
ok(H.AU().song.id==='deep','Level 2 song unchanged');
ok(H.W.wreck&&H.W.wreck.shellMeshes,'Level 2 Wreck shell fade still present');

report();
