#!/bin/zsh
set -e

NODE_BIN=""
for candidate in \
  "/Applications/Codex.app/Contents/Resources/node" \
  "/Users/jaykanchan/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node" \
  "/opt/homebrew/bin/node" \
  "/usr/local/bin/node"
do
  if [ -x "$candidate" ]; then
    NODE_BIN="$candidate"
    break
  fi
done

if [ -z "$NODE_BIN" ]; then
  NODE_BIN="$(command -v node || true)"
fi

if [ -z "$NODE_BIN" ]; then
  echo "Could not find Node.js."
  echo "Open this file from Codex outputs again after Codex is running, or install Node.js."
  echo
  echo "Press any key to close this window."
  read -k 1
  exit 1
fi

"$NODE_BIN" <<'NODE'
const fs = require('fs');

const file = '/Users/jaykanchan/Downloads/Minecraft Claude/index.html';
let html = fs.readFileSync(file, 'utf8');
let changed = false;

function replaceOnce(from, to, label) {
  if (html.includes(from)) {
    html = html.replace(from, to);
    changed = true;
    console.log('fixed ' + label);
    return;
  }
  if (html.includes(to)) {
    console.log(label + ' already fixed');
    return;
  }
  throw new Error('Could not find code for: ' + label);
}

replaceOnce(
`function makeOak(x,y,z){
  const h=4+Math.floor(rnd3(x,y,z,110)*3);
  for(let yy=1;yy<=h;yy++) putAirBlock(x,y+yy,z,'wood');
  for(let yy=h-2;yy<=h+1;yy++) for(let dx=-2;dx<=2;dx++) for(let dz=-2;dz<=2;dz++){
    if(Math.abs(dx)+Math.abs(dz)+Math.max(0,yy-(y+h))<4) putAirBlock(x+dx,yy,z+dz,'leaves');
  }
}`,
`function makeOak(x,y,z){
  const h=4+Math.floor(rnd3(x,y,z,110)*3);
  for(let yy=1;yy<=h;yy++) putAirBlock(x,y+yy,z,'wood');
  for(let yy=y+h-2;yy<=y+h+1;yy++) for(let dx=-2;dx<=2;dx++) for(let dz=-2;dz<=2;dz++){
    if(Math.abs(dx)+Math.abs(dz)+Math.max(0,yy-(y+h))<4) putAirBlock(x+dx,yy,z+dz,'leaves');
  }
}`,
'oak trees'
);

const caveHelpers = `function carveCaveBubble(cx,cy,cz,rx=2.2,ry=1.4,rz=2.2){
  for(let dx=-Math.ceil(rx);dx<=Math.ceil(rx);dx++) for(let dy=-Math.ceil(ry);dy<=Math.ceil(ry);dy++) for(let dz=-Math.ceil(rz);dz<=Math.ceil(rz);dz++){
    const x=cx+dx,y=cy+dy,z=cz+dz;
    if((dx*dx)/(rx*rx)+(dy*dy)/(ry*ry)+(dz*dz)/(rz*rz)>1) continue;
    const t=blockAt(x,y,z);
    if(t&&t!=='bedrock') removeBlock(x,y,z);
  }
}
function addCaveEntrances(cx,cz){
  const bx=cx*CHUNK_SIZE,bz=cz*CHUNK_SIZE;
  let made=0;
  for(let i=0;i<5&&made<2;i++){
    const x=bx+2+Math.floor(rnd3(cx,i,cz,180)*(CHUNK_SIZE-4));
    const z=bz+2+Math.floor(rnd3(cx,i,cz,181)*(CHUNK_SIZE-4));
    const h=getH(x,z), surf=surfaceFor(x,z,h);
    if(h<=SEA+2||h>20||surf==='sand') continue;
    const angle=rnd3(cx,i,cz,182)*Math.PI*2;
    const dx=Math.round(Math.cos(angle)), dz=Math.round(Math.sin(angle));
    for(let t=0;t<11;t++){
      const tx=x+Math.round(dx*t*.55), tz=z+Math.round(dz*t*.55);
      if(chunkCoord(tx)!==cx||chunkCoord(tz)!==cz) break;
      carveCaveBubble(tx,h-1-Math.floor(t*.45),tz,2.2,1.5,2.2);
    }
    placeBlock(x,h,z,'gravel');
    made++;
  }
}
`;

if (!html.includes('function carveCaveBubble(')) {
  const marker = 'function addOreVeins(cx,cz,type,count,minY,maxY,size,seed){';
  if (!html.includes(marker)) throw new Error('Could not find ore vein marker for cave entrances');
  html = html.replace(marker, caveHelpers + marker);
  changed = true;
  console.log('fixed cave entrance functions');
} else {
  console.log('cave entrance functions already fixed');
}

replaceOnce(
`  carveCavesInChunk(cx,cz);
  addOreVeins(cx,cz,'coal',10,-3,20,2,130);`,
`  carveCavesInChunk(cx,cz);
  addCaveEntrances(cx,cz);
  addOreVeins(cx,cz,'coal',10,-3,20,2,130);`,
'cave entrance hook'
);

replaceOnce(
`  if(player.creative){p.x+=player.vel.x*dt;p.y+=player.vel.y*dt;p.z+=player.vel.z*dt;return;}

  // Y`,
`  // Y`,
'creative noclip'
);

if (changed) fs.writeFileSync(file, html);

const scripts = [...html.matchAll(/<script(?![^>]*src=)[^>]*>([\\s\\S]*?)<\\/script>/gi)]
  .map(m => m[1])
  .join('\\n');
new Function(scripts);
console.log('JavaScript check passed');
console.log('Done. Reload Minecraft Codex.');
NODE

echo
echo "Press any key to close this window."
read -k 1
