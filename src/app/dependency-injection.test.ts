import 'reflect-metadata';
import { describe, expect, it } from 'vitest';
import { container } from 'tsyringe';
import { TranslationService } from '../corpus/translation/translation-service';
import { ChapterService } from '../corpus/orthography/chapter-service';
import { VerseService } from '../corpus/orthography/verse-service';
import { SettingsService } from '../settings/settings-service';
import { ClipboardService } from '../clipboard/clipboard-service';

// Constructor injection relies on the build emitting decorator metadata.
describe('dependency injection', () => {

    it('resolves services as singletons', () => {
        expect(container.resolve(TranslationService)).toBe(container.resolve(TranslationService));
    });

    it('injects constructor dependencies', () => {
        const settingsService = container.resolve(SettingsService);
        expect(Reflect.get(settingsService, 'translationService')).toBe(container.resolve(TranslationService));

        const clipboardService = container.resolve(ClipboardService);
        expect(Reflect.get(clipboardService, 'chapterService')).toBe(container.resolve(ChapterService));
        expect(Reflect.get(clipboardService, 'verseService')).toBe(container.resolve(VerseService));
    });
});
