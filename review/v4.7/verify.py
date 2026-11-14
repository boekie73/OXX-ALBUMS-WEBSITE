from pathlib import Path
import re,json
root=Path(__file__).resolve().parents[2]
a=(root/'OXXAlbums_Android_V4_6.html').read_text();b=(root/'OXXAlbums_Android_V4_7.html').read_text();pattern=r'const pages=(.*?);function openPage'
pa=json.loads(re.search(pattern,a,re.S)[1]);pb=json.loads(re.search(pattern,b,re.S)[1])
def scrub(s):
 s=re.sub(r'<dialog id="start".*?</dialog>','[APPLICATION]',s,flags=re.S)
 s=re.sub(r'<script>\n// (?:Local validation only|V4.7: local validation).*?</script>','[APPLICATION SCRIPT]',s,flags=re.S)
 return re.sub(r'\n/\* V4.7: functional review.*?(?=</style>)','',s,flags=re.S)
for name in pa:
 assert scrub(pa[name])==scrub(pb[name]),name
 oldoptions=re.search(r'<select id="application-format".*?</select>',pa[name],re.S)[0]
 assert oldoptions in pb[name]
assert re.sub(pattern,'[PAGES]',a,flags=re.S)==re.sub(pattern,'[PAGES]',b,flags=re.S)
assert re.findall(r'data:image/[^\s"\'\\]+',a)==re.findall(r'data:image/[^\s"\'\\]+',b)
print('PASS homepage, original images, six formats, navigation, prices, conditions and all other dialogs unchanged')
