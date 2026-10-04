import { describe, expect, it } from 'vitest';
import { getSuggestions, matchChapters } from './chapter-search';
import { getPageLocation, getSectionKey, getSections } from './sections';
import { Chapter } from '../corpus/orthography/chapter';

const chapters: Chapter[] = [
    { chapterNumber: 1, verseCount: 7, phonetic: 'Al-Fātiḥah', translation: 'The Opening', city: 'Makkah' },
    { chapterNumber: 2, verseCount: 286, phonetic: 'Al-Baqarah', translation: 'The Cow', city: 'Madinah' },
    { chapterNumber: 3, verseCount: 200, phonetic: 'Āl ʿImrān', translation: 'The Family of Imran', city: 'Madinah' }
];

const locations = (query: string) => getSuggestions(chapters, query).map(s => s.location.join(':'));

describe('chapter search', () => {

    it('ignores diacritics and case', () => {
        expect(matchChapters(chapters, 'fatihah').map(c => c.chapterNumber)).toEqual([1]);
        expect(matchChapters(chapters, 'IMRAN').map(c => c.chapterNumber)).toEqual([3]);
    });

    it('matches translations and chapter numbers', () => {
        expect(matchChapters(chapters, 'cow').map(c => c.chapterNumber)).toEqual([2]);
        expect(matchChapters(chapters, '2').map(c => c.chapterNumber)).toEqual([2]);
    });

    it('suggests a verse before the chapter', () => {
        expect(locations('2:255')).toEqual(['2:255', '2']);
        expect(locations('2 255')).toEqual(['2:255', '2']);
        expect(locations('baqarah 255')).toEqual(['2:255', '2']);
        expect(locations('baqarah:7')).toEqual(['2:7', '2']);
    });

    it('rejects verses that do not exist', () => {
        expect(locations('1:8')).toEqual(['1']);
        expect(locations('1:0')).toEqual(['1']);
        expect(locations('9:1')).toEqual([]);
    });

    it('suggests nothing for an empty query', () => {
        expect(locations('')).toEqual([]);
        expect(locations('   ')).toEqual([]);
    });

    it('describes each suggestion', () => {
        expect(getSuggestions(chapters, '2:255')[0]).toEqual(
            { location: [2, 255], title: '2:255', detail: 'Al-Baqarah, verse 255' });
        expect(getSuggestions(chapters, 'cow')[0]).toEqual(
            { location: [2], title: '2. Al-Baqarah', detail: 'The Cow' });
    });
});

describe('sections', () => {

    it('finds the place a page shows', () => {
        expect(getPageLocation('/wordbyword/2:255')).toBe('2:255');
        expect(getPageLocation('/treebank/59')).toBe('59');
        expect(getPageLocation('/roots/Elm')).toBeUndefined();
        expect(getPageLocation('/')).toBeUndefined();
    });

    it('finds the section of a page', () => {
        expect(getSectionKey('/')).toBe('overview');
        expect(getSectionKey('/wordbyword/2:255')).toBe('reader');
        expect(getSectionKey('/treebank/2:255')).toBe('treebank');
        expect(getSectionKey('/roots')).toBe('dictionary');
        expect(getSectionKey('/roots/Elm')).toBe('dictionary');
        expect(getSectionKey('/nowhere')).toBeUndefined();
    });

    it('keeps the place when changing between reader and treebank', () => {
        const sections = getSections('2:255');
        expect(sections.map(s => s.to)).toEqual(['/', '/wordbyword/2:255', '/treebank/2:255', '/roots']);
    });

    it('starts at the first chapter without a place', () => {
        expect(getSections().map(s => s.to)).toContain('/wordbyword/1');
    });
});
