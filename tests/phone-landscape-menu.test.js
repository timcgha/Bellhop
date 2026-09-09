// Focused deterministic companion to the retained BH-006 real-browser gate.
const fs=require('fs'),path=require('path');
const source=process.env.BELLHOP_HTML||path.join(__dirname,'..','dist','index.html');
const html=fs.readFileSync(source,'utf8');
let failures=0;
function ok(condition,message){console.log((condition?'PASS ':'FAIL ')+message);if(!condition)failures++;}
const boot=opts=>require('./harness.js')(Object.assign({html,autostart:false},opts));

ok(!/cv\.style\.width\s*=\s*w\+'px'/.test(html)&&!/cv\.style\.height\s*=\s*h\+'px'/.test(html),'level art has no runtime CSS size override');
ok(/#start \.level-pick\{[^}]*display:grid[^}]*repeat\(3,minmax\(0,1fr\)\)/.test(html),'picker owns a three-column responsive grid');
ok(/orientation:landscape[^}]*max-height:520px/.test(html)&&/grid-template-areas:"title levels"/.test(html),'short landscape uses a bounded two-column menu');
ok(/orientation:portrait[^}]*max-width:500px[^}]*repeat\(2,minmax\(0,1fr\)\)/.test(html),'phone portrait retains a two-column picker');
ok(/scale\(1\.035\)/.test(html)&&!/scale\(1\.12\)/.test(html),'selection pulse stays inside the grid gap');

{
  const H=boot({innerWidth:844,innerHeight:390});
  H.tap('ArrowDown');ok(H.pickerIdx()===3,'keyboard Down follows the displayed column');
  H.tap('ArrowRight');ok(H.pickerIdx()===4,'keyboard Right preserves level order');
  H.tap('ArrowUp');ok(H.pickerIdx()===1,'keyboard Up follows the displayed column');
  H.confirmStart();ok(H.isStarted()&&H.getLevel().id==='level2','keyboard activation maps the selected card to its level');
}
{
  const H=boot({innerWidth:844,innerHeight:390}),idle=Array(18).fill(false),press=index=>{const buttons=idle.slice();buttons[index]=true;H.gamepadTick(buttons);H.gamepadTick(idle);};
  H.setGamepad(H.mkGamepad(idle));H.frames(1);
  press(13);ok(H.pickerIdx()===3,'gamepad Down follows the displayed column');
  press(15);ok(H.pickerIdx()===4,'gamepad Right preserves level order');
  press(12);ok(H.pickerIdx()===1,'gamepad Up follows the displayed column');
  press(0);ok(H.isStarted()&&H.getLevel().id==='level2','gamepad A activates the selected card');
}
if(failures){console.log('\n'+failures+' FAILED');process.exit(1);}
console.log('\nall passed');
