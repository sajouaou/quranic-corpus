"""Cross-validates the verse chunker against how the verified treebank divides verses.

Usage: python evaluate_chunker.py <quranic-corpus-api data folder>
"""
import sys
from pathlib import Path
from chunker import Corpus, train, chunk_verse, verse_ranges

data = Path(sys.argv[1])
corpus = Corpus(data)
corpus.load_syntax(data)
labels = corpus.treebank_chunk_ends()
verses = list(verse_ranges(corpus, sorted(labels)).values())
# keep only verses fully covered by the treebank
verses = [v for v in verses if corpus.verse_start[v[0]] and corpus.verse_end[v[-1]] and len(v) == v[-1] - v[0] + 1]
print('covered verses', len(verses), 'tokens', sum(map(len, verses)))

tp = fp = fn = exact = total = 0
for fold in range(5):
    train_verses = [v for k, v in enumerate(verses) if k % 5 != fold]
    test_verses = [v for k, v in enumerate(verses) if k % 5 == fold]
    model = train(corpus, labels, train_verses)
    for verse in test_verses:
        expected = {i for i in verse if labels[i] and not corpus.verse_end[i]}
        output = {i for i in chunk_verse(corpus, model, verse) if not corpus.verse_end[i]}
        tp += len(expected & output); fp += len(output - expected); fn += len(expected - output)
        exact += expected == output; total += 1
    print(f'fold {fold} done', flush=True)
p, r = tp / (tp + fp), tp / (tp + fn)
print(f'boundaries inside verses: precision {p:.4f} recall {r:.4f} f1 {2 * p * r / (p + r):.4f}')
print(f'verses divided exactly as in the treebank: {exact}/{total} = {exact / total:.4f}')
