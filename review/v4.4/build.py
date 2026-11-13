from pathlib import Path
import json,re
root=Path(__file__).resolve().parents[2]
s=(root/'OXXAlbums_Android_V4_3.html').read_text()
account='Mijn OXX — Onze beveiligde klantomgeving is momenteel in ontwikkeling. Binnenkort kun je hier jouw fotoboekproject bekijken en volgen.'
premium='Premium is nog in ontwikkeling en niet bestelbaar.'
# Change only account dialog text; preserve close buttons and all other content.
def update_dialog(match):
 opening,body,closing=match.groups()
 button=re.search(r'<button\b.*?</button>',body,re.S)[0]
 return opening+button+'<p>'+account+'</p>'+closing
s,n=re.subn(r'(<dialog id="accountInfo">)(.*?)(</dialog>)',update_dialog,s,flags=re.S);assert n==1
match=re.search(r'const pages=(.*?);function openPage',s,re.S)
pages=json.loads(match[1])
for name,html in pages.items():
 pages[name],n=re.subn(r'(<dialog id="account">)(.*?)(</dialog>)',update_dialog,html,flags=re.S);assert n==1
encoded=json.dumps(pages,ensure_ascii=False).replace('</','<\\/')
s=s[:match.start(1)]+encoded+s[match.end(1):]
s,n=re.subn(r'(<dialog id="premiumInfo"><p>).*?(</p>)',lambda m:m[1]+premium+m[2],s,count=1);assert n==1
assert not re.search('Brandlogo|Bull|masterafbeelding',re.sub(r'data:image/[^\s\"\'\\]+','',s),re.I)
(root/'OXXAlbums_Android_V4_4.html').write_text(s)
print('Updated Mijn OXX dialogs: navigation, Classic, Essential; shortened Premium notice.')
