import { Link } from 'react-router';
import { ChapterService } from '../corpus/orthography/chapter-service';
import { CalligraphyLogo } from '../components/calligraphy-logo';
import { Footer } from '../components/footer';
import { ProjectProgress } from './project-progress';
import { ChapterIndex } from './chapter-index';
import { container } from 'tsyringe';
import slack from '../images/slack.svg';
import github from '../images/github.svg';
import './home.scss';

const randomNumberInInterval = (a: number, b: number) => {
    return Math.floor(Math.random() * (b - a + 1)) + a;
}

const randomWordByWordLink = () => {
    const chapterNumber = randomNumberInInterval(1, 114);
    return `/wordbyword/${chapterNumber}`;
}

const randomTreebankLink = () => {
    const [a, b] = Math.random() < 0.5 ? [1, 8] : [59, 114];
    const chapterNumber = randomNumberInInterval(a, b);
    const chapterService = container.resolve(ChapterService);
    const verseNumber = randomNumberInInterval(1, chapterService.chapters[chapterNumber - 1].verseCount);
    return `/treebank/${chapterNumber}:${verseNumber}`;
}

export const Home = () => {
    return (
        <div className='home'>
            <section className='hero'>
                <Link to={randomWordByWordLink()}>
                    <CalligraphyLogo />
                </Link>
                <h1>The Quranic Arabic Corpus</h1>
                <p className='intro'>
                    The world's most popular site for learning Quranic Arabic.
                    An Artificial Intelligence (AI) analyzed the entire Quran, <strong>reviewed and corrected by scholars</strong>, to provide
                    deep insights into the Quran's <strong>morphology</strong>, <strong>syntax</strong>,
                    and <strong>semantics</strong>.
                </p>
                <p>
                    To help learners, the corpus features unique color-coded grammar diagrams
                    based on <strong><em>i’rāb</em> (إعراب)</strong>, the traditional science of Arabic linguistics, in the Quranic Treebank.
                </p>
                <div className='links'>
                    <Link to={randomWordByWordLink()}>Quran Word by Word</Link>
                    <Link to={randomTreebankLink()}>Quranic Treebank</Link>
                    <Link to='/roots'>Search by Root</Link>
                </div>
            </section>
            <ProjectProgress />
            <ChapterIndex />
            <section className='community'>
                <p>
                    The corpus provides a <strong>supportive community</strong> for learning Quranic Arabic.
                    It is a free, open-source, Wikipedia-style project, and we encourage collaboration, discussion and
                    continuous improvement.
                </p>
                <div className='projects'>
                    <a href='https://join.slack.com/t/quraniccorpus/shared_invite/zt-1zp5zdz5w-b7hbwYPlZABDMm19ZeKWdA'>
                        <img src={slack} alt='Slack' />
                    </a>
                    <a href='https://github.com/kaisdukes/quranic-corpus'>
                        <img src={github} alt='GitHub' />
                    </a>
                </div>
            </section>
            <Footer />
        </div>
    )
}
