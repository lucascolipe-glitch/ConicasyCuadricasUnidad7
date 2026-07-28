
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { ParametricGeometry } from 'three/addons/geometries/ParametricGeometry.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

const cfg = window.GRAPH_CONFIG || {};
const stage = document.getElementById('stage');
const renderer = new THREE.WebGLRenderer({antialias:true,alpha:false,preserveDrawingBuffer:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.setClearColor(0xffffff,1);
renderer.shadowMap.enabled = true;
stage.appendChild(renderer.domElement);
const labelRenderer = new CSS2DRenderer();
labelRenderer.domElement.style.position='absolute'; labelRenderer.domElement.style.inset='0'; labelRenderer.domElement.style.pointerEvents='none';
stage.appendChild(labelRenderer.domElement);
const scene = new THREE.Scene(); scene.background = new THREE.Color(0xffffff);
scene.add(new THREE.HemisphereLight(0xffffff,0xd8e0ef,2.0));
const key = new THREE.DirectionalLight(0xffffff,2.2); key.position.set(7,10,8); key.castShadow=true; scene.add(key);
const fill = new THREE.DirectionalLight(0xffffff,1.1); fill.position.set(-7,5,-6); scene.add(fill);

const perspective = new THREE.PerspectiveCamera(42,1,.05,500);
const ortho = new THREE.OrthographicCamera(-6,6,6,-6,.05,500);
let camera = perspective;
const defaultPos = cfg.camera || [8,7,9];
perspective.position.set(...defaultPos); ortho.position.set(...defaultPos);
let controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping=true; controls.dampingFactor=.08; controls.screenSpacePanning=true; controls.target.set(...mathToThree(...(cfg.target||[0,0,0])).toArray());

const surfaceGroup = new THREE.Group(); scene.add(surfaceGroup);
const axesGroup = new THREE.Group(); scene.add(axesGroup);
const grid = new THREE.GridHelper(cfg.gridSize||12, cfg.gridDivisions||12, 0x9aa7b7, 0xdfe5ed); grid.material.transparent=true; grid.material.opacity=.55; scene.add(grid);
const traceGroup = new THREE.Group(); scene.add(traceGroup);
const materials=[];
const primary = cfg.color || '#2563eb';
function material(color=primary, opacity=cfg.opacity ?? .66, wireframe=false){
  const m=new THREE.MeshStandardMaterial({color,side:THREE.DoubleSide,transparent:opacity<1,opacity,roughness:.42,metalness:.03,wireframe}); materials.push(m); return m;
}
function mathToThree(x,y,z){ return new THREE.Vector3(y,z,x); }
function addMesh(geometry, color=primary, opacity=cfg.opacity ?? .66, parent=surfaceGroup){ const mesh=new THREE.Mesh(geometry,material(color,opacity)); mesh.castShadow=true; mesh.receiveShadow=true; parent.add(mesh); return mesh; }
function parametric(fn, su=72, sv=44){
  return new ParametricGeometry((u,v,target)=>{ const p=fn(u,v); const q=mathToThree(p[0],p[1],p[2]); target.set(q.x,q.y,q.z); },su,sv);
}
function addLine(points,color='#1246a3',width=2,parent=surfaceGroup,dashed=false){
  const geom=new THREE.BufferGeometry().setFromPoints(points.map(p=>mathToThree(...p)));
  const mat=dashed?new THREE.LineDashedMaterial({color,dashSize:.16,gapSize:.1}):new THREE.LineBasicMaterial({color,linewidth:width});
  const line=new THREE.Line(geom,mat); if(dashed) line.computeLineDistances(); parent.add(line); return line;
}
function addPlane(center,size,normal,color='#93c5fd',opacity=.35,parent=surfaceGroup){
  const g=new THREE.PlaneGeometry(size[0],size[1]); const m=material(color,opacity); const mesh=new THREE.Mesh(g,m);
  // PlaneGeometry is in local XY. Build quaternion from local normal (0,0,1) to requested math normal.
  const n=mathToThree(...normal).normalize(); mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),n); mesh.position.copy(mathToThree(...center)); parent.add(mesh); return mesh;
}
function label(text,pos,parent=axesGroup){ const el=document.createElement('div'); el.className='label3d'; el.textContent=text; const obj=new CSS2DObject(el); obj.position.copy(mathToThree(...pos)); parent.add(obj); }
function arrowAxis(from,to,name){
  const a=mathToThree(...from), b=mathToThree(...to), dir=b.clone().sub(a), len=dir.length();
  const shaft=new THREE.Mesh(new THREE.CylinderGeometry(.018,.018,len-.22,10),new THREE.MeshBasicMaterial({color:0x111827})); shaft.position.copy(a.clone().add(b).multiplyScalar(.5)); shaft.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),dir.clone().normalize()); axesGroup.add(shaft);
  const head=new THREE.Mesh(new THREE.ConeGeometry(.09,.23,16),new THREE.MeshBasicMaterial({color:0x111827})); head.position.copy(b.clone().addScaledVector(dir.clone().normalize(),-.09)); head.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),dir.clone().normalize()); axesGroup.add(head); label(name,to);
}
function buildAxes(){ const s=cfg.axisSize||5; arrowAxis([-s,0,0],[s,0,0],'x'); arrowAxis([0,-s,0],[0,s,0],'y'); arrowAxis([0,0,-s],[0,0,s],'z'); }
buildAxes();

