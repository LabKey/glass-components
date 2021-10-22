import React from 'react';

import { Filter } from '@labkey/api';

import { mount } from 'enzyme';

import {
    App,
    filterSampleRowsForOperation,
    getFilterForSampleOperation,
    getOmittedSampleTypeColumns, getOperationNotPermittedMessage,
    getSampleDeleteMessage,
    isSampleOperationPermitted,
    LoadingSpinner, OperationConfirmationData,
    SAMPLE_STATE_TYPE_COLUMN_NAME,
    SampleOperation,
    SampleStateType,
} from '../../..';
import { isFreezerManagementEnabled, isSampleStatusEnabled } from '../../app/utils';

// Duplicated from inventory/packages/freezermanager/src/constants.ts
export const CHECKED_OUT_BY_FIELD = 'checkedOutBy';
export const INVENTORY_COLS = [
    'LabelColor',
    'DisplayUnit',
    'StorageStatus',
    'StoredAmountDisplay',
    'StorageLocation',
    'StorageRow',
    'StorageCol',
    'StoredAmount',
    'Units',
    'FreezeThawCount',
    'EnteredStorage',
    'CheckedOut',
    'CheckedOutBy',
    'StorageComment',
];

test('getOmittedSampleTypeColumns with inventoryCols omitted', () => {
    LABKEY.moduleContext = {};
    expect(isFreezerManagementEnabled()).toBeFalsy();
    expect(getOmittedSampleTypeColumns(App.TEST_USER_READER)).toStrictEqual([]);
    expect(getOmittedSampleTypeColumns(App.TEST_USER_GUEST)).toStrictEqual([CHECKED_OUT_BY_FIELD]);
    expect(getOmittedSampleTypeColumns(App.TEST_USER_GUEST, INVENTORY_COLS)).toStrictEqual([CHECKED_OUT_BY_FIELD]);
    expect(getOmittedSampleTypeColumns(App.TEST_USER_READER, INVENTORY_COLS)).toStrictEqual(INVENTORY_COLS);

    LABKEY.moduleContext = { inventory: {} };
    expect(isFreezerManagementEnabled()).toBeTruthy();
    expect(getOmittedSampleTypeColumns(App.TEST_USER_READER, INVENTORY_COLS)).toStrictEqual([]);
    expect(getOmittedSampleTypeColumns(App.TEST_USER_READER)).toStrictEqual([]);
    expect(getOmittedSampleTypeColumns(App.TEST_USER_GUEST, INVENTORY_COLS)).toStrictEqual([CHECKED_OUT_BY_FIELD]);
});

describe('getSampleDeleteMessage', () => {
    test('loading', () => {
        LABKEY.moduleContext = {};
        const wrapper = mount(<span>{getSampleDeleteMessage(undefined, false)}</span>);
        expect(wrapper.find(LoadingSpinner).exists()).toBeTruthy();
    });

    test('cannot delete', () => {
        LABKEY.moduleContext = {};
        const wrapper = mount(<span>{getSampleDeleteMessage(false, false)}</span>);
        expect(wrapper.find(LoadingSpinner).exists()).toBeFalsy();
        expect(wrapper.text()).toContain(
            'This sample cannot be deleted because it has either derived sample or assay data dependencies.'
        );
    });

    test('cannot delete with error', () => {
        LABKEY.moduleContext = {};
        const wrapper = mount(<span>{getSampleDeleteMessage(false, true)}</span>);
        expect(wrapper.text()).toContain(
            'This sample cannot be deleted because there was a problem loading the delete confirmation data.'
        );
    });

    test('cannot delete, status enabled', () => {
        LABKEY.moduleContext = { experiment: { 'experimental-sample-status': true } };
        const wrapper = mount(<span>{getSampleDeleteMessage(false, false)}</span>);
        expect(wrapper.find(LoadingSpinner).exists()).toBeFalsy();
        expect(wrapper.text()).toContain(
            'This sample cannot be deleted because it has either derived sample or assay data dependencies or status that prevents deletion.'
        );
    });
});

