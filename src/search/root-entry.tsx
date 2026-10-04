import { useCallback, useEffect, useRef, useState } from 'react';
import { Verse } from '../corpus/orthography/verse';
import { Location } from '../corpus/orthography/location';
import { MorphologyService } from '../corpus/morphology/morphology-service';
import { LoadingBanner } from '../components/loading-banner';
import { RootForm, RootService } from './root-service';
import { RootFormGroup } from './root-form-group';
import { formatRootArabic, formatRootName } from './root';
import { describeForm, describeRootLength, formatNumber, formatTimes } from './root-text';
import { container } from 'tsyringe';

type FormProps = {
    form: RootForm
}

// For example: the form II verb sammā (سَمَّىٰ)
const FormDescription = ({ form }: FormProps) => (
    <>
        the {describeForm(form)} <em>{form.phonetic}</em> (<span className='arabic'>{form.lemma}</span>)
    </>
)

type Props = {
    root: string
}

export const RootEntry = ({ root }: Props) => {
    const rootService = container.resolve(RootService);
    const morphologyService = container.resolve(MorphologyService);

    const [forms, setForms] = useState<RootForm[]>();

    useEffect(() => {
        rootService.getForms(root).then(setForms);
    }, [root, rootService]);

    // Several derived forms can occur in the same verse, so each verse is fetched once.
    const verseCache = useRef(new Map<string, Promise<Verse>>());
    const getVerse = useCallback(([chapterNumber, verseNumber]: Location) => {
        const key = `${chapterNumber}:${verseNumber}`;
        let verse = verseCache.current.get(key);
        if (!verse) {
            verse = morphologyService.getMorphology([chapterNumber, verseNumber], 1, []).then(verses => verses[0]);
            verseCache.current.set(key, verse);
        }
        return verse;
    }, [morphologyService]);

    if (!forms) {
        return <LoadingBanner />;
    }

    const count = forms.reduce((sum, form) => sum + form.words.length, 0);
    const name = <><em>{formatRootName(root)}</em> (<span className='arabic'>{formatRootArabic(root)}</span>)</>;

    return (
        <section className='root-entry'>
            <h2>
                <span className='arabic'>{formatRootArabic(root)}</span>
                <span className='name'>{formatRootName(root)}</span>
            </h2>
            {
                forms.length === 0 &&
                <p>This root does not occur in the Quran.</p>
            }
            {
                forms.length === 1 &&
                <p>
                    The {describeRootLength(root)} root {name} occurs {count === 1 ? 'only once in the Quran,' : `${formatTimes(count)} in the Quran`} as <FormDescription form={forms[0]} />.
                </p>
            }
            {
                forms.length > 1 &&
                <>
                    <p>
                        The {describeRootLength(root)} root {name} occurs {formatTimes(count)} in the Quran,
                        in {formatNumber(forms.length)} derived forms:
                    </p>
                    <ul className='forms'>
                        {
                            forms.map((form, i) => (
                                <li key={i}>
                                    <a href={`#form-${i + 1}`}>{formatTimes(form.words.length)}</a> as <FormDescription form={form} />
                                </li>
                            ))
                        }
                    </ul>
                </>
            }
            {
                forms.length > 0 &&
                <p className='note'>
                    {count === 1 ? 'The translation below is a brief gloss' : 'The translations below are brief glosses'} intended
                    as a guide to meaning. An Arabic word may have a range of meanings depending on
                    context. Select a location to read the verse, or a word in red for more linguistic
                    information.
                </p>
            }
            {
                forms.map((form, i) => (
                    <RootFormGroup key={i} id={`form-${i + 1}`} form={form} getVerse={getVerse} />
                ))
            }
        </section>
    )
}
