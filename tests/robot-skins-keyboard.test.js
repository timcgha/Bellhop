// Exercise the actual input handler with focus restored to the Skins button.
const fs=require('fs'),path=require('path'),vm=require('vm');
let failures=0,launches=0;
function ok(c,m){console.log((c?'PASS ':'FAIL ')+m);if(!c)failures++;}
const events={},els={};
const context={started:false,paused:false,pickerIdx:2,isSkinPanelOpen:()=>false,
  addEventListener(type,fn){(events[type]||(events[type]=[])).push(fn);},
  $(id){return els[id]||(els[id]={style:{},addEventListener(){}});},
  navigator:{getGamepads:()=>[]},document:{addEventListener(){}},
  startGame(){launches++;},initAudio(){},togglePause(){},setPaused(){},returnToMainMenu(){}};
context.window=context;context.setPickerIdx=i=>context.pickerIdx=i;
vm.createContext(context);vm.runInContext(fs.readFileSync(path.join(__dirname,'../src/input.js'),'utf8'),context);
const key=code=>events.keydown[0]({code,target:context.$('skinsOpen'),repeat:false,preventDefault(){}});
key('ArrowRight');ok(context.pickerIdx===3,'focused Skins button does not swallow picker arrows');
key('ArrowLeft');ok(context.pickerIdx===2,'picker arrows work after modal focus restoration');
key('Enter');key('Space');ok(launches===0,'native Skins activation does not launch the underlying level');
if(failures)process.exit(1);
