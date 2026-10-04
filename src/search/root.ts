// Roots are keyed in Buckwalter transliteration, as in the corpus data files. Letter names follow
// the corpus, which names the first letter of a root such as [أ ل ه] hamza.
type RootLetter = {
    buckwalter: string,
    arabic: string,
    name: string,
    otherNames?: string[]
}

const rootLetters: RootLetter[] = [
    { buckwalter: 'A', arabic: 'أ', name: 'hamza', otherNames: ['alif'] },
    { buckwalter: 'b', arabic: 'ب', name: 'bā' },
    { buckwalter: 't', arabic: 'ت', name: 'tā' },
    { buckwalter: 'v', arabic: 'ث', name: 'thā' },
    { buckwalter: 'j', arabic: 'ج', name: 'jīm' },
    { buckwalter: 'H', arabic: 'ح', name: 'ḥā' },
    { buckwalter: 'x', arabic: 'خ', name: 'khā' },
    { buckwalter: 'd', arabic: 'د', name: 'dāl' },
    { buckwalter: '*', arabic: 'ذ', name: 'dhāl', otherNames: ['thal', 'zal'] },
    { buckwalter: 'r', arabic: 'ر', name: 'rā' },
    { buckwalter: 'z', arabic: 'ز', name: 'zāy', otherNames: ['zayn', 'za'] },
    { buckwalter: 's', arabic: 'س', name: 'sīn' },
    { buckwalter: '$', arabic: 'ش', name: 'shīn' },
    { buckwalter: 'S', arabic: 'ص', name: 'ṣād' },
    { buckwalter: 'D', arabic: 'ض', name: 'ḍād', otherNames: ['dhad'] },
    { buckwalter: 'T', arabic: 'ط', name: 'ṭā' },
    { buckwalter: 'Z', arabic: 'ظ', name: 'ẓā', otherNames: ['dha', 'zha'] },
    { buckwalter: 'E', arabic: 'ع', name: 'ʿayn' },
    { buckwalter: 'g', arabic: 'غ', name: 'ghayn' },
    { buckwalter: 'f', arabic: 'ف', name: 'fā' },
    { buckwalter: 'q', arabic: 'ق', name: 'qāf' },
    { buckwalter: 'k', arabic: 'ك', name: 'kāf' },
    { buckwalter: 'l', arabic: 'ل', name: 'lām' },
    { buckwalter: 'm', arabic: 'م', name: 'mīm' },
    { buckwalter: 'n', arabic: 'ن', name: 'nūn' },
    { buckwalter: 'h', arabic: 'ه', name: 'hā' },
    { buckwalter: 'w', arabic: 'و', name: 'wāw' },
    { buckwalter: 'y', arabic: 'ي', name: 'yā' }
];

// Other written forms of the letters above.
const arabicVariants = new Map([
    ['ء', 'A'],
    ['ا', 'A'],
    ['إ', 'A'],
    ['آ', 'A'],
    ['ٱ', 'A'],
    ['ؤ', 'A'],
    ['ئ', 'A'],
    ['ى', 'y']
]);

// Reduces a letter name to plain ASCII, so that "ʿayn", "ain" and "3ayn" all compare equal.
const normalizeName = (name: string) => {
    const ascii = name
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');
    if (ascii.startsWith('3')) return 'ayn';
    return ascii
        .replace(/aa/g, 'a')
        .replace(/ee|ii/g, 'i')
        .replace(/oo|uu/g, 'u')
        .replace(/[ae]i/g, 'ay');
}

const lettersByBuckwalter = new Map(rootLetters.map(letter => [letter.buckwalter, letter]));

const letterOrder = new Map(rootLetters.map((letter, i) => [letter.buckwalter, i]));

const buckwalterByArabic = new Map([
    ...rootLetters.map(({ arabic, buckwalter }): [string, string] => [arabic, buckwalter]),
    ...arabicVariants
]);

const letterNames = rootLetters.flatMap(({ buckwalter, name, otherNames }) =>
    [name, ...otherNames ?? []].map(name => ({ name: normalizeName(name), buckwalter })));

const getLetter = (buckwalter: string) => {
    const letter = lettersByBuckwalter.get(buckwalter);
    if (!letter) {
        throw new Error(`Unrecognized root letter: ${buckwalter}`);
    }
    return letter;
}

const isArabic = (ch: string) => ch >= '؀' && ch <= 'ۿ'

export const formatRootArabic = (root: string) => [...root].map(ch => getLetter(ch).arabic).join(' ')

export const formatRootName = (root: string) => [...root].map(ch => getLetter(ch).name).join(' ')

export const formatRootPath = (root: string) => [...root].map(ch => getLetter(ch).arabic).join('')

export const getRootUrl = (root: string) => `/roots/${formatRootPath(root)}`

// The letters that a root can begin with, in alphabetical order.
export const getRootLetters = () => rootLetters.map(({ buckwalter, arabic, name }) => ({ buckwalter, arabic, name }))

// Sorts roots alphabetically by their Arabic letters.
export const compareRoots = (a: string, b: string) => {
    for (let i = 0; i < Math.min(a.length, b.length); i++) {
        const difference = letterOrder.get(a[i])! - letterOrder.get(b[i])!;
        if (difference !== 0) return difference;
    }
    return a.length - b.length;
}

// Finds the root named in the description of a word, such as "The noun's triliteral root is
// {sīn mīm wāw} [س م و]."
export const findRootInDescription = (description: string): string | undefined => {
    const match = description.match(/root is \{[^}]*\} \[([^\]]*)\]/);
    return match ? parseRootPath(match[1].replace(/\s/g, '')) : undefined;
}

export const parseRootPath = (path: string): string | undefined => {
    const letters = [...path].map(ch => buckwalterByArabic.get(ch));
    return letters.length > 0 && letters.every(letter => letter !== undefined) ? letters.join('') : undefined;
}

// The letters that each position of a query could stand for. Some letter names are ambiguous
// without diacritics, such as "ha" for both ḥā and hā.
const parseQuery = (query: string): Set<string>[] | undefined => {
    if ([...query].some(isArabic)) {
        return [...query]
            .map(ch => buckwalterByArabic.get(ch))
            .filter(letter => letter !== undefined)
            .map(letter => new Set([letter]));
    }

    const names = query.split(/[\s,\-–]+/).filter(name => name).map(normalizeName);
    const positions: Set<string>[] = [];
    for (const [i, name] of names.entries()) {
        let matches = letterNames.filter(letter => letter.name === name);
        if (matches.length === 0 && i === names.length - 1) {
            // still being typed
            matches = letterNames.filter(letter => letter.name.startsWith(name));
        }
        if (matches.length === 0) return undefined;
        positions.push(new Set(matches.map(letter => letter.buckwalter)));
    }
    return positions;
}

// Returns the roots that begin with the letters of the query, given as Arabic letters (ع ل م) or
// as letter names (ʿayn lām mīm).
export const matchRoots = (query: string, roots: string[]): string[] => {
    const positions = parseQuery(query);
    if (!positions || positions.length === 0) return [];
    return roots.filter(root =>
        root.length >= positions.length && positions.every((letters, i) => letters.has(root[i])));
}
