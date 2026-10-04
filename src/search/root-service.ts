import { Location } from '../corpus/orthography/location';
import { compareRoots, matchRoots } from './root';
import { singleton } from 'tsyringe';

export type RootMatch = {
    root: string,
    count: number
}

// A derived form of a root: a lemma together with what it is, such as a form II verb.
export type RootForm = {
    type: string,
    form?: string,
    lemma: string,
    phonetic: string,
    gloss?: string,
    words: Location[]
}

type IndexedForm = Omit<RootForm, 'words'> & {
    words: number[]
}

type RootIndex = Map<string, RootForm[]>

// The root index is built from the morphological annotation by scripts/root-index.mjs. It is
// loaded on first use, as it is only needed for the dictionary.
@singleton()
export class RootService {
    private index: Promise<RootIndex> | undefined;

    load() {
        this.index ??= import('./root-index.json').then(module => {
            const roots: Record<string, IndexedForm[]> = module.default.roots;
            const index: RootIndex = new Map();
            for (const [root, forms] of Object.entries(roots)) {
                index.set(root, forms.map(form => {
                    const words: Location[] = [];
                    for (let i = 0; i < form.words.length; i += 3) {
                        words.push(form.words.slice(i, i + 3));
                    }
                    return { ...form, words };
                }));
            }
            return index;
        });
        return this.index;
    }

    // Returns the roots that match a query, most frequent first.
    async search(query: string): Promise<RootMatch[]> {
        return (await this.match(query)).sort((a, b) => b.count - a.count);
    }

    // Returns the roots that begin with a letter, in alphabetical order.
    async browse(letter: string): Promise<RootMatch[]> {
        const index = await this.load();
        return [...index.keys()]
            .filter(root => root.startsWith(letter))
            .sort(compareRoots)
            .map(root => ({ root, count: this.count(index.get(root)!) }));
    }

    async getForms(root: string): Promise<RootForm[]> {
        const index = await this.load();
        return index.get(root) ?? [];
    }

    private async match(query: string): Promise<RootMatch[]> {
        const index = await this.load();
        return matchRoots(query, [...index.keys()])
            .map(root => ({ root, count: this.count(index.get(root)!) }));
    }

    private count(forms: RootForm[]) {
        return forms.reduce((sum, form) => sum + form.words.length, 0);
    }
}
