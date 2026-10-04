import { useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router';
import { ChapterService } from '../corpus/orthography/chapter-service';
import { SelectorList } from './selector-list';
import { getPagePath } from './navigation';
import { combineClassNames } from '../theme/class-names';
import { container } from 'tsyringe';
import './verse-selector.scss';

type Props = {
    chapterNumber: number,
    onClose: () => void
}

export const VerseSelector = ({ chapterNumber: currentChapter, onClose }: Props) => {
    const chapterService = container.resolve(ChapterService);
    const chapters = chapterService.chapters;
    const verseCount = chapterService.getChapter(currentChapter).verseCount;
    const url = getPagePath(useLocation());
    const currentRef = useRef<HTMLAnchorElement | null>(null);

    // Centers the current chapter in its list without scrolling the page behind the menu.
    useEffect(() => {
        const current = currentRef.current;
        const list = current?.parentElement;
        if (!current || !list) return;
        const offset = current.getBoundingClientRect().top - list.getBoundingClientRect().top;
        list.scrollTop += offset - (list.clientHeight - current.offsetHeight) / 2;
    }, []);

    return (
        <div className='verse-selector'>
            <SelectorList
                header='Chapter'
                length={chapters.length}
                renderItem={i => {
                    const { chapterNumber, phonetic } = chapters[i];
                    const isCurrent = chapterNumber === currentChapter;
                    return (
                        <Link
                            key={chapterNumber}
                            ref={isCurrent ? currentRef : undefined}
                            to={`${url}/${chapterNumber}`}
                            className={combineClassNames('link', isCurrent ? 'current' : undefined)}
                            aria-current={isCurrent ? 'true' : undefined}
                            onClick={onClose}>
                            {chapterNumber}. {phonetic}
                        </Link>
                    )
                }} />
            <SelectorList
                header='Verse'
                length={verseCount}
                renderItem={i => {
                    const verseNumber = i + 1;
                    return (
                        <Link
                            key={verseNumber}
                            to={`${url}/${currentChapter}:${verseNumber}`}
                            className='link'
                            onClick={onClose}>
                            {verseNumber}
                        </Link>
                    )
                }} />
        </div>
    )
}
