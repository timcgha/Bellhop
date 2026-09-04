const LEVEL5={
id:'level5',
music:'desert',
desertAtmosphere:true,
spawn:{x:0,y:0,z:28},
physics:{
  speed:6.8,acc:44,dec:60,airAcc:20,
  grav:-30,maxFall:-32,jumpV:10.5,puffV:9.4,
  coyote:0.12,buffer:0.15,step:0.42,r:0.36,h:1.15,
  hoverHeld:1.0,hoverReleased:0.5,hoverDrift:-1.6,
  slamHang:0.14,slamFall:-34,slamRebound:8,
  jetTime:0.38,bonkR:2.05,bonkCD:0.5
},
fence:0x9c5f32,
fenceSolids:[
  [0,0,36,40,3.5,0.7],[0,0,-126,40,3.5,0.7],
  [-20,0,-45,0.7,3.5,162],[20,0,-45,0.7,3.5,162]
],
pathTiles:[],hedges:[],trees:[],
checks:[[0,26],[0,-16],[0,-56],[0,-80,7.22]],
tower:{tx:0,tz:0},snoozleHomes:[],snoozles:[],snoozleGoal:0,
steps:[
  // Stage 1 — arrival: a friendly rideable camel is in the first safe space.
  ['camel',-4,0,20,true],
  ['desertDune',-10,0,14,3.8,1.15],['desertDune',11,0,8,4.6,1.3],
  ['cactus',-12,0,18,1.15],['cactus',12,0,17,1.05],['cactus',-14,0,4,1.0],
  ['lizard',-5,0,-8,'heart'],
  ['desertMarker',0,0,10,'camel'],

  // Stage 2–4 — a generous camel lane and ordinary quicksand jump field.
  ['quicksand',0,0,-27,6.4,3.4,'ordinary'],
  ['cactus',-8,0,-26,1.15],['cactus',8,0,-31,1.15],
  ['camel',3,0,-38,true],
  ['desertMarker',0,0,-34,'ride'],
  ['quicksand',-5.7,0,-45,4.0,4.0,'ordinary'],
  ['quicksand',5.8,0,-50,4.4,4.2,'ordinary'],
  ['cactus',-11,0,-45,1.25],['cactus',11,0,-52,1.25],['cactus',-10,0,-58,1.0],
  ['lizard',4.2,0,-58,'note'],
  ['desertDune',-12,0,-68,5.0,1.4],['desertDune',12,0,-73,5.5,1.5],

  // Stage 5 — a climb onto a visible sandstone cliff.
  ['desertRamp',0,0,-66,14,18,0.38],
  ['desertCliff',0,0,-85,18,7.22,14],
  ['cactus',-8.4,7.22,-83,1.0],['cactus',8.4,7.22,-83,1.0],
  ['desertMarker',0,7.22,-87,'cliff'],

  // Stage 6 — the intentional drop, special sand trap, portal, and green oasis.
  ['finalQuicksand',0,0,-99,16,10],
  ['oasis',0,0,-150],
  ['desertDune',-15,0,-106,4.5,1.2],['desertDune',15,0,-105,4.5,1.2]
]
};
