// Stage 2: underwater movement in Level 2.
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

function jumpApex(H,spawn){
  H.P.pos.set(spawn.x,spawn.y,spawn.z);H.P.vel.set(0,0,0);H.frames(10);
  let maxY=0;H.kd({code:'Space',preventDefault(){},repeat:false});
  for(let i=0;i<80;i++){H.frames(1);maxY=Math.max(maxY,H.P.pos.y);}
  H.ku({code:'Space'});
  return maxY;
}

function fallDuration(H,spawn){
  H.P.pos.set(spawn.x,spawn.y,spawn.z);H.P.vel.set(0,0,0);H.frames(10);
  H.kd({code:'Space',preventDefault(){},repeat:false});
  let maxY=0,apexF=0,landF=0;
  for(let i=0;i<200;i++){
    H.frames(1);
    if(H.P.pos.y>maxY){maxY=H.P.pos.y;apexF=i;}
    if(i>apexF+5&&H.P.grounded){landF=i;break;}
  }
  H.ku({code:'Space'});
  return landF-apexF;
}

function twoStrokeAir(hold){
  const H=boot({autostart:true,level:1});
  H.P.pos.set(0,0,0);H.P.vel.set(0,0,0);H.frames(6);
  H.kd({code:'Space',preventDefault(){},repeat:false});H.frames(4);H.ku({code:'Space'});H.frames(10);
  H.kd({code:'Space',preventDefault(){},repeat:false});
  if(!hold){H.frames(3);H.ku({code:'Space'});}
  let t=0,hov=false;
  for(let i=0;i<400;i++){
    H.frames(1);t+=1/60;
    if(H.P.hover)hov=true;
    if(H.P.grounded&&i>15)break;
  }
  H.ku({code:'Space'});
  return{t,hov};
}

// ---- holding jump after second stroke slows descent ----
{
  const rel=twoStrokeAir(false),hold=twoStrokeAir(true);
  ok(rel.hov&&hold.hov,'hover engaged after second stroke');
  ok(hold.t>rel.t+0.3,'holding jump slows descent ('+hold.t.toFixed(2)+'s vs '+rel.t.toFixed(2)+'s in air)');
}

// ---- Level 1 jump apex unchanged ----
{
  const H=boot({autostart:true,level:0});
  const a=jumpApex(H,{x:0,y:0,z:10});
  ok(a>1.5&&a<2.2,'Level 1 jump apex remains '+a.toFixed(2));
}

// ---- Level 2 jump apex higher than Level 1 ----
{
  const H1=boot({autostart:true,level:0});
  const H2=boot({autostart:true,level:1});
  const a1=jumpApex(H1,{x:0,y:0,z:10});
  const a2=jumpApex(H2,{x:0,y:0,z:0});
  ok(a2>a1,'Level 2 jump apex higher than Level 1 ('+a2.toFixed(2)+' vs '+a1.toFixed(2)+')');
}

// ---- Level 2 descent slower than Level 1 ----
{
  const H1=boot({autostart:true,level:0});
  const H2=boot({autostart:true,level:1});
  const d1=fallDuration(H1,{x:0,y:0,z:10});
  const d2=fallDuration(H2,{x:0,y:0,z:0});
  ok(d2>d1+8,'Level 2 descent slower than Level 1 ('+d2+' vs '+d1+' frames apex-to-land)');
}

// ---- two swim strokes then sink ----
{
  const H=boot({autostart:true,level:1});
  H.P.pos.set(0,0,0);H.P.vel.set(0,0,0);H.frames(6);
  ok(H.P.puff,'stroke refill on seabed');
  H.kd({code:'Space',preventDefault(){},repeat:false});H.frames(4);H.ku({code:'Space'});
  ok(H.P.puff,'one stroke spent, second available');
  H.frames(8);
  H.kd({code:'Space',preventDefault(){},repeat:false});H.frames(4);H.ku({code:'Space'});
  ok(!H.P.puff,'two strokes spent, no third stroke available');
  for(let i=0;i<120;i++){H.frames(1);if(H.P.vel.y<-0.5)break;}
  ok(H.P.vel.y<0,'sinking after both strokes');
}


// ---- third fresh jump press does nothing ----
{
  const H=boot({autostart:true,level:1});
  H.P.pos.set(0,0,0);H.P.vel.set(0,0,0);H.frames(6);
  H.kd({code:'Space',preventDefault(){},repeat:false});H.frames(4);H.ku({code:'Space'});H.frames(10);
  H.kd({code:'Space',preventDefault(){},repeat:false});H.frames(4);H.ku({code:'Space'});
  ok(!H.P.puff,'both strokes spent before third press');
  for(let i=0;i<80;i++){H.frames(1);if(H.P.vel.y<0)break;}
  const y0=H.P.pos.y,vy0=H.P.vel.y,jet0=H.P.jetT;
  H.kd({code:'Space',preventDefault(){},repeat:false});H.frames(3);H.ku({code:'Space'});
  ok(!H.P.puff,'third press did not restore a stroke');
  ok(Math.abs(H.P.vel.y-vy0)<0.4,'third press did not change vertical speed much ('+H.P.vel.y.toFixed(2)+' vs '+vy0.toFixed(2)+')');
  ok(H.P.pos.y<y0+0.15,'third press did not dive or rise');
  ok(H.P.jetT<=jet0+0.01,'third press did not fire a fresh jet');
}

// ---- B while swimming in Level 2 gusts, does not slam ----
{
  const H=boot({autostart:true,level:1});
  H.P.pos.set(0,4,0);H.P.vel.set(0,0,0);H.P.grounded=false;H.frames(2);
  H.tap('KeyJ',2);
  ok(H.P.slam===0,'Level 2 swimming B does not slam');
  ok(H.P.mouthT>0||H.P.gustCD>0,'Level 2 swimming B performs gust');
}

// ---- Level 1 air B still slams, ground B still gusts ----
{
  const H=boot({autostart:true,level:0});
  H.P.pos.set(0,4,10);H.P.vel.set(0,0,0);H.frames(2);
  H.tap('KeyJ',2);
  ok(H.P.slam>0,'Level 1 air B still slams');
  H.P.slam=0;H.P.pos.set(0,0,10);H.P.vel.set(0,0,0);H.frames(4);
  H.tap('KeyJ',2);
  ok(H.P.slam===0&&H.P.mouthT>0,'Level 1 ground B still gusts');
}

report();
