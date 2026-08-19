// Level layout: the path is walkable end to end, checkpoints arm and are used on death.
const H=require('./harness.js')();const {P,W,els,frames,tap,ok,report}=H;
// ---- layout sanity ----
ok(W.checks.length===6,'6 checkpoints');
ok(W.snoozles.length===4,'4 snoozles');
ok(W.gloops.length===7,'7 gloops');
ok(W.crates.length===8,'8 crates');
console.log('notes:',W.notes.length,'solids:',W.solids.length);
// spawn on solid ground
ok(Math.abs(P.pos.y)<0.01&&Math.abs(P.pos.z-10)<0.01,'spawn at path start ('+P.pos.x+','+P.pos.y+','+P.pos.z+')');
frames(60);ok(Math.abs(P.pos.y)<0.01,'still grounded after settling y='+P.pos.y.toFixed(3));
// ---- first checkpoint auto-arms at spawn ----
ok(W.checks[0].on,'start checkpoint armed');
// ---- walk the whole path: teleport-sample each leg and confirm ground is walkable & clear ----
const legs=[[0,10],[0,0],[0,-10],[0,-18],[0,-21],[2,-23],[9,-26],[9,-32],[9,-37],[8,-42],[8,-47],[8,-52],[6,-58],[2,-60],[-6,-60],[-14,-60],[-21,-60],[-26,-58],[-28,-57],[-32,-60]];
let stuck=[];
for(const L of legs){P.pos.set(L[0],2,L[1]);P.vel.set(0,0,0);frames(45);
  if(Math.abs(P.pos.y)>0.05||Math.hypot(P.pos.x-L[0],P.pos.z-L[1])>1.2)stuck.push(L+' -> '+P.pos.x.toFixed(1)+','+P.pos.y.toFixed(2)+','+P.pos.z.toFixed(1));}
ok(stuck.length===0,'all 20 path points walkable'+(stuck.length?': '+stuck.join(' | '):''));
// ---- checkpoints arm as you pass, newest wins ----
for(const c of W.checks){c.on=false;}
for(const c of W.checks){P.pos.set(c.x,c.y,c.z);P.vel.set(0,0,0);frames(4);
  ok(c.on&&Math.abs(P.spawn.x-c.x)<0.01&&Math.abs(P.spawn.z-(c.z+1.5))<0.01,'checkpoint at '+c.x+','+c.z+' armed and became spawn');}
// ---- death respawns at the newest checkpoint ----
const sp={x:P.spawn.x,y:P.spawn.y,z:P.spawn.z};
const gl=W.gloops.find(g=>g.alive);gl.x=8;gl.z=-44;gl.y=0;gl.stunT=0;gl.spitT=0;
P.pos.set(8,0,-49);P.vel.set(0,0,0);P.hp=1;P.inv=0;frames(2);
let died=false,back=false;
for(let i=0;i<900;i++){frames(1);if(P.dead)died=true;if(died&&!P.dead){back=true;break;}}
ok(died,'player died');
ok(back&&Math.hypot(P.pos.x-sp.x,P.pos.z-sp.z)<0.2,'respawned at checkpoint ('+P.pos.x.toFixed(1)+','+P.pos.z.toFixed(1)+') not the level start');
report();
