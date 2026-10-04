import { Edge } from './edge';
import { PhraseNode } from './phrase-node';
import { DependencyTag } from './dependency-tag';
import { PhraseTag } from './phrase-tag';
import { PosTag } from '../morphology/pos-tag';
import { Location, parseLocation } from '../orthography/location';
import { WordType } from './word';
import { CorpusError } from '../../errors/corpus-error';

export type DraftWord = {
    type: WordType,
    location?: Location,
    elidedText?: string,
    elidedPosTag?: PosTag,
    startNode: number,
    endNode: number
}

export type DraftGraph = {
    words: DraftWord[],
    phraseNodes: PhraseNode[],
    edges: Edge[]
}

type Section = 'words' | 'phrases' | 'edges';

const nodeIndex = (node: string) => Number(node.trim().substring(1)) - 1

const fail = (line: string): never => {
    throw new CorpusError('SERVICE_ERROR', `Invalid draft graph line: ${line}`);
}

// Reads draft graphs in the text format of the Quranic Treebank, for example:
//
//     -- words
//     n1 = V(*)
//     n2, n3 = word(1:1:1)
//
//     -- phrases
//     n4 = PP(n2 - n3)
//
//     -- edges
//     gen(n3 - n2)
//     link(n4 - n1)
//
//     go
export const readDraftGraphs = (text: string): DraftGraph[] => {
    const graphs: DraftGraph[] = [];
    let graph: DraftGraph = { words: [], phraseNodes: [], edges: [] };
    let section: Section | undefined;

    // Nodes are numbered in order: the segments of each word, then the phrases.
    let nodeCount = 0;

    for (const rawLine of text.split('\n')) {
        const line = rawLine.trim();
        if (!line) continue;

        if (line === 'go') {
            graphs.push(graph);
            graph = { words: [], phraseNodes: [], edges: [] };
            section = undefined;
            nodeCount = 0;
            continue;
        }

        if (line.startsWith('--')) {
            section = line.substring(2).trim() as Section;
            continue;
        }

        if (section === 'words') {
            const match = line.match(/^(n\d+(?:, n\d+)*) = (\w+)\((.+)\)$/) ?? fail(line);
            const nodes = match[1].split(',').map(nodeIndex);
            const [startNode, endNode] = [nodes[0], nodes[nodes.length - 1]];
            if (nodes.some((node, i) => node !== nodeCount + i)) fail(line);
            nodeCount += nodes.length;
            const [name, value] = [match[2], match[3]];
            if (name === 'word' || name === 'reference') {
                graph.words.push({
                    type: name === 'word' ? 'token' : 'reference',
                    location: parseLocation(value),
                    startNode,
                    endNode
                });
            } else {
                graph.words.push({
                    type: 'elided',
                    elidedPosTag: name as PosTag,
                    elidedText: value === '*' ? undefined : value,
                    startNode,
                    endNode
                });
            }
        } else if (section === 'phrases') {
            const match = line.match(/^(n\d+) = (\w+)\((n\d+) - (n\d+)\)$/) ?? fail(line);
            if (nodeIndex(match[1]) !== nodeCount++) fail(line);
            graph.phraseNodes.push({
                startNode: nodeIndex(match[3]),
                endNode: nodeIndex(match[4]),
                phraseTag: match[2] as PhraseTag
            });
        } else if (section === 'edges') {
            const match = line.match(/^(\w+)\((n\d+) - (n\d+)\)$/) ?? fail(line);
            graph.edges.push({
                startNode: nodeIndex(match[2]),
                endNode: nodeIndex(match[3]),
                dependencyTag: match[1] as DependencyTag
            });
        } else {
            fail(line);
        }
    }

    return graphs;
}

// The verse of a draft graph. Draft graphs never span verses.
export const getDraftVerseNumber = (graph: DraftGraph) => {
    const word = graph.words.find(word => word.location);
    if (!word) {
        throw new CorpusError('SERVICE_ERROR', 'Draft graph has no words.');
    }
    return word.location![1];
}
