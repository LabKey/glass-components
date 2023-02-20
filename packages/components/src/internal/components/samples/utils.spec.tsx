import React from 'react';

import { Filter } from '@labkey/api';

import { isFreezerManagementEnabled, isSampleStatusEnabled } from '../../app/utils';

import { TEST_USER_GUEST, TEST_USER_READER } from '../../userFixtures';

import { SCHEMAS } from '../../schemas';

import { OperationConfirmationData } from '../entities/models';
import { SchemaQuery } from '../../../public/SchemaQuery';

import { makeTestQueryModel } from '../../../public/QueryModel/testUtils';

import { QueryInfo } from '../../../public/QueryInfo';

import { SAMPLE_STATE_TYPE_COLUMN_NAME, SampleOperation, SampleStateType } from './constants';
import {
    getStorageItemUpdateData,
    getFilterForSampleOperation,
    getOmittedSampleTypeColumns,
    getOperationNotPermittedMessage,
    getSampleStatus,
    getSampleStatusType,
    getURLParamsForSampleSelectionKey,
    isSampleOperationPermitted,
    isSamplesSchema,
} from './utils';
import { List } from 'immutable';

const CHECKED_OUT_BY_FIELD = SCHEMAS.INVENTORY.CHECKED_OUT_BY_FIELD;
const INVENTORY_COLS = SCHEMAS.INVENTORY.INVENTORY_COLS;

test('getOmittedSampleTypeColumn', () => {
    let moduleContext = {};
    expect(isFreezerManagementEnabled(moduleContext)).toBeFalsy();
    expect(getOmittedSampleTypeColumns(TEST_USER_READER, moduleContext)).toStrictEqual(INVENTORY_COLS);
    expect(getOmittedSampleTypeColumns(TEST_USER_GUEST, moduleContext)).toStrictEqual(
        [CHECKED_OUT_BY_FIELD].concat(INVENTORY_COLS)
    );

    moduleContext = { inventory: {} };
    expect(isFreezerManagementEnabled(moduleContext)).toBeTruthy();
    expect(getOmittedSampleTypeColumns(TEST_USER_READER, moduleContext)).toStrictEqual([]);
    expect(getOmittedSampleTypeColumns(TEST_USER_GUEST, moduleContext)).toStrictEqual([CHECKED_OUT_BY_FIELD]);
});

describe('isSampleOperationPermitted', () => {
    test('status not enabled', () => {
        const moduleContext = {};
        expect(isSampleStatusEnabled()).toBeFalsy();
        expect(
            isSampleOperationPermitted(SampleStateType.Locked, SampleOperation.EditMetadata, moduleContext)
        ).toBeTruthy();
        expect(
            isSampleOperationPermitted(SampleStateType.Consumed, SampleOperation.AddToStorage, moduleContext)
        ).toBeTruthy();
        expect(
            isSampleOperationPermitted(SampleStateType.Available, SampleOperation.EditLineage, moduleContext)
        ).toBeTruthy();
    });

    test('enabled, no status provided', () => {
        const moduleContext = { api: { moduleNames: ['samplemanagement'] } };
        expect(isSampleOperationPermitted(undefined, SampleOperation.EditMetadata, moduleContext)).toBeTruthy();
        expect(isSampleOperationPermitted(null, SampleOperation.EditLineage, moduleContext)).toBeTruthy();
    });

    test('enabled, with status type provided', () => {
        const moduleContext = { api: { moduleNames: ['samplemanagement'] } };
        expect(
            isSampleOperationPermitted(SampleStateType.Locked, SampleOperation.EditMetadata, moduleContext)
        ).toBeFalsy();
        expect(
            isSampleOperationPermitted(SampleStateType.Locked, SampleOperation.AddToPicklist, moduleContext)
        ).toBeTruthy();
        expect(
            isSampleOperationPermitted(SampleStateType.Consumed, SampleOperation.AddToStorage, moduleContext)
        ).toBeFalsy();
        expect(
            isSampleOperationPermitted(SampleStateType.Consumed, SampleOperation.RemoveFromStorage, moduleContext)
        ).toBeTruthy();
        expect(
            isSampleOperationPermitted(SampleStateType.Available, SampleOperation.EditLineage, moduleContext)
        ).toBeTruthy();
    });
});

