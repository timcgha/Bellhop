function updateHUD(){$('hp').textContent='❤️'.repeat(Math.max(P.hp,0))+'🤍'.repeat(P.maxHp-Math.max(P.hp,0));$('snz').textContent='😴 '+rescued+'/'+snoozles.length;$('nts').textContent='♪ '+gotNotes+'/'+notes.length;
  const f=$('fire');f.style.display=P.fire?'':'none';f.textContent='🔥';
  const b=$('bubble');if(b){b.style.display=(P.bubble&&isUnderwater())?'':'none';b.textContent='🫧';}
  updateTouchLabels();}
function updateTouchLabels(){
  const lbl=$('bBLbl');if(!lbl)return;
  if(isUnderwater())lbl.textContent=P.bubble?'bubble':'gust';
  else lbl.textContent='slam · gust';
}
let toastTO=null;function showToast(t){const el=$('toast');el.textContent=t;el.style.opacity=1;clearTimeout(toastTO);toastTO=setTimeout(()=>{el.style.opacity=0;},2400);}
const CTLTEXT=isTouch?'Left thumb moves · right thumb looks · A jump — blue jet burns anything under him (tap again in the air for an air-puff, hold to float) · B slam in the air, gust on the ground · Y spin':'WASD or arrows move · Space jumps — the blue jet burns anything under him (again in the air for an air-puff, hold to float) · J or Shift: slam in the air, gust on the ground · K spins · drag or Q/E turns the camera · M mutes';
const PICKHINT=isTouch?'Tap a picture · tap it again to play':'← → choose a level · Space or A to start';
$('ctlText').textContent=CTLTEXT;$('hint').textContent=CTLTEXT;$('pickHint').textContent=PICKHINT;

let pickerIdx=0;
function updatePickerUI(pulse){
  for(let i=0;i<LEVELS.length;i++){
    const el=$('lvl'+i);if(!el)continue;
    const on=i===pickerIdx;
    el.classList.toggle('sel',on);
    if(pulse&&on){el.classList.remove('pulse');void el.offsetWidth;el.classList.add('pulse');}
    else if(!on)el.classList.remove('pulse');
  }
}
function setPickerIdx(i){
  const next=clamp(i,0,LEVELS.length-1);
  const changed=next!==pickerIdx;
  pickerIdx=next;
  updatePickerUI(changed);
}
function tapLevelCard(i){
  if(started)return;
  if(i===pickerIdx){startGame();return;}
  setPickerIdx(i);
}
window.__pickerIdx=()=>pickerIdx;
window.__setPickerIdx=setPickerIdx;

function drawLevelArt(){
  [[$('art0'),'meadow'],[$('art1'),'deep']].forEach(([cv,kind])=>{
    if(!cv||typeof cv.getContext!=='function')return;
    const w=160,h=100;
    const g=cv.getContext('2d');if(!g)return;
    const dpr=Math.min(window.devicePixelRatio||1,2);
    cv.width=w*dpr;cv.height=h*dpr;if(cv.style){cv.style.width=w+'px';cv.style.height=h+'px';}
    g.scale(dpr,dpr);
    if(kind==='meadow'){
      const sky=g.createLinearGradient(0,0,0,h);sky.addColorStop(0,'#87ceeb');sky.addColorStop(1,'#c8e6a0');g.fillStyle=sky;g.fillRect(0,0,w,h);
      g.fillStyle='#78c65a';g.fillRect(0,h*0.55,w,h*0.45);
      g.fillStyle='#d8c48f';g.fillRect(w*0.2,h*0.62,w*0.6,h*0.08);
      g.fillStyle='#f1e3c2';g.fillRect(w*0.72,h*0.28,10,28);g.fillStyle='#c0392b';g.beginPath();g.moveTo(w*0.67,h*0.28);g.lineTo(w*0.82,h*0.28);g.lineTo(w*0.745,h*0.14);g.closePath();g.fill();
      for(let i=0;i<4;i++){const a=i*Math.PI/2;g.fillStyle='#7a4f2b';g.fillRect(w*0.745+Math.cos(a)*16-2,h*0.22+Math.sin(a)*10,4,18);g.fillStyle='#fff5e0';g.fillRect(w*0.745+Math.cos(a)*16-5,h*0.22+Math.sin(a)*10,10,12);}
      g.fillStyle='#4d9a3a';g.beginPath();g.arc(w*0.22,h*0.52,14,0,TAU);g.fill();g.beginPath();g.arc(w*0.18,h*0.48,10,0,TAU);g.fill();
    }else{
      const sea=g.createLinearGradient(0,0,0,h);sea.addColorStop(0,'#5ec8e8');sea.addColorStop(0.45,'#2a9fd4');sea.addColorStop(1,'#1a6a8a');g.fillStyle=sea;g.fillRect(0,0,w,h);
      g.fillStyle='rgba(255,255,255,0.25)';for(let i=0;i<5;i++)g.fillRect(i*34+4,h*0.12+Math.sin(i)*6,28,3);
      g.fillStyle='#d9c08a';g.fillRect(0,h*0.78,w,h*0.22);
      g.fillStyle='#f5d0a8';g.beginPath();g.moveTo(w*0.55,h*0.78);g.quadraticCurveTo(w*0.62,h*0.35,w*0.78,h*0.78);g.lineTo(w*0.52,h*0.78);g.closePath();g.fill();
      g.strokeStyle='#e8b890';g.lineWidth=2;g.stroke();
      g.fillStyle='#fff8ee';g.beginPath();g.arc(w*0.6,h*0.52,11,0,TAU);g.fill();g.strokeStyle='#e8b890';g.stroke();
    }
  });
}
drawLevelArt();
for(let i=0;i<LEVELS.length;i++){
  $('lvl'+i).addEventListener('pointerdown',e=>{e.stopPropagation();e.preventDefault();tapLevelCard(i);});
}

function startGame(){if(started)return;loadLevel(LEVELS[pickerIdx]);started=true;$('start').style.display='none';initAudio();IN.jump=false;IN.b=false;IN.y=false;updateHUD();
  const msg=pickerIdx===0?'Follow the path. Wake all four Snoozles!':'Dive in. Wake four Snoozles on the ocean floor!';
  setTimeout(()=>showToast(msg),600);setTimeout(()=>{$('hint').style.opacity=0;},12000);}
window.__startGame=startGame;
updatePickerUI();
