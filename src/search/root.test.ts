import 'reflect-metadata';
import { describe, expect, it } from 'vitest';
import {
    compareRoots, findRootInDescription, formatRootArabic, formatRootName, formatRootPath, getRootUrl, matchRoots, parseRootPath
} from './root';
import { describeForm, formatFormHeading, formatNumber, formatTimes } from './root-text';
import { RootForm, RootService } from './root-service';

const roots = ['Elm', 'Eml', 'Ely', 'Hmd', 'hmd', 'Alh', 'smw', '$Er', 'zlzl'];

describe('root', () => {

    it('formats a root as Arabic letters and letter names', () => {
        expect(formatRootArabic('Elm')).toBe('ع ل م');
        expect(formatRootName('Elm')).toBe('ʿayn lām mīm');
        expect(formatRootArabic('Alh')).toBe('أ ل ه');
        expect(formatRootName('Alh')).toBe('hamza lām hā');
        expect(formatRootName('zlzl')).toBe('zāy lām zāy lām');
    });

    it('converts a root to and from a URL path', () => {
        expect(formatRootPath('Elm')).toBe('علم');
        expect(parseRootPath('علم')).toBe('Elm');
        expect(parseRootPath('اله')).toBe('Alh');
        expect(parseRootPath('abc')).toBeUndefined();
        expect(parseRootPath('')).toBeUndefined();
    });

    it('sorts roots alphabetically by their Arabic letters', () => {
        expect(['smw', 'Elm', 'Alh', 'bdA', 'bAr'].sort(compareRoots)).toEqual(['Alh', 'bAr', 'bdA', 'smw', 'Elm']);
    });

    it('finds the root named in the description of a word', () => {
        const description = 'A preposition and noun. The noun\'s triliteral root is {sīn mīm wāw} [س م و]. Together';
        expect(findRootInDescription(description)).toBe('smw');
        expect(getRootUrl('smw')).toBe('/roots/سمو');
        expect(findRootInDescription('The seventh word of verse (2:6) is a coordinating conjunction.')).toBeUndefined();
    });

    it('matches Arabic letters, with or without spaces', () => {
        expect(matchRoots('علم', roots)).toEqual(['Elm']);
        expect(matchRoots('ع ل م', roots)).toEqual(['Elm']);
        expect(matchRoots('عل', roots)).toEqual(['Elm', 'Ely']);
        expect(matchRoots('ءله', roots)).toEqual(['Alh']);
    });

    it('matches letter names in different spellings', () => {
        expect(matchRoots('ʿayn lām mīm', roots)).toEqual(['Elm']);
        expect(matchRoots('ayn lam mim', roots)).toEqual(['Elm']);
        expect(matchRoots('3ain laam meem', roots)).toEqual(['Elm']);
        expect(matchRoots('3ail lam mim', roots)).toEqual(['Elm']);
        expect(matchRoots('shin ayn ra', roots)).toEqual(['$Er']);
        expect(matchRoots('hamza lam ha', roots)).toEqual(['Alh']);
    });

    it('returns every root that an ambiguous name could mean', () => {
        expect(matchRoots('ha mim dal', roots)).toEqual(['Hmd', 'hmd']);
        expect(matchRoots('ḥā mīm dāl', roots)).toEqual(['Hmd', 'hmd']);
    });

    it('matches the beginning of a root while it is being typed', () => {
        expect(matchRoots('ayn', roots)).toEqual(['Elm', 'Eml', 'Ely']);
        expect(matchRoots('ayn l', roots)).toEqual(['Elm', 'Ely']);
        expect(matchRoots('ayn lam mi', roots)).toEqual(['Elm']);
    });

    it('matches nothing for an empty or unrecognized query', () => {
        expect(matchRoots('', roots)).toEqual([]);
        expect(matchRoots('   ', roots)).toEqual([]);
        expect(matchRoots('xyz lam mim', roots)).toEqual([]);
    });
});

describe('root text', () => {
    const form = (type: string, form?: string) => ({ type, form, lemma: '', phonetic: '', words: [] });

    it('writes small numbers as words', () => {
        expect(formatNumber(6)).toBe('six');
        expect(formatNumber(9)).toBe('nine');
        expect(formatNumber(10)).toBe('10');
        expect(formatTimes(1)).toBe('once');
        expect(formatTimes(2)).toBe('twice');
        expect(formatTimes(8)).toBe('eight times');
        expect(formatTimes(1310)).toBe('1310 times');
    });

    it('describes a derived form', () => {
        expect(describeForm(form('verb', 'I'))).toBe('form I verb');
        expect(describeForm(form('verb', 'II'))).toBe('form II verb');
        expect(describeForm(form('noun'))).toBe('noun');
        expect(describeForm(form('active participle'))).toBe('active participle');
        expect(describeForm(form('passive participle', 'II'))).toBe('form II passive participle');
        expect(formatFormHeading(form('verb', 'II'))).toBe('Verb (form II)');
        expect(formatFormHeading(form('verbal noun'))).toBe('Verbal noun');
    });
});

describe('root service', () => {
    const service = new RootService();

    it('lists the derived forms of a root as the corpus dictionary does', async () => {
        const forms = await service.getForms('smw');
        // diacritics on one letter can be stored in either order
        const describe = (form: RootForm) =>
            `${form.words.length} ${describeForm(form)} ${form.phonetic} ${form.lemma}`.normalize('NFC');
        expect(forms.map(describe)).toEqual([
            '8 form II verb sammā سَمَّىٰ',
            '39 noun is\'m ٱسْم',
            '310 noun samā سَمَآء',
            '2 noun samiyy سَمِيّ',
            '1 form II verbal noun tasmiyat تَسْمِيَة',
            '21 form II passive participle musamman مُّسَمًّى'
        ].map(text => text.normalize('NFC')));
        expect(forms[0].gloss).toBe('to name');
        expect(forms[0].words[0]).toEqual([3, 36, 16]);
        expect(await service.getForms('xxx')).toEqual([]);
    });

    it('lists the roots that begin with a letter in alphabetical order', async () => {
        const roots = await service.browse('s');
        expect(roots.every(({ root }) => root.startsWith('s'))).toBe(true);
        expect(roots.every((match, i) => i === 0 || compareRoots(roots[i - 1].root, match.root) < 0)).toBe(true);
        expect(roots.find(({ root }) => root === 'smw')?.count).toBe(381);
    });

    it('lists matching roots by number of occurrences', async () => {
        const matches = await service.search('ayn lam');
        expect(matches[0]).toEqual({ root: 'Elm', count: 854 });
        expect(matches.every((match, i) => i === 0 || matches[i - 1].count >= match.count)).toBe(true);
    });

    it('can format every root in the index', async () => {
        const index = await service.load();
        expect(index.size).toBe(1642);
        for (const root of index.keys()) {
            expect(parseRootPath(formatRootPath(root))).toBe(root);
        }
    });
});
