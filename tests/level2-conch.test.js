// Stage 6B polish: Conch doorway honesty, shell walls, interior-only win.
const fs=require('fs'),path=require('path');
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
function wake(H,s){
  H.P.pos.set(s.g.position.x,s.g.position.y,s.g.position.z+1);
  H.P.vel.set(0,0,0);H.frames(2);H.tap('KeyK',2);H.frames(4);
}
function wakeAllButLast(H){
  for(let i=0;i<H.W.snoozles.length-1;i++){wake(H,H.W.snoozles[i]);H.frames(40);}
}
function wakeAll(H){
  for(const s of H.W.snoozles){wake(H,s);H.frames(40);}
}
function push(H,x,y,z,vx,vz,n){
  H.P.pos.set(x,y,z);H.P.vel.set(0,0,0);
  for(let i=0;i<(n||120);i++){H.P.vel.x=vx;H.P.vel.z=vz;H.frames(1);}
  return H.P.pos;
}
function canStand(H,x,z,frames){
  H.P.pos.set(x,3,z);H.P.vel.set(0,0,0);H.frames(frames||50);
  return H.P.pos.y<1.5&&Math.hypot(H.P.pos.x-x,H.P.pos.z-z)<1.5;
}
function samplePath(from,to,n){
  const pts=[];
  for(let i=0;i<=n;i++){
    const t=i/n;
    pts.push({
      x:from.x+(to.x-from.x)*t,
      y:from.y+(to.y-from.y)*t,
      z:from.z+(to.z-from.z)*t
    });
  }
  return pts;
}
function crossesWreckHull(pts){
  const cx=0,cz=-178,HW=7.8,HL=10.4,WH=13;
  return pts.some(p=>{
    const inX=Math.abs(p.x-cx)<HW+0.4,inZ=p.z>cz-HL-0.4&&p.z<cz+HL+0.4,low=p.y<WH-0.5;
    if(!(inX&&inZ&&low))return false;
    const nearSide=Math.abs(Math.abs(p.x-cx)-HW)<1.2;
    const nearStern=Math.abs(p.z-(cz-HL))<1.2;
    return nearSide||nearStern;
  });
}

const CONCH_Z=-288;

// ---- registration ----
{
  const H=boot();startL2(H);
  const c=H.W.conch,f=H.W.FINISH;
  ok(!!c&&!!c.g,'Level 2 builds the giant Conch');
  ok(f&&f.z===CONCH_Z&&f.x===0,'Conch registers as Level 2 FINISH anchor');
  ok(typeof f.onAllAwake==='function'&&typeof f.onWin==='function'&&typeof f.update==='function',
    'Conch FINISH satisfies the runtime contract');
  ok(!c.open,'Conch starts closed');
  ok(H.W.solids.indexOf(c.doorSolid)>=0,'closed door collision is present at start');
  ok(c.doorVis&&c.doorVis.visible,'closed door visual is visible at start');
  ok(c.openRim&&!c.openRim.visible,'open rim stays hidden while closed');
  ok(c.shellSolids&&c.shellSolids.length>=5,'shell collision proxies are registered');
}

// ---- closed front entrance blocks ----
{
  const H=boot();startL2(H);
  const c=H.W.conch;
  wakeAllButLast(H);
  ok(!c.open,'Conch stays closed with fewer than four Snoozles awake');
  const before=push(H,0,2.0,c.doorZ+3,0,-4,140);
  ok(before.z>c.doorZ-0.2,'closed front entrance physically blocks entry');
  ok(c.doorVis.visible,'closed entrance still looks closed');
}

// ---- closed side / rear shell walls block ----
{
  const H=boot();startL2(H);
  const c=H.W.conch;
  const left=push(H,-8,2.0,c.cz-1,4,0,140);
  ok(left.x<=-2.5,'closed left shell wall blocks');
  const right=push(H,8,2.0,c.cz-1,-4,0,140);
  ok(right.x>=2.5,'closed right shell wall blocks');
  const rear=push(H,0,2.0,c.cz-10,0,4,140);
  ok(rear.z<=c.cz-4.0,'closed rear shell wall blocks');
}

