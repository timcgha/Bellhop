// BH-004: actual game frames under identical synthetic input/time schedules.
// THREE/DOM are the deterministic harness fixture, not browser or device evidence.
const fs=require('fs'),path=require('path'),os=require('os'),crypto=require('crypto');
const {execFileSync}=require('child_process');
const boot=require('../tests/harness');
const ROOT=path.join(__dirname,'..'),BASE='33f3d4a750cb78bfbd48d464ad38292d2a933133';
const BASE_TREE='61c46dd64d2922760c309adf85de67dc41fce884';
const OUT=path.join(ROOT,'artifacts','browser-movement-jump');
const git=(...args)=>execFileSync('git',args,{cwd:ROOT,encoding:'utf8'}).trim();
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
let failures=0,checks=0;
function ok(c,m){checks++;if(!c)failures++;console.log((c?'PASS ':'FAIL ')+m);}
const xyz=v=>[v.x,v.y,v.z];
function scalarState(o){const r={};for(const k of Object.keys(o).sort())if(o[k]===null||['number','boolean','string'].includes(typeof o[k]))r[k]=o[k];return r;}
function state(h){const p=h.P,u=h.getPlayer().userData;return {
  player:scalarState(p),vectors:['pos','vel','leapBoost','safeAnchor','lavaRecFrom','quicksandRecFrom'].map(k=>xyz(p[k])),
  camera:scalarState(h.CAM),cameraVectors:[xyz(h.CAM.pos),xyz(h.CAM.look)],
  root:[xyz(h.getPlayer().position),xyz(h.getPlayer().rotation),xyz(h.getPlayer().scale)],
  feet:[xyz(u.legL.rotation),xyz(u.legR.rotation)],head:[xyz(u.head.rotation),xyz(u.head.position)],
  bellows:xyz(u.bel.scale),signals:[u.mouth.scale.y,u.eyes.map(e=>e.scale.y),u.jet.visible,u.flame.visible,u.wings.visible,u.wings.userData.open],
  nonBlendedArmAxes:[u.armL.rotation.y,u.armL.rotation.z,u.armR.rotation.y,u.armR.rotation.z,u.armL.scale.y,u.armR.scale.y],
  level:h.getLevel().id,started:h.isStarted(),won:h.W.won};}
