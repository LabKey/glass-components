import { AssayRunDataType, DataClassDataType, SampleTypeDataType } from '../entities/constants';

import { SchemaQuery } from '../../../public/SchemaQuery';

import { getDataTypeFolderDataCountSql, getFolderDataTypeDataCountSql } from './actions';
import { FolderConfigurableDataType } from '../entities/models';

describe('getFolderDataTypeDataCountSql', () => {
    test('null', () => {
        expect(getFolderDataTypeDataCountSql(null)).toBeNull();
    });

    test('SampleType', () => {
        expect(getFolderDataTypeDataCountSql('SampleType')).toBe(
            'SELECT SampleSet as Type, COUNT(*) as DataCount FROM exp.materials GROUP BY SampleSet'
        );
    });

    test('DataClass', () => {
        expect(getFolderDataTypeDataCountSql('DataClass')).toBe(
            'SELECT dataclass as Type, COUNT(*) as DataCount FROM exp.data WHERE DataClass IS NOT NULL GROUP BY dataclass'
        );
    });

    test('AssayDesign', () => {
        expect(getFolderDataTypeDataCountSql('AssayDesign')).toBe(
            'SELECT protocol as Type, COUNT(*) as DataCount FROM exp.AssayRuns GROUP BY protocol'
        );
    });
});

describe('getDataTypeFolderDataCountSql', () => {
    test('create case, no queryName', () => {
        expect(getDataTypeFolderDataCountSql(SampleTypeDataType, undefined, undefined)).toBeNull();
    });

    test('SampleType', () => {
        expect(getDataTypeFolderDataCountSql(SampleTypeDataType, 1, 'blood')).toBe(
            'SELECT Folder, COUNT(*) as DataCount FROM "blood"  GROUP BY Folder'
        );
    });

    test('DataClass', () => {
        expect(getDataTypeFolderDataCountSql(DataClassDataType, 1, 'lab')).toBe(
            'SELECT Folder, COUNT(*) as DataCount FROM "lab"  GROUP BY Folder'
        );
    });

    test('AssayDesign', () => {
        expect(getDataTypeFolderDataCountSql(AssayRunDataType, 1, 'GPAT')).toBe(
            'SELECT Folder, COUNT(*) as DataCount FROM "AssayRuns" WHERE Protocol.RowId = 1 GROUP BY Folder'
        );
    });

    test('StorageLocation', () => {
        const FakeStorageDataType = {
            ...AssayRunDataType,
            folderConfigurableDataType: 'StorageLocation' as FolderConfigurableDataType,
            listingSchemaQuery: new SchemaQuery('inventory', 'testQuery'),
        };
        expect(getDataTypeFolderDataCountSql(FakeStorageDataType, undefined, undefined)).toBe(
            'SELECT Folder, COUNT(*) as DataCount FROM "testQuery"  GROUP BY Folder'
        );
    });
});