// ---- touching exterior shell never wins (closed or open) ----
{
  const H=boot();startL2(H);
  const c=H.W.conch;
  wakeAllButLast(H);
  H.P.pos.set(-4.5,2.0,c.cz-1);H.P.vel.set(0,0,0);H.frames(20);
  ok(!H.W.won,'touching exterior shell with three awake does not win');
  wake(H,H.W.snoozles[3]);H.frames(8);
  ok(c.open&&!H.W.won,'opening alone does not win');
  H.P.pos.set(5.0,2.0,c.cz-1);H.P.vel.set(0,0,0);H.frames(20);
  ok(!H.W.won,'touching exterior shell after open does not win');
  H.P.pos.set(0,2.0,c.cz-8);H.P.vel.set(0,0,0);H.frames(20);
  ok(!H.W.won,'touching rear exterior after open does not win');
}

// ---- fourth wake opens intended doorway only ----
{
  const H=boot();startL2(H);
  const c=H.W.conch;
  wakeAllButLast(H);
  ok(!c.open,'still closed before the fourth wake');
  wake(H,H.W.snoozles[3]);H.frames(8);
  ok(c.open,'fourth Snoozle wake opens the Conch');
  ok(H.W.solids.indexOf(c.doorSolid)<0,'open doorway removes door collision');
  ok(!c.doorVis.visible,'closed door visual hides when open');
  ok(c.openRim.visible,'open rim appears when passable');
  ok(c.backWash&&c.backWash.visible,'back-wall wash appears when passable');
  ok(!c.mouthFill.visible,'mouth plug hides so the aperture stays hollow');
  ok(!H.W.won,'waking Snoozle 4 leaves won false');
  ok(H.el('win').style.display!=='flex','opening the Conch does not start congratulations');
}

// ---- after open: side/rear still block; doorway passable ----
{
  const H=boot();startL2(H);
  const c=H.W.conch;
  wakeAll(H);H.frames(6);
  const left=push(H,-8,2.0,c.cz-1,4,0,140);
  ok(left.x<=-2.5,'open Conch left shell still blocks');
  const right=push(H,8,2.0,c.cz-1,-4,0,140);
  ok(right.x>=2.5,'open Conch right shell still blocks');
  const rear=push(H,0,2.0,c.cz-10,0,4,140);
  ok(rear.z<=c.cz-4.0,'open Conch rear shell still blocks');
  const through=push(H,0,2.0,c.doorZ+3,0,-4,160);
  ok(through.z<c.doorZ-0.5,'open doorway lets the player swim inside');
  ok(canStand(H,0,c.cz+0.6,50)||H.P.pos.z<c.doorZ,
    'interior remains traversable with Level 2 physics');
}

// ---- doorway contact alone does not win ----
{
  const H=boot();startL2(H);
  const c=H.W.conch;
  wakeAll(H);H.frames(6);
  H.P.pos.set(0,2.0,c.doorZ+0.1);H.P.vel.set(0,0,0);H.frames(30);
  ok(!H.W.won,'standing just outside the open doorway does not win');
  H.P.pos.set(0,2.0,c.doorZ-0.3);H.P.vel.set(0,0,0);H.frames(30);
  ok(!H.W.won,'doorway contact alone does not win');
  ok(H.P.pos.z>c.trigger.z+c.trigger.hz,'doorway stay is still short of the interior trigger');
}

// ---- interior trigger wins exactly once ----
{
  const H=boot();startL2(H);
  let fanfares=0;H.W.sfx.fanfare=()=>{fanfares++;};
  wakeAll(H);H.frames(10);
  ok(H.W.conch.open&&!H.W.won,'four awake opens Conch and still does not win while outside');
  H.P.pos.set(0,2,H.W.conch.doorZ+2.5);H.P.vel.set(0,0,0);H.frames(20);
  ok(!H.W.won,'lingering outside the open doorway does not win');
  push(H,0,2.0,H.W.conch.doorZ+2.5,0,-3.5,100);
  H.P.pos.set(H.W.conch.trigger.x,H.W.conch.trigger.y,H.W.conch.trigger.z);H.P.vel.set(0,0,0);
  H.frames(8);
  ok(H.W.won,'reaching the interior finish trigger wins Level 2');
  ok(fanfares===1,'triggerWin plays fanfare exactly once');
  ok(H.el('win').style.display==='flex','congratulations banner appears on Conch win');
  H.frames(40);
  ok(fanfares===1,'repeated frames inside do not retrigger fanfare');
  const conf=H.W.celebrationParticles.filter(p=>p.life>0&&p.grav===-2.2);
  ok(conf.length>0,'generic celebration confetti emits after Conch win');
  ok(conf.some(p=>Math.hypot(p.m.position.x-H.W.FINISH.x,p.m.position.z-H.W.FINISH.z)<16),
    'shared confetti anchors to Conch FINISH');
  ok(H.W.conch.rainbow&&H.W.conch.rainbow.visible,'Level 2 rainbow becomes visible on win');
}

