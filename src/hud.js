function updateHUD(){$('hp').textContent='❤️'.repeat(Math.max(P.hp,0))+'🤍'.repeat(P.maxHp-Math.max(P.hp,0));$('snz').textContent='😴 '+rescued+'/'+snoozles.length;$('nts').textContent='♪ '+gotNotes+'/'+notes.length;const f=$('fire');f.style.display=P.fire?'':'none';f.textContent='🔥';}
let toastTO=null;function showToast(t){const el=$('toast');el.textContent=t;el.style.opacity=1;clearTimeout(toastTO);toastTO=setTimeout(()=>{el.style.opacity=0;},2400);}
const CTLTEXT=isTouch?'Left thumb moves · right thumb looks · A jump — blue jet burns anything under him (tap again in the air for an air-puff, hold to float) · B slam in the air, gust on the ground · Y spin':'WASD or arrows move · Space jumps — the blue jet burns anything under him (again in the air for an air-puff, hold to float) · J or Shift: slam in the air, gust on the ground · K spins · drag or Q/E turns the camera · M mutes';
$('ctlText').textContent=CTLTEXT;$('hint').textContent=CTLTEXT;
function startGame(){if(started)return;started=true;$('start').style.display='none';initAudio();IN.jump=false;IN.b=false;IN.y=false;updateHUD();
  setTimeout(()=>showToast('Follow the path. Wake all four Snoozles!'),600);setTimeout(()=>{$('hint').style.opacity=0;},12000);}
$('go').addEventListener('pointerdown',e=>{e.stopPropagation();e.preventDefault();startGame();});
$('start').addEventListener('pointerdown',e=>{startGame();});