function center(){ return cfg.center || [0,0,0]; }
function axisMap(axis, axial, p, q, c){
  const [h,k,l]=c;
  if(axis==='x') return [h+axial,k+p,l+q];
  if(axis==='y') return [h+p,k+axial,l+q];
  return [h+p,k+q,l+axial];
}
function buildSurface(){
  const t=cfg.type, c=center(), a=cfg.a||1.5,b=cfg.b||1,c3=cfg.c||1.2,R=cfg.R||2,T=cfg.T||1.45,axis=cfg.axis||'z',sign=cfg.sign??1;
  if(t==='ellipsoid'||t==='sphere'){
    const aa=t==='sphere'?(cfg.r||1):a, bb=t==='sphere'?(cfg.r||1):b, cc=t==='sphere'?(cfg.r||1):c3;
    addMesh(parametric((u,v)=>{const U=2*Math.PI*u,V=Math.PI*(v-.5); return [c[0]+aa*Math.cos(V)*Math.cos(U),c[1]+bb*Math.cos(V)*Math.sin(U),c[2]+cc*Math.sin(V)];}));
  } else if(t==='ellipticParaboloid'){
    addMesh(parametric((u,v)=>{const r=R*u,th=2*Math.PI*v; return axisMap(axis,sign*r*r,a*r*Math.cos(th),b*r*Math.sin(th),c);},72,42));
  } else if(t==='hyperbolicParaboloid'){
    addMesh(parametric((u,v)=>{const p=(2*u-1)*R,q=(2*v-1)*R,axial=sign*(p*p-q*q); return axisMap(axis,axial,a*p,b*q,c);},70,70));
  } else if(t==='oneSheetHyperboloid'){
    addMesh(parametric((u,v)=>{const th=2*Math.PI*u,s=(2*v-1)*T; return axisMap(axis,c3*Math.sinh(s),a*Math.cosh(s)*Math.cos(th),b*Math.cosh(s)*Math.sin(th),c);},76,46));
  } else if(t==='twoSheetHyperboloid'){
    for(const side of [-1,1]) addMesh(parametric((u,v)=>{const th=2*Math.PI*u,s=T*v; return axisMap(axis,side*c3*Math.cosh(s),a*Math.sinh(s)*Math.cos(th),b*Math.sinh(s)*Math.sin(th),c);},72,36));
  } else if(t==='ellipticCone'){
    addMesh(parametric((u,v)=>{const th=2*Math.PI*u,r=(2*v-1)*T; return axisMap(axis,c3*r,a*r*Math.cos(th),b*r*Math.sin(th),c);},72,44));
  } else if(t==='ellipticCylinder'||t==='circularCylinder'){
    const aa=t==='circularCylinder'?(cfg.r||1):a,bb=t==='circularCylinder'?(cfg.r||1):b;
    addMesh(parametric((u,v)=>{const th=2*Math.PI*u,s=(2*v-1)*T; return axisMap(axis,s,aa*Math.cos(th),bb*Math.sin(th),c);},72,24));
  } else if(t==='hyperbolicCylinder'){
    for(const side of [-1,1]) addMesh(parametric((u,v)=>{const q=(2*u-1)*T,s=(2*v-1)*(cfg.length||3); return axisMap(axis,s,side*a*Math.cosh(q),b*Math.sinh(q),c);},42,20));
  } else if(t==='parabolicCylinder'){
    addMesh(parametric((u,v)=>{const q=(2*u-1)*T,s=(2*v-1)*(cfg.length||3); const p=q, second=sign*q*q/(2*(cfg.parabolaA||1)); if(axis==='z') return [c[0]+p,c[1]+second,c[2]+s]; if(axis==='y') return [c[0]+p,c[1]+s,c[2]+second]; return [c[0]+s,c[1]+p,c[2]+second];},50,20));
  } else if(t==='sineCylinder'){
    addMesh(parametric((u,v)=>{const x=(2*u-1)*Math.PI*2,y=(2*v-1)*3,z=Math.sin(x); return [x,y,z];},90,22));
  } else if(t==='obliqueParabolicCylinder'){
    addMesh(parametric((u,v)=>{const x=(2*u-1)*2.4,s=(2*v-1)*3; return [x,s,x*x-s];},60,30));
  } else if(t==='conicSection') buildConicSection(cfg.section||'circle');
  else if(t==='degenerateConics') buildDegenerateConics();
  else if(t==='point') { const m=new THREE.Mesh(new THREE.SphereGeometry(.16,24,16),material('#ef4444',1)); m.position.copy(mathToThree(...c)); surfaceGroup.add(m); }
  else if(t==='line') addLine([[c[0],-4,c[2]],[c[0],4,c[2]]],'#ef4444',4);
  else if(t==='parallelPlanes') { addPlane([0,0,cfg.z1??-1.4],[7,7],[0,0,1],'#ef4444',.48); addPlane([0,0,cfg.z2??1.4],[7,7],[0,0,1],'#ef4444',.48); }
  else if(t==='intersectingPlanes') { addPlane([0,0,0],[8,8],[1,0,-1],'#ef4444',.4); addPlane([0,0,0],[8,8],[1,0,1],'#b91c1c',.4); }
  else if(t==='singlePlane') addPlane([cfg.x||1,0,0],[8,8],[1,0,0],'#374151',.6);
  if(cfg.showSourceTraces) addSourceTraces();
}
function doubleCone(offset=[0,0,0], color='#cfd3d8'){
  const T=3,a=2/3;
  const mesh=addMesh(parametric((u,v)=>{const th=2*Math.PI*u,z=(2*v-1)*T,r=a*Math.abs(z); return [offset[0]+r*Math.cos(th),offset[1]+r*Math.sin(th),offset[2]+z];},72,42),color,.55);
  return mesh;
}
function buildConicSection(section){
  doubleCone();
  if(section==='circle'){
    addPlane([0,0,1],[5,5],[0,0,1],'#9ba6ff',.48); const pts=[]; for(let i=0;i<=160;i++){const t=2*Math.PI*i/160;pts.push([(2/3)*Math.cos(t),(2/3)*Math.sin(t),1]);} addLine(pts,'#0b46cc',3);
  } else if(section==='ellipse'){
    addPlane([0,0,1.25],[5,5],[0,.65,1],'#9df0a5',.5); const pts=[]; for(let i=0;i<=160;i++){const t=2*Math.PI*i/160,y=Math.cos(t)-.4;pts.push([.9*Math.sin(t),y,-.65*Math.cos(t)-.65*.4+1.75]);} addLine(pts,'#0b46cc',3);
  } else if(section==='parabola'){
    addPlane([0,0,1.5],[5,5],[0,1,2/3],'#f6a0a0',.5); const pts=[]; for(let i=0;i<=150;i++){const t=-1.73+3.46*i/150,y=-.5*t*t+.5,z=1.5*(.5*t*t-.5)+1.5;pts.push([t,y,z]);} addLine(pts,'#0b46cc',3);
  } else {
    addPlane([0,.3,0],[5,7],[0,1,0],'#f3e895',.52); for(const side of [-1,1]){const pts=[];for(let i=0;i<=160;i++){const t=-2.56+5.12*i/160;pts.push([-.3*Math.sinh(t),.3,side*.45*Math.cosh(t)]);}addLine(pts,'#0b46cc',3);}
  }
}
function buildDegenerateConics(){
  const offsets=[-7.5,0,7.5]; offsets.forEach(o=>doubleCone([o,0,0]));
  addPlane([-7.5,0,0],[5,4],[0,0,1],'#9ed7e7',.48); const dot=new THREE.Mesh(new THREE.SphereGeometry(.14,20,12),material('#1246c9',1)); dot.position.copy(mathToThree(-7.5,0,0)); surfaceGroup.add(dot); label('Punto',[-7.5,0,-3.8],surfaceGroup);
  addPlane([0,0,0],[5,7],[-2/3,0,1],'#9ed7e7',.48); addLine([[-2,0,-3],[2,0,3]],'#1246c9',3); label('Una recta',[0,0,-3.8],surfaceGroup);
  addPlane([7.5,0,0],[6,7],[0,1,0],'#9ed7e7',.48); addLine([[5.5,0,-3],[9.5,0,3]],'#1246c9',3); addLine([[9.5,0,-3],[5.5,0,3]],'#1246c9',3); label('Dos rectas',[7.5,0,-3.8],surfaceGroup);
}
function addSourceTraces(){
  const t=cfg.type,c=center(),a=cfg.a||2,b=cfg.b||1,T=cfg.T||3,axis=cfg.axis||'z';
  if(t==='ellipticCylinder'||t==='circularCylinder'){
    const vals=cfg.traceValues||[-3,0,3]; vals.forEach((s,j)=>{const pts=[];for(let i=0;i<=160;i++){const th=2*Math.PI*i/160;pts.push(axisMap(axis,s,a*Math.cos(th),b*Math.sin(th),c));}addLine(pts,j===1?'#ef4444':'#1647b8',2,surfaceGroup,true);});
  } else if(t==='hyperbolicCylinder'){
    (cfg.traceValues||[-3,0,3]).forEach((s,j)=>{for(const side of [-1,1]){const pts=[];for(let i=0;i<=100;i++){const q=-1.4+2.8*i/100;pts.push(axisMap(axis,s,side*a*Math.cosh(q),b*Math.sinh(q),c));}addLine(pts,j===1?'#ef4444':'#1647b8',2,surfaceGroup,true);}});
  } else if(t==='parabolicCylinder'){
    (cfg.traceValues||[-3,0,3]).forEach((s,j)=>{const pts=[];for(let i=0;i<=100;i++){const q=-T+2*T*i/100;let p;if(axis==='x')p=[c[0]+s,c[1]+q,c[2]+q*q];else if(axis==='y')p=[c[0]+q,c[1]+s,c[2]+q*q];else p=[c[0]+q,c[1]+q*q,c[2]+s];pts.push(p);}addLine(pts,j===1?'#ef4444':'#1647b8',2,surfaceGroup,true);});
  }
}
buildSurface();

