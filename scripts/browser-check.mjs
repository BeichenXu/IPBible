// Exercise the real deployed application. No local preview service is started.
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {chromium,expect} from '@playwright/test';
import {unzipSync,strFromU8} from 'fflate';
const url=process.env.IPBIBLE_URL;if(!url)throw Error('Set IPBIBLE_URL to the deployed TEST URL');
const output=path.resolve('.local/acceptance');await fs.mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1440,height:1040},...(process.env.IPBIBLE_SESSION?{storageState:process.env.IPBIBLE_SESSION}:{})});
const page=await context.newPage(),errors=[],checks=[];
page.on('pageerror',e=>errors.push(e.message));
const idle=()=>expect(page.locator('.busy')).toHaveCount(0,{timeout:120000});
const saved=()=>expect(page.locator('.save-state')).toHaveText('已保存在本机',{timeout:15000});
const grab=async()=>{await saved();return page.evaluate(async()=>{const db=await new Promise((resolve,reject)=>{const r=indexedDB.open('ip-bible-v1');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});return new Promise((resolve,reject)=>{const r=db.transaction('books').objectStore('books').get('book:'+localStorage.getItem('ipbible:last'));r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});});};
const download=async(label,name)=>{await page.getByRole('button',{name:'导出',exact:true}).click();const waiting=page.waitForEvent('download',{timeout:120000});await page.getByRole('button',{name:label,exact:true}).click();const file=await waiting;const target=path.join(output,name);await file.saveAs(target);await idle();return target;};
async function ready(){await idle();await expect(page.locator('.page-stage canvas')).toBeVisible();await page.waitForFunction(()=>{const c=document.querySelector('.page-stage canvas');return c&&c.getContext('2d').getImageData(0,0,1,1).data[3]===255;});await page.evaluate(()=>document.fonts.ready);}
try{
 await page.goto(url,{waitUntil:'domcontentloaded'});
 if(!await page.locator('.home-header').count()){
  if(!process.env.IPBIBLE_CREDENTIALS)throw Error('TEST login needed; supply private session or credentials path');
  const c=JSON.parse(await fs.readFile(process.env.IPBIBLE_CREDENTIALS,'utf8'));
  const passwordTab=page.getByText('密码登录',{exact:true});if(await passwordTab.isVisible())await passwordTab.click();
  await page.locator('#login-identifier').fill(c.username);await page.locator('#login-password').fill(c.password);await page.getByRole('button',{name:'登录并继续'}).click();await page.waitForURL(url,{timeout:60000});
 }
 await expect(page.locator('.example-card')).toHaveCount(3,{timeout:60000});
 await page.screenshot({path:path.join(output,'desktop-library.png'),fullPage:true});
 await page.locator('.example-card').filter({hasText:'Spring'}).click();await ready();await saved();let state=await grab();assert.equal(state.assets.length,4);assert.ok(state.pages.length>=5);checks.push('Spring licensed sample opens as editable multi-page book');
 await page.getByRole('textbox',{name:'书名',exact:true}).fill('TEST · Spring 设定集');await saved();
 await page.getByRole('button',{name:'添加文字',exact:true}).click();await page.getByRole('textbox',{name:'图层文字',exact:true}).fill('手工加入的中文设定');await page.getByRole('spinbutton',{name:'X',exact:true}).fill('130');await saved();state=await grab();const custom=state.pages[0].elements.find(e=>e.text==='手工加入的中文设定');assert.ok(custom);
 await page.getByRole('button',{name:'锁定',exact:true}).click();await saved();const locked=await grab();await page.getByRole('button',{name:'换个编排',exact:true}).click();await saved();let after=await grab();assert.deepEqual(after.pages[0].elements.find(e=>e.id===custom.id),locked.pages[0].elements.find(e=>e.id===custom.id));checks.push('authored layers and locks survive re-arrangement');
 await page.getByRole('button',{name:'撤销',exact:true}).click();await saved();await page.getByRole('button',{name:'重做',exact:true}).click();await saved();
 await page.getByRole('button',{name:'图形与配色',exact:true}).click();await expect(page.locator('.motif-grid button')).toHaveCount(24);await page.locator('.motif-grid button').first().click();await saved();state=await grab();assert.ok(state.pages[0].elements.some(e=>e.type==='motif'));checks.push('JIZURA motif inserted and persisted');
 const file=await download('可编辑项目 .ipbible','spring.ipbible');const roundtrip=JSON.parse(strFromU8(unzipSync(new Uint8Array(await fs.readFile(file)))['book.json']));assert.equal(roundtrip.title,'TEST · Spring 设定集');
 await page.getByRole('textbox',{name:'书名',exact:true}).fill('暂存修改');await page.locator('#project-file').setInputFiles(file);await ready();await saved();assert.equal((await grab()).title,'TEST · Spring 设定集');await page.reload();await ready();await saved();assert.equal((await grab()).title,'TEST · Spring 设定集');checks.push('editable archive save/import and draft reload preserve content');
 await page.locator('#project-file').setInputFiles({name:'broken.ipbible',mimeType:'application/zip',buffer:Buffer.from('corrupt')});await idle();assert.equal((await grab()).title,'TEST · Spring 设定集');checks.push('invalid project import retains the current book');
 await page.getByRole('button',{name:'取消选择',exact:true}).click().catch(()=>{});
 await page.getByRole('button',{name:'书页后移',exact:true}).click();await saved();assert.notEqual((await grab()).pages[0].kind,'cover');await page.getByRole('button',{name:'书页前移',exact:true}).click();await saved();checks.push('page reorder persists');
 await page.screenshot({path:path.join(output,'desktop-editor.png'),fullPage:true});
 const pdf=await download('PDF 设定书','spring.pdf');assert.ok((await fs.readFile(pdf)).subarray(0,5).toString()==='%PDF-');
 const html=await download('离线阅读版 HTML','spring-reader.html');assert.ok((await fs.readFile(html,'utf8')).includes('data:image/jpeg;base64,'));checks.push('PDF and self-contained HTML exported');
 // A second tab cannot silently replace a newer draft.
 const second=await context.newPage();await second.goto(url);await expect(second.getByRole('textbox',{name:'书名',exact:true})).toBeVisible();await page.getByRole('textbox',{name:'书名',exact:true}).fill('TEST · 新版本');await saved();await second.getByRole('textbox',{name:'书名',exact:true}).fill('旧窗口修改');await expect(second.locator('.save-state')).toContainText('保存失败',{timeout:15000});assert.equal((await grab()).title,'TEST · 新版本');await second.close({runBeforeUnload:false});checks.push('stale-tab save is rejected without overwriting newer draft');
 await page.getByRole('button',{name:'返回书架',exact:true}).click();await idle();await page.getByRole('button',{name:'新建设定集',exact:true}).click();await ready();await page.locator('#asset-file').setInputFiles('tests/fixtures/layered-sample.psd');await ready();await saved();state=await grab();assert.equal(state.assets.length,7);assert.equal(state.assets.filter(a=>a.layerPath).length,6);assert.equal(state.pages.length,2);assert.equal(state.pages[1].elements.filter(e=>e.type==='image').length,5);checks.push('PSD hierarchy, hidden layer and original coordinates preserved; one document becomes one character page');
 await page.getByRole('button',{name:'下一页',exact:true}).click();await page.screenshot({path:path.join(output,'psd-editor.png'),fullPage:true});
 const psdProject=await download('可编辑项目 .ipbible','psd.ipbible');assert.ok((await fs.stat(psdProject)).size>100000);
 // Publication uses only flattened pages; no original source images or tokens leak.
 await page.getByRole('button',{name:'分享到社区',exact:true}).click();await page.locator('.consent input').check();await page.getByRole('button',{name:'发布阅读版',exact:true}).click();await idle();await expect(page.locator('.reader-overlay')).toBeVisible();const shares=await page.evaluate(()=>Object.keys(localStorage).filter(k=>k.startsWith('ipbible:share:')));const share=shares.at(-1).split(':').at(-1);
 const published=await context.request.get(new URL(`api/books/${share}`,url).href);assert.equal(published.status(),200);const publicData=await published.json();assert.ok(!('tokenHash'in publicData)&&!('assets'in publicData));assert.equal(publicData.pages.length,2);
 const denied=await context.request.delete(new URL(`api/books/${share}`,url).href,{headers:{'X-Owner-Token':'wrong-owner'}});assert.equal(denied.status(),403);const bad=await context.request.post(new URL('api/books',url).href,{data:{title:'invalid',pages:['data:image/svg+xml;base64,PHN2Zz4=']}});assert.equal(bad.status(),400);
 await page.getByRole('button',{name:'撤回',exact:true}).click();await page.getByRole('button',{name:'继续',exact:true}).click();await idle();assert.equal((await context.request.get(new URL(`api/books/${share}`,url).href)).status(),404);checks.push('community publish/read/owner-only withdrawal and invalid payload checks');
 for(const width of [390,360]){await page.setViewportSize({width,height:width===360?640:844});await expect(page.locator('.page-stage')).toBeVisible();assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await page.getByRole('button',{name:'打开书页与素材',exact:true}).click();await expect(page.locator('.navigator.mobile-open')).toBeVisible();await page.getByRole('button',{name:'关闭侧栏',exact:true}).click();await page.screenshot({path:path.join(output,`mobile-${width}.png`),fullPage:true});}checks.push('390px and 360px viewport editing/navigation without horizontal overflow');
 await page.setViewportSize({width:1440,height:1040});await page.getByRole('button',{name:'返回书架',exact:true}).click();await idle();
 for(const name of ['Sintel','Big Buck Bunny']){await page.locator('.example-card').filter({hasText:name}).click();await ready();await saved();const b=await grab();assert.ok(b.assets.length>=3&&b.pages.length>=5);await page.screenshot({path:path.join(output,name.toLowerCase().replaceAll(' ','-')+'.png'),fullPage:true});await page.getByRole('button',{name:'返回书架',exact:true}).click();await idle();}checks.push('Sintel and Big Buck Bunny editable sample books verified');
 assert.deepEqual(errors,[]);await fs.writeFile(path.join(output,'report.json'),JSON.stringify({url,checks,errors,finishedAt:new Date().toISOString(),limits:['Chromium viewport emulation, not physical devices','PSD fixture assembled from licensed art, not production artist PSD','AI provider is not configured; no live inference acceptance']},null,2));console.log(JSON.stringify({passed:checks.length,checks,errors},null,2));
}catch(error){await page.screenshot({path:path.join(output,'failure.png'),fullPage:true}).catch(()=>{});await fs.writeFile(path.join(output,'failure.json'),JSON.stringify({message:error.message,checks,errors,url:page.url()},null,2));throw error;}finally{await browser.close();}
