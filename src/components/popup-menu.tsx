import { ReactNode, RefObject } from 'react';
import './popup-menu.scss';

type Props = {
    ref: RefObject<HTMLDivElement | null>,
    showPopup: boolean,
    children: ReactNode
}

export const PopupMenu = ({ ref, showPopup, children }: Props) => {
    return (
        <div ref={ref} className={`popup-menu ${showPopup ? 'visible' : ''}`}>
            {children}
        </div>
    )
}