#!/usr/bin/env node
const fs=require('fs');

function replaceOnce(path,oldText,newText,label){
  let s=fs.readFileSync(path,'utf8');
  if(s.includes(newText)){console.log(label+'=ALREADY_APPLIED');return false;}
  if(!s.includes(oldText))throw new Error(label+' needle missing in '+path);
  s=s.replace(oldText,newText);
  fs.writeFileSync(path,s);
  console.log(label+'=APPLIED');
  return true;
}

replaceOnce(
  'levels/level5.js',
  "tower:{tx:0,tz:0},snoozleHomes:[],snoozles:[],snoozleGoal:0,",
  `tower:{tx:0,tz:0},\nsnoozleGoal:4,\nsnoozleHomes:[\n  {x:6,y:0,z:-2},\n  {x:14,y:0,z:-123},\n  {x:-14,y:0,z:-364},\n  {x:2,y:0,z:-724}\n],\nsnoozles:[\n  [5,0,-2,0,false],\n  [13,0,-123,1,false],\n  [-13,0,-364,2,false],\n  [2,0,-724,3,false]\n],`,
  'LEVEL5_SNOOZLES'
);

replaceOnce(
  'src/desert.js',
  "const g=buildCamel();g.position.set(x,y,z);desertGroup.add(g);const c={g,x,y,z,home:{x,y,z},rideable:rideable!==false,mounted:false,postMountT:0,ph:rand(0,TAU)};camels.push(c);return c;",
  "const g=buildCamel();g.position.set(x,y,z);desertGroup.add(g);const c={g,x,y,z,home:{x,y,z},rideable:rideable!==false,mounted:false,postMountT:0,ph:rand(0,TAU),vy:0,airborne:false,grounded:true};camels.push(c);return c;",
  'CAMEL_VERTICAL_STATE'
);
replaceOnce(
  'src/desert.js',
  "let best=null,bd=2.35;for(const c of camels){if(!c.rideable||c.mounted)continue;const d=Math.hypot(P.pos.x-c.x,P.pos.z-c.z);if(d<bd){best=c;bd=d;}}",
  "let best=null,bd=2.35;for(const c of camels){if(!c.rideable||c.mounted||c.airborne)continue;const d=Math.hypot(P.pos.x-c.x,P.pos.z-c.z);if(d<bd){best=c;bd=d;}}",
  'CAMEL_NO_AIR_REMOUNT'
);
replaceOnce(
  'src/desert.js',
  "c.mounted=true;c.postMountT=0;P.camel=c;P.vel.set(0,0,0);P.puffAir=0;endHover();clearLeapBoost();clearGlide();",
  "c.mounted=true;c.postMountT=0;c.airborne=false;c.grounded=false;c.vy=0;P.camel=c;P.vel.set(0,0,0);P.puffAir=0;endHover();clearLeapBoost();clearGlide();",
  'CAMEL_MOUNT_RESET'
);
replaceOnce(
  'src/desert.js',
  "if(!P||!P.camel)return false;const c=P.camel;c.mounted=false;c.postMountT=0;c.x=P.pos.x+0.85;c.y=P.pos.y;c.z=P.pos.z;c.g.position.set(c.x,c.y,c.z);P.camel=null;",
  "if(!P||!P.camel)return false;const c=P.camel;c.mounted=false;c.postMountT=0;c.x=P.pos.x+0.85;c.y=P.pos.y;c.z=P.pos.z;const ground=surfaceHeightAt(c.x,c.z,c.y+0.65,0.3);c.airborne=!P.grounded&&c.y>ground+0.08;c.grounded=!c.airborne;c.vy=c.airborne?P.vel.y:0;if(!c.airborne)c.y=ground;c.g.position.set(c.x,c.y,c.z);P.camel=null;",
  'CAMEL_DISMOUNT_INHERITS_VERTICAL_STATE'
);
replaceOnce(
  'src/desert.js',
  `function updateCamels(dt){\n  for(const c of camels){c.postMountT=Math.max(0,c.postMountT-dt);const bob=Math.sin(time*5+c.ph)*0.055;\n    if(c.mounted){c.x=P.pos.x;c.y=P.pos.y;c.z=P.pos.z;c.g.position.set(c.x,c.y+bob,c.z);c.g.rotation.y=P.yaw;}\n    else{c.g.position.set(c.x,c.y+bob,c.z);c.g.rotation.y=Math.sin(time*0.5+c.ph)*0.12;}\n    if(c.g.userData&&c.g.userData.neck)c.g.userData.neck.rotation.z=Math.sin(time*2.1+c.ph)*0.055;\n  }\n}`,
  `function updateCamels(dt){\n  for(const c of camels){c.postMountT=Math.max(0,c.postMountT-dt);const bob=Math.sin(time*5+c.ph)*0.055;\n    if(c.mounted){c.x=P.pos.x;c.y=P.pos.y;c.z=P.pos.z;c.vy=P.vel.y;c.airborne=!P.grounded;c.grounded=P.grounded;c.g.position.set(c.x,c.y+bob,c.z);c.g.rotation.y=P.yaw;}\n    else{\n      if(c.airborne){\n        const ground=surfaceHeightAt(c.x,c.z,c.y+0.65,0.3);c.vy=Math.max(MAXFALL,c.vy+GRAV*dt);const ny=c.y+c.vy*dt;\n        if(c.vy<=0&&ny<=ground){c.y=ground;c.vy=0;c.airborne=false;c.grounded=true;}else{c.y=ny;c.grounded=false;}\n      }\n      c.g.position.set(c.x,c.y+(c.airborne?0:bob),c.z);c.g.rotation.y=Math.sin(time*0.5+c.ph)*0.12;\n    }\n    if(c.g.userData&&c.g.userData.neck)c.g.userData.neck.rotation.z=Math.sin(time*2.1+c.ph)*0.055;\n  }\n}`,
  'CAMEL_AIRBORNE_GRAVITY'
);
replaceOnce(
  'src/desert.js',
  "function beginQuicksandRecovery(){\n  if(P.quicksandRecT>0||P.dead||won)return false;dismountCamel(true);P.hp--;P.inv=1.4;P.quicksandRecMax=0.62;P.quicksandRecT=P.quicksandRecMax;P.quicksandRecFrom.copy(P.pos);P.vel.set(0,0,0);P.grounded=false;P.puffAir=0;endHover();clearLeapBoost();clearGlide();P.anchorSettleT=0;",
  "function beginQuicksandRecovery(message){\n  if(P.quicksandRecT>0||P.dead||won)return false;dismountCamel(true);P.hp--;P.inv=1.4;P.quicksandRecMax=0.62;P.quicksandRecT=P.quicksandRecMax;P.quicksandRecFrom.copy(P.pos);P.vel.set(0,0,0);P.grounded=false;P.puffAir=0;endHover();clearLeapBoost();clearGlide();P.anchorSettleT=0;",
  'QUICKSAND_MESSAGE_PARAM'
);
replaceOnce(
  'src/desert.js',
  "else showToast('Squelch! Back to the checkpoint.');return true;",
  "else showToast(message||'Squelch! Back to the checkpoint.');return true;",
  'QUICKSAND_CUSTOM_MESSAGE'
);
replaceOnce(
  'src/desert.js',
  "function finalQuicksandReady(q){return q&&q.role==='final'&&!P.dead&&!won&&!DESERT.finish&&inQuicksand(q,P.pos.x,P.pos.z)&&P.pos.y<q.y+0.55;}",
  "function desertSnoozlesReady(){const goal=snoozleGoalCount();return goal<=0||rescued>=goal;}\nfunction finalQuicksandInside(q){return q&&q.role==='final'&&!P.dead&&!won&&!DESERT.finish&&inQuicksand(q,P.pos.x,P.pos.z)&&P.pos.y<q.y+0.55;}\nfunction finalQuicksandReady(q){return finalQuicksandInside(q)&&desertSnoozlesReady();}",
  'FINAL_REQUIRES_SNOOZLES'
);
replaceOnce(
  'src/desert.js',
  "for(const q of quicksands){if(q.role==='final'){if(finalQuicksandReady(q))beginFinalQuicksand(q);}else if(q.active&&inQuicksand(q,P.pos.x,P.pos.z)&&P.pos.y<q.y+0.55){beginQuicksandRecovery();break;}}",
  "for(const q of quicksands){if(q.role==='final'){if(finalQuicksandReady(q))beginFinalQuicksand(q);else if(finalQuicksandInside(q)){beginQuicksandRecovery('Wake all '+snoozleGoalCount()+' Snoozles first!');break;}}else if(q.active&&inQuicksand(q,P.pos.x,P.pos.z)&&P.pos.y<q.y+0.55){beginQuicksandRecovery();break;}}",
  'FINAL_LOCKED_RECOVERY'
);
replaceOnce(
  'src/desert.js',
  "window.__DESERT={isDesertLevel,get camels(){return camels;},get cacti(){return cacti;},get lizards(){return lizards;},get quicksands(){return quicksands;},get state(){return DESERT;},nearbyCamel,mountCamel,dismountCamel,beginFinalQuicksand,playerInOrdinaryQuicksand};",
  "window.__DESERT={isDesertLevel,get camels(){return camels;},get cacti(){return cacti;},get lizards(){return lizards;},get quicksands(){return quicksands;},get state(){return DESERT;},nearbyCamel,mountCamel,dismountCamel,beginFinalQuicksand,playerInOrdinaryQuicksand,desertSnoozlesReady};",
  'DESERT_TEST_HOOKS'
);

