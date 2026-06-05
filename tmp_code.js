
'use strict';

// ══════════════════════════════════════════════════════════════
// MENU STARS
// ══════════════════════════════════════════════════════════════
(function(){
  const sc = document.getElementById('menu-stars-canvas');
  const ctx = sc.getContext('2d');
  const stars = Array.from({length:200},()=>({
    x:Math.random()*window.innerWidth, y:Math.random()*window.innerHeight,
    r:Math.random()*1.5+.3, a:Math.random()
  }));
  function resizeStars(){
    sc.width = window.innerWidth;
    sc.height = window.innerHeight;
  }
  function drawStars(){
    ctx.clearRect(0,0,sc.width,sc.height);
    stars.forEach(s=>{
      s.a += 0.005*(Math.random()-.5);
      s.a = Math.max(.1,Math.min(1,s.a));
      ctx.fillStyle=`rgba(255,255,255,${s.a})`;
      ctx.beginPath();ctx.arc(s.x,s.y,s.r,0,Math.PI*2);ctx.fill();
    });
    requestAnimationFrame(drawStars);
  }
  resizeStars();
  window.addEventListener('resize',resizeStars);
  drawStars();
})();

function showControls(){
  alert('WASD — Move\nSPACE — Jump\nSHIFT — Sneak\nMouse Drag — Look\nLeft Click — Break Block\nRight Click — Place Block\nScroll — Change Block\nT or / — Open Codex\nESC — Pause');
}
window.showControls=showControls;

const OUTFIT_KEY='cc_outfit';
const OUTFIT_DEFAULT={skin:'#d49a6a',shirt:'#1D9E75',pants:'#263238',accent:'#5DCAA5'};
const OUTFIT_CHOICES={
  skin:['#f2c39a','#d49a6a','#9f6a42','#6f4328','#f0d0b2','#b77a55'],
  shirt:['#1D9E75','#1565C0','#C62828','#7B1FA2','#F9A825','#ECEFF1'],
  pants:['#263238','#37474F','#1A237E','#4E342E','#212121','#455A64'],
  accent:['#5DCAA5','#00E5FF','#FFD600','#FF7043','#CE93D8','#ECEFF1']
};
let outfit=loadOutfit();

function loadOutfit(){
  try{return {...OUTFIT_DEFAULT,...JSON.parse(localStorage.getItem(OUTFIT_KEY)||'{}')};}
  catch(e){return {...OUTFIT_DEFAULT};}
}
function applyOutfit(){
  const root=document.documentElement;
  root.style.setProperty('--skin',outfit.skin);
  root.style.setProperty('--shirt',outfit.shirt);
  root.style.setProperty('--pants',outfit.pants);
  root.style.setProperty('--accent',outfit.accent);
  document.querySelectorAll('.swatch').forEach(b=>b.classList.toggle('sel',outfit[b.dataset.part]===b.dataset.color));
}
function setOutfit(part,color){outfit[part]=color;applyOutfit();}
function buildDressingRoom(){
  for(const part of Object.keys(OUTFIT_CHOICES)){
    const wrap=document.getElementById(part+'Swatches');
    wrap.innerHTML='';
    OUTFIT_CHOICES[part].forEach(color=>{
      const b=document.createElement('button');
      b.className='swatch'; b.type='button';
      b.style.background=color; b.dataset.part=part; b.dataset.color=color;
      b.setAttribute('aria-label',part+' '+color);
      b.addEventListener('click',()=>setOutfit(part,color));
      wrap.appendChild(b);
    });
  }
  applyOutfit();
}
function openDressingRoom(){
  applyOutfit();
  document.getElementById('dressing').style.display='flex';
}
function closeDressingRoom(){
  document.getElementById('dressing').style.display='none';
}
function saveDressingRoom(){
  try{localStorage.setItem(OUTFIT_KEY,JSON.stringify(outfit));}catch(e){}
  closeDressingRoom();
}
window.openDressingRoom=openDressingRoom;
window.closeDressingRoom=closeDressingRoom;

if(!window.THREE){
  window.startGame=function(){
    alert('Minecraft Codex could not load its 3D engine. Make sure index.html and three.min.js are in the same folder, then reload.');
  };
  throw new Error('Three.js failed to load');
}

// ══════════════════════════════════════════════════════════════
// BLOCK REGISTRY
// ══════════════════════════════════════════════════════════════
const BD = {
  grass:    {t:'#56AB2F',s:'#6D4C41',b:'#5D4037'},
  dirt:     {t:'#795548',s:'#795548',b:'#795548'},
  stone:    {t:'#9E9E9E',s:'#9E9E9E',b:'#9E9E9E'},
  cobble:   {t:'#6e6e6e',s:'#6e6e6e',b:'#6e6e6e'},
  coal:     {t:'#3f3f3f',s:'#5c5c5c',b:'#3f3f3f'},
  iron:     {t:'#d8b38a',s:'#b98962',b:'#d8b38a'},
  wood:     {t:'#bcaaa4',s:'#795548',b:'#bcaaa4'},
  plank:    {t:'#FFCC80',s:'#FFCC80',b:'#FFCC80'},
  leaves:   {t:'#2E7D32',s:'#388E3C',b:'#2E7D32',tr:1,op:.88},
  glass:    {t:'#B3E5FC',s:'#B3E5FC',b:'#B3E5FC',tr:1,op:.35},
  sand:     {t:'#FFF176',s:'#F9A825',b:'#FFF176'},
  water:    {t:'#1565C0',s:'#1976D2',b:'#1565C0',tr:1,op:.65},
  lava:     {t:'#FF5722',s:'#BF360C',b:'#FF5722',em:'#FF3D00'},
  gravel:   {t:'#90A4AE',s:'#90A4AE',b:'#90A4AE'},
  snow:     {t:'#ECEFF1',s:'#CFD8DC',b:'#ECEFF1'},
  diamond:  {t:'#00E5FF',s:'#00BCD4',b:'#00E5FF',em:'#004D40'},
  gold:     {t:'#FFD600',s:'#FFA000',b:'#FFD600',em:'#3E2723'},
  cactus:   {t:'#2E7D32',s:'#1B5E20',b:'#2E7D32'},
  brick:    {t:'#BF360C',s:'#BF360C',b:'#BF360C'},
  obsidian: {t:'#1A0533',s:'#1A0533',b:'#1A0533'},
  glowstone:{t:'#FFE082',s:'#FFD54F',b:'#FFE082',em:'#FFF9C4'},
  bedrock:  {t:'#263238',s:'#263238',b:'#263238'},
  apple:    {t:'#D32F2F',s:'#B71C1C',b:'#D32F2F'},
  bread:    {t:'#F9A825',s:'#E65100',b:'#F9A825'}
};
const HOTBAR = ['grass','dirt','stone','cobble','coal','iron','wood','plank','glass','sand','lava','diamond','brick','glowstone','gold','obsidian','snow','cactus','apple','bread'];
const LABELS = {grass:'Grass',dirt:'Dirt',stone:'Stone',cobble:'Cobble',coal:'Coal',iron:'Iron',wood:'Wood',plank:'Plank',glass:'Glass',sand:'Sand',lava:'Lava',diamond:'Diamond',brick:'Brick',glowstone:'Glow',gold:'Gold',obsidian:'Void',snow:'Snow',cactus:'Cactus',apple:'Apple',bread:'Bread'};
const FOOD_ITEMS = {apple:{hp:2,hunger:5},bread:{hp:3,hunger:8}};

