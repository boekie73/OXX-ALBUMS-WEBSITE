const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const output=process.env.V48_SCREENSHOTS||'/tmp/v48-checks';fs.mkdirSync(output,{recursive:true});
const base=process.env.V48_URL||'http://127.0.0.1:8765/preview/v4.8/';
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 const results=[];
 for(const [width,height] of [[393,852],[852,393],[320,640],[768,1024],[1440,900]]){
  const page=await browser.newPage({viewport:{width,height},isMobile:width<1024,hasTouch:width<1024});const errors=[],writes=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(r.method()!=='GET')writes.push(r.url())});
  await page.goto(base);
  await page.waitForFunction(()=>!!window.oxxApplicationAPI);
  assert.equal(await page.locator('.mobile-tools').count(),0);
  const overflow=async target=>assert(await target.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`overflow ${width}`);
  if(width<1024){
   assert.equal(await page.locator('.mobile-card').count(),4);
   assert.equal(await page.locator('.mobile-card .card-title').count(),3);
   assert.equal(await page.locator('.mobile-card .card-cta').count(),4);
   assert.equal(await page.locator('.mobile-card>img').count(),0);
   assert.equal(await page.locator('.mobile-home-header h1').count(),1);
   if(width===852)assert(await page.locator('.mobile-home-header').evaluate(el=>el.getBoundingClientRect().height<130));
  }
  await overflow(page);await page.screenshot({path:`${output}/home-${width}.png`,fullPage:true});
  await page.locator(width<=1023?'[data-collection="premium"]':'#home .premium').click();
  assert(await page.locator('#premiumInfo').isVisible());await page.locator('#premiumInfo button').click();
  await page.locator(width<=1023?'[data-collection="classic"]':'#home .classic').click();
  let f=page.frameLocator('#frame');await f.locator('.responsive-collection').waitFor({state:'attached'});
  const inner=()=>page.frames().find(x=>x.parentFrame());
  await overflow(inner());
  if(width<1024){
   assert.equal(await f.locator('.responsive-collection .master').count(),0);
   assert.equal(await f.locator('.responsive-collection h1').textContent(),'Classic');
   assert.equal(await f.locator('.responsive-collection [data-open=start]').count(),1);
  }
  const external=f.locator(width<=1023?'.responsive-collection a[href="https://oxxdesign.nl"]':'a.design');
  assert.equal(await external.getAttribute('target'),'_top');
  if(width<=1023){
   const navLink=f.locator('[data-route="classic"]');
   assert.equal(await navLink.evaluate(el=>getComputedStyle(el).borderRadius),'0px');
   assert(await navLink.evaluate(el=>el.getBoundingClientRect().height>=44));
  }
  const control=key=>f.locator(width<=1023?`[data-open="${key}"]`:`.hit.${key},.hotspot.${key}`);
  for(const key of ['details','compare','account']){
   await control(key).click();assert(await f.locator(`#${key}`).isVisible());
   if(key==='details'){await f.locator('#details summary').first().click();assert(await f.locator('#details details').first().getAttribute('open')!==null)}
   await overflow(inner());
   assert(await f.locator(`#${key}`).evaluate(el=>el.scrollWidth<=el.clientWidth));
   if(key==='compare'){
    assert.equal(await f.locator('#compare tr').nth(1).locator('td').nth(2).getAttribute('data-column'),'Essential');
    await page.screenshot({path:`${output}/compare-${width}.png`});
   }
   await f.locator(`#${key} .close`).click();
  }
  await control('start').click();
  await f.locator('[data-check-application]').click();assert(await f.locator('form').isVisible());
  await f.locator('[name=customerName]').fill('Test');await f.locator('[name=email]').fill('test@example.com');
  await f.locator('[name=bookFormat]').selectOption({index:1});await f.locator('[name=photoCount]').fill('181');
  await f.locator('[data-check-application]').click();assert(await f.locator('#photo-limit-error').isVisible());
  await f.locator('[name=photoCount]').fill('180');await f.locator('[data-check-application]').click();
  assert(await f.locator('#application-review').isVisible());
  await f.locator('[data-edit-application]').click();assert(await f.locator('form').isVisible());
  await page.screenshot({path:`${output}/form-${width}.png`});
  await f.locator('#start .close').click();await control('start').click();assert.equal(await f.locator('[name=customerName]').inputValue(),'');
  await page.keyboard.press('Escape');assert(!(await f.locator('#start').isVisible()));assert(await page.locator('#view').isVisible());
  await page.screenshot({path:`${output}/classic-${width}.png`,fullPage:true});
  await f.locator(width<=1023?'[data-route="essential"]':'.hit.essential').click();
  await f.locator('.responsive-collection h1').filter({hasText:'Essential'}).waitFor({state:'attached'});
  await overflow(inner());
  if(width<1024){
   assert.equal(await f.locator('.collection-features').getByText('3 herstelrondes inbegrepen',{exact:true}).count(),1);
   assert.equal(await f.locator('.responsive-collection .master').count(),0);
   assert.equal(await f.locator('.responsive-collection').getByText('2 herstelrondes inbegrepen',{exact:true}).count(),0);
  }
  await f.locator(width<=1023?'[data-premium]':'.hotspot.premium').click();assert(await page.locator('#premiumInfo').isVisible());await page.locator('#premiumInfo button').click();
  await control('start').click();await f.locator('[name=customerName]').fill('Test');await f.locator('[name=email]').fill('test@example.com');await f.locator('[name=bookFormat]').selectOption({index:1});
  await f.locator('[name=photoCount]').fill('301');await f.locator('[data-check-application]').click();assert(await f.locator('#photo-limit-error').isVisible());
  await f.locator('[name=photoCount]').fill('300');await f.locator('[data-check-application]').click();assert(await f.locator('#application-review').isVisible());await f.locator('#start .close').click();
  await page.screenshot({path:`${output}/essential-${width}.png`,fullPage:true});
  await page.goBack();await f.locator('.responsive-collection h1').filter({hasText:'Classic'}).waitFor({state:'attached'});
  await f.locator(width<=1023?'nav [data-route="home"]':'.hit.home').click();assert(!(await page.locator('#view').isVisible()));
  if(width<1024){
   await page.evaluate(()=>openPage('classic'));
   await f.locator('.collection-brand').waitFor();await f.locator('.collection-brand').click();
   assert(!(await page.locator('#view').isVisible()));
  }
  assert.equal(await page.evaluate(()=>window.oxxApplicationAPI.enabled),false);assert.deepEqual(writes,[]);assert.deepEqual(errors,[]);
  // Rotate an already opened form and verify that input and dialog remain usable.
  if(width===393){
   await page.evaluate(()=>openPage('classic'));
   await f.locator('[data-open="start"]').waitFor();await f.locator('[data-open="start"]').click();
   await f.locator('[name=customerName]').fill('Rotatietest');
   await page.setViewportSize({width:852,height:393});
   assert.equal(await f.locator('[name=customerName]').inputValue(),'Rotatietest');await overflow(inner());
   assert(await f.locator('#start').evaluate(el=>el.getBoundingClientRect().bottom<=innerHeight));
   await page.setViewportSize({width:393,height:852});await f.locator('#start .close').click();
   await inner().evaluate(()=>scrollTo(0,0));await page.screenshot({path:`${output}/classic-top-393.png`});
   await inner().evaluate(()=>scrollTo(0,document.body.scrollHeight));await page.screenshot({path:`${output}/classic-bottom-393.png`});
   await page.evaluate(()=>goHome());
  }
  // Exercise every OXX Design exit without contacting the third-party site.
  await page.route('https://oxxdesign.nl/**',route=>{
   assert.equal(route.request().frame(),page.mainFrame());
   return route.fulfill({status:200,contentType:'text/html',body:'<title>Local link destination check</title>'});
  });
  for(const routeName of ['home','classic','essential']){
   await page.goto(base+(routeName==='home'?'':'#'+routeName));
   await page.waitForFunction(()=>!!window.oxxApplicationAPI);
   if(routeName==='home'){
    await page.locator(width<1024?'[data-collection="design"]':'#home .design').click();
   }else{
    const designLink=f.locator(width<1024?'.responsive-collection a[href="https://oxxdesign.nl"]':'a.design');
    await designLink.click();
   }
   await page.waitForURL('https://oxxdesign.nl/');
   await page.goBack();
  }
  assert.deepEqual(writes,[]);assert.deepEqual(errors,[]);
  results.push(`${width}x${height}: PASS home, Classic, Essential, Premium HOLD, dialogs, validation/review/reset, history, overflow, no writes/errors`);
  await page.close();
 }
 console.log(results.join('\n'));await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