replaceOnce(
  'tests/level5-desert-enhancement.test.js',
  "\nreport();",
  `\n// Level 5 now carries the normal four-Snoozle progression across safe route lanes.\n{\n  const H=boot();H.startLevel(4);H.frames(4);\n  const L=H.getLevel(),sn=H.W.snoozles;\n  ok(L.snoozleGoal===4&&H.window.__snoozleGoal()===4,'Level 5 requires exactly four Snoozles');\n  ok(sn.length===4&&L.snoozleHomes.length===4,'Level 5 instantiates four Snoozles with four homes');\n  const zs=sn.map(s=>s.g.position.z);\n  ok(zs[0]>-20&&zs[1]<-100&&zs[1]>-170&&zs[2]<-330&&zs[2]>-410&&zs[3]<-700,'Snoozles are distributed from early route through pre-finale');\n  for(let i=0;i<sn.length;i++){\n    const x=sn[i].g.position.x,z=sn[i].g.position.z;\n    const inSand=H.W.quicksands.some(q=>Math.abs(x-q.x)<q.w*0.5+0.4&&Math.abs(z-q.z)<q.d*0.5+0.4);\n    const nearCactus=H.W.cacti.some(c=>Math.hypot(x-c.x,z-c.z)<1.7);\n    const inRock=H.W.solids.some(s=>['desertSpur','desertPassWall','cliff','cactus'].includes(s.role)&&x>s.min.x-0.4&&x<s.max.x+0.4&&z>s.min.z-0.4&&z<s.max.z+0.4);\n    ok(!inSand&&!nearCactus&&!inRock,'Snoozle '+(i+1)+' sits in a safe readable lane');\n  }\n  for(let i=0;i<sn.length;i++){\n    H.P.pos.set(sn[i].g.position.x,0,sn[i].g.position.z);H.P.vel.set(0,0,0);H.P.grounded=true;H.P.lastGround=99;H.tap('KeyK',2);H.frames(2);\n    ok(sn[i].state!=='sleep','Snoozle '+(i+1)+' wakes through normal player spin interaction');\n    ok(sn.filter(s=>s.state!=='sleep').length===i+1,'Snoozle count advances to '+(i+1)+'/4');\n  }\n  const final=H.W.quicksands.find(q=>q.role==='final');H.P.pos.set(final.x,0,final.z);H.P.grounded=true;\n  ok(H.window.__DESERT.beginFinalQuicksand(final),'special final quicksand unlocks after all four Snoozles wake');\n}\n\n// The special final sand is visibly gated before the four-Snoozle objective is complete.\n{\n  const H=boot();H.startLevel(4);H.frames(4);const final=H.W.quicksands.find(q=>q.role==='final'),hp=H.P.hp;\n  H.P.safeAnchor.set(0,7.22,-780);H.P.pos.set(final.x,0,final.z);H.P.vel.set(0,0,0);H.P.grounded=true;H.frames(2);\n  ok(!H.window.__DESERT.state.finish&&!H.W.won,'final sand cannot start the portal before Snoozles are awake');\n  ok(H.P.quicksandRecT>0&&H.P.hp===hp-1,'locked final sand uses normal checkpoint recovery instead of a second win path');\n}\n\n// Airborne dismount inherits the camel's vertical motion, lands naturally, and stays reusable.\nfor(const tc of [{name:'takeoff',frames:4,sign:1},{name:'apex',frames:22,sign:0},{name:'descent',frames:34,sign:-1}]){\n  const H=boot();H.startLevel(4);H.frames(4);const D=H.window.__DESERT,c=H.W.camels[0],count=H.W.camels.length;\n  H.P.pos.set(c.x,0,c.z);H.P.vel.set(0,0,0);H.P.grounded=true;H.P.lastGround=99;ok(D.mountCamel(c),tc.name+' case mounts camel');\n  H.kd('Space');H.frames(tc.frames);ok(!H.P.grounded&&H.P.pos.y>0.05,tc.name+' case reaches airborne state');H.tap('KeyJ',1);H.ku('Space');H.frames(1);\n  ok(!H.P.camel&&!c.mounted&&c.airborne,tc.name+' dismount separates rider while camel stays physically airborne');\n  if(tc.sign>0)ok(c.vy>0,tc.name+' camel retains upward velocity after early dismount');\n  else if(tc.sign<0)ok(c.vy<0,tc.name+' camel retains descending velocity after late dismount');\n  else ok(Math.abs(c.vy)<5,tc.name+' camel is near apex rather than frozen');\n  const y0=c.y;H.frames(110);\n  ok(!c.airborne&&c.grounded&&Math.abs(c.y)<0.06,tc.name+' camel falls back to valid ground and settles');\n  ok(c.y<y0||tc.sign>0,tc.name+' camel vertical lifecycle progresses instead of freezing');\n  ok(H.W.camels.length===count,'camel does not duplicate during '+tc.name+' dismount');\n  H.P.pos.set(c.x,0,c.z);H.P.vel.set(0,0,0);H.P.grounded=true;ok(D.mountCamel(c),'landed camel remains mountable after '+tc.name+' dismount');\n}\n\nreport();`,
  'LEVEL5_REMEDIATION_TESTS'
);

