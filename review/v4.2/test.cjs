const assert=require('node:assert/strict');const fs=require('fs');const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});let results=[];
for(const width of [320,360,393,412,650,700,701,844,1440]){
 const p=await b.newPage({viewport:{width,height:width===844?390:800},isMobile:width<=700,hasTouch:width<=700});const errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto('http://127.0.0.1:8000/index.html');const outer=p.frames()[1];await outer.waitForSelector('#home img');
 for(const name of ['classic','essential','classic']){
 await outer.evaluate(n=>openPage(n),name);await p.waitForTimeout(150);let inner=p.frames()[2];await inner.waitForSelector('.master');await inner.locator('.master').evaluate(i=>i.decode());
 for(const id of ['start','details','compare','account']){
 // Scroll both iframe layers to the actual control, then activate it.
 await inner.locator(`[data-dialog="${id}"]`).click();assert(await inner.locator(`dialog#${id}`).evaluate(d=>d.open));await inner.locator(`dialog#${id} .close`).click();assert(!await inner.locator(`dialog#${id}`).evaluate(d=>d.open));
 }
 const dest=name==='classic'?'essential':'classic';await inner.locator(`a.${dest}`).click();await p.waitForTimeout(150);inner=p.frames()[2];assert((await inner.title()).toLowerCase().includes(dest));
 if(width<=700)await inner.locator('a.home,a.logo').click();else await outer.locator('#back').click();await outer.waitForSelector('#home',{state:'visible'});
 }
 if(width<=700){await outer.locator('#overview').click();assert(await outer.locator('body').evaluate(e=>e.classList.contains('overview')));await outer.locator('#reading').click();await outer.evaluate(()=>openPage('essential'));await p.waitForTimeout(200);const inner=p.frames()[2];const height=await inner.locator('.page').evaluate(e=>e.getBoundingClientRect().height);const fh=await outer.locator('#frame').evaluate(e=>e.getBoundingClientRect().height);assert(Math.abs(height-fh)<=1);}
 assert.deepEqual(errors,[]);results.push({width,status:'passed'});console.log('passed',width);await p.close();
}
// Original embedded masters and collection HTML are byte-for-byte unchanged.
let original=fs.readFileSync('OXXAlbums_Android_V4_1_navigatie_fix.html','utf8');let next=fs.readFileSync('OXXAlbums_Android_V4_2.html','utf8');const pages=s=>s.slice(s.indexOf('const pages='),s.indexOf(';function openPage'));assert.equal(pages(original),pages(next));
// Desktop pixels must match V4.1, including every collection.
const p=await b.newPage({viewport:{width:1440,height:900}});for(const name of ['home','classic','essential']){let shots=[];for(const file of ['OXXAlbums_Android_V4_1_navigatie_fix.html','OXXAlbums_Android_V4_2.html']){await p.goto('http://127.0.0.1:8000/'+file);if(name!=='home')await p.evaluate(n=>openPage(n),name);await p.waitForTimeout(250);shots.push(await p.screenshot({fullPage:true}));}assert(shots[0].equals(shots[1]),`desktop pixels ${name}`)}
fs.writeFileSync('review/v4.2/results.json',JSON.stringify({viewports:results,desktopPixels:'identical',embeddedPages:'identical'},null,2));console.log('PASS',results);await b.close()})().catch(e=>{console.error(e);process.exit(1)})
