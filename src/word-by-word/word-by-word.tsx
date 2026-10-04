import { useEffect, useRef, useState } from 'react';
import { LoaderFunctionArgs, useLoaderData, useLocation } from 'react-router';
import { Workspace } from '../app/workspace';
import { ChapterService } from '../corpus/orthography/chapter-service';
import { MorphologyService } from '../corpus/morphology/morphology-service';
import { WordMorphology } from '../corpus/morphology/word-morphology';
import { Verse } from '../corpus/orthography/verse';
import { Location, parseHashLocation, parseLocation } from '../corpus/orthography/location';
import Bismillah from '../images/bismillah.svg?react';
import { ReaderView } from './reader-view';
import { DetailView } from './detail-view';
import { useSettings } from '../settings/settings-context';
import { ChapterHeader } from './chapter-header';
import { CorpusHeader } from '../components/corpus-header';
import { CorpusError } from '../errors/corpus-error';
import { LoadingBanner } from '../components/loading-banner';
import { WordMorphologyView } from '../word-morphology/word-morphology-view';
import { getVerseId } from './verse-id';
import { useProgress } from '../app/progress-context';
import { container } from 'tsyringe';
import './word-by-word.scss';

export const wordByWordLoader = ({ params }: LoaderFunctionArgs) => {
    const location = parseLocation(params.location!);
    if (isNaN(location[0])) {
        throw new CorpusError('404', 'Page not found');
    }
    return location.length === 1 ? [location[0], 1] : location;
}

const buildMorphologyQuery = (up: boolean, urlVerseNumber: number, verses: Verse[]) => {
    let verseCount = 10;
    let start: number;
    if (verses.length === 0) {
        start = urlVerseNumber;
    } else if (up) {
        const first = verses[0].location[1];
        start = Math.max(1, first - verseCount);
        if (start < first) {
            verseCount = first - start;
        }
    } else {
        start = verses[verses.length - 1].location[1] + 1;
    }
    return { start, verseCount };
}

const intersectionOptions = {
    rootMargin: '0px',
    threshold: 0.1
}

type ScrollTarget = {
    verseNumber: number
}

