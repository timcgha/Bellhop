const LEVEL3={
id:'level3',
music:'meadow',
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
  // ========== AREA 5 — The Climb (mandatory powered leaps) ==========
  // Stairs carry most height; leaps stay near-flat so tap-puff + glide still clear.
  id:'climb1',
  takeoff:{x:0,z:-390,ventReach:5},
  landing:{x:0,z:-412,edgeZ:-404,farZ:-420,minDepth:12},
  nearSafe:{x:0,y:24.4,z:-388},
  farSafe:{x:0,y:24.8,z:-412}
},{
  id:'climb2',
  takeoff:{x:0,z:-428,ventReach:5},
  landing:{x:0,z:-450,edgeZ:-442,farZ:-458,minDepth:12},
  nearSafe:{x:0,y:27.0,z:-426},
  farSafe:{x:0,y:27.4,z:-450}
},{
  id:'climb3',
  takeoff:{x:0,z:-466,ventReach:5},
  landing:{x:0,z:-488,edgeZ:-480,farZ:-496,minDepth:12},
  nearSafe:{x:0,y:29.6,z:-464},
  farSafe:{x:0,y:30.0,z:-488}
},{
  id:'climb4',
  takeoff:{x:0,z:-504,ventReach:5},
  landing:{x:0,z:-526,edgeZ:-518,farZ:-534,minDepth:12},
  nearSafe:{x:0,y:32.2,z:-502},
  farSafe:{x:0,y:32.6,z:-526}
},{
  id:'climb5',
  takeoff:{x:0,z:-542,ventReach:5},
  landing:{x:0,z:-564,edgeZ:-556,farZ:-572,minDepth:12},
  nearSafe:{x:0,y:34.8,z:-540},
  farSafe:{x:0,y:35.2,z:-564}
},{
  id:'climb6',
  takeoff:{x:0,z:-580,ventReach:5},
  landing:{x:0,z:-602,edgeZ:-594,farZ:-610,minDepth:12},
  nearSafe:{x:0,y:37.4,z:-578},
  farSafe:{x:0,y:38.0,z:-602}
}],
route:{
  sideLava:{x:10,z:10},
  snoozle1:{x:-5,z:6},
  cinderTerrace:{x:-2,z:-24},
  skyCrates:[
    {x:9,z:-50,area:2,note:'teaching',y:5.9},
    {x:5,z:-70,area:2,note:'preFirstLava',y:8.4},
    {x:-5,z:-90,area:3,note:'afterFirstLava',y:8.4},
    {x:4,z:-121,area:3,note:'betweenIslands',y:11.4},
    {x:-5,z:-182,area:3,note:'postWideRiver',y:15.4},
    {x:5,z:-194,area:3,note:'preGeyser',y:17.4}
  ],
  skyCrate:{x:9,z:-50},
  snoozle2:{x:-9,z:-78},
  wispOpen:{x:6,z:-230},
  wispCorridor:{x:0,z:-248},
  geyser:{x:0,y:17.4,z:-216},
  // Stage 4 temporary endpoint was at z:-265 (blocked mouth). Stage 5 opens that mouth.
  caveMouth:{x:0,y:20.0,z:-268},
  geodeHollow:{zEnter:-266,zExit:-372,halfW:14},
  snoozle3:{x:3.2,z:-330},
  secretCurtain:{x:-7.0,y:20.0,z:-308},
  secretAlcove:{x:-12.2,z:-308},
  climbBase:{x:0,y:22.4,z:-382},
  climbHalf:{x:0,y:30.0,z:-488},
  climbRim:{x:0,y:38.0,z:-602},
  climbCinder:{x:-5,z:-378},
  challengeBranch:{x:9,y:30.0,z:-488},
  challengeReward:{x:14,y:33.4,z:-542},
  challengeWisps:[{x:13.2,z:-518},{x:14,z:-524}],
  climbExit:{x:0,y:38.0,z:-602},
  endpoint:{x:0,y:38.0,z:-608}
},
fence:0x5a2e1a,
fenceSolids:[
  [0,0,30,36,2.2,0.7],[0,0,-640,36,2.2,0.7],
  [-18,0,-300,0.7,2.2,680],[18,0,-300,0.7,2.2,680]
],
pathTiles:[],
hedges:[],
checks:[[0,22],[0,-4,2.2],[0,-34,5.2],[0,-70,8.2],[0,-100,11.2],[0,-134,13.2],[0,-168,15.2],[0,-240,19.2],[0,-272,20.2],[0,-350,21.2],[0,-382,22.4],[0,-488,30.0]],
tower:{tx:0,tz:-260},
// Homes sit on the open approach plaza. Snoozle 3 follows a corridor path out of the Hollow
// before the final zoom so it does not cut through cave walls (no shared wake special-case).
snoozleHomes:[
  [-3,-258],
  [3,-258],
  [-4,-260,[[3.2,23.5,-318],[0,22.8,-300],[0,22.0,-280],[0,21.5,-272]]],
  [2,-266]
],
snoozles:[[-5,0.55,6,0,false],[-9,8.55,-78,1,false],[3.2,20.55,-330,2,false]],
trees:[],
steps:[
  ['volcanoLandmark',0,0,-290,1.35],
  ['driftSparks',22],
  // Invisible ceiling raised for Climb rim + Stage 7 Organ/fireworks headroom.
  ['solid',0,68,-300,38,2,680,0xffc48a,{invisible:true}],
  ['solid',0,6,30,36.5,28,0.7,0x5a2e1a,{invisible:true}],
  ['solid',0,6,-640,36.5,28,0.7,0x5a2e1a,{invisible:true}],
  ['solid',-18,6,-300,0.7,28,680,0x5a2e1a,{invisible:true}],
  ['solid',18,6,-300,0.7,28,680,0x5a2e1a,{invisible:true}],

  // ========== AREA 1 — The Warm Slopes ==========
  // Volcanic sand / dark warm earth — green is accent tufts only, not the floor.
  ['solid',0,0,12,26,0.4,28,0x2a2218,{surf:'stone'}],
  ['solid',0,0.4,18,8,0.06,6,0x3a2a22,{surf:'stone'}],
  ['solid',0,0.42,8,5.5,0.05,18,0x4a3228,{surf:'stone'}],
  ['solid',6,1.2,0,10,0.4,8,0x3a3530,{surf:'stone'}],
  ['solid',-4,2.0,-8,12,0.4,8,0x4a3a32,{surf:'stone'}],
  ['solid',-5,0,6,4.5,0.45,4.5,0xc45a28,{surf:'stone'}],
  ['solid',-5,0.45,6,3.2,0.08,3.2,0xe07a3a,{surf:'stone'}],
  ['lava',10,-0.15,10,4.0,0.4,4.0],
  ['salamander',4,14,{}],
  ['salamander',-8,10,{path:[{x:-9,z:11},{x:-6,z:9},{x:-8,z:12}]}],
  ['salamander',7,4,{note:true}],
  ['note',3,1.1,16,false],
  ['note',-6,1.0,12,false],
  ['peakTuft',8,18,1.1],['peakTuft',-9,16,0.9],['peakTuft',5,6,1.0],
  ['basaltRock',-10,0,14,1.2],['basaltRock',11,0,4,1.0],['basaltRock',-8,0,-2,1.4],

  // ========== AREA 2 — The Cinder Steps ==========
  ['solid',0,3.5,-18,18,0.4,12,0x2e2a2c,{surf:'stone'}],
  ['solid',0,4.0,-18,6,0.08,4,0x8a4a2a,{surf:'stone'}],
  ['solid',-2,4.5,-26,16,0.4,12,0x3a322e,{surf:'stone'}],
  ['cinder',-2,-26,'mid'],
  ['basaltRock',6,4.5,-22,0.9],['basaltRock',-8,4.5,-28,1.1],
  ['peakTuft',5,-20,0.55],
  // Teach gap A (flat 5.9 tops, safe volcanic floor below)
  ['solid',0,5.5,-34,16,0.4,8,0x3a3538,{surf:'stone'}],
  ['solid',0,5.9,-37.7,14,0.06,0.35,0x8a2010,{surf:'stone'}],
  ['solid',0,5.5,-52,16,0.4,9,0x3a3538,{surf:'stone'}],
  ['solid',0,5.9,-47.7,14,0.06,0.35,0x8a2010,{surf:'stone'}],
  ['solid',0,1.4,-42.5,18,0.4,12,0x2a2420,{surf:'stone'}],
  ['solid',12,2.0,-42,6,0.4,16,0x3a322e,{surf:'stone'}],
  ['solid',12,3.5,-48,6,0.4,8,0x3a322e,{surf:'stone'}],
  ['solid',12,5.0,-52,6,0.4,6,0x3a3538,{surf:'stone'}],
  ['solid',8,5.5,-50,8,0.4,6,0x3a3538,{surf:'stone'}],
  // Side ledge — clear of the overlapping teach-B pad above the center
  ['crate',9,5.9,-50,'sky'],
  // Teach gap B
  ['solid',0,6.5,-54,16,0.4,8,0x3a3538,{surf:'stone'}],
  ['solid',0,6.9,-57.7,14,0.06,0.35,0x8a2010,{surf:'stone'}],
  ['solid',0,6.5,-72,16,0.4,9,0x3a3538,{surf:'stone'}],
  ['solid',0,6.9,-67.7,14,0.06,0.35,0x8a2010,{surf:'stone'}],
  ['solid',0,2.2,-62.5,18,0.4,12,0x2a2420,{surf:'stone'}],
  ['solid',-12,3.5,-62,6,0.4,14,0x3a322e,{surf:'stone'}],
  ['solid',-12,5.5,-68,6,0.4,8,0x3a3538,{surf:'stone'}],
  // Snoozle 2 ledge
  ['solid',0,7.5,-70,10,0.4,6,0x3a3538,{surf:'stone'}],
  ['steamVent',0,7.9,-70,1.35],
  ['solid',-9,8.0,-78,5.5,0.4,5.5,0xe07a3a,{surf:'stone'}],
  ['solid',-9,2.5,-74,8,0.4,10,0x2a2420,{surf:'stone'}],

  // First mandatory lava leap — SAME height 8.4 both sides
  ['solid',0,8.0,-72,16,0.4,10,0x3a3538,{surf:'stone'}],
  ['solid',0,8.4,-76.7,14,0.06,0.35,0x8a2010,{surf:'stone'}],
  ['steamVent',0,8.4,-72,1.4],
  // On takeoff top — not buried under a higher pad
  ['crate',5,8.4,-70,'sky'],
  ['solid',0,8.0,-92.5,16,0.4,12,0x4a3a32,{surf:'stone'}],
  ['solid',0,8.4,-86.65,14,0.06,0.35,0x8a2010,{surf:'stone'}],
  ['solid',0,8.4,-90,5,0.08,2.2,0xffd24a,{surf:'stone'}],
  ['lava',0,6.0,-81.75,16,0.55,9.0],
  // Basin under / beside first leap — miss the elevated route, hit lava
  ['lava',0,-0.15,-82,30,0.55,32],
  ['lava',-13,-0.15,-82,10,0.55,26],
  ['lava',13,-0.15,-82,10,0.55,26],
  // Mid landing pad (clear of stair overlap at z≈-98)
  ['crate',-5,8.4,-90,'sky'],

  // ========== AREA 3 — stairs up, then flat leaps ==========
  // Stair climb to islandA height
  ['solid',0,9.0,-100,14,0.4,6,0x2e2a28,{surf:'stone'}],
  ['solid',0,10.0,-102,14,0.4,4,0x2e2a28,{surf:'stone'}],
  ['solid',0,11.0,-104,16,0.4,8,0x2e2a28,{surf:'stone'}],
  ['steamVent',0,11.4,-104,1.35],
  ['solid',0,11.4,-107.7,12,0.06,0.35,0x8a2010,{surf:'stone'}],
  ['solid',0,11.0,-123.5,12,0.4,12,0x3a3538,{surf:'stone'}],
  ['solid',0,11.4,-117.65,10,0.06,0.35,0x8a2010,{surf:'stone'}],
  ['lava',0,9.0,-112.75,16,0.55,9.0],
  ['lava',0,-0.15,-113,28,0.55,28],
  ['lava',-12,-0.15,-113,9,0.55,24],
  ['lava',12,-0.15,-113,9,0.55,24],
  ['crate',4,11.4,-121,'sky'],

  // Stair to islandB
  ['solid',0,12.0,-130,12,0.4,4,0x3a3538,{surf:'stone'}],
  ['solid',0,13.0,-134,12,0.4,8,0x3a3538,{surf:'stone'}],
  ['steamVent',0,13.4,-134,1.3],
  ['solid',0,13.4,-137.7,10,0.06,0.35,0x8a2010,{surf:'stone'}],
  ['solid',0,13.0,-153.5,12,0.4,12,0x3a3538,{surf:'stone'}],
  ['solid',0,13.4,-147.65,10,0.06,0.35,0x8a2010,{surf:'stone'}],
  ['lava',0,11.0,-142.75,16,0.55,9.0],
  ['lava',0,-0.15,-143,28,0.55,28],
  ['lava',-12,-0.15,-143,9,0.55,24],
  ['lava',12,-0.15,-143,9,0.55,24],

  // Stair to wideRiver
  ['solid',0,14.0,-160,14,0.4,4,0x3a3538,{surf:'stone'}],
  ['solid',0,15.0,-164,14,0.4,8,0x3a3538,{surf:'stone'}],
  ['steamVent',0,15.4,-164,1.4],
  ['solid',0,15.4,-167.7,12,0.06,0.35,0x8a2010,{surf:'stone'}],
  ['solid',0,15.0,-184.5,16,0.4,14,0x4a3a32,{surf:'stone'}],
  ['solid',0,15.4,-177.65,14,0.06,0.35,0x8a2010,{surf:'stone'}],
  ['solid',0,15.4,-182,5,0.08,2.2,0xffd24a,{surf:'stone'}],
  ['lava',0,13.0,-172.75,18,0.6,10.0],
  ['lava',0,-0.15,-173,32,0.55,32],
  ['lava',-13,-0.15,-173,10,0.55,28],
  ['lava',13,-0.15,-173,10,0.55,28],
  ['crate',-5,15.4,-182,'sky'],

  // Stair to geyserApproach
  ['solid',0,16.0,-192,14,0.4,4,0x3a3538,{surf:'stone'}],
  ['solid',0,17.0,-196,14,0.4,8,0x3a3538,{surf:'stone'}],
  ['steamVent',0,17.4,-196,1.35],
  ['solid',0,17.4,-199.7,12,0.06,0.35,0x8a2010,{surf:'stone'}],
  ['solid',0,17.0,-215.5,14,0.4,12,0x4a3a32,{surf:'stone'}],
  ['solid',0,17.4,-209.65,12,0.06,0.35,0x8a2010,{surf:'stone'}],
  ['lava',0,15.0,-204.75,16,0.55,9.0],
  ['lava',0,-0.15,-205,30,0.55,30],
  ['lava',-12,-0.15,-205,10,0.55,26],
  ['lava',12,-0.15,-205,10,0.55,26],
  ['crate',5,17.4,-194,'sky'],
  ['geyser',0,17.4,-216,1.2],
  ['solid',0,21.0,-220,12,0.4,8,0x3a3538,{surf:'stone'}],
  // Low basin under geyser / approach / later elevated route
  ['lava',-10,-0.15,-218,12,0.55,18],
  ['lava',10,-0.15,-218,12,0.55,18],
  ['lava',0,-0.15,-235,30,0.55,36],
  ['lava',-12,-0.15,-248,10,0.55,28],
  ['lava',12,-0.15,-248,10,0.55,28],

  // Open Wisp terrace
  ['solid',0,19.0,-228,16,0.4,6,0x2e2a28,{surf:'stone'}],
  ['solid',0,19.5,-234,18,0.4,14,0x2e2a28,{surf:'stone'}],
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
  ['solid',-5,19.5,-248,6,3.2,0.7,0x2a2624,{surf:'stone'}],
  ['solid',5,19.5,-248,6,3.2,0.7,0x2a2624,{surf:'stone'}],
  ['solid',0,19.5,-256,10,0.4,16,0x2e2a28,{surf:'stone'}],
  ['wisp',[
    {x:0,y:20.3,z:-246},{x:0,y:20.5,z:-250},{x:0,y:20.3,z:-254}
  ],{speed:1.6}],
  ['solid',0,20.0,-262,14,0.4,10,0x2a2624,{surf:'stone'}],
  ['basaltRock',-6,20.0,-258,1.2],['basaltRock',6,20.0,-260,1.0],
  ['salamander',5,-260,{}],

  // ========== AREA 4 — The Geode Hollow ==========
  // Open mouth (Stage 4 blocker removed). Cool register begins here.
  ['geodeMouth',0,20.0,-268],
  ['solid',0,20.0,-278,12,0.4,18,0x2a1e38,{surf:'stone'}],
  ['solid',0,20.15,-278,6,0.06,14,0x3a2e55,{surf:'stone'}],
  // Entrance corridor walls / ceiling
  ['solid',-8.5,20.0,-278,3.5,6.5,16,0x1a1228,{surf:'stone'}],
  ['solid',8.5,20.0,-278,3.5,6.5,16,0x1a1228,{surf:'stone'}],
  ['solid',0,26.2,-278,20,1.2,18,0x1a1228,{surf:'stone'}],
  ['crystalCluster',-5.5,20.0,-274,1.1,true],
  ['crystalCluster',5.8,20.0,-280,0.95,true],
  ['crystalCluster',-4.2,20.0,-288,0.55,false],
  ['crystalCluster',4.5,20.0,-292,0.5,false],
  ['crystalSparks',10,0,-290,7],

  // Mid path — east wall continuous; west wall gapped for the steam-curtain secret
  ['solid',0,20.0,-300,14,0.4,20,0x2a1e38,{surf:'stone'}],
  ['solid',0,20.15,-300,5.5,0.06,16,0x4a3a78,{surf:'stone'}],
  ['solid',8.5,20.0,-300,3.5,6.5,20,0x1a1228,{surf:'stone'}],
  // West wall split: gap around z=-308 for the side steam curtain
  ['solid',-8.5,20.0,-294,3.5,6.5,10,0x1a1228,{surf:'stone'}],
  ['solid',-8.5,20.0,-322,3.5,6.5,12,0x1a1228,{surf:'stone'}],
  ['solid',0,26.4,-304,22,1.2,28,0x1a1228,{surf:'stone'}],
  ['crystalCluster',6.2,20.0,-302,1.2,true],
  ['crystalCluster',-3.5,20.0,-318,0.7,false],

  // Side secret — steam curtain fills the west-wall gap (optional; main route stays center).
  ['steamCurtain',-7.0,20.0,-308,5.0,3.8,'x'],
  ['solid',-12.2,20.0,-308,6.0,0.4,8,0x2a1e38,{surf:'stone'}],
  ['solid',-15.0,20.0,-308,1.4,4.5,8,0x1a1228,{surf:'stone'}],
  ['solid',-12.2,20.0,-312.2,6.0,4.5,1.4,0x1a1228,{surf:'stone'}],
  ['solid',-12.2,20.0,-303.8,6.0,4.5,1.4,0x1a1228,{surf:'stone'}],
  ['solid',-12.2,24.2,-308,6.0,1.0,8,0x1a1228,{surf:'stone'}],
  // Secret notes exist at build time (visible, blocked by curtain until gust).
  ['note',-11.8,21.1,-306.5,false],
  ['note',-12.6,21.3,-309.2,false],
  ['crystalCluster',-13.2,20.0,-308,0.85,true],

  // Main chamber — Snoozle 3 in a cracked-open geode offset east so the center exit stays clear.
  ['solid',0,20.0,-328,16,0.4,22,0x2a1e38,{surf:'stone'}],
  ['solid',0,20.18,-328,7,0.06,14,0x5a48a0,{surf:'stone'}],
  ['solid',-10.5,20.0,-328,4.0,6.5,22,0x1a1228,{surf:'stone'}],
  ['solid',10.5,20.0,-328,4.0,6.5,22,0x1a1228,{surf:'stone'}],
  ['solid',0,26.6,-328,24,1.2,24,0x1a1228,{surf:'stone'}],
  ['crackedGeode',3.2,20.0,-330,1.55],
  ['crystalCluster',-6.5,20.0,-334,1.15,true],
  ['crystalCluster',-2.5,20.0,-322,0.55,false],
  ['crystalCluster',7.2,20.0,-338,0.55,false],
  ['crystalSparks',14,0,-328,9],

  // Exit corridor — cool Hollow opens outward onto the caldera Climb.
  ['solid',0,20.5,-348,12,0.4,14,0x2a1e38,{surf:'stone'}],
  ['solid',0,20.7,-348,5,0.06,10,0x3a2e55,{surf:'stone'}],
  ['solid',-7.5,20.5,-348,3.5,6.0,16,0x1a1228,{surf:'stone'}],
  ['solid',7.5,20.5,-348,3.5,6.0,16,0x1a1228,{surf:'stone'}],
  ['solid',0,26.5,-348,18,1.0,16,0x1a1228,{surf:'stone'}],
  ['solid',0,21.5,-360,12,0.4,12,0x2e2438,{surf:'stone'}],
  ['solid',0,21.7,-360,5,0.06,8,0x4a3a60,{surf:'stone'}],
  ['crystalCluster',-4.5,21.5,-356,0.9,true],
  ['crystalCluster',4.8,21.5,-358,0.5,false],

  // ========== AREA 5 — The Climb ==========
  // Transition reveal: cool corridor behind, hot caldera ahead, lava far below.
  ['solid',0,21.5,-370,14,0.4,10,0x322830,{surf:'stone'}],
  ['solid',0,21.7,-370,5,0.06,6,0x5a3a48,{surf:'stone'}],
  ['crystalCluster',-5.2,21.5,-366,0.65,false],
  ['crystalCluster',4.6,21.5,-372,0.45,false],
  ['lava',0,8.0,-376,16,0.45,10],
  ['lava',0,-0.2,-500,34,0.55,300],
  ['lava',-12,-0.2,-520,10,0.55,260],
  ['lava',12,-0.2,-520,10,0.55,260],

  // Climb base terrace — checkpoint before first serious leap.
  ['solid',0,22.0,-382,18,0.4,16,0x3a3538,{surf:'stone'}],
  ['solid',0,22.4,-382,7,0.08,8,0x8a4a2a,{surf:'stone'}],
  ['basaltRock',-7.5,22.0,-376,1.15],['basaltRock',7.2,22.0,-380,0.95],
  ['cinder',-5,-378,'small'],
  ['solid',-3,22.42,-384,2.4,0.04,0.18,0xff6a18,{surf:'stone'}],
  // Stair up to leap-1 takeoff (height via stairs, not the leap)
  ['solid',0,23.0,-386,16,0.4,8,0x2e2a28,{surf:'stone'}],
  ['solid',0,24.0,-390,16,0.4,10,0x3a3538,{surf:'stone'}],
  ['solid',0,24.4,-393.7,14,0.06,0.35,0x8a2010,{surf:'stone'}],
  ['steamVent',0,24.4,-390,1.4],

  // Leap 1 — near-flat powered gap
  ['lava',0,20.0,-400,16,0.55,9.0],
  ['solid',0,24.4,-412,14,0.4,16,0x3a3538,{surf:'stone'}],
  ['solid',0,24.8,-404.15,12,0.06,0.35,0x8a2010,{surf:'stone'}],
  ['solid',0,24.8,-412,5,0.08,2.4,0xffd24a,{surf:'stone'}],
  ['basaltRock',5.5,24.4,-410,0.85],
  // Stair to leap 2
  ['solid',0,25.5,-420,12,0.4,6,0x2e2a28,{surf:'stone'}],
  ['solid',0,26.6,-428,14,0.4,10,0x2e2a28,{surf:'stone'}],
  ['steamVent',0,27.0,-428,1.35],
  ['solid',0,27.0,-431.7,12,0.06,0.35,0x8a2010,{surf:'stone'}],

  // Leap 2
  ['lava',0,22.0,-438,16,0.55,9.0],
  ['solid',0,27.0,-450,14,0.4,16,0x3a3538,{surf:'stone'}],
  ['solid',0,27.4,-442.15,12,0.06,0.35,0x8a2010,{surf:'stone'}],
  ['solid',3,27.42,-448,2.2,0.04,0.16,0xff6a18,{surf:'stone'}],
  ['solid',0,28.2,-458,12,0.4,6,0x2e2a28,{surf:'stone'}],
  ['solid',0,29.2,-466,14,0.4,10,0x2e2a28,{surf:'stone'}],
  ['steamVent',0,29.6,-466,1.35],
  ['solid',0,29.6,-469.7,12,0.06,0.35,0x8a2010,{surf:'stone'}],

  // Leap 3 — to halfway terrace
  ['lava',0,24.0,-476,16,0.55,9.0],
  ['solid',0,29.6,-488,18,0.4,16,0x4a3a32,{surf:'stone'}],
  ['solid',0,30.0,-480.15,14,0.06,0.35,0x8a2010,{surf:'stone'}],
  ['solid',0,30.0,-488,6,0.08,3.5,0xffd24a,{surf:'stone'}],
  ['basaltRock',-6.5,29.6,-484,1.1],['basaltRock',6.8,29.6,-490,0.9],
  ['solid',-4,30.02,-490,2.6,0.04,0.18,0xff9a3c,{surf:'stone'}],

  // ---- Optional hard challenge (east spur; ignorable) ----
  ['solid',9,29.6,-488,10,0.4,10,0x3a3538,{surf:'stone'}],
  ['solid',12,29.6,-496,8,0.4,10,0x3a3538,{surf:'stone'}],
  ['steamVent',12,30.0,-496,1.2],
  ['solid',12,30.0,-499.7,6,0.06,0.35,0x8a2010,{surf:'stone'}],
  ['lava',12,25.0,-508,10,0.55,10.0],
  ['solid',14,31.4,-520,9,0.4,12,0x3a3538,{surf:'stone'}],
  ['solid',14,31.8,-514.15,7,0.06,0.35,0x8a2010,{surf:'stone'}],
  ['steamVent',14,32.2,-526,1.2],
  ['solid',14,31.8,-526,8,0.4,8,0x2e2a28,{surf:'stone'}],
  ['solid',14,32.2,-528.7,6,0.06,0.35,0x8a2010,{surf:'stone'}],
  ['wisp',[
    {x:13.2,y:32.6,z:-518},{x:14.5,y:32.8,z:-520},{x:13.2,y:32.6,z:-522}
  ],{speed:1.7}],
  ['wisp',[
    {x:13.5,y:33.0,z:-524},{x:14.8,y:33.2,z:-526},{x:13.5,y:33.0,z:-528}
  ],{speed:1.55}],
  ['lava',14,27.0,-536,10,0.55,10.0],
  ['solid',14,33.0,-542,10,0.4,12,0x4a3a32,{surf:'stone'}],
  ['solid',14,33.4,-536.15,8,0.06,0.35,0x8a2010,{surf:'stone'}],
  ['note',13.2,34.3,-540.0,false],
  ['note',14.0,34.5,-542.0,false],
  ['note',14.8,34.3,-544.0,false],
  ['basaltRock',16.5,33.0,-540,0.8],
  ['solid',11,33.0,-534,7,0.4,8,0x3a3538,{surf:'stone'}],
  ['solid',8,32.8,-528,7,0.4,8,0x3a3538,{surf:'stone'}],
  ['solid',5,32.6,-526,8,0.4,10,0x3a3538,{surf:'stone'}],

  // Leap 4 — upper climb
  ['solid',0,30.8,-496,12,0.4,6,0x2e2a28,{surf:'stone'}],
  ['solid',0,31.8,-504,14,0.4,10,0x2e2a28,{surf:'stone'}],
  ['steamVent',0,32.2,-504,1.4],
  ['solid',0,32.2,-507.7,12,0.06,0.35,0x8a2010,{surf:'stone'}],
  ['lava',0,27.0,-514,16,0.55,9.0],
  ['solid',0,32.2,-526,14,0.4,16,0x3a3538,{surf:'stone'}],
  ['solid',0,32.6,-518.15,12,0.06,0.35,0x8a2010,{surf:'stone'}],
  ['solid',-3,32.62,-524,2.0,0.04,0.16,0xff6a18,{surf:'stone'}],

  // Leap 5
  ['solid',0,33.4,-534,12,0.4,6,0x2e2a28,{surf:'stone'}],
  ['solid',0,34.4,-542,14,0.4,10,0x2e2a28,{surf:'stone'}],
  ['steamVent',0,34.8,-542,1.35],
  ['solid',0,34.8,-545.7,12,0.06,0.35,0x8a2010,{surf:'stone'}],
  ['lava',0,29.0,-552,16,0.55,9.0],
  ['solid',0,34.8,-564,14,0.4,16,0x3a3538,{surf:'stone'}],
  ['solid',0,35.2,-556.15,12,0.06,0.35,0x8a2010,{surf:'stone'}],
  ['basaltRock',-5.5,34.8,-562,1.0],

  // Leap 6 — final leap to crater rim
  ['solid',0,36.0,-572,12,0.4,6,0x2e2a28,{surf:'stone'}],
  ['solid',0,37.0,-580,14,0.4,10,0x2e2a28,{surf:'stone'}],
  ['steamVent',0,37.4,-580,1.35],
  ['solid',0,37.4,-583.7,12,0.06,0.35,0x8a2010,{surf:'stone'}],
  ['lava',0,32.0,-590,16,0.55,9.0],
  ['solid',0,37.6,-602,16,0.4,16,0x4a3a32,{surf:'stone'}],
  ['solid',0,38.0,-594.15,14,0.06,0.35,0x8a2010,{surf:'stone'}],
  ['solid',0,38.0,-602,7,0.08,4.5,0xffd24a,{surf:'stone'}],
  ['basaltRock',-6.5,37.6,-598,1.05],['basaltRock',6.8,37.6,-606,0.95],
  ['solid',2,38.02,-604,2.4,0.04,0.18,0xff9a3c,{surf:'stone'}],
  // Rim silhouette threshold — soft return, not a win. No Organ / Snoozle 4 yet.
  ['protoEndpoint',0,38.0,-608,'rim'],
  ['unfinishedFinish',0,-604,50]
]
};
