import { Location } from 'react-router';

export type NavigationProps = {
    chapterNumber: number,
    showViewOptions?: boolean
}

export const getPagePath = (location: Location) => {
    const pathname = location.pathname;
    const index = pathname.indexOf('/', 1);
    return pathname.substring(0, index);
}

// The height of the header and toolbar that stay at the top of the window while the page scrolls.
export const getStickyHeight = () => {
    const elements = document.querySelectorAll<HTMLElement>('.app-header, .context-bar');
    return Array.from(elements).reduce((height, element) => height + element.offsetHeight, 0);
}
