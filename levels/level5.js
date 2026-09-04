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
  [0,0,36,40,3.5,0.7],[0,0,-404,40,3.5,0.7],
  [-20,0,-184,0.7,3.5,440],[20,0,-184,0.7,3.5,440]
],
pathTiles:[],hedges:[],trees:[],
checks:[[0,26],[0,-16],[0,-56],[0,-126],[0,-188],[0,-252],[0,-318],[0,-351,7.22]],
tower:{tx:0,tz:0},snoozleHomes:[],snoozles:[],snoozleGoal:0,

// Descriptive only: these markers document the intended child-readable journey.
// They are not progression flags and never gate gameplay.
challengeBeats:[
  ['camel-intro',20],
  ['first-quicksand',-27],
  ['camel-slalom',-102],
  ['alternating-safe-lanes',-162],
  ['dune-canyon',-222],
  ['quicksand-route-choice',-276],
  ['sandstone-finale',-360]
],

steps:[
  // Existing arrival — keep the friendly first camel, cactus framing, heart lizard and marker.
  ['camel',-4,0,20,true],
  ['desertDune',-10,0,14,3.8,1.15],['desertDune',11,0,8,4.6,1.3],
  ['cactus',-12,0,18,1.15],['cactus',12,0,17,1.05],['cactus',-14,0,4,1.0],
  ['lizard',-5,0,-8,'heart'],
  ['desertMarker',0,0,10,'camel'],

  // Existing early quicksand/remount section.
  ['quicksand',0,0,-27,6.4,3.4,'ordinary'],
  ['cactus',-8,0,-26,1.15],['cactus',8,0,-31,1.15],
  ['camel',3,0,-38,true],
  ['desertMarker',0,0,-34,'ride'],
  ['quicksand',-5.7,0,-45,4.0,4.0,'ordinary'],
  ['quicksand',5.8,0,-50,4.4,4.2,'ordinary'],
  ['cactus',-11,0,-45,1.25],['cactus',11,0,-52,1.25],['cactus',-10,0,-58,1.0],
  ['lizard',4.2,0,-58,'note'],
  ['desertDune',-12,0,-68,5.0,1.4],['desertDune',12,0,-73,5.5,1.5],

  // New beat — longer camel slalom with two readable jump trenches.
  ['desertMarker',0,0,-74,'ride'],
  ['cactus',-5.5,0,-80,1.15],['cactus',5.4,0,-88,1.15],
  ['quicksand',0,0,-96,11.5,3.6,'ordinary'],
  ['cactus',-5.2,0,-104,1.2],['cactus',5.5,0,-112,1.15],
  ['quicksand',0,0,-120,10.5,3.8,'ordinary'],
  ['cactus',-6.2,0,-127,1.05],['cactus',6.4,0,-129,1.05],
  ['desertDune',-13,0,-98,4.7,1.35],['desertDune',13,0,-116,5.2,1.45],

  // New beat — alternating safe lanes. The dark sand spans most of one side,
  // asking the player to read and switch lanes rather than precision-platform.
  ['desertMarker',0,0,-136,'cliff'],
  ['quicksand',-6.0,0,-145,14.0,7.0,'ordinary'],
  ['cactus',7.5,0,-144,1.1],
  ['quicksand',6.0,0,-162,14.0,7.0,'ordinary'],
  ['cactus',-7.5,0,-161,1.1],
  ['quicksand',-6.0,0,-179,14.0,7.0,'ordinary'],
  ['cactus',7.2,0,-178,1.05],
  ['desertDune',13,0,-151,4.8,1.3],['desertDune',-13,0,-171,4.8,1.3],

  // New beat — dune/cactus canyon and another forgiving camel jump.
  ['desertMarker',0,0,-194,'ride'],
  ['camel',-3.5,0,-201,true],
  ['desertDune',-11.5,0,-202,6.0,1.75],['desertDune',11.5,0,-211,5.8,1.65],
  ['cactus',-3.8,0,-207,1.2],['cactus',4.4,0,-214,1.15],
  ['quicksand',0,0,-223,12.0,5.0,'ordinary'],
  ['cactus',-7.0,0,-231,1.15],['cactus',6.7,0,-235,1.15],
  ['desertDune',-12.5,0,-238,5.0,1.45],['desertDune',12.5,0,-242,5.2,1.5],

  // New beat — broad route-choice hazards that reconnect before the finale.
  ['desertMarker',0,0,-247,'cliff'],
  ['quicksand',-7.0,0,-255,11.0,8.0,'ordinary'],
  ['cactus',5.2,0,-255,1.05],
  ['quicksand',7.0,0,-273,11.0,8.0,'ordinary'],
  ['cactus',-5.2,0,-273,1.05],
  ['quicksand',0,0,-292,12.0,5.0,'ordinary'],
  ['cactus',-7.4,0,-300,1.15],['cactus',7.4,0,-302,1.15],
  ['desertDune',-12,0,-284,5.6,1.65],['desertDune',12,0,-306,5.8,1.7],
  ['desertMarker',0,0,-315,'cliff'],

  // Existing finale architecture moved later. The terraced climb still reaches
  // the central cliff, while segmented sandstone ridges naturally close both
  // side bypasses and form a canyon around the intentional drop.
  ['desertRamp',0,0,-344,14,18,7.22],
  ['desertCliff',0,0,-360,18,7.22,14],

  ['desertCliff',-14.4,0,-345,11.2,12.4,24],
  ['desertCliff',-14.6,0,-366,10.8,13.2,24],
  ['desertCliff',-14.2,0,-387,11.6,11.8,24],
  ['desertCliff',14.4,0,-345,11.2,12.6,24],
  ['desertCliff',14.6,0,-366,10.8,13.0,24],
  ['desertCliff',14.2,0,-387,11.6,12.0,24],

  ['desertDune',-14.5,0,-332,6.2,2.0],['desertDune',14.5,0,-333,6.2,2.0],
  ['cactus',-8.2,7.22,-357,0.9],['cactus',8.2,7.22,-357,0.9],
  ['desertMarker',0,7.22,-362,'cliff'],

  // The final pool fills the canyon floor below the edge, so the intended
  // cliff drop reliably lands in special sand instead of a side escape lane.
  ['finalQuicksand',0,0,-379,18,22],

  // Existing sand-portal → oasis finish architecture, now beyond the sealed finale.
  ['oasis',0,0,-445],
  ['desertDune',-15,0,-405,4.5,1.2],['desertDune',15,0,-405,4.5,1.2]
]
};
