// Generates src/search/root-index.json from the data files of the API project.
//
// Usage: node scripts/root-index.mjs <path to a quranic-corpus-api checkout> <path to the API jar>
//
// Lists, for each root, its derived forms and the words annotated with each form in the
// morphological annotation. Roots are keyed in Buckwalter transliteration, as in the data files.
// A derived form is a lemma together with what it is: a verb of a given form, a participle, a
// verbal noun, or another part of speech. A lemma annotated with more than one part of speech,
// such as noun and adjective, is listed once as a nominal. This follows the Quran Dictionary of
// corpus.quran.com. Each occurrence is stored as three numbers: chapter, verse and word.
//
// The API jar provides the corpus's own conversion of lemmas to Arabic script and to phonetic
// transcription (see LemmaText.java), so that both match the rest of the site.
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getApiPath, getSource, readLines, readMorphology, readVerses } from './corpus-data.mjs';

const apiPath = getApiPath('root-index.mjs');
const jarPath = process.argv[3];
if (!jarPath) {
    console.error('Usage: node scripts/root-index.mjs <path to a quranic-corpus-api checkout> <path to the API jar>');
    process.exit(1);
}

const verses = readVerses(apiPath);
const morphology = readMorphology(apiPath);
const words = verses.reduce((sum, verse) => sum + verse.words, 0);
if (morphology.length !== words) {
    throw new Error(`Found ${morphology.length} morphology entries for ${words} words.`);
}

// Names of parts of speech and derivations, as the corpus words them.
const partOfSpeechNames = {
    N: 'noun',
    PN: 'proper noun',
    ADJ: 'adjective',
    V: 'verb',
    T: 'time adverb',
    LOC: 'location adverb',
    INTG: 'interrogative noun',
    REL: 'relative pronoun',
    SUB: 'subordinating conjunction',
    COND: 'conditional noun',
    IMPN: 'imperative verbal noun'
};

const derivations = ['verbal noun', 'active participle', 'passive participle'];
const formOrder = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];

// Lemmas are listed in Arabic alphabetical order, ignoring vowels, as in the Quran Dictionary of
// corpus.quran.com: a hamza counts as the letter that carries it, a dagger alif as alif, and a
// letter with maddah as doubled. Tā marbūṭa and a hamza without a carrier come after yā.
const alphabet = "AbtvjHxd*rzs$SDTZEgfqklmnhwYyp'";
const collationKey = lemma => {
    const letters = [];
    for (const ch of lemma.replace(/\d$/, '')) {
        if ('`{|><'.includes(ch)) letters.push('A');
        else if (ch === '&') letters.push('w');
        else if (ch === '}') letters.push('y');
        else if (ch === '#') letters.push("'");
        else if (ch === '^') letters.push(letters[letters.length - 1]);
        else if (alphabet.includes(ch)) letters.push(ch);
    }
    return letters.map(letter => String.fromCharCode(65 + alphabet.indexOf(letter))).join('');
}

// A word has one stem, with one exception that has two. Returns the features of each stem.
const getStems = features => {
    const stems = [];
    for (const feature of features.split(' ')) {
        if (feature.startsWith('POS:')) {
            stems.push([feature]);
        } else if (stems.length > 0) {
            stems[stems.length - 1].push(feature);
        }
    }
    return stems;
}

const getDerivedForm = stem => {
    const find = prefix => stem.find(feature => feature.startsWith(prefix))?.substring(prefix.length);
    const root = find('ROOT:');
    if (!root) return undefined;

    const partOfSpeech = partOfSpeechNames[find('POS:')];
    const lemma = find('LEM:');
    if (!partOfSpeech || !lemma) {
        throw new Error(`Unrecognized stem: ${stem.join(' ')}`);
    }

    const participle = stem.indexOf('PCPL');
    const derivation = participle > 0
        ? (stem[participle - 1] === 'ACT' ? 'active participle' : 'passive participle')
        : stem.includes('VN') ? 'verbal noun' : undefined;

    const form = stem.find(feature => /^\([IVX]+\)$/.test(feature))?.slice(1, -1);
    if (derivation) return { root, category: 'derived', type: derivation, form, lemma };
    if (partOfSpeech === 'verb') return { root, category: 'verb', type: 'verb', form: form ?? 'I', lemma };

    // a proper noun with a vocative suffix, as in allahumma
    const type = stem.includes('+VOC') ? 'form of address' : partOfSpeech;
    return { root, category: 'plain', type, lemma };
}

