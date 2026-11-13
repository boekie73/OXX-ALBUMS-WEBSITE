"""Verify that each embedded mobile image is an exact decoded-source crop."""
from pathlib import Path
from PIL import Image
import re,base64,io,json,hashlib
root=Path(__file__).resolve().parents[2]
original=(root/'OXXAlbums_Android_V4_2_1.html').read_text()
version=(root/'OXXAlbums_Android_V4_3.html').read_text()
source=Image.open(io.BytesIO(base64.b64decode(re.search(r'src="data:image/[^;]+;base64,([^"\s]+)',original)[1]))).convert('RGB')
images=re.findall(r'src="data:image/png;base64,([^"\s]+)',version)
manifest=json.loads((root/'review/v4.3/crops.json').read_text())
assert len(images)==len(manifest)+1 # five crops plus the unchanged original master
for (name,entry),encoded in zip(manifest.items(),images):
 actual=Image.open(io.BytesIO(base64.b64decode(encoded))).convert('RGB')
 assert actual.size==tuple(entry['size']),name
 assert actual.tobytes()==source.crop(entry['box']).tobytes(),name
 assert hashlib.sha256(actual.tobytes()).hexdigest()==entry['decodedPixelSHA256'],name
 print('PASS exact source pixels:',name)