// ══════════════════════════════════════════════════════════════
// THREE.JS SETUP
// ══════════════════════════════════════════════════════════════
const canvas = document.getElementById('gc');
const renderer = new THREE.WebGLRenderer({canvas, antialias:false, powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,1));
renderer.shadowMap.enabled = false;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB);
scene.fog = new THREE.Fog(0x87CEEB, 55, 125);

const cam = new THREE.PerspectiveCamera(70,1,0.05,260);

const ambLight = new THREE.AmbientLight(0xffffff,0.6); scene.add(ambLight);
const sunLight = new THREE.DirectionalLight(0xFFFDE7,1.1);
sunLight.position.set(30,70,30); sunLight.castShadow=false;
sunLight.shadow.mapSize.set(1024,1024);
sunLight.shadow.camera.near=1; sunLight.shadow.camera.far=150;
sunLight.shadow.camera.left=-50; sunLight.shadow.camera.right=50;
sunLight.shadow.camera.top=50; sunLight.shadow.camera.bottom=-50;
scene.add(sunLight);
const hemiLight = new THREE.HemisphereLight(0x87CEEB,0x33691E,0.4); scene.add(hemiLight);

function resize(){
  renderer.setSize(window.innerWidth,window.innerHeight,false);
  cam.aspect = window.innerWidth/window.innerHeight;
  cam.updateProjectionMatrix();
}
resize(); window.addEventListener('resize',resize);

// ══════════════════════════════════════════════════════════════
// WORLD
// ══════════════════════════════════════════════════════════════
const world=new Map(), meshMap=new Map(), MC={};
const CUBE_GEOM=new THREE.BoxGeometry(1,1,1);
let rayObjects=[];
let bulkWorldEdit=false;
const TRANSPARENT_BLOCKS=new Set(['water','leaves','glass','lava']);
const NEIGHBORS=[[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]];
function bk(x,y,z){return x+','+y+','+z}
function gmat(col,tr,op,em){
  const k=col+'|'+(tr?op:1)+'|'+(em||'');
  if(!MC[k]) MC[k]=new THREE.MeshLambertMaterial({
    color:new THREE.Color(col), transparent:!!tr, opacity:op??1,
    emissive:em?new THREE.Color(em):new THREE.Color(0),
    side:tr?THREE.DoubleSide:THREE.FrontSide
  });
  return MC[k];
}
function removeMeshAt(k){
  const old=meshMap.get(k);
  if(!old) return;
  scene.remove(old);
  meshMap.delete(k);
  rayObjects=rayObjects.filter(o=>o!==old);
}
function shouldRenderBlock(x,y,z,type){
  if(!type||!BD[type]) return false;
  return NEIGHBORS.some(([dx,dy,dz])=>{
    const nt=world.get(bk(x+dx,y+dy,z+dz));
    if(!nt||nt==='air') return true;
    if(nt===type) return false;
    return TRANSPARENT_BLOCKS.has(type)||TRANSPARENT_BLOCKS.has(nt);
  });
}
function renderBlockAt(x,y,z){
  const k=bk(x,y,z);
  removeMeshAt(k);
  const type=world.get(k);
  if(!shouldRenderBlock(x,y,z,type)) return;
  const d=BD[type];
  const m=new THREE.Mesh(CUBE_GEOM,[
    gmat(d.s,d.tr,d.op,d.em),gmat(d.s,d.tr,d.op,d.em),
    gmat(d.t,d.tr,d.op,d.em),gmat(d.b,d.tr,d.op,d.em),
    gmat(d.s,d.tr,d.op,d.em),gmat(d.s,d.tr,d.op,d.em)
  ]);
  m.position.set(x,y,z); m.castShadow=false; m.receiveShadow=false;
  m.userData={type,x,y,z}; scene.add(m); meshMap.set(k,m); rayObjects.push(m);
}
function refreshAround(x,y,z){
  renderBlockAt(x,y,z);
  NEIGHBORS.forEach(([dx,dy,dz])=>renderBlockAt(x+dx,y+dy,z+dz));
}
function rebuildVisibleWorld(){
  meshMap.forEach(m=>scene.remove(m));
  meshMap.clear(); rayObjects=[];
  world.forEach((type,k)=>{
    const [x,y,z]=k.split(',').map(Number);
    renderBlockAt(x,y,z);
  });
}
function placeBlock(x,y,z,type){
  x=Math.round(x);y=Math.round(y);z=Math.round(z);
  const k=bk(x,y,z);
  if(!type||type==='air'||!BD[type]){
    world.delete(k);
    trackBlockKey(x,z,k,false);
  } else {
    world.set(k,type);
    trackBlockKey(x,z,k,true);
  }
  if(!bulkWorldEdit) refreshAround(x,y,z);
}
function removeBlock(x,y,z){
  x=Math.round(x);y=Math.round(y);z=Math.round(z);
  const k=bk(x,y,z);
  const type=world.get(k);
  world.delete(k);
  trackBlockKey(x,z,k,false);
  if(!bulkWorldEdit) refreshAround(x,y,z);
  return type;
}
function clearAll(){meshMap.forEach(m=>scene.remove(m));meshMap.clear();rayObjects=[];world.clear();}

// ══════════════════════════════════════════════════════════════
// TERRAIN / CHUNKS  — infinite deterministic world
// ══════════════════════════════════════════════════════════════
const CHUNK_SIZE=16, LOAD_RADIUS=2, SEA=0, BEDROCK_Y=-6, WORLD_TOP=34;
const loadedChunks=new Map();
let activeChunkKey='';
let spawnPos=new THREE.Vector3(0,10,0);

