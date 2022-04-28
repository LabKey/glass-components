/*
 * Copyright (c) 2019 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { ConceptModel, GridColumn, PropertyValidator } from '../../..';

import { GRID_NAME_INDEX, GRID_SELECTION_INDEX } from '../../constants';

import { CONCEPT_CACHE } from '../ontology/actions';

import { initUnitTestMocks } from '../../../test/testHelperMocks';

import { initOnotologyMocks } from '../../../test/mock';

import {
    ATTACHMENT_TYPE,
    AUTOINT_TYPE,
    BOOLEAN_TYPE,
    DATETIME_TYPE,
    DOUBLE_TYPE,
    FILE_TYPE,
    FLAG_TYPE,
    INTEGER_TYPE,
    LOOKUP_TYPE,
    MULTILINE_TYPE,
    ONTOLOGY_LOOKUP_TYPE,
    PARTICIPANT_TYPE,
    PropDescType,
    SAMPLE_TYPE,
    TEXT_CHOICE_TYPE,
    TEXT_TYPE,
    UNIQUE_ID_TYPE,
    USERS_TYPE,
    VISIT_DATE_TYPE,
    VISIT_ID_TYPE,
} from './PropDescType';

import {
    acceptablePropertyType,
    DEFAULT_TEXT_CHOICE_VALIDATOR,
    DomainDesign,
    DomainField,
    FieldErrors,
    getValidValuesDetailStr,
    getValidValuesFromArray,
    isPropertyTypeAllowed,
    isValidTextChoiceValue,
    PropertyValidatorProperties,
} from './models';
import {
    BOOLEAN_RANGE_URI,
    CONCEPT_CODE_CONCEPT_URI,
    DOMAIN_FIELD_FULLY_LOCKED,
    DOMAIN_FIELD_NOT_LOCKED,
    DOMAIN_FIELD_PARTIALLY_LOCKED,
    INT_RANGE_URI,
    MULTILINE_RANGE_URI,
    PHILEVEL_NOT_PHI,
    PHILEVEL_FULL_PHI,
    PHILEVEL_LIMITED_PHI,
    PHILEVEL_RESTRICTED_PHI,
    SAMPLE_TYPE_CONCEPT_URI,
    STORAGE_UNIQUE_ID_CONCEPT_URI,
    STRING_RANGE_URI,
    TEXT_CHOICE_CONCEPT_URI,
} from './constants';

beforeAll(() => {
    initUnitTestMocks([initOnotologyMocks]);
});

const GRID_DATA = DomainDesign.create({
    fields: [
        {
            name: 'a',
            rangeURI: INTEGER_TYPE.rangeURI,
            sourceOntology: 'b',
            conceptSubtree: 'g',
            conceptImportColumn: 'c',
            conceptLabelColumn: 'd',
            principalConceptCode: 'e',
            wrappedColumnName: 'f',
            propertyId: 123,
        },
    ],
});
const gridDataAppPropsOnlyConst = [
    {
        lockType: 'NotLocked',
        isPrimaryKey: 'false',
        defaultScale: '',
        scale: 4000,
        name: 'a',
        URL: '',
        conceptURI: '',
        rangeURI: 'http://www.w3.org/2001/XMLSchema#int',
        PHI: '',
        visible: true,
        label: '',
        propertyValidators: '',
        format: '',
        fieldIndex: 0,
        importAliases: '',
        selected: '',
        description: '',
        required: 'false',
        scannable: 'false',
    },
];
const gridDataConst = [
    {
        ...gridDataAppPropsOnlyConst[0],
        excludeFromShifting: 'false',
        shownInUpdateView: 'true',
        dimension: '',
        lookupContainer: '',
        hidden: 'false',
        defaultValueType: '',
        lookupQuery: '',
        defaultDisplayValue: '',
        defaultValue: '',
        shownInDetailsView: 'true',
        shownInInsertView: 'true',
        conditionalFormats: '',
        recommendedVariable: 'false',
        mvEnabled: 'false',
        lookupSchema: '',
        measure: '',
    },
];
const gridDataConstWithOntology = [
    {
        ...gridDataConst[0],
        sourceOntology: 'b',
        conceptSubtree: 'g',
        conceptImportColumn: 'c',
        conceptLabelColumn: 'd',
        principalConceptCode: 'e',
    },
];

const selectionCol = new GridColumn({
    index: GRID_SELECTION_INDEX,
    title: GRID_SELECTION_INDEX,
    width: 20,
    cell: () => {},
});
const nameCol = new GridColumn({
    index: GRID_NAME_INDEX,
    title: GRID_NAME_INDEX,
    raw: { index: 'name', caption: 'Name', sortable: true },
    cell: () => {},
});
const gridColumnsConst = [
    selectionCol,
    nameCol,
    { index: 'URL', caption: 'URL', sortable: true },
    { index: 'PHI', caption: 'PHI', sortable: true },
    { index: 'rangeURI', caption: 'Range URI', sortable: true },
    { index: 'required', caption: 'Required', sortable: true },
    { index: 'lockType', caption: 'Lock Type', sortable: true },
    {
        index: 'lookupContainer',
        caption: 'Lookup Container',
        sortable: true,
    },
    { index: 'lookupSchema', caption: 'Lookup Schema', sortable: true },
    { index: 'lookupQuery', caption: 'Lookup Query', sortable: true },
    { index: 'format', caption: 'Format', sortable: true },
    { index: 'defaultScale', caption: 'Default Scale', sortable: true },
    { index: 'conceptURI', caption: 'Concept URI', sortable: true },
    { index: 'scale', caption: 'Scale', sortable: true },
    { index: 'description', caption: 'Description', sortable: true },
    { index: 'label', caption: 'Label', sortable: true },
    { index: 'importAliases', caption: 'Import Aliases', sortable: true },
    {
        index: 'conditionalFormats',
        caption: 'Conditional Formats',
        sortable: true,
    },
    {
        index: 'propertyValidators',
        caption: 'Property Validators',
        sortable: true,
    },
    { index: 'hidden', caption: 'Hidden', sortable: true },
    {
        index: 'shownInUpdateView',
        caption: 'Shown In Update View',
        sortable: true,
    },
    {
        index: 'shownInInsertView',
        caption: 'Shown In Insert View',
        sortable: true,
    },
    {
        index: 'shownInDetailsView',
        caption: 'Shown In Details View',
        sortable: true,
    },
    {
        index: 'defaultValueType',
        caption: 'Default Value Type',
        sortable: true,
    },
    { index: 'defaultValue', caption: 'Default Value', sortable: true },
    {
        index: 'defaultDisplayValue',
        caption: 'Default Display Value',
        sortable: true,
    },
    {
        index: 'excludeFromShifting',
        caption: 'Exclude From Shifting',
        sortable: true,
    },
    { index: 'measure', caption: 'Measure', sortable: true },
    { index: 'dimension', caption: 'Dimension', sortable: true },
    {
        index: 'recommendedVariable',
        caption: 'Recommended Variable',
        sortable: true,
    },
    { index: 'mvEnabled', caption: 'Mv Enabled', sortable: true },
];

beforeEach(() => {
    LABKEY.moduleContext.api = { moduleNames: [] };
});

describe('PropDescType', () => {
    test('isInteger', () => {
        expect(PropDescType.isInteger(TEXT_TYPE.rangeURI)).toBeFalsy();
        expect(PropDescType.isInteger(LOOKUP_TYPE.rangeURI)).toBeFalsy();
        expect(PropDescType.isInteger(MULTILINE_TYPE.rangeURI)).toBeFalsy();
        expect(PropDescType.isInteger(BOOLEAN_TYPE.rangeURI)).toBeFalsy();
        expect(PropDescType.isInteger(INTEGER_TYPE.rangeURI)).toBeTruthy();
        expect(PropDescType.isInteger(DOUBLE_TYPE.rangeURI)).toBeFalsy();
        expect(PropDescType.isInteger(DATETIME_TYPE.rangeURI)).toBeFalsy();
        expect(PropDescType.isInteger(FLAG_TYPE.rangeURI)).toBeFalsy();
        expect(PropDescType.isInteger(FILE_TYPE.rangeURI)).toBeFalsy();
        expect(PropDescType.isInteger(ATTACHMENT_TYPE.rangeURI)).toBeFalsy();
        expect(PropDescType.isInteger(USERS_TYPE.rangeURI)).toBeTruthy();
        expect(PropDescType.isInteger(SAMPLE_TYPE.rangeURI)).toBeTruthy();
        expect(PropDescType.isInteger(PARTICIPANT_TYPE.rangeURI)).toBeFalsy();
        expect(PropDescType.isInteger(ONTOLOGY_LOOKUP_TYPE.rangeURI)).toBeFalsy();
        expect(PropDescType.isInteger(TEXT_CHOICE_TYPE.rangeURI)).toBeFalsy();
    });

    test('isString', () => {
        expect(PropDescType.isString(TEXT_TYPE.rangeURI)).toBeTruthy();
        expect(PropDescType.isString(LOOKUP_TYPE.rangeURI)).toBeFalsy();
        expect(PropDescType.isString(MULTILINE_TYPE.rangeURI)).toBeTruthy();
        expect(PropDescType.isString(BOOLEAN_TYPE.rangeURI)).toBeFalsy();
        expect(PropDescType.isString(INTEGER_TYPE.rangeURI)).toBeFalsy();
        expect(PropDescType.isString(DOUBLE_TYPE.rangeURI)).toBeFalsy();
        expect(PropDescType.isString(DATETIME_TYPE.rangeURI)).toBeFalsy();
        expect(PropDescType.isString(FLAG_TYPE.rangeURI)).toBeTruthy();
        expect(PropDescType.isString(FILE_TYPE.rangeURI)).toBeFalsy();
        expect(PropDescType.isString(ATTACHMENT_TYPE.rangeURI)).toBeFalsy();
        expect(PropDescType.isString(USERS_TYPE.rangeURI)).toBeFalsy();
        expect(PropDescType.isString(SAMPLE_TYPE.rangeURI)).toBeFalsy();
        expect(PropDescType.isString(PARTICIPANT_TYPE.rangeURI)).toBeTruthy();
        expect(PropDescType.isString(ONTOLOGY_LOOKUP_TYPE.rangeURI)).toBeTruthy();
        expect(PropDescType.isString(TEXT_CHOICE_TYPE.rangeURI)).toBeTruthy();
    });

    test('isNumeric', () => {
        expect(PropDescType.isNumeric(TEXT_TYPE.rangeURI)).toBeFalsy();
        expect(PropDescType.isNumeric(LOOKUP_TYPE.rangeURI)).toBeFalsy();
        expect(PropDescType.isNumeric(MULTILINE_TYPE.rangeURI)).toBeFalsy();
        expect(PropDescType.isNumeric(BOOLEAN_TYPE.rangeURI)).toBeFalsy();
        expect(PropDescType.isNumeric(INTEGER_TYPE.rangeURI)).toBeTruthy();
        expect(PropDescType.isNumeric(DOUBLE_TYPE.rangeURI)).toBeTruthy();
        expect(PropDescType.isNumeric(DATETIME_TYPE.rangeURI)).toBeFalsy();
        expect(PropDescType.isNumeric(FLAG_TYPE.rangeURI)).toBeFalsy();
        expect(PropDescType.isNumeric(FILE_TYPE.rangeURI)).toBeFalsy();
        expect(PropDescType.isNumeric(ATTACHMENT_TYPE.rangeURI)).toBeFalsy();
        expect(PropDescType.isNumeric(USERS_TYPE.rangeURI)).toBeTruthy();
        expect(PropDescType.isNumeric(SAMPLE_TYPE.rangeURI)).toBeTruthy();
        expect(PropDescType.isNumeric(PARTICIPANT_TYPE.rangeURI)).toBeFalsy();
        expect(PropDescType.isNumeric(ONTOLOGY_LOOKUP_TYPE.rangeURI)).toBeFalsy();
        expect(PropDescType.isNumeric(TEXT_CHOICE_TYPE.rangeURI)).toBeFalsy();
    });

    test('isMeasure', () => {
        expect(PropDescType.isMeasure(TEXT_TYPE.rangeURI)).toBeTruthy();
        expect(PropDescType.isMeasure(LOOKUP_TYPE.rangeURI)).toBeTruthy();
        expect(PropDescType.isMeasure(MULTILINE_TYPE.rangeURI)).toBeTruthy();
        expect(PropDescType.isMeasure(BOOLEAN_TYPE.rangeURI)).toBeTruthy();
        expect(PropDescType.isMeasure(INTEGER_TYPE.rangeURI)).toBeTruthy();
        expect(PropDescType.isMeasure(DOUBLE_TYPE.rangeURI)).toBeTruthy();
        expect(PropDescType.isMeasure(DATETIME_TYPE.rangeURI)).toBeTruthy();
        expect(PropDescType.isMeasure(FLAG_TYPE.rangeURI)).toBeTruthy();
        expect(PropDescType.isMeasure(FILE_TYPE.rangeURI)).toBeFalsy();
        expect(PropDescType.isMeasure(ATTACHMENT_TYPE.rangeURI)).toBeFalsy();
        expect(PropDescType.isMeasure(USERS_TYPE.rangeURI)).toBeTruthy();
        expect(PropDescType.isMeasure(SAMPLE_TYPE.rangeURI)).toBeTruthy();
        expect(PropDescType.isMeasure(PARTICIPANT_TYPE.rangeURI)).toBeTruthy();
        expect(PropDescType.isMeasure(ONTOLOGY_LOOKUP_TYPE.rangeURI)).toBeTruthy();
        expect(PropDescType.isMeasure(TEXT_CHOICE_TYPE.rangeURI)).toBeTruthy();
    });

    test('isDimension', () => {
        expect(PropDescType.isDimension(TEXT_TYPE.rangeURI)).toBeTruthy();
        expect(PropDescType.isDimension(LOOKUP_TYPE.rangeURI)).toBeFalsy();
        expect(PropDescType.isDimension(MULTILINE_TYPE.rangeURI)).toBeFalsy();
        expect(PropDescType.isDimension(BOOLEAN_TYPE.rangeURI)).toBeTruthy();
        expect(PropDescType.isDimension(INTEGER_TYPE.rangeURI)).toBeTruthy();
        expect(PropDescType.isDimension(DOUBLE_TYPE.rangeURI)).toBeTruthy();
        expect(PropDescType.isDimension(DATETIME_TYPE.rangeURI)).toBeFalsy();
        expect(PropDescType.isDimension(FLAG_TYPE.rangeURI)).toBeTruthy();
        expect(PropDescType.isDimension(FILE_TYPE.rangeURI)).toBeFalsy();
        expect(PropDescType.isDimension(ATTACHMENT_TYPE.rangeURI)).toBeFalsy();
        expect(PropDescType.isDimension(USERS_TYPE.rangeURI)).toBeTruthy();
        expect(PropDescType.isDimension(SAMPLE_TYPE.rangeURI)).toBeTruthy();
        expect(PropDescType.isDimension(PARTICIPANT_TYPE.rangeURI)).toBeTruthy();
        expect(PropDescType.isDimension(ONTOLOGY_LOOKUP_TYPE.rangeURI)).toBeTruthy();
        expect(PropDescType.isDimension(TEXT_CHOICE_TYPE.rangeURI)).toBeTruthy();
    });

    test('isMvEnableable', () => {
        expect(PropDescType.isMvEnableable(TEXT_TYPE.rangeURI)).toBeTruthy();
        expect(PropDescType.isMvEnableable(LOOKUP_TYPE.rangeURI)).toBeTruthy();
        expect(PropDescType.isMvEnableable(MULTILINE_TYPE.rangeURI)).toBeFalsy();
        expect(PropDescType.isMvEnableable(BOOLEAN_TYPE.rangeURI)).toBeTruthy();
        expect(PropDescType.isMvEnableable(INTEGER_TYPE.rangeURI)).toBeTruthy();
        expect(PropDescType.isMvEnableable(DOUBLE_TYPE.rangeURI)).toBeTruthy();
        expect(PropDescType.isMvEnableable(DATETIME_TYPE.rangeURI)).toBeTruthy();
        expect(PropDescType.isMvEnableable(FLAG_TYPE.rangeURI)).toBeTruthy();
        expect(PropDescType.isMvEnableable(FILE_TYPE.rangeURI)).toBeFalsy();
        expect(PropDescType.isMvEnableable(ATTACHMENT_TYPE.rangeURI)).toBeFalsy();
        expect(PropDescType.isMvEnableable(USERS_TYPE.rangeURI)).toBeTruthy();
        expect(PropDescType.isMvEnableable(SAMPLE_TYPE.rangeURI)).toBeTruthy();
        expect(PropDescType.isMvEnableable(PARTICIPANT_TYPE.rangeURI)).toBeTruthy();
        expect(PropDescType.isMvEnableable(ONTOLOGY_LOOKUP_TYPE.rangeURI)).toBeTruthy();
        expect(PropDescType.isMvEnableable(TEXT_CHOICE_TYPE.rangeURI)).toBeTruthy();
    });

    test('isUser', () => {
        expect(PropDescType.isUser(undefined)).toBeFalsy();
        expect(PropDescType.isUser(null)).toBeFalsy();
        expect(PropDescType.isUser('test')).toBeFalsy();
        expect(PropDescType.isUser('users')).toBeTruthy();
    });

    test('isLookup', () => {
        expect(PropDescType.isLookup(undefined)).toBeFalsy();
        expect(PropDescType.isLookup(null)).toBeFalsy();
        expect(PropDescType.isLookup('test')).toBeFalsy();
        expect(PropDescType.isLookup('lookup')).toBeTruthy();
    });

    test('isSample', () => {
        expect(PropDescType.isSample(undefined)).toBeFalsy();
        expect(PropDescType.isSample(null)).toBeFalsy();
        expect(PropDescType.isSample(CONCEPT_CODE_CONCEPT_URI)).toBeFalsy();
        expect(PropDescType.isSample(SAMPLE_TYPE_CONCEPT_URI)).toBeTruthy();
    });

    test('isTextChoice', () => {
        expect(PropDescType.isTextChoice(undefined)).toBeFalsy();
        expect(PropDescType.isTextChoice(null)).toBeFalsy();
        expect(PropDescType.isTextChoice(SAMPLE_TYPE_CONCEPT_URI)).toBeFalsy();
        expect(PropDescType.isTextChoice(TEXT_CHOICE_CONCEPT_URI)).toBeTruthy();
        expect(PropDescType.isTextChoice('testing')).toBeFalsy();
        expect(PropDescType.isTextChoice('textChoice')).toBeTruthy();
    });

    test('isUniqueIdField', () => {
        expect(PropDescType.isUniqueIdField(undefined)).toBeFalsy();
        expect(PropDescType.isUniqueIdField(null)).toBeFalsy();
        expect(PropDescType.isUniqueIdField(SAMPLE_TYPE_CONCEPT_URI)).toBeFalsy();
        expect(PropDescType.isUniqueIdField(STORAGE_UNIQUE_ID_CONCEPT_URI)).toBeTruthy();
    });

    test('isOntologyLookup', () => {
        expect(PropDescType.isOntologyLookup(undefined)).toBeFalsy();
        expect(PropDescType.isOntologyLookup(null)).toBeFalsy();
        expect(PropDescType.isOntologyLookup(SAMPLE_TYPE_CONCEPT_URI)).toBeFalsy();
        expect(PropDescType.isOntologyLookup(CONCEPT_CODE_CONCEPT_URI)).toBeTruthy();
    });

    test('isAutoIncrement', () => {
        expect(PropDescType.isAutoIncrement(undefined)).toBeFalsy();
        expect(PropDescType.isAutoIncrement(null)).toBeFalsy();
        expect(PropDescType.isAutoIncrement(INTEGER_TYPE)).toBeFalsy();
        expect(PropDescType.isAutoIncrement(AUTOINT_TYPE)).toBeTruthy();
    });

    test('fromName', () => {
        expect(PropDescType.fromName('text')).toBe(undefined);
        expect(PropDescType.fromName('Text')).toBe(undefined);
        expect(PropDescType.fromName('string')).toBe(TEXT_TYPE);
        expect(PropDescType.fromName('DateTime')).toBe(undefined);
        expect(PropDescType.fromName('dateTime')).toBe(DATETIME_TYPE);
        expect(PropDescType.fromName('date')).toBe(undefined); // because not in PROP_DESC_TYPES
    });

    test('isFileType', () => {
        expect(INTEGER_TYPE.isFileType()).toBeFalsy();
        expect(TEXT_TYPE.isFileType()).toBeFalsy();
        expect(FILE_TYPE.isFileType()).toBeTruthy();
        expect(ATTACHMENT_TYPE.isFileType()).toBeTruthy();
    });

    test('getJsonType', () => {
        expect(TEXT_TYPE.getJsonType()).toBe('string');
        expect(BOOLEAN_TYPE.getJsonType()).toBe('boolean');
        expect(INTEGER_TYPE.getJsonType()).toBe('int');
        expect(DOUBLE_TYPE.getJsonType()).toBe('float');
        expect(DATETIME_TYPE.getJsonType()).toBe('date');
    });

    test('isPropertyTypeAllowed', () => {
        expect(isPropertyTypeAllowed(TEXT_TYPE, true, false)).toBeTruthy();
        expect(isPropertyTypeAllowed(LOOKUP_TYPE, true, false)).toBeFalsy();
        expect(isPropertyTypeAllowed(MULTILINE_TYPE, true, false)).toBeTruthy();
        expect(isPropertyTypeAllowed(BOOLEAN_TYPE, true, false)).toBeTruthy();
        expect(isPropertyTypeAllowed(INTEGER_TYPE, true, false)).toBeTruthy();
        expect(isPropertyTypeAllowed(DOUBLE_TYPE, true, false)).toBeTruthy();
        expect(isPropertyTypeAllowed(DATETIME_TYPE, true, false)).toBeTruthy();
        expect(isPropertyTypeAllowed(FLAG_TYPE, true, false)).toBeFalsy();
        expect(isPropertyTypeAllowed(FILE_TYPE, false, false)).toBeFalsy();
        expect(isPropertyTypeAllowed(FILE_TYPE, true, false)).toBeTruthy();
        expect(isPropertyTypeAllowed(ATTACHMENT_TYPE, true, false)).toBeTruthy();
        expect(isPropertyTypeAllowed(USERS_TYPE, true, false)).toBeTruthy();
        expect(isPropertyTypeAllowed(SAMPLE_TYPE, true, false)).toBeTruthy();
        expect(isPropertyTypeAllowed(PARTICIPANT_TYPE, true, false)).toBeFalsy();
        expect(isPropertyTypeAllowed(PARTICIPANT_TYPE, true, true)).toBeTruthy();
        expect(isPropertyTypeAllowed(ONTOLOGY_LOOKUP_TYPE, true, false)).toBeFalsy();
        expect(isPropertyTypeAllowed(TEXT_CHOICE_TYPE, true, false)).toBeTruthy();
        expect(isPropertyTypeAllowed(VISIT_DATE_TYPE, true, false)).toBeFalsy();
        expect(isPropertyTypeAllowed(VISIT_DATE_TYPE, true, true)).toBeTruthy();
        expect(isPropertyTypeAllowed(VISIT_ID_TYPE, true, false)).toBeFalsy();
        expect(isPropertyTypeAllowed(VISIT_ID_TYPE, true, true)).toBeTruthy();
    });

    test('isPropertyTypeAllowed with premium', () => {
        LABKEY.moduleContext.api = { moduleNames: ['premium'] };
        expect(isPropertyTypeAllowed(TEXT_TYPE, true, false)).toBeTruthy();
        expect(isPropertyTypeAllowed(LOOKUP_TYPE, true, false)).toBeTruthy();
        expect(isPropertyTypeAllowed(MULTILINE_TYPE, true, false)).toBeTruthy();
        expect(isPropertyTypeAllowed(BOOLEAN_TYPE, true, false)).toBeTruthy();
        expect(isPropertyTypeAllowed(INTEGER_TYPE, true, false)).toBeTruthy();
        expect(isPropertyTypeAllowed(DOUBLE_TYPE, true, false)).toBeTruthy();
        expect(isPropertyTypeAllowed(DATETIME_TYPE, true, false)).toBeTruthy();
        expect(isPropertyTypeAllowed(FLAG_TYPE, true, false)).toBeTruthy();
        expect(isPropertyTypeAllowed(FILE_TYPE, false, false)).toBeFalsy();
        expect(isPropertyTypeAllowed(FILE_TYPE, true, false)).toBeTruthy();
        expect(isPropertyTypeAllowed(ATTACHMENT_TYPE, true, false)).toBeTruthy();
        expect(isPropertyTypeAllowed(USERS_TYPE, true, false)).toBeTruthy();
        expect(isPropertyTypeAllowed(SAMPLE_TYPE, true, false)).toBeTruthy();
        expect(isPropertyTypeAllowed(PARTICIPANT_TYPE, true, false)).toBeFalsy();
        expect(isPropertyTypeAllowed(PARTICIPANT_TYPE, true, true)).toBeTruthy();
        expect(isPropertyTypeAllowed(ONTOLOGY_LOOKUP_TYPE, true, false)).toBeTruthy();
        expect(isPropertyTypeAllowed(TEXT_CHOICE_TYPE, true, false)).toBeTruthy();
        expect(isPropertyTypeAllowed(VISIT_DATE_TYPE, true, false)).toBeFalsy();
        expect(isPropertyTypeAllowed(VISIT_DATE_TYPE, true, true)).toBeTruthy();
        expect(isPropertyTypeAllowed(VISIT_ID_TYPE, true, false)).toBeFalsy();
        expect(isPropertyTypeAllowed(VISIT_ID_TYPE, true, true)).toBeTruthy();
    });

    test('acceptablePropertyType', () => {
        expect(acceptablePropertyType(LOOKUP_TYPE, INT_RANGE_URI)).toBeTruthy();
        expect(acceptablePropertyType(LOOKUP_TYPE, STRING_RANGE_URI)).toBeTruthy();
        expect(acceptablePropertyType(LOOKUP_TYPE, BOOLEAN_RANGE_URI)).toBeFalsy();
        expect(acceptablePropertyType(SAMPLE_TYPE, INT_RANGE_URI)).toBeTruthy();
        expect(acceptablePropertyType(SAMPLE_TYPE, STRING_RANGE_URI)).toBeFalsy();
        expect(acceptablePropertyType(SAMPLE_TYPE, BOOLEAN_RANGE_URI)).toBeFalsy();
        expect(acceptablePropertyType(ONTOLOGY_LOOKUP_TYPE, INT_RANGE_URI)).toBeFalsy();
        expect(acceptablePropertyType(ONTOLOGY_LOOKUP_TYPE, STRING_RANGE_URI)).toBeTruthy();
        expect(acceptablePropertyType(ONTOLOGY_LOOKUP_TYPE, BOOLEAN_RANGE_URI)).toBeFalsy();
        expect(acceptablePropertyType(TEXT_CHOICE_TYPE, INT_RANGE_URI)).toBeFalsy();
        expect(acceptablePropertyType(TEXT_CHOICE_TYPE, STRING_RANGE_URI)).toBeTruthy();
        expect(acceptablePropertyType(TEXT_CHOICE_TYPE, BOOLEAN_RANGE_URI)).toBeFalsy();
        expect(acceptablePropertyType(INTEGER_TYPE, INT_RANGE_URI)).toBeTruthy();
        expect(acceptablePropertyType(INTEGER_TYPE, STRING_RANGE_URI)).toBeFalsy();
        expect(acceptablePropertyType(INTEGER_TYPE, BOOLEAN_RANGE_URI)).toBeFalsy();
        expect(acceptablePropertyType(TEXT_TYPE, INT_RANGE_URI)).toBeFalsy();
        expect(acceptablePropertyType(TEXT_TYPE, STRING_RANGE_URI)).toBeTruthy();
        expect(acceptablePropertyType(TEXT_TYPE, BOOLEAN_RANGE_URI)).toBeFalsy();
        expect(acceptablePropertyType(BOOLEAN_TYPE, INT_RANGE_URI)).toBeFalsy();
        expect(acceptablePropertyType(BOOLEAN_TYPE, STRING_RANGE_URI)).toBeFalsy();
        expect(acceptablePropertyType(BOOLEAN_TYPE, BOOLEAN_RANGE_URI)).toBeTruthy();
        expect(acceptablePropertyType(UNIQUE_ID_TYPE, STRING_RANGE_URI)).toBeFalsy();
        expect(acceptablePropertyType(UNIQUE_ID_TYPE, MULTILINE_RANGE_URI)).toBeFalsy();
    });
});

describe('DomainDesign', () => {
    test('isNameSuffixMatch', () => {
        const d = DomainDesign.create({ name: 'Foo Fields' });
        expect(d.isNameSuffixMatch('Foo')).toBeTruthy();
        expect(d.isNameSuffixMatch('foo')).toBeFalsy();
        expect(d.isNameSuffixMatch('Bar')).toBeFalsy();
        expect(d.isNameSuffixMatch('bar')).toBeFalsy();
    });

    test('mandatoryFieldNames', () => {
        const base = { name: 'Test Fields', fields: [{ name: 'abc' }, { name: 'def' }] };

        let domain = DomainDesign.create({ ...base, mandatoryFieldNames: undefined });
        expect(domain.fields.size).toBe(2);
        expect(domain.fields.get(0).lockType).toBe(DOMAIN_FIELD_NOT_LOCKED);
        expect(domain.fields.get(1).lockType).toBe(DOMAIN_FIELD_NOT_LOCKED);

        domain = DomainDesign.create({ ...base, mandatoryFieldNames: ['abc', 'DEF'] });
        expect(domain.fields.size).toBe(2);
        expect(domain.fields.get(0).lockType).toBe(DOMAIN_FIELD_PARTIALLY_LOCKED);
        expect(domain.fields.get(1).lockType).toBe(DOMAIN_FIELD_PARTIALLY_LOCKED);
    });

    test('hasInvalidNameField', () => {
        const domain = DomainDesign.create({ name: 'Test Fields', fields: [{ name: 'abc' }, { name: 'def' }] });

        expect(domain.hasInvalidNameField()).toBeFalsy();
        expect(domain.hasInvalidNameField({})).toBeFalsy();
        expect(domain.hasInvalidNameField({ name: undefined })).toBeFalsy();
        expect(domain.hasInvalidNameField({ name: null })).toBeFalsy();
        expect(domain.hasInvalidNameField({ name: '' })).toBeFalsy();
        expect(domain.hasInvalidNameField({ name: 'abc test' })).toBeFalsy();
        expect(domain.hasInvalidNameField({ name: 'abc' })).toBeTruthy();
        expect(domain.hasInvalidNameField({ name: 'ABC' })).toBeTruthy();
    });

    test('getDomainContainer', () => {
        const domain = DomainDesign.create({ name: 'Test Container' });
        expect(domain.getDomainContainer()).toBe('testContainerEntityId');

        const domain2 = DomainDesign.create({ name: 'Test Container', container: 'SOMETHINGELSE' });
        expect(domain2.getDomainContainer()).toBe('SOMETHINGELSE');
    });

    test('isSharedDomain', () => {
        const domain = DomainDesign.create({ name: 'Test Container' });
        expect(domain.isSharedDomain()).toBeFalsy();

        const domain2 = DomainDesign.create({ name: 'Test Container', container: 'SOMETHINGELSE' });
        expect(domain2.isSharedDomain()).toBeTruthy();
    });

    test('hasInvalidFields', () => {
        let domain = DomainDesign.create({ name: 'Test Fields', fields: [] });
        expect(domain.hasInvalidFields()).toBeFalsy();

        domain = DomainDesign.create({ name: 'Test Fields', fields: [{ name: 'abc' }] });
        expect(domain.hasInvalidFields()).toBeFalsy();

        domain = DomainDesign.create({ name: 'Test Fields', fields: [{}] });
        expect(domain.hasInvalidFields()).toBeTruthy();

        domain = DomainDesign.create({ name: 'Test Fields', fields: [{ name: undefined }] });
        expect(domain.hasInvalidFields()).toBeTruthy();

        domain = DomainDesign.create({ name: 'Test Fields', fields: [{ name: null }] });
        expect(domain.hasInvalidFields()).toBeTruthy();

        domain = DomainDesign.create({ name: 'Test Fields', fields: [{ name: '' }] });
        expect(domain.hasInvalidFields()).toBeTruthy();
    });

    test('getInvalidFields', () => {
        let domain = DomainDesign.create({ name: 'Test Fields', fields: [{ name: 'abc' }, { name: 'def' }] });
        expect(domain.getInvalidFields().size).toBe(0);

        domain = DomainDesign.create({ name: 'Test Fields', fields: [{ name: 'abc' }, { name: '' }] });
        expect(domain.getInvalidFields().size).toBe(1);
        expect(domain.getInvalidFields().has(0)).toBeFalsy();
        expect(domain.getInvalidFields().has(1)).toBeTruthy();

        domain = DomainDesign.create({ name: 'Test Fields', fields: [{ name: '' }, { name: '' }] });
        expect(domain.getInvalidFields().size).toBe(2);
        expect(domain.getInvalidFields().has(0)).toBeTruthy();
        expect(domain.getInvalidFields().has(1)).toBeTruthy();
    });

    test('getFirstFieldError', () => {
        let domain = DomainDesign.create({ name: 'Test Fields', fields: [{ name: 'abc' }, { name: 'def' }] });
        expect(domain.getFirstFieldError()).toBe(undefined);

        domain = DomainDesign.create({ name: 'Test Fields', fields: [{ name: 'abc' }, { name: '' }] });
        expect(domain.getFirstFieldError()).toBe(FieldErrors.MISSING_FIELD_NAME);

        domain = DomainDesign.create({
            name: 'Test Fields',
            fields: [
                { name: 'abc' },
                { name: 'def', rangeURI: INT_RANGE_URI, lookupSchema: undefined, lookupQuery: 'test' },
            ],
        });
        expect(domain.getFirstFieldError()).toBe(FieldErrors.MISSING_SCHEMA_QUERY);

        domain = DomainDesign.create({
            name: 'Test Fields',
            fields: [
                { name: '' },
                { name: 'def', rangeURI: INT_RANGE_URI, lookupSchema: undefined, lookupQuery: 'test' },
            ],
        });
        expect(domain.getFirstFieldError()).toBe(FieldErrors.MISSING_FIELD_NAME);
    });

    test('findFieldIndexByName', () => {
        const domain = DomainDesign.create({ name: 'Test Fields', fields: [{ name: 'abc' }, { name: 'def' }] });
        expect(domain.findFieldIndexByName(undefined)).toBe(-1);
        expect(domain.findFieldIndexByName(null)).toBe(-1);
        expect(domain.findFieldIndexByName('')).toBe(-1);
        expect(domain.findFieldIndexByName('ABC')).toBe(-1);
        expect(domain.findFieldIndexByName('abc')).toBe(0);
        expect(domain.findFieldIndexByName('defdef')).toBe(-1);
        expect(domain.findFieldIndexByName('def')).toBe(1);
    });

    test('getFieldDetails', () => {
        let fieldDetails = DomainDesign.create({
            fields: [
                { name: 'text1', rangeURI: TEXT_TYPE.rangeURI },
                { name: 'text2', rangeURI: TEXT_TYPE.rangeURI },
            ],
        }).getFieldDetails();
        expect(fieldDetails.ontologyLookupIndices.length).toBe(0);
        expect(fieldDetails.detailsInfo['text1']).toBe(undefined);
        expect(fieldDetails.detailsInfo['text2']).toBe(undefined);

        fieldDetails = DomainDesign.create({
            fields: [
                { name: 'text1', rangeURI: TEXT_TYPE.rangeURI },
                { name: 'text2', rangeURI: TEXT_TYPE.rangeURI },
                {
                    name: 'ont',
                    rangeURI: TEXT_TYPE.rangeURI,
                    conceptURI: CONCEPT_CODE_CONCEPT_URI,
                    sourceOntology: 'SRC',
                    conceptImportColumn: 'text1',
                    conceptLabelColumn: 'text2',
                },
            ],
        }).getFieldDetails();
        expect(fieldDetails.ontologyLookupIndices.length).toBe(1);
        expect(fieldDetails.ontologyLookupIndices[0]).toBe(2);
        expect(fieldDetails.detailsInfo['text1']).toBe('Ontology Lookup: ont');
        expect(fieldDetails.detailsInfo['text2']).toBe('Ontology Lookup: ont');

        fieldDetails = DomainDesign.create({
            fields: [
                { name: 'text1', rangeURI: TEXT_TYPE.rangeURI },
                { name: 'text2', rangeURI: TEXT_TYPE.rangeURI },
                {
                    name: '', // invalid name should prevent all field details info from being set
                    rangeURI: TEXT_TYPE.rangeURI,
                    conceptURI: CONCEPT_CODE_CONCEPT_URI,
                    sourceOntology: 'SRC',
                    conceptImportColumn: 'text1',
                    conceptLabelColumn: 'text2',
                },
            ],
        }).getFieldDetails();
        expect(fieldDetails.ontologyLookupIndices.length).toBe(0);
        expect(fieldDetails.detailsInfo['text1']).toBe(undefined);
        expect(fieldDetails.detailsInfo['text2']).toBe(undefined);
    });

    test('getGridData with ontology', () => {
        const gridData = GRID_DATA.getGridData(false, true);
        expect(gridData.toJS()).toStrictEqual(gridDataConstWithOntology);
    });

    test('getGridData without ontology', () => {
        const gridData = GRID_DATA.getGridData(false, false);
        expect(gridData.toJS()).toStrictEqual(gridDataConst);
    });

    test('getGridData appPropertiesOnly', () => {
        let gridData = GRID_DATA.getGridData(true, true);
        expect(gridData.toJS()).toStrictEqual(gridDataAppPropsOnlyConst);

        // should be the same with or without the Ontology module in this case
        gridData = GRID_DATA.getGridData(true, false);
        expect(gridData.toJS()).toStrictEqual(gridDataAppPropsOnlyConst);
    });

    test('getGridColumns', () => {
        const gridColumns = DomainDesign.create({
            fields: [
                { name: 'a', rangeURI: INTEGER_TYPE.rangeURI },
                { name: 'b', rangeURI: TEXT_TYPE.rangeURI },
            ],
        }).getGridColumns(jest.fn(), jest.fn(), 'domainKindName', false, false);

        expect(gridColumns.toJS().slice(2)).toStrictEqual(gridColumnsConst.slice(2));

        // Testing selection column. Must be handled especially due to cell function equality matching
        const selectionColTest = gridColumns.toJS()[0];
        delete selectionColTest.cell;
        const selectionColConstTest = gridColumnsConst[0] as GridColumn;
        delete selectionColConstTest.cell;
        expect(selectionColTest).toStrictEqual(selectionColConstTest);

        // Testing name column. Must be handled especially due to cell function equality matching
        const nameColTest = gridColumns.toJS()[1];
        delete nameColTest.cell;
        const nameColConstTest = gridColumnsConst[1] as GridColumn;
        delete nameColConstTest.cell;
        expect(nameColTest).toStrictEqual(nameColConstTest);
    });
});

describe('DomainField', () => {
    test('isNew', () => {
        const f1 = DomainField.create({ name: 'foo', rangeURI: TEXT_TYPE.rangeURI });
        expect(f1.isNew()).toBeTruthy();
        const f2 = DomainField.create({ name: 'foo', rangeURI: TEXT_TYPE.rangeURI, propertyId: 0 });
        expect(f2.isNew()).toBeFalsy();
    });

    test('isSaved', () => {
        const f1 = DomainField.create({ name: 'foo', rangeURI: TEXT_TYPE.rangeURI });
        expect(f1.isSaved()).toBeFalsy();
        const f2 = DomainField.create({ name: 'foo', rangeURI: TEXT_TYPE.rangeURI, propertyId: 0 });
        expect(f2.isSaved()).toBeFalsy();
        const f3 = DomainField.create({ name: 'foo', rangeURI: TEXT_TYPE.rangeURI, propertyId: 1 });
        expect(f3.isSaved()).toBeTruthy();
    });

    test('isPHI', () => {
        expect(DomainField.create({ name: 'foo', PHI: PHILEVEL_NOT_PHI }).isPHI()).toBeFalsy();
        expect(DomainField.create({ name: 'foo', PHI: PHILEVEL_LIMITED_PHI }).isPHI()).toBeTruthy();
        expect(DomainField.create({ name: 'foo', PHI: PHILEVEL_FULL_PHI }).isPHI()).toBeTruthy();
        expect(DomainField.create({ name: 'foo', PHI: PHILEVEL_RESTRICTED_PHI }).isPHI()).toBeTruthy();
    });

    test('updateDefaultValues', () => {
        const textField = DomainField.create({ name: 'foo', rangeURI: TEXT_TYPE.rangeURI });
        expect(textField.measure).toBeFalsy();
        expect(textField.dimension).toBeFalsy();
        const updatedTextField = DomainField.updateDefaultValues(textField);
        expect(updatedTextField.measure).toBeFalsy();
        expect(updatedTextField.dimension).toBeFalsy();

        const intField = DomainField.create({ name: 'foo', rangeURI: INTEGER_TYPE.rangeURI });
        expect(intField.measure).toBeFalsy();
        expect(intField.dimension).toBeFalsy();
        const updatedIntField = DomainField.updateDefaultValues(intField);
        expect(updatedIntField.measure).toBeTruthy();
        expect(updatedIntField.dimension).toBeFalsy();

        const dblField = DomainField.create({ name: 'foo', rangeURI: INTEGER_TYPE.rangeURI });
        expect(dblField.measure).toBeFalsy();
        expect(dblField.dimension).toBeFalsy();
        const updatedDblField = DomainField.updateDefaultValues(dblField);
        expect(updatedDblField.measure).toBeTruthy();
        expect(updatedDblField.dimension).toBeFalsy();
    });

    test('hasInvalidName', () => {
        expect(DomainField.create({}).hasInvalidName()).toBeTruthy();
        expect(DomainField.create({ name: undefined }).hasInvalidName()).toBeTruthy();
        expect(DomainField.create({ name: null }).hasInvalidName()).toBeTruthy();
        expect(DomainField.create({ name: '' }).hasInvalidName()).toBeTruthy();
        expect(DomainField.create({ name: 'test' }).hasInvalidName()).toBeFalsy();
    });

    test('getErrors', () => {
        // TODO add checks for FieldErrors.MISSING_SCHEMA_QUERY and FieldErrors.MISSING_DATA_TYPE

        expect(DomainField.create({ name: '' }).getErrors()).toBe(FieldErrors.MISSING_FIELD_NAME);
        expect(DomainField.create({ name: 'test' }).getErrors()).toBe(FieldErrors.NONE);

        expect(
            DomainField.create({
                name: 'test',
                rangeURI: STRING_RANGE_URI,
                conceptURI: CONCEPT_CODE_CONCEPT_URI,
                sourceOntology: undefined,
            }).getErrors()
        ).toBe(FieldErrors.MISSING_ONTOLOGY_PROPERTIES);
        expect(
            DomainField.create({
                name: 'test',
                rangeURI: STRING_RANGE_URI,
                conceptURI: CONCEPT_CODE_CONCEPT_URI,
                sourceOntology: 'test1',
            }).getErrors()
        ).toBe(FieldErrors.NONE);
    });

    test('getDetailsTextArray', () => {
        let field = DomainField.create({ propertyId: undefined, name: 'test' });
        expect(field.getDetailsTextArray(0).join('')).toBe('New Field');

        field = field.merge({ propertyId: 0, updatedField: true }) as DomainField;
        expect(field.getDetailsTextArray(0).join('')).toBe('Updated');

        field = field.merge({ dataType: SAMPLE_TYPE, lookupSchema: 'exp', lookupQuery: 'SampleType1' }) as DomainField;
        expect(field.getDetailsTextArray(0).join('')).toBe('Updated. SampleType1');

        field = field.merge({ dataType: LOOKUP_TYPE }) as DomainField;
        expect(field.getDetailsTextArray(0).join('')).toBe('Updated. Current Folder > exp > SampleType1');

        field = field.merge({ lookupContainer: 'Test Folder' }) as DomainField;
        expect(field.getDetailsTextArray(0).join('')).toBe('Updated. Test Folder > exp > SampleType1');

        field = field.merge({ dataType: ONTOLOGY_LOOKUP_TYPE, sourceOntology: 'SRC' }) as DomainField;
        expect(field.getDetailsTextArray(0).join('')).toBe('Updated. SRC');

        field = field.merge({ wrappedColumnName: 'Wrapped' }) as DomainField;
        expect(field.getDetailsTextArray(0).join('')).toBe('Updated. SRC. Wrapped column - Wrapped');

        field = field.merge({ wrappedColumnName: undefined, isPrimaryKey: true }) as DomainField;
        expect(field.getDetailsTextArray(0).join('')).toBe('Updated. SRC. Primary Key');

        field = field.merge({ lockType: DOMAIN_FIELD_FULLY_LOCKED }) as DomainField;
        expect(field.getDetailsTextArray(0).join('')).toBe('Updated. SRC. Primary Key. Locked');

        field = field.merge({ principalConceptCode: 'abc:123' }) as DomainField;
        expect(field.getDetailsTextArray(0).join('')).toBe(
            'Updated. SRC. Ontology Concept: abc:123. Primary Key. Locked'
        );

        expect(field.getDetailsTextArray(0, { test: 'Additional Info' }).join('')).toBe(
            'Updated. SRC. Ontology Concept: abc:123. Primary Key. Locked. Additional Info'
        );
        field = field.merge({ name: '' }) as DomainField;
        expect(field.getDetailsTextArray(0, { test: 'Additional Info' }).join('')).toBe(
            'Updated. SRC. Ontology Concept: abc:123. Primary Key. Locked'
        );

        CONCEPT_CACHE.set('abc:123', new ConceptModel({ code: 'abc:123', label: 'Concept display text' }));
        expect(field.getDetailsTextArray(0).join('')).toBe(
            'Updated. SRC. Ontology Concept: Concept display text (abc:123). Primary Key. Locked'
        );
    });

    test('getDetailsTextArray, textChoiceValidator', () => {
        let field = DomainField.create({ propertyId: undefined, name: 'test' });
        field = field.merge({
            dataType: TEXT_CHOICE_TYPE,
            textChoiceValidator: DEFAULT_TEXT_CHOICE_VALIDATOR,
        }) as DomainField;
        expect(field.getDetailsTextArray(0).join('')).toBe('New Field. ');

        field = field.merge({
            textChoiceValidator: new PropertyValidator({
                type: 'TextChoice',
                name: 'Text Choice Validator',
                properties: { validValues: ['a', 'b'] },
                shouldShowWarning: true,
            }),
        }) as DomainField;
        expect(field.getDetailsTextArray(0).join('')).toBe('New Field. a, b');

        field = field.merge({
            textChoiceValidator: new PropertyValidator({
                type: 'TextChoice',
                name: 'Text Choice Validator',
                properties: { validValues: ['a', 'b', 'c', 'd', 'e', 'f'] },
                shouldShowWarning: true,
            }),
        }) as DomainField;
        expect(field.getDetailsTextArray(0).join('')).toBe('New Field. a, b, c, d (and 2 more)');
    });

    test('serialize, name trim', () => {
        expect(DomainField.serialize(DomainField.create({})).name).toBe(undefined);
        expect(DomainField.serialize(DomainField.create({ name: '' })).name).toBe('');
        expect(DomainField.serialize(DomainField.create({ name: ' ' })).name).toBe('');
        expect(DomainField.serialize(DomainField.create({ name: 'test1 test2 ' })).name).toBe('test1 test2');
        expect(DomainField.serialize(DomainField.create({ name: ' test1 test2 ' })).name).toBe('test1 test2');
        expect(DomainField.serialize(DomainField.create({ name: 'test1 test2' })).name).toBe('test1 test2');
    });

    test('hasRegExValidation', () => {
        expect(
            DomainField.hasRegExValidation(DomainField.create({ name: 'foo', rangeURI: INTEGER_TYPE.rangeURI }))
        ).toBeFalsy();
        expect(
            DomainField.hasRegExValidation(
                DomainField.create({
                    name: 'foo',
                    rangeURI: TEXT_CHOICE_TYPE.rangeURI,
                    conceptURI: TEXT_CHOICE_TYPE.conceptURI,
                })
            )
        ).toBeFalsy();
        expect(
            DomainField.hasRegExValidation(
                DomainField.create({
                    name: 'foo',
                    rangeURI: UNIQUE_ID_TYPE.rangeURI,
                    conceptURI: UNIQUE_ID_TYPE.conceptURI,
                })
            )
        ).toBeFalsy();
        expect(DomainField.hasRegExValidation(DomainField.create({}))).toBeTruthy();
    });

    test('hasRangeValidation', () => {
        expect(
            DomainField.hasRangeValidation(DomainField.create({ name: 'foo', rangeURI: TEXT_TYPE.rangeURI }))
        ).toBeFalsy();
        expect(
            DomainField.hasRangeValidation(DomainField.create({ name: 'foo', rangeURI: BOOLEAN_TYPE.rangeURI }))
        ).toBeFalsy();
        expect(
            DomainField.hasRangeValidation(DomainField.create({ name: 'foo', rangeURI: INTEGER_TYPE.rangeURI }))
        ).toBeTruthy();
        expect(
            DomainField.hasRangeValidation(DomainField.create({ name: 'foo', rangeURI: DOUBLE_TYPE.rangeURI }))
        ).toBeTruthy();
        expect(
            DomainField.hasRangeValidation(DomainField.create({ name: 'foo', rangeURI: DATETIME_TYPE.rangeURI }))
        ).toBeTruthy();
    });

    // TODO add other test cases for DomainField.serialize code
});

describe('PropertyValidator', () => {
    const validators = [
        { type: 'Range', name: 'Range Validator 1', rowId: 1 },
        { type: 'Range', name: 'Range Validator 2', rowId: 2 },
        { type: 'Range', name: 'Range Validator 3', rowId: 3 },
        { type: 'RegEx', name: 'RegEx Validator 1', rowId: 4 },
        { type: 'RegEx', name: 'RegEx Validator 2', rowId: 5 },
        { type: 'Lookup', name: 'Lookup Validator', rowId: 6 },
        { type: 'TextChoice', name: 'Text Choice Validator', rowId: 7, properties: { validValues: [] } },
        { type: 'Other', name: 'Text Choice Validator', rowId: 8 },
    ];

    test('expected validator types', () => {
        expect(PropertyValidator.fromJS(validators, 'Range').size).toBe(3);
        expect(PropertyValidator.fromJS(validators, 'RegEx').size).toBe(2);
        expect(PropertyValidator.fromJS(validators, 'Lookup').size).toBe(1);
        expect(PropertyValidator.fromJS(validators, 'TextChoice').size).toBe(1);
        expect(PropertyValidator.fromJS(validators, 'Other').size).toBe(0);
    });

    test('shouldShowWarning', () => {
        const pvs = PropertyValidator.fromJS(validators, 'TextChoice');
        expect(pvs.size).toBe(1);
        expect(pvs.get(0).shouldShowWarning).toBeTruthy();
    });

    test('TextChoice validValues', () => {
        let pvs = PropertyValidator.fromJS(validators, 'TextChoice');
        expect(pvs.size).toBe(1);
        expect(pvs.get(0).properties.validValues).toStrictEqual([]);

        pvs = PropertyValidator.fromJS(
            [{ type: 'TextChoice', name: 'Text Choice Validator', expression: 'a|b', properties: {} }],
            'TextChoice'
        );
        expect(pvs.size).toBe(1);
        expect(pvs.get(0).properties.validValues).toStrictEqual(['a', 'b']);
    });

    test('isNewField', () => {
        let pvs = PropertyValidator.fromJS(validators, 'TextChoice');
        expect(pvs.size).toBe(1);
        expect(pvs.get(0).rowId).toBeDefined();

        pvs = PropertyValidator.fromJS(validators, 'TextChoice', true);
        expect(pvs.size).toBe(1);
        expect(pvs.get(0).rowId).toBeUndefined();
    });

    test('serialize', () => {
        const pvs = PropertyValidator.serialize(PropertyValidator.fromJS(validators, 'TextChoice').toJS());
        expect(pvs.length).toBe(1);
        expect(pvs[0].properties.failOnMatch).toBeDefined();
        expect(pvs[0].properties.validValues).toBeUndefined();
        expect(pvs[0].shouldShowWarning).toBeUndefined();
    });
});

describe('PropertyValidatorProperties', () => {
    test('constructor default', () => {
        const props = new PropertyValidatorProperties({});
        expect(props.failOnMatch).toBe(false);
        expect(props.validValues).toBe(undefined);
    });

    test('constructor failOnMatch', () => {
        let props = new PropertyValidatorProperties({ failOnMatch: true });
        expect(props.failOnMatch).toBe(true);

        props = new PropertyValidatorProperties({ failOnMatch: false });
        expect(props.failOnMatch).toBe(false);

        props = new PropertyValidatorProperties({ failOnMatch: 'true' });
        expect(props.failOnMatch).toBe(true);

        props = new PropertyValidatorProperties({ failOnMatch: 'false' });
        expect(props.failOnMatch).toBe(false);
    });

    test('constructor validValues', () => {
        let props = new PropertyValidatorProperties({ validValues: ['a', 'b'] });
        expect(props.validValues).toStrictEqual(['a', 'b']);

        props = new PropertyValidatorProperties({ validValues: '' });
        expect(props.validValues).toStrictEqual(['']);

        props = new PropertyValidatorProperties({ validValues: 'a|b' });
        expect(props.validValues).toStrictEqual(['a', 'b']);
    });
});

describe('getValidValuesDetailStr', () => {
    test('empty', () => {
        expect(getValidValuesDetailStr(undefined)).toBeUndefined();
        expect(getValidValuesDetailStr(null)).toBeUndefined();
        expect(getValidValuesDetailStr([])).toBeUndefined();
        expect(getValidValuesDetailStr([null, undefined, '', ' '])).toBeUndefined();
    });

    test('with values', () => {
        expect(getValidValuesDetailStr(['a'])).toBe('a');
        expect(getValidValuesDetailStr(['a', 'b'])).toBe('a, b');
        expect(getValidValuesDetailStr(['a', 'b', 'c'])).toBe('a, b, c');
        expect(getValidValuesDetailStr(['a', 'b', 'c', 'd'])).toBe('a, b, c, d');
        expect(getValidValuesDetailStr(['a', 'b', 'c', 'd', 'e'])).toBe('a, b, c, d (and 1 more)');
        expect(getValidValuesDetailStr(['a', 'b', 'c', 'd', 'e', 'f'])).toBe('a, b, c, d (and 2 more)');
    });

    test('with extra long values', () => {
        expect(
            getValidValuesDetailStr([
                'aaaaaaaaa aaaaaaaaa aaaaaaaaa aaaaaaaaa aaaaaaaaa aaaaaaaaa aaaaaaaaa aaaaaaaaa a',
            ])
        ).toBe('1 value');

        expect(
            getValidValuesDetailStr([
                'aaaaaaaaa aaaaaaaaa aaaaaaaaa aaaaaaaaa aaaaaaaaa',
                'bbbbbbbbb bbbbbbbbb bbbbbbbbb bbbbbbbbb bbbbbbbbb',
            ])
        ).toBe('2 values');

        expect(
            getValidValuesDetailStr([
                'a',
                'b',
                'c',
                'd',
                'e',
                'f',
                'aaaaaaaaa aaaaaaaaa aaaaaaaaa aaaaaaaaa aaaaaaaaa aaaaaaaaa aaaaaaaaa aaaaaaaaa a',
            ])
        ).toBe('a, b, c, d (and 3 more)');
    });
});

describe('getValidValuesFromArray', () => {
    test('empty', () => {
        expect(getValidValuesFromArray(undefined)).toStrictEqual([]);
        expect(getValidValuesFromArray(null)).toStrictEqual([]);
        expect(getValidValuesFromArray([])).toStrictEqual([]);
    });

    test('filter', () => {
        expect(getValidValuesFromArray(['a', null, undefined, '', ' ', 'b'])).toStrictEqual(['a', 'b']);
    });

    test('remove duplicates', () => {
        expect(getValidValuesFromArray(['a', 'a', 'a', 'b'])).toStrictEqual(['a', 'b']);
    });
});

describe('isValidTextChoiceValue', () => {
    test('empty', () => {
        expect(isValidTextChoiceValue(undefined)).toBeFalsy();
        expect(isValidTextChoiceValue(null)).toBeFalsy();
        expect(isValidTextChoiceValue('')).toBeFalsy();
        expect(isValidTextChoiceValue(' ')).toBeFalsy();
    });

    test('valid', () => {
        expect(isValidTextChoiceValue('a')).toBeTruthy();
        expect(isValidTextChoiceValue(' a')).toBeTruthy();
        expect(isValidTextChoiceValue('a ')).toBeTruthy();
        expect(isValidTextChoiceValue(' a ')).toBeTruthy();
    });
});
