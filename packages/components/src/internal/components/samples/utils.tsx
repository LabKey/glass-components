import React, { ReactNode } from 'react';

import { ActionURL, Filter, Utils } from '@labkey/api';

import { User } from '../base/models/User';
import {
    AppURL,
    caseInsensitive,
    downloadAttachment,
    getQueryDetails,
    getSampleTypeDetails,
    LoadingSpinner,
    MenuItemModel,
    ProductMenuModel,
    QueryInfo,
    SAMPLE_EXPORT_CONFIG,
    SAMPLE_INSERT_EXTRA_COLUMNS,
    SAMPLE_STATE_DESCRIPTION_COLUMN_NAME,
    SAMPLE_STATE_TYPE_COLUMN_NAME,
    SampleStateType,
    SchemaQuery,
    SCHEMAS,
} from '../../..';

import { isFreezerManagementEnabled, isSampleStatusEnabled } from '../../app/utils';

import { OperationConfirmationData } from '../entities/models';

import { NEW_SAMPLES_HREF, SAMPLES_KEY } from '../../app/constants';

import { operationRestrictionMessage, permittedOps, SAMPLE_STATE_COLUMN_NAME, SampleOperation } from './constants';

import { SampleStatus } from './models';

export function getOmittedSampleTypeColumns(user: User): string[] {
    let cols: string[] = [];

    if (user.isGuest) {
        cols.push(SCHEMAS.INVENTORY.CHECKED_OUT_BY_FIELD);
    }
    if (!isFreezerManagementEnabled()) {
        cols = cols.concat(SCHEMAS.INVENTORY.INVENTORY_COLS);
    }

    return cols;
}

export function isSampleOperationPermitted(sampleStatusType: SampleStateType, operation: SampleOperation): boolean {
    if (!isSampleStatusEnabled())
        // everything is possible when not tracking status
        return true;

    if (!sampleStatusType)
        // no status provided means all operations are permitted
        return true;

    return permittedOps[sampleStatusType].has(operation);
}

export function getSampleDeleteMessage(canDelete: boolean, deleteInfoError: boolean): ReactNode {
    let deleteMsg;
    if (canDelete === undefined) {
        deleteMsg = <LoadingSpinner msg="Loading delete confirmation data..." />;
    } else if (!canDelete) {
        deleteMsg = 'This sample cannot be deleted because ';
        if (deleteInfoError) {
            deleteMsg += 'there was a problem loading the delete confirmation data.';
        } else {
            deleteMsg += 'it has either derived sample or assay data dependencies';
            if (isSampleStatusEnabled()) {
                deleteMsg += ' or status that prevents deletion';
            }
            deleteMsg += '. Check the Lineage and Assays tabs for this sample to get more information.';
        }
    }
    return deleteMsg;
}

export function getSampleStatusType(row: any): SampleStateType {
    return (
        caseInsensitive(row, SAMPLE_STATE_TYPE_COLUMN_NAME)?.value ||
        caseInsensitive(row, 'SampleID/' + SAMPLE_STATE_TYPE_COLUMN_NAME)?.value ||
        caseInsensitive(row, 'StatusType')?.value
    );
}

export function getSampleStatus(row: any): SampleStatus {
    let label;
    // Issue 45269. If the state columns are present, don't look at a column named 'Label'
    let field = caseInsensitive(row, SAMPLE_STATE_COLUMN_NAME);
    if (field) {
        label = field.displayValue;
    } else {
        field = caseInsensitive(row, 'SampleID/' + SAMPLE_STATE_COLUMN_NAME);
        if (field) {
            label = field.displayValue;
        } else {
            label = caseInsensitive(row, 'Label')?.value;
        }
    }
    return {
        label,
        statusType: getSampleStatusType(row),
        description:
            caseInsensitive(row, SAMPLE_STATE_DESCRIPTION_COLUMN_NAME)?.value ||
            caseInsensitive(row, 'SampleID/' + SAMPLE_STATE_DESCRIPTION_COLUMN_NAME)?.value ||
            caseInsensitive(row, 'Description')?.value,
    };
}

