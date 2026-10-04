export type SectionKey = 'overview' | 'reader' | 'treebank' | 'dictionary';

export type Section = {
    key: SectionKey,
    label: string,
    to: string
}

const locationPages: { key: SectionKey, path: string }[] = [
    { key: 'reader', path: '/wordbyword' },
    { key: 'treebank', path: '/treebank' }
]

const defaultLocation = '1';

// The place in the Quran shown by the page at this path, such as "2:255", if it shows one.
export const getPageLocation = (pathname: string) => {
    for (const { path } of locationPages) {
        const match = pathname.match(new RegExp(`^${path}/(\\d+(?::\\d+)?)/?$`));
        if (match) return match[1];
    }
    return undefined;
}

export const getSectionKey = (pathname: string): SectionKey | undefined => {
    if (pathname === '/') return 'overview';
    if (pathname === '/roots' || pathname.startsWith('/roots/')) return 'dictionary';
    return locationPages.find(({ path }) => pathname === path || pathname.startsWith(`${path}/`))?.key;
}

// The sections of the site. The Word by Word and Treebank tabs keep the current place, so the
// same verse can be viewed in both.
export const getSections = (location = defaultLocation): Section[] => [
    { key: 'overview', label: 'Overview', to: '/' },
    { key: 'reader', label: 'Word by Word', to: `/wordbyword/${location}` },
    { key: 'treebank', label: 'Treebank', to: `/treebank/${location}` },
    { key: 'dictionary', label: 'Dictionary', to: '/roots' }
]
