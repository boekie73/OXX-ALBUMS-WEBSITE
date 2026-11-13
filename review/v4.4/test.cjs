const assert=require('node:assert/strict');const fs=require('fs');const {chromium}=require('playwright');
const base='http://127.0.0.1:8004/';const url=base+'OXXAlbums_Android_V4_4.html';
const account='Mijn OXX — Onze beveiligde klantomgeving is momenteel in ontwikkeling. Binnenkort kun je hier jouw fotoboekproject bekijken en volgen.';
const premium='Premium is nog in ontwikkeling en niet bestelbaar.';
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});const results=[];
for(const [width,height] of [[320,640],[393,851],[412,915]]){
 const p=await b.newPage({viewport:{width,height},isMobile:true,hasTouch:true,deviceScaleFactor:2});p.setDefaultTimeout(10000);const errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto(url);
 const nav=label=>p.locator('.mobile-tools :is(button,a)').filter({hasText:new RegExp('^'+label+'$')});
 const outerDialog=async(label,id,text)=>{await nav(label).tap();assert(await p.locator('#'+id).evaluate(d=>d.open));assert.equal(await p.locator('#'+id+' p').innerText(),text);assert.equal(await p.locator('#'+id+' :is(input,form)').count(),0);await p.locator('#'+id+' button').first().tap();assert(!await p.locator('#'+id).evaluate(d=>d.open))};
 await nav('Home').tap();await outerDialog('Mijn OXX','accountInfo',account);await outerDialog('Premium','premiumInfo',premium);await p.locator('[data-collection="premium"]').tap();assert.equal(await p.locator('#premiumInfo p').innerText(),premium);await p.locator('#premiumInfo button').tap();
 for(const name of ['classic','essential']){
  // Use both original mobile cards and all navigation buttons.
  await p.locator(`[data-collection="${name}"]`).tap();await p.waitForFunction(n=>document.getElementById('frame').contentDocument?.title.toLowerCase().includes(n),name);let f=p.frames()[1];await f.locator('.master').evaluate(i=>i.decode());
  await outerDialog('Mijn OXX','accountInfo',account);await outerDialog('Premium','premiumInfo',premium);
  await nav('Leesstand').tap();assert.equal(await f.locator('.shell,.page').evaluate(e=>e.getBoundingClientRect().width),780);
  for(const id of ['start','details','compare','account']){await f.locator(`[data-dialog="${id}"]`).tap();assert(await f.locator('#'+id).evaluate(d=>d.open));if(id==='account'){assert.equal(await f.locator('#account p').innerText(),account);assert(!/Brandlogo|Bull|masterafbeelding/i.test(await f.locator('#account').innerText()))}await f.locator(`#${id} .close`).tap();assert(!await f.locator('#'+id).evaluate(d=>d.open))}
  await f.locator('a.premium').tap();assert.equal(await p.locator('#premiumInfo p').innerText(),premium);await p.locator('#premiumInfo button').tap();
  await nav('Overzicht').tap();assert.equal(await f.locator('.shell,.page').evaluate(e=>e.getBoundingClientRect().width),width);
  const other=name==='classic'?'essential':'classic';await f.locator('a.'+other).tap();await p.waitForFunction(n=>document.getElementById('frame').contentDocument?.title.toLowerCase().includes(n),other);f=p.frames()[1];await f.locator('a.home,a.logo').tap();assert(await p.locator('#mobile-home').isVisible());
 }
 for(const label of ['Classic','Essential']){await nav(label).tap();await p.waitForFunction(n=>document.getElementById('frame').contentDocument?.title.includes(n),label);await nav('Home').tap();assert(await p.locator('#mobile-home').isVisible())}
 // Validate real link activation and browser Back, while isolating the unavailable external service.
 await p.route('https://oxxdesign.nl/**',route=>route.fulfill({status:200,body:'OXX Design target'}));
 for(const entry of ['card','navigation','classic','essential']){
  await p.goto(url);let link;
  if(entry==='card')link=p.locator('[data-collection="design"]');
  else if(entry==='navigation')link=nav('OXX Design');
  else {await nav(entry==='classic'?'Classic':'Essential').tap();await p.waitForFunction(n=>document.getElementById('frame').contentDocument?.title.toLowerCase().includes(n),entry);link=p.frames()[1].locator('a.design')}
  await link.tap();if(entry==='card'||entry==='navigation'){await p.waitForURL('https://oxxdesign.nl/');await p.goBack();await p.waitForURL(url)}else{await p.frames()[1].waitForURL('https://oxxdesign.nl/');await p.evaluate(()=>history.back());await p.waitForFunction(n=>document.getElementById('frame').contentDocument?.title.toLowerCase().includes(n),entry)}
 }
 assert.deepEqual(errors,[]);results.push({width,height,touchNavigationDialogsCloseAndReturn:'passed',customerTexts:'exact',externalLinkAndBrowserBack:'passed, external request intercepted'});console.log('PASS mobile',width);await p.close();
}
const p=await b.newPage({viewport:{width:1440,height:900}});for(const name of ['home','classic','essential']){let shots=[];for(const file of ['OXXAlbums_Android_V4_3.html','OXXAlbums_Android_V4_4.html']){await p.goto(base+file);if(name!=='home'){await p.evaluate(n=>openPage(n),name);await p.waitForFunction(()=>document.querySelector('#frame').contentDocument?.querySelector('.master')?.complete)}await p.waitForTimeout(100);shots.push(await p.screenshot({fullPage:true}));}assert(shots[0].equals(shots[1]),'desktop '+name)}
fs.writeFileSync('review/v4.4/results.json',JSON.stringify({mobile:results,desktop:'Home/Classic/Essential pixel identical to V4.3 at 1440px',errors:[]},null,2)+'\n');await b.close()})().catch(e=>{console.error(e);process.exit(1)})
