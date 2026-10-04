import { Link, useLocation } from 'react-router';
import { ChapterService } from '../corpus/orthography/chapter-service';
import { Dropdown } from '../components/dropdown';
import { VerseSelector } from './verse-selector';
import { ViewOptions } from './view-options';
import { NavigationProps, getPagePath } from './navigation';
import { container } from 'tsyringe';
import './context-bar.scss';

type StepProps = {
    to?: string,
    label: string,
    direction: 'prev' | 'next'
}

const Step = ({ to, label, direction }: StepProps) => {
    const chevron = (
        <svg viewBox='0 0 24 24' aria-hidden='true'>
            <polyline points={direction === 'prev' ? '15 5 8 12 15 19' : '9 5 16 12 9 19'} />
        </svg>
    );
    return to
        ? <Link to={to} className='step' title={label} aria-label={label}>{chevron}</Link>
        : <span className='step disabled' aria-hidden='true'>{chevron}</span>
}

// The toolbar of the pages that show a chapter: where you are, how to move, and how to display it.
export const ContextBar = ({ chapterNumber, showViewOptions }: NavigationProps) => {
    const chapterService = container.resolve(ChapterService);
    const chapter = chapterService.getChapter(chapterNumber);
    const { chapters } = chapterService;
    const pagePath = getPagePath(useLocation());

    return (
        <div className='context-bar' role='toolbar' aria-label='Chapter tools'>
            <div className='location'>
                <Dropdown
                    className='chapter'
                    title='Choose a chapter or verse'
                    label={<><span className='number'>{chapter.chapterNumber}</span>{chapter.phonetic}</>}>
                    {close => <VerseSelector chapterNumber={chapterNumber} onClose={close} />}
                </Dropdown>
                <div className='steps'>
                    <Step
                        direction='prev'
                        label='Previous chapter'
                        to={chapterNumber > 1 ? `${pagePath}/${chapterNumber - 1}` : undefined} />
                    <Step
                        direction='next'
                        label='Next chapter'
                        to={chapterNumber < chapters.length ? `${pagePath}/${chapterNumber + 1}` : undefined} />
                </div>
                <span className='facts'>
                    {chapter.translation && <>{chapter.translation}<span className='separator'>&middot;</span></>}
                    {chapter.city}<span className='separator'>&middot;</span>{chapter.verseCount} verses
                </span>
            </div>
            {showViewOptions && <ViewOptions />}
        </div>
    )
}
