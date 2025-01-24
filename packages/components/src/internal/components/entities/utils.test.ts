import { List, Map } from 'immutable';
import { Filter } from '@labkey/api';

import {
    TEST_LKS_STARTER_MODULE_CONTEXT,
    TEST_LKSM_PROFESSIONAL_MODULE_CONTEXT,
    TEST_LKSM_STARTER_AND_WORKFLOW_MODULE_CONTEXT,
    TEST_LKSM_STARTER_MODULE_CONTEXT,
} from '../../productFixtures';

import { SchemaQuery } from '../../../public/SchemaQuery';

import { QueryInfo } from '../../../public/QueryInfo';

import { makeTestQueryModel } from '../../../public/QueryModel/testUtils';

import { ViewInfo } from '../../ViewInfo';

import { CellMessage, EditorModel, ValueDescriptor } from '../editable/models';

import { genCellKey } from '../editable/utils';

import { IEntityTypeOption } from './models';
import {
    getCellKeyColumnMap,
    getEntityDescription,
    getEntityNoun,
    getIdentifyingColumns,
    getInitialParentChoices,
    getJobCreationHref,
    getSampleIdCellKey,
    sampleDeleteDependencyText,
    updateCellKeySampleIdMap,
} from './utils';
import { DataClassDataType, SampleTypeDataType } from './constants';