export const WordByWord = () => {

    // navigation
    const location = useLoaderData() as Location;
    const [chapterNumber, verseNumber] = location;
    const { hash } = useLocation();
    const { showProgress } = useProgress();

    // services
    const chapterService = container.resolve(ChapterService);
    const morphologyService = container.resolve(MorphologyService);
    const chapter = chapterService.getChapter(chapterNumber);

    // state
    const [verses, setVerses] = useState<Verse[]>([]);
    const [scrollTarget, setScrollTarget] = useState<ScrollTarget>();
    const [loadingTop, setLoadingTop] = useState(false);
    const [loadingBottom, setLoadingBottom] = useState(false);
    const [startComplete, setStartComplete] = useState(false);
    const [endComplete, setEndComplete] = useState(false);
    const { settings } = useSettings();
    const { readerMode, translations } = settings;
    const [isScrollingUp, setIsScrollingUp] = useState(false);
    const [wordMorphology, setWordMorphology] = useState<WordMorphology>();

    // refs
    const loadingRefTop = useRef<HTMLDivElement>(null);
    const loadingRefBottom = useRef<HTMLDivElement>(null);
    const isLoadingRef = useRef<boolean>(false);

    const loadVerses = async (up: boolean, verses: Verse[]) => {
        if (isLoadingRef.current) return;
        isLoadingRef.current = true;

        console.log(`Loading verses: direction = ${up ? 'up' : 'down'}`);
        if (up) {
            setLoadingTop(true);
        } else {
            setLoadingBottom(true);
        }

        const { start, verseCount } = buildMorphologyQuery(up, verseNumber, verses);
        console.log(`    loading verse ${chapterNumber}:${start} (n = ${verseCount})`);
        const loadedVerses = await morphologyService.getMorphology([chapterNumber, start], verseCount, translations);
        const newVerses = up ? [...loadedVerses, ...verses] : [...verses, ...loadedVerses];
        setVerses(newVerses);
        setScrollTarget(
            up
                ? verses.length > 0 ? { verseNumber: verses[0].location[1] - 1 } : undefined
                : undefined
        );

        if (newVerses[0].location[1] === 1) {
            if (!startComplete) console.log('    start complete');
            setStartComplete(true);
        }

        if (newVerses[newVerses.length - 1].location[1] === chapter.verseCount) {
            if (!endComplete) console.log('    end complete');
            setEndComplete(true);
        }

        isLoadingRef.current = false;
        if (up) {
            setLoadingTop(false);
        } else {
            setLoadingBottom(false);
        }
        console.log('    done');
    };

    useEffect(() => {
        setVerses([]);
        setStartComplete(false);
        setEndComplete(false);
        loadVerses(false, []); // avoid stale state
    }, [chapterNumber, verseNumber, translations]);

    useEffect(() => {
        if (!scrollTarget) return;
        const { verseNumber } = scrollTarget;
        const targetElement = verseNumber === 1
            ? loadingRefTop.current
            : document.querySelector(`#${getVerseId([chapterNumber, verseNumber])}`);
        if (targetElement) {
            console.log(`Scrolling to verse ${verseNumber}`)
            targetElement.scrollIntoView();

            const bodyTop = document.body.getBoundingClientRect().top;
            const elementTop = targetElement.getBoundingClientRect().top;
            window.scrollTo({
                top: elementTop - bodyTop - 50,
                behavior: 'smooth'
            });
        }
    }, [verses, scrollTarget]);

    useEffect(() => {
        const observerTop = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting && !isLoadingRef.current && !startComplete && isScrollingUp) {
                loadVerses(true, verses);
            }
        }, intersectionOptions);

        const observerBottom = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting && !isLoadingRef.current && !endComplete) {
                loadVerses(false, verses);
            }
        }, intersectionOptions);

        const loadingTopElement = loadingRefTop.current;
        const loadingBottomElement = loadingRefBottom.current;

        if (loadingTopElement) {
            observerTop.observe(loadingTopElement);
        }

        if (loadingBottomElement) {
            observerBottom.observe(loadingBottomElement);
        }

        return () => {
            if (loadingTopElement) {
                observerTop.unobserve(loadingTopElement);
            }
            if (loadingBottomElement) {
                observerBottom.unobserve(loadingBottomElement);
            }
        };
    }, [verses, loadingTop, loadingBottom, startComplete, endComplete, isScrollingUp]);

    useEffect(() => {
        const handleWheelScroll = (event: WheelEvent) => {
            setIsScrollingUp(event.deltaY < 0);
        };

        // A finger moving down the screen scrolls the content up.
        let lastTouchY: number | undefined;

        const handleTouchStart = (event: TouchEvent) => {
            lastTouchY = event.touches[0].clientY;
        };

        const handleTouchScroll = (event: TouchEvent) => {
            const touchY = event.touches[0].clientY;
            if (lastTouchY !== undefined && touchY !== lastTouchY) {
                setIsScrollingUp(touchY > lastTouchY);
            }
            lastTouchY = touchY;
        };

        window.addEventListener('wheel', handleWheelScroll);
        window.addEventListener('touchstart', handleTouchStart);
        window.addEventListener('touchmove', handleTouchScroll);

        return () => {
            window.removeEventListener('wheel', handleWheelScroll);
            window.removeEventListener('touchstart', handleTouchStart);
            window.removeEventListener('touchmove', handleTouchScroll);
        };
    }, []);

    useEffect(() => {
        const hashLocation = parseHashLocation(hash);
        if (!hashLocation) {
            setWordMorphology(undefined);
            return;
        }

        (async () => {
            showProgress(true);
            setWordMorphology(await morphologyService.getWordMorphology(hashLocation));
            showProgress(false);
        })();
    }, [hash])

    return (
        <Workspace
            navigation={{ chapterNumber }}
            focusMode={true}
            info={wordMorphology && <WordMorphologyView wordMorphology={wordMorphology} />}>
            <div className='word-by-word'>
                <CorpusHeader />
                {loadingTop && <LoadingBanner />}
                <div ref={loadingRefTop} />
                {
                    verses.length > 0 && verses[0].location[1] === 1 &&
                    <>
                        <ChapterHeader chapter={chapter} />
                        <Bismillah className='bismillah' />
                    </>
                }
                {
                    readerMode
                        ? <ReaderView verses={verses} />
                        : <DetailView verses={verses} />
                }
                {loadingBottom && <LoadingBanner />}
                <div ref={loadingRefBottom} />
            </div>
        </Workspace>
    )
}