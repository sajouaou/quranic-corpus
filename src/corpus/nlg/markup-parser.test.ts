import { describe, expect, it } from 'vitest';
import { MarkupParser } from './markup-parser';

describe('markup parser', () => {

    it('returns plain text as a single span', () => {
        expect(new MarkupParser('a noun').parse()).toEqual([
            { type: 'text', text: 'a noun' }
        ]);
    });

    it('splits phonetic and arabic spans from text', () => {
        expect(new MarkupParser('before {abc} middle [xyz] after').parse()).toEqual([
            { type: 'text', text: 'before ' },
            { type: 'phonetic', text: 'abc' },
            { type: 'text', text: ' middle ' },
            { type: 'arabic', text: 'xyz' },
            { type: 'text', text: ' after' }
        ]);
    });

    it('returns no spans for empty markup', () => {
        expect(new MarkupParser('').parse()).toEqual([]);
    });
});
