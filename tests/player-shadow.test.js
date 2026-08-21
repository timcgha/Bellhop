// Stage 4.7A — projected shadow readability (scale vs opacity, surfaces, two-tone).
const H=require('./harness.js')({autostart:false});
const {P,W,frames,tap,ok,kd,ku,report}=H;

function release(){
  for(const c of ['KeyW','KeyA','KeyS','KeyD','Space','ShiftLeft','KeyJ','KeyK']){
    try{ku({code:c,preventDefault(){},repeat:false});}catch(e){}
  }
}
function settle(x,y,z){
  release();
  P.inv=99;P.dead=false;P.lavaRecT=0;P.glideT=0;P.glideArmed=false;P.wingsOut=false;
  P.pos.set(x,y,z);P.vel.set(0,0,0);P.slam=0;P.puffAir=0;P.grounded=true;H.CAM.yaw=0;
  frames(4);
}
function S(){return H.getShadow();}
function oldOpacity(h){const ss=Math.max(0.35,Math.min(1,1-h*0.05));return 0.28*ss;}
function oldScale(h){return Math.max(0.35,Math.min(1,1-h*0.05));}
function boot(idx){
  if(!H.isStarted())H.startLevel(idx);
  else H.test.loadLevel(idx);
}

// ---- Level 1: structure + grounded / jump opacity ----
boot(0);
ok(!!S()&&S().core&&S().rim,'two-tone shadow core+rim exist');
ok(S().SHADOW_OPACITY>=S().SHADOW_MIN_PLAY_OPACITY,'named opacity target >= named play floor');
ok(S().SHADOW_EXTREME_HEIGHT_FADE_START>8,'extreme fade starts above normal jump heights');

settle(0,0,10);frames(2);
const g=S().state;
ok(Math.abs(g.scale-1)<0.02,'L1 grounded scale near full ('+g.scale.toFixed(3)+')');
ok(g.opacity>=S().SHADOW_MIN_PLAY_OPACITY,'L1 grounded opacity meets floor ('+g.opacity.toFixed(3)+')');
ok(Math.abs(g.opacity-S().SHADOW_OPACITY)<0.001,'L1 grounded opacity is target');
ok(Math.abs(g.y-0)<0.05,'L1 flat floor shadow y≈0 (got '+g.y.toFixed(3)+')');
ok(g.kind==='ground'||g.kind==='solid','L1 meadow receiving kind');

// Jump apex: scale shrinks, opacity stays flat (NOT base*scale)
settle(0,0,10);
let maxY=0,atApex=null;
kd({code:'Space',preventDefault(){},repeat:false});
for(let i=0;i<50;i++){
  frames(1);
  if(P.pos.y>maxY){maxY=P.pos.y;atApex={h:S().state.h,scale:S().state.scale,op:S().state.opacity};}
}
ku({code:'Space'});frames(40);
ok(maxY>1.5&&maxY<2.2,'normal jump apex height '+maxY.toFixed(2));
ok(atApex.scale<0.95&&atApex.scale>0.7,'jump apex scale smaller ('+atApex.scale.toFixed(3)+') h='+atApex.h.toFixed(2));
ok(atApex.op>=S().SHADOW_MIN_PLAY_OPACITY,'jump apex opacity >= play floor ('+atApex.op.toFixed(3)+')');
ok(Math.abs(atApex.op-S().SHADOW_OPACITY)<0.001,'jump apex opacity still flat target');
ok(Math.abs(atApex.op-oldOpacity(atApex.h))>0.05,'opacity is NOT old base*scale ('+oldOpacity(atApex.h).toFixed(3)+')');

// Elevated platform (tower step) beats lower ground
settle(12,1.1,-62.3);frames(8);
ok(S().state.y>0.9&&S().state.y<1.3,'tower step shadow on step y='+S().state.y.toFixed(2));
ok(S().state.kind==='solid','tower step kind solid');

