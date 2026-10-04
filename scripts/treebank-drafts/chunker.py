"""Divides verses into graph-sized chunks, learning from how the verified treebank divides them.

Features come from the corpus data files only: pause marks, the word groups of the reference
grammar (irab.tsv), punctuation in the word-by-word translation, and morphological tags.
"""
import re
from pathlib import Path

import numpy as np
from sklearn.ensemble import GradientBoostingClassifier

PAUSE_ONLY = re.compile(r'^[ۖ-ۜ۞۩]+$')
MAX_CHUNK = 12
PUNCTUATION = '.,;:?!-"'


class Corpus:
    """Token-level features for the whole Quran, in order."""

    def __init__(self, data: Path):
        lines = lambda name: (data / name).read_text(encoding='utf8').split('\n')
        self.tokens = []  # (chapter, verse, token)
        chapter = 0
        for line in lines('quran-uthmani.xml'):
            if re.search(r'<sura index="\d+"', line):
                chapter += 1
                continue
            m = re.search(r'<aya index="(\d+)" text="([^"]*)"', line)
            if not m:
                continue
            verse = int(m.group(1))
            n = len([w for w in m.group(2).split(' ') if w and not PAUSE_ONLY.match(w)])
            if chapter == 37 and verse == 130:
                n -= 1
            self.tokens += [(chapter, verse, t + 1) for t in range(n)]
        n = len(self.tokens)
        self.index = {location: i for i, location in enumerate(self.tokens)}

        self.morphology = [l for l in lines('morphology.txt') if l.strip()]
        self.translation = lines('translation/word-by-word.txt')[:n]
        assert len(self.morphology) == n

        self.pause = [0] * n
        for line in lines('pause-marks.tsv'):
            if line.strip():
                seq, mark = line.split('\t')
                self.pause[int(seq) - 1] = int(mark)

        self.irab_end = [0] * n
        i = 0
        for line in lines('irab.tsv'):
            if line.strip():
                i += int(line.split('\t')[0])
                self.irab_end[i - 1] = 1
        assert i == n

        self.verse_end = [int(i + 1 == n or self.tokens[i + 1][:2] != self.tokens[i][:2]) for i in range(n)]
        self.verse_start = [int(i == 0 or self.tokens[i - 1][:2] != self.tokens[i][:2]) for i in range(n)]

    def treebank_chunk_ends(self):
        """Returns {token index: 1 if a verified graph ends at this token else 0} for covered tokens."""
        labels = {}
        last = None
        for line in self._syntax.split('\n'):
            line = line.strip()
            m = re.search(r'= word\((\d+):(\d+):(\d+)\)', line)
            if m:
                last = self.index[tuple(map(int, m.groups()))]
                labels[last] = 0
            elif line == 'go' and last is not None:
                labels[last] = 1
                last = None
        return labels

    def load_syntax(self, data: Path):
        self._syntax = (data / 'syntax.txt').read_text(encoding='utf8')


POS = ['N', 'PN', 'V', 'ADJ', 'PRON', 'DEM', 'REL', 'P', 'CONJ', 'COND', 'NEG', 'T', 'LOC', 'ACC', 'SUB', 'INTG', 'VOC', 'EXP', 'RES', 'CERT']
PREFIX = ['w:CONJ+', 'f:CONJ+', 'w:REM+', 'f:REM+', 'f:RSLT+', 'w:CIRC+', 'A:INTG+', 'ya+', 'l:P+', 'bi+']


def token_features(corpus: Corpus, i: int, since_boundary: int):
    n = len(corpus.tokens)
    morphology = corpus.morphology[i]
    following = corpus.morphology[i + 1] if i + 1 < n and not corpus.verse_end[i] else ''
    translation = corpus.translation[i].strip()
    last_char = translation[-1] if translation else ''

    # position in the verse
    start = i
    while not corpus.verse_start[start]:
        start -= 1
    end = i
    while not corpus.verse_end[end]:
        end += 1

    # distance to the next reference grammar group end
    to_irab = 0
    while i + to_irab < end and not corpus.irab_end[i + to_irab]:
        to_irab += 1

    stem = re.search(r'POS:(\w+)', morphology)
    next_stem = re.search(r'POS:(\w+)', following)
    features = [
        corpus.irab_end[i],
        *[int(corpus.pause[i] == k) for k in range(1, 7)],
        *[int(last_char == c) for c in PUNCTUATION],
        since_boundary,
        i - start,
        end - i,
        end - start + 1,
        to_irab,
        *[int(bool(stem) and stem.group(1) == p) for p in POS],
        *[int(bool(next_stem) and next_stem.group(1) == p) for p in POS],
        *[int(p in following.split(' ')) for p in PREFIX],
        int('PRON:' in morphology),
    ]
    return features


def verse_ranges(corpus: Corpus, indices):
    """Groups a sorted list of token indices into verses."""
    verses = {}
    for i in indices:
        verses.setdefault(corpus.tokens[i][:2], []).append(i)
    return verses


def training_set(corpus: Corpus, labels, verses):
    X, y = [], []
    for verse in verses:
        since = 1
        for i in verse:
            if corpus.verse_end[i]:
                continue  # forced boundary
            X.append(token_features(corpus, i, since))
            y.append(labels[i])
            since = 1 if labels[i] else since + 1
    return np.array(X), np.array(y)


def train(corpus: Corpus, labels, verses):
    X, y = training_set(corpus, labels, verses)
    model = GradientBoostingClassifier(n_estimators=300, max_depth=4, learning_rate=0.08, random_state=0)
    model.fit(X, y)
    return model


def chunk_verse(corpus: Corpus, model, verse):
    """Returns the token indices at which a chunk ends."""
    ends = []
    since = 1
    window = []  # (probability, index) since the last boundary
    for i in verse:
        if corpus.verse_end[i]:
            ends.append(i)
            break
        p = model.predict_proba(np.array([token_features(corpus, i, since)]))[0][1]
        window.append((p, i))
        if p >= 0.5:
            ends.append(i)
            since, window = 1, []
        elif since >= MAX_CHUNK:
            # too long for one graph: split at the most likely point
            _, best = max(window)
            ends.append(best)
            window = [(q, j) for q, j in window if j > best]
            since = len(window) + 1
        else:
            since += 1
    return ends
