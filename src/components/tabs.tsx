import { KeyboardEvent, ReactNode, useId } from 'react';
import './tabs.scss';

export type TabItem = {
    key: string,
    label: string
}

type Props = {
    label: string,
    tabs: TabItem[],
    selected: string,
    onSelect: (key: string) => void,
    children: ReactNode
}

// A set of tabs that switch the panel below them. Arrow keys, Home and End move between tabs.
export const Tabs = ({ label, tabs, selected, onSelect, children }: Props) => {
    const id = useId();
    const tabId = (key: string) => `${id}-tab-${key}`;
    const panelId = `${id}-panel`;

    const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
        let target: number;
        switch (event.key) {
            case 'ArrowRight':
                target = (index + 1) % tabs.length;
                break;
            case 'ArrowLeft':
                target = (index - 1 + tabs.length) % tabs.length;
                break;
            case 'Home':
                target = 0;
                break;
            case 'End':
                target = tabs.length - 1;
                break;
            default:
                return;
        }
        event.preventDefault();
        onSelect(tabs[target].key);
        document.getElementById(tabId(tabs[target].key))?.focus();
    }

    return (
        <div className='tabs'>
            <div className='tab-list' role='tablist' aria-label={label}>
                {
                    tabs.map(({ key, label }, index) => (
                        <button
                            key={key}
                            id={tabId(key)}
                            type='button'
                            role='tab'
                            aria-selected={key === selected}
                            aria-controls={panelId}
                            tabIndex={key === selected ? 0 : -1}
                            onClick={() => onSelect(key)}
                            onKeyDown={event => handleKeyDown(event, index)}>
                            {label}
                        </button>
                    ))
                }
            </div>
            <div id={panelId} className='tab-panel' role='tabpanel' aria-labelledby={tabId(selected)}>
                {children}
            </div>
        </div>
    )
}
