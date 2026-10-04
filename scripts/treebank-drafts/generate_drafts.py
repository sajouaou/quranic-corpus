"""Generates draft syntax graphs for verses that the verified treebank does not cover.

Run inside a checkout of https://github.com/kaisdukes/quran-svm-parser (the project's SVM
parser), with its API client pointed at a running corpus API.

Usage: python generate_drafts.py <quranic-corpus-api data folder> <chunker folder> <output folder>
"""
import json, sys, time
from pathlib import Path

data, chunker_path, out = Path(sys.argv[1]), Path(sys.argv[2]), Path(sys.argv[3])
sys.path.insert(0, str(chunker_path))
from chunker import Corpus, train as train_chunker, chunk_verse, verse_ranges

from src.container import Container
from src.orthography.location import Location
from src.parser.parser import Parser
from src.svm.train import train
from src.svm.model import load_model
from src.syntax.syntax_graph import SyntaxGraph
from src.syntax.graph_writer import GraphWriter
from src.syntax.word_type import WordType

container = Container()
verified = container.syntax_service.graphs
print(f'verified graphs: {len(verified)}', flush=True)

# parser trained on the whole verified treebank
model_folder = Path('.model-full')
t = time.time()
train(container.lemma_service, verified, model_folder)
model = load_model(model_folder)
print(f'parser trained in {time.time() - t:.0f}s', flush=True)

# chunker trained on the whole verified treebank
corpus = Corpus(data)
corpus.load_syntax(data)
labels = corpus.treebank_chunk_ends()
covered = list(verse_ranges(corpus, sorted(labels)).values())
chunker = train_chunker(corpus, labels, covered)
print('chunker trained', flush=True)

uncovered = verse_ranges(corpus, [i for i in range(len(corpus.tokens)) if i not in labels])

# the container keeps no reference to its morphology service, so build tokens through a new one
from src.morphology.morphology_service import MorphologyService
from src.api.corpus_client import CorpusClient
morphology_service = MorphologyService(CorpusClient(), container.lemma_service)


def renumber_phrases(graph: SyntaxGraph):
    # The parser numbers a phrase node when it creates it, and does not renumber it when it later
    # inserts an elided word. Number the phrase nodes after the segment nodes, as the format requires.
    for i, phrase in enumerate(graph.phrases):
        phrase.index = len(graph.segment_nodes) + i

out.mkdir(parents=True, exist_ok=True)
chapters = {}
stats = dict(verses=0, words=0, graphs=0, parse_errors=[], edges=0)
t = time.time()
for (chapter, verse), indices in uncovered.items():
    assert corpus.verse_start[indices[0]] and corpus.verse_end[indices[-1]], (chapter, verse)
    ends = chunk_verse(corpus, chunker, indices)
    start = indices[0]
    stats['verses'] += 1
    stats['words'] += len(indices)
    for end in ends:
        graph = SyntaxGraph()
        for i in range(start, end + 1):
            c, v, n = corpus.tokens[i]
            graph.add_word(WordType.TOKEN, morphology_service.token(Location(c, v, n)), None, None)
        start = end + 1
        try:
            Parser(model, container.lemma_service, graph).parse()
        except Exception as e:
            # keep the partial analysis, and record where the parser stopped
            c, v, n = corpus.tokens[end]
            stats['parse_errors'].append(f'{c}:{v}:{n} {e}')
        renumber_phrases(graph)
        stats['graphs'] += 1
        stats['edges'] += len(graph.edges)
        chapters.setdefault(chapter, []).append(graph)
    if stats['verses'] % 250 == 0:
        print(f"{stats['verses']} verses, {stats['graphs']} graphs, {time.time() - t:.0f}s", flush=True)

for chapter, graphs in chapters.items():
    with GraphWriter(open(out / f'{chapter:03d}.txt', 'w', encoding='utf8')) as writer:
        writer.write_graphs(graphs)

stats['chapters'] = len(chapters)
stats['verified_graphs'] = len(verified)
(out / 'stats.json').write_text(json.dumps(stats, indent=2))
print(json.dumps(stats))
