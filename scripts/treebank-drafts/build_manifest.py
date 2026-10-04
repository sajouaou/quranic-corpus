"""Copies generated draft graphs into the web app and lists them in treebank-drafts.json.

Usage: python build_manifest.py <generated drafts folder> <quran-svm-parser checkout> <web app folder>
"""
import json, re, subprocess, sys
from datetime import date
from pathlib import Path

drafts, parser, app = Path(sys.argv[1]), Path(sys.argv[2]), Path(sys.argv[3])
git = lambda *args: subprocess.run(['git', '-C', str(parser), *args], capture_output=True, text=True, check=True).stdout.strip()
stats = json.loads((drafts / 'stats.json').read_text())

target = app / 'public' / 'treebank-drafts'
target.mkdir(parents=True, exist_ok=True)

chapters = []
for file in sorted(drafts.glob('[0-9][0-9][0-9].txt')):
    text = file.read_text(encoding='utf8')
    graphs = [g for g in text.split('\ngo\n') if g.strip()]
    words = re.findall(r'= word\((\d+):(\d+):(\d+)\)', text)
    verses = sorted({int(v) for _, v, _ in words})
    last = verses[-1]
    chapters.append({
        'chapterNumber': int(file.stem),
        'firstVerse': verses[0],
        'lastVerse': last,
        'lastVerseGraphs': sum(1 for g in graphs if re.search(rf'= word\(\d+:{last}:\d+\)', g)),
        'verses': len(verses),
        'words': len(words),
        'graphs': len(graphs),
    })
    (target / file.name).write_text(text, encoding='utf8')

manifest = {
    'generator': 'https://github.com/kaisdukes/quran-svm-parser',
    'generatorCommit': git('rev-parse', 'HEAD'),
    'date': date.today().isoformat(),
    'trainedOnGraphs': stats['verified_graphs'],
    'chapters': chapters,
}
lines = json.dumps(manifest, indent=2, ensure_ascii=False)
lines = re.sub(r'\{\s+"chapterNumber": (\d+),\s+"firstVerse": (\d+),\s+"lastVerse": (\d+),\s+"lastVerseGraphs": (\d+),\s+"verses": (\d+),\s+"words": (\d+),\s+"graphs": (\d+)\s+\}',
               r'{ "chapterNumber": \1, "firstVerse": \2, "lastVerse": \3, "lastVerseGraphs": \4, "verses": \5, "words": \6, "graphs": \7 }', lines)
(app / 'src' / 'corpus' / 'syntax' / 'treebank-drafts.json').write_text(lines + '\n', encoding='utf8')
print(f"{len(chapters)} chapters, {sum(c['verses'] for c in chapters)} verses, {sum(c['words'] for c in chapters)} words, {sum(c['graphs'] for c in chapters)} graphs")
