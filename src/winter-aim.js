// Child-friendly Snowball Blaster aim assist.
// A nearby live snowman may gently capture a shot so the one-at-a-time projectile
// remains useful against moving targets on touch/gamepad without becoming auto-combat.
const _winterBaseFireSnowball=fireSnowballFromPlayer;
fireSnowballFromPlayer=function(){
  if(!isWinterLevel()||!WINTER||!WINTER.snowballUnlocked||P.dead||won||P.sled)return false;
  if(snowballs.some(s=>s.alive))return false;
  const oldYaw=P.yaw;
  let target=null,best=Infinity;
  for(const e of snowmen){
    if(!e.alive)continue;
    const dx=e.x-P.pos.x,dz=e.z-P.pos.z,d=Math.hypot(dx,dz);
    if(d>7.5||d>=best)continue;
    const forwardX=Math.sin(oldYaw),forwardZ=Math.cos(oldYaw),dot=(dx*forwardX+dz*forwardZ)/(d||1);
    // At very close range accept any bearing; farther away still requires the
    // player to aim generally toward the enemy.
    if(d<=4.25||dot>=0.35){target=e;best=d;}
  }
  if(target)P.yaw=Math.atan2(target.x-P.pos.x,target.z-P.pos.z);
  const fired=_winterBaseFireSnowball();
  if(fired&&target){
    const s=[...snowballs].reverse().find(x=>x.alive);
    if(s){s.aimAssisted=true;s.aimTarget=target;}
  }
  P.yaw=oldYaw;
  return fired;
};
// winter.js exports the helper before this refinement is loaded; keep the test/
// browser observation hook bound to the live implementation.
if(window.__WINTER)window.__WINTER.fireSnowball=fireSnowballFromPlayer;
