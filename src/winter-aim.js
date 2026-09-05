// Child-friendly Snowball Blaster aim assist + post-playtest one-second firing cadence.
const SNOWBALL_FIRE_COOLDOWN=1.0;
function winterAimTarget(oldYaw){
  let target=null,best=Infinity;
  for(const e of snowmen){
    if(!e.alive)continue;
    const dx=e.x-P.pos.x,dz=e.z-P.pos.z,d=Math.hypot(dx,dz);
    if(d>7.5||d>=best)continue;
    const forwardX=Math.sin(oldYaw),forwardZ=Math.cos(oldYaw),dot=(dx*forwardX+dz*forwardZ)/(d||1);
    if(d<=4.25||dot>=0.35){target=e;best=d;}
  }
  return target;
}
function winterCooldownRemaining(){
  if(!WINTER||WINTER.lastSnowballShot==null)return 0;
  return Math.max(0,SNOWBALL_FIRE_COOLDOWN-(time-WINTER.lastSnowballShot));
}
fireSnowballFromPlayer=function(){
  if(!isWinterLevel()||!WINTER||!WINTER.snowballUnlocked||P.dead||won||P.sled)return false;
  if(winterCooldownRemaining()>1e-6)return false;
  const oldYaw=P.yaw,target=winterAimTarget(oldYaw);
  const shotYaw=target?Math.atan2(target.x-P.pos.x,target.z-P.pos.z):oldYaw;
  const dx=Math.sin(shotYaw),dz=Math.cos(shotYaw),g=new THREE.Group();
  g.add(mesh(SPH,pho(0xf8fdff,85,0xffffff),0,0,0,0.25));
  for(let i=0;i<5;i++){const a=i*TAU/5;g.add(mesh(SPH,lam(0xc8ecf7),Math.cos(a)*0.18,Math.sin(a)*0.12,Math.sin(a*1.7)*0.12,0.055));}
  const y=P.pos.y+0.78,x=P.pos.x+dx*0.85,z=P.pos.z+dz*0.85;g.position.set(x,y,z);winterAdd(g);
  const s={g,pos:new THREE.Vector3(x,y,z),vel:new THREE.Vector3(dx*18,0,dz*18),life:2.2,alive:true,aimAssisted:!!target,aimTarget:target||null};snowballs.push(s);
  WINTER.lastSnowballShot=time;WINTER.snowballCooldown=SNOWBALL_FIRE_COOLDOWN;
  spawnRing(x,y,z,0xdff8ff,0.08,0.7,0.16);return true;
};
if(window.__WINTER){window.__WINTER.fireSnowball=fireSnowballFromPlayer;window.__WINTER.cooldownRemaining=winterCooldownRemaining;window.__WINTER.snowballCooldown=SNOWBALL_FIRE_COOLDOWN;}
