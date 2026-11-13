"""Build V4.3 from V4.2.1, using lossless crops of the decoded original home."""
from pathlib import Path
from PIL import Image
import base64,io,json,re,hashlib
root=Path(__file__).resolve().parents[2]
s=(root/'OXXAlbums_Android_V4_2_1.html').read_text()
original=re.search(r'src="data:image/[^;]+;base64,([^"\s]+)',s)[1]
master=Image.open(io.BytesIO(base64.b64decode(original))).convert('RGB')
boxes={'header':[0,0,512,360],'classic':[48,396,411,797],'essential':[422,396,781,797],'premium':[792,396,1155,797],'design':[1167,396,1497,797]}
manifest={}
def crop(name):
 image=master.crop(boxes[name]);data=io.BytesIO();image.save(data,format='PNG');binary=data.getvalue()
 manifest[name]={'box':boxes[name],'size':list(image.size),'decodedPixelSHA256':hashlib.sha256(image.tobytes()).hexdigest()}
 return 'data:image/png;base64,'+base64.b64encode(binary).decode()
header=crop('header')
cards=[]
for name,label,action in [('classic','Ontdek Classic',"openPage('classic')"),('essential','Ontdek Essential',"openPage('essential')"),('premium','Premium — in ontwikkeling',"document.getElementById('premiumInfo').showModal()"),('design','Ontdek OXX Design',None)]:
 image=f'<img alt="{label}" src="{crop(name)}" width="{boxes[name][2]-boxes[name][0]}" height="401">'
 if action: cards.append(f'<button type="button" class="mobile-card" data-collection="{name}" aria-label="{label}" onclick="{action}">{image}</button>')
 else: cards.append(f'<a class="mobile-card" data-collection="{name}" aria-label="{label}" href="https://oxxdesign.nl">{image}</a>')
markup='<main id="mobile-home" aria-label="OXX Albums collecties"><img class="mobile-header" alt="OXX Albums — Luxe fotoalbums op maat. Jij maakt de herinneringen. Wij maken het fotoboek." src="'+header+'" width="512" height="360">'+''.join(cards)+'</main>'
s=s.replace('<div id="home-scroll">',markup+'<div id="home-scroll">',1)
s=s.replace('<button type="button" id="reading"', '''<button type="button" onclick="document.getElementById('premiumInfo').showModal()">Premium</button>
<button type="button" onclick="document.getElementById('accountInfo').showModal()">Mijn OXX</button>
<a href="https://oxxdesign.nl">OXX Design</a>
<button type="button" id="reading"''',1)
# Reuse the existing account information verbatim.
pages=json.loads(re.search(r'const pages=(.*?);function openPage',s,re.S)[1])
account=re.search(r'<dialog id="account">(.*?)</dialog>',pages['classic'],re.S)[1]
account=account.replace('class="close"','class="close" onclick="document.getElementById(\'accountInfo\').close()"')
s=s.replace('<script>const pages=',f'<dialog id="accountInfo">{account}</dialog><script>const pages=',1)
css='''
/* V4.3: exact source crops, stacked only on mobile. */
#mobile-home{display:none}
@media(max-width:700px){
 #home-scroll{display:none!important}
 #mobile-home{display:flex;flex-direction:column;align-items:center;gap:12px;padding:0 0 12px}
 .mobile-header{display:block;width:min(100%,512px);height:auto}
 .mobile-card{display:block;width:min(calc(100% - 24px),430px);margin:0;padding:0;border:0;background:transparent;cursor:pointer;touch-action:manipulation}
 .mobile-card img{display:block;width:100%;height:auto}
 .mobile-card:focus-visible{outline:3px solid #e9d2a5;outline-offset:3px}
 .collection-open #mobile-home{display:none}
 .mobile-tools a{display:flex;align-items:center;flex:0 0 auto;white-space:nowrap;min-height:44px;padding:8px 12px;border:1px solid #c9a66e;border-radius:20px;background:#071a29;color:#f3e9d8;font:14px Arial,sans-serif;text-decoration:none;touch-action:manipulation}
 .mobile-tools #reading,.mobile-tools #overview{display:none}
 .collection-open .mobile-tools #reading,.collection-open .mobile-tools #overview{display:block}
 #accountInfo .close{min-width:44px;min-height:44px;float:right}
}
'''
s=s.replace('</style>',css+'</style>',1)
script='''<script>
// Retain the approved routes; only toggle the extra mobile home.
const openCollectionV421=window.openPage;
window.openPage=function(name){
 document.body.classList.add('collection-open');
 openCollectionV421(name);
};
const homeV421=window.goHome;
window.goHome=function(){
 document.body.classList.remove('collection-open');
 homeV421();
};
// Premium is informational from every mobile entry point.
mobileFrame.addEventListener('load',()=>{
 const doc=mobileFrame.contentDocument;
 if(!doc)return;
 doc.addEventListener('click',event=>{
  if(!mobileQuery.matches||!event.target.closest('a.premium,button.premium'))return;
  event.preventDefault();event.stopImmediatePropagation();
  document.getElementById('premiumInfo').showModal();
 },true);
});
</script>'''
s=s.replace('</body></html>',script+'</body></html>')
(root/'OXXAlbums_Android_V4_3.html').write_text(s)
(root/'review/v4.3/crops.json').write_text(json.dumps(manifest,indent=2)+'\n')
print('Built standalone V4.3 with',len(manifest),'exact crops')
