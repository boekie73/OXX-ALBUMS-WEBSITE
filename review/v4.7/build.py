from pathlib import Path
import re,json,subprocess
root=Path(__file__).resolve().parents[2]
s=(root/'OXXAlbums_Android_V4_6.html').read_text()
assert subprocess.check_output(['git','rev-parse','origin/main:preview/v4.6/index.html'],cwd=root)==subprocess.check_output(['git','rev-parse','HEAD:OXXAlbums_Android_V4_6.html'],cwd=root)
m=re.search(r'const pages=(.*?);function openPage',s,re.S);pages=json.loads(m[1])
script='''<script>
// V4.7: local validation and review only; no transmission or storage.
(()=>{
 const dialog=document.getElementById('start');
 const form=dialog.querySelector('form');
 const review=dialog.querySelector('#application-review');
 const error=dialog.querySelector('#photo-limit-error');
 const name=form.elements.namedItem('customerName');
 const photos=form.elements.namedItem('photoCount');
 const collection=form.elements.namedItem('collection').value;
 const maximum=Number(photos.max);
 function clearErrors(){
  name.setCustomValidity('');photos.setCustomValidity('');
  photos.removeAttribute('aria-invalid');error.hidden=true;error.textContent='';
 }
 function photoMessage(){
  const count=photos.valueAsNumber;
  if(!Number.isInteger(count)||count<1)return "Vul een positief geheel aantal foto's in.";
  if(count<=maximum)return '';
  if(collection==='Classic')return count<=300
   ? "Classic biedt ruimte aan maximaal 180 foto's. Voor dit aantal past Essential, met maximaal 300 foto's. Kies Essential zelf als je die collectie wilt aanvragen; je huidige keuze blijft Classic."
   : "Classic biedt ruimte aan maximaal 180 foto's. Essential biedt ruimte aan maximaal 300 foto's. Voor meer dan 300 foto's is er momenteel geen passende bestelbare collectie. Verlaag je schatting; Premium is nog niet bestelbaar.";
  return "Essential biedt ruimte aan maximaal 300 foto's. Voor meer foto's is er momenteel geen passende andere bestelbare collectie. Verlaag je schatting tot maximaal 300 foto's; Premium is nog niet bestelbaar.";
 }
 function showForm(){
  review.hidden=true;form.hidden=false;dialog.scrollTop=0;name.focus();
 }
 function check(){
  clearErrors();name.setCustomValidity(name.value.trim()?'':'Vul je naam in.');
  const message=photoMessage();
  if(message){photos.setCustomValidity(message);photos.setAttribute('aria-invalid','true');error.textContent=message;error.hidden=false}
  if(!form.reportValidity())return;
  const values={customerName:name.value.trim(),email:form.elements.namedItem('email').value,
   collection,bookFormat:form.elements.namedItem('bookFormat').value,photoCount:photos.value,
   comments:form.elements.namedItem('comments').value||'Niet ingevuld'};
  review.querySelectorAll('[data-summary]').forEach(e=>{e.textContent=values[e.dataset.summary]});
  form.hidden=true;review.hidden=false;review.focus({preventScroll:true});review.scrollIntoView({block:'start'});
 }
 form.addEventListener('submit',event=>{event.preventDefault();check()});
 form.addEventListener('input',clearErrors);form.addEventListener('change',clearErrors);
 dialog.querySelector('[data-check-application]').addEventListener('click',check);
 dialog.querySelector('[data-edit-application]').addEventListener('click',showForm);
 dialog.querySelectorAll('[data-return-collection]').forEach(button=>button.addEventListener('click',()=>dialog.close()));
 dialog.addEventListener('close',()=>{
  form.reset();clearErrors();form.hidden=false;review.hidden=true;
  review.querySelectorAll('[data-summary]').forEach(e=>{e.textContent=''});
 });
})();
</script>'''
css='''
/* V4.7: functional review visibility and safe wrapping of user input. */
#start .application[hidden]{display:none}
#start .application dl{margin:0}
#start .application dt{font-weight:bold;margin-top:12px}
#start .application dd{margin:4px 0 0;white-space:pre-wrap;overflow-wrap:anywhere}
'''
for key,html in pages.items():
 old=re.search(r'<dialog id="start".*?</dialog>',html,re.S)[0]
 new=re.sub(r'(<h2 id="application-title">.*?</h2>).*?(?=<form class="application")',r'\1\n<p>Je aanvraag is vrijblijvend. Je betaalt pas nadat je het boekvoorstel en de definitieve prijs hebt goedgekeurd.</p>\n<p id="application-privacy">Er worden geen gegevens verzonden of opgeslagen. Bij sluiten worden je gegevens gewist.</p>\n',old,flags=re.S)
 maximum=180 if key=='classic' else 300
 new=new.replace('min="1" step="1" required inputmode="numeric"',f'min="1" max="{maximum}" step="1" required inputmode="numeric" aria-describedby="photo-limit-error"')
 new=new.replace('</label>\n<label for="application-comments">','</label>\n<p id="photo-limit-error" role="alert" hidden></p>\n<label for="application-comments">')
 new=re.sub(r'<p class="application-status".*?</p>','',new,flags=re.S)
 pairs=''.join(f'<dt>{label}</dt><dd data-summary="{field}"></dd>' for field,label in [('customerName','Naam'),('email','E-mailadres'),('collection','Gewenste collectie'),('bookFormat','Gewenst boekformaat'),('photoCount',"Geschat aantal foto's"),('comments','Wensen of opmerkingen')])
 new=new.replace('</form></dialog>',f'''</form><section id="application-review" class="application" aria-labelledby="review-title" tabindex="-1" hidden><h3 id="review-title">Overzicht aanvraag</h3><dl>{pairs}</dl><p class="application-status" role="status">Je aanvraag is gecontroleerd, maar nog niet verzonden. Er zijn geen gegevens opgeslagen.</p><button type="button" data-edit-application>Gegevens corrigeren</button><button type="button" data-return-collection>Terug naar collectie</button></section></dialog>''')
 html=html.replace(old,new).replace('</style>',css+'</style>',1)
 html,n=re.subn(r'<script>\n// Local validation only.*?</script>',lambda _:script,html,flags=re.S);assert n==1
 pages[key]=html
s=s[:m.start(1)]+json.dumps(pages,ensure_ascii=False).replace('</','<\\/')+s[m.end(1):]
(root/'OXXAlbums_Android_V4_7.html').write_text(s)
print('Built V4.7 from the published V4.6 source.')
