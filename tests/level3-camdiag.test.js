// Stage 4.8A — Level 3 landscape camera-distance diagnostic (query + scope).
const H=require('./harness.js')({autostart:false,search:'',innerWidth:844,innerHeight:390});
const {P,W,frames,ok,kd,ku,report}=H;
const D=H.getCamDiag();

function settle(x,y,z){
  P.inv=99;P.dead=false;P.lavaRecT=0;P.pos.set(x,y,z);P.vel.set(0,0,0);P.grounded=true;H.CAM.yaw=0;H.CAM.pitch=0.42;
  frames(30); // settle boom damp + pos damp
}
function boomAt(x,y,z){settle(x,y,z);return{target:H.CAM.targetDist,eff:H.CAM.effectiveDist,pulled:H.CAM.collisionPulled,mode:H.CAM.mode,boom:H.CAM.boomDist};}

// ---- parse allow-list ----
ok(D.parse('?camdist=8.5')===8.5,'parse 8.5');
ok(D.parse('?camdist=6.8')===6.8,'parse 6.8');
ok(D.parse('?camdist=6.07')===6.07,'parse 6.07');
ok(D.parse('?camdist=5')===5,'parse 5');
ok(D.parse('?camdist=3.93')===3.93,'parse 3.93');
ok(D.parse('?camdist=8.50')===8.5,'parse 8.50 alias');
ok(D.parse('?camdist=6.80')===6.8,'parse 6.80 alias');
ok(D.parse('?foo=1')==null,'missing camdist ignored');
ok(D.parse('?camdist=4.321')==null,'arbitrary number ignored');
ok(D.parse('?camdist=7')==null,'unsupported 7 ignored');
ok(D.parse('?camdist=')==null,'empty ignored');
ok(D.parse('?camdist=abc')==null,'malformed ignored');
ok(D.parse('?camdist=6.070')==null,'extra precision ignored');

// ---- Level 3 landscape allow-listed targets ----
H.startLevel(2);
H.setViewport(844,390);
const lands=[8.5,6.8,6.07,5,3.93];
for(const t of lands){
  D.setParam(t);
  settle(0,0.4,18);
  ok(Math.abs(H.CAM.targetDist-t)<1e-6,'L3 landscape target '+t+' (got '+H.CAM.targetDist+')');
  ok(Math.abs(H.CAM.boomDist-t)<0.08,'L3 landscape boom near '+t+' (got '+H.CAM.boomDist.toFixed(3)+')');
  ok(D.isActive()===true,'diag active at '+t);
}

// ---- unsupported setParam clears / ignores ----
ok(D.setParam('4.321')==null&&D.getParam()==null,'setParam rejects unsupported');
D.setParam(6.07);ok(D.getParam()===6.07,'restore 6.07');
D.setParam(null);ok(D.getParam()==null,'clear param');
settle(0,0.4,18);
ok(Math.abs(H.CAM.targetDist-8.5)<1e-6,'missing param preserves 8.5 outdoor');

// ---- portrait stays 8.5 even with valid param ----
D.setParam(3.93);
H.setViewport(390,844);
settle(0,0.4,18);
ok(Math.abs(H.CAM.targetDist-8.5)<1e-6,'L3 portrait stays 8.5 with camdist=3.93');
ok(D.isActive()===false,'diag inactive in portrait');
ok(Math.abs(H.CAM.boomDist-8.5)<0.08,'L3 portrait boom ~8.5');

// flip back to landscape resumes diagnostic
H.setViewport(844,390);
settle(0,0.4,18);
ok(Math.abs(H.CAM.targetDist-3.93)<1e-6,'landscape resumes diagnostic 3.93');
ok(D.isActive()===true,'diag active again in landscape');

// ---- FOV outdoor 60 ----
H.test.loadLevel(2);
H.setViewport(844,390);
D.setParam(6.07);
settle(0,0.4,18);
H.CAM.fovKick=0;frames(10);
ok(H.CAM.baseFov===60,'L3 outdoor base FOV 60');
ok(Math.abs(H.CAM.fov-60)<0.05,'L3 outdoor FOV ~60 without kick');

