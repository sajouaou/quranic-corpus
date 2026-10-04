// Reads the data files of the API project (https://github.com/kaisdukes/quranic-corpus-api).
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export const sourceUrl = 'https://github.com/kaisdukes/quranic-corpus-api';

export const getApiPath = scriptName => {
    const apiPath = process.argv[2];
    if (!apiPath) {
        console.error(`Usage: node scripts/${scriptName} <path to a quranic-corpus-api checkout>`);
        process.exit(1);
    }
    return apiPath;
}

export const readLines = (apiPath, name) =>
    readFileSync(join(apiPath, 'src/main/resources/data', name), 'utf8').split('\n')

// Pause marks stand alone in the Tanzil text and are not words.
const pauseMark = /^[ۖ-ۜ۞۩]+$/;

// Returns the number of words in each verse, in order.
export const readVerses = apiPath => {
    const verses = [];
    let chapterNumber = 0;
    for (const line of readLines(apiPath, 'quran-uthmani.xml')) {
        if (/<sura index="\d+"/.test(line)) {
            chapterNumber++;
            continue;
        }
        const verse = line.match(/<aya index="(\d+)" text="([^"]*)"/);
        if (!verse) continue;
        const verseNumber = Number(verse[1]);
        let words = verse[2].split(' ').filter(word => word && !pauseMark.test(word)).length;
        // The corpus treats two written words of verse 37:130 as one.
        if (chapterNumber === 37 && verseNumber === 130) words--;
        verses.push({ chapterNumber, verseNumber, words });
    }
    return verses;
}

// Returns one line of morphological features per word, in order.
export const readMorphology = apiPath => readLines(apiPath, 'morphology.txt').filter(line => line.trim())

export const getSource = apiPath => {
    const git = (...args) => execFileSync('git', ['-C', apiPath, ...args], { encoding: 'utf8' }).trim();
    return {
        source: sourceUrl,
        commit: git('rev-parse', 'HEAD'),
        date: git('log', '-1', '--format=%cs')
    };
}
