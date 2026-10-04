import { describe, expect, it } from 'vitest';
import { formatLocation, formatLocationWithBrackets, parseHashLocation, parseLocation } from './location';

describe('location', () => {

    it('parses chapter, verse and token numbers', () => {
        expect(parseLocation('2')).toEqual([2]);
        expect(parseLocation('2:255')).toEqual([2, 255]);
        expect(parseLocation('2:255:3')).toEqual([2, 255, 3]);
    });

    it('parses a token location from a URL hash', () => {
        expect(parseHashLocation('#1:1:1')).toEqual([1, 1, 1]);
        expect(parseHashLocation('1:1:1')).toBeUndefined();
        expect(parseHashLocation('#1:1')).toBeUndefined();
        expect(parseHashLocation('')).toBeUndefined();
    });

    it('formats locations', () => {
        expect(formatLocation([2, 255])).toBe('2:255');
        expect(formatLocationWithBrackets([2, 255, 3])).toBe('(2:255:3)');
    });
});
