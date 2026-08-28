const LEVEL3={
id:'level3',
music:'peak',
peakAtmosphere:true,
// Warm Slopes start — production boot, not the Stage 1–3 prototype arena.
spawn:{x:0,y:0.4,z:24},
physics:{
  speed:6.8,acc:44,dec:60,airAcc:20,
  grav:-30,maxFall:-32,jumpV:10.5,puffV:9.4,
  coyote:0.12,buffer:0.15,step:0.42,r:0.36,h:1.15,
  hoverHeld:1.0,hoverReleased:0.5,hoverDrift:-1.6,
  slamHang:0.14,slamFall:-34,slamRebound:8,
  jetTime:0.38,bonkR:2.05,bonkCD:0.5
},
// Phone feel pass still owns the next Sky Blast retune — do not change base leap here.
// Glide is the Stage 4.5 addition: short automatic descent softener after the powered crest.
skyBlast:{
  puffVMul:1.4,boostMax:12.5,boostDecay:1.6,
  // Bounded post-crest softener. Cap sits near hover drift so gaps still clear; timer (not hold) ends it.
  glideDur:0.55,glideFallCap:-2.2,glideStartVy:0.2
},
anchorSettle:0.22,
anchorClear:0.85,
lavaRecovery:0.42,
// Impossible-world floor: below every legitimate route Y, lava surface, and recovery arc.
// Warm Slopes tops ≈0.4; lava basins ≈-0.15; default Peak voidFloor is -25.
voidY:-4,
voidFloor:-25,
snoozleGoal:4,
teachGaps:[{
  id:'teachFail',nearLipZ:-38,farEdgeZ:-47.5,failFloorY:1.6,failFloorZ:-42.5
},{
  id:'teachPower',nearLipZ:-58,farEdgeZ:-67.5
}],
protoGap:{nearZ:-58,farZ:-67.5,farEndZ:-78},
// Flat-height mandatory leaps (~9.5u). Vertical climb is on stairs between leaps.
mandatoryLeaps:[{
  id:'firstLavaLeap',
  takeoff:{x:0,z:-72,ventReach:5},
  landing:{x:0,z:-92.5,edgeZ:-86.5,farZ:-98.5,minDepth:8},
  nearSafe:{x:0,y:8.4,z:-70},
  farSafe:{x:0,y:8.4,z:-92}
},{
  id:'islandA',
  takeoff:{x:0,z:-104,ventReach:5},
  landing:{x:0,z:-123.5,edgeZ:-117.5,farZ:-129.5,minDepth:8},
  nearSafe:{x:0,y:11.4,z:-102},
  farSafe:{x:0,y:11.4,z:-123}
},{
  id:'islandB',
  takeoff:{x:0,z:-134,ventReach:5},
  landing:{x:0,z:-153.5,edgeZ:-147.5,farZ:-159.5,minDepth:8},
  nearSafe:{x:0,y:13.4,z:-132},
  farSafe:{x:0,y:13.4,z:-153}
},{
  id:'wideRiver',
  takeoff:{x:0,z:-164,ventReach:5},
  landing:{x:0,z:-184.5,edgeZ:-177.5,farZ:-191.5,minDepth:8},
  nearSafe:{x:0,y:15.4,z:-162},
  farSafe:{x:0,y:15.4,z:-184}
},{
  id:'geyserApproach',
  takeoff:{x:0,z:-196,ventReach:5},
  landing:{x:0,z:-215.5,edgeZ:-209.5,farZ:-221.5,minDepth:8},
  nearSafe:{x:0,y:17.4,z:-194},
  farSafe:{x:0,y:17.4,z:-215}
},{
  // Area 5 — The Climb (powered ascent along the caldera wall)
  // Flat-height Sky Blast leaps; stairs between shelves provide the elevation.
  id:'climbShelfA',
  takeoff:{x:0,z:-386,ventReach:5},
  landing:{x:0,z:-405.5,edgeZ:-399.5,farZ:-411.5,minDepth:8},
  nearSafe:{x:0,y:24.4,z:-384},
  farSafe:{x:0,y:24.4,z:-405}
},{
  id:'climbShelfB',
  takeoff:{x:0,z:-422,ventReach:5},
  landing:{x:0,z:-441.5,edgeZ:-435.5,farZ:-447.5,minDepth:8},
  nearSafe:{x:0,y:28.4,z:-420},
  farSafe:{x:0,y:28.4,z:-441}
},{
  id:'climbShelfC',
  takeoff:{x:0,z:-460,ventReach:5},
  landing:{x:0,z:-479.5,edgeZ:-473.5,farZ:-485.5,minDepth:8},
  nearSafe:{x:0,y:32.4,z:-458},
  farSafe:{x:0,y:32.4,z:-479}
},{
  id:'climbShelfD',
  takeoff:{x:0,z:-496,ventReach:5},
  landing:{x:0,z:-515.5,edgeZ:-509.5,farZ:-521.5,minDepth:8},
  nearSafe:{x:0,y:36.4,z:-494},
  farSafe:{x:0,y:36.4,z:-515}
},{
  id:'climbShelfE',
  takeoff:{x:0,z:-532,ventReach:5},
  landing:{x:0,z:-551.5,edgeZ:-545.5,farZ:-557.5,minDepth:8},
  nearSafe:{x:0,y:40.4,z:-530},
  farSafe:{x:0,y:40.4,z:-551}
},{
  id:'climbRimLeap',
  takeoff:{x:0,z:-566,ventReach:5},
  landing:{x:0,z:-585.5,edgeZ:-579.5,farZ:-591.5,minDepth:8},
  nearSafe:{x:0,y:44.4,z:-564},
  farSafe:{x:0,y:44.4,z:-585}
}],
route:{
  sideLava:{x:10,z:10},
  snoozle1:{x:-5,z:6},
  cinderTerrace:{x:-2,z:-24},
  skyCrates:[
    {x:9,z:-50,area:2,note:'teaching',y:5.9},
    {x:-5,z:-90,area:3,note:'postLeapRecovery',y:8.4}
  ],
  skyCrate:{x:9,z:-50},
  snoozle2:{x:-9,z:-78},
  powerLossCinder:{x:5,z:-95},
  wispOpen:{x:6,z:-230},
  wispCorridor:{x:0,z:-248},
  geyser:{x:0,y:17.4,z:-216},
  // Stage 4 temporary endpoint was at z:-265 (blocked mouth). Stage 5 opens that mouth.
  caveMouth:{x:0,y:20.0,z:-268},
  geodeHollow:{zEnter:-266,zExit:-372,halfW:14},
  snoozle3:{x:3.2,z:-330},
  secretCurtain:{x:-7.0,y:20.0,z:-308},
  secretAlcove:{x:-12.2,z:-308},
  // Hollow opens onto Climb base; Stage 5 soft-return at z:-368 is gone.
  climbExit:{x:0,y:21.5,z:-368},
  climbBase:{x:0,y:21.5,z:-378},
  climbHalfway:{x:0,y:28.4,z:-441},
  climbRim:{x:0,y:44.4,z:-585},
  challengeBranch:{x:8.5,y:28.4,z:-441},
  challengeReward:{x:11.0,y:29.0,z:-472},
  snoozle4:{x:-5,y:44.55,z:-590},
  craterRim:{x:0,y:44.4,z:-592},
  organ:{x:0,y:44.4,z:-640},
  keyboard:{x:0,y:44.4,z:-631.5}
},
fence:0x5a2e1a,
fenceSolids:[
  [0,0,30,36,2.2,0.7],[0,0,-670,36,2.2,0.7],
  [-18,0,-320,0.7,2.2,700],[18,0,-320,0.7,2.2,700]
],
pathTiles:[],
hedges:[],
checks:[[0,22],[0,-4,2.2],[0,-34,5.2],[0,-70,8.2],[0,-100,11.2],[0,-134,13.2],[0,-168,15.2],[0,-240,19.2],[0,-272,20.2],[0,-350,21.2],[0,-378,21.7],[0,-441,28.4],[0,-585,44.4]],
tower:{tx:0,tz:-640},
// Four pipe-top homes on the Great Steam Organ. Paths stay outside mountain solids.
// Format: [x, z, pathWaypoints?, homeY]
snoozleHomes:[
  [-6.2,-642,[[-8,10,-40],[-14,18,-140],[-14,26,-280],[-14,36,-420],[-12,46,-540],[-10,52,-600],[-8,54,-620]],57.1],
  [5.4,-641.6,[[-12,14,-150],[-14,22,-260],[-14,34,-400],[-12,44,-520],[-8,52,-580],[2,54,-610]],56.4],
  [-3.4,-643.5,[[3.2,23.5,-318],[0,22.8,-300],[0,22.0,-280],[0,22.5,-268],[0,24.5,-252],[-14,28,-252],[-16,34,-320],[-16,42,-420],[-16,50,-520],[-12,54,-590],[-8,56,-620]],60.1],
  [2.2,-643.2,[[-3,48,-610],[0,52,-625]],58.6]
],
snoozles:[[-5,0.55,6,0,false],[-9,8.55,-78,1,false],[3.2,20.55,-330,2,false],[-5,44.55,-590,3,false]],
trees:[],
steps:[
  ['volcanoLandmark',0,0,-290,1.35],
  // Late-route volcano silhouette visible from Climb / Crater approach.
  ['volcanoLandmark',-14,28,-560,0.85],
  ['volcanoLandmark',12,26,-600,0.7],
  ['driftSparks',22],
  // World bounds — ceiling clears Organ pipes; far face past Crater; sides cover full route.
  ['solid',0,72,-320,38,2,700,0xffc48a,{invisible:true}],
  ['solid',0,20,30,36.5,50,0.7,0x5a2e1a,{invisible:true}],
  ['solid',0,20,-670,36.5,50,0.7,0x5a2e1a,{invisible:true}],
  ['solid',-18,20,-320,0.7,50,700,0x5a2e1a,{invisible:true}],
  ['solid',18,20,-320,0.7,50,700,0x5a2e1a,{invisible:true}],

  // ========== AREA 1 — The Warm Slopes ==========
  // Volcanic sand / dark warm earth — green is accent tufts only, not the floor.
  // Safe ground must read as solid rock (never bright molten orange).
  ['solid',0,0,12,26,0.4,28,0x2a2218,{surf:'stone',role:'safeRock'}],
  ['solid',0,0.4,18,8,0.06,6,0x3a2a22,{surf:'stone',role:'safeRock'}],
  ['solid',0,0.42,8,5.5,0.05,18,0x4a3228,{surf:'stone',role:'safeRock'}],
  ['solid',6,1.2,0,10,0.4,8,0x3a3530,{surf:'stone',role:'safeRock'}],
  ['solid',-4,2.0,-8,12,0.4,8,0x3a3228,{surf:'stone',role:'safeRock'}],
  // Snoozle 1 pad — charcoal rock with a thin warm crack, not a lava pool lookalike.
  ['solid',-5,0,6,4.5,0.45,4.5,0x2e2620,{surf:'stone',role:'safeRock'}],
  ['solid',-5,0.45,6,3.2,0.06,0.12,0x8a2010,{surf:'stone',role:'safeCrack'}],
  ['solid',-5,0.45,6,0.12,0.06,3.2,0x8a2010,{surf:'stone',role:'safeCrack'}],
  ['lava',10,-0.15,10,4.0,0.4,4.0],
  ['salamander',4,14,{}],
  ['salamander',-8,10,{path:[{x:-9,z:11},{x:-6,z:9},{x:-8,z:12}]}],
  ['salamander',7,4,{note:true}],
  ['note',3,1.1,16,false],
  ['note',-6,1.0,12,false],
  ['peakTuft',8,18,1.1],['peakTuft',-9,16,0.9],['peakTuft',5,6,1.0],
  ['basaltRock',-10,0,14,1.2],['basaltRock',11,0,4,1.0],['basaltRock',-8,0,-2,1.4],

  // ========== AREA 2 — The Cinder Steps ==========
  ['solid',0,3.5,-18,18,0.4,12,0x2e2a2c,{surf:'stone',role:'safeRock'}],
  ['solid',0,4.0,-18,6,0.08,4,0x3a322e,{surf:'stone',role:'safeRock'}],
  ['solid',0,4.02,-18,4.5,0.04,0.1,0x8a2010,{surf:'stone',role:'safeCrack'}],
  ['solid',-2,4.5,-26,16,0.4,12,0x3a322e,{surf:'stone',role:'safeRock'}],
  ['cinder',-2,-26,'mid'],
  ['basaltRock',6,4.5,-22,0.9],['basaltRock',-8,4.5,-28,1.1],
  ['peakTuft',5,-20,0.55],
  // Teach gap A (flat 5.9 tops, safe volcanic floor below)
  ['solid',0,5.5,-34,16,0.4,8,0x3a3538,{surf:'stone',role:'safeRock'}],
  ['solid',0,5.9,-37.7,14,0.06,0.35,0x8a2010,{surf:'stone',role:'safeCrack'}],
  ['solid',0,5.5,-52,16,0.4,9,0x3a3538,{surf:'stone',role:'safeRock'}],
  ['solid',0,5.9,-47.7,14,0.06,0.35,0x8a2010,{surf:'stone',role:'safeCrack'}],
  ['solid',0,1.4,-42.5,18,0.4,12,0x2a2420,{surf:'stone',role:'safeRock'}],
  ['solid',12,2.0,-42,6,0.4,16,0x3a322e,{surf:'stone',role:'safeRock'}],
  ['solid',12,3.5,-48,6,0.4,8,0x3a322e,{surf:'stone',role:'safeRock'}],
  ['solid',12,5.0,-52,6,0.4,6,0x3a3538,{surf:'stone',role:'safeRock'}],
  ['solid',8,5.5,-50,8,0.4,6,0x3a3538,{surf:'stone',role:'safeRock'}],
  // Side ledge — clear of the overlapping teach-B pad above the center
  ['crate',9,5.9,-50,'sky'],
  // Teach gap B
  ['solid',0,6.5,-54,16,0.4,8,0x3a3538,{surf:'stone',role:'safeRock'}],
  ['solid',0,6.9,-57.7,14,0.06,0.35,0x8a2010,{surf:'stone',role:'safeCrack'}],
  ['solid',0,6.5,-72,16,0.4,9,0x3a3538,{surf:'stone',role:'safeRock'}],
  ['solid',0,6.9,-67.7,14,0.06,0.35,0x8a2010,{surf:'stone',role:'safeCrack'}],
  ['solid',0,2.2,-62.5,18,0.4,12,0x2a2420,{surf:'stone',role:'safeRock'}],
  ['solid',-12,3.5,-62,6,0.4,14,0x3a322e,{surf:'stone',role:'safeRock'}],
  ['solid',-12,5.5,-68,6,0.4,8,0x3a3538,{surf:'stone',role:'safeRock'}],
  // Snoozle 2 ledge — dark basalt, thin crack (was bright orange false-lava).
  ['solid',0,7.5,-70,10,0.4,6,0x3a3538,{surf:'stone',role:'safeRock'}],
  ['steamVent',0,7.9,-70,1.35],
  ['solid',-9,8.0,-78,5.5,0.4,5.5,0x2e2620,{surf:'stone',role:'safeRock'}],
  ['solid',-9,8.4,-78,3.5,0.05,0.1,0x8a2010,{surf:'stone',role:'safeCrack'}],
  ['solid',-9,2.5,-74,8,0.4,10,0x2a2420,{surf:'stone',role:'safeRock'}],

  // First mandatory lava leap — SAME height 8.4 both sides
  ['solid',0,8.0,-72,16,0.4,10,0x3a3538,{surf:'stone',role:'safeRock'}],
  ['solid',0,8.4,-76.7,14,0.06,0.35,0x8a2010,{surf:'stone',role:'safeCrack'}],
  ['steamVent',0,8.4,-72,1.4],
  ['solid',0,8.0,-92.5,16,0.4,12,0x3a3228,{surf:'stone',role:'safeRock'}],
  ['solid',0,8.4,-86.65,14,0.06,0.35,0x8a2010,{surf:'stone',role:'safeCrack'}],
  // Landing marker — muted stone + crack, not glossy gold false-lava.
  ['solid',0,8.4,-90,5,0.08,2.2,0x3a322e,{surf:'stone',role:'safeRock'}],
  ['solid',0,8.48,-90,3.5,0.04,0.1,0x8a2010,{surf:'stone',role:'safeCrack'}],
  ['lava',0,6.0,-81.75,16,0.55,9.0],
  // Basin under / beside first leap — miss the elevated route, hit lava
  ['lava',0,-0.15,-82,30,0.55,32],
  ['lava',-13,-0.15,-82,10,0.55,26],
  ['lava',13,-0.15,-82,10,0.55,26],
  // Fair mid Cinder on the broad landing — visible, avoidable; can remove Sky Blast.
  ['cinder',5,-95,'mid'],
  // Recovery mystery box after the power-loss chance (not next to a takeoff vent).
  ['crate',-5,8.4,-90,'sky'],

  // ========== AREA 3 — stairs up, then flat leaps ==========
  // Stair climb to islandA height
  ['solid',0,9.0,-100,14,0.4,6,0x2e2a28,{surf:'stone',role:'safeRock'}],
  ['solid',0,10.0,-102,14,0.4,4,0x2e2a28,{surf:'stone',role:'safeRock'}],
  ['solid',0,11.0,-104,16,0.4,8,0x2e2a28,{surf:'stone',role:'safeRock'}],
  ['steamVent',0,11.4,-104,1.35],
  ['solid',0,11.4,-107.7,12,0.06,0.35,0x8a2010,{surf:'stone',role:'safeCrack'}],
  ['solid',0,11.0,-123.5,12,0.4,12,0x3a3538,{surf:'stone',role:'safeRock'}],
  ['solid',0,11.4,-117.65,10,0.06,0.35,0x8a2010,{surf:'stone',role:'safeCrack'}],
  ['lava',0,9.0,-112.75,16,0.55,9.0],
  ['lava',0,-0.15,-113,28,0.55,28],
  ['lava',-12,-0.15,-113,9,0.55,24],
  ['lava',12,-0.15,-113,9,0.55,24],

  // Stair to islandB
  ['solid',0,12.0,-130,12,0.4,4,0x3a3538,{surf:'stone',role:'safeRock'}],
  ['solid',0,13.0,-134,12,0.4,8,0x3a3538,{surf:'stone',role:'safeRock'}],
  ['steamVent',0,13.4,-134,1.3],
  ['solid',0,13.4,-137.7,10,0.06,0.35,0x8a2010,{surf:'stone',role:'safeCrack'}],
  ['solid',0,13.0,-153.5,12,0.4,12,0x3a3538,{surf:'stone',role:'safeRock'}],
  ['solid',0,13.4,-147.65,10,0.06,0.35,0x8a2010,{surf:'stone',role:'safeCrack'}],
  ['lava',0,11.0,-142.75,16,0.55,9.0],
  ['lava',0,-0.15,-143,28,0.55,28],
  ['lava',-12,-0.15,-143,9,0.55,24],
  ['lava',12,-0.15,-143,9,0.55,24],

  // Stair to wideRiver
  ['solid',0,14.0,-160,14,0.4,4,0x3a3538,{surf:'stone',role:'safeRock'}],
  ['solid',0,15.0,-164,14,0.4,8,0x3a3538,{surf:'stone',role:'safeRock'}],
  ['steamVent',0,15.4,-164,1.4],
  ['solid',0,15.4,-167.7,12,0.06,0.35,0x8a2010,{surf:'stone',role:'safeCrack'}],
  ['solid',0,15.0,-184.5,16,0.4,14,0x3a3228,{surf:'stone',role:'safeRock'}],
  ['solid',0,15.4,-177.65,14,0.06,0.35,0x8a2010,{surf:'stone',role:'safeCrack'}],
  ['solid',0,15.4,-182,5,0.08,2.2,0x3a322e,{surf:'stone',role:'safeRock'}],
  ['solid',0,15.48,-182,3.5,0.04,0.1,0x8a2010,{surf:'stone',role:'safeCrack'}],
  ['lava',0,13.0,-172.75,18,0.6,10.0],
  ['lava',0,-0.15,-173,32,0.55,32],
  ['lava',-13,-0.15,-173,10,0.55,28],
  ['lava',13,-0.15,-173,10,0.55,28],

  // Stair to geyserApproach
  ['solid',0,16.0,-192,14,0.4,4,0x3a3538,{surf:'stone',role:'safeRock'}],
  ['solid',0,17.0,-196,14,0.4,8,0x3a3538,{surf:'stone',role:'safeRock'}],
  ['steamVent',0,17.4,-196,1.35],
  ['solid',0,17.4,-199.7,12,0.06,0.35,0x8a2010,{surf:'stone',role:'safeCrack'}],
  ['solid',0,17.0,-215.5,14,0.4,12,0x3a3228,{surf:'stone',role:'safeRock'}],
  ['solid',0,17.4,-209.65,12,0.06,0.35,0x8a2010,{surf:'stone',role:'safeCrack'}],
  ['lava',0,15.0,-204.75,16,0.55,9.0],
  ['lava',0,-0.15,-205,30,0.55,30],
  ['lava',-12,-0.15,-205,10,0.55,26],
  ['lava',12,-0.15,-205,10,0.55,26],
  ['geyser',0,17.4,-216,1.2],
  ['solid',0,21.0,-220,12,0.4,8,0x3a3538,{surf:'stone',role:'safeRock'}],
  // Low basin under geyser / approach / later elevated route
  ['lava',-10,-0.15,-218,12,0.55,18],
  ['lava',10,-0.15,-218,12,0.55,18],
  ['lava',0,-0.15,-235,30,0.55,36],
  ['lava',-12,-0.15,-248,10,0.55,28],
  ['lava',12,-0.15,-248,10,0.55,28],

  // Open Wisp terrace
  ['solid',0,19.0,-228,16,0.4,6,0x2e2a28,{surf:'stone',role:'safeRock'}],
  ['solid',0,19.5,-234,18,0.4,14,0x2e2a28,{surf:'stone',role:'safeRock'}],
  ['wisp',[
    {x:6,y:20.4,z:-230},{x:8,y:20.6,z:-234},{x:6,y:20.4,z:-238},{x:4,y:20.5,z:-234}
  ],{speed:1.9}],
  ['wisp',[
    {x:-5,y:20.3,z:-232},{x:-7,y:20.5,z:-236}
  ],{speed:1.7,note:true}],
  ['note',-4,20.3,-228,false],
  ['salamander',4,-236,{}],
  ['cinder',-6,-232,'small'],
  // Forced Wisp corridor
  ['solid',-5,19.5,-248,6,3.2,0.7,0x2a2624,{surf:'stone',role:'safeRock'}],
  ['solid',5,19.5,-248,6,3.2,0.7,0x2a2624,{surf:'stone',role:'safeRock'}],
  ['solid',0,19.5,-256,10,0.4,16,0x2e2a28,{surf:'stone',role:'safeRock'}],
  ['wisp',[
    {x:0,y:20.3,z:-246},{x:0,y:20.5,z:-250},{x:0,y:20.3,z:-254}
  ],{speed:1.6}],
  // Approach pad extended through the cave mouth (was a 2u floor gap at z≈-268).
  ['solid',0,20.0,-262,14,0.4,14,0x2a2624,{surf:'stone',role:'safeRock'}],
  ['basaltRock',-6,20.0,-258,1.2],['basaltRock',6,20.0,-260,1.0],
  ['salamander',5,-260,{}],

  // ========== AREA 4 — The Geode Hollow ==========
  // Open mouth (Stage 4 blocker removed). Cool register begins here.
  ['geodeMouth',0,20.0,-268],
  // Hollow floor pulled forward so it overlaps the mouth sill / approach pad.
  ['solid',0,20.0,-276,12,0.4,22,0x2a1e38,{surf:'stone',role:'safeRock'}],
  ['solid',0,20.15,-278,6,0.06,14,0x3a2e55,{surf:'stone',role:'safeRock'}],
  // Entrance corridor walls / ceiling — fade with the mouth shell so the camera stays clear.
  ['solid',-8.5,20.0,-278,3.5,6.5,16,0x1a1228,{surf:'stone',role:'safeRock',geodeShell:true}],
  ['solid',8.5,20.0,-278,3.5,6.5,16,0x1a1228,{surf:'stone',role:'safeRock',geodeShell:true}],
  ['solid',0,26.2,-278,20,1.2,18,0x1a1228,{surf:'stone',role:'safeRock',geodeShell:true}],
  ['crystalCluster',-5.5,20.0,-274,1.1,true],
  ['crystalCluster',5.8,20.0,-280,0.95,true],
  ['crystalCluster',-4.2,20.0,-288,0.55,false],
  ['crystalCluster',4.5,20.0,-292,0.5,false],
  ['crystalSparks',10,0,-290,7],

  // Mid path — east wall continuous; west wall gapped for the steam-curtain secret
  // Floor overlaps entrance and chamber (no under-world seams).
  ['solid',0,20.0,-296,14,0.4,28,0x2a1e38,{surf:'stone',role:'safeRock'}],
  ['solid',0,20.15,-300,5.5,0.06,16,0x4a3a78,{surf:'stone',role:'safeRock'}],
  ['solid',8.5,20.0,-300,3.5,6.5,20,0x1a1228,{surf:'stone',role:'safeRock'}],
  // West wall split: gap around z=-308 for the side steam curtain
  ['solid',-8.5,20.0,-294,3.5,6.5,10,0x1a1228,{surf:'stone',role:'safeRock'}],
  ['solid',-8.5,20.0,-322,3.5,6.5,12,0x1a1228,{surf:'stone',role:'safeRock'}],
  ['solid',0,26.4,-304,22,1.2,28,0x1a1228,{surf:'stone',role:'safeRock'}],
  ['crystalCluster',6.2,20.0,-302,1.2,true],
  ['crystalCluster',-3.5,20.0,-318,0.7,false],

  // Side secret — steam curtain fills the west-wall gap (optional; main route stays center).
  ['steamCurtain',-7.0,20.0,-308,5.0,3.8,'x'],
  ['solid',-12.2,20.0,-308,6.0,0.4,8,0x2a1e38,{surf:'stone',role:'safeRock'}],
  ['solid',-15.0,20.0,-308,1.4,4.5,8,0x1a1228,{surf:'stone',role:'safeRock'}],
  ['solid',-12.2,20.0,-312.2,6.0,4.5,1.4,0x1a1228,{surf:'stone',role:'safeRock'}],
  ['solid',-12.2,20.0,-303.8,6.0,4.5,1.4,0x1a1228,{surf:'stone',role:'safeRock'}],
  ['solid',-12.2,24.2,-308,6.0,1.0,8,0x1a1228,{surf:'stone',role:'safeRock'}],
  // Secret notes exist at build time (visible, blocked by curtain until gust).
  ['note',-11.8,21.1,-306.5,false],
  ['note',-12.6,21.3,-309.2,false],
  ['crystalCluster',-13.2,20.0,-308,0.85,true],

  // Main chamber — Snoozle 3 in a cracked-open geode offset east so the center exit stays clear.
  ['solid',0,20.0,-326,16,0.4,32,0x2a1e38,{surf:'stone',role:'safeRock'}],
  ['solid',0,20.18,-328,7,0.06,14,0x5a48a0,{surf:'stone',role:'safeRock'}],
  ['solid',-10.5,20.0,-328,4.0,6.5,22,0x1a1228,{surf:'stone',role:'safeRock'}],
  ['solid',10.5,20.0,-328,4.0,6.5,22,0x1a1228,{surf:'stone',role:'safeRock'}],
  ['solid',0,26.6,-328,24,1.2,24,0x1a1228,{surf:'stone',role:'safeRock'}],
  ['crackedGeode',3.2,20.0,-330,1.55],
  ['crystalCluster',-6.5,20.0,-334,1.15,true],
  ['crystalCluster',-2.5,20.0,-322,0.55,false],
  ['crystalCluster',7.2,20.0,-338,0.55,false],
  ['crystalSparks',14,0,-328,9],

  // Exit corridor — same floor height as chamber so STEP is not required at the lip.
  ['solid',0,20.0,-350,12,0.4,20,0x2a1e38,{surf:'stone',role:'safeRock'}],
  ['solid',0,20.2,-348,5,0.06,10,0x3a2e55,{surf:'stone',role:'safeRock'}],
  ['solid',-7.5,20.0,-348,3.5,6.0,16,0x1a1228,{surf:'stone',role:'safeRock'}],
  ['solid',7.5,20.0,-348,3.5,6.0,16,0x1a1228,{surf:'stone',role:'safeRock'}],
  ['solid',0,26.5,-348,18,1.0,16,0x1a1228,{surf:'stone',role:'safeRock'}],
  ['solid',0,21.5,-360,12,0.4,14,0x2e2438,{surf:'stone',role:'safeRock'}],
  ['solid',0,21.7,-360,5,0.06,8,0x4a3a60,{surf:'stone',role:'safeRock'}],
  ['crystalCluster',-4.5,21.5,-356,0.9,true],
  ['crystalCluster',4.8,21.5,-358,0.5,false],

  // ========== AREA 5 — The Climb ==========
  // Quiet geode behind → huge hot caldera ahead. Elevation via stairs; Sky Blast clears flat gaps.
  // Floor height continues from the Hollow exit pad (y=21.5) so STEP can take the first stair.
  ['solid',0,21.5,-372,16,0.4,16,0x2a2420,{surf:'stone'}],
  ['solid',0,21.65,-372,6,0.06,10,0x4a3a32,{surf:'stone'}],
  ['crystalCluster',-5.5,21.5,-366,0.45,false],
  ['crystalCluster',5.2,21.5,-370,0.4,false],
  ['solid',-10,21.5,-378,4,10,12,0x1a1614,{surf:'stone'}],
  ['solid',10,21.5,-378,4,10,12,0x1a1614,{surf:'stone'}],
  ['solid',-10,28.0,-378,0.35,0.2,8,0xff6a20,{surf:'stone'}],
  ['solid',10,30.0,-378,0.35,0.2,8,0xff6a20,{surf:'stone'}],
  ['basaltRock',-7,21.5,-374,1.3],['basaltRock',7,21.5,-376,1.1],
  // Deep caldera lava under the Climb
  ['lava',0,6.0,-400,28,0.55,50],
  ['lava',-12,4.0,-450,10,0.55,100],
  ['lava',12,4.0,-450,10,0.55,100],
  ['lava',0,4.0,-500,26,0.55,120],
  ['lava',0,4.0,-560,26,0.55,100],

  // Base terrace + checkpoint, then stairs to first takeoff height
  ['solid',0,21.5,-382,16,0.4,14,0x2e2a28,{surf:'stone'}],
  ['solid',0,21.7,-382,5,0.06,8,0x5a3a28,{surf:'stone'}],
  ['cinder',-4,-380,'small'],
  ['basaltRock',6,21.5,-384,0.9],
  ['solid',0,22.5,-384,14,0.4,6,0x2e2a28,{surf:'stone'}],
  ['solid',0,23.5,-385,14,0.4,4,0x2e2a28,{surf:'stone'}],
  ['solid',0,24.0,-386,14,0.4,10,0x3a3538,{surf:'stone'}],
  ['steamVent',0,24.4,-386,1.4],
  ['solid',0,24.4,-390.7,12,0.06,0.35,0x8a2010,{surf:'stone'}],

  // Leap 1 — climbShelfA (flat 24.4)
  ['solid',0,24.0,-405.5,14,0.4,12,0x3a3538,{surf:'stone'}],
  ['solid',0,24.4,-399.65,12,0.06,0.35,0x8a2010,{surf:'stone'}],
  ['lava',0,22.0,-395.0,16,0.55,8.0],
  ['lava',0,-0.15,-395,28,0.55,24],
  ['solid',-8,24.0,-405,3,5,8,0x1a1614,{surf:'stone'}],
  ['solid',8,24.0,-405,3,5,8,0x1a1614,{surf:'stone'}],

  // Stairs to Shelf B
  ['solid',0,25.0,-414,12,0.4,6,0x2e2a28,{surf:'stone'}],
  ['solid',0,26.0,-416,12,0.4,4,0x2e2a28,{surf:'stone'}],
  ['solid',0,27.0,-418,12,0.4,4,0x2e2a28,{surf:'stone'}],
  ['solid',0,28.0,-422,14,0.4,10,0x3a3538,{surf:'stone'}],
  ['steamVent',0,28.4,-422,1.35],
  ['solid',0,28.4,-426.7,12,0.06,0.35,0x8a2010,{surf:'stone'}],

  // Leap 2 — climbShelfB into halfway rest (flat 28.4)
  ['solid',0,28.0,-441.5,16,0.4,12,0x4a3a32,{surf:'stone'}],
  ['solid',0,28.4,-435.65,14,0.06,0.35,0x8a2010,{surf:'stone'}],
  ['lava',0,26.0,-431.0,16,0.55,8.0],
  ['lava',0,-0.15,-431,28,0.55,24],
  ['solid',0,28.0,-448,18,0.4,14,0x4a3a32,{surf:'stone'}],
  ['solid',0,28.2,-448,6,0.06,8,0xffd24a,{surf:'stone'}],
  ['basaltRock',-7,28.0,-444,1.2],['basaltRock',6,28.0,-450,1.0],
  ['solid',-10,28.0,-448,3,6,10,0x1a1614,{surf:'stone'}],

  // Optional hard challenge — east spur off halfway (main route stays center −Z)
  ['solid',8.5,28.0,-441,7,0.4,8,0x3a3538,{surf:'stone'}],
  ['steamVent',10.5,28.4,-443,1.2],
  ['solid',11.0,28.5,-458,8,0.4,10,0x3a3538,{surf:'stone'}],
  ['lava',10.5,26.0,-450,8,0.55,10],
  ['lava',10.5,-0.15,-450,10,0.55,16],
  ['steamVent',11.0,28.9,-460,1.15],
  ['solid',11.0,28.5,-472,9,0.4,12,0x4a3a32,{surf:'stone'}],
  ['lava',11.0,26.0,-466,8,0.55,8],
  ['lava',11.0,-0.15,-466,10,0.55,14],
  ['wisp',[
    {x:9.5,y:29.6,z:-468},{x:11.5,y:29.8,z:-470},{x:10.0,y:29.6,z:-472}
  ],{speed:1.55}],
  ['wisp',[
    {x:12.5,y:29.7,z:-470},{x:12.0,y:29.9,z:-474},{x:11.0,y:29.7,z:-476}
  ],{speed:1.45}],
  ['note',10.2,29.2,-470.5,false],
  ['note',11.0,29.3,-472.0,false],
  ['note',11.8,29.2,-473.5,false],
  ['solid',6.0,28.0,-452,6,0.4,10,0x3a3538,{surf:'stone'}],
  ['solid',3.0,28.0,-450,6,0.4,8,0x3a3538,{surf:'stone'}],

  // Stairs to Shelf C
  ['solid',0,29.0,-454,12,0.4,6,0x2e2a28,{surf:'stone'}],
  ['solid',0,30.0,-456,12,0.4,4,0x2e2a28,{surf:'stone'}],
  ['solid',0,31.0,-458,12,0.4,4,0x2e2a28,{surf:'stone'}],
  ['solid',0,32.0,-460,14,0.4,8,0x3a3538,{surf:'stone'}],
  ['steamVent',0,32.4,-460,1.35],
  ['solid',0,32.4,-463.7,12,0.06,0.35,0x8a2010,{surf:'stone'}],

  // Leap 3 — climbShelfC (flat 32.4)
  ['solid',0,32.0,-479.5,14,0.4,12,0x3a3538,{surf:'stone'}],
  ['solid',0,32.4,-473.65,12,0.06,0.35,0x8a2010,{surf:'stone'}],
  ['lava',0,30.0,-469.0,16,0.55,8.0],
  ['lava',0,-0.15,-469,28,0.55,24],
  ['solid',-8,32.0,-479,3,5,8,0x1a1614,{surf:'stone'}],
  ['solid',8,32.0,-479,3,5,8,0x1a1614,{surf:'stone'}],

  // Stairs to Shelf D
  ['solid',0,33.0,-488,12,0.4,6,0x2e2a28,{surf:'stone'}],
  ['solid',0,34.0,-490,12,0.4,4,0x2e2a28,{surf:'stone'}],
  ['solid',0,35.0,-492,12,0.4,4,0x2e2a28,{surf:'stone'}],
  ['solid',0,36.0,-496,14,0.4,10,0x3a3538,{surf:'stone'}],
  ['steamVent',0,36.4,-496,1.4],
  ['solid',0,36.4,-500.7,12,0.06,0.35,0x8a2010,{surf:'stone'}],

  // Leap 4 — climbShelfD (flat 36.4)
  ['solid',0,36.0,-515.5,14,0.4,12,0x4a3a32,{surf:'stone'}],
  ['solid',0,36.4,-509.65,12,0.06,0.35,0x8a2010,{surf:'stone'}],
  ['lava',0,34.0,-505.0,16,0.55,8.0],
  ['lava',0,-0.15,-505,28,0.55,24],

  // Stairs to Shelf E
  ['solid',0,37.0,-524,12,0.4,6,0x2e2a28,{surf:'stone'}],
  ['solid',0,38.0,-526,12,0.4,4,0x2e2a28,{surf:'stone'}],
  ['solid',0,39.0,-528,12,0.4,4,0x2e2a28,{surf:'stone'}],
  ['solid',0,40.0,-532,14,0.4,10,0x3a3538,{surf:'stone'}],
  ['steamVent',0,40.4,-532,1.35],
  ['solid',0,40.4,-536.7,12,0.06,0.35,0x8a2010,{surf:'stone'}],

  // Leap 5 — climbShelfE (flat 40.4)
  ['solid',0,40.0,-551.5,14,0.4,12,0x3a3538,{surf:'stone'}],
  ['solid',0,40.4,-545.65,12,0.06,0.35,0x8a2010,{surf:'stone'}],
  ['lava',0,38.0,-541.0,16,0.55,8.0],
  ['lava',0,-0.15,-541,28,0.55,24],

  // Stairs to rim takeoff
  ['solid',0,41.0,-558,12,0.4,6,0x2e2a28,{surf:'stone'}],
  ['solid',0,42.0,-560,12,0.4,4,0x2e2a28,{surf:'stone'}],
  ['solid',0,43.0,-562,12,0.4,4,0x2e2a28,{surf:'stone'}],
  ['solid',0,44.0,-566,14,0.4,10,0x3a3538,{surf:'stone'}],
  ['steamVent',0,44.4,-566,1.4],
  ['solid',0,44.4,-570.7,12,0.06,0.35,0x8a2010,{surf:'stone'}],

  // Leap 6 — climbRimLeap onto crater rim (flat 44.4)
  ['solid',0,44.0,-585.5,16,0.4,12,0x4a3a32,{surf:'stone'}],
  ['solid',0,44.4,-579.65,14,0.06,0.35,0x8a2010,{surf:'stone'}],
  ['lava',0,42.0,-575.0,16,0.55,8.0],
  ['lava',0,-0.15,-575,28,0.55,24],

  // ========== AREA 6 — The Crater ==========
  // Broad rim summit: Snoozle 4 reward platform, Organ visible ahead (−Z).
  ['solid',0,44.0,-592,20,0.4,16,0x4a3a32,{surf:'stone'}],
  ['solid',0,44.2,-590,6,0.06,6,0xc45a28,{surf:'stone'}],
  ['solid',-5,44.0,-590,4.2,0.45,4.2,0xc45a28,{surf:'stone'}],
  ['solid',-5,44.45,-590,3.0,0.08,3.0,0xe07a3a,{surf:'stone'}],
  ['basaltRock',-9,44.0,-588,1.1],['basaltRock',6,44.0,-594,1.0],
  // Warm crater bowl walls (volcanic rock + glow, not plain black corridor slabs).
  ['solid',-14,44.0,-620,4,10,40,0x3a2a22,{surf:'stone'}],
  ['solid',14,44.0,-620,4,10,40,0x3a2a22,{surf:'stone'}],
  ['solid',-13.2,46.0,-620,0.35,0.2,30,0xff6a20,{surf:'stone'}],
  ['solid',13.2,48.0,-620,0.35,0.2,30,0xff6a20,{surf:'stone'}],
  ['solid',0,42.0,-655,28,8,8,0x2a1e18,{surf:'stone'}],
  ['lava',0,28.0,-640,22,0.5,28],
  ['lava',0,36.0,-652,14,0.45,10],
  // Short forgiving victory walk from Snoozle 4 to the keyboard.
  ['solid',0,44.0,-608,14,0.4,12,0x3a3538,{surf:'stone'}],
  ['solid',0,44.0,-620,14,0.4,10,0x4a3a32,{surf:'stone'}],
  ['solid',0,44.2,-614,5,0.06,8,0x5a4030,{surf:'stone'}],
  ['basaltRock',-6,44.0,-612,0.9],['basaltRock',7,44.0,-618,1.0],
  // Great Steam Organ + keyboard finish (registers FINISH).
  ['steamOrgan',0,44.4,-640]
]
};
