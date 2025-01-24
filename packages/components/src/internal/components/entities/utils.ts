import { List, Map } from 'immutable';

import { getCurrentProductName, isAssayEnabled, isELNEnabled, isWorkflowEnabled } from '../../app/utils';

import { naturalSort } from '../../../public/sort';
import { QueryInfo } from '../../../public/QueryInfo';
import { EditableColumnMetadata, EditorModel } from '../editable/models';
import { SCHEMAS } from '../../schemas';

import { getURLParamsForSampleSelectionKey } from '../samples/utils';
import { AppURL, createProductUrlFromParts } from '../../url/AppURL';
import { WORKFLOW_KEY } from '../../app/constants';
import { QueryModel } from '../../../public/QueryModel/QueryModel';

import { genCellKey } from '../editable/utils';

import { ViewInfo } from '../../ViewInfo';

import { EntityChoice, EntityDataType, IEntityTypeOption } from './models';

import { ParentIdData } from './actions';
import { QueryColumn } from '../../../public/QueryColumn';

export function sampleDeleteDependencyText(): string {
    let deleteMsg = '';
    if (isWorkflowEnabled()) {
        if (isAssayEnabled()) {
            deleteMsg += 'either derived sample, job, or assay data dependencies, ';
        } else {
            deleteMsg += 'either derived sample or job dependencies, ';
        }
    } else {
        if (isAssayEnabled()) {
            deleteMsg += 'either derived sample or assay data dependencies, ';
        } else {
            deleteMsg += 'derived sample dependencies ';
        }
    }
    if (isELNEnabled()) {
        deleteMsg += 'status that prevents deletion, or references in one or more active notebooks';
    } else {
        deleteMsg += 'or status that prevents deletion';
    }
    return deleteMsg;
}

export function getInitialParentChoices(
    parentTypeOptions: List<IEntityTypeOption>,
    parentDataType: EntityDataType,
    childData: Record<string, any>,
    parentIdData: Record<string, ParentIdData>,
    addRequiredParents: boolean
): List<EntityChoice> {
    let parentValuesByType = Map<string, EntityChoice>();

    if (Object.keys(childData).length > 0) {
        const inputs: Array<Record<string, any>> = childData[parentDataType.inputColumnName];
        if (inputs) {
            // group the inputs by parent type so we can show each in its own grid.
            inputs.forEach(inputRow => {
                const inputValue = inputRow.value;
                const typeValue = parentIdData[inputValue]?.parentId;
                const typeOption = parentTypeOptions.find(
                    option => option[parentDataType.inputTypeValueField] === typeValue
                );
                if (!typeOption) {
                    console.warn('Unable to find parent type.', typeValue);
                } else {
                    if (!parentValuesByType.has(typeOption.query)) {
                        parentValuesByType = parentValuesByType.set(typeOption.query, {
                            type: typeOption,
                            ids: [],
                            value: undefined,
                            gridValues: [],
                        });
                    }
                    const updatedChoice = parentValuesByType.get(typeOption.query);
                    updatedChoice.ids.push(inputValue);
                    // when using the data for an editable grid, we need the RowId/DisplayValue pairs
                    if (parentIdData[inputValue]) {
                        updatedChoice.gridValues.push({
                            value: parentIdData[inputValue].rowId,
                            displayValue: inputRow?.displayValue,
                        });
                    }

                    parentValuesByType = parentValuesByType.set(typeOption.query, updatedChoice);
                }
            });
        }
    }

    if (addRequiredParents) {
        parentTypeOptions.forEach(parentTypeOption => {
            if (parentTypeOption.required && !parentValuesByType.has(parentTypeOption.query)) {
                parentValuesByType = parentValuesByType.set(parentTypeOption.query, {
                    type: parentTypeOption,
                    ids: [],
                    value: undefined,
                    gridValues: [],
                });
            }
        });
    }

    // having collected the values by type, create a list, sorted by the type label and return that.
    return parentValuesByType.sortBy(choice => choice.type.label, naturalSort).toList();
}