export function getFilterForSampleOperation(operation: SampleOperation, allowed = true): Filter.IFilter {
    if (!isSampleStatusEnabled()) return null;

    const typesNotAllowed = [];
    for (const stateType in SampleStateType) {
        if (!permittedOps[stateType].has(operation)) typesNotAllowed.push(stateType);
    }
    if (typesNotAllowed.length == 0) return null;

    if (allowed) {
        return Filter.create(SAMPLE_STATE_TYPE_COLUMN_NAME, typesNotAllowed, Filter.Types.NOT_IN);
    } else {
        return Filter.create(SAMPLE_STATE_TYPE_COLUMN_NAME, typesNotAllowed, Filter.Types.IN);
    }
}

function getOperationMessageAndRecommendation(operation: SampleOperation, numSamples: number, isAll?: boolean): string {
    if (isAll) {
        return operationRestrictionMessage[operation].all;
    } else {
        const messageInfo = operationRestrictionMessage[operation];
        let message;
        if (numSamples == 1) {
            message = operationRestrictionMessage[operation].singular;
        } else {
            message = operationRestrictionMessage[operation].plural;
        }
        if (messageInfo.recommendation) {
            return message + '. ' + messageInfo.recommendation;
        }
        return message;
    }
}

export function getOperationNotPermittedMessage(
    operation: SampleOperation,
    statusData: OperationConfirmationData,
    aliquotIds?: number[]
): string {
    let notAllowedMsg = null;

    if (statusData) {
        if (statusData.totalCount === 0) {
            return null;
        }

        if (statusData.noneAllowed) {
            return `All selected samples have a status that prevents ${operationRestrictionMessage[operation].all}.`;
        }

        const noAliquots = !aliquotIds || aliquotIds.length == 0;
        let notAllowed = [];
        // no aliquots or only aliquots, we show a status message about all that are not allowed
        if (noAliquots || aliquotIds.length == statusData.totalCount) {
            notAllowed = statusData.notAllowed;
        } else {
            // some aliquots, some not, filter out the aliquots from the status message
            notAllowed = statusData.notAllowed.filter(data => aliquotIds.indexOf(caseInsensitive(data, 'rowId')) < 0);
        }
        if (notAllowed?.length > 0) {
            notAllowedMsg = `The current status of ${notAllowed.length} selected sample${
                notAllowed.length == 1 ? '' : 's'
            } prevents ${getOperationMessageAndRecommendation(operation, notAllowed.length, false)}.`;
        }
    }

    return notAllowedMsg;
}

export function filterSampleRowsForOperation(
    rows: Record<string, any>,
    operation: SampleOperation,
    sampleIdField = 'RowId'
): { rows: { [p: string]: any }; statusData: OperationConfirmationData; statusMessage: string } {
    const allowed = [];
    const notAllowed = [];
    const validRows = {};
    Object.values(rows).forEach(row => {
        const statusType = caseInsensitive(row, SAMPLE_STATE_TYPE_COLUMN_NAME).value;
        const id = caseInsensitive(row, sampleIdField).value;
        const statusRecord = {
            RowId: caseInsensitive(row, sampleIdField).value,
            Name: caseInsensitive(row, 'SampleID').displayValue,
        };
        if (isSampleOperationPermitted(statusType, operation)) {
            allowed.push(statusRecord);
            validRows[id] = row;
        } else {
            notAllowed.push(statusRecord);
        }
    });
    const statusData = new OperationConfirmationData({ allowed, notAllowed });
    return {
        rows: validRows,
        statusMessage: getOperationNotPermittedMessage(operation, statusData),
        statusData,
    };
}

export function getSampleSetMenuItem(menu: ProductMenuModel, key: string): MenuItemModel {
    const sampleSetsSection = menu ? menu.getSection(SAMPLES_KEY) : undefined;
    return sampleSetsSection
        ? sampleSetsSection.items.find(set => Utils.caseInsensitiveEquals(set.get('key'), key))
        : undefined;
}