function chunkCoord(v){return Math.floor(v/CHUNK_SIZE);}
function chunkKey(cx,cz){return cx+','+cz;}
function blockChunkKey(x,z){return chunkKey(chunkCoord(x),chunkCoord(z));}
function trackBlockKey(x,z,k,on){
  const ch=loadedChunks.get(blockChunkKey(x,z));
  if(!ch) return;
  if(on) ch.blocks.add(k);
  else ch.blocks.delete(k);
}
function hash2(a,b,s){
  let n=(Math.imul(a,374761393)^Math.imul(b,668265263)^Math.imul(s,1442695041))>>>0;
  n=(n^(n>>>13))>>>0;
  n=Math.imul(n,1274126177)>>>0;
  return ((n^(n>>>16))>>>0)/4294967296;
}
function sn(x,z,s){
  const ix=Math.floor(x),iz=Math.floor(z),fx=x-ix,fz=z-iz;
  const u=fx*fx*(3-2*fx),v=fz*fz*(3-2*fz);
  return hash2(ix,iz,s)*(1-u)*(1-v)+hash2(ix+1,iz,s)*u*(1-v)+hash2(ix,iz+1,s)*(1-u)*v+hash2(ix+1,iz+1,s)*u*v;
}
function fbm(x,z,scale,seed,oct=4){
  let amp=1,sum=0,norm=0;
  for(let i=0;i<oct;i++){
    sum+=sn(x/scale,z/scale,seed+i*101)*amp;
    norm+=amp; amp*=.5; scale*=.5;
  }
  return sum/norm;
}
function rnd3(x,y,z,s){
  return hash2(Math.floor(x)+Math.imul(Math.floor(y),97),Math.floor(z)+Math.imul(Math.floor(y),53),s);
}
function riverValue(x,z){return Math.abs(fbm(x,z,38,19,3)-.5);}
function biomeAt(x,z){
  const temp=fbm(x,z,82,31,3), wet=fbm(x+700,z-400,72,37,3), ridge=fbm(x-250,z+180,96,41,3);
  if(ridge>.73) return 'mountains';
  if(temp<.32) return 'snow';
  if(temp>.64&&wet<.42) return 'desert';
  if(wet>.62) return 'forest';
  return 'plains';
}
function getH(x,z){
  const b=biomeAt(x,z);
  let h=Math.round((fbm(x,z,90,5,4)-.5)*18+(fbm(x,z,24,7,3)-.5)*6+2);
  if(b==='mountains') h+=Math.round(5+fbm(x,z,34,9,3)*11);
  if(b==='desert') h=Math.round(h*.55+1);
  if(b==='snow') h+=2;
  const r=riverValue(x,z);
  if(r<.028) h=Math.min(h,SEA-2);
  else if(r<.05) h=Math.min(h,SEA);
  return Math.max(BEDROCK_Y+3,Math.min(WORLD_TOP-4,h));
}
function surfaceFor(x,z,h){
  const b=biomeAt(x,z);
  const steep=Math.max(Math.abs(getH(x+1,z)-h),Math.abs(getH(x-1,z)-h),Math.abs(getH(x,z+1)-h),Math.abs(getH(x,z-1)-h));
  if(h<=SEA+1) return 'sand';
  if(b==='desert') return 'sand';
  if(b==='mountains'&&(h>13||steep>3)) return h>16?'snow':'stone';
  if(b==='snow'||h>15) return 'snow';
  if(steep>4) return 'stone';
  return 'grass';
}
function generateColumn(x,z){
  const h=getH(x,z), surf=surfaceFor(x,z,h);
  placeBlock(x,BEDROCK_Y,z,'bedrock');
  if(h<SEA){
    for(let y=BEDROCK_Y+1;y<h-1;y++) placeBlock(x,y,z,'stone');
    placeBlock(x,h-1,z,'sand');
    for(let y=h;y<SEA;y++) placeBlock(x,y,z,'water');
    return;
  }
  for(let y=BEDROCK_Y+1;y<=h;y++){
    let type='stone';
    if(y===h) type=surf;
    else if(y>=h-2) type=surf==='sand'?'sand':'dirt';
    placeBlock(x,y,z,type);
  }
}
function carveCavesInChunk(cx,cz){
  const bx=cx*CHUNK_SIZE,bz=cz*CHUNK_SIZE;
  for(let lx=0;lx<CHUNK_SIZE;lx++) for(let lz=0;lz<CHUNK_SIZE;lz++){
    const x=bx+lx,z=bz+lz,h=getH(x,z);
    for(let y=BEDROCK_Y+2;y<=Math.min(h-3,18);y++){
      const cave=(sn((x+y*.7)/13,(z-y*.55)/13,91)+sn((x-y*.35)/8,(z+y*.2)/8,92))/2;
      if(cave>.66&&rnd3(x,y,z,93)>.28) removeBlock(x,y,z);
      if(y<=-3&&cave>.77&&rnd3(x,y,z,94)<.08) placeBlock(x,y,z,'lava');
    }
  }
}
function addOreVeins(cx,cz,type,count,minY,maxY,size,seed){
  const bx=cx*CHUNK_SIZE,bz=cz*CHUNK_SIZE;
  for(let i=0;i<count;i++){
    const ox=bx+Math.floor(rnd3(cx,i,cz,seed)*CHUNK_SIZE);
    const oz=bz+Math.floor(rnd3(cx,i,cz,seed+1)*CHUNK_SIZE);
    const oy=minY+Math.floor(rnd3(cx,i,cz,seed+2)*(maxY-minY+1));
    for(let dx=-size;dx<=size;dx++) for(let dy=-size;dy<=size;dy++) for(let dz=-size;dz<=size;dz++){
      const x=ox+dx,y=oy+dy,z=oz+dz;
      if(chunkCoord(x)!==cx||chunkCoord(z)!==cz) continue;
      if(Math.sqrt(dx*dx+dy*dy+dz*dz)<=size+.15&&blockAt(x,y,z)==='stone') placeBlock(x,y,z,type);
    }
  }
}
function putAirBlock(x,y,z,type){
  const cur=blockAt(x,y,z);
  if(!cur||cur==='leaves'||cur==='water') placeBlock(x,y,z,type);
}
function makeOak(x,y,z){
  const h=4+Math.floor(rnd3(x,y,z,110)*3);
  for(let yy=1;yy<=h;yy++) putAirBlock(x,y+yy,z,'wood');
  for(let yy=h-2;yy<=h+1;yy++) for(let dx=-2;dx<=2;dx++) for(let dz=-2;dz<=2;dz++){
    if(Math.abs(dx)+Math.abs(dz)+Math.max(0,yy-(y+h))<4){
      const blockType = (yy===h && Math.abs(dx)<=1 && Math.abs(dz)<=1 && Math.random()<0.08) ? 'apple' : 'leaves';
      putAirBlock(x+dx,yy,z+dz,blockType);
    }
  }
}
function makePine(x,y,z){
  const h=6+Math.floor(rnd3(x,y,z,111)*3);
  for(let yy=1;yy<=h;yy++) putAirBlock(x,y+yy,z,'wood');
  for(let layer=0;layer<5;layer++){
    const yy=y+h-layer,rad=Math.max(1,3-Math.floor(layer/2));
    for(let dx=-rad;dx<=rad;dx++) for(let dz=-rad;dz<=rad;dz++) if(Math.abs(dx)+Math.abs(dz)<=rad+1) putAirBlock(x+dx,yy,z+dz,'leaves');
  }
}
function makeCactus(x,y,z){
  const h=2+Math.floor(rnd3(x,y,z,112)*3);
  for(let yy=1;yy<=h;yy++) putAirBlock(x,y+yy,z,'cactus');
}
function addChunkFeatures(cx,cz){
  const bx=cx*CHUNK_SIZE,bz=cz*CHUNK_SIZE;
  for(let lx=3;lx<CHUNK_SIZE-3;lx++) for(let lz=3;lz<CHUNK_SIZE-3;lz++){
    const x=bx+lx,z=bz+lz,h=getH(x,z), surf=blockAt(x,h,z), bio=biomeAt(x,z), r=rnd3(x,0,z,120);
    if((surf==='grass'||surf==='snow')&&r<(bio==='forest'?.07:bio==='snow'?.035:.018)){
      if(bio==='snow'||bio==='mountains') makePine(x,h,z);
      else makeOak(x,h,z);
    }
    if(surf==='sand'&&bio==='desert'&&h>SEA+1&&r>.985) makeCactus(x,h,z);
  }
}
function generateChunk(cx,cz){
  const bx=cx*CHUNK_SIZE,bz=cz*CHUNK_SIZE;
  for(let lx=0;lx<CHUNK_SIZE;lx++) for(let lz=0;lz<CHUNK_SIZE;lz++) generateColumn(bx+lx,bz+lz);
  carveCavesInChunk(cx,cz);
  addOreVeins(cx,cz,'coal',10,-3,20,2,130);
  addOreVeins(cx,cz,'iron',7,-4,16,1,131);
  addOreVeins(cx,cz,'gold',4,-5,5,1,132);
  addOreVeins(cx,cz,'diamond',2,BEDROCK_Y+1,-2,1,133);
  addChunkFeatures(cx,cz);
}
function ensureChunk(cx,cz){
  const id=chunkKey(cx,cz);
  if(loadedChunks.has(id)) return false;
  loadedChunks.set(id,{cx,cz,blocks:new Set()});
  generateChunk(cx,cz);
  return true;
}
function unloadChunk(id){
  const ch=loadedChunks.get(id);
  if(!ch) return false;
  ch.blocks.forEach(k=>world.delete(k));
  loadedChunks.delete(id);
  return true;
}
function syncChunksAround(cx,cz,force=false){
  const need=new Set();
  for(let dx=-LOAD_RADIUS;dx<=LOAD_RADIUS;dx++) for(let dz=-LOAD_RADIUS;dz<=LOAD_RADIUS;dz++) need.add(chunkKey(cx+dx,cz+dz));
  let changed=false;
  bulkWorldEdit=true;
  for(const id of need){
    const [x,z]=id.split(',').map(Number);
    if(ensureChunk(x,z)) changed=true;
  }
  for(const id of Array.from(loadedChunks.keys())) if(!need.has(id)&&unloadChunk(id)) changed=true;
  bulkWorldEdit=false;
  if(changed||force) rebuildVisibleWorld();
}
function updateChunks(force=false){
  const cx=chunkCoord(player.pos.x),cz=chunkCoord(player.pos.z),id=chunkKey(cx,cz);
  if(!force&&id===activeChunkKey) return;
  activeChunkKey=id;
  syncChunksAround(cx,cz,force);
}
function ensureChunksForBox(x1,z1,x2,z2){
  const cxa=chunkCoord(Math.min(x1,x2)),cxb=chunkCoord(Math.max(x1,x2));
  const cza=chunkCoord(Math.min(z1,z2)),czb=chunkCoord(Math.max(z1,z2));
  let changed=false;
  bulkWorldEdit=true;
  for(let cx=cxa;cx<=cxb;cx++) for(let cz=cza;cz<=czb;cz++) if(ensureChunk(cx,cz)) changed=true;
  bulkWorldEdit=false;
  if(changed) rebuildVisibleWorld();
}
function findSpawnNear(x0,z0){
  for(let r=0;r<96;r++){
    for(let dx=-r;dx<=r;dx++) for(let dz=-r;dz<=r;dz++){
      if(Math.abs(dx)!==r&&Math.abs(dz)!==r) continue;
      const x=x0+dx,z=z0+dz,h=getH(x,z),surf=surfaceFor(x,z,h);
      if(h>=2&&h<=12&&surf==='grass') return new THREE.Vector3(x,h+1.36,z);
    }
  }
  const h=getH(x0,z0);
  return new THREE.Vector3(x0,h+1.36,z0);
}
function generateWorld(){
  clearAll();
  loadedChunks.clear();
  activeChunkKey='';
  spawnPos=findSpawnNear(0,0);
  activeChunkKey=chunkKey(chunkCoord(spawnPos.x),chunkCoord(spawnPos.z));
  syncChunksAround(chunkCoord(spawnPos.x),chunkCoord(spawnPos.z),true);
}