describe('getInitialParentChoices', () => {
    const parentTypeOptions = List<IEntityTypeOption>([
        {
            label: 'Second Source',
            lsid: 'urn:lsid:labkey.com:DataClass.Folder-252:Second+Source',
            rowId: 322,
            value: 'second source',
            query: 'Second Source',
            schema: 'exp.data',
        },
        {
            label: 'Source 1',
            lsid: 'urn:lsid:labkey.com:DataClass.Folder-252:Source+1',
            rowId: 321,
            value: 'source 1',
            query: 'Source 1',
            schema: 'exp.data',
        },
        {
            label: 'Vendor 3',
            lsid: 'urn:lsid:labkey.com:DataClass.Folder-252:Vendor+3',
            rowId: 323,
            value: 'vendor 3',
            query: 'Vendor 3',
            schema: 'exp.data',
            required: true,
        },
    ]);

    test('empty child data', () => {
        let parentChoices = getInitialParentChoices(parentTypeOptions, DataClassDataType, {}, {});
        expect(parentChoices.size).toBe(0);

        parentChoices = getInitialParentChoices(parentTypeOptions, DataClassDataType, {}, {}, true);
        expect(parentChoices.size).toBe(1);
    });

    test('missing parent type', () => {
        const parentIdData = {
            'urn:lsid:labkey.com:Data.Folder-252:1fce5b0b-33ce-1038-8604-d42714b6919e': {
                rowId: 123,
                parentId: 321,
            },
        };
        let parentChoices = getInitialParentChoices(parentTypeOptions, DataClassDataType, {}, parentIdData);
        expect(parentChoices.size).toBe(0);

        parentChoices = getInitialParentChoices(parentTypeOptions, DataClassDataType, {}, parentIdData, true);
        expect(parentChoices.size).toBe(1);
    });

    test('multiple inputs and types', () => {
        const data = {
            LSID: {
                value: 'urn:lsid:labkey.com:Sample.252.Examples:E-20200316-10',
            },
            'Inputs/Materials/First': [],
            RowId: {
                value: 53703,
                url: '/labkey/Sam%20Man/experiment-showMaterial.view?rowId=53703',
            },
            CreatedBy: {
                displayValue: 'Susan',
                value: 1005,
                url: '/labkey/Sam%20Man/user-details.view?schemaName=core&query.queryName=Users&userId=1005',
            },
            Modified: {
                value: '2020-03-16 15:54:28.037',
                formattedValue: '2020-03-16 15:54',
            },
            Description: {
                value: null,
            },
            'Inputs/Data/First': [
                {
                    displayValue: 'B-50118',
                    value: 'urn:lsid:labkey.com:Data.Folder-252:a49f277e-301e-1038-a031-328bafaf2618',
                    url: '/labkey/Sam%20Man/experiment-showData.view?rowId=7067&dataClassId=321',
                },
                {
                    displayValue: 'B-50117',
                    value: 'urn:lsid:labkey.com:Data.Folder-252:a49f277f-301e-1038-a031-328bafaf2618',
                    url: '/labkey/Sam%20Man/experiment-showData.view?rowId=7068&dataClassId=321',
                },
                {
                    displayValue: 'B-50116',
                    value: 'urn:lsid:labkey.com:Data.Folder-252:a49f2780-301e-1038-a031-328bafaf2618',
                    url: '/labkey/Sam%20Man/experiment-showData.view?rowId=7069&dataClassId=321',
                },
                {
                    displayValue: 'Sec-2',
                    value: 'urn:lsid:labkey.com:Data.Folder-252:604347b2-3103-1038-91ee-da4874ca890e',
                    url: '/labkey/Sam%20Man/experiment-showData.view?rowId=57088&dataClassId=322',
                },
            ],
            Run: {
                displayValue: 'Derive sample from B-50116, B-50117, B-50118, Sec-2',
                value: 2297,
                url: '/labkey/Sam%20Man/experiment-showRunText.view?rowId=2297',
            },
            IntField: {
                value: 3,
            },
            ModifiedBy: {
                displayValue: 'Susan',
                value: 1005,
                url: '/labkey/Sam%20Man/user-details.view?schemaName=core&query.queryName=Users&userId=1005',
            },
            Created: {
                value: '2020-03-16 11:52:58.540',
                formattedValue: '2020-03-16 11:52',
            },
            Name: {
                value: 'E-20200316-10',
                url: '/labkey/Sam%20Man/experiment-showMaterial.view?rowId=53703',
            },
            SampleSet: {
                displayValue: 'Examples',
                value: 'urn:lsid:labkey.com:SampleSet.Folder-252:Examples',
                url: '/labkey/Sam%20Man/experiment-showMaterialSource.view?rowId=205',
            },
            TextField: {
                value: null,
            },
        };
        const parentIdData = {
            'urn:lsid:labkey.com:Data.Folder-252:a49f277e-301e-1038-a031-328bafaf2618': {
                rowId: 1,
                parentId: 321,
            },
            'urn:lsid:labkey.com:Data.Folder-252:a49f277f-301e-1038-a031-328bafaf2618': {
                rowId: 2,
                parentId: 321,
            },
            'urn:lsid:labkey.com:Data.Folder-252:a49f2780-301e-1038-a031-328bafaf2618': {
                rowId: 3,
                parentId: 321,
            },
            'urn:lsid:labkey.com:Data.Folder-252:604347b2-3103-1038-91ee-da4874ca890e': {
                rowId: 4,
                parentId: 322,
            },
        };
        let parentChoices = getInitialParentChoices(parentTypeOptions, DataClassDataType, data, parentIdData);
        expect(parentChoices.size).toBe(2);
        let firstChoice = parentChoices.get(0);
        expect(firstChoice.type.label).toBe('Second Source');
        expect(firstChoice.ids).toStrictEqual([
            'urn:lsid:labkey.com:Data.Folder-252:604347b2-3103-1038-91ee-da4874ca890e',
        ]);
        let secondChoice = parentChoices.get(1);
        expect(secondChoice.type.label).toBe('Source 1');
        expect(secondChoice.ids).toStrictEqual([
            'urn:lsid:labkey.com:Data.Folder-252:a49f277e-301e-1038-a031-328bafaf2618',
            'urn:lsid:labkey.com:Data.Folder-252:a49f277f-301e-1038-a031-328bafaf2618',
            'urn:lsid:labkey.com:Data.Folder-252:a49f2780-301e-1038-a031-328bafaf2618',
        ]);

        parentChoices = getInitialParentChoices(parentTypeOptions, DataClassDataType, data, parentIdData, true);
        expect(parentChoices.size).toBe(3);
        firstChoice = parentChoices.get(0);
        expect(firstChoice.type.label).toBe('Second Source');
        secondChoice = parentChoices.get(1);
        expect(secondChoice.type.label).toBe('Source 1');

        const thirdChoice = parentChoices.get(2);
        expect(thirdChoice).toEqual({
            gridValues: [],
            ids: [],
            type: parentTypeOptions.get(2),
            value: undefined,
        });
    });
});

describe('getEntityDescription', () => {
    test('zero', () => {
        expect(getEntityDescription(DataClassDataType, 0)).toBe('parent types');
    });
    test('one', () => {
        expect(getEntityDescription(DataClassDataType, 1)).toBe('parent type');
    });
    test('multiple', () => {
        expect(getEntityDescription(DataClassDataType, 2)).toBe('parent types');
    });
});

describe('getEntityNoun', () => {
    test('zero', () => {
        expect(getEntityNoun(SampleTypeDataType, 0)).toBe('samples');
    });
    test('one', () => {
        expect(getEntityNoun(SampleTypeDataType, 1)).toBe('sample');
    });
    test('multiple', () => {
        expect(getEntityNoun(SampleTypeDataType, 2)).toBe('samples');
    });
});

