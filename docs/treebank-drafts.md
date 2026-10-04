# Treebank Drafts

**TL;DR**: The verified Quranic Treebank covers 42% of the Quran. For the rest, this repository holds draft dependency graphs produced by a parser. They are machine output that nobody has reviewed. The site labels each one as an AI-generated draft and counts them separately from the verified treebank.

### What the Drafts Cover

The verified treebank, served by the API, has dependency graphs for chapters 1 to 8, the first 91 verses of chapter 9, and chapters 59 to 114.

The drafts cover everything else: verses 92 to 129 of chapter 9 and all of chapters 10 to 58. That is 3,800 verses and 44,812 words, in 9,787 graphs.

### How They Were Generated

No analysis was written by hand or by a large language model. Both steps learn only from the verified treebank and the other corpus data files.

1. **Dividing verses.** The treebank splits long verses into several short graphs. A classifier (`scripts/treebank-drafts/chunker.py`) learns where the verified treebank places these divisions, using pause marks, the word groups of the reference grammar *al-I’rāb al-Mufassal*, punctuation in the word-by-word translation, and part-of-speech tags.

2. **Parsing.** Each piece is parsed by the project's own SVM parser, [quran-svm-parser](https://github.com/kaisdukes/quran-svm-parser), the Python version of the parser from Dukes & Habash (2011). It was trained on all 7,373 verified graphs.

### Measured Accuracy

| Step | Test | Result |
| --- | --- | --- |
| Parser | Trained on nine tenths of the verified treebank, tested on the other tenth, with verses divided as in the treebank | Precision 89.3%, recall 85.0%, F1 87.1% on labelled dependencies |
| Verse division | Five-fold cross-validation on the verified treebank | F1 84.0% on divisions inside a verse; 64.4% of verses divided exactly as in the treebank |

The two steps were not measured together, and the drafts cannot be scored because no verified analysis exists for these verses. Expect the drafts to be less accurate than the parser figure above: at best about one dependency in eight is wrong.

### Known Limitations

* **No links between graphs.** The verified treebank uses reference nodes to connect a graph to words in a neighbouring graph. The drafts have none, so a dependency that crosses a division is missing.
* **One verse at a time.** A draft graph never spans two verses. About 5% of verse ends in the verified treebank fall inside a graph.
* **Incomplete graphs.** On 5 graphs the parser gave up after 250 steps and the graph holds a partial analysis: the graphs ending at words 9:116:17, 14:8:9, 23:28:7, 42:31:14 and 42:44:9. In all, 28 graphs with more than one word have no dependencies at all.
* **A numbering fault in the parser was corrected.** The parser numbers a phrase node when it creates it and does not renumber it when it later inserts an elided word, which makes its output refer to the wrong nodes. `generate_drafts.py` renumbers phrase nodes before writing. This changes no analysis, only the node numbers.

### Where They Live

* `public/treebank-drafts/NNN.txt`: one file per chapter, in the text format of the treebank (`-- words`, `-- phrases`, `-- edges`, `go`).
* `src/corpus/syntax/treebank-drafts.json`: the list of chapters with drafts, the parser version, and the date.

The site asks the API for a verified graph first and falls back to a draft only when there is none. A draft is shown with the notice *AI-generated draft, not reviewed*. On the home page the drafts have their own progress bar and colour; they never count towards the verified treebank figure.

The unit tests check every draft file: nodes are numbered in order, every dependency refers to a node in its graph, every tag is a known tag, and the drafts cover exactly the words the verified treebank does not.

### Reviewing a Draft

A draft becomes part of the treebank only when a linguist has checked it against the reference grammar shown beside each diagram. The verified treebank is the `syntax.txt` file of the [API project](https://github.com/kaisdukes/quranic-corpus-api), which uses the same format, so a corrected graph can be proposed there. Once the API serves a verified graph for a verse, the site stops showing the draft for it.

### Before Publishing

The parser's README asks users to *avoid distributing draft data* and to rely on the official APIs, because linguistic analysis of the Quran needs expert review. The `NOTICE` file carries the terms of use of the corpus annotation. Read both before deploying or redistributing these files outside a review setting.

### Regenerating

The steps need a running corpus API, a checkout of the API project for its data files, and a checkout of quran-svm-parser with its API client pointed at the running API.

```bash
# inside the quran-svm-parser checkout, with scripts/treebank-drafts copied alongside
python evaluate_parser.py 0
python evaluate_chunker.py <api checkout>/src/main/resources/data
python generate_drafts.py <api checkout>/src/main/resources/data <folder with chunker.py> <output folder>
python build_manifest.py <output folder> <quran-svm-parser checkout> <this repository>
```
