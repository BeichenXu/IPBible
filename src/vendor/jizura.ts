/** Static book-page adapter for JIZURA (MIT), with environment wiring adapted
 * from CardLab (MIT). Upstream originals and notices are in third_party/. */
import J from './jizura-upstream.mjs';
import catalog from './motif-catalog.json';

export interface Palette { id?: string; name?: string; bg: string; fg: string; accent: string }
export interface Motif { key: string; id: string; name: string; kind: string; tags: string[]; source: string }
const styleNames: Record<string,string> = { noir:'黑白铬色',crimson:'绯红',caution:'信号黄',sakura:'樱色',deepsea:'深海',sunset:'落日',forest:'森林手帖',vapor:'蒸汽波',newspaper:'报纸',synth:'合成器',craft:'牛皮纸',candy:'糖果',acid:'酸性',sumi:'墨与朱',friday:'金夜' };
export const PALETTES: Palette[] = Object.entries(J.STYLES).map(([id,raw]) => {
  const style = raw as {name:string;schemes:Palette[]};
  return {id,name:styleNames[id] || style.name,...style.schemes[0]};
});
export const MOTIFS: Motif[] = catalog;
export const REFERENCE_INFO = { jizuraCommit:'fc16bfe43ea4a6c25a21f1caf04d17326de14f00', loadedModules:37, adaptedMotifs:catalog.length, palettes:PALETTES.length };

// Use app/system fonts. The JIZURA Google Fonts loader is deliberately not called.
for (const f of Object.values(J.FONTS) as any[]) {
  f.family = /mincho|serif/.test(f.kind) ? '"Noto Serif SC", "Songti SC", serif' : /mono|pixel/.test(f.kind) ? 'monospace' : '"Noto Sans SC", "Microsoft YaHei", sans-serif';
  f.fb = 'sans-serif'; f.user = true; f.loaded = true;
}
let renderer: any;
const cache = new Map<string,HTMLCanvasElement>();
export function renderMotif(key:string, options:{width:number;height:number;palette:Palette;seed?:number;title?:string}): HTMLCanvasElement {
  const {palette,seed=1729,title=''}=options;
  const width=Math.max(1,Math.min(4096,Math.round(options.width)));
  const height=Math.max(1,Math.min(4096,Math.round(options.height)));
  if (!Number.isFinite(width) || !Number.isFinite(height) || width*height>16_000_000) throw Error('纹样尺寸过大');
  const [group,id]=key.split(':');
  if (!MOTIFS.some(m=>m.key===key)) throw Error(`未知纹样 ${key}`);
  const definition=group==='bg'?J.BG[id]:J.DECOR[id];
  const cacheKey=JSON.stringify([key,width,height,palette,seed,title]);
  const hit=cache.get(cacheKey); if(hit)return hit;
  const cv=document.createElement('canvas');cv.width=width;cv.height=height;
  const ctx=cv.getContext('2d');if(!ctx)throw Error('Canvas 不可用');
  renderer ||= new J.Renderer();
  const random=J.rng(seed);
  const sc={...palette,sub:J.mix(palette.fg,palette.bg,.25),accent2:J.mix(palette.accent,palette.fg,.35),ink:palette.fg,dim:J.mix(palette.bg,palette.fg,.1),muted:J.mix(palette.fg,palette.bg,.35),ghostA:palette.accent,ghostB:palette.fg,grad:[palette.accent,palette.bg]};
  const st={fonts:{display:['gothic_black'],body:['gothic_med'],serif:['mincho'],mono:['mono']},schemes:[sc],texture:{grain:0,scan:0,paper:0},ghost:0};
  const params=group==='bg'&&definition.plan?definition.plan(random,st):{id,seed:random.int(1,1e9),n:random.int(1,3)+(id==='shapes'?3:0)+(id==='sparks'?4:0),right:random.chance(.5),low:random.chance(.5),accent:true,corner:true,big:true,mode:'index',from:0,to:99,v:random.int(0,5),r:random()};
  const cut={inDur:0,outDur:0,dur:8,start:0,end:8,params:{},index:0,line:0,text:title,lineText:title,note:'',seed,bg:group==='bg'?id:'none',bgP:params,enter:'cut',exit:'cut',hold:'still'};
  const plan={W:width,H:height,title,artist:'',cuts:[cut],lines:[{text:title}],duration:8,fps:24,seed,style:st,fx:{motion:0,decor:1,grain:0,glow:0}};
  const env=renderer.makeEnv(ctx,plan,cut,sc,{pass:'main',t:2.6,lt:2.6,ltb:2.6,step:62,scale:1,allowFilter:true,energy:.65,beat:null,layer:'all'});
  const box={x0:width*.23,y0:height*.24,x1:width*.77,y1:height*.76,cx:width*.5,cy:height*.5,w:width*.54,h:height*.52,boxes:[]};
  if(id==='tyGlyphBody'){box.y0=height*.43;box.y1=height*.57;box.h=height*.14;}
  ctx.save();
  if(group==='bg')definition.draw(env,params);else definition.draw(env,box,params);
  ctx.restore();
  let pixels=width*height;for(const c of cache.values())pixels+=c.width*c.height;
  while(cache.size && (cache.size>=24||pixels>8_000_000)){const first=cache.keys().next().value!;const c=cache.get(first)!;pixels-=c.width*c.height;cache.delete(first);}
  cache.set(cacheKey,cv);return cv;
}
export function renderMotifDataUrl(key:string,options:Parameters<typeof renderMotif>[1]){return renderMotif(key,options).toDataURL('image/png');}