describe('getFilterForSampleOperation', () => {
    test('status not enabled', () => {
        expect(getFilterForSampleOperation(SampleOperation.EditMetadata, true, {})).toBeNull();
    });

    test('enabled, all allowed', () => {
        const moduleContext = { api: { moduleNames: ['samplemanagement'] } };
        expect(getFilterForSampleOperation(SampleOperation.AddToPicklist, true, moduleContext)).toBeNull();
    });

    test('enabled, some status does not allow', () => {
        const moduleContext = { api: { moduleNames: ['samplemanagement'] } };
        expect(getFilterForSampleOperation(SampleOperation.EditLineage, true, moduleContext)).toStrictEqual(
            Filter.create(SAMPLE_STATE_TYPE_COLUMN_NAME, [SampleStateType.Locked], Filter.Types.NOT_IN)
        );
        expect(getFilterForSampleOperation(SampleOperation.UpdateStorageMetadata, true, moduleContext)).toStrictEqual(
            Filter.create(
                SAMPLE_STATE_TYPE_COLUMN_NAME,
                [SampleStateType.Consumed, SampleStateType.Locked],
                Filter.Types.NOT_IN
            )
        );
    });
});

describe('getOperationNotPermittedMessage', () => {
    test('no status data', () => {
        expect(getOperationNotPermittedMessage(SampleOperation.EditMetadata, undefined)).toBeNull();
        expect(getOperationNotPermittedMessage(SampleOperation.EditMetadata, undefined, [1, 2])).toBeNull();
    });

    test('status data, no rows', () => {
        expect(
            getOperationNotPermittedMessage(SampleOperation.UpdateStorageMetadata, new OperationConfirmationData())
        ).toBeNull();
    });

    test('none allowed', () => {
        expect(
            getOperationNotPermittedMessage(
                SampleOperation.AddToStorage,
                new OperationConfirmationData({
                    allowed: [],
                    notAllowed: [
                        {
                            Name: 'D-2',
                            RowId: 351,
                        },
                    ],
                })
            )
        ).toBe('All selected samples have a status that prevents adding them to storage.');
    });

    test('some not allowed, without aliquots', () => {
        expect(
            getOperationNotPermittedMessage(
                SampleOperation.EditLineage,
                new OperationConfirmationData({
                    allowed: [
                        {
                            Name: 'T-1',
                            RowId: 111,
                        },
                    ],
                    notAllowed: [
                        {
                            Name: 'D-2',
                            RowId: 351,
                        },
                    ],
                })
            )
        ).toBe('The current status of 1 selected sample prevents updating of its lineage.');
        expect(
            getOperationNotPermittedMessage(
                SampleOperation.EditLineage,
                new OperationConfirmationData({
                    allowed: [
                        {
                            Name: 'T-1',
                            RowId: 111,
                        },
                    ],
                    notAllowed: [
                        {
                            Name: 'D-2',
                            RowId: 351,
                        },
                        {
                            Name: 'D-3',
                            RowId: 353,
                        },
                    ],
                }),
                []
            )
        ).toBe('The current status of 2 selected samples prevents updating of their lineage.');
    });

    test('some allowed, with aliquots', () => {
        expect(
            getOperationNotPermittedMessage(
                SampleOperation.EditLineage,
                new OperationConfirmationData({
                    allowed: [
                        {
                            Name: 'T-1',
                            RowId: 111,
                        },
                    ],
                    notAllowed: [
                        {
                            Name: 'D-2',
                            RowId: 351,
                        },
                        {
                            Name: 'D-4',
                            RowId: 354,
                        },
                        {
                            Name: 'D-3.1',
                            RowId: 356,
                        },
                    ],
                }),
                [356]
            )
        ).toBe('The current status of 2 selected samples prevents updating of their lineage.');
    });

    test('all allowed', () => {
        expect(
            getOperationNotPermittedMessage(
                SampleOperation.EditLineage,
                new OperationConfirmationData({
                    allowed: [
                        {
                            Name: 'T-1',
                            RowId: 111,
                        },
                        {
                            Name: 'T-2',
                            RowId: 123,
                        },
                    ],
                    notAllowed: [],
                }),
                [356]
            )
        ).toBeNull();

        expect(
            getOperationNotPermittedMessage(
                SampleOperation.EditLineage,
                new OperationConfirmationData({
                    allowed: [
                        {
                            Name: 'T-1',
                            RowId: 111,
                        },
                    ],
                    notAllowed: [
                        {
                            Name: 'D-2.1',
                            RowId: 351,
                        },
                        {
                            Name: 'D-4.1',
                            RowId: 354,
                        },
                        {
                            Name: 'D-3.1',
                            RowId: 356,
                        },
                    ],
                }),
                [351, 354, 356, 357]
            )
        ).toBe('The current status of 3 selected samples prevents updating of their lineage.');
    });
});

