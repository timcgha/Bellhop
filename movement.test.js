// Core movement: jump arc, hover, step-up, fan lift, water, platform landings.
const H=require('./harness.js')();const {P,W,frames,tap,ok,kd,ku,report}=H;
// core movement regression (ports smoke3/smoke4 onto the new harness + level)
P.pos.set(0,0,10);P.vel.set(0,0,0);frames(10);
let maxY=0;kd({code:'Space',preventDefault(){},repeat:false});
for(let i=0;i<40;i++){frames(1);maxY=Math.max(maxY,P.pos.y);}ku({code:'Space'});
ok(maxY>1.5&&maxY<2.2,'jump apex '+maxY.toFixed(2));
frames(40);ok(Math.abs(P.pos.y)<0.02,'landed y='+P.pos.y.toFixed(3));
function airTime(hold){P.pos.set(0,0,10);P.vel.set(0,0,0);frames(6);
  kd({code:'Space',preventDefault(){},repeat:false});frames(4);ku({code:'Space'});frames(10);
  kd({code:'Space',preventDefault(){},repeat:false});let t=0,my=0,hov=false;
  if(!hold){frames(3);ku({code:'Space'});}
  for(let i=0;i<300;i++){frames(1);t+=1/60;my=Math.max(my,P.pos.y);if(P.hover)hov=true;if(P.grounded&&i>10)break;}
  ku({code:'Space'});return{t,my,hov};}
const a=airTime(false),b=airTime(true);
ok(a.hov&&b.hov,'hover engaged both ways');
ok(b.t>a.t+0.3,'holding floats longer ('+a.t.toFixed(2)+'s vs '+b.t.toFixed(2)+'s)');
// step-up onto the 0.4 crate in the start meadow (sample during the walk, he walks off the far side)
P.pos.set(3,0,8.9);P.vel.set(0,0,0);frames(3);P.pos.set(3,0,8.9);P.vel.set(0,0,0);
let onCrate=false;kd({code:'KeyW',preventDefault(){},repeat:false});
for(let i=0;i<45;i++){frames(1);if(Math.abs(P.pos.y-0.4)<0.03&&P.grounded)onCrate=true;}
ku({code:'KeyW'});
ok(onCrate,'auto-stepped onto the 0.4 crate during the walk (ended y='+P.pos.y.toFixed(2)+' z='+P.pos.z.toFixed(1)+')');
// fan lift in the tower yard
P.pos.set(19,0,-52);P.vel.set(0,0,0);let my=0;for(let i=0;i<130;i++){frames(1);my=Math.max(my,P.pos.y);}
ok(my>9,'fan lifted to '+my.toFixed(2));
// pond wading
P.pos.set(0,0,-29);P.vel.set(0,0,0);frames(25);
ok(Math.abs(P.pos.y+0.4)<0.03&&P.surf==='water','wading in the pond y='+P.pos.y.toFixed(2));
// tower step landing
P.pos.set(12,3,-62.3);P.vel.set(0,0,0);frames(60);
ok(Math.abs(P.pos.y-1.1)<0.03,'landed on the first tower step y='+P.pos.y.toFixed(2));
report();
