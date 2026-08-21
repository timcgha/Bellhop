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
// Safe-anchor settling (seconds of continuous grounded stand on eligible safe ground).
anchorSettle:0.22,
// Horizontal inset from lava AABBs required before an anchor may update (not a speed gate).
anchorClear:0.85,
// Lava recovery owns motion for at most this long (must stay ≤ hurt inv duration 1.4).
lavaRecovery:0.42,
// Prototype gap the unpowered run cannot clear; powered running leap should.
protoGap:{nearZ:0,farZ:-10,farEndZ:-22},
// Mandatory Sky Blast crossings — CI iterates this list for vent/anchor/depth invariants.
// Coordinates must match the prototype solids/lava below: near pad ends ~z=0, far pad
// spans z=-22..-10 (edgeZ/farZ), gap lava currently z≈-8.8..-0.4, vent at takeoff.
mandatoryLeaps:[{
  id:'protoLavaCross',
  takeoff:{x:0,z:1.5,ventReach:5},
  landing:{x:0,z:-14,edgeZ:-10,farZ:-22,minDepth:8},
  nearSafe:{x:0,y:0.4,z:3},
  farSafe:{x:0,y:0.4,z:-14}
}],
fence:0x5a2e1a,
fenceSolids:[[0,0,16,30,1.2,0.6],[0,0,-28,30,1.2,0.6],[-15,0,-6,0.6,1.2,44],[15,0,-6,0.6,1.2,44]],
pathTiles:[],
hedges:[],
checks:[[0,12]],
tower:{tx:0,tz:0},
snoozleHomes:[[0,-24]],
snoozles:[],
trees:[],
// Stage 3 temporary note set for held-note CI — not the final production count.
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
  // Stage 3 systems terrace (away from the lava gap)
  ['solid',-10,0,12,8,0.4,6,0xb85a2a,{surf:'stone'}],
  ['solid',10,0,12,8,0.4,6,0xb85a2a,{surf:'stone'}],
  // Ember-red edges at the mandatory leap lips (readable, still safe stone)
  ['solid',0,0.4,-0.15,18,0.06,0.35,0x8a2010,{surf:'stone'}],
  ['solid',0,0.4,-10.15,18,0.06,0.35,0x8a2010,{surf:'stone'}],
  // Small avoidable lava pool beside the path (teach touch safely)
  ['lava',7.5,-0.15,8,3.2,0.35,3.2],
  // Mandatory lava crossing in the gap (near pad ends ~0, far begins ~-10).
  // Far edge stops short of the landing pad so a clean powered leap is not a skim-hit.
  ['lava',0,-0.2,-4.6,16,0.45,8.4],
  // Far-side lava puddle for far-anchor recovery tests (off the main landing line)
  ['lava',-7.5,-0.15,-16,3.0,0.35,3.0],
  // Sky Blast crate
  ['crate',0,0.4,8,'sky'],
  // Take-off vent for the mandatory leap
  ['steamVent',0,0.4,1.5,1.4],
  // Gloop for enemy power-loss tests
  ['gloop',-8,6,'small'],
  // ---- Stage 3 interaction systems (prototype only) ----
  ['cinder',-10,12,'mid'],
  ['wisp',[
    {x:10,y:0.9,z:14},{x:12,y:1.1,z:12},{x:10,y:0.9,z:10},{x:8,y:1.0,z:12}
  ],{speed:2.0}],
  ['wisp',[
    {x:11,y:0.85,z:11},{x:9,y:0.95,z:13}
  ],{speed:1.8,note:true}],
  ['salamander',-12,11,{}],
  ['salamander',-11,13,{path:[{x:-12,z:12},{x:-10,z:14},{x:-11,z:11}]}],
  ['salamander',-9,11,{note:true}],
  ['geyser',4,0.4,11,1.15],
  ['note',2,1.2,13,false],
  ['unfinishedFinish',0,-24,8]
]
};
