import { RefObject } from 'react';

export type SVGWordElement = {
    locationRef: RefObject<SVGTextElement | null>,
    phoneticRef: RefObject<SVGTextElement | null>,
    translationRef: RefObject<SVGTextElement | null>,
    braRef?: RefObject<SVGTextElement | null>,
    tokenRef: RefObject<SVGTextElement | null>,
    ketRef?: RefObject<SVGTextElement | null>,
    posTagRefs: RefObject<SVGTextElement | null>[]
}

export type SVGDom = {
    wordElements: SVGWordElement[],
    phraseTagRefs: RefObject<SVGTextElement | null>[],
    dependencyTagRefs: RefObject<SVGTextElement | null>[]
}