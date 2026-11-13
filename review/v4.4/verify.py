from pathlib import Path
import re,json,subprocess
root=Path(__file__).resolve().parents[2]
a=(root/'OXXAlbums_Android_V4_3.html').read_text();b=(root/'OXXAlbums_Android_V4_4.html').read_text()
assert subprocess.check_output(['git','rev-parse','origin/main:preview/v4.3/index.html'],cwd=root)==subprocess.check_output(['git','rev-parse','HEAD:OXXAlbums_Android_V4_3.html'],cwd=root)
pattern=r'const pages=(.*?);function openPage'
def scrub_dialog(s,id):return re.sub(r'(<dialog id="'+id+r'">).*?(</dialog>)',r'\1[UPDATED CUSTOMER TEXT]\2',s,flags=re.S)
pa=json.loads(re.search(pattern,a,re.S)[1]);pb=json.loads(re.search(pattern,b,re.S)[1])
for name in pa:assert scrub_dialog(pa[name],'account')==scrub_dialog(pb[name],'account'),name
# Outside the three account dialogs and one Premium notice, nothing changes.
def scrub_outer(s):
 s=re.sub(pattern,'const pages=[COLLECTION PAGES];function openPage',s,flags=re.S)
 return scrub_dialog(scrub_dialog(s,'accountInfo'),'premiumInfo')
assert scrub_outer(a)==scrub_outer(b)
assert re.findall(r'data:image/[^\s"\'\\]+',a)==re.findall(r'data:image/[^\s"\'\\]+',b)
print('PASS only account dialogs and Premium notice changed; all images, CSS, scripts, prices, conditions and routes unchanged')
