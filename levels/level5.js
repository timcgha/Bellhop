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
  [0,0,36,40,3.5,0.7],[0,0,-837,40,3.5,0.7],
  [-20,0,-400.5,0.7,3.5,873],[20,0,-400.5,0.7,3.5,873]
],
pathTiles:[],hedges:[],trees:[],
checks:[[0,26],[0,-16],[0,-80],[0,-275],[0,-345],[0,-560],[0,-710],[0,-780,7.22]],
tower:{tx:0,tz:0},snoozleHomes:[],snoozles:[],snoozleGoal:0,
steps:[
  // Beat 1 — preserve the existing arrival, camel introduction, heart lizard and first sand hazard.
  ['camel',-4,0,20,true],
  ['desertDune',-10,0,14,3.8,1.15],['desertDune',11,0,8,4.6,1.3],
  ['cactus',-12,0,18,1.15],['cactus',12,0,17,1.05],['cactus',-14,0,4,1.0],
  ['lizard',-5,0,-8,'heart'],
  ['desertMarker',0,0,10,'camel'],
  ['quicksand',0,0,-27,6.4,3.4,'ordinary'],
  ['cactus',-8,0,-26,1.15],['cactus',8,0,-31,1.15],
  ['camel',3,0,-38,true],
  ['desertMarker',0,0,-34,'ride'],
  ['cactus',-11,0,-45,1.25],['cactus',11,0,-52,1.25],['cactus',-10,0,-58,1.0],
  ['lizard',4.2,0,-58,'note'],
  ['desertDune',-12,0,-68,5.0,1.4],['desertDune',12,0,-73,5.5,1.5],

  // Beat 2 — sandstone canyon switchbacks. Alternating spurs force readable left/right riding turns.
  ['desertMarker',0,0,-88,'ride'],
  ['solid',-7,0,-105,26,3.6,7,0xc97848,{surf:'stone',role:'desertSpur'}],['desertDune',-14,0,-105,5.5,1.6],
  ['solid',7,0,-140,26,3.6,7,0xd78952,{surf:'stone',role:'desertSpur'}],['desertDune',14,0,-140,5.0,1.5],
  ['solid',-7,0,-175,26,3.6,7,0xc97848,{surf:'stone',role:'desertSpur'}],['desertDune',-14,0,-175,5.8,1.7],
  ['solid',7,0,-210,26,3.6,7,0xd78952,{surf:'stone',role:'desertSpur'}],['desertDune',14,0,-210,5.2,1.55],
  ['solid',-7,0,-245,26,3.6,7,0xc97848,{surf:'stone',role:'desertSpur'}],['desertDune',-14,0,-245,5.7,1.65],
  ['cactus',12,0,-116,1.0],['cactus',-12,0,-151,1.1],['cactus',12,0,-186,1.0],['cactus',-12,0,-221,1.1],

  // Beat 3 — a central terraced pass, then an offset quicksand crossing and second switchback run.
  ['solid',-14.5,0,-300,11,3.6,18,0xbc6c43,{surf:'stone',role:'desertPassWall'}],
  ['solid',14.5,0,-300,11,3.6,18,0xbc6c43,{surf:'stone',role:'desertPassWall'}],
  ['desertRamp',0,0,-300,14,18,2.2],
  ['desertDune',-15,0,-300,5.2,1.5],['desertDune',15,0,-300,5.2,1.5],
  ['quicksand',-6,0,-335,5.2,6.2,'ordinary'],
  ['cactus',5,0,-330,1.1],['cactus',11,0,-345,1.0],
  ['solid',7,0,-375,26,3.6,7,0xd78952,{surf:'stone',role:'desertSpur'}],['desertDune',14,0,-375,5.2,1.55],
  ['solid',-7,0,-410,26,3.6,7,0xc97848,{surf:'stone',role:'desertSpur'}],['desertDune',-14,0,-410,5.5,1.6],
  ['solid',7,0,-445,26,3.6,7,0xd78952,{surf:'stone',role:'desertSpur'}],['desertDune',14,0,-445,5.0,1.5],
  ['solid',-7,0,-480,26,3.6,7,0xc97848,{surf:'stone',role:'desertSpur'}],['desertDune',-14,0,-480,5.7,1.65],
  ['solid',7,0,-515,26,3.6,7,0xd78952,{surf:'stone',role:'desertSpur'}],['desertDune',14,0,-515,5.2,1.55],
  ['solid',-7,0,-550,26,3.6,7,0xc97848,{surf:'stone',role:'desertSpur'}],['desertDune',-14,0,-550,5.6,1.6],

  // Beat 4 — final dune/cactus gauntlet with the last ordinary quicksand lane before the cliff build-up.
  ['quicksand',6,0,-575,5.4,6.4,'ordinary'],
  ['cactus',-11,0,-588,1.15],['cactus',1,0,-600,1.05],['cactus',11,0,-614,1.2],
  ['cactus',-4,0,-632,1.15],['cactus',10,0,-648,1.05],['cactus',-11,0,-665,1.2],
  ['cactus',3,0,-684,1.05],['cactus',12,0,-700,1.15],
  ['desertDune',-13,0,-610,4.8,1.35],['desertDune',13,0,-645,5.0,1.45],
  ['desertDune',-13,0,-682,5.3,1.55],['desertDune',13,0,-718,5.0,1.4],
  ['desertMarker',0,0,-728,'cliff'],

  // Finale — the original terrace/cliff/drop architecture, now naturally enclosed by sandstone canyon ridges.
  ['desertRamp',0,0,-770,14,22,7.22],
  ['desertCliff',0,0,-789,18,7.22,16],
  ['desertCliff',-14.5,0,-770,11.2,5.4,22],['desertCliff',14.5,0,-770,11.2,5.6,22],
  ['desertCliff',-14.5,0,-791,11.2,5.8,22],['desertCliff',14.5,0,-791,11.2,5.3,22],
  ['desertCliff',-14.5,0,-812,11.2,5.5,22],['desertCliff',14.5,0,-812,11.2,5.9,22],
  ['cactus',-8.4,7.22,-787,1.0],['cactus',8.4,7.22,-787,1.0],
  ['desertMarker',0,7.22,-792,'cliff'],
  ['finalQuicksand',0,0,-813,17.6,32],
  ['oasis',0,0,-900],
  ['desertDune',-15,0,-828,4.5,1.2],['desertDune',15,0,-828,4.5,1.2]
]
};