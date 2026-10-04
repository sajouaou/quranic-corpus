import { KeyboardEvent, useEffect, useId, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { ChapterService } from '../corpus/orthography/chapter-service';
import { formatLocation } from '../corpus/orthography/location';
import { getSuggestions, Suggestion } from './chapter-search';
import { getSectionKey } from './sections';
import { combineClassNames } from '../theme/class-names';
import { container } from 'tsyringe';
import './quick-jump.scss';

const isTextField = (element: Element | null) =>
    element instanceof HTMLInputElement
    || element instanceof HTMLTextAreaElement
    || (element instanceof HTMLElement && element.isContentEditable);

// Opens a chapter or verse typed as "2:255", "2", or a name such as "baqarah". The "/" key
// moves focus here from anywhere on the page.
export const QuickJump = () => {
    const chapterService = container.resolve(ChapterService);
    const navigate = useNavigate();
    const { pathname } = useLocation();
    const listId = useId();

    const [query, setQuery] = useState('');
    const [open, setOpen] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);
    const formRef = useRef<HTMLFormElement | null>(null);
    const inputRef = useRef<HTMLInputElement | null>(null);

    const suggestions = useMemo(
        () => getSuggestions(chapterService.chapters, query),
        [chapterService, query]);
    const page = getSectionKey(pathname) === 'treebank' ? 'treebank' : 'wordbyword';
    const showList = open && query.trim() !== '';

    useEffect(() => {
        const handleKeyDown = (event: globalThis.KeyboardEvent) => {
            if (event.key !== '/' || event.ctrlKey || event.metaKey || event.altKey) return;
            if (isTextField(document.activeElement)) return;
            event.preventDefault();
            setExpanded(true);
            inputRef.current?.focus();
        };

        const handleMouseDown = (event: MouseEvent) => {
            if (!formRef.current?.contains(event.target as Node)) {
                setOpen(false);
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('mousedown', handleMouseDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('mousedown', handleMouseDown);
        };
    }, []);

    useEffect(() => {
        if (expanded) inputRef.current?.focus();
    }, [expanded]);

    // Whatever was typed has been answered, or is no longer relevant, once the page changes.
    useEffect(() => {
        setQuery('');
        setOpen(false);
        setExpanded(false);
    }, [pathname]);

    const close = () => {
        setQuery('');
        setOpen(false);
        setExpanded(false);
        inputRef.current?.blur();
    }

    const go = (suggestion?: Suggestion) => {
        if (!suggestion) return;
        navigate(`/${page}/${formatLocation(suggestion.location)}`);
        close();
    }

    const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        switch (event.key) {
            case 'ArrowDown':
                event.preventDefault();
                setOpen(true);
                setActiveIndex((activeIndex + 1) % Math.max(suggestions.length, 1));
                break;
            case 'ArrowUp':
                event.preventDefault();
                setActiveIndex((activeIndex - 1 + suggestions.length) % Math.max(suggestions.length, 1));
                break;
            case 'Escape':
                if (open) {
                    setOpen(false);
                } else {
                    close();
                }
                break;
        }
    }

    return (
        <form
            ref={formRef}
            className={combineClassNames('quick-jump', expanded ? 'expanded' : undefined)}
            role='search'
            onSubmit={e => {
                e.preventDefault();
                go(suggestions[activeIndex]);
            }}>
            <button
                type='button'
                className='toggle'
                aria-label='Go to a verse or chapter'
                aria-expanded={expanded}
                onClick={() => setExpanded(!expanded)}>
                <svg viewBox='0 0 24 24' aria-hidden='true'>
                    <circle cx='10.5' cy='10.5' r='6.5' />
                    <path d='M15.5 15.5 21 21' />
                </svg>
            </button>
            <div className='field'>
                <input
                    ref={inputRef}
                    type='text'
                    role='combobox'
                    value={query}
                    placeholder='Go to verse or chapter, e.g. 2:255'
                    aria-label='Go to verse or chapter'
                    aria-expanded={showList}
                    aria-controls={showList ? listId : undefined}
                    aria-autocomplete='list'
                    aria-activedescendant={showList && suggestions.length > 0 ? `${listId}-${activeIndex}` : undefined}
                    autoComplete='off'
                    spellCheck={false}
                    onChange={e => {
                        setQuery(e.target.value);
                        setActiveIndex(0);
                        setOpen(true);
                    }}
                    onFocus={() => setOpen(true)}
                    onKeyDown={handleKeyDown} />
                <kbd aria-hidden='true'>/</kbd>
                {
                    showList &&
                    <ul id={listId} role='listbox' aria-label='Matching places'>
                        {
                            suggestions.length === 0
                                ? <li className='empty' role='option' aria-disabled='true' aria-selected='false'>No chapter or verse found</li>
                                : suggestions.map((suggestion, i) => (
                                    <li
                                        key={suggestion.title}
                                        id={`${listId}-${i}`}
                                        role='option'
                                        aria-selected={i === activeIndex}
                                        className={i === activeIndex ? 'active' : undefined}
                                        onMouseEnter={() => setActiveIndex(i)}
                                        onMouseDown={e => e.preventDefault()}
                                        onClick={() => go(suggestion)}>
                                        <span className='title'>{suggestion.title}</span>
                                        {suggestion.detail && <span className='detail'>{suggestion.detail}</span>}
                                    </li>
                                ))
                        }
                    </ul>
                }
            </div>
        </form>
    )
}
