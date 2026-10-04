import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { RootMatch, RootService } from './root-service';
import { formatRootArabic, formatRootName, getRootUrl } from './root';
import { formatCount } from '../progress/format';
import { container } from 'tsyringe';
import './root-search-box.scss';

const maxMatchCount = 12;

export const RootSearchBox = () => {
    const rootService = container.resolve(RootService);
    const navigate = useNavigate();

    const [query, setQuery] = useState('');
    const [matches, setMatches] = useState<RootMatch[]>([]);

    useEffect(() => {
        let stale = false;
        if (query.trim()) {
            rootService.search(query).then(matches => {
                if (!stale) setMatches(matches);
            });
        } else {
            setMatches([]);
        }
        return () => {
            stale = true;
        };
    }, [query, rootService]);

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (matches.length > 0) {
            setQuery('');
            navigate(getRootUrl(matches[0].root));
        }
    }

    return (
        <form className='root-search-box' role='search' onSubmit={handleSubmit}>
            <input
                type='search'
                dir='auto'
                value={query}
                placeholder='ع ل م or ʿayn lām mīm'
                aria-label='Root, in Arabic letters or letter names'
                onFocus={() => rootService.load()}
                onChange={e => setQuery(e.target.value)} />
            {
                query.trim() &&
                <ul>
                    {
                        matches.slice(0, maxMatchCount).map(({ root, count }) => (
                            <li key={root}>
                                <Link to={getRootUrl(root)} onClick={() => setQuery('')}>
                                    <span className='arabic'>{formatRootArabic(root)}</span>
                                    <span className='name'>{formatRootName(root)}</span>
                                    <span className='count'>{formatCount(count)}</span>
                                </Link>
                            </li>
                        ))
                    }
                    {
                        matches.length > maxMatchCount &&
                        <li className='note'>{formatCount(matches.length - maxMatchCount)} more roots. Add a letter to narrow the list.</li>
                    }
                    {
                        matches.length === 0 &&
                        <li className='note'>No roots found.</li>
                    }
                </ul>
            }
        </form>
    )
}
