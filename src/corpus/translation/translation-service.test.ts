import 'reflect-metadata';
import { describe, expect, it } from 'vitest';
import { TranslationService } from './translation-service';

const createService = () => {
    const service = new TranslationService();
    service.translations = [
        { key: 'a', name: 'A' },
        { key: 'b', name: 'B' },
        { key: 'c', name: 'C' }
    ];
    return service;
}

describe('translation service', () => {

    it('throws until translations are loaded', () => {
        expect(() => new TranslationService().translations).toThrow('Translations not loaded.');
    });

    it('removes a selected translation', () => {
        expect(createService().toggleTranslation(['a', 'b'], 'a')).toEqual(['b']);
    });

    it('adds a translation in metadata order', () => {
        expect(createService().toggleTranslation(['c'], 'a')).toEqual(['a', 'c']);
        expect(createService().toggleTranslation(['a', 'c'], 'b')).toEqual(['a', 'b', 'c']);
    });

    it('rejects an unknown translation', () => {
        expect(() => createService().toggleTranslation([], 'x')).toThrow('Translation x not found.');
    });
});
