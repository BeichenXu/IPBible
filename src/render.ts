import {W,H,type Book,type Page,type Element} from './model';
import {loadImage} from './import';
import {renderMotif} from './vendor/jizura';
const cache=new Map<string,Promise<HTMLImageElement>>();
function bitmap(url:string){if(!cache.has(url))cache.set(url,loadImage(url));return cache.get(url)!;}
export const fonts={serif:'"Noto Serif JP", "Noto Sans SC", "Songti SC", Georgia, serif',sans:'"Noto Sans SC", "Microsoft YaHei", "PingFang SC", system-ui, sans-serif'};
export function lines(ctx:CanvasRenderingContext2D,s:string,width:number):string[]{const out:string[]=[];for(const para of s.split('\n')){let line='';for(const ch of [...para]){if(line&&ctx.measureText(line+ch).width>width){out.push(line);line=ch;}else line+=ch;}out.push(line);}return out;}
export async function renderPage(canvas:HTMLCanvasElement,book:Book,page:Page,scale=1):Promise<void>{
 // Decode first so a rapid edit cannot expose a half-rendered page.
 await Promise.all([document.fonts.load('24px "Noto Sans SC"'),document.fonts.load('24px "Noto Serif JP"')]);
 const sources=await Promise.all(page.elements.map(e=>e.type==='image'?bitmap(book.assets.find(a=>a.id===e.assetId)?.url||'').catch(()=>null):null));
 canvas.width=Math.round(W*scale);canvas.height=Math.round(H*scale);const c=canvas.getContext('2d')!;c.scale(scale,scale);c.fillStyle=page.background;c.fillRect(0,0,W,H);
 for(let i=0;i<page.elements.length;i++){const e=page.elements[i];c.save();c.globalAlpha=e.opacity??1;const blend=e.blendMode?.replace(' ','-');if(blend&&['multiply','screen','overlay','darken','lighten','color-dodge','color-burn','hard-light','soft-light','difference','exclusion','hue','saturation','color','luminosity'].includes(blend))c.globalCompositeOperation=blend as GlobalCompositeOperation;c.translate(e.x+e.w/2,e.y+e.h/2);c.rotate((e.rotation??0)*Math.PI/180);c.translate(-e.w/2,-e.h/2);
  if(e.type==='shape'){c.fillStyle=e.fill||book.accent;c.fillRect(0,0,e.w,e.h);}
  if(e.type==='motif'&&e.motif){const motif=renderMotif(e.motif,{width:e.w,height:e.h,palette:{bg:page.background,fg:e.color||'#334333',accent:e.fill||book.accent},seed:book.seed,title:book.title});c.drawImage(motif,0,0,e.w,e.h);}
  if(e.type==='image'&&sources[i]){const im=sources[i]!,ratio=e.fit==='cover'?Math.max(e.w/im.width,e.h/im.height):Math.min(e.w/im.width,e.h/im.height);c.beginPath();c.rect(0,0,e.w,e.h);c.clip();c.drawImage(im,(e.w-im.width*ratio)/2,(e.h-im.height*ratio)/2,im.width*ratio,im.height*ratio);}
  if(e.type==='text'){c.fillStyle=e.color||'#292c29';c.font=`${e.fontSize??22}px ${fonts[e.fontFamily||'sans']}`;c.textBaseline='top';c.textAlign=e.align||'left';c.beginPath();c.rect(0,0,e.w,e.h);c.clip();const leading=(e.fontSize??22)*1.62;for(const [j,line]of lines(c,e.text||'',e.w).entries()){if(j*leading>=e.h)break;c.fillText(line,e.align==='center'?e.w/2:e.align==='right'?e.w:0,j*leading);}}
  c.restore();
 }
 if(page.kind!=='cover'){c.font=`11px ${fonts.sans}`;c.fillStyle='#73786d';c.textAlign='right';c.fillText(String(book.pages.indexOf(page)+1).padStart(2,'0'),732,1084);}
}
export function overflowing(e:Element):boolean{if(e.type!=='text')return false;const c=document.createElement('canvas').getContext('2d')!;c.font=`${e.fontSize??22}px ${fonts[e.fontFamily||'sans']}`;return lines(c,e.text||'',e.w).length*(e.fontSize??22)*1.62>e.h;}