replaceOnce(
  'tools/browser-level5-enhancement-verify.js',
  "async function state(ev){return ev(`(()=>({x:__P.pos.x,y:__P.pos.y,z:__P.pos.z,vx:__P.vel.x,vy:__P.vel.y,vz:__P.vel.z,grounded:!!__P.grounded,camel:!!__P.camel,dead:!!__P.dead,rec:__P.quicksandRecT||0,won:!!__W.won,finish:!!(__DESERT.state&&__DESERT.state.finish)}))()`);}\n",
  "async function state(ev){return ev(`(()=>({x:__P.pos.x,y:__P.pos.y,z:__P.pos.z,vx:__P.vel.x,vy:__P.vel.y,vz:__P.vel.z,grounded:!!__P.grounded,camel:!!__P.camel,dead:!!__P.dead,rec:__P.quicksandRecT||0,won:!!__W.won,finish:!!(__DESERT.state&&__DESERT.state.finish)}))()`);}\nasync function awakeCount(ev){return ev(`__W.snoozles.filter(s=>s.state!=='sleep').length`);}\nasync function wakeRouteSnoozle(ev,idx,x,z,label){\n  await driveTo(ev,x,z,label+' approach');if((await state(ev)).camel){await tap(ev,'KeyJ',35);await waitEval(ev,`!__P.camel`,2500);}\n  const before=await awakeCount(ev);assert(await ev(`__W.snoozles.length===4&&__snoozleGoal()===4`),'Level 5 Snoozle population/goal mismatch');\n  await tap(ev,'KeyK',55);await waitEval(ev,`__W.snoozles[${idx}].state!=='sleep'`,3000);const after=await awakeCount(ev);assert(after===before+1,label+' count did not advance');\n  await tap(ev,'Space',55);await waitEval(ev,`!!__P.camel`,3000);return {index:idx,before,after,x,z};\n}\nasync function camelAirDismountCase(ev,label,delayMs){\n  await waitEval(ev,`__P.grounded===true&&!!__P.camel`,5000);const idx=await ev(`__W.camels.indexOf(__P.camel)`),count=await ev(`__W.camels.length`);\n  await nativeSpace(true);await sleep(delayMs);const pre=await state(ev);assert(pre.camel&&!pre.grounded&&pre.y>0.05,label+' did not reach airborne mounted state');await tap(ev,'KeyJ',25);await nativeSpace(false);\n  const start=await ev(`(()=>{const c=__W.camels[${idx}];return {x:c.x,y:c.y,z:c.z,vy:c.vy,airborne:!!c.airborne,mounted:!!c.mounted,px:__P.pos.x,pz:__P.pos.z};})()`);assert(!start.mounted&&start.airborne,label+' camel did not inherit airborne lifecycle');\n  if(label==='takeoff')assert(start.vy>0,label+' expected upward camel velocity '+start.vy);if(label==='descent')assert(start.vy<0,label+' expected descending camel velocity '+start.vy);if(label==='apex')assert(Math.abs(start.vy)<5,label+' expected near-apex camel velocity '+start.vy);\n  if(label==='takeoff'){await hold(ev,['KeyD'],260);const independent=await ev(`(()=>{const c=__W.camels[${idx}];return {cx:c.x,cz:c.z,px:__P.pos.x,pz:__P.pos.z};})()`);assert(Math.hypot(independent.cx-start.x,independent.cz-start.z)<0.08,'camel was dragged horizontally with Pling');assert(Math.hypot(independent.px-start.px,independent.pz-start.pz)>0.12,'Pling did not separate from camel');}\n  const samples=[start];const t=Date.now();let landed=null;while(Date.now()-t<3500){await sleep(55);const c=await ev(`(()=>{const c=__W.camels[${idx}];return {x:c.x,y:c.y,z:c.z,vy:c.vy,airborne:!!c.airborne,mounted:!!c.mounted};})()`);samples.push(c);if(!c.airborne){landed=c;break;}}\n  assert(landed&&landed.y>=-0.02&&landed.y<0.08,label+' camel did not settle on desert ground');assert(landed.vy===0,label+' camel retained vertical velocity after landing');assert(await ev(`__W.camels.length===${count}`),label+' duplicated camel');\n  await driveTo(ev,landed.x,landed.z,label+' remount');await tap(ev,'Space',55);await waitEval(ev,`__P.camel===__W.camels[${idx}]`,3000);return {idx,pre,start,landed,minY:Math.min(...samples.map(s=>s.y)),maxY:Math.max(...samples.map(s=>s.y))};\n}\n",
  'BROWSER_SNOOZLE_AIR_HELPERS'
);
replaceOnce(
  'tools/browser-level5-enhancement-verify.js',
  "const naturalStart=Date.now();let adversarialMs=0;\n    await driveTo(cdp.evaluate,-5,-8,'heart lizard');",
  "const naturalStart=Date.now();let adversarialMs=0;results.snoozles=[];\n    results.snoozles.push(await wakeRouteSnoozle(cdp.evaluate,0,5,-2,'Snoozle 1'));\n    await driveTo(cdp.evaluate,-5,-8,'heart lizard');",
  'BROWSER_SNOOZLE1'
);
replaceOnce(
  'tools/browser-level5-enhancement-verify.js',
  `// Beat 2: alternating sandstone switchbacks.\n    const waypoints=[\n      [13,-94],[13,-116],[-13,-129],[-13,-151],[13,-164],[13,-186],[-13,-199],[-13,-221],[13,-234],[13,-256],[0,-278],\n      // Beat 3: central terrace + offset quicksand + second switchback run.\n      [0,-288],[0,-313],[1,-326],[1,-347],[-13,-364],[-13,-386],[13,-399],[13,-421],[-13,-434],[-13,-456],[13,-469],[13,-491],[-13,-504],[-13,-526],[13,-539],[13,-561],[-7,-568],[-7,-585],\n      // Beat 4: readable cactus/dune gauntlet.\n      [5,-596],[-7,-608],[-5,-621],[7,-640],[-5,-656],[5,-674],[-7,-692],[-5,-711],[5,-743],[0,-751]\n    ];\n    for(let i=0;i<waypoints.length;i++){await driveTo(cdp.evaluate,waypoints[i][0],waypoints[i][1],'route '+i);if(i===10||i===28)await sleep(900);}`,
  `// Beat 2: alternating sandstone switchbacks with the second Snoozle in a readable turn pocket.\n    const beat2=[[13,-94],[13,-116]];for(let i=0;i<beat2.length;i++)await driveTo(cdp.evaluate,beat2[i][0],beat2[i][1],'beat2 '+i);\n    results.snoozles.push(await wakeRouteSnoozle(cdp.evaluate,1,13,-123,'Snoozle 2'));\n    for(const p of[[-13,-129],[-13,-151],[13,-164],[13,-186],[-13,-199],[-13,-221],[13,-234],[13,-256],[0,-278]])await driveTo(cdp.evaluate,p[0],p[1],'beat2 continuation');await sleep(900);\n\n    // Real airborne lifecycle coverage in the broad clear lane before the terraced pass.\n    results.camelAirborne={};results.camelAirborne.takeoff=await camelAirDismountCase(cdp.evaluate,'takeoff',45);results.camelAirborne.apex=await camelAirDismountCase(cdp.evaluate,'apex',280);results.camelAirborne.descent=await camelAirDismountCase(cdp.evaluate,'descent',480);\n\n    // Beat 3: central terrace + offset quicksand + second switchback run, with Snoozle 3 immediately after the transition.\n    for(const p of[[0,-288],[0,-313],[1,-326],[1,-347],[-13,-364]])await driveTo(cdp.evaluate,p[0],p[1],'beat3 terrace');\n    results.snoozles.push(await wakeRouteSnoozle(cdp.evaluate,2,-13,-364,'Snoozle 3'));\n    for(const p of[[-13,-386],[13,-399],[13,-421],[-13,-434],[-13,-456],[13,-469],[13,-491],[-13,-504],[-13,-526],[13,-539],[13,-561],[-7,-568],[-7,-585]])await driveTo(cdp.evaluate,p[0],p[1],'beat3 switchback');await sleep(900);\n\n    // Beat 4: readable cactus/dune gauntlet and final Snoozle before the cliff build-up.\n    for(const p of[[5,-596],[-7,-608],[-5,-621],[7,-640],[-5,-656],[5,-674],[-7,-692],[-5,-711]])await driveTo(cdp.evaluate,p[0],p[1],'beat4 gauntlet');\n    results.snoozles.push(await wakeRouteSnoozle(cdp.evaluate,3,2,-724,'Snoozle 4'));assert((await awakeCount(cdp.evaluate))===4,'all four Snoozles were not awake before finale');\n    for(const p of[[5,-743],[0,-751]])await driveTo(cdp.evaluate,p[0],p[1],'beat4 finale approach');`,
  'BROWSER_ROUTE_WITH_SNOOZLES'
);
replaceOnce(
  'tools/browser-level5-enhancement-verify.js',
  "// Intended finale: center terrace -> cliff top -> deliberate drop -> real final quicksand -> portal -> oasis.\n    await driveTo(cdp.evaluate,0,-751,'final center');",
  "// Intended finale: all four Snoozles awake -> center terrace -> cliff top -> deliberate drop -> real final quicksand -> portal -> oasis.\n    assert((await awakeCount(cdp.evaluate))===4&&await cdp.evaluate(`__snoozleGoal()===4`),'finale reached without completed Snoozle objective');await driveTo(cdp.evaluate,0,-751,'final center');",
  'BROWSER_FINAL_SNOOZLE_GATE'
);
replaceOnce(
  'tools/browser-level5-enhancement-verify.js',
  "await cdp.evaluate(`__setPickerIdx(4)`);await tap(cdp.evaluate,'Space');await waitEval(cdp.evaluate,`!!(__started&&__started())&&__LEVEL().id==='level5'`,5000);results.restart=true;",
  "await cdp.evaluate(`__setPickerIdx(4)`);await tap(cdp.evaluate,'Space');await waitEval(cdp.evaluate,`!!(__started&&__started())&&__LEVEL().id==='level5'`,5000);assert(await cdp.evaluate(`__W.snoozles.length===4&&__W.snoozles.every(s=>s.state==='sleep')&&__snoozleGoal()===4`),'Level 5 restart did not reset Snoozles');results.restart=true;results.restartSnoozles=await cdp.evaluate(`({count:__W.snoozles.length,awake:__W.snoozles.filter(s=>s.state!=='sleep').length,goal:__snoozleGoal()})`);",
  'BROWSER_RESTART_SNOOZLES'
);

console.log('LEVEL5_REMEDIATION_2_PATCH=COMPLETE');
