const IN={mx:0,mz:0,camDX:0,camDY:0,jump:false,jumpHeld:false,b:false,bHeld:false,y:false};
const keys={};
addEventListener('keydown',e=>{
  if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].indexOf(e.code)>=0)e.preventDefault();
  if(e.repeat)return;keys[e.code]=true;
  if(!started){
    if(e.code==='ArrowLeft'||e.code==='KeyA'){setPickerIdx(pickerIdx-1);return;}
    if(e.code==='ArrowRight'||e.code==='KeyD'){setPickerIdx(pickerIdx+1);return;}
    if(e.code==='Space'||e.code==='Enter'){startGame();return;}
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
  if(!navigator.getGamepads)return;let gp=null;const gps=navigator.getGamepads();
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
  if(e.pointerId===T.stickId){let dx=e.clientX-T.sx,dy=e.clientY-T.sy;const m=Math.hypot(dx,dy),R=48;if(m>R){dx=dx/m*R;dy=dy/m*R;}T.jx=dx/R;T.jy=dy/R;knobEl.style.left=(35+dx)+'px';knobEl.style.top=(35+dy)+'px';}
  else if(e.pointerId===T.camId){const dx=e.clientX-T.cx,dy=e.clientY-T.cy;T.cx=e.clientX;T.cy=e.clientY;IN.camDX+=dx*0.006;IN.camDY+=dy*0.004;}
});
function endPtr(e){if(e.pointerId===T.stickId){T.stickId=null;T.jx=0;T.jy=0;stickEl.style.display='none';}if(e.pointerId===T.camId){T.camId=null;}}
ctl.addEventListener('pointerup',endPtr);ctl.addEventListener('pointercancel',endPtr);ctl.addEventListener('lostpointercapture',endPtr);
function bindBtn(id,down,up){const el=$(id);el.addEventListener('pointerdown',e=>{e.stopPropagation();e.preventDefault();if(!started){initAudio();if(id==='bA')startGame();else return;}initAudio();if(el.setPointerCapture)el.setPointerCapture(e.pointerId);down();});const u=e=>{e.stopPropagation();if(up)up();};el.addEventListener('pointerup',u);el.addEventListener('pointercancel',u);el.addEventListener('lostpointercapture',u);}
bindBtn('bA',()=>{IN.jump=true;HELD.a=true;},()=>{HELD.a=false;});
bindBtn('bB',()=>{IN.b=true;HELD.b=true;},()=>{HELD.b=false;});
bindBtn('bY',()=>{IN.y=true;},null);
document.addEventListener('touchmove',e=>{e.preventDefault();},{passive:false});
document.addEventListener('gesturestart',e=>{e.preventDefault();});
document.addEventListener('contextmenu',e=>{e.preventDefault();});
