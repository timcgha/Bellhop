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
// Prototype starting values (1.3–1.5x vertical, ~2.3–2.6x horizontal carry). Phone playtest owns the next pass.
skyBlast:{
  puffVMul:1.4,
  boostMax:12.5,
  boostDecay:1.6
},
// Prototype gap the unpowered run cannot clear; powered running leap should.
// Near pad ends at z≈0; far pad begins at z=-10 (10-unit gap). Far pad depth is generous.
protoGap:{nearZ:0,farZ:-10,farEndZ:-22},
fence:0x5a2e1a,
fenceSolids:[[0,0,16,24,1.2,0.6],[0,0,-28,24,1.2,0.6],[-13,0,-6,0.6,1.2,44],[13,0,-6,0.6,1.2,44]],
pathTiles:[],
hedges:[],
checks:[[0,12]],
tower:{tx:0,tz:0},
snoozleHomes:[[0,-24]],
snoozles:[],
trees:[],
steps:[
  // Broad start terrace (Peak-coloured prototype geometry — not production volcano art)
  ['solid',0,0,9,20,0.4,18,0xc45a28,{surf:'stone'}],
  // Far landing pad — deep enough that a successful leap does not need precise braking
  ['solid',0,0,-16,20,0.4,12,0xe07a3a,{surf:'stone'}],
  // Marked landing strip on the far pad
  ['solid',0,0.4,-11,6,0.08,2.5,0xffd24a,{surf:'stone'}],
  // Side practice pads (safe, non-hazard)
  ['solid',-8,0,4,4,0.4,4,0xa84a22,{surf:'stone'}],
  ['solid',8,0,4,4,0.4,4,0xa84a22,{surf:'stone'}],
  // Sky Blast pickup (crate) in plain sight on the start pad
  ['crate',0,0.4,8,'sky'],
  // Prototype steam vent beside the take-off lip (off the run-up line so leap tests stay clean)
  ['steamVent',5,0.4,1.5,1.4],
  // One gloop off to the side for knockback / power-loss tests (not on the leap line)
  ['gloop',-8,4,'small'],
  // Stage 1 has no real finish — placeholder so loadLevel's FINISH contract is satisfied
  ['unfinishedFinish',0,-24,8]
]
};
