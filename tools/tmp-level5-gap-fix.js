#!/usr/bin/env node
const fs=require('fs');
const p='levels/level5.js';
let s=fs.readFileSync(p,'utf8');
const old="['cactus',12,0,-186,1.0],['cactus',-12,0,-221,1.1],";
const neu="['cactus',12,0,-186,1.0],['cactus',-12,0,-221,1.1],['cactus',12,0,-272,1.05],";
if(!s.includes(old))throw new Error('expected switchback interaction sequence not found');
s=s.replace(old,neu);
fs.writeFileSync(p,s);