// Higher tower pad (above the first step) — shadow rises with the route
settle(14.3,2.2,-61.6);frames(8);
const stairY=S().state.y;
ok(stairY>=2.1&&stairY<=2.3,'higher terrace surface y='+stairY.toFixed(2));
ok(stairY>1.15,'higher terrace above first step');

// Wall top mid-height is not selected while standing on ground beside a tall fence solid
settle(0,0,10);
const wallTop=H.shadowReceiveAt(0,10,0.05,0.3);
ok(wallTop.y<0.5,'beside start, receive is low floor not a wall top y='+wallTop.y.toFixed(2));

// Ceiling-like: solid above player must not be chosen
const ceilProbe=H.shadowReceiveAt(0,10,0.2,0.3);
ok(ceilProbe.y<=0.5,'ceiling not selected from ground query');

// Extreme height softens below play floor
settle(0,0,10);
P.pos.y=30;P.grounded=false;frames(2);
ok(S().state.h>S().SHADOW_EXTREME_HEIGHT_FADE_START,'extreme height engaged h='+S().state.h.toFixed(1));
ok(S().state.opacity<S().SHADOW_MIN_PLAY_OPACITY,'extreme height may soften below play floor ('+S().state.opacity.toFixed(3)+')');
ok(S().state.scale<=S().SHADOW_SCALE_MIN+0.001,'extreme height at min scale');

// Two-tone moves together
settle(0,0,10);frames(2);
ok(S().core.parent===S().group&&S().rim.parent===S().group,'core and rim share group');
ok(Math.abs(S().group.position.y-(S().state.y+0.02))<0.001,'group on receiving surface');

console.log('L1 measures grounded scale/op',g.scale.toFixed(3),g.opacity.toFixed(3),
  'old would be',oldScale(0).toFixed(3),oldOpacity(0).toFixed(3));
console.log('L1 measures jump apex h/scale/op',atApex.h.toFixed(2),atApex.scale.toFixed(3),atApex.op.toFixed(3),
  'old',oldScale(atApex.h).toFixed(3),oldOpacity(atApex.h).toFixed(3));

// ---- Level 2: underwater floor ----
boot(1);
settle(0,0,8);frames(4);
ok(S().state.opacity>=S().SHADOW_MIN_PLAY_OPACITY,'L2 grounded opacity floor');
ok(Math.abs(S().state.y-0)<0.08,'L2 shadow on seafloor y='+S().state.y.toFixed(3));
ok(S().SHADOW_OPACITY===0.44,'global shadow constants on L2');

// ---- Level 3: Sky Blast / glide / lava / elevated over lava ----
boot(2);
const sky=H.getSky();
ok(sky.puffVMul===1.4&&sky.boostMax===12.5&&sky.glideDur===0.55,'Sky Blast/glide tuning untouched');

// Warm Slopes safe ground
settle(-6,0.4,16);frames(3);
ok(S().state.opacity>=S().SHADOW_MIN_PLAY_OPACITY,'Peak ground opacity floor');
ok(S().state.y>=0.35&&S().state.y<=0.5,'Warm Slopes solid top ~0.4 y='+S().state.y.toFixed(2));

// Elevated pad above lower floor (teach gap pad)
settle(0,5.9,-50);frames(4);
ok(S().state.y>=5.8&&S().state.y<=6.0,'elevated pad shadow y='+S().state.y.toFixed(2));
ok(S().state.kind==='solid','elevated pad is solid not lower basin');

// Stair climb higher terrace (solid top at 11.0+0.4)
settle(0,11.4,-104);frames(4);
ok(S().state.y>=11.3&&S().state.y<=11.5,'stair terrace shadow y='+S().state.y.toFixed(2));

// Direct receive query: Warm Slopes lava wins when it is the highest top under the probe
const warmLava=H.shadowReceiveAt(10,10,0.3,0.05);
ok(warmLava.kind==='lava'&&warmLava.y>=0.2&&warmLava.y<=0.3,'Warm Slopes lava receive y='+warmLava.y.toFixed(3));

