// Rapid pause audio transitions must settle to the latest requested state.
let failures=0;
function ok(cond,msg){if(!cond)failures++;console.log((cond?'PASS ':'FAIL ')+msg);}
function report(){if(failures){console.log(`\n${failures} FAILED`);process.exit(1);}console.log('\nall passed');}

class DeferredAudioContext{
  constructor(){this.state='running';this.currentTime=0;this.sampleRate=8;this.destination={};this.suspendCalls=0;this.resumeCalls=0;this.pendingSuspend=[];this.pendingResume=[];}
  param(value=0){return {value,setValueAtTime(v){this.value=v;},exponentialRampToValueAtTime(v){this.value=v;},cancelScheduledValues(){}};}
  node(){return {connect(){},start(){},stop(){if(this.onended)this.onended();},onended:null};}
  createGain(){return {gain:this.param(),connect(){}};}
  createBuffer(){return {getChannelData(){return new Float32Array(16);}};}
  createBufferSource(){return Object.assign(this.node(),{buffer:null});}
  createOscillator(){return Object.assign(this.node(),{type:'sine',frequency:this.param()});}
  createBiquadFilter(){return {type:'bandpass',frequency:this.param(),Q:{value:0},connect(){}};}
  suspend(){this.suspendCalls++;return new Promise(resolve=>this.pendingSuspend.push(()=>{this.state='suspended';resolve();}));}
  resume(){this.resumeCalls++;return new Promise(resolve=>this.pendingResume.push(()=>{this.state='running';resolve();}));}
  resolveSuspend(){const f=this.pendingSuspend.shift();if(f)f();}
  resolveResume(){const f=this.pendingResume.shift();if(f)f();}
}
const flush=()=>new Promise(resolve=>setImmediate(resolve));

(async()=>{
  const H=require('./harness.js')({level:0,AudioContext:DeferredAudioContext});
  const AU=H.AU(),ctx=AU.ctx;
  ok(ctx&&ctx.state==='running','fake AudioContext starts running');

  H.window.__pauseGame();await flush();
  ok(ctx.suspendCalls===1&&ctx.state==='running','pause begins an asynchronous suspend');
  H.window.__resumeGame();
  ctx.resolveSuspend();await flush();
  ok(ctx.resumeCalls===1,'rapid resume is issued after the pending suspend settles');
  ctx.resolveResume();await AU.audioTransition;
  ok(ctx.state==='running'&&!AU.wantSuspended&&!H.window.__paused(),'rapid pause/resume settles with gameplay audio running');

  H.window.__pauseGame();await flush();
  ok(ctx.suspendCalls===2,'a later pause starts another suspend');
  H.window.__exitLevel();H.startLevel(1);
  ctx.resolveSuspend();await flush();
  ok(ctx.resumeCalls===2,'exit and immediate restart resume after the pending suspend');
  ctx.resolveResume();await AU.audioTransition;
  ok(ctx.state==='running'&&AU.active&&!AU.wantSuspended,'pause/exit/restart settles with the new level audio active');
  ok(H.isStarted()&&H.getLevel().id==='level2','pause/exit/restart keeps the newly started level active');
  report();
})().catch(e=>{console.error(e);process.exit(1);});
