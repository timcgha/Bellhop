const AU={ctx:null,master:null,muted:false,noise:null,layers:0,step:0,next:0,bpm:112,win:false,song:null};
const PENTA=[0,2,4,7,9,12,14,16];
// Level-owned songs: shared sequencer, per-level chords + layer voices.
// Meadow keeps the original Level 1 arrangement note-for-note.
function meadowBed(sib,chord,t){
  if(sib===0||sib===4)tone(70,0.18,{at:t,type:'sine',slide:40,gain:0.35,attack:0.002});
  if(sib%2===0)tone(hz(chord[0],65.41),0.22,{at:t,type:'triangle',gain:0.12,attack:0.01});
  if(sib%2===1)noise(0.04,{at:t,type:'highpass',freq:7000,gain:0.05});
}
function meadowVoice(i,sib,s,chord,t){
  const pats=[[0,3,6],[2,5],[1,4,7],[0,2,4,6]];
  if(pats[i%4].indexOf(sib)<0)return;
  const n=chord[(s+i)%3]+12*(1+(i%2));const f=hz(n,523.25);
  tone(f,0.5,{at:t,type:'sine',gain:0.09,attack:0.003});tone(f*3,0.18,{at:t,type:'sine',gain:0.02,attack:0.003});
}
// The Deep: gentle underwater lullaby — four compatible parts, not four jingles.
function deepBed(sib,chord,t){
  if(sib===0)tone(hz(chord[0],55),0.55,{at:t,type:'sine',gain:0.1,attack:0.04});
  if(sib===4)tone(hz(chord[1],82.41),0.4,{at:t,type:'triangle',gain:0.06,attack:0.03});
  if(sib%4===2)noise(0.08,{at:t,type:'lowpass',freq:900,fslide:400,gain:0.035,attack:0.02});
}
function deepVoice(i,sib,s,chord,t){
  const pats=[[0,4],[1,3,5],[0,2,6],[2,4,7]];
  if(pats[i%4].indexOf(sib)<0)return;
  if(i===0){
    // soft bell / pluck foundation
    const f=hz(chord[sib%3],329.63);
    tone(f,0.55,{at:t,type:'triangle',gain:0.07,attack:0.006});
    tone(f*2,0.22,{at:t,type:'sine',gain:0.025,attack:0.006});
  }else if(i===1){
    // watery arpeggio
    const deg=[0,3,7,12,7,3,5,10][(s+sib)%8];
    const f=hz(chord[0]+deg,196);
    tone(f,0.38,{at:t,type:'sine',gain:0.055,attack:0.012,slide:f*1.03});
  }else if(i===2){
    // warm low harmony
    tone(hz(chord[0],98),0.75,{at:t,type:'triangle',gain:0.075,attack:0.05});
    tone(hz(chord[2],98),0.75,{at:t,type:'sine',gain:0.04,attack:0.05});
  }else{
    // floating upper melody
    const mel=[0,3,7,10,7,5,3,0][s%8];
    const f=hz(chord[0]+mel+24,174.61);
    tone(f,0.7,{at:t,type:'sine',gain:0.05,attack:0.04});
  }
}
const SONGS={
  meadow:{id:'meadow',bpm:112,chords:[[0,4,7],[-3,0,4],[-7,-3,0],[-5,-1,2]],bed:meadowBed,voice:meadowVoice},
  deep:{id:'deep',bpm:84,chords:[[0,3,7],[-2,2,5],[-5,0,3],[2,5,9]],bed:deepBed,voice:deepVoice}
};
AU.song=SONGS.meadow;
// Kept as aliases so older call sites / mental model still match meadow.
const CHORDS=SONGS.meadow.chords;
const LAYER_PAT=[[0,3,6],[2,5],[1,4,7],[0,2,4,6]];
function setSong(name){
  AU.song=SONGS[name]||SONGS.meadow;
  AU.bpm=AU.song.bpm;
}
function chordNow(){const c=AU.song.chords;return c[Math.floor(AU.step/8)%c.length];}
function hz(semi,base){return (base||261.63)*Math.pow(2,semi/12);}
function initAudio(){
  if(AU.ctx){if(AU.ctx.state==='suspended')AU.ctx.resume();return;}
  const C=window.AudioContext||window.webkitAudioContext;if(!C)return;
  const c=new C();AU.ctx=c;
  AU.master=c.createGain();AU.master.gain.value=AU.muted?0:0.6;AU.master.connect(c.destination);
  const len=c.sampleRate*2,buf=c.createBuffer(1,len,c.sampleRate),d=buf.getChannelData(0);
  for(let i=0;i<len;i++)d[i]=Math.random()*2-1;
  AU.noise=buf;AU.next=c.currentTime+0.1;AU.step=0;
  setInterval(schedule,25);
  if(c.state==='suspended')c.resume();
}
function tone(f,dur,o){o=o||{};const c=AU.ctx;if(!c)return;const t=(o.at!=null?o.at:c.currentTime);
  const osc=c.createOscillator(),g=c.createGain();osc.type=o.type||'sine';osc.frequency.setValueAtTime(f,t);
  if(o.slide)osc.frequency.exponentialRampToValueAtTime(o.slide,t+dur);
  const gain=o.gain||0.2,atk=o.attack||0.005;
  g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(gain,t+atk);g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
  osc.connect(g);g.connect(AU.master);osc.start(t);osc.stop(t+dur+0.05);}