describe('sampleDeleteDependencyText', () => {
    test('cannot delete, professional', () => {
        LABKEY.moduleContext = { ...TEST_LKSM_PROFESSIONAL_MODULE_CONTEXT };
        expect(sampleDeleteDependencyText()).toBe(
            'either derived sample, job, or assay data dependencies, status that prevents deletion, or references in one or more active notebooks'
        );
    });

    test('cannot delete, no workflow', () => {
        LABKEY.moduleContext = { ...TEST_LKS_STARTER_MODULE_CONTEXT };
        expect(sampleDeleteDependencyText()).toBe(
            'either derived sample or assay data dependencies, or status that prevents deletion'
        );
    });

    test('cannot delete, workflow no assay', () => {
        LABKEY.moduleContext = { ...TEST_LKSM_STARTER_AND_WORKFLOW_MODULE_CONTEXT };
        expect(sampleDeleteDependencyText()).toBe(
            'either derived sample or job dependencies, or status that prevents deletion'
        );
    });

    test('cannot delete no workflow or assay', () => {
        LABKEY.moduleContext = { ...TEST_LKSM_STARTER_MODULE_CONTEXT };
        expect(sampleDeleteDependencyText()).toBe('derived sample dependencies or status that prevents deletion');
    });
});

describe('getJobCreationHref', () => {
    const schemaQuery = new SchemaQuery('s', 'q');
    const queryInfo = new QueryInfo({ pkCols: ['pk'], schemaQuery });
    const modelId = 'id';
    const queryModel = makeTestQueryModel(schemaQuery, queryInfo, undefined, undefined, undefined, modelId);

    test('singleSelect', () => {
        expect(getJobCreationHref(queryModel)).toContain('selectionKey=id');
        const queryModelWithKeyValue = queryModel.mutate({ keyValue: 'key' });
        expect(getJobCreationHref(queryModelWithKeyValue)).toContain('selectionKey=appkey%7Cs%2Fq%7Ckey');
    });
    test('filters', () => {
        expect(getJobCreationHref(queryModel, undefined, true)).toBe('#/workflow/new?selectionKey=id');

        const queryModelWithFilters = queryModel.mutate({ filterArray: [Filter.create('TEST COL', 'TEST VALUE')] });
        expect(getJobCreationHref(queryModelWithFilters, undefined, true)).toBe(
            '#/workflow/new?selectionKey=id&query.TEST%20COL~eq=TEST%20VALUE'
        );
    });
    test('with filters but ignoreFilter', () => {
        expect(getJobCreationHref(queryModel, undefined, true)).toBe('#/workflow/new?selectionKey=id');

        const queryModelWithFilters = queryModel.mutate({ filterArray: [Filter.create('TEST COL', 'TEST VALUE')] });
        expect(
            getJobCreationHref(queryModelWithFilters, undefined, true, undefined, false, null, null, null, true)
        ).toBe('#/workflow/new?selectionKey=id');
    });
    test('templateId', () => {
        expect(getJobCreationHref(queryModel).indexOf('templateId')).toBe(-1);
        expect(getJobCreationHref(queryModel, 1)).toContain('templateId=1');
        expect(getJobCreationHref(queryModel, '1')).toContain('templateId=1');
    });
    test('samplesIncluded', () => {
        expect(getJobCreationHref(queryModel)).toBe('#/workflow/new?selectionKey=id&sampleTab=search');
        expect(getJobCreationHref(queryModel, undefined, true)).toBe('#/workflow/new?selectionKey=id');
    });
    test('picklistName', () => {
        expect(getJobCreationHref(queryModel).indexOf('picklistName')).toBe(-1);
        expect(getJobCreationHref(queryModel, undefined, false, 'name')).toContain('picklistName=name');
    });
    test('isAssay', () => {
        expect(getJobCreationHref(queryModel).indexOf('isAssay')).toBe(-1);
        expect(getJobCreationHref(queryModel, undefined, true, undefined, true)).toBe('#/workflow/new?selectionKey=id');
        expect(getJobCreationHref(queryModel, undefined, true, undefined, false, 'sampleFieldKey')).toBe(
            '#/workflow/new?selectionKey=id'
        );
        expect(getJobCreationHref(queryModel, undefined, true, undefined, true, 'sampleFieldKey')).toBe(
            '#/workflow/new?selectionKey=id&assayProtocol=s&isAssay=true&sampleFieldKey=sampleFieldKey'
        );
    });
    test('with product id', () => {
        expect(getJobCreationHref(queryModel, undefined, true, undefined, false, null, 'from', 'to')).toBe(
            '/labkey/to/app.view#/workflow/new?selectionKey=id'
        );
    });
});

