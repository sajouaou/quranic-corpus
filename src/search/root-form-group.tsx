import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { Verse } from '../corpus/orthography/verse';
import { Location, formatLocation, formatLocationWithBrackets } from '../corpus/orthography/location';
import { EndOfVerse } from '../components/end-of-verse';
import { RootForm } from './root-service';
import { formatFormHeading } from './root-text';
import { formatCount } from '../progress/format';

const initialCount = 5;
const pageSize = 20;

// Long verses show only the words around the occurrence.
const maxVerseLength = 14;
const contextLength = 6;

type OccurrenceProps = {
    location: Location,
    verse?: Verse
}

const RootOccurrence = ({ location, verse }: OccurrenceProps) => {
    const [chapterNumber, verseNumber, tokenNumber] = location;
    const verseUrl = `/wordbyword/${chapterNumber}:${verseNumber}`;
    const token = verse?.tokens[tokenNumber - 1];

    const tokens = verse?.tokens ?? [];
    const whole = tokens.length <= maxVerseLength;
    const start = whole ? 0 : Math.max(0, tokenNumber - 1 - contextLength);
    const end = whole ? tokens.length : Math.min(tokens.length, tokenNumber + contextLength);

    return (
        <li className='root-occurrence'>
            <Link className='reference' to={verseUrl}>{formatLocationWithBrackets(location)}</Link>
            {
                token
                    ? (
                        <>
                            <span className='phonetic'>{token.phonetic}</span>
                            <span className='gloss'>{token.translation}</span>
                            <div className='context'>
                                {start > 0 && <span className='ellipsis'>…</span>}
                                {
                                    tokens.slice(start, end).map(({ location, segments }) => {
                                        const text = segments.map(segment => segment.arabic ?? '').join('');
                                        return location[2] === tokenNumber
                                            ? (
                                                <Link
                                                    key={location[2]}
                                                    className='match'
                                                    to={`${verseUrl}#${formatLocation(location)}`}>
                                                    {text}
                                                </Link>
                                            )
                                            : <span key={location[2]}>{text}</span>
                                    })
                                }
                                {
                                    end < tokens.length
                                        ? <span className='ellipsis'>…</span>
                                        : <EndOfVerse verseNumber={verseNumber} />
                                }
                            </div>
                        </>
                    )
                    : <span className='loading'>Loading...</span>
            }
        </li>
    )
}

type Props = {
    id: string,
    form: RootForm,
    getVerse: (location: Location) => Promise<Verse>
}

export const RootFormGroup = ({ id, form, getVerse }: Props) => {
    const { lemma, phonetic, gloss, words } = form;

    const ref = useRef<HTMLElement | null>(null);
    const [inView, setInView] = useState(false);
    const [visibleCount, setVisibleCount] = useState(initialCount);
    const [verses, setVerses] = useState<(Verse | undefined)[]>([]);
    const [error, setError] = useState(false);

    // Verses are only fetched once the group is scrolled into view.
    useEffect(() => {
        const element = ref.current;
        if (!element) return;
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                setInView(true);
                observer.disconnect();
            }
        }, { rootMargin: '200px' });
        observer.observe(element);
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        if (!inView) return;
        const missing = words.slice(verses.length, visibleCount);
        if (missing.length === 0) return;

        let stale = false;
        Promise.all(missing.map(getVerse))
            .then(loaded => {
                if (!stale) setVerses([...verses, ...loaded]);
            })
            .catch(() => {
                if (!stale) setError(true);
            });
        return () => {
            stale = true;
        };
    }, [inView, visibleCount, verses, words, getVerse]);

    const remaining = words.length - visibleCount;

    return (
        <section ref={ref} id={id} className='root-form-group'>
            <h3>
                <span className='type'>{formatFormHeading(form)}</span>
                <span className='phonetic'>{phonetic}</span>
                <span className='lemma'>{lemma}</span>
                {gloss && <span className='gloss'>{gloss}</span>}
            </h3>
            <p className='count'>{formatCount(words.length)} {words.length === 1 ? 'occurrence' : 'occurrences'}</p>
            {
                error
                    ? <p className='error'>The verses could not be loaded.</p>
                    : (
                        <ol>
                            {
                                words.slice(0, visibleCount).map((location, i) => (
                                    <RootOccurrence key={formatLocation(location)} location={location} verse={verses[i]} />
                                ))
                            }
                        </ol>
                    )
            }
            {
                !error && remaining > 0 &&
                <button type='button' className='more' onClick={() => setVisibleCount(visibleCount + pageSize)}>
                    Show more ({formatCount(remaining)} remaining)
                </button>
            }
        </section>
    )
}
