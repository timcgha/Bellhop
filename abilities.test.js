// Enemy variety, smashable crates, the fire power-up and the spin attack.
const H=require('./harness.js')();const {P,W,els,el,frames,tap,ok,report}=H;
// 1. variety
const sizes=[...new Set(W.gloops.map(g=>g.size))].sort(), cols=[...new Set(W.gloops.map(g=>g.col))];
ok(sizes.length===3&&cols.length===3,W.gloops.length+' gloops, 3 sizes '+JSON.stringify(sizes)+', 3 colours');
ok(W.gloops.filter(g=>g.hp===1).length&&W.gloops.filter(g=>g.hp===3).length,'hp varies by size');

// 2. crates are solid then smashable
ok(W.crates.length>=6,W.crates.length+' crates, solid count '+W.solids.length);
const c0=W.crates[0];
P.pos.set(c0.x,3,c0.z);P.vel.set(0,0,0);frames(60);
ok(Math.abs(P.pos.y-(c0.y+0.9))<0.03,'stood on the crate y='+P.pos.y.toFixed(2));
const nSol=W.solids.length;
P.pos.set(c0.x+1.2,0,c0.z);P.vel.set(0,0,0);frames(2);tap('KeyK');frames(3);
ok(c0.broken,'spin smashed the crate');
ok(W.solids.length===nSol-1,'crate solid removed ('+nSol+'->'+W.solids.length+')');
ok(W.powers.length===1&&!W.powers[0].got,'fire power-up popped out');

// 3. collect powerup -> fire slam
const w=W.powers[0];P.pos.set(w.x,w.y-0.6,w.z);P.vel.set(0,0,0);frames(4);
ok(P.fire===true&&el('fire').textContent==='🔥','picked up fire, HUD='+el('fire').textContent);
// slam from the air
P.pos.set(0,4,-8);P.vel.set(0,0,0);frames(1);tap('KeyJ',2);
let sawFire=false;for(let i=0;i<80;i++){frames(1);if(W.fires.some(f=>f.alive))sawFire=true;}
ok(sawFire,'ground pound launched fireballs');
ok(P.fire===true,'fire kept after the pound');
// fireballs go outward in all directions
P.pos.set(0,4,-8);P.vel.set(0,0,0);frames(1);tap('KeyJ',2);frames(20);
const live=W.fires.filter(f=>f.alive);
const angs=live.map(f=>Math.round(Math.atan2(f.pos.x-0,f.pos.z-(-8))*10)/10);
ok(live.length>=6&&new Set(angs).size>=6,'radial spread: '+live.length+' fireballs, '+new Set(angs).size+' directions');
frames(120);

// 4. fireball kills a gloop
const e=W.gloops.find(g=>g.type==='mid'&&g.alive);
P.pos.set(e.x-2.5,4,e.z);P.vel.set(0,0,0);P.fire=true;frames(1);tap('KeyJ',2);
let killed=false;for(let i=0;i<120;i++){frames(1);if(e.state==='dying'||!e.alive)killed=true;}
ok(killed,'fireball dissolved a mid gloop');

// 5. spin hits all round + slam breaks crates
const c1=W.crates[1];P.pos.set(c1.x,4,c1.z+0.3);P.vel.set(0,0,0);P.fire=false;frames(1);tap('KeyJ',2);frames(40);
ok(c1.broken,'slam smashed a crate');
// spin hits behind the player
const e2=W.gloops.find(g=>g.alive&&g.type==='small');
P.pos.set(e2.x,e2.y,e2.z+1.0);P.vel.set(0,0,0);P.yaw=0;frames(1); // facing AWAY (+z)
tap('KeyK');frames(3);
ok(e2.state==='dying'||e2.hp<e2.maxHp,'spin hit a gloop behind the player (hp '+e2.hp+'/'+e2.maxHp+')');
ok(P.bonkT>0,'spin animation running, bonkT='+P.bonkT.toFixed(2));
frames(60);
// big gloop takes 3 spins
const e3=W.gloops.find(g=>g.alive&&g.type==='big'&&g.state!=='dying');
let n=0;for(let i=0;i<6&&e3.state!=='dying';i++){P.pos.set(e3.x,e3.y,e3.z+1.0);P.vel.set(0,0,0);frames(1);tap('KeyK');n++;frames(35);}
ok(n===3,'big gloop needed '+n+' spins');
// hearts still work
P.hp=2;const h=W.hearts.find(x=>!x.got);P.pos.set(h.x,h.y-0.6,h.z);P.vel.set(0,0,0);frames(4);
ok(P.hp===3,'heart still heals, hp='+P.hp);
frames(400);
console.log('HUD:',el('hp').textContent,el('snz').textContent,el('nts').textContent,el('fire').textContent);
report();
