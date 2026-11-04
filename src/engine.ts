import {W,H,uid, type Book,type Page,type Kind,type Element,kindNames} from './model';
import {evolveLayouts} from './vendor/evolution';
export function text(text:string,x:number,y:number,w:number,h:number,fontSize=22,color='#292c29',fontFamily:'serif'|'sans'='sans'):Element{return{id:uid(),type:'text',text,x,y,w,h,fontSize,color,fontFamily};}
const shape=(x:number,y:number,w:number,h:number,fill:string):Element=>({id:uid(),type:'shape',x,y,w,h,fill});
const img=(assetId:string,x:number,y:number,w:number,h:number,fit:'contain'|'cover'='contain'):Element=>({id:uid(),type:'image',assetId,x,y,w,h,fit});
export function createPage(book:Book,kind:Kind,assetId?:string,variant=0):Page {
 const a=book.assets.find(a=>a.id===assetId)??book.assets.find(a=>!a.hidden),page:Page={id:uid(),name:kind==='cover'?book.title: a?.name??kindNames[kind],kind,background:'#f5f1e8',elements:[]};
 const e=page.elements, accent=book.accent, margin=62;
 if(kind==='cover'){
  page.background='#202c29';
  if(a)e.push(img(a.id,0,0,W,770,'cover'));
  e.push(shape(0,746,W,377,'#202c29'),shape(62,801,44,3,accent),text('IP BIBLE  /  VOL. 01',62,820,670,30,16,'#d3cbbb'),text(book.title,58,865,680,110,58,'#fff8e8','serif'),text(book.subtitle||'A WORLD OF YOUR OWN',62,992,670,44,18,'#cfccbb'),text(book.author||'CHARACTERS · WORLDS · STORIES',62,1063,670,24,12,'#cfccbb'));
 }else{
  e.push(text(`${kindNames[kind]}  /  ${book.title}`,margin,40,670,24,13,accent),shape(margin,77,W-margin*2,1,'#c7c2b7'));
  if(kind==='character'){
   if(a&&a.width/a.height>1.18){
    e.push(text(a.name,62,104,670,92,42,'#29382f','serif'),img(a.id,62,235,670,465,'contain'),text('CHARACTER PROFILE',62,755,170,35,13,accent),text(a.description||'在这里写下角色的身份、性格与经历。',267,750,465,240,20),text(a.credit||'',62,1000,670,48,11,'#797b70'));
   }else{
   const right=variant%2===1; if(a)e.push(img(a.id,right?337:42,185,415,688,'contain'));
   const tx=right?62:468,tw=264;
   e.push(text(a?.name||'角色名称',62,104,670,70,42,'#29382f','serif'),text('CHARACTER PROFILE',tx,220,tw,35,13,accent),shape(tx,272,42,2,accent),text(a?.description||'在这里写下角色的身份、性格与经历。',tx,300,tw,480,20),text(a?.credit||'',62,1000,670,48,11,'#797b70'));
   }
  }else if(kind==='world'){
   e.push(text(a?.name||'世界与地图',62,107,670,82,42,'#29382f','serif'));
   if(a)e.push(img(a.id,62,220,670,472,'contain'));
   e.push(text('WORLD NOTES',62,758,170,26,13,accent),text(a?.description||'记录地点、地理特征与世界规则。',267,754,465,240,20));
  }else if(kind==='faction'){
   e.push(text('组织与势力',62,112,670,80,42,'#29382f','serif'),text('FACTIONS & TERRITORIES',62,198,670,30,13,accent));
   if(a)e.push(img(a.id,62,265,670,415,'contain'));
   e.push(text('势力名称',62,738,230,60,28,'#29382f','serif'),text('填写其成员、立场与势力范围。\n\n这里的设定由你决定。',333,738,399,270,20));
  }else if(kind==='gallery'){
   e.push(text(a?.name||'视觉档案',62,110,670,80,42,'#29382f','serif'));
   if(a)e.push(img(a.id,62,227,670,655,'contain'));
   e.push(text(a?.description||'',62,921,670,100,18));
  }else{
   e.push(text('创作笔记',62,112,670,80,42,'#29382f','serif'),text(book.description||'在这里记录你的世界观、创作动机，以及那些尚未完成的想法。',62,246,670,714,24));
  }
  e.push(shape(62,1053,670,1,'#c7c2b7'),text('IP BIBLE',62,1073,300,20,11,'#73786d'));
 }
 // Evo-poster's metrics rank bounded coordinate variants; preserve book structure.
 if(kind!=='cover')page.elements=evolveLayouts(page.elements,W,H,book.seed+variant,1)[0].boxes;
 return page;
}
export function generateBook(book:Book):Book {
 const assets=book.assets.filter(a=>!a.hidden),cover=book.assets.find(a=>a.composite)??assets.find(a=>a.role==='scene')??assets[0];
 const pages=[createPage(book,'cover',cover?.id)];
 if(book.description){const chunks=book.description.match(/[\s\S]{1,400}/g)||[];for(const [i,chunk]of chunks.slice(0,75).entries()){const p=createPage({...book,description:chunk},'notes');p.name=chunks.length>1?`创作笔记 · ${i+1}`:'创作笔记';pages.push(p);}}
 const documents=new Set<string>();
 for(const a of assets.slice(0,160)){
  if(a.documentId){if(documents.has(a.documentId))continue;documents.add(a.documentId);const composite=book.assets.find(x=>x.documentId===a.documentId&&x.composite),source=composite??a;
   const p=createPage(book,source.role==='map'||source.role==='scene'?'world':'character',source.id,book.seed),slot=p.elements.find(e=>e.type==='image')!;
   if(slot){const dw=a.documentWidth!,dh=a.documentHeight!,s=Math.min(slot.w/dw,slot.h/dh),ox=slot.x+(slot.w-dw*s)/2,oy=slot.y+(slot.h-dh*s)/2;
    const layers=assets.filter(x=>x.documentId===a.documentId&&!x.composite).map(x=>({...img(x.id,ox+(x.originalX??0)*s,oy+(x.originalY??0)*s,(x.originalWidth??x.width)*s,(x.originalHeight??x.height)*s),opacity:x.opacity??1,blendMode:x.blendMode}));
    p.elements.splice(p.elements.indexOf(slot),1,...layers);
   }pages.push(p);
  }else pages.push(createPage(book,a.role==='character'?'character':a.role==='map'||a.role==='scene'?'world':'gallery',a.id,book.seed));
  if(pages.length>=110)break;
 }
 if(assets.length===0)pages.push(createPage(book,'character'),createPage(book,'world'));
 return {...book,pages,updatedAt:Date.now()};
}
export function regeneratePage(book:Book,page:Page):Page {
 if(page.locked)return page;
 // Evolve the actual edited scene: no text, source, size, z-order or layer is lost.
 const candidates=evolveLayouts(page.elements,W,H,book.seed,4);
 const pick=candidates.find(c=>c.boxes.some((e,i)=>e.x!==page.elements[i].x||e.y!==page.elements[i].y))??candidates[0];
 return {...page,elements:pick.boxes};
}