function noise(dur,o){o=o||{};const c=AU.ctx;if(!c)return;const t=(o.at!=null?o.at:c.currentTime);
  const s=c.createBufferSource();s.buffer=AU.noise;const f=c.createBiquadFilter();f.type=o.type||'bandpass';
  f.frequency.setValueAtTime(o.freq||1200,t);if(o.fslide)f.frequency.exponentialRampToValueAtTime(o.fslide,t+dur);f.Q.value=o.q||0.8;
  const g=c.createGain();const gain=o.gain||0.15,atk=o.attack||0.005;
  g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(gain,t+atk);g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
  s.connect(f);f.connect(g);g.connect(AU.master);s.start(t);s.stop(t+dur+0.05);}
function schedule(){
  const c=AU.ctx;if(!c||!AU.song)return;const stepDur=60/AU.bpm/2;const song=AU.song;
  while(AU.next<c.currentTime+0.15){
    const t=AU.next,s=AU.step,sib=s%8,chord=song.chords[Math.floor(s/8)%song.chords.length];
    song.bed(sib,chord,t);
    for(let i=0;i<AU.layers;i++)song.voice(i,sib,s,chord,t);
    if(AU.win){if(sib%2===0)tone(hz(chord[(s+2)%3]+24,523.25),0.26,{at:t,type:'sine',gain:0.05,attack:0.003});if(sib===0)noise(0.14,{at:t,type:'highpass',freq:6200,gain:0.05});}
    AU.next+=stepDur;AU.step++;
  }
}
window.__AU=AU;window.__SONGS=SONGS;window.__setSong=setSong;
const SFX={
  jump(){tone(hz(PENTA[Math.floor(Math.random()*4)],523.25),0.12,{type:'triangle',gain:0.12,slide:hz(PENTA[5],523.25)});},
  puff(){const n=chordNow();const f=hz(n[Math.floor(Math.random()*3)]+12,523.25);tone(f,0.35,{type:'sine',gain:0.14,slide:f*1.5,attack:0.01});noise(0.25,{type:'lowpass',freq:1800,fslide:400,gain:0.25});},
  refill(){tone(1400,0.08,{type:'square',gain:0.05,slide:1900});noise(0.12,{type:'bandpass',freq:3000,gain:0.06});},
  land(v){noise(0.09,{type:'lowpass',freq:600,gain:clamp(v/25,0.05,0.35)});},
  step(surf){if(surf==='water'){noise(0.12,{type:'bandpass',freq:1600,fslide:600,gain:0.10});}else if(surf==='wood'){tone(210,0.05,{type:'square',gain:0.03,slide:120});noise(0.04,{type:'lowpass',freq:900,gain:0.06});}else if(surf==='goo'){noise(0.12,{type:'lowpass',freq:500,fslide:150,gain:0.12});tone(150,0.1,{type:'sine',gain:0.05,slide:80});}else if(surf==='stone'){tone(320,0.04,{type:'square',gain:0.03,slide:200});noise(0.03,{type:'highpass',freq:2000,gain:0.05});}else{noise(0.06,{type:'lowpass',freq:500,gain:0.05});}},
  slamCharge(){noise(0.15,{type:'bandpass',freq:400,fslide:2500,gain:0.12});},
  slam(){tone(90,0.25,{type:'sine',slide:35,gain:0.5,attack:0.002});noise(0.3,{type:'lowpass',freq:1200,fslide:200,gain:0.35});},
  gust(){noise(0.4,{type:'bandpass',freq:900,fslide:2200,gain:0.22,q:0.5,attack:0.02});const c=chordNow();tone(hz(c[1],523.25),0.15,{type:'triangle',gain:0.05,slide:hz(c[2],523.25)});},
  bonk(){tone(320,0.09,{type:'square',gain:0.08,slide:150});noise(0.05,{type:'lowpass',freq:1500,gain:0.08});},
  clatter(){noise(0.05,{type:'bandpass',freq:rand(2000,3500),gain:0.08,q:2});tone(rand(500,900),0.06,{type:'square',gain:0.03,slide:300});},
  note(){const n=chordNow();const f=hz(n[Math.floor(Math.random()*3)]+12,523.25);tone(f,0.5,{type:'sine',gain:0.14});tone(f*2,0.25,{type:'sine',gain:0.05});},
  reveal(){const c=chordNow();if(!AU.ctx)return;[0,1,2].forEach(i=>tone(hz(c[i]+12,523.25),0.35,{at:AU.ctx.currentTime+i*0.07,gain:0.1}));},
  wake(){if(!AU.ctx)return;tone(300,0.7,{type:'sine',gain:0.14,slide:620,attack:0.05});setTimeout(()=>{if(!AU.ctx)return;const c=chordNow();[0,1,2,3].forEach(i=>tone(hz(c[i%3]+12*(1+Math.floor(i/3)),523.25),0.6,{at:AU.ctx.currentTime+i*0.09,gain:0.12}));},450);},
  splash(){noise(0.2,{type:'bandpass',freq:1200,fslide:400,gain:0.12});},
  hoverStart(){const c=AU.ctx;if(!c)return null;const t=c.currentTime;const o=c.createOscillator(),g=c.createGain();o.type='triangle';const f=hz(chordNow()[2]+12,523.25);o.frequency.setValueAtTime(f,t);o.frequency.exponentialRampToValueAtTime(f*0.65,t+1.0);g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(0.06,t+0.03);o.connect(g);g.connect(AU.master);o.start(t);noise(1.0,{type:'lowpass',freq:900,fslide:300,gain:0.07,attack:0.03});return {o,g};},
  checkpoint(){if(!AU.ctx)return;const c=AU.ctx.currentTime;tone(784,0.3,{at:c,type:'triangle',gain:0.13});tone(1046,0.45,{at:c+0.11,type:'triangle',gain:0.13});tone(1568,0.3,{at:c+0.11,type:'sine',gain:0.04});},
  fanfare(){if(!AU.ctx)return;const c=AU.ctx.currentTime;[0,4,7,12,16,19,24].forEach((n,i)=>{tone(hz(n,261.63),0.75,{at:c+i*0.12,type:'triangle',gain:0.17});tone(hz(n,261.63)*2,0.4,{at:c+i*0.12,type:'sine',gain:0.06});});noise(1.5,{at:c,type:'highpass',freq:5200,gain:0.07,attack:0.5});},
  spit(){noise(0.12,{type:'bandpass',freq:1500,fslide:400,gain:0.15});tone(500,0.12,{type:'sine',gain:0.06,slide:200});},
  splat(){noise(0.15,{type:'lowpass',freq:800,fslide:200,gain:0.18});tone(180,0.1,{type:'sine',gain:0.08,slide:60});},
  hurt(){tone(400,0.25,{type:'square',gain:0.1,slide:120});noise(0.15,{type:'lowpass',freq:1000,gain:0.1});},
  crate(){noise(0.25,{type:'bandpass',freq:2200,fslide:500,gain:0.22,q:0.7});tone(260,0.14,{type:'square',gain:0.09,slide:90});tone(520,0.1,{type:'square',gain:0.05,slide:180});},
  powerUp(){if(!AU.ctx)return;const c=chordNow();[0,2,4,7,12].forEach((n,i)=>tone(hz(c[0]+n,523.25),0.4,{at:AU.ctx.currentTime+i*0.075,type:'triangle',gain:0.13}));},
  fireSlam(){tone(120,0.5,{type:'sawtooth',gain:0.25,slide:45,attack:0.005});noise(0.6,{type:'bandpass',freq:2600,fslide:400,gain:0.28,q:0.5});},
  jet(){noise(0.22,{type:'bandpass',freq:2300,fslide:900,gain:0.09,q:0.8});tone(880,0.14,{type:'sine',gain:0.04,slide:420});},
  fireOut(){noise(0.5,{type:'lowpass',freq:2200,fslide:300,gain:0.14,attack:0.01});tone(520,0.4,{type:'triangle',gain:0.08,slide:130});},
  fizz(){noise(0.12,{type:'highpass',freq:2600,gain:0.07});tone(900,0.1,{type:'square',gain:0.03,slide:300});},
  spin(){noise(0.3,{type:'bandpass',freq:700,fslide:2600,gain:0.14,q:0.6,attack:0.02});tone(430,0.28,{type:'triangle',gain:0.07,slide:760});},
  blorp(){tone(420,0.18,{type:'sine',gain:0.15,slide:120});noise(0.08,{type:'lowpass',freq:900,gain:0.1});},
  dissolve(){if(!AU.ctx)return;for(let i=0;i<6;i++)tone(rand(500,900)*(1-i*0.1),0.12,{at:AU.ctx.currentTime+i*0.07,type:'sine',gain:0.08,slide:150});noise(0.5,{type:'lowpass',freq:700,fslide:150,gain:0.12});},
  heal(){if(!AU.ctx)return;const c=chordNow();[0,1,2].forEach(i=>tone(hz(c[i]+12,523.25),0.35,{at:AU.ctx.currentTime+i*0.08,gain:0.12}));tone(hz(c[0]+24,523.25),0.5,{at:AU.ctx.currentTime+0.24,gain:0.1});},
  deflate(){tone(600,1.2,{type:'triangle',gain:0.12,slide:90,attack:0.02});noise(1.0,{type:'lowpass',freq:1200,fslide:200,gain:0.12,attack:0.02});},
  hoverStop(h){if(!h||!AU.ctx)return;const t=AU.ctx.currentTime;try{h.g.gain.cancelScheduledValues(t);h.g.gain.setValueAtTime(Math.max(h.g.gain.value,0.0001),t);h.g.gain.exponentialRampToValueAtTime(0.0001,t+0.08);h.o.stop(t+0.1);}catch(e){}},
  tick(){tone(rand(700,1000),0.03,{type:'square',gain:0.02});},
  bubbleShot(){noise(0.18,{type:'bandpass',freq:1400,fslide:900,gain:0.12});tone(620,0.12,{type:'sine',gain:0.08,slide:880});},
  bubbleTrap(){tone(280,0.2,{type:'sine',gain:0.1,slide:420});noise(0.15,{type:'lowpass',freq:1200,gain:0.1});},
  bubblePop(){noise(0.1,{type:'highpass',freq:2000,gain:0.14});tone(880,0.08,{type:'sine',gain:0.06,slide:520});},
  bubblePower(){if(!AU.ctx)return;[0,3,7,12].forEach((n,i)=>tone(hz(n,523.25),0.35,{at:AU.ctx.currentTime+i*0.07,type:'sine',gain:0.11}));},
  bubbleOut(){noise(0.35,{type:'lowpass',freq:1800,fslide:400,gain:0.1});tone(640,0.3,{type:'triangle',gain:0.07,slide:220});},
  lavaYeouch(){noise(0.28,{type:'bandpass',freq:1800,fslide:500,gain:0.2,q:0.6});tone(720,0.22,{type:'square',gain:0.1,slide:180});tone(980,0.18,{type:'sine',gain:0.08,slide:1400});noise(0.2,{type:'highpass',freq:2400,gain:0.08});},
  conchOpen(){if(!AU.ctx)return;const c=AU.ctx.currentTime;tone(220,0.55,{at:c,type:'sine',gain:0.16,slide:440,attack:0.04});[0,4,7,12,16].forEach((n,i)=>tone(hz(n,329.63),0.55,{at:c+0.12+i*0.08,type:'triangle',gain:0.12}));noise(0.45,{at:c,type:'bandpass',freq:900,fslide:1800,gain:0.1,attack:0.05});},
  fishPop(){tone(rand(700,950),0.08,{type:'sine',gain:0.1,slide:400});noise(0.06,{type:'highpass',freq:2500,gain:0.08});},
  sharkPop(){noise(0.2,{type:'lowpass',freq:600,fslide:200,gain:0.15});tone(180,0.15,{type:'sine',gain:0.1,slide:90});},
  sharkBite(){noise(0.12,{type:'bandpass',freq:500,gain:0.18});tone(120,0.1,{type:'square',gain:0.08,slide:70});},
  spikeWarn(){tone(440,0.12,{type:'triangle',gain:0.07,slide:330});tone(330,0.18,{at:AU.ctx?AU.ctx.currentTime+0.1:0,type:'triangle',gain:0.05});},
  spikeTouch(){noise(0.14,{type:'highpass',freq:1800,gain:0.16});tone(200,0.12,{type:'square',gain:0.09,slide:120});}
};
function toggleMute(){AU.muted=!AU.muted;if(AU.master)AU.master.gain.value=AU.muted?0:0.6;$('mute').textContent=AU.muted?'🔇':'🔊';}
$('mute').addEventListener('pointerdown',e=>{e.stopPropagation();e.preventDefault();toggleMute();});

