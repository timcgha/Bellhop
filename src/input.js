const IN={mx:0,mz:0,camDX:0,camDY:0,jump:false,jumpHeld:false,b:false,bHeld:false,y:false};
const keys={};
let paused=false;
function latchGamepadButtons(){
  try{
    const gps=typeof navigator!=='undefined'&&navigator.getGamepads?navigator.getGamepads():[];
    GP.prev=[];
    for(let i=0;i<gps.length;i++)if(gps[i]&&gps[i].connected){GP.prev=gps[i].buttons.map(x=>!!x.pressed);break;}
  }catch(e){GP.prev=[];}
}
function clearGameplayInput(){
  for(const code in keys)keys[code]=false;
  IN.mx=IN.mz=IN.camDX=IN.camDY=0;IN.jump=IN.jumpHeld=IN.b=IN.bHeld=IN.y=false;
  HELD.a=HELD.b=false;T.stickId=T.camId=null;T.jx=T.jy=0;
  if(stickEl)stickEl.style.display='none';
  latchGamepadButtons();
}
function setPauseUI(show){
  document.body.classList.toggle('paused',show);
  const menu=$('pauseMenu');if(menu)menu.style.display=show?'flex':'none';
}
function pauseGame(){
  if(!started||won||paused)return false;
  paused=true;clearGameplayInput();setPauseUI(true);suspendGameAudio();
  const resume=$('resumeLevel');if(resume&&typeof resume.focus==='function'){try{resume.focus({preventScroll:true});}catch(e){resume.focus();}}
  return true;
}
function resumeGame(){
  if(!started||!paused)return false;
  paused=false;clearGameplayInput();setPauseUI(false);resumeGameAudio();return true;
}
function leavePauseForExit(){paused=false;clearGameplayInput();setPauseUI(false);}
function togglePause(){return paused?resumeGame():pauseGame();}
window.__paused=()=>paused;
window.__pauseGame=pauseGame;
window.__resumeGame=resumeGame;
window.__inputState=()=>({paused,mx:IN.mx,mz:IN.mz,jump:IN.jump,jumpHeld:IN.jumpHeld,b:IN.b,bHeld:IN.bHeld,y:IN.y,touchStick:T.stickId!==null,touchCamera:T.camId!==null});
addEventListener('keydown',e=>{
  if(e.code==='Escape'&&started&&!won){e.preventDefault();if(!e.repeat)togglePause();return;}
  if(paused){if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].indexOf(e.code)>=0)e.preventDefault();return;}
  if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].indexOf(e.code)>=0)e.preventDefault();
  if(e.repeat)return;keys[e.code]=true;
  if(!started){
    if(e.code==='ArrowLeft'||e.code==='KeyA'){setPickerIdx(pickerIdx-1);return;}
    if(e.code==='ArrowRight'||e.code==='KeyD'){setPickerIdx(pickerIdx+1);return;}
    if(e.code==='Space'||e.code==='Enter'){startGame();keys.Space=false;keys.Enter=false;return;}
    return;
  }
  if(e.code==='Space')IN.jump=true;
  if(e.code==='KeyJ'||e.code==='ShiftLeft'||e.code==='ShiftRight')IN.b=true;
  if(e.code==='KeyK'||e.code==='KeyF')IN.y=true;
  if(e.code==='KeyM')toggleMute();
});
addEventListener('keyup',e=>{keys[e.code]=false;});
function readKeys(dt){
  IN.mx=(keys.KeyD||keys.ArrowRight?1:0)-(keys.KeyA||keys.ArrowLeft?1:0);
  IN.mz=(keys.KeyS||keys.ArrowDown?1:0)-(keys.KeyW||keys.ArrowUp?1:0);
  if(keys.KeyQ)IN.camDX-=2.2*dt;if(keys.KeyE)IN.camDX+=2.2*dt;
  if(keys.Space)IN.jumpHeld=true;
  if(keys.KeyJ||keys.ShiftLeft||keys.ShiftRight)IN.bHeld=true;
}
const GP={prev:[]};
function pollGamepad(dt){
  if(paused||!navigator.getGamepads)return;let gp=null;const gps=navigator.getGamepads();
  for(let i=0;i<gps.length;i++){if(gps[i]&&gps[i].connected){gp=gps[i];break;}}
  if(!gp)return;
  const dz=v=>Math.abs(v)<0.18?0:v;const ax=gp.axes;
  const lx=dz(ax[0]||0),ly=dz(ax[1]||0),rx=dz(ax[2]||0),ry=dz(ax[3]||0);
  if(started){if(lx||ly){IN.mx=lx;IN.mz=ly;}IN.camDX+=rx*2.8*dt;IN.camDY+=ry*1.8*dt;}
  const b=gp.buttons.map(x=>x.pressed);const edge=i=>b[i]&&!GP.prev[i];
  if(!started){
    if(edge(14)||lx<-0.55)setPickerIdx(pickerIdx-1);
    if(edge(15)||lx>0.55)setPickerIdx(pickerIdx+1);
    if(edge(0))startGame();
    GP.prev=b;return;
  }
  if(edge(0))IN.jump=true;if(b[0])IN.jumpHeld=true;
  if(edge(1)||edge(2))IN.b=true;if(b[1]||b[2])IN.bHeld=true;
  if(edge(3))IN.y=true;
  GP.prev=b;
}
function rumble(ms,s,w){try{const gps=navigator.getGamepads?navigator.getGamepads():[];for(let i=0;i<gps.length;i++){const gp=gps[i];if(gp&&gp.vibrationActuator&&gp.vibrationActuator.playEffect){gp.vibrationActuator.playEffect('dual-rumble',{duration:ms,strongMagnitude:s,weakMagnitude:w});break;}}}catch(e){}}
const ctl=$('ctl'),stickEl=$('stick'),knobEl=$('knob');
const T={stickId:null,sx:0,sy:0,camId:null,cx:0,cy:0,jx:0,jy:0};
const HELD={a:false,b:false};
ctl.addEventListener('pointerdown',e=>{
  if(paused){e.preventDefault();return;}
  if(!started){initAudio();return;}
  initAudio();
  if(ctl.setPointerCapture)ctl.setPointerCapture(e.pointerId);
  const isMouse=e.pointerType==='mouse';
  if(!isMouse&&e.clientX<innerWidth*0.45&&T.stickId===null){
    T.stickId=e.pointerId;T.sx=e.clientX;T.sy=e.clientY;T.jx=0;T.jy=0;
    stickEl.style.display='block';stickEl.style.left=(T.sx-60)+'px';stickEl.style.top=(T.sy-60)+'px';knobEl.style.left='35px';knobEl.style.top='35px';
  }else if(T.camId===null){T.camId=e.pointerId;T.cx=e.clientX;T.cy=e.clientY;}
});
ctl.addEventListener('pointermove',e=>{
  if(paused)return;
  if(e.pointerId===T.stickId){let dx=e.clientX-T.sx,dy=e.clientY-T.sy;const m=Math.hypot(dx,dy),R=48;if(m>R){dx=dx/m*R;dy=dy/m*R;}T.jx=dx/R;T.jy=dy/R;knobEl.style.left=(35+dx)+'px';knobEl.style.top=(35+dy)+'px';}
  else if(e.pointerId===T.camId){const dx=e.clientX-T.cx,dy=e.clientY-T.cy;T.cx=e.clientX;T.cy=e.clientY;IN.camDX+=dx*0.006;IN.camDY+=dy*0.004;}
});
function endPtr(e){if(e.pointerId===T.stickId){T.stickId=null;T.jx=0;T.jy=0;stickEl.style.display='none';}if(e.pointerId===T.camId){T.camId=null;}}
ctl.addEventListener('pointerup',endPtr);ctl.addEventListener('pointercancel',endPtr);ctl.addEventListener('lostpointercapture',endPtr);
function bindBtn(id,down,up){const el=$(id);el.addEventListener('pointerdown',e=>{e.stopPropagation();e.preventDefault();if(paused)return;if(!started){initAudio();if(id==='bA')startGame();else return;}initAudio();if(el.setPointerCapture)el.setPointerCapture(e.pointerId);down();});const u=e=>{e.stopPropagation();if(up)up();};el.addEventListener('pointerup',u);el.addEventListener('pointercancel',u);el.addEventListener('lostpointercapture',u);}
bindBtn('bA',()=>{IN.jump=true;HELD.a=true;},()=>{HELD.a=false;});
bindBtn('bB',()=>{IN.b=true;HELD.b=true;},()=>{HELD.b=false;});
bindBtn('bY',()=>{IN.y=true;},null);
window.__setTouchStick=(x,z)=>{if(paused)return;T.stickId=1;T.jx=x;T.jy=z;};
window.__clearTouchStick=()=>{T.stickId=null;T.jx=0;T.jy=0;};
document.addEventListener('touchmove',e=>{
  if(!started){
    const menu=$('start');
    if(menu&&menu.style.display!=='none'&&e.target.closest('#start'))return;
  }
  e.preventDefault();
},{passive:false});
document.addEventListener('gesturestart',e=>{e.preventDefault();});
document.addEventListener('contextmenu',e=>{e.preventDefault();});