describe('isSampleOperationPermitted', () => {
    test('status not enabled', () => {
        LABKEY.moduleContext = {};
        expect(isSampleStatusEnabled()).toBeFalsy();
        expect(isSampleOperationPermitted(SampleStateType.Locked, SampleOperation.EditMetadata)).toBeTruthy();
        expect(isSampleOperationPermitted(SampleStateType.Consumed, SampleOperation.AddToStorage)).toBeTruthy();
        expect(isSampleOperationPermitted(SampleStateType.Available, SampleOperation.EditLineage)).toBeTruthy();
    });

    test('enabled, no status provided', () => {
        LABKEY.moduleContext = { experiment: { 'experimental-sample-status': true } };
        expect(isSampleOperationPermitted(undefined, SampleOperation.EditMetadata)).toBeTruthy();
        expect(isSampleOperationPermitted(null, SampleOperation.EditLineage)).toBeTruthy();
    });

    test('enabled, with status type provided', () => {
        LABKEY.moduleContext = { experiment: { 'experimental-sample-status': true } };
        expect(isSampleOperationPermitted(SampleStateType.Locked, SampleOperation.EditMetadata)).toBeFalsy();
        expect(isSampleOperationPermitted(SampleStateType.Locked, SampleOperation.AddToPicklist)).toBeTruthy();
        expect(isSampleOperationPermitted(SampleStateType.Consumed, SampleOperation.AddToStorage)).toBeFalsy();
        expect(isSampleOperationPermitted(SampleStateType.Consumed, SampleOperation.RemoveFromStorage)).toBeTruthy();
        expect(isSampleOperationPermitted(SampleStateType.Available, SampleOperation.EditLineage)).toBeTruthy();
    });
});

describe('getFilterForSampleOperation', () => {
    test('status not enabled', () => {
        LABKEY.moduleContext = {};
        expect(getFilterForSampleOperation(SampleOperation.EditMetadata)).toBeNull();
    });

    test('enabled, all allowed', () => {
        LABKEY.moduleContext = { experiment: { 'experimental-sample-status': true } };
        expect(getFilterForSampleOperation(SampleOperation.AddToPicklist)).toBeNull();
    });

    test('enabled, some status does not allow', () => {
        LABKEY.moduleContext = { experiment: { 'experimental-sample-status': true } };
        expect(getFilterForSampleOperation(SampleOperation.EditLineage)).toStrictEqual(
            Filter.create(SAMPLE_STATE_TYPE_COLUMN_NAME, [SampleStateType.Locked], Filter.Types.NOT_IN)
        );
        expect(getFilterForSampleOperation(SampleOperation.UpdateStorageMetadata)).toStrictEqual(
            Filter.create(
                SAMPLE_STATE_TYPE_COLUMN_NAME,
                [SampleStateType.Consumed, SampleStateType.Locked],
                Filter.Types.NOT_IN
            )
        );
    });
});

