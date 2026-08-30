#!/usr/bin/env node
// Candy Planet proximity transparency — far opaque, edge translucent, exit opaque.
const puppeteer = require('puppeteer-core');
const { mkdirSync, writeFileSync } = require('fs');
const { join } = require('path');
const { spawn } = require('child_process');

const outDir = join(__dirname, '..', 'artifacts', 'browser-candy-transparency');
mkdirSync(outDir, { recursive: true });
const chrome = '/usr/local/bin/google-chrome';
const port = 8768;
const base = `http://127.0.0.1:${port}/index.html`;

function sleep(ms){return new Promise(r=>setTimeout(r,ms));}

async function main(){
  const server=spawn('python3',['-m','http.server',String(port),'--bind','127.0.0.1'],{cwd:join(__dirname,'..'),stdio:'ignore'});
  await sleep(600);
  const browser=await puppeteer.launch({executablePath:chrome,headless:'new',args:['--no-sandbox','--disable-setuid-sandbox']});
  const logs=[];
  async function runViewport(vp,label){
    const page=await browser.newPage();
    await page.setViewport(vp);
    page.on('pageerror',e=>logs.push(label+':pageerror:'+e.message));
    page.on('console',msg=>{if(msg.type()==='error'){const t=msg.text();if(!/favicon|404|Failed to load resource/i.test(t))logs.push(label+':console:'+t);}});

    await page.goto(base,{waitUntil:'domcontentloaded',timeout:60000});
    await page.waitForFunction(()=>typeof window.__setPickerIdx==='function',{timeout:20000});
    await page.click('#lvl3');await page.click('#lvl3');
    await page.waitForFunction(()=>window.__started&&window.__started(),{timeout:10000});
    await sleep(300);

    const result=await page.evaluate(async()=>{
      const S=window.__SPACE,P=window.__P,cp=S.candyPlanet;
      const r=cp.r,enter=S.CANDY_SHELL_ENTER_PAD,exit=S.CANDY_SHELL_EXIT_PAD;
      const dist=()=>Math.hypot(P.pos.x-cp.x,P.pos.y-cp.y,P.pos.z-cp.z);
      const tick=n=>{for(let i=0;i<n;i++)S.updateCandyPlanetShellFade(0.05);};

      // 1–2. Far approach — opaque
      P.pos.set(72,16,-188);P.vel.set(0,0,0);P.grounded=false;P.moveZone='openSpace';
      for(let i=0;i<40;i++)await new Promise(r=>requestAnimationFrame(r));
      tick(60);
      const farDist=dist(),farFade=S.candyPlanetShellFade,farInside=cp.shellInside;

      // 3–6. Outer shell contact / pad
      const pad=cp.pad;
      P.pos.set(pad.x,pad.y+0.55,pad.z);P.vel.set(0,0,0);P.grounded=true;
      for(let i=0;i<30;i++)await new Promise(r=>requestAnimationFrame(r));
      tick(80);
      const edgeFade=S.candyPlanetShellFade,edgeInside=cp.shellInside,onPad=Math.hypot(P.pos.x-pad.x,P.pos.z-pad.z)<cp.r*0.8;

      // 7–8. Exit — opaque again
      P.pos.set(cp.x+44,cp.y+14,cp.z+40);P.vel.set(0,0,0);P.grounded=false;P.moveZone='openSpace';
      for(let i=0;i<30;i++)await new Promise(r=>requestAnimationFrame(r));
      tick(80);
      const exitFade=S.candyPlanetShellFade,exitInside=cp.shellInside,exitDist=dist();

      // Stage 3 still wired
      const stage3=S.stage3Ends.length,ci=!!S.crystalInterior;

      return{
        version:(document.getElementById('ver')||{}).textContent||'',
        enter,exit,r,
        farDist,farFade,farInside,
        edgeFade,edgeInside,onPad,padY:pad.y,planetY:cp.y,
        exitFade,exitInside,exitDist,
        stage3,ci,
        started:window.__started(),level:window.__LEVEL()&&window.__LEVEL().id
      };
    });

    await page.screenshot({path:join(outDir,label+'-transparency.png')});
    await page.close();
    return result;
  }

  const desktop=await runViewport({width:1280,height:720},'desktop');
  const mobile=await runViewport({width:390,height:844,isMobile:true,hasTouch:true},'mobile');
  await browser.close();server.kill();

  function pass(j){
    return /v47/.test(j.version)
      &&j.farDist>j.r+j.exit&&j.farFade>0.85&&!j.farInside
      &&j.edgeInside&&j.edgeFade<0.55&&j.onPad&&j.padY>j.planetY+0.8
      &&j.exitDist>j.r+j.exit&&!j.exitInside&&j.exitFade>0.85
      &&j.started&&j.level==='level4'&&j.stage3===1&&j.ci;
  }

  const out={
    desktop, mobile,
    desktopPass:pass(desktop), mobilePass:pass(mobile),
    logs
  };
  writeFileSync(join(outDir,'result.json'),JSON.stringify(out,null,2));
  console.log(JSON.stringify({
    desktopPass:out.desktopPass,mobilePass:out.mobilePass,
    desktopVersion:desktop.version,mobileVersion:mobile.version,
    desktopFarFade:desktop.farFade,desktopEdgeFade:desktop.edgeFade,desktopExitFade:desktop.exitFade,
    logs
  },null,2));
  process.exit(out.desktopPass&&out.mobilePass?0:1);
}

main().catch(e=>{console.error(e);process.exit(1);});
