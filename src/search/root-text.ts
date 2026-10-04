import { RootForm } from './root-service';

const numberWords = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];

// Small numbers are written as words, as in "six derived forms".
export const formatNumber = (n: number) => n < numberWords.length ? numberWords[n] : String(n)

export const formatTimes = (n: number) => {
    if (n === 1) return 'once';
    if (n === 2) return 'twice';
    return `${formatNumber(n)} times`;
}

// Verbs always state their form. Participles and verbal nouns state it unless it is form I.
const hasNamedForm = ({ type, form }: RootForm) => form !== undefined && (type === 'verb' || form !== 'I')

// For example "form II verb", "noun" or "form IV active participle".
export const describeForm = (form: RootForm) => hasNamedForm(form) ? `form ${form.form} ${form.type}` : form.type

// For example "Verb (form II)", "Noun" or "Active participle (form IV)".
export const formatFormHeading = (form: RootForm) => {
    const type = form.type.charAt(0).toUpperCase() + form.type.substring(1);
    return hasNamedForm(form) ? `${type} (form ${form.form})` : type;
}

export const describeRootLength = (root: string) => root.length === 3 ? 'triliteral' : 'quadriliteral'
