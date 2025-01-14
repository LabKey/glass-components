import { SchemaQuery } from '../../../public/SchemaQuery';

import { OntologyModel } from '../ontology/models';

import { Container } from '../base/models/Container';

import {
    getDomainNamePreviews,
    validateDomainNameExpressions,
    getGenId,
    setGenId,
    fetchDomainDetails,
    FetchDomainDetailsOptions,
    getMaxPhiLevel,
    fetchOntologies,
    saveDomain,
    SaveDomainOptions,
    getRequiredParentTypes,
} from './actions';
import { getValidPublishTargets } from './assay/actions';
import { PHILEVEL_FULL_PHI } from './constants';
import { getDataClassDetails } from './dataclasses/actions';
import { DomainDesign, DomainDetails, NameExpressionsValidationResults } from './models';

export interface DomainPropertiesAPIWrapper {
    fetchDomainDetails: (options: FetchDomainDetailsOptions) => Promise<DomainDetails>;
    fetchOntologies: (containerPath?: string) => Promise<OntologyModel[]>;
    getDataClassDetails: (query?: SchemaQuery, domainId?: number, containerPath?: string) => Promise<DomainDetails>;
    getDomainNamePreviews: (schemaQuery?: SchemaQuery, domainId?: number, containerPath?: string) => Promise<string[]>;
    getGenId: (rowId: number, kindName: 'SampleSet' | 'DataClass', containerPath?: string) => Promise<number>;
    getMaxPhiLevel: (containerPath?: string) => Promise<string>;
    getRequiredParentTypes: (
        query: SchemaQuery,
        containerPath?: string
    ) => Promise<{ dataClasses: string[]; sampleTypes: string[] }>;
    getValidPublishTargets: (containerPath?: string) => Promise<Container[]>;
    saveDomain: (options: SaveDomainOptions) => Promise<DomainDesign>;
    setGenId: (
        rowId: number,
        kindName: 'SampleSet' | 'DataClass',
        genId: number,
        containerPath?: string
    ) => Promise<any>;
    validateDomainNameExpressions: (
        domain: DomainDesign,
        kind?: string,
        options?: any,
        includeNamePreview?: boolean
    ) => Promise<NameExpressionsValidationResults>;
}

export class DomainPropertiesAPIWrapper implements DomainPropertiesAPIWrapper {
    fetchDomainDetails = fetchDomainDetails;
    fetchOntologies = fetchOntologies;
    getDataClassDetails = getDataClassDetails;
    getDomainNamePreviews = getDomainNamePreviews;
    getGenId = getGenId;
    getMaxPhiLevel = getMaxPhiLevel;
    getRequiredParentTypes = getRequiredParentTypes;
    getValidPublishTargets = getValidPublishTargets;
    saveDomain = saveDomain;
    setGenId = setGenId;
    validateDomainNameExpressions = validateDomainNameExpressions;
}

/**
 * Note: Intentionally does not use jest.fn() to avoid jest becoming an implicit external package dependency.
 */
export function getDomainPropertiesTestAPIWrapper(
    mockFn = (): any => () => {},
    overrides: Partial<DomainPropertiesAPIWrapper> = {}
): DomainPropertiesAPIWrapper {
    return {
        fetchDomainDetails: mockFn(),
        fetchOntologies: mockFn(),
        getDataClassDetails: mockFn(),
        getDomainNamePreviews: mockFn(),
        getGenId: mockFn(),
        // Because we don't want to have an explicit dependency on jest we cannot use mockFn().mockResolvedValue here
        // like we should be able to, because the default implementation for our mockFn cannot be Jest. We should
        // probably make Jest an explicit dependency since we are actually exporting test utilities.
        getMaxPhiLevel: () => Promise.resolve(PHILEVEL_FULL_PHI),
        getRequiredParentTypes: mockFn(),
        getValidPublishTargets: mockFn(),
        saveDomain: mockFn(),
        setGenId: mockFn(),
        validateDomainNameExpressions: mockFn(),
        ...overrides,
    };
}
