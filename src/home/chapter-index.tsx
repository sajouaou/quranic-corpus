import { useState } from 'react';
import { Link } from 'react-router';
import { ChapterService } from '../corpus/orthography/chapter-service';
import { ProgressService } from '../progress/progress-service';
import { container } from 'tsyringe';
import makkah from '../images/makkah.svg';
import madinah from '../images/madinah.svg';
import './chapter-index.scss';

const collapsedChapterCount = 12;

// Lets "fatihah" match "Al-Fātiḥah".
const normalize = (text: string) => text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9 ]/gi, '')
    .toLowerCase();

export const ChapterIndex = () => {
    const chapterService = container.resolve(ChapterService);
    const progressService = container.resolve(ProgressService);

    const [filter, setFilter] = useState('');
    const [expanded, setExpanded] = useState(false);

    const query = normalize(filter.trim());
    const matches = chapterService.chapters.filter(({ chapterNumber, phonetic, translation }) =>
        !query
        || String(chapterNumber) === query
        || normalize(phonetic).includes(query)
        || (translation !== undefined && normalize(translation).includes(query)));
    const chapters = query || expanded ? matches : matches.slice(0, collapsedChapterCount);

    return (
        <section className='chapter-index'>
            <div className='heading'>
                <h2>Chapters</h2>
                <input
                    type='search'
                    value={filter}
                    placeholder='Find a chapter'
                    aria-label='Find a chapter'
                    onChange={e => setFilter(e.target.value)} />
            </div>
            <ul>
                {
                    chapters.map(({ chapterNumber, phonetic, translation, city, verseCount }) => (
                        <li key={chapterNumber}>
                            <Link to={`/wordbyword/${chapterNumber}`} className='chapter'>
                                <span className='number'>{chapterNumber}</span>
                                <span className='name'>
                                    <span className='phonetic'>{phonetic}</span>
                                    {translation && <span className='translation'>{translation}</span>}
                                </span>
                                <span className='verses'>
                                    <img src={city === 'Makkah' ? makkah : madinah} alt={city} title={city} />
                                    {verseCount} verses
                                </span>
                            </Link>
                            {
                                progressService.getChapterCoverage(chapterNumber).treebankVerses > 0
                                    ? <Link to={`/treebank/${chapterNumber}:1`} className='treebank-link'>Treebank</Link>
                                    : progressService.getChapterCoverage(chapterNumber).draftVerses > 0 &&
                                    <Link to={`/treebank/${chapterNumber}:1`} className='treebank-link draft'>Treebank draft</Link>
                            }
                        </li>
                    ))
                }
            </ul>
            {
                matches.length === 0 &&
                <p className='empty'>No chapters found.</p>
            }
            {
                !query &&
                <button type='button' className='toggle' onClick={() => setExpanded(!expanded)}>
                    {expanded ? 'Show fewer chapters' : `Show all ${matches.length} chapters`}
                </button>
            }
        </section>
    )
}
