/** Evo-poster integration. MIT, Sérgio M. Rebelo et al.
 * Alignment and whitespace call the unmodified upstream metric modules.
 * Coordinate-aware visual balance and bounded evolution are IPBible adaptations
 * of VisualBalance.mjs and Population.js, not the original p5.js poster runtime. */
import alignmentMetric from '../../third_party/evo-poster/metrics/Alignment.mjs';
import whitespaceMetric from '../../third_party/evo-poster/metrics/WhiteSpaceFraction.mjs';
export interface LayoutBox { id:string; x:number; y:number; w:number; h:number; type?:string; locked?:boolean }
export interface LayoutMetrics { score:number; alignment:number; whitespace:number; balance:number; collision:number; bounds:number }
export interface LayoutCandidate<T extends LayoutBox=LayoutBox> { boxes:T[]; score:number; metrics:LayoutMetrics }
const clamp=(v:number,a=0,b=1)=>Math.min(b,Math.max(a,v));
const area=(b:LayoutBox)=>Math.max(0,b.w)*Math.max(0,b.h);
const overlap=(a:LayoutBox,b:LayoutBox)=>Math.max(0,Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x))*Math.max(0,Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y));
function validate(boxes:LayoutBox[],width:number,height:number){
  if(!(width>0&&height>0&&Number.isFinite(width)&&Number.isFinite(height)))throw Error('页面尺寸无效');
  if(boxes.length>200||boxes.some(b=>![b.x,b.y,b.w,b.h].every(Number.isFinite)||b.w<0||b.h<0))throw Error('页面元素坐标无效');
}
export function scoreLayout(boxes:LayoutBox[],width:number,height:number):LayoutMetrics {
  validate(boxes,width,height);
  const items=boxes.filter(b=>!['shape','motif'].includes(b.type||'')&&area(b)<width*height*.9);
  const texts=items.filter(b=>b.type==='text').sort((a,b)=>a.y-b.y);
  const alignment=texts.length<2?1:alignmentMetric(texts.map(b=>b.w),texts.map(()=> 'LEFT'));
  // Sample the union of content boxes so overlapping layers do not double-count.
  let covered=0;const cols=16,rows=24;
  for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){
    const px=(x+.5)*width/cols,py=(y+.5)*height/rows;
    if(items.some(b=>px>=b.x&&px<=b.x+b.w&&py>=b.y&&py<=b.y+b.h))covered++;
  }
  const whitespace=clamp(whitespaceMetric(null,'#ffffff',1-covered/(cols*rows)));
  // Upstream visual centre offset is H/20; adapt to arbitrary positioned boxes.
  let mass=0,mx=0,my=0;
  for(const b of items){const weight=area(b)*(b.type==='text'?.45:1);mass+=weight;mx+=(b.x+b.w/2)*weight;my+=(b.y+b.h/2)*weight;}
  const balance=mass?clamp(1-Math.sqrt((((mx/mass-width/2)/width)**2+((my/mass-height*.45)/height)**2)/2)):1;
  let collision=0,bounds=0;const page={id:'page',x:0,y:0,w:width,h:height};
  for(let i=0;i<items.length;i++){
    const a=items[i];bounds+=(area(a)-overlap(a,page))/(area(a)||1);
    for(let j=i+1;j<items.length;j++){const b=items[j];if(a.type==='text'||b.type==='text')collision+=overlap(a,b)/Math.max(1,Math.min(area(a),area(b)));}
  }
  const score=.24*alignment+.36*whitespace+.4*balance-2*collision-3*bounds;
  return{score,alignment,whitespace,balance,collision,bounds};
}
export function rankLayouts<T extends LayoutBox>(candidates:T[][],width:number,height:number):LayoutCandidate<T>[] {
  return candidates.map(boxes=>{const metrics=scoreLayout(boxes,width,height);return{boxes:boxes.map(b=>({...b})),score:metrics.score,metrics};}).sort((a,b)=>b.score-a.score);
}
function seeded(seed:number){let v=seed>>>0;return()=>{v=(Math.imul(1664525,v)+1013904223)>>>0;return v/4294967296;};}
/** Limited evolution preserves element dimensions, order, identity and locked
 * positions. Only x/y vary on an 8px grid within 24px of the supplied template. */
export function evolveLayouts<T extends LayoutBox>(boxes:T[],width:number,height:number,seed:number,count=4):LayoutCandidate<T>[] {
  validate(boxes,width,height);const random=seeded(seed),size=24;
  const mutate=(input:T[])=>input.map((b,i)=>{
    if(b.locked||['shape','motif'].includes(b.type||'')||random()>.32)return{...b};
    const base=boxes[i];const x=clamp(b.x+(random()<.5?-8:8),Math.max(0,base.x-24),Math.max(0,Math.min(width-b.w,base.x+24)));
    const y=clamp(b.y+(random()<.5?-8:8),Math.max(0,base.y-24),Math.max(0,Math.min(height-b.h,base.y+24)));
    return{...b,x,y};
  });
  let population=rankLayouts([boxes,...Array.from({length:size-1},()=>mutate(boxes))],width,height);
  const tournament=()=>{let best=population[Math.floor(random()*size)];for(let i=0;i<3;i++){const v=population[Math.floor(random()*size)];if(v.score>best.score)best=v;}return best.boxes;};
  for(let generation=0;generation<8;generation++){
    const next=[population[0].boxes,population[1].boxes];
    while(next.length<size){const a=tournament(),b=tournament();const child=a.map((element,i)=>element.locked?{...boxes[i]}:{...(random()<.5?element:b[i])});next.push(mutate(child));}
    population=rankLayouts(next,width,height);
  }
  // Keep the original template in the final pool even if evolution worsens it.
  const ranked=rankLayouts([boxes,...population.map(p=>p.boxes)],width,height),seen=new Set<string>();
  return ranked.filter(p=>{const key=JSON.stringify(p.boxes.map(b=>[b.id,b.x,b.y]));if(seen.has(key))return false;seen.add(key);return true;}).slice(0,Math.max(1,Math.min(8,count)));
}
