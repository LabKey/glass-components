import { Map } from 'immutable';

import { extractEntityTypeOptionFromRow, getChosenParentData, sampleGenCellKey } from './actions';
import { EntityDataType, EntityIdCreationModel } from './models';
import { DataClassDataType, SampleTypeDataType } from './constants';

describe('extractEntityTypeOptionFromRow', () => {
    const NAME = 'Test Name';
    const ROW = {
        RowId: { value: 1 },
        Name: { value: NAME },
        LSID: { value: 'ABC123' },
    };

    test('return value as expected', () => {
        const options = extractEntityTypeOptionFromRow(ROW);
        expect(options.label).toBe(NAME);
        expect(options.lsid).toBe('ABC123');
        expect(options.rowId).toBe(1);
        expect(options.value).toBe(NAME.toLowerCase());
        expect(options.query).toBe(NAME);
    });
});

describe('getChosenParentData', () => {
    let PARENT_ENTITY_DATA_TYPES = Map<string, EntityDataType>();
    PARENT_ENTITY_DATA_TYPES = PARENT_ENTITY_DATA_TYPES.set(SampleTypeDataType.instanceSchemaName, SampleTypeDataType);
    PARENT_ENTITY_DATA_TYPES = PARENT_ENTITY_DATA_TYPES.set(DataClassDataType.instanceSchemaName, DataClassDataType);

    test('allowParents = false', async () => {
        const result = await getChosenParentData(new EntityIdCreationModel(), PARENT_ENTITY_DATA_TYPES, false);
        expect(result.originalParents).toBe(undefined);
        expect(result.selectionKey).toBe(undefined);
        expect(result.entityParents.size).toBe(2);
        expect(result.entityParents.get(SampleTypeDataType.typeListingSchemaQuery.queryName).size).toBe(0);
        expect(result.entityParents.get(DataClassDataType.typeListingSchemaQuery.queryName).size).toBe(0);
        expect(result.entityCount).toBe(0);
    });

    test('allowParents, initialParents without value', async () => {
        const result = await getChosenParentData(
            new EntityIdCreationModel({
                originalParents: ['samples:TEST'],
                selectionKey: undefined,
            }),
            PARENT_ENTITY_DATA_TYPES,
            true
        );
        expect(result.originalParents).toBe(undefined);
        expect(result.selectionKey).toBe(undefined);
        expect(result.entityParents.size).toBe(2);
        expect(result.entityParents.get(SampleTypeDataType.typeListingSchemaQuery.queryName).size).toBe(1);
        expect(result.entityParents.get(DataClassDataType.typeListingSchemaQuery.queryName).size).toBe(0);
        expect(result.entityCount).toBe(0);
    });

    test('allowParents, without initialParents or selectionKey', async () => {
        const result = await getChosenParentData(
            new EntityIdCreationModel({
                originalParents: undefined,
                selectionKey: undefined,
            }),
            PARENT_ENTITY_DATA_TYPES,
            true
        );
        expect(result.originalParents).toBe(undefined);
        expect(result.selectionKey).toBe(undefined);
        expect(result.entityParents.size).toBe(2);
        expect(result.entityParents.get(SampleTypeDataType.typeListingSchemaQuery.queryName).size).toBe(0);
        expect(result.entityParents.get(DataClassDataType.typeListingSchemaQuery.queryName).size).toBe(0);
        expect(result.entityCount).toBe(0);
    });
});

describe('sampleGenCellKey', () => {
    test('with sample field key', () => {
        expect(sampleGenCellKey('SampleId', 'RunDate', 0)).toBe('sampleid/rundate&&0');
        expect(sampleGenCellKey('SampleId', 'RunDate', 1)).toBe('sampleid/rundate&&1');
        expect(sampleGenCellKey('SampleId', 'Ancestors/Sources/Study', 0)).toBe('sampleid/ancestors/sources/study&&0');
        expect(sampleGenCellKey('SampleId', 'Ancestors/Sources/Study', 1)).toBe('sampleid/ancestors/sources/study&&1');
    });
    test('without sample field key', () => {
        expect(sampleGenCellKey(undefined, 'RunDate', 0)).toBe('rundate&&0');
        expect(sampleGenCellKey(null, 'RunDate', 1)).toBe('rundate&&1');
        expect(sampleGenCellKey(undefined, 'Ancestors/Sources/Study', 0)).toBe('ancestors/sources/study&&0');
        expect(sampleGenCellKey(null, 'Ancestors/Sources/Study', 1)).toBe('ancestors/sources/study&&1');
    });
});
