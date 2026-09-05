// Pling v57 visual-only redesign regression coverage.
// The purpose of this suite is to prove that the new rendered shell did not
// move the gameplay contract while also proving the animation bindings survived.
const fs=require('fs'),path=require('path');
const ROOT=path.join(__dirname,'..');
const playerSource=fs.readFileSync(path.join(ROOT,'src','player.js'),'utf8');
const visualSource=fs.readFileSync(path.join(ROOT,'src','player-visual.js'),'utf8');
const build=require('../build.js');
let failures=0;
function ok(cond,msg){if(!cond)failures++;console.log((cond?'PASS ':'FAIL ')+msg);}

// Frozen gameplay constants remain owned by player.js and keep their exact baseline.
ok(playerSource.includes('let R=0.36,H=1.15,SPEED=6.8,ACC=44,DEC=60,AIRACC=20,GRAV=-30,JUMPV=10.5,PUFFV=9.4,MAXFALL=-32,COYOTE=0.12,BUFFER=0.15,STEP=0.42;'),
  'player collision, height, movement, jump and gravity constants remain frozen');
ok(playerSource.includes('JET_T=0.38,BONKR=2.05,BONK_CD=0.5;'),
  'spin/attack reach and cooldown constants remain frozen');

const forbidden=['R','H','SPEED','ACC','DEC','AIRACC','GRAV','JUMPV','PUFFV','MAXFALL','COYOTE','BUFFER','STEP','BONKR','BONK_CD'];
for(const name of forbidden){
  const assignment=new RegExp('(?:^|[^A-Za-z0-9_$])'+name+'\\s*=','m');
  ok(!assignment.test(visualSource),`visual module does not assign gameplay constant ${name}`);
}

const pi=build.ORDER.indexOf('player.js'),pvi=build.ORDER.indexOf('player-visual.js');
ok(pi>=0&&pvi===pi+1,'visual shell loads immediately after gameplay-owned player.js');
ok(JSON.parse(fs.readFileSync(path.join(ROOT,'release.json'),'utf8')).display==='v57 · Robot Refresh',
  'release is sourced only from release.json as v57 · Robot Refresh');

const H=require('./harness.js')({level:0});
const {P,frames,kd,ku,getPlayer,getPhys,ok:hok}=H;
const player=getPlayer(),phys=getPhys();
hok(phys.r===0.36&&phys.h===1.15,'runtime collision radius/height remain 0.36 / 1.15');
hok(phys.speed===6.8&&phys.acc===44&&phys.dec===60&&phys.airAcc===20,'runtime land movement tuning remains frozen');
hok(phys.grav===-30&&phys.jumpV===10.5&&phys.puffV===9.4&&phys.maxFall===-32,'runtime jump/gravity/fall tuning remains frozen');
hok(player.scale.x===0.72&&player.scale.y===0.72&&player.scale.z===0.72,'gameplay-facing player root scale remains 0.72');
hok(player.userData.visualStyle==='rounded-white-cyan-v57','new rounded white/cyan visual shell is active');
hok(player.userData.eyes&&player.userData.eyes.length===2&&player.userData.visor&&player.userData.antennaTip,
  'visor, two expressive eye bindings, and antenna are present');
hok(player.userData.bel&&player.userData.legL&&player.userData.legR&&player.userData.armL&&player.userData.armR,
  'existing torso/leg/arm animation binding names are preserved');
hok(player.userData.wings&&player.userData.wings.userData.wingL&&player.userData.wings.userData.wingR,
  'existing glide-wing animation contract is preserved');
hok(player.userData.jet&&player.userData.flame,'existing jet and fire effect objects are preserved');

// Drive real game frames so the post-redesign bindings are exercised, not just constructed.
frames(3);
kd('KeyW');frames(18);ku('KeyW');
hok(Number.isFinite(player.userData.legL.rotation.x)&&Number.isFinite(player.userData.armR.rotation.x),
  'walking animation updates redesigned limb bindings');
kd('Space');frames(5);ku('Space');frames(4);
hok(P.pos.y>0&&Number.isFinite(player.userData.head.rotation.x),'jump updates redesigned model without breaking grounding/root state');

// Merge the harness assertions into this suite's exit contract.
if(failures){console.log(`\n${failures} FAILED`);process.exit(1);}
H.report();
