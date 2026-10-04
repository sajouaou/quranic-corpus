import 'reflect-metadata';
import { describe, expect, it } from 'vitest';
import { ColorService } from './color-service';
import { posTags } from '../corpus/morphology/pos-tag';

// 'pink' marks a tag the color theme does not know about.
describe('color service', () => {
    const colorService = new ColorService();

    it('colors every part-of-speech tag', () => {
        const uncolored = posTags.filter(posTag => colorService.getSegmentColor({ posTag }) === 'pink');
        expect(uncolored).toEqual([]);
    });

    it('colors pronouns by type', () => {
        expect(colorService.getSegmentColor({ posTag: 'PRON', pronounType: 'subj' })).toBe('sky');
        expect(colorService.getSegmentColor({ posTag: 'PRON', pronounType: 'obj2' })).toBe('orange');
        expect(colorService.getSegmentColor({ posTag: 'PRON', pronounType: 'obj' })).toBe('metal');
    });
});
