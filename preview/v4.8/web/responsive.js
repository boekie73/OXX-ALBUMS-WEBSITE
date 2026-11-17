/* Responsive presentation around unchanged artwork and existing local dialogs. */
(() => {
 const frame = document.getElementById('frame');
 const cards = {
  classic:['Classic','Stijlvol en compleet','Snel en eenvoudig','Automatische opmaak','Ontdek Classic →'],
  essential:['Essential','Meer ruimte voor jouw wensen','Aanpassingen in stijl en opmaak','Een persoonlijker fotoboek','Ontdek Essential →'],
  premium:['Premium','Uitgebreid maatwerk','Luxe afwerkingen en materialen','Inclusief elegante bewaarbox','ON HOLD — niet bestelbaar'],
  design:['OXX Design','Ook voor andere creatieve projecten','Ontdek OXX Design →']
 };
 document.querySelectorAll('.mobile-card').forEach(card => {
  const [title,...lines] = cards[card.dataset.collection];
  const copy = document.createElement('span');copy.className='card-copy';
  const heading=document.createElement('strong');heading.textContent=title;copy.append(heading);
  lines.forEach((line,i)=>{const el=document.createElement(i===lines.length-1?'em':'span');el.textContent=line;copy.append(el)});
  card.append(copy);
 });
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
  const design=doc.querySelector('.shell,.page');
  const style=doc.createElement('link');style.rel='stylesheet';style.href=new URL('./web/collection-responsive.css',location.href).href;doc.head.append(style);
  const section=doc.createElement('article');section.className='responsive-collection';
  section.innerHTML=`
   <header><h1>${name}</h1><nav aria-label="Collectienavigatie">
    <a href="#home" data-route="home">OXX Albums</a>
    <a href="#classic" data-route="classic" ${classic?'aria-current="page"':''}>Classic</a>
    <a href="#essential" data-route="essential" ${!classic?'aria-current="page"':''}>Essential</a>
    <button type="button" data-premium>Premium</button>
    <a href="https://oxxdesign.nl" target="_top">OXX Design</a>
    <button type="button" data-open="account">Mijn OXX</button>
   </nav></header>
   <div class="collection-copy"><section>
    <h2>${classic?'Jouw foto’s, ons ontwerp.':'Meer mogelijkheden, jouw stijl.'}</h2>
    <p>${classic?'Wij selecteren jouw mooiste foto’s en maken er een stijlvol fotoboek van. Zonder ingewikkelde keuzes, volledig verzorgd.':'Een persoonlijk fotoboek met extra ruimte voor jouw wensen. Meer keuze, meer variatie en een opmaak die nog beter bij jouw verhaal past.'}</p>
    <p class="price">${classic?'Vanaf €99':'Vanaf €129'} <span>Introductieprijs · Normaal vanaf ${classic?'€109':'€149'}</span></p>
    <button class="gold" type="button" data-open="start">Start met ${name} →</button>
   </section><section>
    <h2>Inbegrepen</h2>
    <ul>${(classic?['Professionele fotoselectie','Stijlvolle opmaak','2 herstelrondes inbegrepen']:['Persoonlijke selectie en opmaak','Meer ontwerpopties','Extra bewerkingen','3 herstelrondes inbegrepen']).map(x=>`<li>${x}</li>`).join('')}</ul>
    <h2>Meer weten?</h2><p>Bekijk de formaten, werkwijze en extra mogelijkheden.</p>
    <button type="button" data-open="details">Alle details over ${name} →</button>
    <button type="button" data-open="compare">Vergelijk onze collecties →</button>
   </section></div>
   <figure><figcaption>Origineel paginaontwerp — de ingebakken tekst staat hierboven leesbaar en bij Alle details.</figcaption></figure>`;
  // Use the exact original image, without cropping or changing its pixels.
  section.querySelector('figure').append(doc.querySelector('.master').cloneNode());
  design.before(section);
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