// transient kick still applied
H.CAM.fovKick=6;frames(1);
ok(H.CAM.fov>62,'transient fovKick still adds to base (fov='+H.CAM.fov.toFixed(2)+')');
H.CAM.fovKick=0;frames(40);

// ---- Wreck / Conch distances unchanged ----
H.test.loadLevel(1);
H.setViewport(844,390);
D.setParam(3.93);
const wr=H.window.__inWreckInterior,co=H.window.__inConchInterior;
H.window.__inWreckInterior=()=>true;
H.window.__inConchInterior=()=>false;
settle(0,0,8);
ok(Math.abs(H.CAM.targetDist-13.2)<1e-6,'Wreck boom stays 13.2 with camdist set');
ok(H.CAM.mode==='wreck','mode wreck');
H.window.__inWreckInterior=()=>false;
H.window.__inConchInterior=()=>true;
settle(0,0,8);
ok(Math.abs(H.CAM.targetDist-12.2)<1e-6,'Conch boom stays 12.2 with camdist set');
ok(H.CAM.mode==='conch','mode conch');
H.window.__inWreckInterior=wr;H.window.__inConchInterior=co;

// ---- Level 1 landscape unchanged ----
H.test.loadLevel(0);
H.setViewport(844,390);
D.setParam(3.93);
settle(0,0,10);
ok(Math.abs(H.CAM.targetDist-8.5)<1e-6,'L1 landscape ignores camdist (target 8.5)');
ok(D.isActive()===false,'diag not active on L1');

// ---- Level 2 landscape unchanged ----
H.test.loadLevel(1);
H.setViewport(844,390);
D.setParam(5);
settle(0,0,8);
ok(Math.abs(H.CAM.targetDist-8.5)<1e-6,'L2 landscape ignores camdist (target 8.5)');

// ---- keyboard stepping only cycles allow-list on L3 ----
H.test.loadLevel(2);
H.setViewport(844,390);
D.setParam(8.5);
kd({code:'BracketRight',preventDefault(){},repeat:false});frames(2);
ok(D.getParam()===6.8,'] steps 8.5 -> 6.8');
kd({code:'BracketRight',preventDefault(){},repeat:false});frames(2);
ok(D.getParam()===6.07,'] steps to 6.07');
kd({code:'BracketLeft',preventDefault(){},repeat:false});frames(2);
ok(D.getParam()===6.8,'[ steps back to 6.8');
// wrap
D.setParam(3.93);
kd({code:'BracketRight',preventDefault(){},repeat:false});frames(2);
ok(D.getParam()===8.5,'] wraps 3.93 -> 8.5');

H.test.loadLevel(0);
D.setParam(6.07);
const before=D.getParam();
kd({code:'BracketRight',preventDefault(){},repeat:false});frames(2);
ok(D.getParam()===before,'[ ] does not change param off Level 3');

// ---- Stage 4.7A shadow still present ----
H.test.loadLevel(2);
const S=H.getShadow();
ok(S&&S.SHADOW_OPACITY===0.44&&S.SHADOW_MIN_PLAY_OPACITY===0.38,'Stage 4.7A shadow constants unchanged');

// ---- Sky Blast unchanged ----
const sky=H.getSky();
ok(sky.puffVMul===1.4&&sky.boostMax===12.5&&sky.boostDecay===1.6&&sky.glideDur===0.55&&sky.glideFallCap===-2.2&&sky.glideStartVy===0.2,'Sky Blast/glide unchanged');

// ---- player scale ----
const pl=H.getPlayer();
ok(pl&&Math.abs(pl.scale.x-0.72)<1e-6,'player scale unchanged 0.72');

// ---- open-area effective ≈ target for each distance ----
H.setViewport(844,390);
const open={};
for(const t of lands){
  D.setParam(t);
  const r=boomAt(0,0.4,20);
  open[t]=r;
  ok(Math.abs(r.target-t)<1e-6,'open target '+t);
  ok(Math.abs(r.eff-t)<0.35,'open effective near target '+t+' (eff '+r.eff.toFixed(2)+')');
}
console.log('open-area effective',JSON.stringify(open,null,0));

report();