describe('filterSampleRowsForOperation', () => {
    const availableRow1 = {
        rowId: {value: 1},
        SampleID: { value: 1, displayValue: "T-1"},
        [SAMPLE_STATE_TYPE_COLUMN_NAME]: {value: SampleStateType.Available}
    };
    const availableRow2 = {
        rowId: {value: 2},
        sampleId: { value: 2, displayValue: "T-2"},
        [SAMPLE_STATE_TYPE_COLUMN_NAME]: {value: SampleStateType.Available}
    };
    const consumedRow1 = {
        rowId: {value: 20},
        SampleID: { value: 20, displayValue: "T-20"},
        [SAMPLE_STATE_TYPE_COLUMN_NAME]: {value: SampleStateType.Consumed}
    };
    const lockedRow1 = {
        rowId: {value: 30},
        SampleID: { value: 30, displayValue: "T-30"},
        [SAMPLE_STATE_TYPE_COLUMN_NAME]: {value: SampleStateType.Locked}
    };
    const lockedRow2 = {
        rowId: {value: 31},
        SampleID: { value: 310, displayValue: "T-310"},
        [SAMPLE_STATE_TYPE_COLUMN_NAME]: {value: SampleStateType.Locked}
    };

    function validate(rows: { [p: string]: any }, operation: SampleOperation, numAllowed: number, numNotAllowed: number) {
        const filteredData = filterSampleRowsForOperation(rows, operation);
        expect(Object.keys(filteredData.rows)).toHaveLength(numAllowed);
        expect(filteredData.statusData.allowed).toHaveLength(numAllowed);
        expect(filteredData.statusData.notAllowed).toHaveLength(numNotAllowed);
        if (numNotAllowed == 0) {
            expect(filteredData.statusMessage).toBeNull();
        } else {
            expect(filteredData.statusMessage).toBeTruthy();
        }
    }

    test("all available", () => {
        LABKEY.moduleContext = { experiment: { 'experimental-sample-status': true } };
        const data = {
            1: availableRow1,
            2: availableRow2,
        };
        validate(data, SampleOperation.UpdateStorageMetadata, 2, 0);
    });

    test("all locked", () => {
        LABKEY.moduleContext = { experiment: { 'experimental-sample-status': true } };
        const data = {
            30: lockedRow1,
            31: lockedRow2,
        };
        validate(data, SampleOperation.EditMetadata, 0, 2);
        validate(data, SampleOperation.AddToPicklist, 2, 0);
    });

    test("mixed statuses", () => {
        LABKEY.moduleContext = { experiment: { 'experimental-sample-status': true } };
        const data = {
            30: lockedRow1,
            20: consumedRow1,
            1: availableRow1,
            2: availableRow2,
        };
        validate(data, SampleOperation.EditLineage, 3, 1);
        validate(data, SampleOperation.UpdateStorageMetadata, 2, 2);
        validate(data, SampleOperation.AddToPicklist, 4, 0);
    });
});

describe("getOperationNotPermittedMessage", () => {
    test("no status data", () => {
        expect(getOperationNotPermittedMessage(SampleOperation.EditMetadata, undefined)).toBeNull();
        expect(getOperationNotPermittedMessage(SampleOperation.EditMetadata, undefined, [1, 2])).toBeNull();
    });

    test("status data, no rows", () => {
        expect(getOperationNotPermittedMessage(SampleOperation.UpdateStorageMetadata, new OperationConfirmationData())).toBeNull();
    });

    test("none allowed", () => {
        expect(getOperationNotPermittedMessage(
            SampleOperation.AddToStorage,
            new OperationConfirmationData({
                allowed: [],
                notAllowed: [
                    {
                        Name: 'D-2',
                        RowId: 351,
                    },
                ],
            })))
            .toBe("All selected samples have a status that prevents adding them to storage.")
    });

    test("some not allowed, without aliquots", () => {
        expect(getOperationNotPermittedMessage(
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
            })))
            .toBe("The current status of 1 selected sample prevents updating of its lineage.")
        expect(getOperationNotPermittedMessage(
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
            }),[]))
            .toBe("The current status of 2 selected samples prevents updating of their lineage.")

    });

    test("some allowed, with aliquots", () => {
        expect(getOperationNotPermittedMessage(
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
            }), [356]))
            .toBe("The current status of 2 selected samples prevents updating of their lineage.")
    });

    test("all allowed", () => {
        expect(getOperationNotPermittedMessage(
            SampleOperation.EditLineage,
            new OperationConfirmationData({
                allowed: [
                    {
                        Name: 'T-1',
                        RowId: 111,
                    },
                    {
                        Name: 'T-2',
                        RowId: 123
                    }
                ],
                notAllowed: [

                ],
            }), [356]))
            .toBeNull();

        expect(getOperationNotPermittedMessage(
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
            }), [351, 354, 356, 357]))
            .toBeNull();
    });
});