// ══════════════════════════════════════════════════════════════
// PLAYER
// ══════════════════════════════════════════════════════════════
const player={
  pos:new THREE.Vector3(),
  vel:new THREE.Vector3(),
  yaw:0, pitch:-0.2,
  onGround:false,
  hp:20,hunger:20,
  hungerT:0, dmgCD:0,
  dead:false, fallFromY:0,
  creative:false
};

function blockAt(x,y,z){return world.get(bk(Math.round(x),Math.round(y),Math.round(z)));}
function solid(x,y,z){const t=blockAt(x,y,z);return!!t&&t!=='water'&&t!=='leaves'&&t!=='glass'&&t!=='lava'&&t!=='air';}
function inWater(x,y,z){return blockAt(x,y,z)==='water';}
function inLava(x,y,z){return blockAt(x,y,z)==='lava';}
function intersectsPlayer(x,y,z){
  const HW=.32,HH=.9;
  return Math.abs(player.pos.x-x)<.5+HW &&
         Math.abs((player.pos.y-.05)-y)<.5+HH &&
         Math.abs(player.pos.z-z)<.5+HW;
}

function doPhysics(dt){
  if(player.dead) return;
  const p=player.pos;
  const swim=inWater(p.x,p.y,p.z);
  const burn=inLava(p.x,p.y,p.z);
  const GRAV=player.creative?0: swim?5: burn?3: 22;
  const SPEED=player.creative?14: isDown('ShiftLeft','ShiftRight','shift')?2.5: swim?3: 7;
  const HH=0.85,HW=0.28;

  if(!player.creative){
    // Lava
    if(burn){player.dmgCD-=dt;if(player.dmgCD<=0){damage(2,'lava');player.dmgCD=.5;}}
    // Hunger drain
    player.hungerT+=dt;
    if(player.hungerT>=30){player.hunger=Math.max(0,player.hunger-1);player.hungerT=0;drawHUD();}
    if(player.hunger===0){player.dmgCD-=dt;if(player.dmgCD<=0){damage(1,'hunger');player.dmgCD=3;}}
  }

  // Gravity
  if(!player.creative) player.vel.y-=GRAV*dt;
  else player.vel.y=0;

  if(swim&&!player.creative){player.vel.y*=.8;if(isDown('Space',' '))player.vel.y=3;}
  if(isDown('Space',' ')&&player.onGround&&!swim&&!player.creative){player.vel.y=8.5;player.onGround=false;}
  if(player.creative){
    if(isDown('Space',' ')) player.vel.y=SPEED;
    else if(isDown('ShiftLeft','ShiftRight','shift')) player.vel.y=-SPEED;
    else player.vel.y=0;
  }

  // Horizontal
  const fwd=new THREE.Vector3(-Math.sin(player.yaw),0,-Math.cos(player.yaw));
  const rgt=new THREE.Vector3(Math.cos(player.yaw),0,-Math.sin(player.yaw));
  const mv=new THREE.Vector3();
  if(isDown('KeyW','w','ArrowUp','arrowup'))    mv.addScaledVector(fwd,SPEED);
  if(isDown('KeyS','s','ArrowDown','arrowdown'))  mv.addScaledVector(fwd,-SPEED);
  if(isDown('KeyA','a','ArrowLeft','arrowleft'))  mv.addScaledVector(rgt,-SPEED);
  if(isDown('KeyD','d','ArrowRight','arrowright')) mv.addScaledVector(rgt,SPEED);
  player.vel.x=mv.x; player.vel.z=mv.z;

  if(player.creative){p.x+=player.vel.x*dt;p.y+=player.vel.y*dt;p.z+=player.vel.z*dt;return;}

  // Y
  p.y+=player.vel.y*dt;
  let og=false;
  for(const dx of[-HW,HW]) for(const dz of[-HW,HW]){
    const footY=p.y-HH-.05;
    if(solid(p.x+dx,footY,p.z+dz)){
      const fell=player.fallFromY-(p.y-HH);
      if(!player.onGround&&fell>4) damage(Math.floor((fell-3)*2),'fall');
      const blockY=Math.round(footY);
      p.y=blockY+.5+HH+.01;
      player.vel.y=0; og=true;
    }
    const headY=p.y+HH+.05;
    if(solid(p.x+dx,headY,p.z+dz)){
      const blockY=Math.round(headY);
      p.y=blockY-.5-HH-.01;
      player.vel.y=0;
    }
  }
  if(!og&&!player.onGround) player.fallFromY=Math.max(player.fallFromY,p.y);
  else if(!og) player.fallFromY=p.y;
  else player.fallFromY=p.y;
  player.onGround=og;
  // X
  p.x+=player.vel.x*dt;
  for(const dy of[-HH+.1,0,HH-.1]) for(const dz of[-HW,HW]){
    const sx=Math.sign(player.vel.x);
    if(sx!==0&&solid(p.x+sx*(HW+.05),p.y+dy,p.z+dz)){p.x-=player.vel.x*dt;player.vel.x=0;break;}
  }
  // Z
  p.z+=player.vel.z*dt;
  for(const dy of[-HH+.1,0,HH-.1]) for(const dx of[-HW,HW]){
    const sz=Math.sign(player.vel.z);
    if(sz!==0&&solid(p.x+dx,p.y+dy,p.z+sz*(HW+.05))){p.z-=player.vel.z*dt;player.vel.z=0;break;}
  }
  if(p.y<-20) damage(999,'void');
}

