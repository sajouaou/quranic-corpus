import { useState } from 'react';
import { Link } from 'react-router';
import { ChapterService } from '../corpus/orthography/chapter-service';
import { ChapterCoverage, ProgressService } from '../progress/progress-service';
import { Chapter } from '../corpus/orthography/chapter';
import { matchChapters } from '../navigation/chapter-search';
import { formatCount, formatPercent } from '../progress/format';
import { container } from 'tsyringe';
import './chapter-index.scss';

type SortKey = 'number' | 'name' | 'verses' | 'words' | 'treebank';

type Row = {
    chapter: Chapter,
    coverage: ChapterCoverage
}

const columns: { key: SortKey, label: string, numeric?: boolean, optional?: boolean }[] = [
    { key: 'number', label: 'No.', numeric: true },
    { key: 'name', label: 'Chapter' },
    { key: 'verses', label: 'Verses', numeric: true },
    { key: 'words', label: 'Words', numeric: true, optional: true },
    { key: 'treebank', label: 'Treebank', numeric: true }
]

const compare = (key: SortKey, a: Row, b: Row) => {
    switch (key) {
        case 'number':
            return a.chapter.chapterNumber - b.chapter.chapterNumber;
        case 'name':
            return a.chapter.phonetic.localeCompare(b.chapter.phonetic);
        case 'verses':
            return a.chapter.verseCount - b.chapter.verseCount;
        case 'words':
            return a.coverage.words - b.coverage.words;
        case 'treebank':
            return a.coverage.treebankWords / a.coverage.words - b.coverage.treebankWords / b.coverage.words;
    }
}

type TreebankCellProps = {
    row: Row
}

// Verified share of the chapter's words, which opens the treebank. Drafts are shown apart.
const TreebankCell = ({ row: { chapter: { chapterNumber }, coverage } }: TreebankCellProps) => {
    const { words, treebankWords, treebankVerses, draftVerses } = coverage;
    const to = `/treebank/${chapterNumber}:1`;
    if (treebankVerses > 0) {
        return (
            <Link to={to} title={`${formatCount(treebankWords)} of ${formatCount(words)} words verified`}>
                {formatPercent(treebankWords, words)}
            </Link>
        )
    }
    if (draftVerses > 0) {
        return <Link to={to} className='draft' title='AI-generated draft, not reviewed'>Draft</Link>;
    }
    return <span className='none' title='No syntax graphs yet'>&ndash;</span>;
}

export const ChapterIndex = () => {
    const chapterService = container.resolve(ChapterService);
    const progressService = container.resolve(ProgressService);

    const [filter, setFilter] = useState('');
    const [sortKey, setSortKey] = useState<SortKey>('number');
    const [descending, setDescending] = useState(false);

    const sort = (key: SortKey) => {
        setDescending(key === sortKey ? !descending : false);
        setSortKey(key);
    }

    const rows = matchChapters(chapterService.chapters, filter)
        .map(chapter => ({ chapter, coverage: progressService.getChapterCoverage(chapter.chapterNumber) }))
        .sort((a, b) => (descending ? -1 : 1) * compare(sortKey, a, b));
    const hasDrafts = rows.some(({ coverage }) => coverage.treebankVerses === 0 && coverage.draftVerses > 0);

    return (
        <section className='chapter-index'>
            <div className='heading'>
                <h2 className='visually-hidden'>Chapters</h2>
                <input
                    type='search'
                    value={filter}
                    placeholder='Filter by number or name'
                    aria-label='Filter chapters by number or name'
                    onChange={e => setFilter(e.target.value)} />
            </div>
            <p className='hint' aria-live='polite'>
                {rows.length} of {chapterService.chapters.length} chapters. Select a chapter to read it word by word,
                or a treebank figure to see its syntax graphs.
            </p>
            <table>
                <caption className='visually-hidden'>Chapters of the Quran</caption>
                <thead>
                    <tr>
                        {
                            columns.map(({ key, label, numeric, optional }) => (
                                <th
                                    key={key}
                                    scope='col'
                                    className={[numeric ? 'numeric' : '', optional ? 'optional' : ''].join(' ').trim() || undefined}
                                    aria-sort={key === sortKey ? (descending ? 'descending' : 'ascending') : 'none'}>
                                    <button type='button' onClick={() => sort(key)}>
                                        {label}
                                        <span className='arrow' aria-hidden='true'>
                                            {key === sortKey ? (descending ? '▾' : '▴') : ''}
                                        </span>
                                    </button>
                                </th>
                            ))
                        }
                    </tr>
                </thead>
                <tbody>
                    {
                        rows.map(row => {
                            const { chapter, coverage } = row;
                            const { chapterNumber, phonetic, translation, verseCount, city } = chapter;
                            return (
                                <tr key={chapterNumber}>
                                    <td className='numeric'>{chapterNumber}</td>
                                    <td>
                                        <Link to={`/wordbyword/${chapterNumber}`} className='name'>{phonetic}</Link>
                                        <span className='detail'>
                                            {translation}
                                            {translation && <span className='separator'>&middot;</span>}
                                            {city}
                                        </span>
                                    </td>
                                    <td className='numeric'>{verseCount}</td>
                                    <td className='numeric optional'>{formatCount(coverage.words)}</td>
                                    <td className='numeric'><TreebankCell row={row} /></td>
                                </tr>
                            )
                        })
                    }
                </tbody>
            </table>
            {
                rows.length === 0 &&
                <p className='empty'>No chapters found.</p>
            }
            <p className='note'>
                Treebank: share of the chapter's words in verified syntax graphs.
                {hasDrafts && <> Draft: AI-generated draft, not reviewed.</>}
            </p>
        </section>
    )
}