describe('isSamplesSchema', () => {
    test('not sample schema', () => {
        expect(isSamplesSchema(SCHEMAS.EXP_TABLES.DATA)).toBeFalsy();
        expect(undefined).toBeFalsy();
    });

    test('sample set', () => {
        expect(isSamplesSchema(new SchemaQuery(SCHEMAS.SAMPLE_SETS.SCHEMA, 'test'))).toBeTruthy();
        expect(isSamplesSchema(new SchemaQuery('Samples', 'test'))).toBeTruthy();
    });

    test('exp.materials', () => {
        expect(isSamplesSchema(new SchemaQuery('EXP', 'materials'))).toBeTruthy();
        expect(isSamplesSchema(SCHEMAS.EXP_TABLES.MATERIALS)).toBeTruthy();
    });

    test('source samples', () => {
        expect(isSamplesSchema(SCHEMAS.SAMPLE_MANAGEMENT.SOURCE_SAMPLES)).toBeTruthy();
        expect(isSamplesSchema(new SchemaQuery('sampleManagement', 'SourceSamples'))).toBeTruthy();
        expect(isSamplesSchema(new SchemaQuery('sampleManagement', 'Jobs'))).toBeFalsy();
    });
});

describe('getSampleStatus', () => {
    test('getSampleStatusType', () => {
        expect(getSampleStatusType({})).toBeUndefined();
        expect(getSampleStatusType({ 'SampleState/StatusType': { value: undefined } })).toBeUndefined();
        expect(getSampleStatusType({ 'SampleState/StatusType': { value: 'Available' } })).toBe('Available');
        expect(getSampleStatusType({ 'SampleID/SampleState/StatusType': { value: undefined } })).toBeUndefined();
        expect(getSampleStatusType({ 'SampleID/SampleState/StatusType': { value: 'Consumed' } })).toBe('Consumed');
        expect(getSampleStatusType({ StatusType: { value: undefined } })).toBeUndefined();
        expect(getSampleStatusType({ StatusType: { value: 'Locked' } })).toBe('Locked');
    });

    test('label', () => {
        expect(getSampleStatus({}).label).toBeUndefined();
        expect(getSampleStatus({ SampleState: { displayValue: undefined } }).label).toBeUndefined();
        expect(getSampleStatus({ SampleState: { displayValue: 'Label1' } }).label).toBe('Label1');
        expect(getSampleStatus({ 'SampleID/SampleState': { displayValue: undefined } }).label).toBeUndefined();
        expect(getSampleStatus({ 'SampleID/SampleState': { displayValue: 'Label2' } }).label).toBe('Label2');
        expect(getSampleStatus({ Label: { displayValue: undefined } }).label).toBeUndefined();
        expect(getSampleStatus({ Label: { displayValue: 'Label3' } }).label).toBeUndefined();
        expect(getSampleStatus({ Label: { value: 'Label3' } }).label).toBe('Label3');
    });

    test('description', () => {
        expect(getSampleStatus({}).description).toBeUndefined();
        expect(getSampleStatus({ 'SampleState/Description': { value: undefined } }).description).toBeUndefined();
        expect(getSampleStatus({ 'SampleState/Description': { value: 'Desc1' } }).description).toBe('Desc1');
        expect(
            getSampleStatus({ 'SampleID/SampleState/Description': { value: undefined } }).description
        ).toBeUndefined();
        expect(getSampleStatus({ 'SampleID/SampleState/Description': { value: 'Desc2' } }).description).toBe('Desc2');
        expect(getSampleStatus({ Description: { value: undefined } }).description).toBeUndefined();
        expect(getSampleStatus({ Description: { value: 'Desc3' } }).description).toBe('Desc3');
    });
});

const TEST_SQ = new SchemaQuery('schema', 'query');
const TEST_QUERY_INFO = new QueryInfo({ schemaQuery: TEST_SQ });
const TEST_MODEL = makeTestQueryModel(TEST_SQ, TEST_QUERY_INFO).mutate({ id: 'model-id' });