function damage(n,cause){
  if(player.creative) return;
  player.hp=Math.max(0,player.hp-n); drawHUD();
  if(player.hp<=0&&!player.dead) die(cause);
}
function die(cause){
  player.dead=true;
  const msgs={fall:'You fell to your death!',lava:'Burned alive in lava!',void:'Fell into the void!',hunger:'You starved to death!'};
  document.getElementById('deathmsg').textContent=msgs[cause]||'You perished.';
  document.getElementById('dead').style.display='flex';
}
function respawn(){
  player.dead=false;player.hp=20;player.hunger=20;player.vel.set(0,0,0);
  player.pos.copy(spawnPos);player.fallFromY=spawnPos.y;player.dmgCD=0;
  updateChunks(true);
  document.getElementById('dead').style.display='none';
  drawHUD();
}
window.respawn=respawn;

// ══════════════════════════════════════════════════════════════
// HUD
// ══════════════════════════════════════════════════════════════
function drawHUD(){
  const hr=document.getElementById('hprow'),hgr=document.getElementById('hgrow');
  hr.innerHTML='';hgr.innerHTML='';
  for(let i=0;i<10;i++){
    const d=document.createElement('div'),v=player.hp-i*2;
    d.className='pip hp'+(v<=0?' off':v===1?' half':'');hr.appendChild(d);
  }
  for(let i=0;i<10;i++){
    const d=document.createElement('div');
    d.className='pip hg'+(player.hunger-i*2<=0?' off':'');hgr.appendChild(d);
  }
  const surv=document.getElementById('survbadge');
  surv.textContent=player.creative?'CREATIVE':'SURVIVAL';
  surv.style.background=player.creative?'#1565C0':'#c62828';
}

// ══════════════════════════════════════════════════════════════
// HOTBAR
// ══════════════════════════════════════════════════════════════
let sel=0;
let inventory={};
function resetInventory(){
  inventory={};
  HOTBAR.forEach(type=>inventory[type]=0);
}
function updateHotbarCounts(){
  document.querySelectorAll('.hs').forEach((slot,i)=>{
    const type=HOTBAR[i];
    const count=inventory[type]||0;
    const countEl=slot.querySelector('.hs-count');
    if(countEl) countEl.textContent=player.creative?'':count;
    slot.classList.toggle('empty',!player.creative&&count<=0);
  });
}
function collectBlock(type){
  if(player.creative) return;
  let item = type;
  if(!HOTBAR.includes(item)){
    if(item==='leaves' && Math.random()<0.22) item='apple';
    else if(item==='grass' && Math.random()<0.1) item='bread';
    else return;
  }
  inventory[item]=(inventory[item]||0)+1;
  updateHotbarCounts();
}
function isFood(type){
  return FOOD_ITEMS.hasOwnProperty(type);
}
function eatFood(type){
  if(player.creative) return false;
  if(!isFood(type)) return false;
  if((inventory[type]||0)<=0) return false;
  inventory[type]--;
  player.hunger=Math.min(20,player.hunger+FOOD_ITEMS[type].hunger);
  player.hp=Math.min(20,player.hp+FOOD_ITEMS[type].hp);
  updateHotbarCounts();
  drawHUD();
  flashStatus('Ate '+(LABELS[type]||type)+'.');
  return true;
}
function canEatSelected(){
  const type=HOTBAR[sel];
  if(!isFood(type)){
    flashStatus('Selected item is not food.');
    return;
  }
  if(!eatFood(type)){
    flashStatus('No '+(LABELS[type]||type)+' left.');
  }
}
function spendBlock(type){
  if(player.creative) return true;
  if((inventory[type]||0)<=0) return false;
  inventory[type]-=1;
  updateHotbarCounts();
  return true;
}
function flashStatus(text){
  const el=document.getElementById('moveStatus');
  if(!el) return;
  el.textContent=text;
  clearTimeout(flashStatus.timer);
  flashStatus.timer=setTimeout(updateMoveStatus,900);
}
function selSlot(i){
  sel=((i%HOTBAR.length)+HOTBAR.length)%HOTBAR.length;
  document.querySelectorAll('.hs').forEach((s,j)=>s.classList.toggle('sel',j===sel));
}
function buildHotbar(){
  const hb=document.getElementById('hotbar'); hb.innerHTML='';
  HOTBAR.forEach((type,i)=>{
    const s=document.createElement('div'); s.className='hs'+(i===0?' sel':'');
    const ic=document.createElement('canvas'); ic.width=26;ic.height=26;ic.className='hs-icon';
    const cx2=ic.getContext('2d'); const d=BD[type];
    if(d){cx2.fillStyle=d.s;cx2.fillRect(0,0,26,26);cx2.fillStyle=d.t;cx2.fillRect(0,0,26,9);}
    const lbl=document.createElement('div'); lbl.className='hs-label'; lbl.textContent=LABELS[type]||type.slice(0,5);
    const nb=document.createElement('div'); nb.className='hs-num'; nb.textContent=i<9?i+1:'';
    const cnt=document.createElement('div'); cnt.className='hs-count';
    s.append(nb,ic,lbl,cnt); s.onclick=()=>selSlot(i); hb.appendChild(s);
  });
  updateHotbarCounts();
}

