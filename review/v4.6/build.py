from pathlib import Path
import json,re,subprocess
root=Path(__file__).resolve().parents[2]
s=(root/'OXXAlbums_Android_V4_4.html').read_text()
assert subprocess.check_output(['git','rev-parse','origin/main:preview/v4.4/index.html'],cwd=root)==subprocess.check_output(['git','rev-parse','HEAD:OXXAlbums_Android_V4_4.html'],cwd=root)
m=re.search(r'const pages=(.*?);function openPage',s,re.S);pages=json.loads(m[1])
formats=['Staand — 21 × 28 cm','Staand — 15 × 21 cm','Liggend — 28 × 19 cm','Liggend — 21 × 15 cm','Vierkant — 19 × 19 cm','Vierkant — 15 × 15 cm']
css='''
/* V4.6: application controls inside the existing Start dialog only. */
#start .application{display:grid;gap:16px;margin-top:20px}
#start .application label{display:grid;gap:6px;font-size:16px;line-height:1.5}
#start .application input,#start .application select,#start .application textarea{box-sizing:border-box;width:100%;min-width:0;min-height:44px;border:1px solid #b69a62;border-radius:6px;padding:10px;background:#061624;color:#f3ede3;font:16px/1.5 Arial,sans-serif}
#start .application input[readonly]{color:#e5c68a}
#start .application textarea{min-height:100px;resize:vertical}
#start .application button{min-height:44px;border:1px solid #b69a62;border-radius:24px;padding:10px 16px;background:#102b3c;color:#f3ede3;font:16px/1.4 Arial,sans-serif;cursor:pointer;touch-action:manipulation}
#start .application :focus-visible{outline:2px solid #ffe1a0;outline-offset:2px}
#start .application-status{padding:12px;border:1px solid #b69a62;line-height:1.6}
'''
script='''<script>
// Local validation only. No transmission or application storage.
(()=>{
 const dialog=document.getElementById('start');
 const form=dialog.querySelector('form');
 const status=dialog.querySelector('[role="status"]');
 const name=form.elements.namedItem('customerName');
 function clearStatus(){status.hidden=true;status.textContent=''}
 function check(){
  name.setCustomValidity(name.value.trim()?'':'Vul je naam in.');
  if(!form.reportValidity()){clearStatus();return}
  status.textContent='De velden zijn gecontroleerd. Je aanvraag is niet verzonden en niet opgeslagen. Verzenden is nog niet beschikbaar.';
  status.hidden=false;
  status.scrollIntoView({block:'nearest'});
 }
 form.addEventListener('submit',event=>{event.preventDefault();check()});
 form.addEventListener('input',()=>{name.setCustomValidity('');clearStatus()});
 form.addEventListener('change',clearStatus);
 dialog.querySelector('[data-check-application]').addEventListener('click',check);
 dialog.querySelector('[data-return-collection]').addEventListener('click',()=>dialog.close());
 dialog.addEventListener('close',()=>{form.reset();name.setCustomValidity('');clearStatus()});
})();
</script>'''
for key,html in pages.items():
 name=key.title()
 old=re.search(r'<dialog id="start">.*?</dialog>',html,re.S)[0]
 terms=re.search(r'<p class="muted">.*?</p>',old,re.S)[0]
 options='<option value="">Kies een boekformaat</option>'+''.join(f'<option value="{i}">{i}</option>' for i in formats)
 new=f'''<dialog id="start" aria-labelledby="application-title"><button type="button" aria-label="Sluiten" class="close">×</button><h2 id="application-title">Start vrijblijvend met {name}</h2>
<p>Deze aanvraag is vrijblijvend en vormt nog geen bestelling of betalingsverplichting.</p>{terms}
<p id="application-privacy">In deze testversie kun je de velden invullen en controleren. Er worden geen gegevens verzonden of door deze website opgeslagen. Bij sluiten worden de ingevulde gegevens gewist.</p>
<form class="application" autocomplete="off" aria-describedby="application-privacy" onsubmit="return false">
<label for="application-name">Naam (verplicht)<input id="application-name" name="customerName" type="text" required maxlength="120"></label>
<label for="application-email">E-mailadres (verplicht)<input id="application-email" name="email" type="email" required maxlength="254" inputmode="email" autocapitalize="none" spellcheck="false"></label>
<label for="application-collection">Gewenste collectie<input id="application-collection" name="collection" value="{name}" readonly></label>
<label for="application-format">Gewenst boekformaat (verplicht)<select id="application-format" name="bookFormat" required>{options}</select></label>
<label for="application-photos">Geschat aantal foto's (verplicht)<input id="application-photos" name="photoCount" type="number" min="1" step="1" required inputmode="numeric"></label>
<label for="application-comments">Wensen of opmerkingen (optioneel)<textarea id="application-comments" name="comments" maxlength="3000" rows="4"></textarea></label>
<button type="button" data-check-application>Controleer aanvraag</button>
<p class="application-status" role="status" aria-live="polite" hidden></p>
<button type="button" data-return-collection>Terug naar collectie</button>
</form></dialog>'''
 html=html.replace(old,new).replace('</style>',css+'</style>',1)
 pages[key]=html.replace('</body>',script+'</body>',1)
s=s[:m.start(1)]+json.dumps(pages,ensure_ascii=False).replace('</','<\\/')+s[m.end(1):]
(root/'OXXAlbums_Android_V4_6.html').write_text(s)
print('Built V4.6; only Start dialogs and scoped form CSS/scripts added.')
