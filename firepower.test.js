// The fire power-up lasts until a Gloop hits you.
const H=require('./harness.js')();const {P,W,el,frames,tap,ok,kd,ku,report}=H;
// ---------- 1. fire is permanent until a blob hits you ----------
const c=W.crates.find(x=>x.item==='fire');
P.pos.set(c.x+1.2,0,c.z);P.vel.set(0,0,0);frames(2);tap('KeyK');frames(4);
const w=W.powers[0];P.pos.set(w.x,w.y-0.6,w.z);P.vel.set(0,0,0);frames(4);
ok(P.fire===true&&el('fire').textContent==='🔥','picked up fire, HUD='+el('fire').textContent);
// many ground pounds, fire must survive all of them
for(let i=0;i<5;i++){P.pos.set(0,4,-10);P.vel.set(0,0,0);frames(1);tap('KeyJ',2);frames(50);}
ok(P.fire===true,'fire survived 5 ground pounds');
let burst=false;P.pos.set(0,4,-10);P.vel.set(0,0,0);frames(1);tap('KeyJ',2);
for(let i=0;i<60;i++){frames(1);if(W.fires.some(f=>f.alive))burst=true;}
ok(burst,'6th pound still throws fireballs');
frames(120);
// getting hit takes it away
const g=W.gloops.find(x=>x.alive);g.x=0;g.z=-14;g.y=0;g.stunT=0;g.spitT=0;
P.pos.set(0,0,-8);P.vel.set(0,0,0);P.hp=4;P.inv=0;
let hurt=false;for(let i=0;i<900;i++){frames(1);if(P.hp<4){hurt=true;break;}}
ok(hurt,'took a goo hit, hp='+P.hp);
ok(P.fire===false&&el('fire').style.display==='none','fire lost on the hit, HUD pill hidden');
// pounding without fire throws nothing
P.pos.set(0,4,-10);P.vel.set(0,0,0);P.inv=999;frames(1);tap('KeyJ',2);frames(40);
ok(!W.fires.some(f=>f.alive),'no fireballs once the fire is out');
P.inv=0;

report();