// Trazas horizontales z=k mediante marching squares sobre la función implícita.
function implicit(x,y,z){
  const t=cfg.type,[h,k,l]=center(),a=cfg.a||1.5,b=cfg.b||1,c=cfg.c||1.2,axis=cfg.axis||'z',sg=cfg.sign??1;
  const X=x-h,Y=y-k,Z=z-l;
  if(t==='ellipsoid') return X*X/(a*a)+Y*Y/(b*b)+Z*Z/(c*c)-1;
  if(t==='sphere') {const r=cfg.r||1;return (X*X+Y*Y+Z*Z)/(r*r)-1;}
  if(t==='ellipticCone') return X*X/(a*a)+Y*Y/(b*b)-Z*Z/(c*c);
  if(t==='oneSheetHyperboloid') return X*X/(a*a)+Y*Y/(b*b)-Z*Z/(c*c)-1;
  if(t==='twoSheetHyperboloid') return -X*X/(a*a)-Y*Y/(b*b)+Z*Z/(c*c)-1;
  if(t==='ellipticParaboloid') return X*X/(a*a)+Y*Y/(b*b)-sg*Z;
  if(t==='hyperbolicParaboloid') return X*X/(a*a)-Y*Y/(b*b)-sg*Z;
  if(t==='ellipticCylinder'||t==='circularCylinder'){const aa=t==='circularCylinder'?(cfg.r||1):a,bb=t==='circularCylinder'?(cfg.r||1):b;return X*X/(aa*aa)+Y*Y/(bb*bb)-1;}
  if(t==='hyperbolicCylinder') return X*X/(a*a)-Y*Y/(b*b)-1;
  if(t==='parabolicCylinder') return Y-X*X/(2*(cfg.parabolaA||1));
  return 999;
}
function renderTrace(value){
  traceGroup.clear();
  if(!cfg.enableTrace) return;
  const range=cfg.traceRangeXY||[-5,5,-5,5], nx=72,ny=72,[xmin,xmax,ymin,ymax]=range;
  const plane=addPlane([(xmin+xmax)/2,(ymin+ymax)/2,value],[xmax-xmin,ymax-ymin],[0,0,1],'#f59e0b',.10,traceGroup);
  const pts=[]; const lerp=(a,b,fa,fb)=>a+(b-a)*(-fa)/(fb-fa);
  for(let i=0;i<nx;i++) for(let j=0;j<ny;j++){
    const x0=xmin+(xmax-xmin)*i/nx,x1=xmin+(xmax-xmin)*(i+1)/nx,y0=ymin+(ymax-ymin)*j/ny,y1=ymin+(ymax-ymin)*(j+1)/ny;
    const f00=implicit(x0,y0,value),f10=implicit(x1,y0,value),f11=implicit(x1,y1,value),f01=implicit(x0,y1,value);
    const e=[];
    if(f00*f10<0)e.push([lerp(x0,x1,f00,f10),y0,value]);
    if(f10*f11<0)e.push([x1,lerp(y0,y1,f10,f11),value]);
    if(f11*f01<0)e.push([lerp(x1,x0,f11,f01),y1,value]);
    if(f01*f00<0)e.push([x0,lerp(y1,y0,f01,f00),value]);
    if(e.length===2){pts.push(mathToThree(...e[0]),mathToThree(...e[1]));}
    else if(e.length===4){pts.push(mathToThree(...e[0]),mathToThree(...e[1]),mathToThree(...e[2]),mathToThree(...e[3]));}
  }
  if(pts.length){const g=new THREE.BufferGeometry().setFromPoints(pts); const l=new THREE.LineSegments(g,new THREE.LineBasicMaterial({color:0xea580c})); traceGroup.add(l);}
}
const traceBox=document.querySelector('.trace-controls');
if(cfg.enableTrace && traceBox){traceBox.classList.add('visible');const slider=document.getElementById('trace-slider');slider.min=cfg.traceMin??-3;slider.max=cfg.traceMax??3;slider.step=cfg.traceStep??.1;slider.value=cfg.traceInitial??0;const out=document.getElementById('trace-value');const update=()=>{out.textContent=Number(slider.value).toFixed(1);renderTrace(Number(slider.value));};slider.addEventListener('input',update);update();}

