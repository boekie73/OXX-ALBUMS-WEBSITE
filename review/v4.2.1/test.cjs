const assert=require('node:assert/strict');const fs=require('fs');const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});const results=[];
for(const [width,height] of [[320,640],[360,800],[393,851],[412,915],[650,900],[700,900]]){
 const p=await b.newPage({viewport:{width,height},isMobile:true,hasTouch:true,deviceScaleFactor:2});p.setDefaultTimeout(10000);let errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto('http://127.0.0.1:8001/OXXAlbums_Android_V4_2_1.html');await p.locator('#home img').evaluate(i=>i.decode());
 const nav=await p.locator('.mobile-tools').evaluate(e=>({height:e.clientHeight,overflow:e.scrollWidth>e.clientWidth}));assert.equal(nav.height,60);
 const homeWidth=()=>p.locator('#home').evaluate(e=>e.getBoundingClientRect().width);
 const initial=await homeWidth();assert.equal(initial,width);await p.locator('#reading').tap();const reading=await homeWidth();assert(reading>initial*1.1);
 const bottom=await p.locator('#home').evaluate(e=>e.getBoundingClientRect().bottom);assert(bottom>=height-1);assert(bottom<=Math.max(height,501)+1);
 // Real browser touch gesture: swipe the original homepage horizontally.
 const cdp=await p.context().newCDPSession(p);await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:width-30,y:200}]});for(let i=1;i<=8;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:width-30-(width-60)*i/8,y:200}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await p.waitForTimeout(900);assert(await p.locator('#home-scroll').evaluate(e=>e.scrollLeft>0));
 if(width===393)await p.screenshot({path:'review/v4.2.1/after-home-touch-scroll.png'});
 await p.locator('#overview').tap();assert.equal(await homeWidth(),initial);
 for(const name of ['classic','essential']){
  await p.locator(`.mobile-tools button`).filter({hasText:new RegExp('^'+(name==='classic'?'Classic':'Essential')+'$')}).tap();await p.waitForTimeout(100);let f=p.frames()[1];await f.locator('.master').evaluate(i=>i.decode());
  const metrics=()=>f.locator('.shell,.page').evaluate(e=>({width:e.getBoundingClientRect().width,height:e.getBoundingClientRect().height}));
  const fit=await metrics();assert.equal(fit.width,width);await p.locator('#reading').tap();const read=await metrics();assert.equal(read.width,780);assert(read.height>fit.height*1.1);
  assert(Math.abs((await p.locator('#frame').evaluate(e=>e.getBoundingClientRect().height))-read.height)<=1);
  if(width===393)await p.screenshot({path:`review/v4.2.1/after-${name}-reading.png`,fullPage:true});
  for(const id of ['start','details','compare','account']){await f.locator(`[data-dialog="${id}"]`).tap();assert(await f.locator(`dialog#${id}`).evaluate(e=>e.open));await f.locator(`dialog#${id} .close`).tap();assert(!await f.locator(`dialog#${id}`).evaluate(e=>e.open))}
  await p.locator('#overview').tap();assert.equal((await metrics()).width,fit.width);if(width===393)await p.screenshot({path:`review/v4.2.1/after-${name}-overview.png`,fullPage:true});
  const target=name==='classic'?'essential':'classic';await f.locator(`a.${target}`).tap();await p.waitForTimeout(100);f=p.frames()[1];assert((await f.title()).toLowerCase().includes(target));await f.locator('a.home,a.logo').tap();assert(await p.locator('#home').isVisible());assert.equal(await homeWidth(),width);
 }
 await p.locator('#reading').tap();await p.setViewportSize({width:851,height:393});assert(!await p.locator('.mobile-tools').isVisible());await p.setViewportSize({width,height});await p.locator('#overview').tap();assert.equal(await homeWidth(),width);assert.deepEqual(errors,[]);results.push({width,height,overview:initial,reading,navHeight:61,touchSwipe:'passed',navigationAndDialogs:'passed'});console.log('PASS mobile',width);await p.close();
}
const p=await b.newPage();for(const width of [701,844,1440]){await p.setViewportSize({width,height:900});for(const name of ['home','classic','essential']){const shots=[];for(const file of ['OXXAlbums_Android_V4_1_navigatie_fix.html','OXXAlbums_Android_V4_2_1.html']){await p.goto('http://127.0.0.1:8001/'+file);if(name!=='home')await p.evaluate(n=>openPage(n),name);await p.waitForTimeout(150);shots.push(await p.screenshot({fullPage:true}));}assert(shots[0].equals(shots[1]),`desktop ${width} ${name}`)}console.log('PASS desktop identical',width)}
const original=fs.readFileSync('OXXAlbums_Android_V4_1_navigatie_fix.html','utf8');const next=fs.readFileSync('OXXAlbums_Android_V4_2_1.html','utf8');const embedded=s=>s.slice(s.indexOf('const pages='),s.indexOf(';function openPage'));assert.equal(embedded(original),embedded(next));assert.deepEqual(original.match(/data:image\/[^\s"'\\]+/g),next.match(/data:image\/[^\s"'\\]+/g));
fs.writeFileSync('review/v4.2.1/results.json',JSON.stringify({mobile:results,desktop:'pixel identical at 701, 844, 1440',originalImagesAndEmbeddedCollectionHTML:'byte identical'},null,2));await b.close()})().catch(e=>{console.error(e);process.exit(1)})
