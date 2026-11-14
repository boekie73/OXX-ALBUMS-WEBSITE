from pathlib import Path
import json,re
root=Path(__file__).resolve().parents[2]
a=(root/'OXXAlbums_Android_V4_4.html').read_text();b=(root/'OXXAlbums_Android_V4_6.html').read_text()
pattern=r'const pages=(.*?);function openPage'
pa=json.loads(re.search(pattern,a,re.S)[1]);pb=json.loads(re.search(pattern,b,re.S)[1])
def scrub(s):return re.sub(r'<dialog id="start".*?</dialog>','[APPLICATION DIALOG]',s,flags=re.S)
for name in pa:
 cleaned=re.sub(r'\n/\* V4.6: application controls.*?(?=</style>)','',pb[name],flags=re.S)
 cleaned=re.sub(r'<script>\n// Local validation only.*?</script>','',cleaned,flags=re.S)
 assert scrub(pa[name])==scrub(cleaned),name
 oldterms=re.search(r'<dialog id="start">.*?(<p class="muted">.*?</p>)',pa[name],re.S)[1]
 assert oldterms in pb[name]
assert re.sub(pattern,'[PAGES]',a,flags=re.S)==re.sub(pattern,'[PAGES]',b,flags=re.S)
assert re.findall(r'data:image/[^\s"\'\\]+',a)==re.findall(r'data:image/[^\s"\'\\]+',b)
print('PASS original images, outer page, non-application content, prices and conditions unchanged')
