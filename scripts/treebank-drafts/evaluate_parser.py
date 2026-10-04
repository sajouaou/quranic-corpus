"""Trains the parser on nine tenths of the verified treebank and measures it on the other tenth.

Run inside a checkout of https://github.com/kaisdukes/quran-svm-parser, with its API client
pointed at a running corpus API.

Usage: python evaluate_parser.py [fold]
"""
import sys, time
from pathlib import Path
sys.path.insert(0, 'tests')
from elas import Elas
from split_treebank import split_treebank
from src.container import Container
from src.parser.parser import Parser
from src.svm.train import train
from src.svm.model import load_model

fold = int(sys.argv[1]) if len(sys.argv) > 1 else 0
container = Container()
graphs = container.syntax_service.graphs
print(f'graphs: {len(graphs)}', flush=True)
train_graphs, test_graphs = split_treebank(container.syntax_service, fold)
folder = Path(f'.model-fold{fold}')
t = time.time()
train(container.lemma_service, train_graphs, folder)
print(f'trained in {time.time() - t:.0f}s', flush=True)
model = load_model(folder)
elas = Elas()
failed = 0
t = time.time()
for expected in test_graphs:
    output = expected.only_tokens()
    try:
        Parser(model, container.lemma_service, output).parse()
    except Exception as e:
        failed += 1
    elas.compare(expected, output)
print(f'parsed {len(test_graphs)} graphs in {time.time() - t:.0f}s, {failed} raised errors')
print(f'precision {elas.precision:.4f} recall {elas.recall:.4f} f1 {elas.f1_score:.4f}')