export function getUniqueIdColumnMetadata(queryInfo: QueryInfo): Map<string, EditableColumnMetadata> {
    let columnMetadata = Map<string, EditableColumnMetadata>();
    queryInfo?.columns
        .filter(column => column.isUniqueIdColumn)
        .forEach(column => {
            columnMetadata = columnMetadata.set(column.fieldKey, {
                isReadOnlyCell: () => true,
                placeholder: '[generated value]',
                toolTip: `A unique value will be provided by ${getCurrentProductName()} for this field.`,
            });
        });
    return columnMetadata;
}

export function getEntityNoun(entityDataType: EntityDataType, quantity: number): string {
    return quantity === 1 ? entityDataType.nounSingular : entityDataType.nounPlural;
}

export function getEntityDescription(entityDataType: EntityDataType, quantity: number): string {
    return quantity === 1 ? entityDataType.descriptionSingular : entityDataType.descriptionPlural;
}

export function isSampleEntity(dataType: EntityDataType): boolean {
    return dataType.instanceSchemaName === SCHEMAS.SAMPLE_SETS.SCHEMA;
}

export function isDataClassEntity(dataType: EntityDataType): boolean {
    return dataType.instanceSchemaName === SCHEMAS.DATA_CLASSES.SCHEMA;
}

export function isAssayDesignEntity(dataType: EntityDataType): boolean {
    return dataType.instanceSchemaName === SCHEMAS.ASSAY_TABLES.SCHEMA;
}

export function isAssayResultEntity(dataType: EntityDataType): boolean {
    return dataType.sampleFinderCardType === 'assaydata';
}

export function getJobCreationHref(
    model: QueryModel,
    templateId?: string | number,
    samplesIncluded?: boolean,
    picklistName?: string,
    isAssay?: boolean,
    sampleFieldKey?: string,
    currentProductId?: string,
    targetProductId?: string,
    ignoreFilter?: boolean
): string {
    const params = getURLParamsForSampleSelectionKey(model, picklistName, isAssay, sampleFieldKey, ignoreFilter);

    if (templateId) params['templateId'] = templateId;
    if (!samplesIncluded) params['sampleTab'] = 'search'; // i.e. JOB_SAMPLE_SEARCH_TAB_ID

    const actionUrl = createProductUrlFromParts(targetProductId, currentProductId, params, WORKFLOW_KEY, 'new');
    return actionUrl instanceof AppURL ? actionUrl.toHref() : actionUrl;
}

export function getIdentifyingColumns(queryInfo: QueryInfo): QueryColumn[] {
    const idView = queryInfo?.getView(ViewInfo.IDENTIFYING_FIELDS_VIEW_NAME);
    if (!idView) {
        return [];
    }
    return queryInfo.getIdentifyingFieldsEditableGridColumns(true)
}

export const SAMPLE_ID_FIELD_KEY = 'sampleid';
export function getSampleIdCellKey(rowIdx: number, sampleFieldKey = SAMPLE_ID_FIELD_KEY): string {
    return genCellKey(sampleFieldKey, rowIdx);
}

export function getCellKeyColumnMap(editorModel: EditorModel, colFieldKey: string): Record<string, number> {
    const colCellValues = editorModel.getValuesForColumn(colFieldKey);
    return colCellValues.reduce((map, row, key) => {
        if (row.size > 0) {
            map[key] = row.get(0).raw;
        }
        return map;
    }, {});
}

export function updateCellKeySampleIdMap(
    initialMap: Record<string, number>,
    cellKeyChanges: { toAddOrUpdate: { [key: string]: number }; toRemove: string[] }
): Record<string, number> {
    const updatedCellKeyMap = { ...initialMap };
    cellKeyChanges.toRemove.forEach(key => {
        delete updatedCellKeyMap[key];
    });
    Object.assign(updatedCellKeyMap, cellKeyChanges.toAddOrUpdate);
    return updatedCellKeyMap;
}
