/* Responsive presentation around unchanged artwork and existing local dialogs. */
(() => {
 const frame = document.getElementById('frame');
 // Display windows select existing photography/marks only; raster text is not repeated.
 function artwork(doc,src,sourceWidth,rect,alt,className=''){
  const [x,y,w,h]=rect,box=doc.createElement('span'),img=doc.createElement('img');
  box.className='art-window '+className;box.style.aspectRatio=w+'/'+h;
  img.src=src;img.alt=alt;img.style.width=(sourceWidth/w*100)+'%';
  img.style.left=(-x/w*100)+'%';img.style.top=(-y/h*100)+'%';
  box.append(img);return box;
 }
 const headerImage=document.querySelector('.mobile-header');
 const logoSource=headerImage.src;
 const cards={
  classic:{title:'Classic',width:363,photo:[10,78,343,146],lines:['Stijlvol en compleet','Snel en eenvoudig','Automatische opmaak'],icons:[[63,228,35,28],[63,261,35,29],[63,295,35,33]],cta:'Ontdek Classic →'},
  essential:{title:'Essential',width:359,photo:[10,78,339,141],lines:['Meer ruimte voor jouw wensen','Aanpassingen in stijl en opmaak','Een persoonlijker fotoboek'],icons:[[36,226,34,29],[36,261,34,29],[36,293,34,33]],cta:'Ontdek Essential →'},
  premium:{title:'Premium',width:363,photo:[10,68,343,154],lines:['Uitgebreid maatwerk','Luxe afwerkingen en materialen','Inclusief elegante bewaarbox'],icons:[[40,224,32,28],[40,258,32,28],[40,290,32,35]],cta:'Ontdek Premium →'},
  design:{title:'OXX Design',width:330,photo:[8,110,314,130],lines:['Ook voor andere creatieve projecten'],cta:'Ontdek OXX Design →'}
 };
 const collectionCopy={
  classic:{heading:'Automatisch samengesteld fotoboek',text:"Onze slimme software selecteert en rangschikt jouw foto's automatisch tot een stijlvol fotoboek. Wij controleren het resultaat en jij beoordeelt het ontwerp.",product:"Onze slimme software selecteert en deelt jouw foto's automatisch in. Wij controleren het resultaat en jij beoordeelt het ontwerp. Professioneel verzorgd, zonder dat je zelf een fotoboek hoeft te ontwerpen."},
  essential:{heading:'Meer persoonlijke invloed op jouw fotoboek',text:"Wij verzorgen het ontwerp, met extra aandacht voor jouw wensen, favoriete foto's en persoonlijke indeling. Je krijgt meer ruimte voor aanpassingen.",product:"Wij verzorgen je fotoboek professioneel, met meer ruimte voor jouw persoonlijke wensen en ontwerpkeuzes, favoriete foto's en indeling. Je hoeft zelf geen fotoboek te ontwerpen.",desktop:"Wij verzorgen het ontwerp professioneel, met ruimte voor jouw wensen, favoriete foto's en persoonlijke indeling. Drie aanpassingsrondes inbegrepen. Je hoeft zelf niet te ontwerpen."}
 };
 const homeHeader=document.createElement('header');homeHeader.className='mobile-home-header';
 homeHeader.append(artwork(document,logoSource,512,[140,6,176,104],'OXX Albums','brand-logo'));
 const intro=document.createElement('div');intro.innerHTML='<p class="eyebrow">Luxe fotoalbums op maat</p><h1>Jij maakt de herinneringen.</h1><p class="home-tagline">Wij maken het fotoboek.</p>';
 homeHeader.append(intro);headerImage.replaceWith(homeHeader);
 document.querySelectorAll('.mobile-card').forEach(card=>{
  const data=cards[card.dataset.collection];data.src=card.querySelector('img').src;
  card.replaceChildren();
  if(card.dataset.collection==='design'){
   card.append(artwork(document,data.src,330,[22,12,286,96],'OXX Design','design-logo'));
  }else{
   const heading=document.createElement('strong');heading.className='card-title';heading.textContent=data.title;card.append(heading);
  }
  card.append(artwork(document,data.src,data.width,data.photo, data.title==='OXX Design'?'Vuurtoren bij zonsondergang':data.title+' fotoalbum','card-photo'));
  const copy=document.createElement('span');copy.className='card-copy';
  const distinction=collectionCopy[card.dataset.collection];
  if(distinction){
   const heading=document.createElement('strong');heading.className='card-distinction';heading.textContent=distinction.heading;
   const description=document.createElement('span');description.className='card-description';description.textContent=distinction.text;
   copy.append(heading,description);
  }else{
  data.lines.forEach((line,index)=>{
   const row=document.createElement('span');row.className='card-feature';
   if(data.icons)row.append(artwork(document,data.src,data.width,data.icons[index],'','feature-icon'));
   const text=document.createElement('span');text.textContent=line;row.append(text);copy.append(row);
  });
  }
  if(card.dataset.collection==='premium'){
   const status=document.createElement('span');status.className='hold-status';status.textContent='ON HOLD — niet bestelbaar';copy.append(status);
  }
  const cta=document.createElement('span');cta.className='card-cta';cta.textContent=data.cta;copy.append(cta);card.append(copy);
 });
 document.querySelector('#mobile-home').before(document.querySelector('#home-scroll'));
 const flourish=artwork(document,document.querySelector('#home img').src,1536,[0,798,1536,56],'','desktop-home-flourish');
 document.querySelector('#mobile-home').after(flourish);
 const originalOpen=window.openPage, originalHome=window.goHome;
 function render(name){
  if(name==='classic'||name==='essential'){
   document.body.classList.add('collection-open');originalOpen(name);
  }else{
   document.body.classList.remove('collection-open');originalHome();
  }
 }
 window.openPage=name=>{
  if(!['classic','essential'].includes(name))return;
  history.pushState(null,'','#'+name);render(name);
 };
 window.goHome=()=>{history.pushState(null,'',location.pathname+location.search);render('home')};
 window.addEventListener('popstate',()=>render(location.hash.slice(1)));
 frame.addEventListener('load',()=>{
  const doc=frame.contentDocument;
  if(!doc?.querySelector('.master'))return;
  const name=doc.querySelector('.shell')?'Classic':'Essential';
  const classic=name==='Classic';
  const distinction=collectionCopy[name.toLowerCase()];
  const design=doc.querySelector('.shell,.page');
  // External design links must leave the collection iframe on every layout.
  doc.querySelectorAll('a.design').forEach(link=>{link.target='_top'});
  const style=doc.createElement('link');style.rel='stylesheet';style.href=new URL('./web/collection-responsive.css?v=20261118-v31-copy',location.href).href;doc.head.append(style);
  const section=doc.createElement('article');section.className='responsive-collection';
  section.innerHTML=`
   <header class="collection-header"><a class="collection-brand" href="#home" data-route="home" aria-label="Terug naar OXX Albums"></a><h1>${name}</h1><nav aria-label="Collectienavigatie">
    <a href="#home" data-route="home">OXX Albums</a>
    <a href="#classic" data-route="classic" ${classic?'aria-current="page"':''}>Classic</a>
    <a href="#essential" data-route="essential" ${!classic?'aria-current="page"':''}>Essential</a>
    <button type="button" data-premium>Premium</button>
    <a href="https://oxxdesign.nl" target="_top">OXX Design</a>
    <button type="button" data-open="account">Mijn OXX</button>
   </nav></header>
   <div class="collection-hero"><div class="hero-photo"></div><section class="hero-copy">
    <h2>${classic?"Jouw foto's, ons ontwerp.":'Meer mogelijkheden, jouw stijl.'}</h2>
    <p>${distinction.product}</p>
    <p class="price">${classic?'Vanaf €99':'Vanaf €129'} <span>Introductieprijs · Normaal vanaf ${classic?'€109':'€149'}</span></p>
    <button class="gold" type="button" data-open="start">Start met ${name} →</button>
   </section></div>
   <section class="collection-features"><h2>Inbegrepen</h2>
    <ul>${(classic?['Automatische fotoselectie en indeling','Persoonlijke controle door ons','Jij beoordeelt het ontwerp','2 aanpassingsrondes inbegrepen']:['Meer ruimte voor persoonlijke wensen en ontwerpkeuzes','Extra aandacht voor favoriete foto’s en indeling','3 aanpassingsrondes inbegrepen']).map(x=>`<li>${x}</li>`).join('')}</ul>
   </section>
   <section class="collection-more"><div class="lighthouse-photo"></div><div>
    <h2>Meer weten?</h2><p>Bekijk de formaten, werkwijze en extra mogelijkheden.</p>
    <button type="button" data-open="details">Alle details over ${name} →</button>
    <button type="button" data-open="compare">Vergelijk onze collecties →</button>
   </div></section>`;
  section.querySelector('.collection-brand').append(artwork(doc,logoSource,512,[140,6,176,104],'OXX Albums','brand-logo'));
  const card=cards[name.toLowerCase()];
  section.querySelector('.hero-photo').append(artwork(doc,card.src,card.width,card.photo,name+' fotoalbum'));
  const master=doc.querySelector('.master');
  section.querySelector('.lighthouse-photo').append(artwork(doc,master.src,classic?1404:1536,classic?[0,985,450,420]:[0,710,390,300],'Vuurtoren bij zonsondergang'));
  // Replace only the existing raster introduction, away from photography/prices.
  const desktopIntro=doc.createElement('p');desktopIntro.className='desktop-intro '+name.toLowerCase();desktopIntro.textContent=classic?distinction.product:distinction.desktop;design.append(desktopIntro);
  if(classic){
   const heading=doc.createElement('h2');heading.className='desktop-classic-heading';heading.textContent="Jouw foto's, ons ontwerp.";design.append(heading);
   const features=section.querySelector('.collection-features').cloneNode(true);features.className='desktop-classic-features';design.append(features);
  }
  design.before(section);
  // Keep narrow comparisons readable without squeezing four columns.
  doc.querySelectorAll('table').forEach(table=>{
   const labels=Array.from(table.querySelectorAll('tr:first-child th'),cell=>cell.textContent);
   table.querySelectorAll('tr').forEach(row=>{
    Array.from(row.querySelectorAll('td')).forEach((cell,index)=>{
     if(index>0)cell.dataset.column=labels[index]||'';
    });
   });
  });
  section.addEventListener('click',event=>{
   const route=event.target.closest('[data-route]');
   if(route){event.preventDefault();route.dataset.route==='home'?window.goHome():window.openPage(route.dataset.route);return}
   const open=event.target.closest('[data-open]');
   if(open)doc.getElementById(open.dataset.open).showModal();
  });
  doc.addEventListener('click',event=>{
   if(!event.target.closest('.premium,[data-premium]'))return;
   event.preventDefault();event.stopImmediatePropagation();document.getElementById('premiumInfo').showModal();
  },true);
  // Escape closes a dialog first; it must not discard the collection/form.
  doc.addEventListener('keydown',event=>{
   if(event.key==='Escape'&&!doc.querySelector('dialog[open]'))window.goHome();
  });
 });
 render(location.hash.slice(1));
})();
