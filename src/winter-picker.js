// Level 6 picker card is installed before hud.js binds the shared LEVELS listeners.
(function installWinterPicker(){
  const pick=document.querySelector('#start .level-pick');if(!pick||document.getElementById('lvl5'))return;
  const card=document.createElement('div');card.className='lvl-card';card.id='lvl5';
  const cv=document.createElement('canvas');cv.className='lvl-art';cv.id='art5';cv.width=160;cv.height=100;
  const label=document.createElement('span');label.className='lvl-label';label.textContent='Snowbound';
  card.appendChild(cv);card.appendChild(label);pick.appendChild(card);
  const g=cv.getContext&&cv.getContext('2d');if(!g)return;
  const w=160,h=100,sky=g.createLinearGradient(0,0,0,h);sky.addColorStop(0,'#86c9e7');sky.addColorStop(1,'#eaf8ff');g.fillStyle=sky;g.fillRect(0,0,w,h);
  g.fillStyle='#f5fcff';g.fillRect(0,58,w,42);g.fillStyle='#d8eef8';g.beginPath();g.moveTo(0,74);g.lineTo(58,32);g.lineTo(112,74);g.closePath();g.fill();
  // Snowy fir.
  g.fillStyle='#286848';g.beginPath();g.moveTo(121,22);g.lineTo(96,72);g.lineTo(146,72);g.closePath();g.fill();g.fillStyle='#fff';g.beginPath();g.moveTo(121,22);g.lineTo(108,48);g.lineTo(133,48);g.closePath();g.fill();
  // Red sled.
  g.fillStyle='#c93644';g.fillRect(54,70,30,7);g.strokeStyle='#7c8790';g.lineWidth=3;g.beginPath();g.moveTo(50,82);g.lineTo(88,82);g.quadraticCurveTo(94,82,94,76);g.stroke();
  // Snowman.
  g.fillStyle='#fff';g.beginPath();g.arc(28,70,12,0,TAU);g.fill();g.beginPath();g.arc(28,52,9,0,TAU);g.fill();g.fillStyle='#ef7f23';g.fillRect(28,51,10,3);
  // Star / lights hint at the finale.
  g.fillStyle='#ffd84d';g.beginPath();g.arc(121,17,4,0,TAU);g.fill();for(let i=0;i<7;i++){g.fillStyle=i%2?'#ff5266':'#5ed7ff';g.beginPath();g.arc(108+(i%3)*12,49+Math.floor(i/3)*10,2.3,0,TAU);g.fill();}
})();
