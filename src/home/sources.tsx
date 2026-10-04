import slack from '../images/slack.svg';
import github from '../images/github.svg';
import notice from '../../NOTICE?raw';
import './sources.scss';

export const Sources = () => {
    return (
        <section className='sources'>
            <h2 className='visually-hidden'>Sources and licence</h2>
            <dl>
                <div>
                    <dt>Morphological annotation</dt>
                    <dd>
                        <a href='http://corpus.quran.com'>Quranic Arabic Corpus</a>, under the GNU General Public
                        License. Its copyright notice is reproduced below.
                    </dd>
                </div>
                <div>
                    <dt>Quran text</dt>
                    <dd><a href='http://tanzil.info'>Tanzil</a></dd>
                </div>
                <div>
                    <dt>Source code</dt>
                    <dd>
                        <a href='https://github.com/kaisdukes/quranic-corpus'>quranic-corpus</a> (this website) and
                        {' '}<a href='https://github.com/kaisdukes/quranic-corpus-api'>quranic-corpus-api</a> (data and API)
                    </dd>
                </div>
                <div>
                    <dt>Community</dt>
                    <dd className='community'>
                        <a href='https://join.slack.com/t/quraniccorpus/shared_invite/zt-1zp5zdz5w-b7hbwYPlZABDMm19ZeKWdA'>
                            <img src={slack} alt='Slack' />
                        </a>
                        <a href='https://github.com/kaisdukes/quranic-corpus'>
                            <img src={github} alt='GitHub' />
                        </a>
                    </dd>
                </div>
            </dl>
            <h3>Copyright notice</h3>
            <pre tabIndex={0} aria-label='Copyright notice of the Quranic Arabic Corpus'>{notice}</pre>
        </section>
    )
}
