import { Chapter } from '../corpus/orthography/chapter';
import { Location } from '../corpus/orthography/location';

export type Suggestion = {
    location: Location,
    title: string,
    detail?: string
}

const maxSuggestions = 8;

// Lets "fatihah" match "Al-Fātiḥah".
export const normalize = (text: string) => text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9 ]/gi, '')
    .toLowerCase();

export const matchChapters = (chapters: Chapter[], query: string) => {
    const normalized = normalize(query.trim());
    return chapters.filter(({ chapterNumber, phonetic, translation }) =>
        !normalized
        || String(chapterNumber) === normalized
        || normalize(phonetic).includes(normalized)
        || (translation !== undefined && normalize(translation).includes(normalized)));
}

const chapterSuggestion = ({ chapterNumber, phonetic, translation }: Chapter): Suggestion => ({
    location: [chapterNumber],
    title: `${chapterNumber}. ${phonetic}`,
    detail: translation
})

const verseSuggestion = ({ chapterNumber, phonetic, verseCount }: Chapter, verseNumber: number): Suggestion | undefined =>
    verseNumber >= 1 && verseNumber <= verseCount
        ? { location: [chapterNumber, verseNumber], title: `${chapterNumber}:${verseNumber}`, detail: `${phonetic}, verse ${verseNumber}` }
        : undefined

// Understands a chapter ("2"), a verse ("2:255", "2 255") or a chapter name with or without a
// verse ("baqarah", "baqarah 255"), and lists the places it could mean, best match first.
export const getSuggestions = (chapters: Chapter[], query: string): Suggestion[] => {
    const text = query.trim();
    if (!text) return [];

    const suggestions: Suggestion[] = [];
    const add = (suggestion?: Suggestion) => {
        if (suggestion && !suggestions.some(s => s.location.join(':') === suggestion.location.join(':'))) {
            suggestions.push(suggestion);
        }
    }

    const verseReference = text.match(/^(.*?)\s*[:.\s]\s*(\d{1,3})$/);
    if (verseReference) {
        const [, chapterText, verseText] = verseReference;
        const chapter = /^\d{1,3}$/.test(chapterText)
            ? chapters[Number(chapterText) - 1]
            : chapterText ? matchChapters(chapters, chapterText)[0] : undefined;
        if (chapter) {
            add(verseSuggestion(chapter, Number(verseText)));
            add(chapterSuggestion(chapter));
        }
    }

    for (const chapter of matchChapters(chapters, text)) {
        add(chapterSuggestion(chapter));
    }
    return suggestions.slice(0, maxSuggestions);
}
