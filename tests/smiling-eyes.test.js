// BH-003: execute the shared builder against observable sphere vertices.
// Real THREE/WebGL geometry and preview rendering are checked by the skins browser gate.
const fs=require('fs'),path=require('path'),vm=require('vm');
const {ROBOT_SKINS,applyRobotSkin}=require('../src/skin-state.js');
let failures=0;
function ok(c,m){console.log((c?'PASS ':'FAIL ')+m);if(!c)failures++;}
const close=(a,b)=>Math.abs(a-b)<1e-6;
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
class V{constructor(x=0,y=0,z=0){this.set(x,y,z);}set(x,y,z){Object.assign(this,{x,y,z});return this;}setScalar(s){return this.set(s,s,s);}}
class O{constructor(geometry,material){Object.assign(this,{geometry,material,children:[],userData:{},position:new V(),rotation:new V(),scale:new V(1,1,1),visible:true,parent:null});}add(o){if(o.parent)o.parent.remove(o);this.children.push(o);o.parent=this;}remove(o){this.children=this.children.filter(c=>c!==o);o.parent=null;}traverse(fn){fn(this);this.children.forEach(c=>c.traverse(fn));}}
class C{constructor(v){this.v=v;}setHex(v){this.v=v;}getHex(){return this.v;}}
class M{constructor(o){Object.assign(this,o);this.color=new C(o.color);}}
class G{constructor(...args){this.args=args;}}
class Positions{
  constructor(values){this.array=new Float32Array(values);this.count=this.array.length/3;this.needsUpdate=false;}
  getX(i){return this.array[i*3];}getY(i){return this.array[i*3+1];}getZ(i){return this.array[i*3+2];}
  setY(i,y){this.array[i*3+1]=y;}
}
class Sphere{
  constructor(values){this.attributes={position:new Positions(values)};this.normalUpdates=0;this.boundsUpdates=0;}
  clone(){return new Sphere(this.attributes.position.array);}
  computeVertexNormals(){this.normalUpdates++;}
  computeBoundingBox(){this.boundsUpdates++;}computeBoundingSphere(){this.boundsUpdates++;}
}
// The same unit-sphere sampling density used by render.js; not pre-bent data.
const points=[];
for(let y=0;y<=9;y++)for(let x=0;x<=12;x++){
  const theta=y/9*Math.PI,phi=x/12*Math.PI*2;
  points.push(-Math.cos(phi)*Math.sin(theta),Math.cos(theta),Math.sin(phi)*Math.sin(theta));
}
const sphere=new Sphere(points),original=Array.from(sphere.attributes.position.array);
const root=new O();root.scale.setScalar(.72);
const jet=new O(new G(),new M({color:0x28d7ff})),flame=new O(new G(),new M({color:0xff7a1f}));
root.add(jet);root.userData={jet,flame};
const context={THREE:{Group:O,Mesh:O,TorusGeometry:G,MeshBasicMaterial:M},player:root,window:{},SPH:sphere,CYL:new G(),BOXG:new G(),pho:(c,s,sp)=>new M({color:c,shininess:s,specular:sp})};
context.mesh=(g,m,x,y,z,sx,sy,sz)=>{const o=new O(g,m);o.position.set(x,y,z);o.scale.set(sx,sy??sx,sz??sx);return o;};
vm.createContext(context);vm.runInContext(fs.readFileSync(path.join(__dirname,'../src/player-visual.js'),'utf8'),context);
const preview=context.buildRobotVisual(new O());preview.scale.setScalar(.72);
function eyeData(robot){return robot.userData.eyes.map(e=>({position:e.position,parts:e.children.map(m=>({position:m.position,scale:m.scale,color:m.material.color.getHex(),points:Array.from(m.geometry.attributes.position.array)}))}));}
function inspect(robot,label){
  ok(robot.userData.eyes.length===2,label+' has two eyes');
  robot.userData.eyes.forEach((e,index)=>{
    const name=label+' eye '+index;
    ok(same(e.position,new V(index===0?-.14:.14,.17,.472)),name+' preserves spacing and face placement');
    ok(e.children.length===2,name+' remains a filled cyan lens plus highlight, not extra expression parts');
    const body=e.children[0],glow=e.children[1],g=body.geometry,p=g.attributes.position;
    ok(g!==sphere&&g.attributes.position.array!==sphere.attributes.position.array,name+' owns a cloned eye surface');
    ok(p.count===130&&p.count===sphere.attributes.position.count,name+' preserves sphere topology');
    ok(body.geometry===glow.geometry,name+' lens and highlight use the same curved surface');
    ok(same(body.scale,new V(.066,.041,.024))&&same(glow.scale,new V(.032,.020,.010)),name+' preserves filled width, height scale and depth');
    ok(body.material.color.getHex()===0x28d7ff&&glow.material.color.getHex()===0xbaf7ff,name+' preserves cyan/bright contrast');
    ok(same(glow.position,new V(0,0,.018)),name+' preserves highlight offset');
    let untouched=true,bent=true,finite=true;
    const center=[],ends=[];
    for(let i=0;i<p.count;i++){
      const x=original[i*3],y=original[i*3+1],z=original[i*3+2];
      untouched&&=p.getX(i)===x&&p.getZ(i)===z;
      bent&&=close(p.getY(i),y+.9*(.5-x*x));
      finite&&=Number.isFinite(p.getY(i));
      if(Math.abs(x)<1e-5)center.push(p.getY(i));
      if(Math.abs(x)>.98)ends.push(p.getY(i));
    }
    const middle=(Math.max(...center)+Math.min(...center))/2,edge=(Math.max(...ends)+Math.min(...ends))/2;
    ok(untouched&&finite,name+' changes only finite vertical coordinates');
    ok(bent&&middle-edge>.8,name+' has a measured upward arch, not a neutral sphere');
    ok(close(Math.max(...center)-Math.min(...center),2),name+' stays open and filled rather than a thin closed-eye stroke');
    ok(g.normalUpdates===1&&g.boundsUpdates===2&&p.needsUpdate,name+' updates normals, bounds and GPU vertex data');
  });
}
inspect(root,'gameplay');inspect(preview,'preview');
ok(same(eyeData(root),eyeData(preview)),'preview and gameplay contain identical constructed eye surfaces');
ok(root.userData.eyes[0].children[0].geometry!==preview.userData.eyes[0].children[0].geometry,'preview owns independent geometry for safe disposal');
ok(root.userData.eyes[0].children[0].geometry===root.userData.eyes[1].children[0].geometry,'both gameplay eyes share one consistent static shape');
ok(same(Array.from(sphere.attributes.position.array),original),'shared world sphere is never deformed');
ok(sphere.normalUpdates===0,'shared world sphere normals are untouched');
ok(root.userData.jet===jet&&jet.parent===root&&root.userData.flame===flame&&flame.parent===root.userData.head,'existing jet/flame identity and attachment survive');
ok(root.userData.mouth.geometry===context.BOXG&&same(root.userData.mouth.position,new V(0,-.065,.455)),'existing mouth is preserved without adding or redesigning it');
ok(same(root.scale,new V(.72,.72,.72))&&root.userData.visualStyle==='rounded-white-cyan-v57','robot identity and gameplay root scale remain unchanged');
const before=eyeData(root);
for(const skin of ROBOT_SKINS){
  applyRobotSkin(root,skin.id);applyRobotSkin(preview,skin.id);
  ok(same(eyeData(root),before),skin.id+' keeps the same static expression and contrast');
  ok(same(eyeData(root),eyeData(preview)),skin.id+' matches preview and gameplay');
  ok(Object.entries(root.userData.skinMaterials).every(([role,mat])=>mat.color.getHex()===skin[role]),skin.id+' retains the authored palette');
  ok(root.userData.eyes.every((e,i)=>e.children.every((m,j)=>m.material!==preview.userData.eyes[i].children[j].material)),skin.id+' preview cannot mutate gameplay eye materials');
}
if(failures){console.error(failures+' failed');process.exit(1);}console.log('all passed');
