const LEVEL4={
id:'level4',
music:'space',
spaceAtmosphere:true,
spawn:{x:0,y:0.45,z:0},
firstDestination:{x:22,y:0,z:-10,label:'practicePad'},
garden:{
  entry:{x:28,y:5,z:-26},
  end:{x:30,y:5,z:-140},
  saucerArena:{x:28,y:6,z:-118}
},
candy:{
  planet:{x:98,y:18,z:-198,r:11},
  caveMouth:{x:102,y:18.5,z:-204},
  interiorOrigin:{x:102,y:16.5,z:-204}
},
physics:{
  speed:6.8,acc:44,dec:60,airAcc:20,
  grav:-30,maxFall:-32,jumpV:10.5,puffV:9.4,
  coyote:0.12,buffer:0.15,step:0.42,r:0.36,h:1.15,
  hoverHeld:1.0,hoverReleased:0.5,hoverDrift:-1.6,
  slamHang:0.14,slamFall:-34,slamRebound:8,
  jetTime:0.38,bonkR:2.05,bonkCD:0.5
},
openSpace:{
  grav:0,
  thrustHold:5.5,
  thrustCap:9.0,
  coastCap:4.0,
  coastDecay:2.8,
  steerThrust:38,
  steerCoast:22,
  brake:52,
  jumpV:8.5,
  puffV:7.5,
  levelBand:0.18,
  vertGain:0.92,
  takeoffBias:0.32,
  takeoffAssistH:3.5
},
openSpaceZones:[
  {x0:-50,y0:-12,x1:130,y1:58,z0:-320,z1:48}
],
playVolume:{cx:25,cy:12,cz:-130,soft:155,hard:185,recoverDur:0.5,recoverTo:{x:22,y:0.45,z:-10}},
voidY:-20,
voidFloor:-40,
snoozleGoal:4,
fence:0x2a3040,
fenceSolids:[],
pathTiles:[],
hedges:[],
checks:[
  [0,0,0.45],
  [28,-26,5],
  [28,-104,5],
  [94,24.0,-195],
  [102,16.5,-222],
  [28,18,-254],
  [10,-256,23]
],
tower:{tx:0,tz:0},
snoozleHomes:[
  {x:8,y:28,z:-200},
  {x:50,y:28,z:-228},
  {x:102,y:28,z:-222},
  {x:6,y:30,z:-298}
],
snoozles:[
  [-2.8,0.55,3.2,0,false],
  [98,24.0,-188,1,false],
  [102,15.5,-219,2,false],
  [10,23.6,-270,3,false]
],
trees:[],
steps:[
  ['launchDock',0,0,0,14,14],
  ['routeTrail',0,2.5,0,22,2.5,-10,7],
  ['practicePad',22,0,-10,5.5],
  // Route into Asteroid Garden
  ['routeTrail',22,3,-12,28,5,-26,6],
  ['spaceBuoy',28,5,-26,true],
  ['spaceRestPad',28,4.6,-26,3.2],
  // Beat 1 — first teaching hazard (alone, beside route)
  ['hazardAsteroid',38,5,-32,1.85,'teach'],
  ['routeTrail',28,5,-28,28,5,-38,4],
  ['spaceBuoy',28,5,-38],
  // Beat 2 — weave 4 static hazards with generous gaps
  ['hazardAsteroid',20,5,-44,1.55,'static'],
  ['hazardAsteroid',36,5,-52,1.65,'static'],
  ['hazardAsteroid',21,5,-60,1.5,'static'],
  ['hazardAsteroid',37,6,-68,1.6,'static'],
  ['routeTrail',28,5,-40,28,5,-70,7],
  ['spaceBuoy',28,5,-56],
  // Beat 3 — altitude variation
  ['hazardAsteroid',28,1.2,-78,2.05,'climb'],
  ['spaceBuoy',28,9,-78,true],
  ['routeTrail',28,5,-72,28,8.5,-78,3],
  ['hazardAsteroid',28,11.2,-88,1.85,'dive'],
  ['spaceBuoy',28,3.5,-88,true],
  ['routeTrail',28,8.5,-80,28,3.8,-90,4],
  // Beat 4 — one slow moving asteroid
  ['movingAsteroid',18,5,-96,40,5,-96,1.55,10],
  ['routeTrail',28,5,-92,28,5,-102,3],
  ['spaceBuoy',28,10,-96],
  // Beat 5 — calm recovery lane
  ['spaceBuoy',28,5,-104,true],
  ['spaceRestPad',28,4.6,-104,3.4],
  ['routeTrail',28,5,-104,28,6,-114,3],
  // Beat 6 — first saucer arena
  ['saucer',28,6,-118,'small',true],
  ['spaceBuoy',22,6,-118],['spaceBuoy',34,6,-118],
  // Optional cracked asteroid tutorial (shortcut)
  ['crackedAsteroid',42,5,-108,1.75,false],
  // Stage 2 endpoint
  ['routeTrail',28,6,-122,30,5,-138,4],
  ['spaceBuoy',30,5,-138,true],
  ['spaceStage2Endpoint',30,5,-140],
  // Stage 3 — Cheese Moon foreshadow (visual only, not landable)
  ['routeTrail',30,5,-142,45,8,-168,7],
  ['spaceBuoy',45,8,-168,true],
  ['cheeseMoonLandmark',58,12,-175,7.5],
  // Open space to Candy Planet approach pad (not planet center)
  ['routeTrail',58,12,-178,82,16,-192,8],
  ['spaceBuoy',82,16,-192,true],
  ['routeTrail',82,16,-194,94,24.0,-195,5],
  ['spaceBuoy',94,24.8,-194,true],
  ['candyPlanet',98,18,-198,11],
  // Candy surface — Star Beam teaching
  ['starCrate',92,24.1,-192,true],
  ['saucerTarget',94,24.0,-196],
  ['saucer',96,24.0,-202,'mid',true],
  ['candyCaveMouth',102,18.5,-204],
  ['crystalInterior',102,16.5,-204],
  // Interior mid saucer
  ['saucer',102,3.2,-214,'mid',false],
  // Stage 3 endpoint after crystal exit
  ['routeTrail',98,22,-212,98,24,-218,3],
  ['spaceBuoy',98,24,-218,true],
  ['spaceStage3Endpoint',98,24,-220],
  // Stage 4 — Saucer Belt (crystal exit → shield gate → observatory foreshadow)
  ['routeTrail',108,28.5,-194,96,26,-206,6],
  ['spaceBuoy',96,26,-206,true],
  // Beat A — readable asteroid-only lane
  ['hazardAsteroid',90,25,-210,1.65,'static'],
  ['hazardAsteroid',104,27,-204,1.55,'static'],
  ['movingAsteroid',88,24,-216,100,26,-216,1.5,14],
  ['routeTrail',96,26,-206,84,24,-220,5],
  ['spaceBuoy',84,24,-220],
  ['hazardAsteroid',78,23,-224,1.6,'static'],
  ['hazardAsteroid',90,25,-228,1.5,'static'],
  ['backdropAsteroid',72,20,-218,0.5],
  // Beat B — one saucer weaving among rocks
  ['saucer',74,24,-232,'small',false,true],
  ['hazardAsteroid',68,22,-236,1.55,'static'],
  ['hazardAsteroid',80,26,-234,1.5,'static'],
  ['routeTrail',84,24,-220,64,22,-238,4],
  ['spaceBuoy',64,22,-238,true],
  // Beat C — two saucers with room to dodge
  ['saucer',58,22,-244,'mid',false,true],
  ['saucer',44,20,-250,'small',false,true],
  ['hazardAsteroid',52,21,-247,1.45,'static'],
  ['routeTrail',64,22,-238,46,20,-252,4],
  // Beat D — mandatory shield gate + renewable star crate
  ['starCrate',42,20,-248,true],
  ['shieldedGate',38,20,-254,8,5.5,1.2],
  // Beat E — post-gate relief and future-route cue
  ['spaceRestPad',28,18,-256,3.6],
  ['spaceBuoy',28,18,-256,true],
  ['observatoryLandmark',14,22,-262],
  ['routeTrail',28,18,-256,14,22,-262,4],
  ['spaceStage4Endpoint',14,22,-264],
  // Stage 5 — Star Observatory (calm rest, Snoozle 4, black-hole framing)
  ['routeTrail',14,22,-264,10,24,-272,5],
  ['spaceBuoy',10,24,-272,true],
  ['observatory',10,24,-272],
  ['note',8,25.5,-268,false],
  ['note',12,25,-266,false],
  ['spaceStage5Endpoint',10,23,-276],
  // Stage 6 — Black Hole finish
  ['routeTrail',10,24,-276,6,28,-292,6],
  ['spaceBuoy',8,27,-286,true],
  ['spaceBuoy',6,29,-296,true],
  ['blackHoleFinish',6,28,-298],
  // Scenery / backdrop
  ['spaceBuoy',-18,2,14],['spaceBuoy',36,3,18],['spaceBuoy',-8,6,32],
  ['backdropAsteroid',12,14,-20,0.55],['backdropAsteroid',42,18,-48,0.7],
  ['backdropAsteroid',8,22,-70,0.45],['backdropAsteroid',48,10,-90,0.6],
  ['backdropAsteroid',-6,16,-55,0.5],['backdropAsteroid',55,20,-130,0.8],
  ['backdropAsteroid',15,28,-100,0.4],['backdropAsteroid',-20,12,-40,0.55],
  ['backdropAsteroid',60,18,-240,0.45],['backdropAsteroid',22,16,-248,0.5],
  ['backdropPlanet',-55,18,-70,6,0x6a4a9a,true],
  ['backdropPlanet',48,12,-85,5,0xc45a78,false],
  ['backdropPlanet',-30,8,95,4.5,0x4a8a6a,false]
]};
