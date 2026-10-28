"""Package the public build as a self-contained, offline HTML document."""
from pathlib import Path
import base64
import re
import sys

root = Path(__file__).resolve().parents[1]
hr = '--hr' in sys.argv
build = root / ('hr-dist' if hr else 'website-dist')
html = (build / 'index.html').read_text()
js_name = re.search(r'<script[^>]+src="([^"]+)"', html).group(1)
css_name = re.search(r'<link[^>]+href="([^"]+\.css)"', html).group(1)
css = (build / css_name.lstrip('/')).read_text()

def embed_font(match):
    name = match.group(1)
    path = build / name.lstrip('/')
    mime = 'font/woff2' if path.suffix == '.woff2' else 'font/woff'
    return 'url(data:' + mime + ';base64,' + base64.b64encode(path.read_bytes()).decode() + ')'

css = re.sub(r'url\([\"\']?(/assets/[^)\"\']+)[\"\']?\)', embed_font, css)
js = (build / js_name.lstrip('/')).read_text()
overview = base64.b64encode((build / 'peoplehub-overview.txt').read_bytes()).decode()
js = js.replace('/peoplehub-overview.txt', 'data:text/plain;charset=utf-8;base64,' + overview)
js = re.sub(r'</script', r'<\\/script', js, flags=re.I)
html = re.sub(r'<script[^>]+src="[^"]+"[^>]*></script>', lambda _: '<script type="module">' + js + '</script>', html)
html = re.sub(r'<link[^>]+href="[^"]+\.css"[^>]*>', lambda _: '<style>' + css + '</style>', html)
output = root / ('KISC-PeopleHub-HR.html' if hr else 'KISC-PeopleHub.html')
output.write_text(html)
if hr:
    (root / 'KISC-PeopleHub-Organized-Teams.html').write_text(html)
    (root / 'KISC-PeopleHub-Health-Reports.html').write_text(html)
else:
    (root / 'KISC-PeopleHub-Light-Dark.html').write_text(html)
print('Created', output.name, '(' + str(output.stat().st_size) + ' bytes)')