// ══════════════════════════════════════════════════════════════
// DAY/NIGHT
// ══════════════════════════════════════════════════════════════
let dayT=60,DAY=480,dayN=1;
function stepDay(dt){
  dayT+=dt;
  if(dayT>=DAY){dayT%=DAY;dayN++;}
  const t=dayT/DAY;
  let sky,si,ai,fog,ov,lbl;
  if(t<.08)     {sky='#FF7043';si=.3;ai=.25;fog='#FF7043';ov='rgba(30,0,0,.35)';lbl='Dawn';}
  else if(t<.42){sky='#87CEEB';si=1.1;ai=.6;fog='#87CEEB';ov='transparent';lbl=t<.25?'Morning':'Noon';}
  else if(t<.58){sky='#87CEEB';si=1.0;ai=.55;fog='#87CEEB';ov='transparent';lbl='Afternoon';}
  else if(t<.68){sky='#FF8A65';si=.4;ai=.3;fog='#FF8A65';ov='rgba(20,0,0,.25)';lbl='Dusk';}
  else          {sky='#0D1B2A';si=.05;ai=.08;fog='#0D1B2A';ov='rgba(0,0,30,.65)';lbl='Night';}
  scene.background.set(sky);
  scene.fog.color.set(fog);
  sunLight.intensity=si; hemiLight.intensity=ai;
  document.getElementById('dayover').style.background=ov;
  document.getElementById('daytxt').textContent=`Day ${dayN} · ${lbl}`;
}

// ══════════════════════════════════════════════════════════════
// INPUT
// ══════════════════════════════════════════════════════════════
const keys={};
const KEY_ALIAS={
  w:'KeyW',a:'KeyA',s:'KeyS',d:'KeyD',t:'KeyT',
  arrowup:'ArrowUp',arrowdown:'ArrowDown',arrowleft:'ArrowLeft',arrowright:'ArrowRight',
  ' ':'Space',spacebar:'Space',shift:'ShiftLeft',shiftleft:'ShiftLeft',shiftright:'ShiftRight',
  escape:'Escape',esc:'Escape','/':'Slash'
};
let paused=false, chatOpen=false;
function keyName(e){
  return KEY_ALIAS[(e.key||'').toLowerCase()]||e.code;
}
function isDown(...names){
  return names.some(n=>keys[n]);
}
function setKeyState(name,down){
  if(!name) return;
  keys[name]=down;
  const alias=KEY_ALIAS[String(name).toLowerCase()];
  if(alias) keys[alias]=down;
}
function clearKeys(){
  for(const k in keys) keys[k]=false;
  document.querySelectorAll('#movePad .down').forEach(btn=>btn.classList.remove('down'));
  updateMoveStatus();
}
function ensureGameFocus(){
  if(chatOpen||paused) return;
  try{window.focus();}catch(e){}
  try{canvas.focus({preventScroll:true});}catch(e){}
}
function updateMoveStatus(){
  const el=document.getElementById('moveStatus');
  if(!el) return;
  const active=[
    isDown('KeyW','w','ArrowUp','arrowup')?'W':'',
    isDown('KeyA','a','ArrowLeft','arrowleft')?'A':'',
    isDown('KeyS','s','ArrowDown','arrowdown')?'S':'',
    isDown('KeyD','d','ArrowRight','arrowright')?'D':'',
    isDown('Space',' ')?'SPACE':''
  ].filter(Boolean).join(' ');
  el.textContent='MOVE: '+(active||'ready');
}
function setGameKey(e,down){
  if(document.getElementById('dressing')?.style.display==='flex'){
    if(down&&keyName(e)==='Escape') closeDressingRoom();
    e.preventDefault();
    return;
  }
  const typing=/^(INPUT|TEXTAREA)$/.test(e.target?.tagName||'');
  if(typing){
    if(e.code==='Escape'&&chatOpen){toggleChat();e.preventDefault();e.stopPropagation();}
    return;
  }
  const code=keyName(e);
  if(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space','ShiftLeft','ShiftRight'].includes(code)){
    setKeyState(code,down);
    setKeyState(e.code,down);
    setKeyState((e.key||'').toLowerCase(),down);
    updateMoveStatus();
    e.preventDefault();
  }
  if(!down) return;
  if(code==='KeyE'&&!chatOpen){e.preventDefault();canEatSelected();}
  if((code==='KeyT'||code==='Slash')&&!chatOpen){e.preventDefault();toggleChat();}
  if(code==='Escape'){
    if(chatOpen){toggleChat();return;}
    paused=!paused;
    document.getElementById('pause').style.display=paused?'flex':'none';
  }
  const n=e.key==='0'?10:parseInt(e.key);
  if(n>=1&&n<=Math.min(10,HOTBAR.length)) selSlot(n-1);
}
window.addEventListener('keydown',e=>setGameKey(e,true),true);
window.addEventListener('keyup',e=>setGameKey(e,false),true);
window.addEventListener('blur',clearKeys);
document.addEventListener('visibilitychange',()=>{if(document.hidden)clearKeys();});
document.addEventListener('pointerdown',e=>{
  if(!gameRunning) return;
  if(e.target.closest('#chat,#dressing,#pause,#dead')) return;
  setTimeout(ensureGameFocus,0);
});

// Mouse drag look — only on game canvas, not UI
let dragging=false,lx=0,ly=0,downX=0,downY=0,dragMoved=false;
canvas.addEventListener('mousedown',e=>{
  if(chatOpen||paused) return;
  canvas.focus({preventScroll:true});
  dragging=true; dragMoved=false;
  lx=downX=e.clientX; ly=downY=e.clientY;
});
window.addEventListener('mouseup',()=>dragging=false);
window.addEventListener('mousemove',e=>{
  if(!dragging||chatOpen||paused) return;
  if(Math.hypot(e.clientX-downX,e.clientY-downY)>4) dragMoved=true;
  player.yaw  -=(e.clientX-lx)*.003;
  player.pitch-=(e.clientY-ly)*.003;
  player.pitch=Math.max(-1.5,Math.min(1.5,player.pitch));
  lx=e.clientX; ly=e.clientY;
});

// Touch
let tl=null;
canvas.addEventListener('touchstart',e=>{if(chatOpen||paused)return;const t=e.touches[0];tl={x:t.clientX,y:t.clientY};},{passive:true});
canvas.addEventListener('touchmove',e=>{
  if(!tl||chatOpen||paused) return;
  const t=e.touches[0];
  player.yaw  -=(t.clientX-tl.x)*.004;
  player.pitch-=(t.clientY-tl.y)*.004;
  player.pitch=Math.max(-1.5,Math.min(1.5,player.pitch));
  tl={x:t.clientX,y:t.clientY};
},{passive:true});

// Block interaction
const ray=new THREE.Raycaster(undefined,undefined,0,8);
canvas.addEventListener('click',e=>{
  if(chatOpen||paused) return;
  if(dragMoved){dragMoved=false;return;}
  ray.setFromCamera(new THREE.Vector2(0,0),cam);
  const hits=ray.intersectObjects(rayObjects);
  if(hits.length){
    const ud=hits[0].object.userData;
    if(ud.type!=='bedrock'||player.creative){
      const broken=removeBlock(ud.x,ud.y,ud.z);
      collectBlock(broken);
    }
  }
});
canvas.addEventListener('contextmenu',e=>{
  e.preventDefault();if(chatOpen||paused) return;
  ray.setFromCamera(new THREE.Vector2(0,0),cam);
  const hits=ray.intersectObjects(rayObjects);
  if(hits.length){
    const h=hits[0],n=h.face.normal,ud=h.object.userData;
    const x=ud.x+Math.round(n.x),y=ud.y+Math.round(n.y),z=ud.z+Math.round(n.z);
    const type=HOTBAR[sel];
    if(intersectsPlayer(x,y,z)) return;
    if(spendBlock(type)) placeBlock(x,y,z,type);
    else flashStatus('BREAK '+(LABELS[type]||type).toUpperCase()+' FIRST');
  }
});
canvas.addEventListener('wheel',e=>{e.preventDefault();selSlot(sel+(e.deltaY>0?1:-1));},{passive:false});