function resize(){
  const w=stage.clientWidth,h=stage.clientHeight; renderer.setSize(w,h,false); labelRenderer.setSize(w,h);
  perspective.aspect=w/h; perspective.updateProjectionMatrix(); const span=cfg.orthoSpan||6,aspect=w/h; ortho.left=-span*aspect;ortho.right=span*aspect;ortho.top=span;ortho.bottom=-span;ortho.updateProjectionMatrix();
}
new ResizeObserver(resize).observe(stage); resize();
function resetCamera(){camera.position.set(...defaultPos);controls.target.copy(mathToThree(...(cfg.target||[0,0,0])));controls.update();}
document.getElementById('reset-camera').addEventListener('click',resetCamera);
document.getElementById('toggle-grid').addEventListener('click',()=>grid.visible=!grid.visible);
document.getElementById('toggle-axes').addEventListener('click',()=>axesGroup.visible=!axesGroup.visible);
document.getElementById('opacity').addEventListener('input',e=>{const value=Number(e.target.value);materials.forEach(m=>{if(m.opacity<.95||cfg.opacity<1){m.opacity=value;m.transparent=value<1;m.needsUpdate=true;}});});
document.getElementById('projection').addEventListener('change',e=>{
  const old=camera,newCam=e.target.value==='ortho'?ortho:perspective;newCam.position.copy(old.position);newCam.quaternion.copy(old.quaternion);camera=newCam;controls.dispose();controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.screenSpacePanning=true;controls.target.copy(mathToThree(...(cfg.target||[0,0,0])));controls.update();
});
document.getElementById('export-png').addEventListener('click',()=>{renderer.render(scene,camera);const a=document.createElement('a');a.download=(cfg.slug||'grafico-3d')+'.png';a.href=renderer.domElement.toDataURL('image/png');a.click();});
function animate(){requestAnimationFrame(animate);controls.update();renderer.render(scene,camera);labelRenderer.render(scene,camera);} animate();
