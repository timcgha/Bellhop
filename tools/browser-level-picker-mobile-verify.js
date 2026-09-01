#!/usr/bin/env node
// Mobile level-picker layout verification at 390x844 portrait and 844x390 landscape.
const puppeteer = require('puppeteer-core');
const { mkdirSync, writeFileSync } = require('fs');
const { join } = require('path');
const { spawn } = require('child_process');

const outDir = join(__dirname, '..', 'artifacts', 'browser-level-picker-mobile');
mkdirSync(outDir, { recursive: true });
const chrome = '/usr/local/bin/google-chrome';
const port = 8777;
const base = `http://127.0.0.1:${port}/index.html`;

function sleep(ms){return new Promise(r=>setTimeout(r,ms));}

async function measurePicker(page){
  return page.evaluate(()=>{
    const start=document.getElementById('start');
    const card=start&&start.querySelector('.card');
    const badge=start&&start.querySelector('.radio-badge');
    const bA=document.getElementById('bA');
    const bB=document.getElementById('bB');
    const bY=document.getElementById('bY');
    const r=(el)=>el?el.getBoundingClientRect():null;
    const sr=r(start), cr=r(card), br=r(badge);
    const btnRects=[bA,bB,bY].map(r).filter(Boolean);
    const btnVisible=(el)=>!!el&&getComputedStyle(el).display!=='none';
    const obscures=(a,b)=>{
      if(!a||!b)return false;
      const x=Math.max(a.left,b.left), y=Math.max(a.top,b.top);
      const x2=Math.min(a.right,b.right), y2=Math.min(a.bottom,b.bottom);
      return x2>x&&y2>y;
    };
    const critical=[cr,br].filter(Boolean);
    const btnOverlap=critical.some(c=>btnRects.some(b=>obscures(b,c)));
    const cardTopVisible=!!cr&&cr.top>=-2;
    const cardBottomReachable=!!cr&&cr.bottom<=((start&&start.clientHeight)||innerHeight)+2;
    const badgeVisible=!!br&&br.top>=0&&br.bottom<=innerHeight+2;
    const scrollRoom=!!start&&start.scrollHeight>start.clientHeight+1;
    let scrollWorks=true;
    if(scrollRoom&&start){
      start.scrollTop=9999;
      scrollWorks=start.scrollTop>0;
      start.scrollTop=0;
    }
    return {
      viewport:{w:innerWidth,h:innerHeight},
      card:{top:cr&&cr.top,bottom:cr&&cr.bottom,height:cr&&cr.height},
      badge:{top:br&&br.top,bottom:br&&br.bottom,text:badge&&badge.textContent},
      start:{clientH:start&&start.clientHeight,scrollH:start&&start.scrollHeight,scrollTop:start&&start.scrollTop},
      touchButtonsVisible:btnVisible(bA)||btnVisible(bB)||btnVisible(bY),
      playing:document.body.classList.contains('playing'),
      portraitFullPickerReachable:cardTopVisible&&(cardBottomReachable||scrollWorks),
      portraitScrollWorks:scrollWorks||!scrollRoom,
      portraitCriticalContentObscured:btnOverlap,
      landscapeFullPickerReachable:cardTopVisible&&(badgeVisible||scrollWorks),
      landscapeScrollOrFitWorks:scrollWorks||!scrollRoom,
      landscapeCriticalContentObscured:btnOverlap
    };
  });
}

async function verifyViewport(page, width, height, label){
  await page.setViewport({width,height,deviceScaleFactor:2,isMobile:true,hasTouch:true});
  await page.evaluate(()=>document.body.classList.add('touch'));
  await page.reload({waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForFunction(()=>typeof window.__setPickerIdx==='function',{timeout:20000});
  await sleep(200);
  const m=await measurePicker(page);
  await page.screenshot({path:join(outDir,`${label}.png`),fullPage:false});
  return {label,...m};
}

async function main(){
  const server=spawn('python3',['-m','http.server',String(port),'--bind','127.0.0.1'],{
    cwd:join(__dirname,'..'),stdio:'ignore'
  });
  await sleep(500);
  const browser=await puppeteer.launch({
    executablePath:chrome,
    headless:'new',
    args:['--no-sandbox','--disable-setuid-sandbox']
  });
  const page=await browser.newPage();
  await page.goto(base,{waitUntil:'domcontentloaded',timeout:60000});
  const portrait=await verifyViewport(page,390,844,'portrait-390x844');
  const landscape=await verifyViewport(page,844,390,'landscape-844x390');

  // Gameplay controls still appear after start
  await page.tap('#lvl0');
  await page.tap('#lvl0');
  await page.waitForFunction(()=>window.__started&&window.__started(),{timeout:10000});
  const gameplay=await page.evaluate(()=>{
    const vis=(id)=>{const el=document.getElementById(id);return !!el&&getComputedStyle(el).display!=='none';};
    return {
      playing:document.body.classList.contains('playing'),
      touchButtonsVisible:vis('bA')||vis('bB')||vis('bY')
    };
  });

  await browser.close();
  server.kill();

  const report={
    portrait,
    landscape,
    gameplay,
    checks:{
      PORTRAIT_FULL_PICKER_REACHABLE:portrait.portraitFullPickerReachable,
      PORTRAIT_SCROLL_WORKS:portrait.portraitScrollWorks,
      PORTRAIT_CRITICAL_CONTENT_OBSCURED:portrait.portraitCriticalContentObscured,
      LANDSCAPE_FULL_PICKER_REACHABLE:landscape.landscapeFullPickerReachable,
      LANDSCAPE_SCROLL_OR_FIT_WORKS:landscape.landscapeScrollOrFitWorks,
      LANDSCAPE_CRITICAL_CONTENT_OBSCURED:landscape.landscapeCriticalContentObscured,
      GAMEPLAY_TOUCH_CONTROLS_PRESERVED:gameplay.playing&&gameplay.touchButtonsVisible,
      RADIO_V2_PRESENT:portrait.badge&&portrait.badge.text==='Radio v2'
    }
  };
  writeFileSync(join(outDir,'report.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify(report.checks,null,2));
  const inverted=new Set(['PORTRAIT_CRITICAL_CONTENT_OBSCURED','LANDSCAPE_CRITICAL_CONTENT_OBSCURED']);
  const failed=Object.entries(report.checks).filter(([k,v])=>inverted.has(k)?v:!v);
  if(failed.length){
    console.error('FAILED:',failed.map(([k])=>k).join(', '));
    process.exit(1);
  }
  console.log('all mobile picker checks passed');
}

main().catch(e=>{console.error(e);process.exit(1);});
