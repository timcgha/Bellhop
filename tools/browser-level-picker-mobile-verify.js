#!/usr/bin/env node
// BH-006 generated-product menu geometry verification using dependency-free CDP.
const {spawn,spawnSync}=require('child_process');
const {createHash}=require('crypto');
const {existsSync,mkdirSync,rmSync,writeFileSync}=require('fs');
const {dirname,join,resolve}=require('path');
const http=require('http');

const root=resolve(__dirname,'..');
const dist=resolve(process.env.BELLHOP_DIST||join(root,'dist'));
const outDir=resolve(process.env.BELLHOP_EVIDENCE_DIR||join(root,'artifacts','browser-level-picker-mobile'));
const label=(process.env.BELLHOP_EVIDENCE_LABEL||'candidate').replace(/[^a-z0-9_-]/gi,'-');
const expectFailure=process.env.BELLHOP_EXPECT==='fail';
const chrome=[process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/local/bin/google-chrome','/usr/bin/chromium','/usr/bin/chromium-browser'].find(p=>p&&existsSync(p));
if(!existsSync(join(dist,'index.html')))throw new Error('generated product missing: '+join(dist,'index.html'));
if(!chrome)throw new Error('Chrome/Chromium executable not found; set CHROME_BIN');
mkdirSync(outDir,{recursive:true});
const port=8900+(process.pid%250),cdpPort=9400+(process.pid%250);
const profile='/tmp/bellhop-bh006-'+process.pid;
const pageUrl='http://127.0.0.1:'+port+'/index.html';
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
function git(args){
  const value=spawnSync('git',args,{cwd:dirname(dist),encoding:'utf8'});
  return value.status===0?value.stdout.trim():null;
}
const report={label,expectFailure,source:{dist,commit:git(['rev-parse','HEAD^{commit}']),tree:git(['rev-parse','HEAD^{tree}']),status:git(['status','--short'])},runtime:{chrome,emulation:'Chrome CDP; no physical device or WebKit'},viewports:[],selectedStates:[],interactions:[],screenshots:[],checks:[],failures:[],status:'RUNNING'};
function check(name,condition,details){
  const item={name,ok:!!condition,details:details===undefined?null:details};
  report.checks.push(item);if(!item.ok)report.failures.push(item);
}
function getJSON(url){
  return new Promise((resolve,reject)=>{
    http.get(url,res=>{let data='';res.on('data',chunk=>data+=chunk);res.on('end',()=>{try{resolve(JSON.parse(data));}catch(error){reject(error);}});}).on('error',reject);
  });
}
async function connect(){
  const pages=await getJSON('http://127.0.0.1:'+cdpPort+'/json/list');
  const page=pages.find(item=>item.type==='page')||pages[0];
  if(!page||!page.webSocketDebuggerUrl)throw new Error('no CDP page target');
  const ws=new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve,reject)=>{
    ws.addEventListener('open',resolve,{once:true});
    ws.addEventListener('error',event=>reject(event.error||event),{once:true});
  });
  let id=0;const pending=new Map();
  ws.addEventListener('message',event=>{
    const message=JSON.parse(typeof event.data==='string'?event.data:event.data.toString());
    if(!message.id||!pending.has(message.id))return;
    const item=pending.get(message.id);pending.delete(message.id);
    if(message.error)item.reject(new Error(JSON.stringify(message.error)));else item.resolve(message.result);
  });
  function send(method,params){
    return new Promise((resolve,reject)=>{
      const messageId=++id;pending.set(messageId,{resolve,reject});
      ws.send(JSON.stringify({id:messageId,method,params:params||{}}));
    });
  }
  async function evaluate(expression){
    const value=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});
    if(value.exceptionDetails)throw new Error(JSON.stringify(value.exceptionDetails));
    return value.result&&value.result.value;
  }
  async function screenshot(name){
    const value=await send('Page.captureScreenshot',{format:'png'});
    const bytes=Buffer.from(value.data,'base64');writeFileSync(join(outDir,name),bytes);
    report.screenshots.push({name,bytes:bytes.length,pixelWidth:bytes.readUInt32BE(16),pixelHeight:bytes.readUInt32BE(20),sha256:createHash('sha256').update(bytes).digest('hex')});
  }
  await send('Page.enable');await send('Runtime.enable');
  return {send,evaluate,screenshot,close(){try{ws.close();}catch(error){}}};
}
async function waitFor(cdp,expression,timeout){
  const started=Date.now();while(Date.now()-started<(timeout||16000)){
    try{if(await cdp.evaluate(expression))return;}catch(error){}
    await sleep(100);
  }
  throw new Error('timeout: '+expression);
}
async function setMetrics(cdp,v){
  const landscape=v.width>v.height;
  await cdp.send('Emulation.setDeviceMetricsOverride',{width:v.width,height:v.height,deviceScaleFactor:v.dpr,mobile:v.touch,screenWidth:v.width,screenHeight:v.height,screenOrientation:{type:landscape?'landscapePrimary':'portraitPrimary',angle:landscape?90:0}});
  await cdp.send('Emulation.setTouchEmulationEnabled',{enabled:v.touch,maxTouchPoints:v.touch?5:1});
}
async function fresh(cdp,v){
  await setMetrics(cdp,v);
  await cdp.send('Page.navigate',{url:pageUrl+'?matrix='+encodeURIComponent(v.name)+'&t='+Date.now()});
  await waitFor(cdp,"document.readyState==='complete'");
  await waitFor(cdp,"typeof __pickerIdx==='function'&&document.getElementById('lvl5')");
  await sleep(180);
}
async function snapshot(cdp){
  return cdp.evaluate("(()=>{const n=x=>Math.round(x*100)/100,r=e=>{const x=e.getBoundingClientRect();return {left:n(x.left),top:n(x.top),right:n(x.right),bottom:n(x.bottom),width:n(x.width),height:n(x.height)}};const cards=[...document.querySelectorAll('#start .lvl-card')].map((e,index)=>{const a=e.querySelector('.lvl-art'),l=e.querySelector('.lvl-label');return {index,id:e.id,name:l.textContent.trim(),card:r(e),art:r(a),label:r(l),selected:e.classList.contains('sel'),pulse:e.classList.contains('pulse'),transform:getComputedStyle(e).transform,artInline:{width:a.style.width,height:a.style.height},pixels:{width:a.width,height:a.height},dataLength:a.toDataURL().length}});const intersections=[];for(let i=0;i<cards.length;i++)for(let j=i+1;j<cards.length;j++){const a=cards[i].card,b=cards[j].card,area=Math.max(0,Math.min(a.right,b.right)-Math.max(a.left,b.left))*Math.max(0,Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top));if(area>.5)intersections.push({a:i,b:j,area:n(area)});}const rows=[];for(const c of cards){let row=rows.find(x=>Math.abs(x.top-c.card.top)<3);if(!row){row={top:c.card.top,indices:[]};rows.push(row);}row.indices.push(c.index);}rows.sort((a,b)=>a.top-b.top);rows.forEach(row=>row.indices.sort((a,b)=>cards[a].card.left-cards[b].card.left));const s=document.getElementById('start'),p=document.querySelector('#start .card'),vv=visualViewport;return {viewport:{width:innerWidth,height:innerHeight,dpr:devicePixelRatio,visualViewport:vv?{width:n(vv.width),height:n(vv.height),scale:vv.scale}:null},start:{...r(s),clientWidth:s.clientWidth,clientHeight:s.clientHeight,scrollWidth:s.scrollWidth,scrollHeight:s.scrollHeight,scrollTop:s.scrollTop},panel:r(p),cards,rows:rows.map(x=>x.indices),intersections,pickerIdx:__pickerIdx(),pickerColumns:typeof __pickerColumns==='function'?__pickerColumns():null,started:__started(),touchArmed:__touchArmed(),loadToken:window.__bh006LoadToken};})()");
}
function within(inner,outer,tolerance){
  const t=tolerance||0;return inner.left>=outer.left-t&&inner.top>=outer.top-t&&inner.right<=outer.right+t&&inner.bottom<=outer.bottom+t;
}
function assess(v,s){
  const prefix=v.name+' initial',names=['Meadow','The Deep','The Peak','Space','Desert','Snowbound'];
  check(prefix+' six levels/order',s.cards.length===6&&s.cards.every((c,i)=>c.name===names[i]),s.cards.map(c=>c.name));
  check(prefix+' responsive art containment',s.cards.every(c=>within(c.art,c.card,1.2)),s.cards.map(c=>({id:c.id,card:c.card,art:c.art,inline:c.artInline})));
  check(prefix+' label containment',s.cards.every(c=>within(c.label,c.card,1.2)));
  check(prefix+' artwork aspect/rendered pixels',s.cards.every(c=>Math.abs(c.art.width/c.art.height-1.6)<.035&&c.dataLength>500),s.cards.map(c=>({id:c.id,art:c.art,pixels:c.pixels,dataLength:c.dataLength})));
  check(prefix+' row-major geometry',s.rows.flat().join(',')==='0,1,2,3,4,5'&&s.pickerColumns===s.rows[0].length,{rows:s.rows,pickerColumns:s.pickerColumns});
  check(prefix+' no card collision',s.intersections.length===0,s.intersections);
  check(prefix+' no sideways overflow',s.start.scrollWidth<=s.start.clientWidth+1,s.start);
  check(prefix+' selected visible',within(s.cards[s.pickerIdx].card,{left:0,top:0,right:v.width,bottom:v.height},2),s.cards[s.pickerIdx].card);
  check(prefix+' touch targets',!v.touch||s.cards.every(c=>c.card.width>=44&&c.card.height>=44));
  if(!v.reduced)check(prefix+' primary panel fits',s.start.scrollHeight<=s.start.clientHeight+1&&within(s.panel,{left:0,top:0,right:v.width,bottom:v.height},2),{start:s.start,panel:s.panel});
}
async function point(cdp,id,selector){
  const expression="(()=>{const h=document.getElementById("+JSON.stringify(id)+"),e="+(selector?"h.querySelector("+JSON.stringify(selector)+")":"h")+";if(!e)return null;e.scrollIntoView({block:'nearest',inline:'nearest'});const r=e.getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2,width:r.width,height:r.height};})()";
  return cdp.evaluate(expression);
}
async function touch(cdp,id,selector){
  const p=await point(cdp,id,selector);if(!p||p.width<1||p.height<1)throw new Error('#'+id+' not touchable');
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:p.x,y:p.y,radiusX:4,radiusY:4,force:1,id:1}]});
  await sleep(55);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await sleep(150);
}
async function mouse(cdp,id){
  const p=await point(cdp,id);if(!p||p.width<1||p.height<1)throw new Error('#'+id+' not clickable');
  await cdp.send('Input.dispatchMouseEvent',{type:'mousePressed',x:p.x,y:p.y,button:'left',clickCount:1});
  await cdp.send('Input.dispatchMouseEvent',{type:'mouseReleased',x:p.x,y:p.y,button:'left',clickCount:1});await sleep(140);
}
const keyMap={ArrowLeft:['ArrowLeft',37],ArrowUp:['ArrowUp',38],ArrowRight:['ArrowRight',39],ArrowDown:['ArrowDown',40],Space:[' ',32],Escape:['Escape',27]};
async function key(cdp,code){
  const data=keyMap[code],text=code==='Space'?' ':undefined;
  await cdp.send('Input.dispatchKeyEvent',{type:'keyDown',key:data[0],code,windowsVirtualKeyCode:data[1],nativeVirtualKeyCode:data[1],text});
  await sleep(55);await cdp.send('Input.dispatchKeyEvent',{type:'keyUp',key:data[0],code,windowsVirtualKeyCode:data[1],nativeVirtualKeyCode:data[1]});await sleep(150);
}
async function gamepad(cdp,index){
  await cdp.evaluate('window.__bh006Gamepad.buttons['+index+'].pressed=true');await sleep(120);
  await cdp.evaluate('window.__bh006Gamepad.buttons['+index+'].pressed=false');await sleep(160);
}
async function verifyVerticalBoundaries(cdp,v,expectedColumns,label,move,activate){
  await fresh(cdp,v);const columns=await cdp.evaluate('__pickerColumns()');
  check(label+' uses displayed column count',columns===expectedColumns,{expected:expectedColumns,actual:columns});
  for(let i=0;i<columns;i++){
    await cdp.evaluate('__setPickerIdx('+i+')');await move('up');
    check(label+' Up holds top-row column '+i,await cdp.evaluate('__pickerIdx()==='+i));
  }
  for(let i=6-columns;i<6;i++){
    await cdp.evaluate('__setPickerIdx('+i+')');await move('down');
    check(label+' Down holds bottom-row column '+(i-(6-columns)),await cdp.evaluate('__pickerIdx()==='+i));
  }
  for(let i=0;i<6-columns;i++){
    await cdp.evaluate('__setPickerIdx('+i+')');await move('down');
    check(label+' valid Down preserves column from '+i,await cdp.evaluate('__pickerIdx()==='+(i+columns)),{columns});
    await move('up');check(label+' valid Up preserves column from '+(i+columns),await cdp.evaluate('__pickerIdx()==='+i),{columns});
  }
  await cdp.evaluate('__setPickerIdx('+(5-columns)+')');await move('down');await activate();
  await waitFor(cdp,"__started()&&__LEVEL().id==='level6'",7000);
  check(label+' vertical move retains activation mapping',true,{level:'level6'});
}
async function pauseToMenu(cdp,touchMode){
  if(touchMode)await touch(cdp,'pauseBtn');else await key(cdp,'Escape');
  await waitFor(cdp,"__paused()&&getComputedStyle(document.getElementById('pauseOverlay')).display==='flex'",5000);
  if(touchMode)await touch(cdp,'pauseMenu');else await mouse(cdp,'pauseMenu');
  await waitFor(cdp,"!__started()&&!__paused()&&getComputedStyle(document.getElementById('start')).display==='flex'",5000);
}
async function scenario(name,run){
  try{await run();report.interactions.push({name,status:'PASS'});}
  catch(error){check(name,false,error&&error.stack||String(error));report.interactions.push({name,status:'FAIL',error:error.message});}
}
async function main(){
  rmSync(profile,{recursive:true,force:true});let chromeError='';
  const server=spawn('python3',['-m','http.server',String(port),'--bind','127.0.0.1'],{cwd:dist,stdio:'ignore'});
  const browser=spawn(chrome,['--headless=new','--remote-debugging-address=127.0.0.1','--remote-debugging-port='+cdpPort,'--user-data-dir='+profile,'--no-sandbox','--disable-dev-shm-usage','--no-first-run','--no-default-browser-check','--disable-background-networking','--enable-webgl','--ignore-gpu-blocklist','--use-angle=swiftshader','about:blank'],{stdio:['ignore','ignore','pipe']});
  if(browser.stderr)browser.stderr.on('data',data=>chromeError=(chromeError+data.toString()).slice(-10000));
  let cdp;
  try{
    let version=null;for(let i=0;i<90&&!version;i++){if(browser.exitCode!==null)throw new Error('Chrome exited '+browser.exitCode+': '+chromeError);try{version=await getJSON('http://127.0.0.1:'+cdpPort+'/json/version');}catch(error){await sleep(200);}}
    if(!version)throw new Error('Chrome CDP did not become ready: '+chromeError);
    report.runtime.protocol=version;cdp=await connect();
    await cdp.send('Page.addScriptToEvaluateOnNewDocument',{source:"(()=>{window.__bh006LoadToken=Math.random().toString(36).slice(2);const buttons=Array.from({length:18},()=>({pressed:false,touched:false,value:0}));window.__bh006Gamepad={id:'BH-006 virtual standard gamepad',index:0,connected:true,mapping:'standard',timestamp:0,axes:[0,0,0,0],buttons};Object.defineProperty(navigator,'getGamepads',{configurable:true,value:()=>[window.__bh006Gamepad]});})();"});
    const matrix=[
      {name:'844x390',width:844,height:390,dpr:2,touch:true},
      {name:'932x430',width:932,height:430,dpr:2,touch:true},
      {name:'667x375',width:667,height:375,dpr:2,touch:true},
      {name:'740x280-reduced',width:740,height:280,dpr:2,touch:true,reduced:true},
      {name:'390x844',width:390,height:844,dpr:2,touch:true},
      {name:'1280x720',width:1280,height:720,dpr:1,touch:false}
    ];
    for(const v of matrix){await fresh(cdp,v);const s=await snapshot(cdp);report.viewports.push({requested:v,observed:s.viewport,start:s.start,panel:s.panel,rows:s.rows});assess(v,s);await cdp.screenshot(label+'-'+v.name+'-initial.png');}
    const phone=matrix[0];
    await scenario('six selected states and material pulse',async()=>{
      await fresh(cdp,phone);
      for(let i=0;i<6;i++){
        await cdp.evaluate('__setPickerIdx('+i+')');await sleep(430);
        const s=await snapshot(cdp),card=s.cards[i],visible=within(card.card,{left:0,top:0,right:phone.width,bottom:phone.height},2);
        check('selected '+(i+1)+' unique and visible',s.cards.filter(x=>x.selected).length===1&&card.selected&&visible,{card:card.card,rows:s.rows});
        check('selected '+(i+1)+' does not collide',s.intersections.length===0,s.intersections);
        report.selectedStates.push({index:i,name:card.name,visible,card:card.card,rows:s.rows});
      }
      await cdp.evaluate('__setPickerIdx(0)');await sleep(430);await cdp.evaluate('__setPickerIdx(1)');await sleep(145);
      const pulse=await snapshot(cdp),selected=pulse.cards[1];
      check('material pulse frame rendered',selected.pulse&&selected.transform!=='none'&&selected.transform!=='matrix(1, 0, 0, 1, 0, 0)',{pulse:selected.pulse,transform:selected.transform});
      check('pulse frame does not collide',pulse.intersections.length===0,pulse.intersections);
      await cdp.screenshot(label+'-844x390-selected-pulse.png');
    });
    for(let i=0;i<6;i++)await scenario('touch level '+(i+1)+' select/activate/return',async()=>{
      await fresh(cdp,phone);await touch(cdp,'lvl'+i,'.lvl-art');
      check('touch level '+(i+1)+' first coordinate selects only',await cdp.evaluate('__pickerIdx()==='+i+'&&__touchArmed()&&!__started()'));
      await touch(cdp,'lvl'+i,'.lvl-label');await waitFor(cdp,"__started()&&__LEVEL().id==='level"+(i+1)+"'",8000);
      check('touch level '+(i+1)+' second coordinate launches mapping',true,{level:'level'+(i+1)});
      const controls=await cdp.evaluate("(()=>{const e=document.getElementById('pauseBtn'),r=e.getBoundingClientRect();return {display:getComputedStyle(e).display,left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height}})()");
      check('touch level '+(i+1)+' pause control visible/in bounds',controls.display!=='none'&&controls.width>=44&&controls.height>=44&&controls.left>=0&&controls.top>=0&&controls.right<=phone.width&&controls.bottom<=phone.height,controls);
      await pauseToMenu(cdp,true);check('touch level '+(i+1)+' main-menu return preserves selection',await cdp.evaluate('!__started()&&__pickerIdx()==='+i+'&&!__touchArmed()'));
    });
    await scenario('keyboard displayed-grid navigation and activation',async()=>{
      const desktop=matrix[5];await fresh(cdp,desktop);const columns=await cdp.evaluate('__pickerColumns()');
      await key(cdp,'ArrowRight');check('keyboard right follows order',await cdp.evaluate('__pickerIdx()===1'),{columns});
      await key(cdp,'ArrowDown');let index=await cdp.evaluate('__pickerIdx()');check('keyboard down follows displayed column',index===1+columns,{columns,index});
      await key(cdp,'ArrowLeft');index=await cdp.evaluate('__pickerIdx()');check('keyboard left follows order',index===columns,{columns,index});
      await key(cdp,'ArrowUp');check('keyboard up follows displayed column',await cdp.evaluate('__pickerIdx()===0'),{columns});
      await key(cdp,'Space');await waitFor(cdp,"__started()&&__LEVEL().id==='level1'",7000);await pauseToMenu(cdp,false);
    });
    await scenario('Gamepad API displayed-grid navigation and activation',async()=>{
      await fresh(cdp,phone);const columns=await cdp.evaluate('__pickerColumns()');
      await gamepad(cdp,15);check('gamepad right follows order',await cdp.evaluate('__pickerIdx()===1'),{columns});
      await gamepad(cdp,13);check('gamepad down follows displayed column',await cdp.evaluate('__pickerIdx()==='+(1+columns)),{columns});
      await gamepad(cdp,14);check('gamepad left follows order',await cdp.evaluate('__pickerIdx()==='+columns),{columns});
      await gamepad(cdp,12);check('gamepad up follows displayed column',await cdp.evaluate('__pickerIdx()===0'),{columns});
      await gamepad(cdp,0);await waitFor(cdp,"__started()&&__LEVEL().id==='level1'",7000);await pauseToMenu(cdp,true);
    });
    const portrait=matrix[4];
    await scenario('keyboard three-column vertical boundaries',()=>verifyVerticalBoundaries(cdp,phone,3,'three-column landscape keyboard',direction=>key(cdp,direction==='up'?'ArrowUp':'ArrowDown'),()=>key(cdp,'Space')));
    await scenario('keyboard two-column vertical boundaries',()=>verifyVerticalBoundaries(cdp,portrait,2,'two-column portrait keyboard',direction=>key(cdp,direction==='up'?'ArrowUp':'ArrowDown'),()=>key(cdp,'Space')));
    await scenario('Gamepad three-column vertical boundaries',()=>verifyVerticalBoundaries(cdp,phone,3,'three-column landscape Gamepad',direction=>gamepad(cdp,direction==='up'?12:13),()=>gamepad(cdp,0)));
    await scenario('Gamepad two-column vertical boundaries',()=>verifyVerticalBoundaries(cdp,portrait,2,'two-column portrait Gamepad',direction=>gamepad(cdp,direction==='up'?12:13),()=>gamepad(cdp,0)));
    await scenario('Skins confirmation/cancellation/persistence and sound control',async()=>{
      await fresh(cdp,phone);check('seven skin choices present',await cdp.evaluate("document.querySelectorAll('.skin-card').length===7"));
      await mouse(cdp,'skinsOpen');await waitFor(cdp,'__SKINS().open');await mouse(cdp,'skin-red');await mouse(cdp,'skinUse');
      check('skin confirmation equips',await cdp.evaluate("__SKINS().equipped==='red'"));
      await mouse(cdp,'skinsOpen');await mouse(cdp,'skin-blue');await mouse(cdp,'skinBack');
      check('skin cancellation preserves equipped choice',await cdp.evaluate("!__SKINS().open&&__SKINS().equipped==='red'"));
      await cdp.send('Page.reload',{ignoreCache:true});await waitFor(cdp,"typeof __SKINS==='function'&&document.getElementById('lvl5')");
      check('equipped skin persists across reload',await cdp.evaluate("__SKINS().equipped==='red'"));
      const soundBefore=await cdp.evaluate("({muted:__AU.muted,text:document.getElementById('mute').textContent})");await mouse(cdp,'mute');
      const soundAfter=await cdp.evaluate("({muted:__AU.muted,text:document.getElementById('mute').textContent})");
      check('sound menu control toggles visibly',soundBefore.muted!==soundAfter.muted&&soundBefore.text!==soundAfter.text,{before:soundBefore,after:soundAfter});await mouse(cdp,'mute');
      await mouse(cdp,'skinsOpen');await mouse(cdp,'skin-classic');await mouse(cdp,'skinUse');
    });
    await scenario('no-reload portrait landscape portrait',async()=>{
      const portrait=matrix[4];await fresh(cdp,portrait);await cdp.evaluate('__setPickerIdx(4)');await sleep(430);const before=await snapshot(cdp);
      await setMetrics(cdp,phone);await cdp.evaluate("dispatchEvent(new Event('resize'));dispatchEvent(new Event('orientationchange'))");await sleep(430);const landscape=await snapshot(cdp);assess(phone,landscape);
      await setMetrics(cdp,portrait);await cdp.evaluate("dispatchEvent(new Event('resize'));dispatchEvent(new Event('orientationchange'))");await sleep(430);const after=await snapshot(cdp);assess(portrait,after);
      check('orientation does not reload/launch/lose selection',before.loadToken===landscape.loadToken&&before.loadToken===after.loadToken&&after.pickerIdx===4&&!after.started,{before:before.loadToken,landscape:landscape.loadToken,after:after.loadToken,index:after.pickerIdx});
      await cdp.screenshot(label+'-portrait-landscape-portrait-final.png');
    });
    await scenario('reduced usable height touch scroll and selection visibility',async()=>{
      const reduced=matrix[3];await fresh(cdp,reduced);await cdp.evaluate('__setPickerIdx(5)');await sleep(430);const selected=await snapshot(cdp);
      check('reduced-height selected card visible',within(selected.cards[5].card,{left:0,top:0,right:reduced.width,bottom:reduced.height},2),{start:selected.start,card:selected.cards[5].card});
      if(selected.start.scrollHeight>selected.start.clientHeight+1){
        const x=selected.panel.left+90,y0=reduced.height-24,y1=54;
        await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y:y0,radiusX:5,radiusY:5,force:1,id:7}]});
        for(let step=1;step<=5;step++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:y0+(y1-y0)*step/5,radiusX:5,radiusY:5,force:1,id:7}]});await sleep(45);}
        await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await sleep(430);
        const scrollTop=await cdp.evaluate("document.getElementById('start').scrollTop");check('reduced-height touch scroll works',scrollTop>0,{scrollTop});
      }else check('reduced-height menu fits without scroll',true,selected.start);
      await cdp.screenshot(label+'-740x280-selected-scroll.png');
    });
  }finally{
    if(cdp)cdp.close();try{browser.kill('SIGKILL');}catch(error){}try{server.kill('SIGKILL');}catch(error){}
    await sleep(200);rmSync(profile,{recursive:true,force:true,maxRetries:3,retryDelay:100});
  }
  report.status=report.failures.length?(expectFailure?'EXPECTED_FAILURE':'FAIL'):(expectFailure?'UNEXPECTED_PASS':'PASS');
  writeFileSync(join(outDir,label+'-report.json'),JSON.stringify(report,null,2));
  console.log('BH006_BROWSER_VERIFY='+report.status);
  console.log(JSON.stringify({label:report.label,status:report.status,checks:report.checks.length,failures:report.failures.map(x=>x.name),screenshots:report.screenshots},null,2));
  if(report.status==='FAIL'||report.status==='UNEXPECTED_PASS')process.exit(1);
}
main().catch(error=>{
  report.status='ERROR';report.failures.push({name:'fatal',ok:false,details:error&&error.stack||String(error)});
  try{writeFileSync(join(outDir,label+'-report.json'),JSON.stringify(report,null,2));}catch(writeError){}
  console.error('BH006_BROWSER_VERIFY=ERROR');console.error(error&&error.stack||error);process.exit(1);
});
