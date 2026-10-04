import { Fragment, useMemo } from 'react';
import { MarkupParser } from '../corpus/nlg/markup-parser';
import './markup-view.scss';

type Props = {
    markup: string
}

export const MarkupView = ({ markup }: Props) => {

    const spans = useMemo(() => {
        const markupParser = new MarkupParser(markup);
        return markupParser.parse();
    }, [markup]);

    return (
        <>
            {
                spans.map((span, index) => {
                    switch (span.type) {
                        case 'phonetic':
                            return <em key={index} className='markup'>{span.text}</em>;
                        case 'arabic':
                            return <Fragment key={index}>{'('}<span className='markup'>{span.text}</span>{')'}</Fragment>;
                        default:
                            return <Fragment key={index}>{span.text}</Fragment>;
                    }
                })
            }
        </>
    );
}