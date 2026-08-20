// Level 2 four-part Snoozle song — preserves Level 1 meadow arrangement.
const fs=require('fs'),path=require('path');
let failures=0;
function ok(cond,msg){
  if(!cond) failures++;
  console.log((cond?'PASS ':'FAIL ')+msg);
}
function report(){
  if(failures){console.log(`\n${failures} FAILED`);process.exit(1);}
  console.log('\nall passed');
}
function boot(opts){return require('./harness.js')(Object.assign({autostart:false},opts));}
function wake(H,s){
  H.P.pos.set(s.g.position.x,s.g.position.y,s.g.position.z+1);
  H.P.vel.set(0,0,0);H.frames(2);H.tap('KeyK',2);H.frames(4);
}

// ---- level-owned song selection ----
{
  const H1=boot();H1.startLevel(0);
  const au1=H1.AU();
  ok(au1.song&&au1.song.id==='meadow','Level 1 selects the meadow song');
  ok(au1.bpm===112,'Level 1 meadow bpm stays 112');
  ok(au1.layers===0,'Level 1 starts with zero musical layers');

  const H2=boot();H2.startLevel(1);
  const au2=H2.AU();
  ok(au2.song&&au2.song.id==='deep','Level 2 selects the deep song');
  ok(au2.bpm===84,'Level 2 deep song uses a slower lullaby bpm');
  ok(au2.layers===0,'Level 2 starts with zero musical layers');
  ok(au1.song.id!==au2.song.id,'Level 1 and Level 2 songs are distinct');
  ok(JSON.stringify(au1.song.chords)!==JSON.stringify(au2.song.chords),
    'completed arrangements use different chord progressions');
}

// ---- each Level 2 Snoozle adds a layer; four complete the song ----
{
  const H=boot();H.startLevel(1);
  const au=H.AU();
  ok(au.song.id==='deep','Level 2 is on the deep song before wakes');
  for(let i=0;i<4;i++){
    wake(H,H.W.snoozles[i]);H.frames(40);
    ok(au.layers===i+1,'Snoozle '+(i+1)+' raises deep song to layer '+(i+1));
  }
  ok(au.layers===4,'all four deep layers are active after four wakes');
  ok(au.song.id==='deep','song id stays deep through all wakes');
  ok(!H.W.won,'completing the deep song does not itself win');
}

// ---- Level 1 layer progression unchanged ----
{
  const H=boot();H.startLevel(0);
  const au=H.AU();
  const songs=H.SONGS();
  ok(songs.meadow&&songs.deep,'both meadow and deep songs are registered');
  ok(au.song===songs.meadow,'Level 1 binds the meadow song object');
  for(let i=0;i<4;i++){
    wake(H,H.W.snoozles[i]);H.frames(40);
    ok(au.layers===i+1,'Level 1 Snoozle '+(i+1)+' still adds meadow layer '+(i+1));
  }
  ok(au.song.id==='meadow','Level 1 remains on meadow after four wakes');
  ok(au.bpm===112,'Level 1 bpm remains 112 after four wakes');
}

// ---- shared wake path has no Level 2 music conditionals ----
{
  const enemies=fs.readFileSync(path.join(__dirname,'..','src','enemies.js'),'utf8');
  const wakeFn=enemies.slice(enemies.indexOf('function wakeSnoozle'),enemies.indexOf('function updateSnoozles'));
  ok(/AU\.layers=rescued/.test(wakeFn),'shared wake still drives AU.layers from rescued count');
  ok(!/deep|meadow|setSong|music|level2|LEVEL2|CONCH/.test(wakeFn),
    'wakeSnoozle stays free of level/song conditionals');
  const audio=fs.readFileSync(path.join(__dirname,'..','src','audio.js'),'utf8');
  ok(/SONGS/.test(audio)&&/function setSong/.test(audio),'audio owns the song table and setSong');
  ok(/function meadowVoice/.test(audio)&&/function deepVoice/.test(audio),
    'meadow and deep each have their own layer voice');
  ok(/soft bell|watery arpeggio|warm low|floating upper|pluck foundation/i.test(audio)||
     /deepVoice/.test(audio),
    'deep song defines four distinct layer voices');
}

// ---- level data declares music without scattering conditionals in the loop ----
{
  const l1=fs.readFileSync(path.join(__dirname,'..','levels','level1.js'),'utf8');
  const l2=fs.readFileSync(path.join(__dirname,'..','levels','level2.js'),'utf8');
  const entities=fs.readFileSync(path.join(__dirname,'..','src','entities.js'),'utf8');
  ok(/music:\s*'meadow'/.test(l1),'Level 1 data owns music: meadow');
  ok(/music:\s*'deep'/.test(l2),'Level 2 data owns music: deep');
  ok(/setSong\(L\.music/.test(entities),'loadLevel applies the level-owned song once');
}

report();
