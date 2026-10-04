import { ReactNode, useEffect, useRef, useState } from 'react';
import { ChevronDown } from './chevron-down';
import { combineClassNames } from '../theme/class-names';
import './dropdown.scss';

type Props = {
    className?: string,
    label: ReactNode,
    title: string,
    align?: 'left' | 'right',
    children: (close: () => void) => ReactNode
}

export const Dropdown = ({ className, label, title, align = 'left', children }: Props) => {
    const [open, setOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement | null>(null);
    const buttonRef = useRef<HTMLButtonElement | null>(null);

    useEffect(() => {
        if (!open) return;

        const handleMouseDown = (event: MouseEvent) => {
            if (!dropdownRef.current?.contains(event.target as Node)) {
                setOpen(false);
            }
        };

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setOpen(false);
                buttonRef.current?.focus();
            }
        };

        document.addEventListener('mousedown', handleMouseDown);
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('mousedown', handleMouseDown);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [open]);

    return (
        <div ref={dropdownRef} className={combineClassNames('dropdown', className)}>
            <button
                ref={buttonRef}
                type='button'
                className='trigger'
                title={title}
                aria-haspopup='true'
                aria-expanded={open}
                onClick={() => setOpen(!open)}>
                <span className='label'>{label}</span>
                <ChevronDown className='chevron' />
            </button>
            {
                open &&
                <div className={combineClassNames('panel', align)}>
                    {children(() => setOpen(false))}
                </div>
            }
        </div>
    )
}
