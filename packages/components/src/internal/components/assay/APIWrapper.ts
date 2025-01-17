import { ActionURL } from '@labkey/api';

import { AssayDefinitionModel } from '../../AssayDefinitionModel';

import { AssayProtocolModel } from '../domainproperties/assay/models';

import { request } from '../../request';

import { DomainField } from '../domainproperties/models';

import {
    checkForDuplicateAssayFiles,
    clearAssayDefinitionCache,
    DuplicateFilesResponse,
    GetAssayDefinitionsOptions,
    getAssayDefinitions,
    GetProtocolOptions,
    getProtocol,
    ImportAssayRunOptions,
    importAssayRun,
} from './actions';
import { AssayUploadResultModel, FilterCriteriaColumns } from './models';

export interface AssayAPIWrapper {
    checkForDuplicateAssayFiles: (fileNames: string[], containerPath?: string) => Promise<DuplicateFilesResponse>;
    clearAssayDefinitionCache: () => void;
    getAssayDefinitions: (options: GetAssayDefinitionsOptions) => Promise<AssayDefinitionModel[]>;
    getFilterCriteriaColumns: (
        protocolId: number,
        columnNames: string[],
        containerPath: string
    ) => Promise<FilterCriteriaColumns>;
    getProtocol: (options: GetProtocolOptions) => Promise<AssayProtocolModel>;
    importAssayRun: (options: ImportAssayRunOptions) => Promise<AssayUploadResultModel>;
}

export class AssayServerAPIWrapper implements AssayAPIWrapper {
    checkForDuplicateAssayFiles = checkForDuplicateAssayFiles;
    clearAssayDefinitionCache = clearAssayDefinitionCache;
    getAssayDefinitions = getAssayDefinitions;
    getFilterCriteriaColumns = async (
        protocolId: number,
        columnNames: string[],
        containerPath: string
    ): Promise<FilterCriteriaColumns> => {
        const resp = await request<FilterCriteriaColumns>({
            url: ActionURL.buildURL('assay', 'filterCriteriaColumns.api', containerPath),
            method: 'POST',
            jsonData: { protocolId, columnNames },
            errorLogMsg: 'Problem fetching filter criteria columns',
        });
        return Object.keys(resp).reduce<FilterCriteriaColumns>((result, key) => {
            result[key] = resp[key].map(rawField => DomainField.create(rawField));
            return result;
        }, {});
    };
    getProtocol = getProtocol;
    importAssayRun = importAssayRun;
}

/**
 * Note: Intentionally does not use jest.fn() to avoid jest becoming an implicit external package dependency.
 */
export function getAssayTestAPIWrapper(
    mockFn = (): any => () => {},
    overrides: Partial<AssayAPIWrapper> = {}
): AssayAPIWrapper {
    return {
        checkForDuplicateAssayFiles: mockFn(),
        clearAssayDefinitionCache: mockFn(),
        getAssayDefinitions: mockFn(),
        getProtocol: mockFn(),
        importAssayRun: mockFn(),
        getFilterCriteriaColumns: mockFn(),
        ...overrides,
    };
}
