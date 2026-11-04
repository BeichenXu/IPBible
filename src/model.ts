import motifCatalog from './vendor/motif-catalog.json';
export const W = 794, H = 1123;
export type Role = 'character' | 'map' | 'scene' | 'detail';
export const roleNames: Record<Role,string> = {character:'人物',map:'地图',scene:'世界与场景',detail:'细节与道具'};
export type Kind = 'cover'|'character'|'world'|'faction'|'gallery'|'notes';
export const kindNames: Record<Kind,string> = {cover:'封面',character:'人物设定',world:'世界与地图',faction:'组织与势力',gallery:'视觉档案',notes:'创作笔记'};
export interface Asset {id:string; name:string; url:string; width:number; height:number; role:Role; description:string; credit?:string; sourceUrl?:string; license?:string; layerPath?:string; sourceFile?:string; hidden?:boolean; blendMode?:string; opacity?:number; warning?:string; originalX?:number; originalY?:number;originalWidth?:number;originalHeight?:number;documentId?:string;documentWidth?:number;documentHeight?:number;composite?:boolean;}
export interface Element {id:string; type:'text'|'image'|'shape'|'motif'; x:number;y:number;w:number;h:number; text?:string;assetId?:string; fontSize?:number; fontFamily?:'serif'|'sans'; color?:string;fill?:string;align?:CanvasTextAlign; fit?:'contain'|'cover';opacity?:number;rotation?:number;locked?:boolean; motif?:string;blendMode?:string;}
export interface Page {id:string;name:string;kind:Kind;background:string;elements:Element[];locked?:boolean;}
export interface Book {version:1;id:string;title:string;subtitle:string;description:string;author:string;accent:string;seed:number;assets:Asset[];pages:Page[];updatedAt:number;revision:number;}
export interface Example {id:string;title:string;subtitle:string;description:string;accent:string;credit:string;sourceUrl:string;license:string;assets:Omit<Asset,'width'|'height'>[];}
export const uid=()=>globalThis.crypto?.randomUUID?.() ?? `b-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
export function blankBook():Book {return {version:1,id:uid(),title:'未命名的世界',subtitle:'AN ORIGINAL WORLD',description:'',author:'',accent:'#a45339',seed:1,assets:[],pages:[],updatedAt:Date.now(),revision:0};}
export function inferRole(name:string):Role {return /map|地图|地圖|territor|疆域/i.test(name)?'map':/背景|场景|場景|world|scene|forest|landscape|环境|環境/i.test(name)?'scene':/细节|細節|道具|weapon|detail|prop|饰品/i.test(name)?'detail':'character';}
export function validateBook(value:unknown):Book {
 const b=value as Book;
 if(!b||b.version!==1||typeof b.id!=='string'||!b.id.trim()||typeof b.title!=='string'||!Array.isArray(b.assets)||!Array.isArray(b.pages)||b.pages.length>120||b.assets.length>500||typeof b.subtitle!=='string'||typeof b.author!=='string'||typeof b.description!=='string')throw Error('这不是有效的 IP Bible 项目。');
 if(!/^#[0-9a-f]{6}$/i.test(b.accent)||!Number.isFinite(b.seed))throw Error('项目配色或随机种子无效。');
 const ids=new Set<string>();
 for(const a of b.assets){if(!a||typeof a.id!=='string'||!a.id.trim()||ids.has(a.id)||typeof a.name!=='string'||typeof a.description!=='string'||!['character','map','scene','detail'].includes(a.role)||!Number.isFinite(a.width)||!Number.isFinite(a.height)||a.width<=0||a.height<=0||!/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(a.url))throw Error('项目包含无效素材。');ids.add(a.id);}
 const pageIds=new Set<string>();
 for(const p of b.pages){if(!p||pageIds.has(p.id)||typeof p.id!=='string'||!p.id.trim()||typeof p.name!=='string'||!Array.isArray(p.elements)||p.elements.length>250||!/^#[0-9a-f]{6}$/i.test(p.background)||!(p.kind in kindNames))throw Error('项目页面无效。');pageIds.add(p.id); const eids=new Set<string>();for(const e of p.elements){if(eids.has(e.id)||typeof e.id!=='string'||!e.id.trim()||!['text','image','shape','motif'].includes(e.type)||![e.x,e.y,e.w,e.h].every(Number.isFinite)||e.w<1||e.h<1||e.w>10000||e.h>10000||Math.abs(e.x)>10000||Math.abs(e.y)>10000||(e.type==='image'&&!ids.has(e.assetId!))||(e.type==='text'&&(typeof e.text!=='string'||e.text.length>30000||!Number.isFinite(e.fontSize)||e.fontSize!<5||e.fontSize!>400)))throw Error('项目包含无效图层。');eids.add(e.id);}}
 for(const p of b.pages){if(!Object.hasOwn(kindNames,p.kind))throw Error('未知页面类型');for(const e of p.elements){if(e.type==='motif'&&!motifCatalog.some(m=>m.key===e.motif))throw Error('未知图形部件');if(e.opacity!==undefined&&(!Number.isFinite(e.opacity)||e.opacity<0||e.opacity>1))throw Error('图层透明度无效');if(e.rotation!==undefined&&!Number.isFinite(e.rotation))throw Error('图层旋转无效');}}
 for(const a of b.assets){if(a.documentId&&(![a.documentWidth,a.documentHeight,a.originalX??0,a.originalY??0,a.originalWidth??a.width,a.originalHeight??a.height].every(Number.isFinite)||a.documentWidth!<=0||a.documentHeight!<=0))throw Error('PSD 图层坐标无效');}
 return b;
}
