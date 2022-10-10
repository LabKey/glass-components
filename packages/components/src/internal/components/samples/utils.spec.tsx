import React from 'react';

import { Filter } from '@labkey/api';

import { mount } from 'enzyme';

import { isFreezerManagementEnabled, isSampleStatusEnabled } from '../../app/utils';

import { TEST_USER_GUEST, TEST_USER_READER } from '../../userFixtures';

import { SCHEMAS } from '../../schemas';
import { LoadingSpinner } from '../base/LoadingSpinner';

import { OperationConfirmationData } from '../entities/models';
import { SchemaQuery } from '../../../public/SchemaQuery';
import { QueryInfo } from '../../../public/QueryInfo';

import { SAMPLE_STATE_TYPE_COLUMN_NAME, SAMPLE_STORAGE_COLUMNS, SampleOperation, SampleStateType } from './constants';
import {
    getFilterForSampleOperation,
    getOmittedSampleTypeColumns,
    getOperationNotPermittedMessage,
    getSampleStatus,
    getSampleStatusType,
    isSampleOperationPermitted,
    isSamplesSchema,
} from './utils';

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
        expect(isSamplesSchema(SchemaQuery.create(SCHEMAS.SAMPLE_SETS.SCHEMA, 'test'))).toBeTruthy();
        expect(isSamplesSchema(SchemaQuery.create('Samples', 'test'))).toBeTruthy();
    });

    test('exp.materials', () => {
        expect(isSamplesSchema(SchemaQuery.create('EXP', 'materials'))).toBeTruthy();
        expect(isSamplesSchema(SCHEMAS.EXP_TABLES.MATERIALS)).toBeTruthy();
    });

    test('source samples', () => {
        expect(isSamplesSchema(SCHEMAS.SAMPLE_MANAGEMENT.SOURCE_SAMPLES)).toBeTruthy();
        expect(isSamplesSchema(SchemaQuery.create('sampleManagement', 'SourceSamples'))).toBeTruthy();
        expect(isSamplesSchema(SchemaQuery.create('sampleManagement', 'Jobs'))).toBeFalsy();
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
