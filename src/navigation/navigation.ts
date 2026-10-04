import { Location } from 'react-router';

export type NavigationProps = {
    chapterNumber: number
}

export const getPagePath = (location: Location) => {
    const pathname = location.pathname;
    const index = pathname.indexOf('/', 1);
    return pathname.substring(0, index);
}