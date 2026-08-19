// Snoozles fly home when woken, and the last one triggers the win sequence.
const H=require('./harness.js')();const {P,W,els,el,frames,tap,ok,report}=H;
// ---- wake snoozles one at a time and watch them fly to the windmill ----
const wm=W.WM;console.log('windmill at',wm.x,wm.z,'rainbow at',W.RAINBOW.position.x,W.RAINBOW.position.z);
ok(W.RAINBOW.visible===false,'rainbow hidden at start');
ok(el('win').style.display!=='flex','win banner hidden at start');
function wake(i){const s=W.snoozles[i];P.pos.set(s.g.position.x,s.g.position.y,s.g.position.z+1.0);P.vel.set(0,0,0);frames(2);tap('KeyK');frames(3);return s;}
const s0=wake(0);
ok(s0.state!=='sleep','snoozle 0 woke (state '+s0.state+')');
frames(70);ok(s0.state==='zoom','snoozle is flying home');
const midY=s0.g.position.y;frames(130);
ok(midY>2,'flight arcs through the air, peak y seen '+midY.toFixed(1));
ok(s0.state==='home'&&Math.hypot(s0.g.position.x-wm.x,s0.g.position.z-wm.z)<6,'landed at the windmill ('+s0.g.position.x.toFixed(1)+','+s0.g.position.z.toFixed(1)+')');
ok(el('snz').textContent==='😴 1/4','HUD '+el('snz').textContent);
ok(!W.won,'not won yet');
// ---- wake the rest ----
for(let i=1;i<4;i++){wake(i);frames(150);}
ok(el('snz').textContent==='😴 4/4','HUD '+el('snz').textContent);
ok(W.won,'win triggered on the last snoozle');
ok(W.RAINBOW.visible===true,'rainbow appeared');
ok(el('win').style.display==='flex','CONGRATULATIONS banner shown');
ok(wm.party===true,'windmill party spin on');
frames(60);
ok(W.RAINBOW.scale.x>0.5,'rainbow grew in, scale '+W.RAINBOW.scale.x.toFixed(2));
ok(W.snoozles.every(s=>s.state==='home'),'all four snoozles home and dancing');
// banner fades out, party keeps going
frames(60*13);
ok(el('win').style.display==='none','banner faded after ~12s');
ok(W.won&&wm.party,'party still running after the banner');
// player can still move around
const z0=P.pos.z;H.kd({code:'KeyW',preventDefault(){},repeat:false});frames(50);H.ku({code:'KeyW'});
ok(Math.abs(P.pos.z-z0)>1||Math.abs(P.pos.x)>0,'still playable after winning');
frames(300);
report();
