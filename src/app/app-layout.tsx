import { useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router';
import { Qaf } from '../navigation/qaf';
import { TabBar } from '../navigation/tab-bar';
import { QuickJump } from '../navigation/quick-jump';
import { getPageLocation } from '../navigation/sections';
import { saveLastLocation } from '../navigation/last-location';
import { IndeterminateProgressBar } from '../components/indeterminate-progress-bar';
import { useProgress } from './progress-context';
import './app-layout.scss';

// The frame shared by every page: the corpus name, a way to jump to any verse, and the sections.
export const AppLayout = () => {
    const { pathname } = useLocation();
    const { progress } = useProgress();

    useEffect(() => {
        const location = getPageLocation(pathname);
        if (location) saveLastLocation(location);
    }, [pathname]);

    return (
        <div className='app'>
            <header className='app-header'>
                <div className='app-bar'>
                    <Link to='/' className='brand'>
                        <Qaf />
                        <span className='name'>Quranic Arabic Corpus</span>
                    </Link>
                    <QuickJump />
                </div>
                <TabBar />
                {
                    progress &&
                    <div className='progress'>
                        <IndeterminateProgressBar />
                    </div>
                }
            </header>
            <Outlet />
        </div>
    )
}
