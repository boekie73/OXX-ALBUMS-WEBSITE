const approved = [
  [
    "Wat is het verschil tussen Classic en Essential?",
    "Classic wordt automatisch samengesteld met onze slimme software. Wij controleren het ontwerp voordat jij het beoordeelt. Essential biedt meer ruimte voor jouw persoonlijke wensen, favoriete foto's en aanpassingen. Bij beide collecties verzorgen wij het fotoboek voor je."
  ],
  [
    "Hoe werkt het bestellen van een fotoboek?",
    "Je kiest Classic of Essential en levert je foto's en wensen aan. Wij maken een persoonlijk ontwerp dat je eerst kunt beoordelen. Pas na jouw definitieve akkoord en betaling gaat het fotoboek in productie."
  ],
  [
    "Moet ik zelf mijn foto's selecteren en indelen?",
    "Nee. Jij levert je foto's aan en wij verzorgen de selectie en indeling. Heb je bepaalde foto's die absoluut in het boek moeten komen? Dan kun je dat aangeven."
  ],
  [
    "Hoe lever ik mijn foto's aan?",
    "Je levert je foto's digitaal aan via de aanlevermethode die wij bij je aanvraag beschikbaar stellen. Je hoeft hiervoor geen eigen fotoboek te ontwerpen."
  ],
  [
    "Kan ik het fotoboek bekijken voordat het wordt gedrukt?",
    "Ja. Je ontvangt eerst een digitaal ontwerp ter beoordeling. Zo kun je het resultaat bekijken en eventuele aanpassingen doorgeven voordat je akkoord geeft."
  ],
  [
    "Wat als ik niet tevreden ben met het ontwerp?",
    "Je kunt binnen de inbegrepen aanpassingsrondes wijzigingen aanvragen. Wil je na het ontwerpvoorstel toch niet verder? Dan kun je kosteloos stoppen."
  ],
  [
    "Hoeveel aanpassingsrondes zijn inbegrepen?",
    "Bij Classic zijn twee aanpassingsrondes inbegrepen en bij Essential drie. Een extra ronde kost €25."
  ],
  [
    "Hoeveel foto's en pagina's mag mijn fotoboek bevatten?",
    "Classic heeft maximaal 60 pagina's en 180 foto's. Essential biedt ruimte voor maximaal 100 pagina's en 300 foto's. Beide collecties beginnen standaard met 30 pagina's."
  ],
  [
    "Kan ik extra pagina's bestellen?",
    "Ja. Bij Classic en Essential kosten twee extra pagina's €3, binnen het maximum van de gekozen collectie."
  ],
  [
    "Wanneer moet ik betalen?",
    "Je betaalt pas nadat je het definitieve ontwerp en de bijbehorende prijs hebt goedgekeurd. Daarna wordt het fotoboek geproduceerd."
  ],
  [
    "Wat gebeurt er met mijn foto's na afloop?",
    "We gebruiken je foto's voor het samenstellen en produceren van jouw fotoboek. De precieze bewaartermijnen en verwijderafspraken worden vastgelegd in ons privacybeleid."
  ]
];

