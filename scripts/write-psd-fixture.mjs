// Encode raw RGBA without node-canvas; called by generate-psd-fixture.py.
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import assert from 'node:assert/strict';
import { writePsdBuffer, readPsd, initializeCanvas } from 'ag-psd';
const [folder, output] = process.argv.slice(2);
if (!folder || !output) throw Error('Usage: node scripts/write-psd-fixture.mjs RAW_DIR OUTPUT.psd');
const manifest = JSON.parse(await readFile(join(folder,'manifest.json'),'utf8'));
const imageData = async(file,width,height) => ({width,height,data:new Uint8ClampedArray(await readFile(join(folder,file)))});
const children=[];
const groups=new Map();
for(const item of manifest.layers){
  const {file,group,width,height,...metadata}=item;
  const layer={...metadata,opacity:1,blendMode:'normal',imageData:await imageData(file,width,height)};
  if(group){if(!groups.has(group)){const entry={name:group,opened:true,children:[]};groups.set(group,entry);children.push(entry);}groups.get(group).children.push(layer);}
  else children.push(layer);
}
const psd={width:manifest.width,height:manifest.height,children,imageData:await imageData('composite.rgba',manifest.width,manifest.height),imageResources:{copyrighted:true,url:'https://studio.blender.org/projects/spring/pages/about/'}};
const buffer=writePsdBuffer(psd,{generateThumbnail:false,noBackground:true});
assert(buffer.length<8*1024*1024,'Fixture exceeds 8 MiB');
initializeCanvas(()=>{throw Error('Canvas should not be needed for RGBA fixture verification');},(width,height)=>({width,height,data:new Uint8ClampedArray(width*height*4)}));
const loaded=readPsd(buffer,{useImageData:true,skipThumbnail:true});
const flatten=(layers)=>layers.flatMap(l=>l.children?flatten(l.children):[l]);
const layers=flatten(loaded.children);
assert.equal(layers.length,6);
assert.equal(layers.filter(l=>l.hidden).length,1);
assert.equal(layers.filter(l=>l.text).length,2);
assert(layers.every(l=>l.imageData?.data.length>0));
await writeFile(output,buffer);
console.log(JSON.stringify({output,width:loaded.width,height:loaded.height,bytes:buffer.length,layers:layers.length,hiddenLayers:1,textLayers:2,groups:loaded.children.filter(l=>l.children).length}));
