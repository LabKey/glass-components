import React, { act } from 'react';
import { screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import { getTestAPIWrapper } from '../../APIWrapper';
import { getQueryTestAPIWrapper } from '../../query/APIWrapper';

import { renderWithAppContext } from '../../test/reactTestLibraryHelpers';

import { AssayRunDataType, DataClassDataType, SampleTypeDataType } from './constants';
import {
    DataTypeSelector,
    DataTypeSelectorProps,
    getUncheckedEntityWarning,
    filterDataTypeHiddenEntity,
} from './DataTypeSelector';
import { DataTypeEntity } from './models';

describe('getUncheckedEntityWarning', () => {
    test('rowId in uncheckedEntitiesDB', () => {
        let warning = getUncheckedEntityWarning([1, 2], [1], null, SampleTypeDataType, 1);
        expect(warning).toBeNull();

        warning = getUncheckedEntityWarning([1, 2], [1], {}, SampleTypeDataType, 1);
        expect(warning).toBeNull();

        warning = getUncheckedEntityWarning([1, 2], [1], { '1': 2 }, SampleTypeDataType, 1);
        expect(warning).toBeNull();
    });

    test('rowId not in uncheckedEntities', () => {
        let warning = getUncheckedEntityWarning([1], [1], {}, SampleTypeDataType, 2);
        expect(warning).toBeNull();

        warning = getUncheckedEntityWarning([1], [1], { '1': 1, '2': 2 }, SampleTypeDataType, 2);
        expect(warning).toBeNull();

        warning = getUncheckedEntityWarning([1], [1], null, SampleTypeDataType, 2);
        expect(warning).toBeNull();
    });

    test('rowId not in uncheckedEntitiesDB', () => {
        let warning = getUncheckedEntityWarning([1, 2], [1], {}, SampleTypeDataType, 2);
        expect(warning).toBeNull();

        warning = getUncheckedEntityWarning([1, 2], [1], { '1': 2 }, SampleTypeDataType, 2);
        expect(warning).toBeNull();
    });

    test('dataCounts null', () => {
        const warning = getUncheckedEntityWarning([1, 2], [1], null, SampleTypeDataType, 2);
        expect(JSON.stringify(warning)).toContain('Loading...');
    });

    test('dataCounts empty', () => {
        const warning = getUncheckedEntityWarning([1, 2], [1], {}, SampleTypeDataType, 2);
        expect(warning).toBeNull();
    });

    test('dataCounts not empty', () => {
        let warning = getUncheckedEntityWarning([1, 2], [], { '1': 1, '2': 2 }, SampleTypeDataType, 2);
        expect(JSON.stringify(warning)).toContain(
            '2," ","samples"," will no longer be visible in this folder. They won\'t be deleted and lineage relationships won\'t change.'
        );

        warning = getUncheckedEntityWarning([1, 2], [], { '1': 1, '2': 2 }, SampleTypeDataType, 1);
        expect(JSON.stringify(warning)).toContain(
            '1," ","sample"," will no longer be visible in this folder. They won\'t be deleted and lineage relationships won\'t change.'
        );

        warning = getUncheckedEntityWarning([1, 2], [], { '1': 1, '2': 2 }, AssayRunDataType, 2);
        expect(JSON.stringify(warning)).toContain(
            '2," ","runs"," will no longer be visible in this folder. They won\'t be deleted and lineage relationships won\'t change.'
        );

        warning = getUncheckedEntityWarning([1, 2], [], { '1': 1, '2': 2 }, DataClassDataType, 2);
        expect(JSON.stringify(warning)).toContain(
            '2," ","sources"," will no longer be visible in this folder. They won\'t be deleted and lineage relationships won\'t change.'
        );

        warning = getUncheckedEntityWarning([1, 2], [], { '1': 1, '2': 2 }, null, 2);
        expect(JSON.stringify(warning)).toContain(
            '2," ","samples"," will no longer be visible in this folder. They won\'t be deleted and lineage relationships won\'t change.'
        );
    });
});

describe('filterDataTypeHiddenEntity', () => {
    test('no hiddenEntities', () => {
        expect(filterDataTypeHiddenEntity({ rowId: 1 }, undefined)).toBe(true);
        expect(filterDataTypeHiddenEntity({ rowId: 1 }, [])).toBe(true);
    });

    test('hiddenEntities', () => {
        expect(filterDataTypeHiddenEntity({ rowId: 1 }, [1])).toBe(false);
        expect(filterDataTypeHiddenEntity({ rowId: 1 }, [2])).toBe(true);
        expect(filterDataTypeHiddenEntity({ rowId: 1 }, [2, 3])).toBe(true);
        expect(filterDataTypeHiddenEntity({ rowId: 1 }, [1, 2])).toBe(false);
    });

    test('by lsid', () => {
        expect(filterDataTypeHiddenEntity({ lsid: 'test1' }, [1])).toBe(true);
        expect(filterDataTypeHiddenEntity({ lsid: 'test1' }, ['test'])).toBe(true);
        expect(filterDataTypeHiddenEntity({ lsid: 'test1' }, ['test1'])).toBe(false);
        expect(filterDataTypeHiddenEntity({ lsid: 'test1' }, ['test1', 'test2'])).toBe(false);
        expect(filterDataTypeHiddenEntity({ lsid: 'test1' }, ['test0', 'test2'])).toBe(true);
    });
});

describe('DataTypeSelector', () => {
    const sampleTypes = [
        {
            label: 'Blood',
            labelColor: '#2980b9',
            rowId: 56,
            description: null,
            type: 'SampleType',
            lsid: 'urn:lsid:labkey.com:SampleSet.Folder-107:9',
        },
        {
            label: 'DNA',
            labelColor: '#6E1A1A',
            rowId: 111,
            description: null,
            type: 'SampleType',
            lsid: 'urn:lsid:labkey.com:SampleSet.Folder-107:11',
        },
    ];
    const inactiveSampleTypes = [
        {
            label: 'PBMC',
            labelColor: '#2980b9',
            rowId: 25,
            description: null,
            type: 'SampleType',
            lsid: 'urn:lsid:labkey.com:SampleSet.Folder-105:3',
            inactive: true
        }
    ];
    const apiWithResults = getTestAPIWrapper(jest.fn, {
        query: getQueryTestAPIWrapper(jest.fn, {
            getFolderConfigurableEntityTypeOptions: jest.fn().mockResolvedValue(sampleTypes),
        }),
    });
    const apiWithInactiveResults = getTestAPIWrapper(jest.fn, {
        query: getQueryTestAPIWrapper(jest.fn, {
            getFolderConfigurableEntityTypeOptions: jest.fn().mockResolvedValue([...sampleTypes, ...inactiveSampleTypes]),
        }),
    });
    const apiWithOnlyInactiveResults = getTestAPIWrapper(jest.fn, {
        query: getQueryTestAPIWrapper(jest.fn, {
            getFolderConfigurableEntityTypeOptions: jest.fn().mockResolvedValue(inactiveSampleTypes),
        }),
    });
    const apiWithNoResults = getTestAPIWrapper(jest.fn, {
        query: getQueryTestAPIWrapper(jest.fn, {
            getFolderConfigurableEntityTypeOptions: jest.fn().mockResolvedValue([]),
        }),
    });

    function defaultProps(): DataTypeSelectorProps {
        return {
            api: apiWithNoResults,
            entityDataType: SampleTypeDataType,
            uncheckedEntitiesDB: [],
            updateUncheckedTypes: jest.fn(),
        };
    }

    test('data types blank', async () => {
        await act(async () => {
            renderWithAppContext(<DataTypeSelector {...defaultProps()} />);
        });
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
        expect(document.querySelector('.content-group-label').textContent).toBe('Sample Types');
        expect(document.querySelector('.help-block').textContent).toBe('No sample types');
        expect(document.querySelectorAll('.folder-faceted-data-type')).toHaveLength(0);
    });

    test('with data types', async () => {
        await act(async () => {
            renderWithAppContext(<DataTypeSelector {...defaultProps()} api={apiWithResults} />);
        });
        expect(document.querySelectorAll('.folder-faceted-data-type')).toHaveLength(2);
        expect(document.querySelectorAll('.folder-faceted-data-type')[0].textContent).toBe('Blood');
        expect(document.querySelectorAll('.filter-faceted__checkbox')[0].getAttribute('checked')).toBe('');
        expect(document.querySelectorAll('.folder-faceted-data-type')[1].textContent).toBe('DNA');
        expect(document.querySelectorAll('.filter-faceted__checkbox')[1].getAttribute('checked')).toBe('');
        expect(document.querySelectorAll('.col-xs-12')).toHaveLength(2); // outer col + 1 inner col
        expect(document.querySelectorAll('.col-md-6')).toHaveLength(0);

        const archivedSectionHeader = document.querySelectorAll('.container-expandable');
        expect(archivedSectionHeader.length).toBe(0);
    });

    test('with inactive data types', async () => {
        await act(async () => {
            renderWithAppContext(<DataTypeSelector {...defaultProps()} api={apiWithInactiveResults} />);
        });
        expect(document.querySelectorAll('.folder-faceted-data-type')).toHaveLength(2);
        expect(document.querySelectorAll('.folder-faceted-data-type')[0].textContent).toBe('Blood');
        expect(document.querySelectorAll('.filter-faceted__checkbox')[0].getAttribute('checked')).toBe('');
        expect(document.querySelectorAll('.folder-faceted-data-type')[1].textContent).toBe('DNA');
        expect(document.querySelectorAll('.filter-faceted__checkbox')[1].getAttribute('checked')).toBe('');
        expect(document.querySelectorAll('.col-xs-12')).toHaveLength(2); // outer col + 1 inner col
        expect(document.querySelectorAll('.col-md-6')).toHaveLength(0);

        const archivedSectionHeader = document.querySelectorAll('.container-expandable');
        expect(archivedSectionHeader.length).toBe(1);
        await userEvent.click(document.querySelector('.container-expandable__inactive'));
        expect(document.querySelectorAll('.folder-faceted-data-type')).toHaveLength(3);
        expect(document.querySelectorAll('.folder-faceted-data-type')[2].textContent).toBe('PBMC');
        expect(document.querySelectorAll('.filter-faceted__checkbox')[2].getAttribute('checked')).toBe('');
    });

    test('with only inactive data types', async () => {
        await act(async () => {
            renderWithAppContext(<DataTypeSelector {...defaultProps()} api={apiWithOnlyInactiveResults} />);
        });
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
        expect(document.querySelector('.content-group-label').textContent).toBe('Sample Types');
        expect(document.querySelector('.help-block').textContent).toBe('No sample types');
        expect(document.querySelectorAll('.folder-faceted-data-type')).toHaveLength(0);

        const archivedSectionHeader = document.querySelectorAll('.container-expandable');
        expect(archivedSectionHeader.length).toBe(1);
        await userEvent.click(document.querySelector('.container-expandable__inactive'));
        expect(document.querySelectorAll('.folder-faceted-data-type')).toHaveLength(1);
        expect(document.querySelectorAll('.folder-faceted-data-type')[0].textContent).toBe('PBMC');
        expect(document.querySelectorAll('.filter-faceted__checkbox')[0].getAttribute('checked')).toBe('');

    });

    test('with 2 columns', async () => {
        await act(async () => {
            renderWithAppContext(<DataTypeSelector {...defaultProps()} api={apiWithResults} columns={2} />);
        });
        expect(document.querySelectorAll('.folder-faceted-data-type')).toHaveLength(2);
        expect(document.querySelectorAll('.folder-faceted-data-type')[0].textContent).toBe('Blood');
        expect(document.querySelectorAll('.filter-faceted__checkbox')[0].getAttribute('checked')).toBe('');
        expect(document.querySelectorAll('.folder-faceted-data-type')[1].textContent).toBe('DNA');
        expect(document.querySelectorAll('.filter-faceted__checkbox')[1].getAttribute('checked')).toBe('');
        expect(document.querySelectorAll('.col-xs-12')).toHaveLength(3); // outer col + 2 inner col
        expect(document.querySelectorAll('.col-md-6')).toHaveLength(2);
    });

    test('with 2 columns and with inactive data types', async () => {
        await act(async () => {
            renderWithAppContext(<DataTypeSelector {...defaultProps()} api={apiWithInactiveResults} columns={2} />);
        });
        expect(document.querySelectorAll('.folder-faceted-data-type')).toHaveLength(2);
        expect(document.querySelectorAll('.col-xs-12')).toHaveLength(3); // outer col + 2 inner col
        expect(document.querySelectorAll('.col-md-6')).toHaveLength(2);

        const archivedSectionHeader = document.querySelectorAll('.container-expandable');
        expect(archivedSectionHeader.length).toBe(1);
        await userEvent.click(document.querySelector('.container-expandable__inactive'));
        expect(document.querySelectorAll('.folder-faceted-data-type')).toHaveLength(3);
        expect(document.querySelectorAll('.folder-faceted-data-type')[2].textContent).toBe('PBMC');
    });

    test('toggleSelectAll = false', async () => {
        await act(async () => {
            renderWithAppContext(<DataTypeSelector {...defaultProps()} api={apiWithResults} toggleSelectAll={false} />);
        });
        expect(document.querySelectorAll('.folder-faceted-data-type')).toHaveLength(2);
        expect(document.querySelectorAll('.folder-faceted-data-type')[0].textContent).toBe('Blood');
        expect(document.querySelectorAll('.filter-faceted__checkbox')[0].getAttribute('checked')).toBe('');
        expect(document.querySelectorAll('.folder-faceted-data-type')[1].textContent).toBe('DNA');
        expect(document.querySelectorAll('.filter-faceted__checkbox')[1].getAttribute('checked')).toBe('');
        expect(document.querySelectorAll('.col-xs-12')).toHaveLength(1);
        expect(document.querySelectorAll('.col-md-6')).toHaveLength(0);
    });

    test('with uncheckedEntitiesDB', async () => {
        await act(async () => {
            renderWithAppContext(
                <DataTypeSelector {...defaultProps()} api={apiWithResults} uncheckedEntitiesDB={[56]} />
            );
        });
        expect(document.querySelectorAll('.folder-faceted-data-type')).toHaveLength(2);
        expect(document.querySelectorAll('.folder-faceted-data-type')[0].textContent).toBe('Blood');
        expect(document.querySelectorAll('.filter-faceted__checkbox')[0].getAttribute('checked')).toBe(null);
        expect(document.querySelectorAll('.folder-faceted-data-type')[1].textContent).toBe('DNA');
        expect(document.querySelectorAll('.filter-faceted__checkbox')[1].getAttribute('checked')).toBe('');
        expect(document.querySelectorAll('.col-xs-12')).toHaveLength(2);
        expect(document.querySelectorAll('.col-md-6')).toHaveLength(0);
    });

    test('when allDataCounts and allDataTypes are provided', async () => {
        const allDataTypes: DataTypeEntity[] = [
            {
                label: 'freezer1',
                rowId: 12035,
                sublabel: 'Floor1/Room2',
                description: 'This is freezer 1',
                type: 'StorageLocation',
            },
            {
                label: 'freezer2',
                rowId: 12047,
                sublabel: null,
                description: 'This is freezer 2',
                type: 'StorageLocation',
            },
        ];
        const allDataCounts = {
            '12035': 7,
            '12047': 0,
        };

        await act(async () => {
            renderWithAppContext(
                <DataTypeSelector
                    {...defaultProps()}
                    allDataTypes={allDataTypes}
                    allDataCounts={allDataCounts}
                    dataTypeLabel="storage"
                />
            );
        });
        expect(document.querySelectorAll('.folder-faceted-data-type')).toHaveLength(2);
        expect(document.querySelectorAll('.folder-faceted-data-type')[0].textContent).toBe('freezer1Floor1/Room2');
        expect(document.querySelectorAll('.filter-faceted__checkbox')[0].getAttribute('checked')).toBe('');
        expect(document.querySelectorAll('.folder-faceted-data-type')[1].textContent).toBe('freezer2');
        expect(document.querySelectorAll('.filter-faceted__checkbox')[1].getAttribute('checked')).toBe('');
        expect(document.querySelectorAll('.col-xs-12')).toHaveLength(2);
        expect(document.querySelectorAll('.col-md-6')).toHaveLength(0);
    });
});
