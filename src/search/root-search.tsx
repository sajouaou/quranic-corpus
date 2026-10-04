import { useEffect, useState } from 'react';
import { Link, LoaderFunctionArgs, useLoaderData, useSearchParams } from 'react-router';
import { CorpusError } from '../errors/corpus-error';
import { Footer } from '../components/footer';
import { LoadingBanner } from '../components/loading-banner';
import { RootMatch, RootService } from './root-service';
import { RootSearchBox } from './root-search-box';
import { RootEntry } from './root-entry';
import { formatRootArabic, formatRootName, getRootLetters, getRootUrl, parseRootPath } from './root';
import { formatCount } from '../progress/format';
import { combineClassNames } from '../theme/class-names';
import { container } from 'tsyringe';
import './root-search.scss';

export const rootSearchLoader = ({ params }: LoaderFunctionArgs): string | null => {
    if (!params.root) return null;
    const root = parseRootPath(params.root);
    if (!root) {
        throw new CorpusError('404', 'Page not found');
    }
    return root;
}

type LetterProps = {
    letter?: string
}

// Lists the letters that roots begin with. Selecting one lists its roots.
const RootLetterPicker = ({ letter }: LetterProps) => (
    <nav className='root-letter-picker' aria-label='Roots by first letter'>
        {
            getRootLetters().map(({ buckwalter, arabic, name }) => (
                <Link
                    key={buckwalter}
                    to={`/roots?letter=${arabic}`}
                    className={combineClassNames('letter', buckwalter === letter ? 'selected' : undefined)}
                    title={name}>
                    {arabic}
                </Link>
            ))
        }
    </nav>
)

type ListProps = {
    letter: string
}

const RootList = ({ letter }: ListProps) => {
    const rootService = container.resolve(RootService);
    const [roots, setRoots] = useState<RootMatch[]>();

    useEffect(() => {
        rootService.browse(letter).then(setRoots);
    }, [letter, rootService]);

    if (!roots) {
        return <LoadingBanner />;
    }

    return (
        <section className='root-list'>
            <h2>{formatCount(roots.length)} {roots.length === 1 ? 'root begins' : 'roots begin'} with {formatRootName(letter)}</h2>
            <ul>
                {
                    roots.map(({ root, count }) => (
                        <li key={root}>
                            <Link to={getRootUrl(root)} title={`${formatRootName(root)}: ${formatCount(count)}`}>
                                {formatRootArabic(root)}
                            </Link>
                        </li>
                    ))
                }
            </ul>
        </section>
    )
}

export const RootSearch = () => {
    const root = useLoaderData() as string | null;
    const [searchParams] = useSearchParams();
    const letter = parseRootPath(searchParams.get('letter') ?? '')?.charAt(0);

    return (
        <div className='root-search'>
            <header>
                <h1>Quran Dictionary</h1>
                <p>
                    Choose the first letter of a root, or type a root in Arabic letters or as letter
                    names, to list every word in the Quran annotated with that root.
                </p>
            </header>
            <RootLetterPicker letter={root ? root.charAt(0) : letter} />
            <RootSearchBox />
            {root && <RootEntry key={root} root={root} />}
            {!root && letter && <RootList key={letter} letter={letter} />}
            <p className='source'>
                Roots are from the morphological annotation of
                the <a href='http://corpus.quran.com'>Quranic Arabic Corpus</a>.
            </p>
            <Footer />
        </div>
    )
}