// ══════════════════════════════════════════════════════════════
// GAME LOOP
// ══════════════════════════════════════════════════════════════
const clock=new THREE.Clock();
let gameRunning=false;
const tcoordsEl = document.getElementById('tcoords');
const daytxtEl = document.getElementById('daytxt');
function gameLoop(){
  requestAnimationFrame(gameLoop);
  if(!gameRunning) return;
  const dt=Math.min(clock.getDelta(),.05);
  if(!paused){
    updateChunks();
    doPhysics(dt);
    stepDay(dt);
  }
  cam.position.copy(player.pos).add(new THREE.Vector3(0,.75,0));
  cam.rotation.order='YXZ';
  cam.rotation.y=player.yaw;
  cam.rotation.x=player.pitch;
  const p=player.pos;
  if(tcoordsEl){
    const coordText = `X:${p.x.toFixed(0)} Y:${p.y.toFixed(0)} Z:${p.z.toFixed(0)}`;
    if(tcoordsEl.firstChild) tcoordsEl.firstChild.textContent = coordText;
  }
  if(daytxtEl){
    daytxtEl.textContent = daytxtEl.textContent || 'Day 1';
  }
  renderer.render(scene,cam);
}
gameLoop();

// ══════════════════════════════════════════════════════════════
// START / MENU
// ══════════════════════════════════════════════════════════════
function startGame(creative=false){
  document.getElementById('menu').style.display='none';
  document.getElementById('game').style.display='block';
  clearKeys();
  setTimeout(ensureGameFocus,0);
  player.creative=creative;
  player.hp=20; player.hunger=20; player.dead=false;
  player.vel.set(0,0,0);
  generateWorld();
  player.pos.copy(spawnPos);
  player.yaw=Math.PI; player.pitch=-0.2;
  player.fallFromY=spawnPos.y;
  dayT=60; dayN=1; paused=false; chatOpen=false;
  document.getElementById('pause').style.display='none';
  document.getElementById('dead').style.display='none';
  document.getElementById('chat').classList.remove('open');
  document.getElementById('msgs').innerHTML='';
  resetInventory(); buildHotbar(); drawHUD();
  gameRunning=true;
  clock.start();
  addMsg('ai', creative
    ? 'Minecraft Codex creative mode! Fly with SPACE/SHIFT, no fall damage or hunger.\n\nAsk Codex for a castle, house, tower, bridge, tree, farm, pyramid, or fountain.'
    : 'Minecraft Codex survival mode! You spawned on solid land.\n\nWatch your health and hunger. Press T or / and ask Codex to build.');
}
window.startGame=startGame;
function goMenu(){
  gameRunning=false;
  clearKeys();
  document.getElementById('game').style.display='none';
  document.getElementById('menu').style.display='flex';
  document.getElementById('pause').style.display='none';
  document.getElementById('dead').style.display='none';
  paused=false;
}
window.goMenu=goMenu;
function resumeGame(){paused=false;document.getElementById('pause').style.display='none';clearKeys();ensureGameFocus();}
window.resumeGame=resumeGame;

// ══════════════════════════════════════════════════════════════
// CHAT + CODEX
// ══════════════════════════════════════════════════════════════
function toggleChat(){
  chatOpen=!chatOpen;
  document.getElementById('chat').classList.toggle('open',chatOpen);
  clearKeys();
  if(chatOpen) setTimeout(()=>document.getElementById('prompt').focus(),60);
  else canvas.focus({preventScroll:true});
}
window.toggleChat=toggleChat;
function addMsg(cls,text){
  const msgs=document.getElementById('msgs');
  const d=document.createElement('div');d.className='m '+cls;d.textContent=text;
  msgs.appendChild(d);msgs.scrollTop=msgs.scrollHeight;return d;
}

