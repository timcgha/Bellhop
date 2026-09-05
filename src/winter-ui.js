// Small Level 6 UI integration, loaded after hud.js so shared UI functions already exist.
const _winterBaseTouchLabels=updateTouchLabels;
updateTouchLabels=function(){
  _winterBaseTouchLabels();if(!isWinterLevel())return;const lbl=$('bBLbl');if(!lbl)return;
  if(P.sled)lbl.textContent=P.sled.phase==='bottom'?'hop off':'sled';
  else if(WINTER&&WINTER.snowballUnlocked)lbl.textContent='snowball';
  else lbl.textContent='gust';
};
const _winterBaseStartGame=startGame;
startGame=function(){
  if(pickerIdx!==5)return _winterBaseStartGame();
  if(started)return;loadLevel(LEVELS[pickerIdx]);started=true;document.body.classList.add('playing');$('start').style.display='none';initAudio();IN.jump=false;IN.b=false;IN.y=false;updateHUD();
  setTimeout(()=>showToast('Find the snowflake, wake every Snoozle, and ride the sled to the Christmas tree!'),600);setTimeout(()=>{$('hint').style.opacity=0;},12000);
};
window.__startGame=startGame;