describe('getIdentifyingColumns', () => {
    const columns = [
        { fieldKey: 'intCol', jsonType: 'int', name: 'intCol' },
        { fieldKey: 'doubleCol$S', jsonType: 'double', name: 'doubleCol/' },
        { fieldKey: 'textCol', jsonType: 'string', name: 'textCol' },
    ];
    const QUERY_INFO_NO_ID_VIEW = QueryInfo.fromJsonForTests(
        {
            columns,
            name: 'query',
            schemaName: 'schema',
            views: [
                { columns, name: ViewInfo.DEFAULT_NAME },
                { columns, name: 'view' },
            ],
        },
        true
    );
    const QUERY_INFO_WITH_ID_VIEW = QueryInfo.fromJsonForTests(
        {
            columns,
            name: 'query',
            schemaName: 'schema',
            views: [
                { columns, name: ViewInfo.DEFAULT_NAME },
                { columns, name: ViewInfo.IDENTIFYING_FIELDS_VIEW_NAME },
            ],
        },
        true
    );

    test('no view defined', () => {
        expect(getIdentifyingColumns(undefined)).toStrictEqual([]);
        expect(getIdentifyingColumns(QUERY_INFO_NO_ID_VIEW)).toStrictEqual([]);
    });

    test('view with default labels', () => {
        const cols = getIdentifyingColumns(QUERY_INFO_WITH_ID_VIEW);
        expect(cols).toHaveLength(3);
        expect(cols[1].name).toBe('doubleCol/');
        expect(cols[1].fieldKey).toBe('doubleCol$S');
        expect(cols[0].name).toBe('intCol');
        expect(cols[0].fieldKey).toBe('intCol');
        expect(cols[2].name).toBe('textCol');
        expect(cols[2].fieldKey).toBe('textCol');
    });

    test('view with custom labels', () => {
        const newColumn = { fieldKey: 'intCol', jsonType: 'int', title: 'Counter', name: 'intCol' };
        const queryInfo = QueryInfo.fromJsonForTests(
            {
                columns: [newColumn, columns[1], columns[2]],
                name: 'query',
                schemaName: 'schema',
                views: [
                    { columns, name: ViewInfo.DEFAULT_NAME },
                    { columns: [columns[1], newColumn], name: ViewInfo.IDENTIFYING_FIELDS_VIEW_NAME },
                ],
            },
            true
        );
        const cols = getIdentifyingColumns(queryInfo);
        expect(cols).toHaveLength(2);
        expect(cols[0].name).toBe('doubleCol/');
        expect(cols[0].fieldKey).toBe('doubleCol$S');
        expect(cols[1].name).toBe('intCol');
        expect(cols[1].fieldKey).toBe('intCol');
    });
});

describe('get cell key helpers', () => {
    test('getSampleIdCellKey', () => {
        expect(getSampleIdCellKey(0)).toBe('sampleid&&0');
        expect(getSampleIdCellKey(9)).toBe('sampleid&&9');
        expect(getSampleIdCellKey(9, 'otherSampleKey')).toBe('othersamplekey&&9');
    });

    const sampleFK = 'SampleFieldKey';
    const editorModel = new EditorModel({}).merge({
        cellMessages: Map<string, CellMessage>({
            '1-0': 'description 1 message',
        }),
        cellValues: Map<string, List<ValueDescriptor>>({
            [genCellKey(sampleFK, 0)]: List<ValueDescriptor>([
                {
                    display: 'S-1',
                    raw: 1,
                },
            ]),
            [genCellKey(sampleFK, 1)]: List<ValueDescriptor>([
                {
                    display: 'S-2',
                    raw: 2,
                },
            ]),
            [genCellKey(sampleFK, 2)]: List<ValueDescriptor>([]),
            [genCellKey(sampleFK, 3)]: List<ValueDescriptor>([
                {
                    display: 'S-3',
                    raw: 3,
                },
            ]),
        }),
        orderedColumns: List([sampleFK]),
        rowCount: 4,
    }) as EditorModel;

    test('getCellKeyColumnMap', () => {
        expect(getCellKeyColumnMap(editorModel, 'bogus')).toStrictEqual({});
        expect(getCellKeyColumnMap(editorModel, sampleFK)).toStrictEqual({
            'samplefieldkey&&0': 1,
            'samplefieldkey&&1': 2,
            'samplefieldkey&&3': 3,
        });
    });

    test('updateCellKeySampleIdMap', () => {
        const initMap = getCellKeyColumnMap(editorModel, sampleFK);
        expect(updateCellKeySampleIdMap(initMap, { toAddOrUpdate: {}, toRemove: [] })).toStrictEqual(initMap);

        expect(
            updateCellKeySampleIdMap(initMap, {
                toAddOrUpdate: { 'samplefieldkey&&2': 4 },
                toRemove: [],
            })
        ).toStrictEqual({
            'samplefieldkey&&0': 1,
            'samplefieldkey&&1': 2,
            'samplefieldkey&&2': 4,
            'samplefieldkey&&3': 3,
        });

        expect(
            updateCellKeySampleIdMap(initMap, {
                toAddOrUpdate: { 'samplefieldkey&&2': 4 },
                toRemove: ['samplefieldkey&&0'],
            })
        ).toStrictEqual({
            'samplefieldkey&&1': 2,
            'samplefieldkey&&2': 4,
            'samplefieldkey&&3': 3,
        });
    });
});
