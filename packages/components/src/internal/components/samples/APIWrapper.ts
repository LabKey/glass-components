import { ISelectRowsResult } from '../../query/api';

import { getSampleOperationConfirmationData } from '../entities/actions';

import { OperationConfirmationData } from '../entities/models';

import { TimelineEventModel } from '../auditlog/models';

import { SchemaQuery } from '../../../public/SchemaQuery';

import { DomainDetails } from '../domainproperties/models';

import {
    createSessionAssayRunSummaryQuery,
    getDefaultDiscardStatus,
    getDistinctAssaysPerSample,
    getLookupRowIdsFromSelection,
    getGroupedSampleDomainFields,
    getSampleAliquotRows,
    getSampleAssayResultViewConfigs,
    getSampleCounter,
    getSampleStatuses,
    getSampleStorageId,
    getSampleTypeDetails,
    getSelectionLineageData,
    getTimelineEvents,
    hasExistingSamples,
    SampleAssayResultViewConfig,
    saveSampleCounter,
} from './actions';
import { GroupedSampleFields, SampleState } from './models';
import { SampleOperation } from './constants';

export interface SamplesAPIWrapper {
    createSessionAssayRunSummaryQuery: (sampleIds: number[]) => Promise<ISelectRowsResult>;

    getDefaultDiscardStatus: (containerPath?: string) => Promise<number>;

    getDistinctAssaysPerSample: (sampleIds: number[]) => Promise<string[]>;

    getLookupRowIdsFromSelection: (
        schemaName: string,
        queryName: string,
        selected: any[],
        fieldKey: string
    ) => Promise<number[]>;

    getGroupedSampleDomainFields: (sampleType: string) => Promise<GroupedSampleFields>;

    getSampleAliquotRows: (sampleId: number | string) => Promise<Array<Record<string, any>>>;

    getSampleAssayResultViewConfigs: () => Promise<SampleAssayResultViewConfig[]>;

    getSampleCounter: (seqType: 'rootSampleCount' | 'sampleCount', containerPath?: string) => Promise<number>;

    getSampleOperationConfirmationData: (
        operation: SampleOperation,
        rowIds: number[] | string[],
        selectionKey?: string,
        useSnapshotSelection?: boolean
    ) => Promise<OperationConfirmationData>;

    getSampleStatuses: (includeInUse?: boolean, containerPath?: string) => Promise<SampleState[]>;

    getSampleStorageId: (sampleRowId: number) => Promise<number>;

    getSampleTypeDetails: (
        query?: SchemaQuery,
        domainId?: number,
        containerPath?: string,
        includeNamePreview?: boolean
    ) => Promise<DomainDetails>;

    getSelectionLineageData: (
        selection: Set<string>,
        schema: string,
        query: string,
        viewName: string,
        columns?: string[]
    ) => Promise<ISelectRowsResult>;

    getTimelineEvents: (sampleId: number, timezone?: string) => Promise<TimelineEventModel[]>;

    hasExistingSamples: (isRoot?: boolean, containerPath?: string) => Promise<boolean>;

    saveSampleCounter: (
        newCount: number,
        seqType: 'rootSampleCount' | 'sampleCount',
        containerPath?: string
    ) => Promise<number>;
}

export class SamplesServerAPIWrapper implements SamplesAPIWrapper {
    createSessionAssayRunSummaryQuery = createSessionAssayRunSummaryQuery;
    getGroupedSampleDomainFields = getGroupedSampleDomainFields;
    getSampleAliquotRows = getSampleAliquotRows;
    getSampleAssayResultViewConfigs = getSampleAssayResultViewConfigs;
    getSelectionLineageData = getSelectionLineageData;
    getSampleStatuses = getSampleStatuses;
    getDefaultDiscardStatus = getDefaultDiscardStatus;
    getSampleOperationConfirmationData = getSampleOperationConfirmationData;
    getSampleStorageId = getSampleStorageId;
    getLookupRowIdsFromSelection = getLookupRowIdsFromSelection;
    getTimelineEvents = getTimelineEvents;
    getSampleTypeDetails = getSampleTypeDetails;
    getDistinctAssaysPerSample = getDistinctAssaysPerSample;
    getSampleCounter = getSampleCounter;
    saveSampleCounter = saveSampleCounter;
    hasExistingSamples = hasExistingSamples;
}

/**
 * Note: Intentionally does not use jest.fn() to avoid jest becoming an implicit external package dependency.
 */
export function getSamplesTestAPIWrapper(
    mockFn = (): any => () => {},
    overrides: Partial<SamplesAPIWrapper> = {}
): SamplesAPIWrapper {
    return {
        createSessionAssayRunSummaryQuery: mockFn(),
        getGroupedSampleDomainFields: mockFn(),
        getSampleAliquotRows: mockFn(),
        getSampleAssayResultViewConfigs: mockFn(),
        getSelectionLineageData: mockFn(),
        getSampleStatuses: mockFn(),
        getDefaultDiscardStatus: mockFn(),
        getSampleOperationConfirmationData: mockFn(),
        getSampleStorageId: mockFn(),
        getLookupRowIdsFromSelection: mockFn(),
        getTimelineEvents: mockFn(),
        getSampleTypeDetails: mockFn(),
        getDistinctAssaysPerSample: mockFn(),
        getSampleCounter: mockFn(),
        saveSampleCounter: mockFn(),
        hasExistingSamples: mockFn(),
        ...overrides,
    };
}
