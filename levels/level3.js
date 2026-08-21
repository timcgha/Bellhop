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
// Phone feel pass still owns the next Sky Blast retune — do not change here.
skyBlast:{puffVMul:1.4,boostMax:12.5,boostDecay:1.6},
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
}],
route:{
  sideLava:{x:10,z:10},
  snoozle1:{x:-5,z:6},
  cinderTerrace:{x:-2,z:-24},
  skyCrate:{x:0,z:-52},
  snoozle2:{x:-9,z:-78},
  wispOpen:{x:6,z:-230},
  wispCorridor:{x:0,z:-248},
  geyser:{x:0,y:17.4,z:-216},
  endpoint:{x:0,y:20.4,z:-265}
},
fence:0x5a2e1a,
fenceSolids:[
  [0,0,30,36,2.2,0.7],[0,0,-278,36,2.2,0.7],
  [-18,0,-124,0.7,2.2,312],[18,0,-124,0.7,2.2,312]
],
pathTiles:[],
hedges:[],
checks:[[0,22],[0,-4,2.2],[0,-34,5.2],[0,-70,8.2],[0,-100,11.2],[0,-134,13.2],[0,-168,15.2],[0,-240,19.2]],
tower:{tx:0,tz:-260},
snoozleHomes:[[-3,-258],[3,-258],[-2,-266],[2,-266]],
snoozles:[[-5,0.55,6,0,false],[-9,8.55,-78,1,false]],
trees:[],
steps:[
  ['volcanoLandmark',0,0,-290,1.35],
  ['driftSparks',22],
  ['solid',0,28,-124,38,2,312,0xffc48a,{invisible:true}],
  ['solid',0,6,30,36.5,28,0.7,0x5a2e1a,{invisible:true}],
  ['solid',0,6,-278,36.5,28,0.7,0x5a2e1a,{invisible:true}],
  ['solid',-18,6,-124,0.7,28,312,0x5a2e1a,{invisible:true}],
  ['solid',18,6,-124,0.7,28,312,0x5a2e1a,{invisible:true}],

  // ========== AREA 1 — The Warm Slopes ==========
  ['solid',0,0,12,26,0.4,28,0x2a2218,{surf:'stone'}],
  ['solid',0,0.4,18,8,0.06,6,0x3a3028,{surf:'stone'}],
  ['solid',0,0.42,8,5.5,0.05,18,0x6a4a32,{surf:'stone'}],
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
  ['peakTuft',-7,2,1.2],['peakTuft',9,-2,0.85],
  ['basaltRock',-10,0,14,1.2],['basaltRock',11,0,4,1.0],['basaltRock',-8,0,-2,1.4],

  // ========== AREA 2 — The Cinder Steps ==========
  ['solid',0,3.5,-18,18,0.4,12,0x3a3538,{surf:'stone'}],
  ['solid',0,4.0,-18,6,0.08,4,0x8a4a2a,{surf:'stone'}],
  ['solid',-2,4.5,-26,16,0.4,12,0x4a3a35,{surf:'stone'}],
  ['cinder',-2,-26,'mid'],
  ['basaltRock',6,4.5,-22,0.9],['basaltRock',-8,4.5,-28,1.1],
  ['peakTuft',5,-20,0.7],
  // Teach gap A (flat 5.9 tops, safe floor below)
  ['solid',0,5.5,-34,16,0.4,8,0x5a4a40,{surf:'stone'}],
  ['solid',0,5.9,-37.7,14,0.06,0.35,0x8a2010,{surf:'stone'}],
  ['solid',0,5.5,-52,16,0.4,9,0x5a4a40,{surf:'stone'}],
  ['solid',0,5.9,-47.7,14,0.06,0.35,0x8a2010,{surf:'stone'}],
  ['solid',0,1.4,-42.5,18,0.4,12,0x3a3028,{surf:'stone'}],
  ['solid',12,2.0,-42,6,0.4,16,0x4a3a32,{surf:'stone'}],
  ['solid',12,3.5,-48,6,0.4,8,0x4a3a32,{surf:'stone'}],
  ['solid',12,5.0,-52,6,0.4,6,0x5a4a40,{surf:'stone'}],
  ['solid',8,5.5,-50,8,0.4,6,0x5a4a40,{surf:'stone'}],
  ['crate',0,5.9,-52,'sky'],
  // Teach gap B
  ['solid',0,6.5,-54,16,0.4,8,0x5a4a40,{surf:'stone'}],
  ['solid',0,6.9,-57.7,14,0.06,0.35,0x8a2010,{surf:'stone'}],
  ['solid',0,6.5,-72,16,0.4,9,0x5a4a40,{surf:'stone'}],
  ['solid',0,6.9,-67.7,14,0.06,0.35,0x8a2010,{surf:'stone'}],
  ['solid',0,2.2,-62.5,18,0.4,12,0x3a3028,{surf:'stone'}],
  ['solid',-12,3.5,-62,6,0.4,14,0x4a3a32,{surf:'stone'}],
  ['solid',-12,5.5,-68,6,0.4,8,0x5a4a40,{surf:'stone'}],
  // Snoozle 2 ledge
  ['solid',0,7.5,-70,10,0.4,6,0x5a4a40,{surf:'stone'}],
  ['steamVent',0,7.9,-70,1.35],
  ['solid',-9,8.0,-78,5.5,0.4,5.5,0xe07a3a,{surf:'stone'}],
  ['solid',-9,2.5,-74,8,0.4,10,0x3a3028,{surf:'stone'}],

  // First mandatory lava leap — SAME height 8.4 both sides
  ['solid',0,8.0,-72,16,0.4,10,0x5a4a40,{surf:'stone'}],
  ['solid',0,8.4,-76.7,14,0.06,0.35,0x8a2010,{surf:'stone'}],
  ['steamVent',0,8.4,-72,1.4],
  ['solid',0,8.0,-92.5,16,0.4,12,0x6a4a38,{surf:'stone'}],
  ['solid',0,8.4,-86.65,14,0.06,0.35,0x8a2010,{surf:'stone'}],
  ['solid',0,8.4,-90,5,0.08,2.2,0xffd24a,{surf:'stone'}],
  ['lava',0,7.2,-81.75,14,0.55,8.0],

  // ========== AREA 3 — stairs up, then flat leaps ==========
  // Stair climb to islandA height
  ['solid',0,9.0,-100,14,0.4,6,0x4a3a35,{surf:'stone'}],
  ['solid',0,10.0,-102,14,0.4,4,0x4a3a35,{surf:'stone'}],
  ['solid',0,11.0,-104,16,0.4,8,0x4a3a35,{surf:'stone'}],
  ['steamVent',0,11.4,-104,1.35],
  ['solid',0,11.4,-107.7,12,0.06,0.35,0x8a2010,{surf:'stone'}],
  ['solid',0,11.0,-123.5,12,0.4,12,0x5a4a40,{surf:'stone'}],
  ['solid',0,11.4,-117.65,10,0.06,0.35,0x8a2010,{surf:'stone'}],
  ['lava',0,10.2,-112.75,14,0.55,8.0],

  // Stair to islandB
  ['solid',0,12.0,-130,12,0.4,4,0x5a4a40,{surf:'stone'}],
  ['solid',0,13.0,-134,12,0.4,8,0x5a4a40,{surf:'stone'}],
  ['steamVent',0,13.4,-134,1.3],
  ['solid',0,13.4,-137.7,10,0.06,0.35,0x8a2010,{surf:'stone'}],
  ['solid',0,13.0,-153.5,12,0.4,12,0x5a4a40,{surf:'stone'}],
  ['solid',0,13.4,-147.65,10,0.06,0.35,0x8a2010,{surf:'stone'}],
  ['lava',0,12.2,-142.75,14,0.55,8.0],

  // Stair to wideRiver
  ['solid',0,14.0,-160,14,0.4,4,0x5a4a40,{surf:'stone'}],
  ['solid',0,15.0,-164,14,0.4,8,0x5a4a40,{surf:'stone'}],
  ['steamVent',0,15.4,-164,1.4],
  ['solid',0,15.4,-167.7,12,0.06,0.35,0x8a2010,{surf:'stone'}],
  ['solid',0,15.0,-184.5,16,0.4,14,0x6a4a38,{surf:'stone'}],
  ['solid',0,15.4,-177.65,14,0.06,0.35,0x8a2010,{surf:'stone'}],
  ['solid',0,15.4,-182,5,0.08,2.2,0xffd24a,{surf:'stone'}],
  ['lava',0,14.2,-172.75,16,0.6,8.0],

  // Stair to geyserApproach
  ['solid',0,16.0,-192,14,0.4,4,0x5a4a40,{surf:'stone'}],
  ['solid',0,17.0,-196,14,0.4,8,0x5a4a40,{surf:'stone'}],
  ['steamVent',0,17.4,-196,1.35],
  ['solid',0,17.4,-199.7,12,0.06,0.35,0x8a2010,{surf:'stone'}],
  ['solid',0,17.0,-215.5,14,0.4,12,0x6a4a38,{surf:'stone'}],
  ['solid',0,17.4,-209.65,12,0.06,0.35,0x8a2010,{surf:'stone'}],
  ['lava',0,16.2,-204.75,14,0.55,8.0],
  ['geyser',0,17.4,-216,1.2],
  ['solid',0,21.0,-220,12,0.4,8,0x5a4a40,{surf:'stone'}],

  // Open Wisp terrace
  ['solid',0,19.0,-228,16,0.4,6,0x4a3a35,{surf:'stone'}],
  ['solid',0,19.5,-234,18,0.4,14,0x4a3a35,{surf:'stone'}],
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
  ['solid',-5,19.5,-248,6,3.2,0.7,0x3a3538,{surf:'stone'}],
  ['solid',5,19.5,-248,6,3.2,0.7,0x3a3538,{surf:'stone'}],
  ['solid',0,19.5,-256,10,0.4,16,0x4a3a35,{surf:'stone'}],
  ['wisp',[
    {x:0,y:20.3,z:-246},{x:0,y:20.5,z:-250},{x:0,y:20.3,z:-254}
  ],{speed:1.6}],
  ['solid',0,20.0,-262,14,0.4,10,0x3a3538,{surf:'stone'}],
  ['basaltRock',-6,20.0,-258,1.2],['basaltRock',6,20.0,-260,1.0],
  ['protoEndpoint',0,20.0,-265],
  ['unfinishedFinish',0,-262,28]
]
};
