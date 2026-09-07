const IN={mx:0,mz:0,camDX:0,camDY:0,jump:false,jumpHeld:false,b:false,bHeld:false,y:false};
const keys={};
addEventListener('keydown',e=>{
  if(typeof isSkinPanelOpen==='function'&&isSkinPanelOpen()){handleSkinKey(e);return;}
  if(!started&&e.target===$('skinsOpen'))return;
  if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].indexOf(e.code)>=0)e.preventDefault();
  if(e.repeat)return;
  if(started&&(e.code==='Escape'||e.code==='KeyP')){e.preventDefault();togglePause();return;}
  if(started&&paused){e.preventDefault();return;}
  keys[e.code]=true;
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
const GP={prev:[],blockUntilNeutral:false};
function firstGamepad(){
  if(!navigator.getGamepads)return null;const gps=navigator.getGamepads();
  for(let i=0;i<gps.length;i++)if(gps[i]&&gps[i].connected)return gps[i];
  return null;
}
function pollGamepad(dt){
  const gp=firstGamepad();if(!gp)return;
  const dz=v=>Math.abs(v)<0.18?0:v;const ax=gp.axes;
  const lx=dz(ax[0]||0),ly=dz(ax[1]||0),rx=dz(ax[2]||0),ry=dz(ax[3]||0);
  const b=gp.buttons.map(x=>x.pressed);const edge=i=>b[i]&&!GP.prev[i];
  if(typeof isSkinPanelOpen==='function'&&isSkinPanelOpen()){handleSkinGamepad(b,ax,edge);GP.prev=b;return;}
  if(!started&&edge(3)){openSkins();GP.prev=b;return;}
  if(started&&edge(9)){togglePause();GP.prev=b;return;}
  if(started&&paused){GP.prev=b;return;}
  if(!started){
    if(edge(14)||lx<-0.55)setPickerIdx(pickerIdx-1);
    if(edge(15)||lx>0.55)setPickerIdx(pickerIdx+1);
    if(edge(0))startGame();
    GP.prev=b;return;
  }
  if(GP.blockUntilNeutral){
    const actionHeld=!!(b[0]||b[1]||b[2]||b[3]||b[9]);
    const centered=Math.abs(ax[0]||0)<0.18&&Math.abs(ax[1]||0)<0.18&&Math.abs(ax[2]||0)<0.18&&Math.abs(ax[3]||0)<0.18;
    if(actionHeld||!centered){GP.prev=b;return;}
    GP.blockUntilNeutral=false;
  }
  if(lx||ly){IN.mx=lx;IN.mz=ly;}IN.camDX+=rx*2.8*dt;IN.camDY+=ry*1.8*dt;
  if(edge(0))IN.jump=true;if(b[0])IN.jumpHeld=true;
  if(edge(1)||edge(2))IN.b=true;if(b[1]||b[2])IN.bHeld=true;
  if(edge(3))IN.y=true;
  GP.prev=b;
}
function rumble(ms,s,w){try{const gps=navigator.getGamepads?navigator.getGamepads():[];for(let i=0;i<gps.length;i++){const gp=gps[i];if(gp&&gp.vibrationActuator&&gp.vibrationActuator.playEffect){gp.vibrationActuator.playEffect('dual-rumble',{duration:ms,strongMagnitude:s,weakMagnitude:w});break;}}}catch(e){}}
const ctl=$('ctl'),stickEl=$('stick'),knobEl=$('knob');
const T={stickId:null,sx:0,sy:0,camId:null,cx:0,cy:0,jx:0,jy:0};
const HELD={a:false,b:false};
function clearGameplayInput(){
  for(const k in keys)keys[k]=false;
  IN.mx=IN.mz=IN.camDX=IN.camDY=0;IN.jump=IN.jumpHeld=IN.b=IN.bHeld=IN.y=false;
  T.stickId=null;T.camId=null;T.jx=T.jy=0;HELD.a=HELD.b=false;
  stickEl.style.display='none';knobEl.style.left='35px';knobEl.style.top='35px';
  const gp=firstGamepad();GP.prev=gp?gp.buttons.map(x=>x.pressed):[];GP.blockUntilNeutral=true;
}
window.__INPUT_STATE=()=>({mx:IN.mx,mz:IN.mz,camDX:IN.camDX,camDY:IN.camDY,jump:IN.jump,jumpHeld:IN.jumpHeld,b:IN.b,bHeld:IN.bHeld,y:IN.y,touchStickId:T.stickId,touchCamId:T.camId,touchX:T.jx,touchY:T.jy,heldA:HELD.a,heldB:HELD.b,keysDown:Object.keys(keys).filter(k=>keys[k]),gamepadBlocked:GP.blockUntilNeutral});
ctl.addEventListener('pointerdown',e=>{
  if(paused)return;
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
function bindPauseTap(id,fn){const el=$(id);el.addEventListener('pointerdown',e=>{e.stopPropagation();e.preventDefault();fn();});}
bindPauseTap('pauseBtn',()=>togglePause());
bindPauseTap('pauseResume',()=>setPaused(false));
bindPauseTap('pauseMenu',()=>returnToMainMenu());
$('pauseOverlay').addEventListener('pointerdown',e=>{e.stopPropagation();e.preventDefault();});
window.__setTouchStick=(x,z)=>{T.stickId=1;T.jx=x;T.jy=z;};
window.__clearTouchStick=()=>{T.stickId=null;T.jx=0;T.jy=0;};
document.addEventListener('touchmove',e=>{
  if(!started){
    if(typeof isSkinPanelOpen==='function'&&isSkinPanelOpen()&&e.target.closest('#skinsOverlay'))return;
    const menu=$('start');
    if(menu&&menu.style.display!=='none'&&e.target.closest('#start'))return;
  }
  e.preventDefault();
},{passive:false});
document.addEventListener('gesturestart',e=>{e.preventDefault();});
document.addEventListener('contextmenu',e=>{e.preventDefault();});