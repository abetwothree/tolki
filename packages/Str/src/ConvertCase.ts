import {toUpper, toLower, lowerFirst, upperFirst} from 'lodash-es';

export const CaseTypes = {
    upper: 'upper',
    lower: 'lower',
    title: 'title',
    fold: 'fold',
    simple: 'simple',
    lower_simple: 'lower_simple',
    title_simple: 'title_simple',
    fold_simple: 'fold_simple',
} as const;

export type ConvertCaseMode = (typeof CaseTypes)[keyof typeof CaseTypes];

export class ConvertCase {

    constructor(private value: string, private mode: ConvertCaseMode) { }
    
    public convert(): string {
        switch (this.mode) {
            case CaseTypes.upper:
                return toUpper(this.value);
            case CaseTypes.lower:
                return toLower(this.value);
            case CaseTypes.title:
                return upperFirst(this.value);
            case CaseTypes.fold:
                return this.value.normalize("NFKD").toLowerCase();
            case CaseTypes.simple:
                return this.value.replace(/[^a-z0-9]+/g, ' ').trim();
            case CaseTypes.lower_simple:
                return lowerFirst(this.value).replace(/[^a-z0-9]+/g, ' ').trim();
            case CaseTypes.title_simple:
                return this.value.split(/[^a-z0-9]+/g).map(word => upperFirst(word)).join(' ');
            case CaseTypes.fold_simple:
                return this.value.normalize("NFKD").toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
        }
    }
}