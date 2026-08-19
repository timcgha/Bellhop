const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const lerp=(a,b,t)=>a+(b-a)*t;
const damp=(a,b,l,dt)=>a+(b-a)*(1-Math.exp(-l*dt));
const moveTo=(a,b,d)=>a<b?Math.min(a+d,b):Math.max(a-d,b);
const rand=(a,b)=>a+Math.random()*(b-a);
const TAU=Math.PI*2;
function angDamp(a,b,l,dt){let d=b-a;while(d>Math.PI)d-=TAU;while(d<-Math.PI)d+=TAU;return a+d*(1-Math.exp(-l*dt));}
function smooth(t){t=clamp(t,0,1);return t*t*(3-2*t);}
