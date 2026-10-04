import { Link, useSearchParams } from 'react-router';
import { ChapterService } from '../corpus/orthography/chapter-service';
import { Footer } from '../components/footer';
import { Tabs, TabItem } from '../components/tabs';
import { ProjectProgress } from './project-progress';
import { ChapterIndex } from './chapter-index';
import { Sources } from './sources';
import { loadLastLocation } from '../navigation/last-location';
import { container } from 'tsyringe';
import './home.scss';

const tabs: TabItem[] = [
    { key: 'chapters', label: 'Chapters' },
    { key: 'coverage', label: 'Project progress' },
    { key: 'sources', label: 'Sources' }
]

const defaultTab = tabs[0].key;

type EntryProps = {
    to: string,
    title: string,
    description: string,
    detail?: string
}

const Entry = ({ to, title, description, detail }: EntryProps) => (
    <Link to={to} className='entry'>
        <span className='title'>{title}</span>
        <span className='description'>{description}</span>
        {detail && <span className='detail'>{detail}</span>}
    </Link>
)

export const Home = () => {
    const chapterService = container.resolve(ChapterService);
    const [searchParams, setSearchParams] = useSearchParams();

    const tabParam = searchParams.get('tab');
    const selectedTab = tabs.some(tab => tab.key === tabParam) ? tabParam! : defaultTab;

    const lastLocation = loadLastLocation();
    const [lastChapter, lastVerse] = lastLocation?.split(':').map(Number) ?? [];
    const lastPlace = lastChapter
        ? `${chapterService.getChapter(lastChapter).phonetic}${lastVerse ? ` ${lastChapter}:${lastVerse}` : ''}`
        : undefined;

    return (
        <div className='home'>
            <header className='intro'>
                <h1>The Quranic Arabic Corpus</h1>
                <p>
                    The world's most popular site for learning Quranic Arabic.
                    An Artificial Intelligence (AI) analyzed the entire Quran, <strong>reviewed and corrected by scholars</strong>, to provide
                    deep insights into the Quran's <strong>morphology</strong>, <strong>syntax</strong>,
                    and <strong>semantics</strong>.
                </p>
                <p>
                    To help learners, the corpus features unique color-coded grammar diagrams
                    based on <strong><em>i’rāb</em> (إعراب)</strong>, the traditional science of Arabic linguistics, in the Quranic Treebank.
                </p>
            </header>
            <nav className='entries' aria-label='Start reading'>
                <Entry
                    to={`/wordbyword/${lastLocation ?? 1}`}
                    title='Word by Word'
                    description='The Quran word by word, with transliteration, translations and morphology.'
                    detail={lastPlace && `Continue at ${lastPlace}`} />
                <Entry
                    to={`/treebank/${lastLocation ?? '1:1'}`}
                    title='Treebank'
                    description='Syntax graphs of verses, based on i’rāb.' />
                <Entry
                    to='/roots'
                    title='Dictionary'
                    description='The words of the Quran, listed by root.' />
            </nav>
            <Tabs
                label='Corpus data'
                tabs={tabs}
                selected={selectedTab}
                onSelect={key => setSearchParams(key === defaultTab ? {} : { tab: key }, { replace: true })}>
                {selectedTab === 'chapters' && <ChapterIndex />}
                {selectedTab === 'coverage' && <ProjectProgress />}
                {selectedTab === 'sources' && <Sources />}
            </Tabs>
            <Footer />
        </div>
    )
}
