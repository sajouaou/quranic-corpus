import { Link, isRouteErrorResponse, useRouteError } from 'react-router';
import { CalligraphyLogo } from '../components/calligraphy-logo';
import { CorpusError, ErrorCode } from './corpus-error';
import { Footer } from '../components/footer';
import './error-page.scss';

const errorCodeDescriptionMap = new Map<ErrorCode, string>([
    ['404', 'We\'re sorry, the page you were looking for couldn\'t be found.']
]);

export const ErrorPage = () => {
    const e = useRouteError();
    console.error(e);

    let message = e instanceof Error ? (e as Error).message : 'Something went wrong!';

    let description;
    if (e instanceof CorpusError) {
        description = errorCodeDescriptionMap.get(e.code);

    } else if (isRouteErrorResponse(e)) {
        message = e.statusText;
        description = e.data;

        if (e.status === 404) {
            message = 'Page not found';
            description = errorCodeDescriptionMap.get('404');
        }
    }

    return (
        <div className='error-page'>
            <CalligraphyLogo />
            <h1>{message}</h1>
            {
                description &&
                <p className='description'>{description}</p>
            }
            <p>
                <Link to='/'>The Quranic Arabic Corpus</Link>
            </p>
            <Footer />
        </div>
    )
}