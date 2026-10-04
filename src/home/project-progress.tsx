import { CSSProperties } from 'react';
import { ChapterService } from '../corpus/orthography/chapter-service';
import { ChapterCoverage, ProgressService } from '../progress/progress-service';
import { ProgressBar } from '../components/progress-bar';
import { formatCount } from '../progress/format';
import { container } from 'tsyringe';
import './project-progress.scss';

// The verified share of a chapter, followed by its share of unreviewed drafts.
const coverageStyle = (verified: number, draft: number) => ({
    '--verified': `${verified * 100}%`,
    '--draft': `${(verified + draft) * 100}%`
}) as CSSProperties

const describeCoverage = ({ words, treebankWords, draftWords }: ChapterCoverage) => {
    const verified = `${formatCount(treebankWords)} of ${formatCount(words)} words verified`;
    return draftWords > 0 ? `${verified}, ${formatCount(draftWords)} in AI-generated drafts` : verified;
}

export const ProjectProgress = () => {
    const chapterService = container.resolve(ChapterService);
    const progressService = container.resolve(ProgressService);

    const { morphologyWords, treebankWords, treebankVerses, treebankChapters, draftWords, draftVerses } = progressService;
    const hasDrafts = draftWords.count > 0;
    const chapterSummary = `${treebankChapters.count} of ${treebankChapters.total} chapters complete`;
    const sourceDate = progressService.sourceDate.toLocaleDateString(
        'en-GB',
        { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

    return (
        <section className='project-progress'>
            <h2>Project progress</h2>
            <div className='bars'>
                <ProgressBar label='Morphology' unit='words' {...morphologyWords} />
                <ProgressBar label='Quranic Treebank' unit='words verified' {...treebankWords} />
                {
                    hasDrafts &&
                    <ProgressBar
                        className='draft'
                        label='Treebank drafts awaiting review'
                        unit='words, AI-generated'
                        {...draftWords} />
                }
            </div>
            <div className='chapter-coverage'>
                <h3>Treebank coverage by chapter</h3>
                <div className='map' role='img' aria-label={chapterSummary}>
                    {
                        chapterService.chapters.map(({ chapterNumber, phonetic }) => {
                            const coverage = progressService.getChapterCoverage(chapterNumber);
                            const { words, treebankWords, draftWords } = coverage;
                            return (
                                <span
                                    key={chapterNumber}
                                    className='cell'
                                    style={coverageStyle(treebankWords / words, draftWords / words)}
                                    title={`${chapterNumber}. ${phonetic}: ${describeCoverage(coverage)}`} />
                            )
                        })
                    }
                </div>
                <div className='legend'>
                    <span><span className='cell' style={coverageStyle(1, 0)} />Verified</span>
                    {hasDrafts && <span><span className='cell' style={coverageStyle(0, 1)} />AI-generated draft, not reviewed</span>}
                    <span><span className='cell' style={coverageStyle(0, 0)} />None</span>
                </div>
                <p className='summary'>
                    {chapterSummary}, {formatCount(treebankVerses.count)} of {formatCount(treebankVerses.total)} verses verified.
                    {
                        hasDrafts &&
                        <> A further {formatCount(draftVerses.count)} verses have AI-generated drafts that have not been reviewed.</>
                    }
                </p>
            </div>
            <p className='source'>
                Measured from the <a href={progressService.sourceUrl}>corpus data files</a> of {sourceDate}.
            </p>
        </section>
    )
}
