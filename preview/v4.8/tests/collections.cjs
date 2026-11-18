const {chromium}=require('playwright');const assert=require('node:assert/strict');const fs=require('fs');
const output=process.env.COLLECTION_SCREENSHOTS||'/tmp/oxx-v3-collections';fs.mkdirSync(output,{recursive:true});
const expected={classic:{heading:'Automatisch samengesteld fotoboek',text:"Onze slimme software selecteert en rangschikt jouw foto's automatisch tot een stijlvol fotoboek. Wij controleren het resultaat en jij beoordeelt het ontwerp."},essential:{heading:'Meer persoonlijke invloed op jouw fotoboek',text:"Wij verzorgen het ontwerp, met extra aandacht voor jouw wensen, favoriete foto's en persoonlijke indeling. Je krijgt meer ruimte voor aanpassingen."}};
(async()=>{const b=await chromium.launch({headless:true,executablePath:'/usr/bin/chromium',args:['--no-sandbox']});const results=[];
for(const [w,h] of [[393,852],[852,393],[320,640],[768,1024],[1024,768],[1440,900]]){
 const p=await b.newPage({viewport:{width:w,height:h},isMobile:w<1024,hasTouch:w<1024,deviceScaleFactor:1});const errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto(process.env.V48_URL||'http://127.0.0.1:8765/preview/v4.8/');await p.waitForFunction(()=>!!window.oxxApplicationAPI);
 await p.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(i=>i.decode().catch(()=>{})))});
 assert.equal(await p.locator('.mobile-card').count(),4);
 if(w>=1024)assert(await p.evaluate(()=>document.querySelector('#home-scroll').getBoundingClientRect().bottom<=document.querySelector('#mobile-home').getBoundingClientRect().top),'Original desktop hero must precede the cards');
 assert.equal(await p.locator('#home-faq').count(),1);assert.equal(await p.locator('#home-faq details').count(),11);
 for(const c of ['classic','essential']){
  const card=p.locator(`[data-collection=${c}]`);assert(await card.isVisible());assert.equal(await card.locator('.card-distinction').textContent(),expected[c].heading);assert.equal(await card.locator('.card-description').textContent(),expected[c].text);assert.equal(await card.locator('.card-cta').count(),1);
 }
 assert(await p.locator('#home-account').isVisible());assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await p.screenshot({path:`${output}/homepage-${w}x${h}.png`,fullPage:true});
 await p.screenshot({path:`${output}/homepage-${w}x${h}-scherm.png`});
 const product={};
 for(const c of ['classic','essential']){
  await p.locator(`[data-collection=${c}]`).click();const f=p.frameLocator('#frame');await f.locator('.responsive-collection').waitFor({state:'attached'});const inner=p.frames().find(f=>f.parentFrame());await inner.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(i=>i.decode().catch(()=>{})))});
  assert(await inner.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  const copy=f.locator(w<1024?'.hero-copy':'.desktop-intro');assert(await copy.isVisible());
  const text=await copy.textContent();assert(text.includes(c==='classic'?'Onze slimme software':'wensen'));
  assert(/professioneel/i.test(text));assert(/zelf.*ontwerpen/.test(text));
  if(w<1024)assert((await f.locator('.collection-features').textContent()).includes((c==='classic'?'2':'3')+' aanpassingsrondes inbegrepen'));
  assert(!text.includes('OXX Engine'));
  if(c==='classic'){
   const heading=f.locator(w<1024?'.hero-copy h2':'.desktop-classic-heading');assert.equal(await heading.textContent(),"Jouw foto's, ons ontwerp.");
   if(w>=1024)assert(await heading.evaluate(el=>el.scrollHeight<=el.clientHeight+1));
   const intro=f.locator(w<1024?'.hero-copy>p:first-of-type':'.desktop-intro');
   assert.equal(await intro.textContent(),"Onze slimme software selecteert en deelt jouw foto's automatisch in. Wij controleren het resultaat en jij beoordeelt het ontwerp. Professioneel verzorgd, zonder dat je zelf een fotoboek hoeft te ontwerpen.");
   const list=f.locator(w<1024?'.collection-features li':'.desktop-classic-features li');
   assert.deepEqual(await list.allTextContents(),['Automatische fotoselectie en indeling','Persoonlijke controle door ons','Jij beoordeelt het ontwerp','2 aanpassingsrondes inbegrepen']);
  }
  const layout=await f.locator('.desktop-intro').evaluate(el=>({scrollHeight:el.scrollHeight,clientHeight:el.clientHeight,box:el.getBoundingClientRect().toJSON()}));
  if(w>=1024)assert(layout.scrollHeight<=layout.clientHeight+1,`desktop intro clipped ${c} ${w}: ${JSON.stringify(layout)}`);
  await inner.evaluate(()=>scrollTo(0,0));await p.screenshot({path:`${output}/${c}-${w}x${h}-boven.png`});
  await inner.evaluate(()=>scrollTo(0,document.documentElement.scrollHeight));await p.screenshot({path:`${output}/${c}-${w}x${h}-onder.png`});product[c]=layout;
  await f.locator(w<1024?'nav [data-route=home]':'.home,.logo').click();
 }
 assert.deepEqual(errors,[]);results.push({w,h,result:'PASS',product});console.log(w,h,'PASS');await p.close();
}
fs.writeFileSync(output+'/collection-testresultaten.json',JSON.stringify(results,null,2));await b.close()})().catch(e=>{console.error(e);process.exit(1)});