function clamp(n,min,max){return Math.max(min,Math.min(max,n));}
function topY(x,z){
  x=Math.round(x);z=Math.round(z);
  for(let y=WORLD_TOP;y>=BEDROCK_Y;y--) if(solid(x,y,z)) return y;
  return getH(x,z);
}
function buildSpot(w=12,d=12){
  const dist=10;
  const cx=Math.round(player.pos.x-Math.sin(player.yaw)*dist);
  const cz=Math.round(player.pos.z-Math.cos(player.yaw)*dist);
  return {x:cx-Math.floor(w/2),z:cz-Math.floor(d/2),y:topY(cx,cz)+1,cx,cz};
}
function fillBox(x1,y1,z1,x2,y2,z2,type){
  const xa=Math.round(Math.min(x1,x2)),xb=Math.round(Math.max(x1,x2));
  const za=Math.round(Math.min(z1,z2)),zb=Math.round(Math.max(z1,z2));
  const ya=Math.round(Math.min(y1,y2)),yb=Math.round(Math.max(y1,y2));
  ensureChunksForBox(xa,za,xb,zb);
  for(let x=xa;x<=xb;x++)for(let y=ya;y<=yb;y++)for(let z=za;z<=zb;z++)placeBlock(x,y,z,type);
}
function hollowBox(x,y,z,w,h,d,wall,roof=wall,floor='plank'){
  fillBox(x,y,z,x+w-1,y,z+d-1,floor);
  fillBox(x,y+1,z,x+w-1,y+h,z,wall);
  fillBox(x,y+1,z+d-1,x+w-1,y+h,z+d-1,wall);
  fillBox(x,y+1,z,x,y+h,z+d-1,wall);
  fillBox(x+w-1,y+1,z,x+w-1,y+h,z+d-1,wall);
  fillBox(x,y+h+1,z,x+w-1,y+h+1,z+d-1,roof);
}
function addWindows(x,y,z,w,h,d){
  for(let ix=x+2;ix<x+w-2;ix+=3){placeBlock(ix,y+3,z,'glass');placeBlock(ix,y+3,z+d-1,'glass');}
  for(let iz=z+2;iz<z+d-2;iz+=3){placeBlock(x,y+3,iz,'glass');placeBlock(x+w-1,y+3,iz,'glass');}
  removeBlock(x+Math.floor(w/2),y+1,z);removeBlock(x+Math.floor(w/2),y+2,z);
}
function buildHouse(){
  const s=buildSpot(10,9),x=s.x,y=s.y,z=s.z;
  hollowBox(x,y,z,10,4,9,'wood','plank','plank');
  for(let i=-1;i<=10;i++)for(let dz=0;dz<9;dz++)placeBlock(x+i,y+6-Math.min(Math.abs(i-4),3),z+dz,'brick');
  addWindows(x,y,z,10,4,9);
  return 'Built a Codex house. No sign-in, no API key.';
}
function buildTower(){
  const s=buildSpot(9,9),x=s.x,y=s.y,z=s.z;
  fillBox(x,y,z,x+8,y,z+8,'cobble');
  for(let yy=y+1;yy<=y+12;yy++){
    for(let i=0;i<9;i++){placeBlock(x+i,yy,z,'stone');placeBlock(x+i,yy,z+8,'stone');placeBlock(x,yy,z+i,'stone');placeBlock(x+8,yy,z+i,'stone');}
    if(yy%3===0){placeBlock(x+4,yy,z,'glass');placeBlock(x+4,yy,z+8,'glass');}
  }
  fillBox(x-1,y+13,z-1,x+9,y+13,z+9,'cobble');
  for(let i=0;i<9;i+=2){placeBlock(x+i,y+14,z,'cobble');placeBlock(x+i,y+14,z+8,'cobble');placeBlock(x,y+14,z+i,'cobble');placeBlock(x+8,y+14,z+i,'cobble');}
  return 'Built a tall Codex watchtower.';
}
function buildCastle(){
  const s=buildSpot(20,20),x=s.x,y=s.y,z=s.z;
  fillBox(x,y,z,x+19,y,z+19,'stone');
  for(let i=0;i<20;i++){for(let yy=1;yy<=5;yy++){placeBlock(x+i,y+yy,z,'cobble');placeBlock(x+i,y+yy,z+19,'cobble');placeBlock(x,y+yy,z+i,'cobble');placeBlock(x+19,y+yy,z+i,'cobble');}}
  [[x,z],[x+16,z],[x,z+16],[x+16,z+16]].forEach(([tx,tz])=>fillBox(tx,y+1,tz,tx+3,y+9,tz+3,'stone'));
  removeBlock(x+9,y+1,z);removeBlock(x+10,y+1,z);removeBlock(x+9,y+2,z);removeBlock(x+10,y+2,z);
  fillBox(x+8,y+6,z,x+11,y+8,z,'brick');
  fillBox(x+2,y+1,z+2,x+17,y+1,z+17,'grass');
  return 'Built a Codex castle with walls, towers, and a gate.';
}
function buildBridge(){
  const s=buildSpot(5,18),x=s.cx-2,y=s.y,z=s.z;
  fillBox(x,y,z,x+4,y,z+17,'plank');
  for(let dz=0;dz<18;dz+=3){placeBlock(x-1,y+1,z+dz,'wood');placeBlock(x+5,y+1,z+dz,'wood');}
  return 'Built a wooden Codex bridge.';
}
function buildPyramid(){
  const s=buildSpot(15,15),x=s.x,y=s.y,z=s.z;
  for(let layer=0;layer<7;layer++)fillBox(x+layer,y+layer,z+layer,x+14-layer,y+layer,z+14-layer,'sand');
  return 'Built a stepped desert pyramid.';
}
function buildTree(){
  const s=buildSpot(7,7),x=s.cx,y=s.y,z=s.cz;
  fillBox(x,y,z,x,y+6,z,'wood');
  for(let yy=y+4;yy<=y+8;yy++)for(let dx=-3;dx<=3;dx++)for(let dz=-3;dz<=3;dz++)if(Math.abs(dx)+Math.abs(dz)+Math.abs(yy-(y+6))<6)placeBlock(x+dx,yy,z+dz,'leaves');
  return 'Grew a giant Codex tree.';
}
function buildFarm(){
  const s=buildSpot(14,10),x=s.x,y=s.y,z=s.z;
  fillBox(x,y,z,x+13,y,z+9,'dirt');
  for(let dz=1;dz<9;dz+=3)fillBox(x,y+1,z+dz,x+13,y+1,z+dz,'water');
  for(let dz=0;dz<10;dz++)for(let ix=0;ix<14;ix++)if(blockAt(x+ix,y+1,z+dz)!=='water')placeBlock(x+ix,y+1,z+dz,'grass');
  fillBox(x-1,y+1,z-1,x+14,y+1,z-1,'wood');fillBox(x-1,y+1,z+10,x+14,y+1,z+10,'wood');
  return 'Planted a simple Codex farm.';
}
function buildFountain(){
  const s=buildSpot(9,9),x=s.x,y=s.y,z=s.z;
  fillBox(x,y,z,x+8,y,z+8,'stone');
  fillBox(x+1,y+1,z+1,x+7,y+1,z+7,'water');
  fillBox(x+3,y+1,z+3,x+5,y+4,z+5,'cobble');
  placeBlock(x+4,y+5,z+4,'water');
  return 'Built a Codex fountain.';
}
function clearBuildArea(){
  const s=buildSpot(16,16);
  for(let x=s.x;x<s.x+16;x++)for(let z=s.z;z<s.z+16;z++)for(let y=s.y;y<s.y+16;y++)removeBlock(x,y,z);
  return 'Cleared a build area in front of you.';
}
function runCodexBuild(msg){
  const q=msg.toLowerCase();
  if(q.includes('clear')) return clearBuildArea();
  if(q.includes('castle')) return buildCastle();
  if(q.includes('tower')) return buildTower();
  if(q.includes('bridge')) return buildBridge();
  if(q.includes('pyramid')) return buildPyramid();
  if(q.includes('tree')) return buildTree();
  if(q.includes('farm')||q.includes('garden')) return buildFarm();
  if(q.includes('fountain')||q.includes('water')) return buildFountain();
  if(q.includes('house')||q.includes('home')||q.includes('base')) return buildHouse();
  return buildHouse()+' Try: castle, tower, bridge, pyramid, tree, farm, fountain, or clear.';
}
async function sendToCodex(msg){
  const el=addMsg('th','Codex is building locally...');
  document.getElementById('sbtn').disabled=true;document.getElementById('cst').textContent='building...';
  await new Promise(r=>setTimeout(r,80));
  try{el.remove();addMsg('ai',runCodexBuild(msg));}
  catch(e){el.remove();addMsg('er','Build error: '+e.message);}
  document.getElementById('sbtn').disabled=false;document.getElementById('cst').textContent='ready';
}
function doSend(){
  const p=document.getElementById('prompt');const v=p.value.trim();if(!v)return;
  addMsg('me',v);p.value='';sendToCodex(v);
}
window.doSend=doSend;
document.getElementById('prompt').addEventListener('keydown',e=>{
  if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();doSend();}
  if(e.key==='Escape'){e.preventDefault();toggleChat();}
});
buildDressingRoom();
document.getElementById('playSurvival').addEventListener('click',()=>startGame());
document.getElementById('playCreative').addEventListener('click',()=>startGame(true));
document.getElementById('showDressingBtn').addEventListener('click',openDressingRoom);
document.getElementById('showControlsBtn').addEventListener('click',showControls);
document.getElementById('saveDressingBtn').addEventListener('click',saveDressingRoom);
document.getElementById('closeDressingBtn').addEventListener('click',closeDressingRoom);
document.querySelectorAll('#movePad [data-key]').forEach(btn=>{
  const code=btn.dataset.key;
  const set=down=>{
    setKeyState(code,down);
    btn.classList.toggle('down',down);
    updateMoveStatus();
    if(down) ensureGameFocus();
  };
  btn.addEventListener('pointerdown',e=>{e.preventDefault();set(true);});
  btn.addEventListener('pointerup',e=>{e.preventDefault();set(false);});
  btn.addEventListener('pointercancel',()=>set(false));
  btn.addEventListener('pointerleave',()=>set(false));
});
window.addEventListener('pointerup',()=>document.querySelectorAll('#movePad .down').forEach(btn=>{
  setKeyState(btn.dataset.key,false);
  btn.classList.remove('down');
  updateMoveStatus();
}));
