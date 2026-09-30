from pathlib import Path
from pypdf import PdfReader
import subprocess
from resume_privacy import has_phone

root = Path(__file__).resolve().parents[1]
out = root / '.cache' / 'resumes'
out.mkdir(parents=True, exist_ok=True)
for language in ['pt', 'en', 'ja']:
    path = root / 'public' / 'resume' / f'hikaru-{language}.pdf'
    pdf = PdfReader(path)
    if pdf:
        text = '\n'.join(page.extract_text() for page in pdf.pages)
        assert not has_phone(text), f'Phone still present: {language}'
        assert 'hogasawara2311@outlook.com' in text, f'Missing email: {language}'
        assert len(text) > 1500, f'Missing document content: {language}'
        assert len(pdf.pages) == 1, f'Unexpected page count: {language}'
        assert not has_phone(str(pdf.metadata)), f'Phone in metadata: {language}'
        for page in pdf.pages:
            for ref in page.get('/Annots', []):
                uri = str(ref.get_object().get('/A', {}).get('/URI', ''))
                assert not uri.lower().startswith('tel:')
                assert not has_phone(uri), f'Phone in hyperlink: {language}'
        poppler = Path.home() / '.cache/codex-runtimes/codex-primary-runtime/dependencies/native/poppler/Library/bin/pdftoppm.exe'
        subprocess.run([str(poppler), '-r', '105', '-png', str(path), str(out / language)], check=True)
        (out / f'{language}.txt').write_text(text, encoding='utf-8')
        print(f'{language}: {len(pdf.pages)} pages, {len(text)} characters, no phone or tel link')
