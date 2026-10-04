import { describe, expect, it } from 'vitest';
import { DraftGraph, getDraftVerseNumber, readDraftGraphs } from './draft-graph-reader';
import drafts from './treebank-drafts.json';
import coverage from '../../progress/annotation-coverage.json';

const sample = `-- words
n1 = V(*)
n2, n3 = word(1:1:1)
n4 = word(1:1:2)

-- phrases
n5 = PP(n2 - n3)

-- edges
gen(n3 - n2)
link(n5 - n1)
poss(n4 - n3)

go

-- words
n1 = word(1:2:1)
n2 = PRON(هُوَ)

-- edges
subj(n2 - n1)

go
`;

describe('draft graph reader', () => {

    it('reads words, phrases and edges', () => {
        const graphs = readDraftGraphs(sample);
        expect(graphs).toHaveLength(2);
        expect(graphs[0]).toEqual({
            words: [
                { type: 'elided', elidedPosTag: 'V', elidedText: undefined, startNode: 0, endNode: 0 },
                { type: 'token', location: [1, 1, 1], startNode: 1, endNode: 2 },
                { type: 'token', location: [1, 1, 2], startNode: 3, endNode: 3 }
            ],
            phraseNodes: [{ startNode: 1, endNode: 2, phraseTag: 'PP' }],
            edges: [
                { startNode: 2, endNode: 1, dependencyTag: 'gen' },
                { startNode: 4, endNode: 0, dependencyTag: 'link' },
                { startNode: 3, endNode: 2, dependencyTag: 'poss' }
            ]
        });
        expect(graphs[1].words[1]).toEqual(
            { type: 'elided', elidedPosTag: 'PRON', elidedText: 'هُوَ', startNode: 1, endNode: 1 });
        expect(graphs[1].phraseNodes).toEqual([]);
    });

    it('finds the verse of a graph', () => {
        const graphs = readDraftGraphs(sample);
        expect(getDraftVerseNumber(graphs[0])).toBe(1);
        expect(getDraftVerseNumber(graphs[1])).toBe(2);
    });

    it('rejects a malformed line', () => {
        expect(() => readDraftGraphs('-- words\nn1 word(1:1:1)\n\ngo\n')).toThrow('Invalid draft graph line');
    });

    it('rejects nodes that are not numbered in order', () => {
        const words = '-- words\nn1 = word(1:1:1)\nn2 = word(1:1:2)\n\n';
        expect(() => readDraftGraphs('-- words\nn2 = word(1:1:1)\n\ngo\n')).toThrow('Invalid draft graph line');
        expect(() => readDraftGraphs(`${words}-- phrases\nn2 = PP(n1 - n2)\n\ngo\n`)).toThrow('Invalid draft graph line');
        expect(readDraftGraphs(`${words}-- phrases\nn3 = PP(n1 - n2)\n\ngo\n`)).toHaveLength(1);
    });
});

const dependencyTags = new Set([
    'adj', 'amd', 'ans', 'app', 'avr', 'caus', 'cert', 'circ', 'cog', 'com', 'cond', 'conj', 'cpnd', 'emph', 'eq',
    'exh', 'exl', 'exp', 'fut', 'gen', 'impv', 'imrs', 'inc', 'int', 'intg', 'link', 'neg', 'obj', 'pass', 'poss',
    'pred', 'predx', 'prev', 'pro', 'prp', 'res', 'ret', 'rslt', 'spec', 'sub', 'subj', 'subjx', 'sup', 'sur', 'voc'
]);

const phraseTags = new Set(['S', 'NS', 'VS', 'CS', 'PP', 'SC']);

// The draft files shipped in public/treebank-drafts, keyed by path.
const draftFiles = import.meta.glob<string>(
    '../../../public/treebank-drafts/*.txt',
    { query: '?raw', import: 'default', eager: true });

const readChapter = (chapterNumber: number): DraftGraph[] => {
    const file = `../../../public/treebank-drafts/${String(chapterNumber).padStart(3, '0')}.txt`;
    return readDraftGraphs(draftFiles[file]);
}

describe('treebank draft files', () => {

    it('has one file for each chapter in the list of drafts', () => {
        expect(Object.keys(draftFiles)).toHaveLength(drafts.chapters.length);
    });

    it.each(drafts.chapters)('chapter $chapterNumber is well formed', chapter => {
        const { chapterNumber, firstVerse, lastVerse, lastVerseGraphs, verses, words, graphs: graphCount } = chapter;
        const graphs = readChapter(chapterNumber);
        expect(graphs).toHaveLength(graphCount);

        const seenVerses = new Set<number>();
        let wordCount = 0;
        let previous = [chapterNumber, firstVerse, 0];

        for (const graph of graphs) {
            const verseNumber = getDraftVerseNumber(graph);
            seenVerses.add(verseNumber);

            // nodes are numbered in order, without gaps
            let node = 0;
            for (const word of graph.words) {
                expect(word.startNode).toBe(node);
                expect(word.endNode).toBeGreaterThanOrEqual(word.startNode);
                node = word.endNode + 1;

                // every word once, in order, within one verse per graph
                if (word.location) {
                    expect(word.type).toBe('token');
                    const [c, v, t] = word.location;
                    expect(c).toBe(chapterNumber);
                    expect(v).toBe(verseNumber);
                    expect(v > previous[1] ? t : t - previous[2]).toBe(1);
                    expect(v - previous[1]).toBeLessThanOrEqual(1);
                    previous = word.location;
                    wordCount++;
                }
            }

            const nodeCount = node + graph.phraseNodes.length;
            for (const { startNode, endNode, phraseTag } of graph.phraseNodes) {
                expect(phraseTags.has(phraseTag)).toBe(true);
                expect(startNode).toBeLessThan(nodeCount);
                expect(endNode).toBeLessThan(nodeCount);
            }
            for (const { startNode, endNode, dependencyTag } of graph.edges) {
                expect(dependencyTags.has(dependencyTag)).toBe(true);
                expect(startNode).toBeLessThan(nodeCount);
                expect(endNode).toBeLessThan(nodeCount);
                expect(startNode).not.toBe(endNode);
            }
        }

        expect(wordCount).toBe(words);
        expect(seenVerses.size).toBe(verses);
        expect(Math.min(...seenVerses)).toBe(firstVerse);
        expect(Math.max(...seenVerses)).toBe(lastVerse);
        expect(graphs.filter(graph => getDraftVerseNumber(graph) === lastVerse)).toHaveLength(lastVerseGraphs);
    });

    it('covers exactly the words that the verified treebank does not', () => {
        const draftWords = new Map(drafts.chapters.map(chapter => [chapter.chapterNumber, chapter.words]));
        for (const [i, { words, treebankWords }] of coverage.chapters.entries()) {
            expect(draftWords.get(i + 1) ?? 0).toBe(words - treebankWords);
        }
    });
});
