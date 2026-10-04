import { Link, useLocation } from 'react-router';
import { getPageLocation, getSectionKey, getSections } from './sections';
import { loadLastLocation } from './last-location';
import { combineClassNames } from '../theme/class-names';
import './tab-bar.scss';

// The main sections of the site. Word by Word and Treebank open at the place being read.
export const TabBar = () => {
    const { pathname } = useLocation();
    const current = getSectionKey(pathname);
    const sections = getSections(getPageLocation(pathname) ?? loadLastLocation());

    return (
        <nav className='tab-bar' aria-label='Sections'>
            <ul>
                {
                    sections.map(({ key, label, to }) => (
                        <li key={key}>
                            <Link
                                to={to}
                                className={combineClassNames('tab', key === current ? 'selected' : undefined)}
                                aria-current={key === current ? 'page' : undefined}>
                                {label}
                            </Link>
                        </li>
                    ))
                }
            </ul>
        </nav>
    )
}