const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const output=process.env.FAQ_SCREENSHOTS||'/tmp/oxx-faq-v3';
const base=process.env.V48_URL||'http://127.0.0.1:8776/preview/v4.8/';
fs.mkdirSync(output,{recursive:true});
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 const report=[];
 for(const [width,height] of [[393,852],[852,393],[320,640],[768,1024],[1440,900]]){
  const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1,isMobile:width<1024,hasTouch:width<1024});
  const errors=[],failures=[],writes=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('response',r=>{if(r.status()>=400)failures.push(r.status()+' '+r.url())});
  page.on('request',r=>{if(!['GET','HEAD'].includes(r.method()))writes.push(r.method()+' '+r.url())});
  await page.goto(base);await page.waitForFunction(()=>!!window.oxxApplicationAPI);
  await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(i=>i.decode().catch(()=>{})))});
  const faq=page.locator('#home-faq');assert.equal(await faq.count(),1);
  assert.equal(await faq.locator('details').count(),11);
  assert.equal(await faq.locator('details[open]').count(),0);
  const host='#mobile-home';
  assert(await page.evaluate(selector=>document.querySelector('#home-faq').getBoundingClientRect().top>=document.querySelector(selector).getBoundingClientRect().bottom,host));
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  assert.equal(await page.getByRole('button',{name:'Mijn OXX',exact:true}).count(),1);
  assert(await page.locator('#home-account').isVisible());
  await page.locator('#home-account').click();assert(await page.locator('#accountInfo').isVisible());await page.locator('#accountInfo .close').click();
  await faq.screenshot({path:`${output}/faq-${width}x${height}-gesloten.png`});
  const cdp=await page.context().newCDPSession(page);
  async function expanded(i){
   const {root}=await cdp.send('DOM.getDocument');
   const {nodeId}=await cdp.send('DOM.querySelector',{nodeId:root.nodeId,selector:'#faq-question-'+i});
   const {nodes}=await cdp.send('Accessibility.getPartialAXTree',{nodeId,fetchRelatives:false});
   const state=nodes.flatMap(n=>n.properties||[]).find(p=>p.name==='expanded');
   assert(state,'Native accessibility expanded state missing');return state.value.value;
  }
  for(let index=0;index<approved.length;index++){
   const summary=faq.locator('summary').nth(index),answer=page.locator('#faq-answer-'+(index+1));
   assert.equal(await summary.locator('span').first().textContent(),approved[index][0]);
   assert.equal(await answer.locator('p').textContent(),approved[index][1]);
   assert.equal(await summary.getAttribute('aria-controls'),'faq-answer-'+(index+1));
   assert.equal(await answer.getAttribute('aria-labelledby'),'faq-question-'+(index+1));
   assert.equal(await expanded(index+1),false);
   assert(await summary.evaluate(el=>el.getBoundingClientRect().height>=44));
   await summary.focus();await page.keyboard.press(index%2?'Space':'Enter');
   assert(await answer.isVisible());assert.equal(await expanded(index+1),true);
   await page.keyboard.press(index%2?'Space':'Enter');assert(!(await answer.isVisible()));assert.equal(await expanded(index+1),false);
  }
  await faq.locator('summary').nth(0).click();await faq.locator('summary').nth(1).click();
  assert.equal(await faq.locator('details[open]').count(),2);
  await faq.locator('summary').nth(1).click();await faq.locator('summary').nth(10).click();
  assert.equal(await faq.locator('details[open]').count(),2);
  await faq.screenshot({path:`${output}/faq-${width}x${height}-open.png`});
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  // The FAQ is homepage-only; collection navigation and existing dialogs are retained.
  for(const collection of ['classic','essential']){
   await page.locator(`[data-collection=${collection}]`).click();
   const f=page.frameLocator('#frame');await f.locator('.responsive-collection').waitFor({state:'attached'});
   assert(!(await faq.isVisible()));assert(!(await page.locator('#home-account').isVisible()));
   for(const key of ['compare','account']){
    await f.locator(width<1024?`[data-open=${key}]`:`.hit.${key},.hotspot.${key}`).click();
    assert(await f.locator('#'+key).isVisible());await f.locator('#'+key+' .close').click();
   }
   await f.locator(width<1024?'nav [data-route=home]':'.home,.logo').click();assert(await faq.isVisible());
  }
  await page.locator('[data-collection=premium]').click();
  assert(await page.locator('#premiumInfo').isVisible());assert((await page.locator('#premiumInfo').textContent()).includes('niet bestelbaar'));await page.locator('#premiumInfo button').click();
  assert.equal(await page.evaluate(()=>window.oxxApplicationAPI.enabled),false);
  assert.deepEqual(errors,[]);assert.deepEqual(failures,[]);assert.deepEqual(writes,[]);
  report.push({width,height,result:'PASS',literalQuestionsAndAnswers:11,nativeKeyboardAndExpandedState:true,independentPanels:true,existingNavigationAndAccount:true,noHorizontalOverflow:true});
  await page.close();
 }
 fs.writeFileSync(output+'/testresultaten.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