export enum SamplesEditButtonSections {
    DELETE = 'delete',
    EDIT = 'edit',
    IMPORT = 'import',
    LINKTOSTUDY = 'linktostudy',
}

export const shouldIncludeMenuItem = (
    action: SamplesEditButtonSections,
    excludedMenuKeys: SamplesEditButtonSections[]
): boolean => {
    return excludedMenuKeys === undefined || excludedMenuKeys.indexOf(action) === -1;
};

export function isSamplesSchema(schemaQuery: SchemaQuery): boolean {
    const lcSchemaName = schemaQuery?.schemaName?.toLowerCase();
    if (lcSchemaName === SCHEMAS.SAMPLE_SETS.SCHEMA) return true;

    const lcQueryName = schemaQuery?.queryName?.toLowerCase();
    if (
        lcSchemaName === SCHEMAS.EXP_TABLES.SCHEMA &&
        lcQueryName === SCHEMAS.EXP_TABLES.MATERIALS.queryName.toLowerCase()
    )
        return true;

    if (lcSchemaName === SCHEMAS.SAMPLE_MANAGEMENT.SCHEMA) {
        return (
            lcQueryName === SCHEMAS.SAMPLE_MANAGEMENT.SOURCE_SAMPLES.queryName.toLowerCase() ||
            lcQueryName === SCHEMAS.SAMPLE_MANAGEMENT.INPUT_SAMPLES_SQ.queryName.toLowerCase()
        );
    }

    return false;
}

export const getSampleTypeTemplateUrl = (
    queryInfo: QueryInfo,
    importAliases: Record<string, string>,
    excludeColumns: string[] = ['flag', 'Ancestors'],
    exportConfig: any = SAMPLE_EXPORT_CONFIG
): string => {
    const { schemaQuery } = queryInfo;
    if (!schemaQuery) return undefined;

    const extraColumns = SAMPLE_INSERT_EXTRA_COLUMNS.concat(Object.keys(importAliases || {})).filter(
        col => excludeColumns.indexOf(col) == -1
    );

    return ActionURL.buildURL('query', 'ExportExcelTemplate', null, {
        ...exportConfig,
        schemaName: schemaQuery.getSchema(),
        'query.queryName': schemaQuery.getQuery(),
        headerType: 'DisplayFieldKey',
        excludeColumn: excludeColumns
            ? excludeColumns.concat(queryInfo.getFileColumnFieldKeys())
            : queryInfo.getFileColumnFieldKeys(),
        includeColumn: extraColumns,
    });
};

/**
 * Provides sample wizard URL for this application.
 * @param targetSampleSet - Intended sample type of newly created samples.
 * @param parent - Intended parent of derived samples. Format SCHEMA:QUERY:ID
 */
export function getSampleWizardURL(targetSampleSet?: string, parent?: string): AppURL {
    let url = NEW_SAMPLES_HREF;

    if (targetSampleSet) {
        url = url.addParam('target', targetSampleSet);
    }

    if (parent) {
        url = url.addParam('parent', parent);
    }

    return url;
}

export const downloadSampleTypeTemplate = (
    schemaQuery: SchemaQuery,
    getUrl: (queryInfo: QueryInfo, importAliases: Record<string, string>, excludeColumns?: string[]) => string,
    excludeColumns?: string[]
): void => {
    const promises = [];
    promises.push(
        getQueryDetails({
            schemaName: schemaQuery.schemaName,
            queryName: schemaQuery.queryName,
        })
    );
    promises.push(getSampleTypeDetails(schemaQuery));
    Promise.all(promises)
        .then(results => {
            const [queryInfo, domainDetails] = results;
            downloadAttachment(getUrl(queryInfo, domainDetails.options?.get('importAliases'), excludeColumns), true);
        })
        .catch(reason => {
            console.error('Unable to download sample type template', reason);
        });
};