// ---- full logical flow ----
{
  const H=boot();startL2(H);
  for(let i=0;i<3;i++){
    wake(H,H.W.snoozles[i]);H.frames(50);
    ok(!H.W.won&&!H.W.conch.open,'Snoozle '+(i+1)+' does not open Conch or win');
  }
  wake(H,H.W.snoozles[3]);H.frames(10);
  ok(H.W.conch.open&&!H.W.won,'Snoozle 4 opens Conch and still does not win');
  H.P.pos.set(0,2.0,H.W.conch.doorZ);H.frames(10);
  ok(!H.W.won,'standing in the open doorway after Snoozle 4 does not win');
  H.P.pos.set(H.W.conch.trigger.x,H.W.conch.trigger.y,H.W.conch.trigger.z);H.frames(10);
  ok(H.W.won,'only the interior finish trigger completes Level 2');
}

// ---- snoozle homes + wreck departure path ----
{
  const H=boot();startL2(H);
  ok(H.W.snoozles.length===4,'exactly four Level 2 Snoozles');
  for(const s of H.W.snoozles){
    ok(Number.isFinite(s.home.x)&&Number.isFinite(s.home.z),'each Snoozle has a data-driven home');
    ok(Math.hypot(s.home.x-0,s.home.z-CONCH_Z)<10,'each home sits at the Conch');
  }
  const s3=H.W.snoozles[2];
  ok(s3.path&&s3.path.length>=2,'Snoozle 3 has an intermediate departure path');
  ok(s3.path[0].y>16&&s3.path[0].z<-190,'first waypoint rises clear of the crow\'s nest / stern');
  const nest={x:s3.g.position.x,y:s3.g.position.y,z:s3.g.position.z};
  let pts=samplePath(nest,s3.path[0],12);
  for(let i=0;i<s3.path.length-1;i++)pts=pts.concat(samplePath(s3.path[i],s3.path[i+1],10));
  pts=pts.concat(samplePath(s3.path[s3.path.length-1],{x:s3.home.x,y:0,z:s3.home.z},12));
  ok(!crossesWreckHull(pts),'Snoozle 3 path clears representative solid Wreck hull volumes');
}

// ---- architecture: no Conch conditionals in generic win / snoozle move ----
{
  const entities=fs.readFileSync(path.join(__dirname,'..','src','entities.js'),'utf8');
  const enemies=fs.readFileSync(path.join(__dirname,'..','src','enemies.js'),'utf8');
  const genericWin=entities.slice(entities.indexOf('function triggerWin'),entities.indexOf('function loadLevel'));
  ok(!/\bCONCH\b|\bconch\b|\bWM\b|\bRAINBOW\b/.test(genericWin),
    'generic triggerWin/updateWin stay free of Conch and windmill branches');
  const snoozleMove=enemies.slice(enemies.indexOf('function updateSnoozles'),enemies.indexOf('function updateBoat'));
  ok(/s\.home\.x/.test(snoozleMove)&&!/WM|FINISH|CONCH|conch/.test(snoozleMove),
    'shared Snoozle movement remains landmark-free and data-driven');
  ok(/state==='path'/.test(snoozleMove)||/s\.state==='path'/.test(snoozleMove)||/s\.path/.test(snoozleMove),
    'optional Snoozle waypoints are handled generically in shared movement');
}

// ---- approach from trench remains clear ----
{
  const H=boot();startL2(H);
  ok(canStand(H,0,-280,55),'Trench exit still reaches the Conch approach');
  ok(canStand(H,0,-279.5,55),'player can stand in front of the Conch doorway');
}

report();
