"""Sanitize working copies. Never modify the supplied DOCX files."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
from lxml import etree
import re
import sys
from resume_privacy import PHONE as phone

root = Path(__file__).resolve().parents[1]
source = Path(sys.argv[1]) if len(sys.argv) > 1 else Path.home() / 'Downloads'
out = root / '.cache' / 'resumes'
out.mkdir(parents=True, exist_ok=True)
names = {'pt': 'curriculo-hikaru-ogasawara-pt.docx', 'en': 'resume-hikaru-ogasawara-en.docx', 'ja': 'curriculo-hikaru-ogasawara-jp.docx'}
ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
for language, name in names.items():
    removed = 0
    with ZipFile(source / name) as src, ZipFile(out / f'hikaru-{language}.docx', 'w', ZIP_DEFLATED) as dst:
        for item in src.infolist():
            data = src.read(item.filename)
            if item.filename.endswith('.xml') and item.filename.startswith('word/'):
                tree = etree.fromstring(data)
                for paragraph in tree.findall('.//w:p', ns):
                    nodes = paragraph.findall('.//w:t', ns)
                    text = ''.join(node.text or '' for node in nodes)
                    for match in reversed(list(phone.finditer(text))):
                        start, end = match.span()
                        # Remove one adjacent separator along with the phone.
                        after = re.match(r'[\s\u3000]*\|[\s\u3000]*', text[end:])
                        if after: end += len(after.group())
                        offset = 0
                        for node in nodes:
                            value = node.text or ''
                            a, b = max(0, start-offset), min(len(value), end-offset)
                            if a < b: node.text = value[:a] + value[b:]
                            offset += len(value)
                        removed += 1
                    if language == 'ja' and item.filename == 'word/document.xml':
                        # Japanese font metrics otherwise push a few skill lines onto a near-empty page.
                        sizes = [int(s.get('{'+ns['w']+'}val')) for s in paragraph.findall('.//w:sz', ns)]
                        if sizes:
                            properties = paragraph.find('w:pPr', ns)
                            if properties is None:
                                properties = etree.Element('{'+ns['w']+'}pPr'); paragraph.insert(0, properties)
                            spacing = properties.find('w:spacing', ns)
                            if spacing is None: spacing = etree.SubElement(properties, '{'+ns['w']+'}spacing')
                            spacing.set('{'+ns['w']+'}line', str(round(max(sizes) * 12)))
                            spacing.set('{'+ns['w']+'}lineRule', 'exact')
                data = etree.tostring(tree, xml_declaration=True, encoding='UTF-8', standalone=True)
            elif item.filename.endswith('.rels'):
                tree = etree.fromstring(data)
                for rel in list(tree):
                    if phone.search(rel.get('Target', '')) or rel.get('Target', '').startswith('tel:'):
                        tree.remove(rel)
                data = etree.tostring(tree, xml_declaration=True, encoding='UTF-8', standalone=True)
            dst.writestr(item, data)
    if removed != 1:
        raise RuntimeError(f'{language}: expected one phone removal, got {removed}')
    with ZipFile(out / f'hikaru-{language}.docx') as check:
        for name in check.namelist():
            if name.endswith(('.xml', '.rels')) and phone.search(check.read(name).decode('utf-8')):
                raise RuntimeError(f'Phone remains in {language}/{name}')
    print(f'{language}: sanitized working copy, source preserved')