describe('getURLParamsForSampleSelectionKey', () => {
    test('default props', () => {
        expect(getURLParamsForSampleSelectionKey(TEST_MODEL)).toStrictEqual({ selectionKey: 'model-id' });
    });

    test('picklist', () => {
        expect(getURLParamsForSampleSelectionKey(TEST_MODEL, 'picklist1')).toStrictEqual({
            selectionKey: 'model-id',
            picklistName: 'picklist1',
        });
    });

    test('assay', () => {
        expect(getURLParamsForSampleSelectionKey(TEST_MODEL, undefined, true, 'Name')).toStrictEqual({
            selectionKey: 'model-id',
            assayProtocol: 'schema',
            isAssay: true,
            sampleFieldKey: 'Name',
        });
    });

    test('keyValue', () => {
        const model = TEST_MODEL.mutate({ keyValue: 123 });
        expect(getURLParamsForSampleSelectionKey(model)).toStrictEqual({
            selectionKey: 'appkey|schema/query|123',
        });
    });
});

describe('getConvertedSampleStorageUpdateData1', () => {
    const verifyResult = (result, expectedError: string, normalizedRows: any[]) => {
        if (expectedError) expect(result.errors.join('')).toEqual(expectedError);
        else expect(result.errors).toBeUndefined;

        expect(result.normalizedRows?.length === normalizedRows?.length);

        if (result.normalizedRows) {
            result.normalizedRows.forEach((row, ind) => {
                const expectedRow = normalizedRows[ind];
                expect(row).toStrictEqual(expectedRow);
            });
        }
    };

    const sampleItems = { '846': { rowId: 73, storedAmount: 1.41 }, '1192': { rowId: 79, storedAmount: 2200 } };

    test('no data', () => {
        expect(getStorageItemUpdateData([], {}, null, [], null)).toBeNull();
    });

    test('unit match sample type unit', () => {
        const storageRow = [{ StoredAmount: 3.21, Units: 'g', RowId: 846 }];
        const selection = List.of('73', '79');
        const result = getStorageItemUpdateData(storageRow, sampleItems, 'g', [], selection);
        const expected = [{ freezeThawCount: undefined, rowId: 73, amount: 3.21, units: 'g' }];
        verifyResult(result, undefined, expected);
    });

    test('unit is not the same but compatible with sample type unit', () => {
        const storageRow = [{ StoredAmount: 1.23, Units: 'kg', RowId: 846 }];
        const selection = List.of('73', '79');
        const result = getStorageItemUpdateData(storageRow, sampleItems, 'g', [], selection);
        const expected = [{ freezeThawCount: undefined, rowId: 73, amount: 1230, units: 'g' }];
        verifyResult(result, undefined, expected);
    });

    test('missing amount, with unit', () => {
        const storageRow = [
            { Units: 'kg', RowId: 846 },
            { Units: 'mg', RowId: 1192 },
        ];
        const selection = List.of('73', '79');
        const result = getStorageItemUpdateData(storageRow, sampleItems, 'g', [], selection);
        const expected = [
            { freezeThawCount: undefined, rowId: 73, amount: 1410, units: 'g' },
            { freezeThawCount: undefined, rowId: 79, amount: 2.2, units: 'g' },
        ];
        verifyResult(result, undefined, expected);
    });

    test('missing unit, with amount', () => {
        const storageRow = [
            { StoredAmount: 0.99, RowId: 846 },
            { StoredAmount: 2100, RowId: 1192 },
        ];
        const selection = List.of('73', '79');
        const result = getStorageItemUpdateData(storageRow, sampleItems, 'g', [], selection);
        const expected = [
            { freezeThawCount: undefined, rowId: 73, amount: 0.99, units: 'g' },
            { freezeThawCount: undefined, rowId: 79, amount: 2100, units: 'g' },
        ];
        verifyResult(result, undefined, expected);
    });

    test('unit is not compatible with sample type unit', () => {
        const storageRow = [{ StoredAmount: 1.23, Units: 'mL', RowId: 846 }];
        const selection = List.of('73', '79');
        const result = getStorageItemUpdateData(storageRow, sampleItems, 'g', [], selection);
        verifyResult(result, "Invalid Units. Unable to convert 'mL' to its preferred unit type 'g' for row 0.", []);
    });

    test('sample type unit is blank but unit is present', () => {
        const storageRow = [{ StoredAmount: 1.23, Units: 'kg', RowId: 846 }];
        const selection = List.of('73', '79');
        const result = getStorageItemUpdateData(storageRow, sampleItems, null, [], selection);
        const expected = [{ freezeThawCount: undefined, rowId: 73, amount: 1.23, units: 'kg' }];
        verifyResult(result, undefined, expected);
    });
});