function arms(h){const u=h.getPlayer().userData;return [u.armL.rotation.x,u.armR.rotation.x];}
const schedules=[{name:'30 Hz',ms:[1000/30]},{name:'60 Hz',ms:[1000/60]},{name:'120 Hz',ms:[1000/120]},{name:'uneven 8/16/33/12/50/20 ms',ms:[8,16,33,12,50,20]}];
const scenarios=[
  {name:'idle run stop turn',duration:1.8,events:[[0,'KeyD',1],[.42,'KeyD',0],[.8,'KeyA',1],[1.22,'KeyA',0]]},
  {name:'early-release short hop',duration:1.6,events:[[0,'Space',1],[.07,'Space',0]],landing:true},
  {name:'held standing jump',duration:1.6,events:[[0,'Space',1],[.72,'Space',0]],landing:true},
  {name:'puff and held float',duration:3.8,events:[[0,'Space',1],[.1,'Space',0],[.25,'Space',1],[1.25,'Space',0]],landing:true},
  {name:'running jump landing into run',duration:1.8,events:[[0,'KeyD',1],[.2,'Space',1],[1,'Space',0],[1.2,'KeyD',0]],landing:true},
  {name:'native 0.4m step collision',duration:1.3,events:[[0,'KeyW',1],[.75,'KeyW',0]],fixture:[3,0,8.9]},
  {name:'native 1m wall collision',duration:1.3,events:[[0,'KeyW',1],[.9,'KeyW',0]],fixture:[4.6,0,9]},
  {name:'native tower platform landing',duration:1.6,events:[],fixture:[12,3,-62.3],landing:true}
];
function create(html,level=0){const h=boot({html,randomSeed:0xB004,level});h.frames(12);return h;}
function run(html,spec,schedule){
  const h=create(html);h.CAM.yaw=0;h.CAM.lastManual=1000;
  // Isolated native-world collision fixtures only. These are not player routes.
  if(spec.fixture){h.P.pos.set(...spec.fixture);h.P.vel.set(0,0,0);h.P.grounded=false;h.P.lastGround=-9;}
  const rows=[];let t=0,event=0,i=0;const initial={s:state(h),a:arms(h),dt:0};
  while(t<spec.duration){
    while(event<spec.events.length&&spec.events[event][0]<=t+1e-10){const [,code,down]=spec.events[event++];down?h.kd(code):h.ku(code);}
    const ms=schedule.ms[i++%schedule.ms.length];h.step(ms);t+=ms/1000;
    rows.push({s:state(h),a:arms(h),dt:Math.min(ms/1000,.05),t});
  }
  const landings=[],launches=[];let previous=initial;
  for(let i=0;i<rows.length;i++){const r=rows[i];if(previous.s.player.grounded&&!r.s.player.grounded&&r.s.vectors[1][1]>0)launches.push(i);
    if(!previous.s.player.grounded&&r.s.player.grounded)landings.push({frame:i,dt:r.dt,delta:Math.max(...r.a.map((a,j)=>Math.abs(a-previous.a[j]))),velocity:r.s.vectors[1]});previous=r;}
  return {rows,initial,metrics:{frames:rows.length,launches,landings,maxY:Math.max(...rows.map(r=>r.s.vectors[0][1])),hover:rows.some(r=>r.s.player.hover),lastPos:rows.at(-1).s.vectors[0],lastVel:rows.at(-1).s.vectors[1]}};
}
function improvement(before,after){const b=before.landings,a=after.landings;return b.length>0&&a.length===b.length&&a.every((v,i)=>v.frame===b[i].frame&&v.delta<b[i].delta*.8);}
const report={status:'RUNNING',base:BASE,baseTree:BASE_TREE,environment:process.version,observedAt:new Date().toISOString(),comparisons:[],limitations:['Synthetic frame schedules, not measured device FPS.','THREE/DOM fixtures execute actual game-frame logic; collision setup is isolated test state, not proof of a human route.','Only grounded arm X rotations may differ; all player scalars, listed vectors, camera, root, legs, head, bellows and existing signals are compared exactly.']};
let tmp;
try{
  ok(git('rev-parse',BASE+'^{tree}')===BASE_TREE,'AC-02 authorized base tree is exact');
  tmp=fs.mkdtempSync(path.join(os.tmpdir(),'bh004-physics-'));
  execFileSync('tar',['-x','-C',tmp],{input:execFileSync('git',['archive',BASE],{cwd:ROOT,maxBuffer:16*1024*1024})});
  execFileSync(process.execPath,['build.js'],{cwd:tmp});
  const base=fs.readFileSync(path.join(tmp,'dist/index.html'),'utf8'),candidate=fs.readFileSync(path.join(ROOT,'dist/index.html'),'utf8');
  report.checkout=git('rev-parse','HEAD');report.checkoutTree=git('rev-parse','HEAD^{tree}');report.workingTree=git('status','--porcelain');
  report.baseArtifactSha256=hash(base);report.candidateArtifactSha256=hash(candidate);
  ok(report.baseArtifactSha256==='5363a8bc17435f18a7b6b9907663b6a2941a8deff2436935be02d4be7cf43a6b','AC-02 base build matches captured pre-change product');
  for(const schedule of schedules)for(const spec of scenarios){
    const b=run(base,spec,schedule),c=run(candidate,spec,schedule),label=schedule.name+' / '+spec.name;
    const mismatch=b.rows.findIndex((r,i)=>JSON.stringify(r.s)!==JSON.stringify(c.rows[i]?.s));
    ok(mismatch===-1&&b.rows.length===c.rows.length,'AC-02 exact gameplay/root/contact/response parity: '+label+(mismatch>=0?' frame '+mismatch:''));
    ok(c.rows.every(r=>r.a.every(Number.isFinite)),'AC-03 finite arm poses: '+label);
    if(spec.landing){ok(improvement(b.metrics,c.metrics),'AC-01/03 reduce each landing arm step by at least 20%: '+label);ok(!improvement(b.metrics,b.metrics),'AC-06 unchanged approved base fails the continuity criterion: '+label);}
    if(spec.name==='early-release short hop'||spec.name==='held standing jump')ok(c.metrics.launches[0]===0,'AC-02 jump launches on first input update: '+label);
    if(spec.name==='puff and held float')ok(b.metrics.hover&&c.metrics.hover,'AC-02 actual puff/float engagement: '+label);
    if(spec.name==='idle run stop turn')ok(c.rows.some(r=>r.s.vectors[1][0]>1)&&c.rows.some(r=>r.s.vectors[1][0]<-1)&&Math.hypot(...c.metrics.lastVel)<1e-12,'AC-02 run, turn and full stop really occurred: '+label);
    if(spec.name==='running jump landing into run')ok(c.metrics.landings.some(r=>Math.abs(r.velocity[0])>1),'AC-02 running persisted through landing: '+label);
    if(spec.name==='native 0.4m step collision')ok(c.rows.some(r=>r.s.player.grounded&&Math.abs(r.s.vectors[0][1]-.4)<.001),'AC-02 native step surface was reached: '+label);
    if(spec.name==='native 1m wall collision')ok(c.rows.every(r=>r.s.vectors[0][2]>=8.009)&&c.metrics.lastPos[2]<8.02,'AC-02 native wall blocks traversal: '+label);
    if(spec.name==='native tower platform landing')ok(Math.abs(c.metrics.lastPos[1]-1.1)<.001,'AC-02 native platform landing is 1.1m: '+label);
    report.comparisons.push({schedule:schedule.name,scenario:spec.name,fixture:!!spec.fixture,firstMismatch:mismatch,base:b.metrics,candidate:c.metrics});
  }
  // Actual pause/resume handlers and frame loop, with a long paused interval.
  const p=create(candidate),q=create(base);p.kd('Space');q.kd('Space');p.frames(9);q.frames(9);p.ku('Space');q.ku('Space');
  p.tapBtn('pauseBtn');q.tapBtn('pauseBtn');const frozen=JSON.stringify({s:state(p),a:arms(p)}),pausedTime=p.window.__gameTime();p.step(10000);q.step(10000);p.frames(3);q.frames(3);
  ok(p.window.__paused()&&JSON.stringify({s:state(p),a:arms(p)})===frozen,'AC-04 pause freezes gameplay and new presentation through a long wall interval');
  p.tapBtn('pauseResume');q.tapBtn('pauseResume');p.frames(1);q.frames(1);
  ok(!p.window.__paused()&&p.window.__gameTime()-pausedTime<.017&&p.window.__gameTime()-pausedTime>.016&&JSON.stringify({s:state(p),a:arms(p)})===JSON.stringify({s:state(q),a:arms(q)}),'AC-04 resume uses only the current frame and exactly matches the base under the same paused schedule');
  // A deliberate position discontinuity must not carry the old airborne arm pose.
  const t=create(candidate);t.kd('Space');t.frames(12);t.ku('Space');t.P.pos.set(8,0,10);t.P.vel.set(0,0,0);t.P.grounded=true;t.frames(1);
  ok(arms(t).every(v=>v===0)&&JSON.stringify(xyz(t.getPlayer().position))===JSON.stringify(xyz(t.P.pos)),'AC-04 position discontinuity resets arm continuity and never smooths the physical root');
  // Existing ability/death pose ownership wins over the new ground easing.
  for(const mode of ['slam','spin','death']){
    const b=create(base),c=create(candidate);for(const h of [b,c]){h.kd('KeyD');h.frames(10);h.ku('KeyD');if(mode==='slam'){h.P.slam=1;h.P.hangT=.2;h.P.grounded=false;h.P.pos.y=3;}else if(mode==='spin')h.P.bonkT=.3;else{h.P.dead=true;h.P.deadT=.2;}h.frames(1);}
    ok(JSON.stringify(state(b))===JSON.stringify(state(c))&&JSON.stringify(arms(b))===JSON.stringify(arms(c)),'AC-04 original '+mode+' pose and gameplay ownership preserved');
  }
  // Actual respawn and checkpoint reset, from the same isolated death state.
  {
    const b=create(base),c=create(candidate);let sawDead=false,sawRecovery=false,equal=true,resetEqual=false;
    for(const h of [b,c]){h.P.spawn={x:0,y:0,z:10};h.P.dead=true;h.P.deadT=.12;h.P.pos.set(3,1,10);h.P.vel.set(0,0,0);}
    for(let i=0;i<40;i++){const dead=c.P.dead;b.frames(1);c.frames(1);sawDead=sawDead||c.P.dead;equal=equal&&JSON.stringify(state(b))===JSON.stringify(state(c));if(dead&&!c.P.dead){sawRecovery=true;resetEqual=JSON.stringify(arms(b))===JSON.stringify(arms(c));}}
    ok(sawDead&&sawRecovery&&equal&&resetEqual,'AC-04 real respawn resets at the checkpoint without carrying the old arm pose');
  }
  // All six native menu/restart transitions, without persisting arm state.
  {
    const b=create(base),c=create(candidate);let menuEqual=true,restarts=true;
    for(let level=0;level<6;level++){
      for(const h of [b,c]){h.tapBtn('pauseBtn');h.tapBtn('pauseMenu');h.frames(2);}
      menuEqual=menuEqual&&JSON.stringify(arms(b))===JSON.stringify(arms(c))&&!c.isStarted()&&!c.window.__paused();
      for(const h of [b,c]){h.window.__setPickerIdx(level);h.confirmStart();h.frames(2);}
      restarts=restarts&&c.getLevel().id==='level'+(level+1)&&JSON.stringify(state(b))===JSON.stringify(state(c))&&JSON.stringify(arms(b))===JSON.stringify(arms(c));
    }
    ok(menuEqual&&restarts,'AC-04 six menu/level/restart transitions reset presentation at the actual new spawn');
  }
  // These native special-mode fixtures isolate reset boundaries, not navigation.
  for(const mode of ['underwater','space','camel','sled']){
    const level={underwater:1,space:3,camel:4,sled:5}[mode],b=boot({html:base,randomSeed:0xB004,autostart:false}),c=boot({html:candidate,randomSeed:0xB004,autostart:false});
    for(const h of [b,c]){h.window.__setPickerIdx(level);h.confirmStart();h.frames(12);if(mode==='camel')h.window.__DESERT.mountCamel(h.W.camels[0]);if(mode==='sled')h.window.__WINTER.mountSled(h.window.__WINTER.sled);h.kd('Space');}
    let equal=true;for(let i=0;i<45;i++){b.frames(1);c.frames(1);equal=equal&&JSON.stringify(state(b))===JSON.stringify(state(c))&&JSON.stringify(arms(b))===JSON.stringify(arms(c));}
    ok(equal,'AC-04 original '+mode+' animation and gameplay remain exact');
    if(mode==='camel'||mode==='sled'){
      for(const h of [b,c]){h.ku('Space');if(mode==='sled')h.frames(600);else h.frames(1);}
      const prior=!!(mode==='sled'?c.P.sled:c.P.camel);
      for(const h of [b,c]){mode==='sled'?h.window.__WINTER.dismountSled():h.window.__DESERT.dismountCamel();h.frames(1);}
      ok(prior&&!c.P.camel&&!c.P.sled&&JSON.stringify(state(b))===JSON.stringify(state(c))&&JSON.stringify(arms(b))===JSON.stringify(arms(c)),'AC-04 native '+mode+' dismount immediately resets pose/root ownership');
    }
  }
  report.status=failures?'FAIL':'PASS';
}catch(e){ok(false,e.stack||String(e));report.status='FAIL';report.error=e.stack||String(e);}
finally{if(tmp)fs.rmSync(tmp,{recursive:true,force:true});report.checks=checks;report.failures=failures;fs.mkdirSync(OUT,{recursive:true});fs.writeFileSync(path.join(OUT,'physics-comparison.json'),JSON.stringify(report,null,2));}
console.log(`${checks-failures} comparison checks passed, ${failures} failed`);process.exitCode=failures?1:0;
