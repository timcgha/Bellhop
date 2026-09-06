const fs=require('fs'),path=require('path');
const H=require('./harness.js')({autostart:false});
const {P,window,frames,kd,ku,ok,report,startLevel,tapBtn,setGamepad,mkGamepad,el,getPhys}=H;
const near=(a,b,eps=1e-9)=>Math.abs(a-b)<=eps;
const pos=()=>({x:P.pos.x,y:P.pos.y,z:P.pos.z});
const samePos=(a,b)=>near(a.x,b.x)&&near(a.y,b.y)&&near(a.z,b.z);
const buttons=(...on)=>Array.from({length:16},(_,i)=>on.includes(i));

ok(window.__paused()===false,'pause state is initially false');
ok(window.__gameTime()===0,'game time is initially zero');

startLevel(0);
ok(H.isStarted()===true,'normal picker path starts gameplay');
const phys=getPhys();
ok(phys.r===0.36&&phys.h===1.15&&phys.speed===6.8&&phys.acc===44&&phys.dec===60&&phys.airAcc===20&&phys.grav===-30&&phys.jumpV===10.5&&phys.puffV===9.4&&phys.maxFall===-32&&phys.coyote===0.12&&phys.buffer===0.15&&phys.step===0.42,'core gameplay constants remain unchanged at runtime');
const playerSrc=fs.readFileSync(path.join(__dirname,'..','src','player.js'),'utf8');
ok(/BONKR=2\.05,BONK_CD=0\.5/.test(playerSrc),'BONKR and BONK_CD remain unchanged');

const beforeMove=pos();
kd('KeyD');frames(12);
const afterMove=pos();
ok(Math.hypot(afterMove.x-beforeMove.x,afterMove.z-beforeMove.z)>0.05,'gameplay movement advances before pause');
H.setTouchStick(0.8,0.2);
tapBtn('bA');
kd('Escape');frames(1);
ok(window.__paused()===true,'Escape enters pause');
ok(el('pauseOverlay').style.display==='flex','pause overlay is shown');
const neutral=window.__INPUT_STATE();
ok(neutral.mx===0&&neutral.mz===0&&neutral.camDX===0&&neutral.camDY===0&&!neutral.jump&&!neutral.jumpHeld&&!neutral.b&&!neutral.bHeld&&!neutral.y&&neutral.touchStickId===null&&neutral.touchCamId===null&&!neutral.heldA&&!neutral.heldB&&neutral.keysDown.length===0,'entering pause clears stale keyboard, action, camera, held-button, and touch-stick input');

const pausedPos=pos(),pausedTime=window.__gameTime();
frames(40);
ok(samePos(pos(),pausedPos),'player position does not advance while paused');
ok(near(window.__gameTime(),pausedTime),'simulation time does not advance while paused');
kd('KeyD');kd('Space');frames(20);
ok(samePos(pos(),pausedPos),'gameplay input cannot move the player under the pause overlay');
ok(near(window.__gameTime(),pausedTime),'game time stays frozen while paused input is attempted');
ku('KeyD');ku('Space');

kd('Escape');frames(1);ku('Escape');
ok(window.__paused()===false,'Escape resumes gameplay');
ok(el('pauseOverlay').style.display==='none','resume hides pause overlay');
const resumeNeutral=pos();frames(8);
ok(samePos(pos(),resumeNeutral),'resume begins from neutral input without stale movement');
kd('KeyD');frames(12);ku('KeyD');
ok(Math.hypot(P.pos.x-resumeNeutral.x,P.pos.z-resumeNeutral.z)>0.05,'fresh movement input works after resume');

kd('KeyP');frames(1);ku('KeyP');
ok(window.__paused()===true,'P toggles gameplay into pause');
tapBtn('pauseResume');frames(1);
ok(window.__paused()===false,'Resume touch target restores gameplay');

setGamepad(mkGamepad(buttons(),[0,0,0,0]));frames(1);
setGamepad(mkGamepad(buttons(9),[0,0,0,0]));frames(1);
ok(window.__paused()===true,'gamepad Start/Menu button pauses gameplay');
setGamepad(mkGamepad(buttons(),[0,0,0,0]));frames(1);
setGamepad(mkGamepad(buttons(9),[0,0,0,0]));frames(1);
ok(window.__paused()===false,'gamepad Start/Menu button resumes gameplay');
setGamepad(null);frames(1);

tapBtn('pauseBtn');frames(1);
ok(window.__paused()===true,'visible pause touch target enters pause');
P.camel={test:true};
H.setTouchStick(1,0);
tapBtn('pauseMenu');frames(1);
ok(window.__paused()===false,'returning to menu clears paused state');
ok(H.isStarted()===false,'returning to menu leaves gameplay state');
ok(el('pauseOverlay').style.display==='none','returning to menu hides pause overlay');
ok(el('start').style.display==='flex','returning to menu restores the existing picker');
ok(P.camel===null,'returning to menu clears stale mount state');
const menuInput=window.__INPUT_STATE();
ok(menuInput.touchStickId===null&&menuInput.mx===0&&menuInput.mz===0&&!menuInput.jump&&!menuInput.b&&!menuInput.y,'returning to menu clears transient gameplay input');

startLevel(1);
ok(H.isStarted()===true&&H.getLevel().id==='level2','another level starts through the normal picker/loadLevel path after returning to menu');
ok(window.__paused()===false,'newly started level is not paused');

report();