#!/usr/bin/env node
const fs=require('fs');
{
  const p='levels/level5.js';let s=fs.readFileSync(p,'utf8');
  const old="['cactus',3,0,-684,1.05],['cactus',12,0,-700,1.15],";
  const neu="['cactus',3,0,-684,1.05],['cactus',12,0,-700,1.15],['cactus',-10,0,-735,1.1],";
  if(!s.includes(old))throw new Error('final approach cactus sequence not found');
  s=s.replace(old,neu);fs.writeFileSync(p,s);
}
{
  const p='tests/level5-desert-enhancement.test.js';let s=fs.readFileSync(p,'utf8');
  const old=`  const beatZ=[];
  for(const s of H.W.solids)if(['desertSpur','desertPassWall'].includes(s.role))beatZ.push((s.min.z+s.max.z)/2);
  for(const q of H.W.quicksands.filter(q=>q.role==='ordinary'))beatZ.push(q.z);
  for(const c of H.W.cacti)if(c.z<-80)beatZ.push(c.z);
  beatZ.sort((a,b)=>b-a);
  let maxGap=0;for(let i=1;i<beatZ.length;i++)maxGap=Math.max(maxGap,beatZ[i-1]-beatZ[i]);
  ok(maxGap<55,'extended journey has no long authored no-interaction gap');`;
  const neu=`  const beatZ=[];
  for(const s of H.W.solids)if(['desertSpur','desertPassWall','desertRamp','cliff'].includes(s.role))beatZ.push((s.min.z+s.max.z)/2);
  for(const q of H.W.quicksands)beatZ.push(q.z);
  for(const c of H.W.cacti)beatZ.push(c.z);
  for(const l of H.W.lizards)beatZ.push(l.z);
  beatZ.sort((a,b)=>b-a);
  let maxGap=0;for(let i=1;i<beatZ.length;i++)maxGap=Math.max(maxGap,beatZ[i-1]-beatZ[i]);
  ok(maxGap<55,'extended journey has no long authored no-interaction gap (max '+maxGap.toFixed(1)+')');`;
  if(!s.includes(old))throw new Error('density assertion block not found');
  s=s.replace(old,neu);fs.writeFileSync(p,s);
}
