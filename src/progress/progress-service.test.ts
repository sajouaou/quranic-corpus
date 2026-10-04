import 'reflect-metadata';
import { describe, expect, it } from 'vitest';
import { ProgressService } from './progress-service';
import { formatCount, formatPercent } from './format';

describe('progress service', () => {
    const service = new ProgressService();

    it('covers every chapter', () => {
        expect(service.chapters).toHaveLength(114);
        expect(service.getChapterCoverage(1)).toEqual(
            { words: 29, verses: 7, treebankWords: 29, treebankVerses: 7, draftWords: 0, draftVerses: 0 });
    });

    it('never counts more annotated words than words', () => {
        for (const { words, verses, treebankWords, treebankVerses, draftWords, draftVerses } of service.chapters) {
            expect(treebankWords + draftWords).toBeLessThanOrEqual(words);
            expect(treebankVerses + draftVerses).toBeLessThanOrEqual(verses);
        }
        expect(service.morphologyWords.count).toBeLessThanOrEqual(service.morphologyWords.total);
    });

    it('totals the chapters', () => {
        const words = service.chapters.reduce((sum, chapter) => sum + chapter.words, 0);
        expect(service.treebankWords.total).toBe(words);
        expect(service.morphologyWords.total).toBe(words);
        expect(service.treebankChapters.total).toBe(114);
        expect(service.treebankChapters.count).toBe(
            service.chapters.filter(chapter => chapter.treebankWords === chapter.words).length);
    });
});

describe('progress formatting', () => {

    it('formats counts with thousands separators', () => {
        expect(formatCount(77429)).toBe('77,429');
    });

    it('rounds percentages down to one decimal place', () => {
        expect(formatPercent(1, 2)).toBe('50%');
        expect(formatPercent(32617, 77429)).toBe('42.1%');
        expect(formatPercent(9999, 10000)).toBe('99.9%');
        expect(formatPercent(77429, 77429)).toBe('100%');
        expect(formatPercent(0, 0)).toBe('0%');
    });
});
