const LEVEL3={
id:'level3',
music:'meadow',
spawn:{x:0,y:0.4,z:12},
// Explicit Level 1 land profile — Stage 1 identity is Sky Blast, not new gravity.
physics:{
  speed:6.8,acc:44,dec:60,airAcc:20,
  grav:-30,maxFall:-32,jumpV:10.5,puffV:9.4,
  coyote:0.12,buffer:0.15,step:0.42,r:0.36,h:1.15,
  hoverHeld:1.0,hoverReleased:0.5,hoverDrift:-1.6,
  slamHang:0.14,slamFall:-34,slamRebound:8,
  jetTime:0.38,bonkR:2.05,bonkCD:0.5
},
// Stage 1 prototype values — do not retune in Stage 2; phone playtest owns the next pass.
skyBlast:{
  puffVMul:1.4,
  boostMax:12.5,
  boostDecay:1.6
},
// Safe-anchor settling (seconds of stable grounded stand before the anchor moves).
anchorSettle:0.22,
// Lava recovery owns motion for at most this long (must stay ≤ hurt inv duration 1.4).
lavaRecovery:0.42,
// Prototype gap the unpowered run cannot clear; powered running leap should.
protoGap:{nearZ:0,farZ:-10,farEndZ:-22},
// Mandatory Sky Blast crossings — CI iterates this list for vent/anchor/depth invariants.
mandatoryLeaps:[{
  id:'protoLavaCross',
  takeoff:{x:0,z:1.5,ventReach:5},
  landing:{x:0,z:-14,edgeZ:-10,farZ:-22,minDepth:8},
  nearSafe:{x:0,y:0.4,z:3},
  farSafe:{x:0,y:0.4,z:-14}
}],
fence:0x5a2e1a,
fenceSolids:[[0,0,16,26,1.2,0.6],[0,0,-28,26,1.2,0.6],[-13,0,-6,0.6,1.2,44],[13,0,-6,0.6,1.2,44]],
pathTiles:[],
hedges:[],
checks:[[0,12]],
tower:{tx:0,tz:0},
snoozleHomes:[[0,-24]],
snoozles:[],
trees:[],
steps:[
  // Broad start terrace
  ['solid',0,0,9,20,0.4,18,0xc45a28,{surf:'stone'}],
  // Far landing pad — deliberately generous depth beyond the arrival edge
  ['solid',0,0,-16,20,0.4,12,0xe07a3a,{surf:'stone'}],
  // Marked landing strip
  ['solid',0,0.4,-12,6,0.08,2.2,0xffd24a,{surf:'stone'}],
  // Side practice pads
  ['solid',-8,0,6,4,0.4,4,0xa84a22,{surf:'stone'}],
  ['solid',8,0,6,4,0.4,4,0xa84a22,{surf:'stone'}],
  // Ember-red edges at the mandatory leap lips (readable, still safe stone)
  ['solid',0,0.4,-0.15,18,0.06,0.35,0x8a2010,{surf:'stone'}],
  ['solid',0,0.4,-10.15,18,0.06,0.35,0x8a2010,{surf:'stone'}],
  // Small avoidable lava pool beside the path (teach touch safely)
  ['lava',7.5,-0.15,8,3.2,0.35,3.2],
  // Mandatory lava crossing in the gap (near pad ends ~0, far begins ~-10)
  ['lava',0,-0.2,-5,16,0.45,9.2],
  // Far-side lava puddle for far-anchor recovery tests (off the main landing line)
  ['lava',-7.5,-0.15,-16,3.0,0.35,3.0],
  // Sky Blast crate
  ['crate',0,0.4,8,'sky'],
  // Take-off vent for the mandatory leap
  ['steamVent',0,0.4,1.5,1.4],
  // Gloop for enemy power-loss tests
  ['gloop',-8,6,'small'],
  ['unfinishedFinish',0,-24,8]
]
};