// Airborne over exposed basin lava (no elevated pad covering this xz)
settle(13,3.0,-82);P.grounded=false;P.vel.set(0,0,0);frames(2);
ok(S().state.kind==='lava','over basin lava → kind lava');
ok(S().state.y>=0.35&&S().state.y<=0.45,'basin lava top y='+S().state.y.toFixed(3));
ok(S().state.warm===true,'lava uses warm rim treatment');
ok(S().state.opacity>=S().SHADOW_MIN_PLAY_OPACITY,'opacity strong over lava');

// Elevated platform beats lava beneath (first leap takeoff over basin)
settle(0,8.4,-76);frames(3);
ok(S().state.kind==='solid','pad above lava leap → solid');
ok(S().state.y>=8.3&&S().state.y<=8.5,'pad y not lava basin y='+S().state.y.toFixed(2));
ok(S().state.warm===false,'pad rim not warm');

// After clearing pad horizontally over leap lava corridor
settle(0,10.0,-81.75);P.grounded=false;frames(2);
ok(S().state.kind==='lava','airborne over leap lava → lava');
ok(S().state.y>=6.4&&S().state.y<=6.6,'leap lava top ~6.55 y='+S().state.y.toFixed(2));

// Query API: tall fence top above mid-height query is skipped
const wall=H.shadowReceiveAt(18,-124,6.0,0.3);
ok(wall.y<=6.05,'fence mid-query does not pick a ceiling-like top wrongly');

// Sky Blast apex + glide opacity floors (hold Space through puff so jump-cut does not halve it)
settle(0,0.4,24);P.hasSkyBlast=true;P.puff=true;P.yaw=Math.PI;P.inv=99;P.vel.set(0,0,-5);
kd({code:'Space',preventDefault(){},repeat:false});frames(4);ku({code:'Space'});frames(10);
kd({code:'Space',preventDefault(){},repeat:false}); // hold through powered puff + glide
let blastMaxH=0,blastAt=null,glideAt=null;
for(let i=0;i<200;i++){
  frames(1);
  const st=S().state;
  if(st.h>blastMaxH){blastMaxH=st.h;blastAt={h:st.h,scale:st.scale,op:st.opacity};}
  if(!glideAt&&P.glideT>0)glideAt={h:st.h,scale:st.scale,op:st.opacity,glideT:P.glideT};
  if(P.grounded&&i>20)break;
}
release();
ok(blastAt&&blastAt.h>3,'Sky Blast apex relative h='+(blastAt?blastAt.h.toFixed(2):'n/a'));
ok(blastAt.scale<0.9,'Sky Blast scale shrinks ('+blastAt.scale.toFixed(3)+')');
ok(blastAt.op>=S().SHADOW_MIN_PLAY_OPACITY,'Sky Blast apex opacity floor ('+blastAt.op.toFixed(3)+')');
ok(Math.abs(blastAt.op-oldOpacity(blastAt.h))>0.08,'Sky Blast opacity not old base*scale');
if(glideAt){
  ok(glideAt.op>=S().SHADOW_MIN_PLAY_OPACITY,'glide opacity floor ('+glideAt.op.toFixed(3)+') h='+glideAt.h.toFixed(2));
}else{
  ok(false,'expected glide phase during Sky Blast');
}

console.log('Sky Blast apex h/scale/op',blastAt.h.toFixed(2),blastAt.scale.toFixed(3),blastAt.op.toFixed(3),
  'old',oldScale(blastAt.h).toFixed(3),oldOpacity(blastAt.h).toFixed(3));
if(glideAt)console.log('Glide h/scale/op',glideAt.h.toFixed(2),glideAt.scale.toFixed(3),glideAt.op.toFixed(3),
  'old',oldScale(glideAt.h).toFixed(3),oldOpacity(glideAt.h).toFixed(3));

// Camera / physics regression markers
ok(H.CAM.dist===8.5,'camera distance unchanged');
ok(sky.puffVMul===1.4&&sky.boostMax===12.5&&sky.boostDecay===1.6&&sky.glideDur===0.55&&sky.glideFallCap===-2.2&&sky.glideStartVy===0.2,'no Sky Blast retune');

report();
