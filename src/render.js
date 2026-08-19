const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));renderer.setSize(innerWidth,innerHeight);
renderer.outputEncoding=THREE.sRGBEncoding;document.body.appendChild(renderer.domElement);
const scene=new THREE.Scene();scene.background=new THREE.Color(0x9fdcff);scene.fog=new THREE.Fog(0x9fdcff,45,120);
const camera=new THREE.PerspectiveCamera(60,innerWidth/innerHeight,0.1,220);
addEventListener('resize',()=>{renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();});
scene.add(new THREE.HemisphereLight(0xd8f1ff,0x5f8f45,0.95));
const sun=new THREE.DirectionalLight(0xfff1d6,0.85);sun.position.set(20,35,15);scene.add(sun);
const lam=c=>new THREE.MeshLambertMaterial({color:c});
const pho=(c,s,sp)=>new THREE.MeshPhongMaterial({color:c,shininess:s||60,specular:sp||0x666666});
const BOXG=new THREE.BoxGeometry(1,1,1),SPH=new THREE.SphereGeometry(1,12,9),CYL=new THREE.CylinderGeometry(1,1,1,12),CONE=new THREE.ConeGeometry(1,1,10);
const CUPG=new THREE.CylinderGeometry(0.22,0.28,0.36,12);CUPG.translate(0,0.18,0);
const DUSTG=new THREE.CylinderGeometry(0.9,1.15,0.26,14);DUSTG.translate(0,0.13,0);
function mesh(geo,mat,x,y,z,sx,sy,sz){const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.scale.set(sx,sy!=null?sy:sx,sz!=null?sz:sx);return m;}
const tmpV=new THREE.Vector3();

