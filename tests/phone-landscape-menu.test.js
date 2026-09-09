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
function checkKeyboardVerticalBoundaries(width,height,columns,label){
  const H=boot({innerWidth:width,innerHeight:height});
  ok(H.window.__pickerColumns()===columns,label+' keyboard uses '+columns+' displayed columns');
  for(let i=0;i<columns;i++){
    H.window.__setPickerIdx(i);H.tap('ArrowUp');
    ok(H.pickerIdx()===i,label+' keyboard Up holds top-row column '+i);
  }
  for(let i=6-columns;i<6;i++){
    H.window.__setPickerIdx(i);H.tap('ArrowDown');
    ok(H.pickerIdx()===i,label+' keyboard Down holds bottom-row column '+(i-(6-columns)));
  }
  for(let i=0;i<columns;i++){
    H.window.__setPickerIdx(i);H.tap('ArrowDown');
    ok(H.pickerIdx()===i+columns,label+' keyboard valid Down preserves column '+i);
    H.tap('ArrowUp');ok(H.pickerIdx()===i,label+' keyboard valid Up preserves column '+i);
  }
  H.window.__setPickerIdx(columns-1);H.tap('ArrowDown');H.confirmStart();
  ok(H.isStarted()&&H.getLevel().id==='level'+(columns*2),label+' keyboard vertical move retains activation mapping');
}
function checkGamepadVerticalBoundaries(width,height,columns,label){
  const H=boot({innerWidth:width,innerHeight:height}),idle=Array(18).fill(false),press=index=>{const buttons=idle.slice();buttons[index]=true;H.gamepadTick(buttons);H.gamepadTick(idle);};
  H.setGamepad(H.mkGamepad(idle));H.frames(1);
  ok(H.window.__pickerColumns()===columns,label+' gamepad uses '+columns+' displayed columns');
  for(let i=0;i<columns;i++){
    H.window.__setPickerIdx(i);press(12);
    ok(H.pickerIdx()===i,label+' gamepad Up holds top-row column '+i);
  }
  for(let i=6-columns;i<6;i++){
    H.window.__setPickerIdx(i);press(13);
    ok(H.pickerIdx()===i,label+' gamepad Down holds bottom-row column '+(i-(6-columns)));
  }
  for(let i=0;i<columns;i++){
    H.window.__setPickerIdx(i);press(13);
    ok(H.pickerIdx()===i+columns,label+' gamepad valid Down preserves column '+i);
    press(12);ok(H.pickerIdx()===i,label+' gamepad valid Up preserves column '+i);
  }
  H.window.__setPickerIdx(columns-1);press(13);press(0);
  ok(H.isStarted()&&H.getLevel().id==='level'+(columns*2),label+' gamepad vertical move retains activation mapping');
}
checkKeyboardVerticalBoundaries(844,390,3,'three-column landscape');
checkKeyboardVerticalBoundaries(390,844,2,'two-column portrait');
checkGamepadVerticalBoundaries(844,390,3,'three-column landscape');
checkGamepadVerticalBoundaries(390,844,2,'two-column portrait');
if(failures){console.log('\n'+failures+' FAILED');process.exit(1);}
console.log('\nall passed');
