// Generates src/progress/annotation-coverage.json from the data files of the API project.
//
// Usage: node scripts/annotation-coverage.mjs <path to a quranic-corpus-api checkout>
//
// Counts, per chapter, the words of the Quran and the words covered by a syntax graph in the
// Quranic Treebank. A word counts as covered when a graph lists it as a word node; this is the
// same rule the API uses in GraphCoverage.java.
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getApiPath, getSource, readLines, readMorphology, readVerses } from './corpus-data.mjs';

const apiPath = getApiPath('annotation-coverage.mjs');

const chapters = [];
for (const { chapterNumber, words } of readVerses(apiPath)) {
    chapters[chapterNumber - 1] ??= { words: 0, verses: 0, treebankWords: 0, treebankVerses: 0 };
    chapters[chapterNumber - 1].words += words;
    chapters[chapterNumber - 1].verses++;
}

const treebankWords = new Set();
const treebankVerses = new Set();
for (const line of readLines(apiPath, 'syntax.txt')) {
    const word = line.match(/= word\((\d+):(\d+):(\d+)\)/);
    if (!word) continue;
    const [, chapterNumber, verseNumber, wordNumber] = word;
    const wordKey = `${chapterNumber}:${verseNumber}:${wordNumber}`;
    if (treebankWords.has(wordKey)) {
        throw new Error(`Word ${wordKey} is in more than one syntax graph.`);
    }
    treebankWords.add(wordKey);
    chapters[chapterNumber - 1].treebankWords++;
    const verseKey = `${chapterNumber}:${verseNumber}`;
    if (!treebankVerses.has(verseKey)) {
        treebankVerses.add(verseKey);
        chapters[chapterNumber - 1].treebankVerses++;
    }
}

const words = chapters.reduce((sum, chapter) => sum + chapter.words, 0);
const morphologyWords = readMorphology(apiPath).length;
if (morphologyWords > words) {
    throw new Error(`Found ${morphologyWords} morphology entries for ${words} words.`);
}
for (const [index, { words, treebankWords }] of chapters.entries()) {
    if (treebankWords > words) {
        throw new Error(`Chapter ${index + 1} has ${treebankWords} treebank words for ${words} words.`);
    }
}

const coverage = { ...getSource(apiPath), morphologyWords, chapters };

const json = JSON.stringify(coverage, null, 2)
    .replace(/\{\s+"words": (\d+),\s+"verses": (\d+),\s+"treebankWords": (\d+),\s+"treebankVerses": (\d+)\s+\}/g,
        '{ "words": $1, "verses": $2, "treebankWords": $3, "treebankVerses": $4 }');

const outputPath = join(dirname(fileURLToPath(import.meta.url)), '../src/progress/annotation-coverage.json');
writeFileSync(outputPath, json + '\n');
console.log(`${words} words, ${morphologyWords} with morphology, ${treebankWords.size} in the treebank.`);
console.log(`Written to ${outputPath}`);