const roots = new Map();
let occurrences = 0;
let index = 0;
for (const { chapterNumber, verseNumber, words } of verses) {
    for (let wordNumber = 1; wordNumber <= words; wordNumber++) {
        const wordForms = new Set();
        for (const stem of getStems(morphology[index++])) {
            const derivedForm = getDerivedForm(stem);
            if (!derivedForm) continue;
            const { root, category, type, form, lemma } = derivedForm;

            // a lemma that is not a verb, participle or verbal noun is one form, whatever its part of speech
            const key = category === 'plain' ? `plain ${lemma}` : `${type} ${form} ${lemma}`;
            if (wordForms.has(`${root} ${key}`)) continue;
            wordForms.add(`${root} ${key}`);

            if (!roots.has(root)) roots.set(root, new Map());
            const forms = roots.get(root);
            if (!forms.has(key)) forms.set(key, { category, types: new Set(), form, lemma, words: [] });
            forms.get(key).types.add(type);
            forms.get(key).words.push(chapterNumber, verseNumber, wordNumber);
            occurrences++;
        }
    }
}

// A lemma key ends in a digit where two lemmas are written alike.
const lemmaText = lemma => lemma.replace(/\d$/, '');

const projectPath = join(dirname(fileURLToPath(import.meta.url)), '..');
const lemmas = [...new Set([...roots.values()].flatMap(forms => [...forms.values()].map(form => lemmaText(form.lemma))))];
const converted = new Map(
    execFileSync(
        'java',
        ['-cp', jarPath, join(projectPath, 'scripts/LemmaText.java')],
        { input: lemmas.join('\n') + '\n', encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
        .split('\n')
        .filter(line => line)
        .map(line => {
            const [lemma, arabic, phonetic] = line.split('\t');
            return [lemma, { arabic, phonetic }];
        }));
if (converted.size !== lemmas.length) {
    throw new Error(`Converted ${converted.size} of ${lemmas.length} lemmas.`);
}

const glosses = new Map(readLines(apiPath, 'lemmas.txt').filter(line => line).map(line => line.split('\t')));

const getType = ({ types }) => types.size > 1 ? 'nominal' : [...types][0];

const formatForm = derivedForm => {
    const { category, form, lemma, words } = derivedForm;
    const { arabic, phonetic } = converted.get(lemmaText(lemma));
    const gloss = category === 'verb' ? glosses.get(lemma) : undefined;
    return JSON.stringify({ type: getType(derivedForm), form, lemma: arabic, phonetic, gloss, words });
}

// Verbs come first, then lemmas in alphabetical order, then verbal nouns and participles by form.
const categoryOrder = ['verb', 'plain', 'derived'];
const formRank = form => formOrder.indexOf(form ?? 'I');
const compareText = (a, b) => a < b ? -1 : a > b ? 1 : 0;
const compareLemmas = (a, b) => compareText(collationKey(a), collationKey(b)) || compareText(a, b);

const sortForms = forms => [...forms.values()].sort((a, b) =>
    categoryOrder.indexOf(a.category) - categoryOrder.indexOf(b.category)
    || (a.category === 'plain' ? 0 : formRank(a.form) - formRank(b.form))
    || (a.category === 'derived' ? derivations.indexOf(getType(a)) - derivations.indexOf(getType(b)) : 0)
    || compareLemmas(a.lemma, b.lemma));

const sortedRoots = [...roots.keys()].sort();
const json = '{\n'
    + Object.entries(getSource(apiPath)).map(([key, value]) => `  ${JSON.stringify(key)}: ${JSON.stringify(value)},\n`).join('')
    + '  "roots": {\n'
    + sortedRoots.map(root =>
        `    ${JSON.stringify(root)}: [\n${sortForms(roots.get(root)).map(form => `      ${formatForm(form)}`).join(',\n')}\n    ]`).join(',\n')
    + '\n  }\n}\n';

const outputPath = join(projectPath, 'src/search/root-index.json');
writeFileSync(outputPath, json);
const formCount = [...roots.values()].reduce((sum, forms) => sum + forms.size, 0);
console.log(`${roots.size} roots, ${formCount} derived forms, ${occurrences} occurrences.`);
console.log(`Written to ${outputPath}`);
