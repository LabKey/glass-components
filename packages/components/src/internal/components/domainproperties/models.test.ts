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
import { List } from 'immutable';

import { GRID_NAME_INDEX, GRID_SELECTION_INDEX } from '../../constants';

import { CONCEPT_CACHE } from '../ontology/actions';

import { GridColumn, GridColumnProps } from '../base/models/GridColumn';

import { ConceptModel } from '../ontology/models';

import {
    ATTACHMENT_TYPE,
    AUTOINT_TYPE,
    BOOLEAN_TYPE,
    CALCULATED_TYPE,
    DATE_TYPE,
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
    TIME_TYPE,
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
    DomainIndex,
    IDomainIndex,
    FieldErrors,
    getValidValuesDetailStr,
    getValidValuesFromArray,
    IDomainField,
    isPropertyTypeAllowed,
    isValidTextChoiceValue,
    PropertyValidator,
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
    DERIVATION_DATA_SCOPES,
    DOMAIN_FIELD_PRIMARY_KEY_LOCKED,
    DATETIME_RANGE_URI,
    DATE_RANGE_URI,
    TIME_RANGE_URI,
    CALCULATED_CONCEPT_URI,
} from './constants';

beforeAll(() => {
    LABKEY.container = {
        id: 'testContainerEntityId',
        title: 'Test Container',
        path: '/testContainer',
    };
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
        valueExpression: '',
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
        valueExpression: '',
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

const noop: any = () => {};

const gridColumnsConst: GridColumnProps[] = [
    new GridColumn({
        index: GRID_SELECTION_INDEX,
        title: GRID_SELECTION_INDEX,
        width: 20,
        cell: noop,
    }),
    new GridColumn({
        index: GRID_NAME_INDEX,
        title: GRID_NAME_INDEX,
        raw: { index: 'name', caption: 'Name' },
        cell: noop,
    }),
    { index: 'URL', title: 'URL' },
    { index: 'PHI', title: 'PHI' },
    { index: 'rangeURI', title: 'Range URI' },
    { index: 'required', title: 'Required' },
    { index: 'lockType', title: 'Lock Type' },
    { index: 'lookupContainer', title: 'Lookup Container' },
    { index: 'lookupSchema', title: 'Lookup Schema' },
    { index: 'lookupQuery', title: 'Lookup Query' },
    { index: 'format', title: 'Format' },
    { index: 'defaultScale', title: 'Default Scale' },
    { index: 'conceptURI', title: 'Concept URI' },
    { index: 'scale', title: 'Scale' },
    { index: 'description', title: 'Description' },
    { index: 'label', title: 'Label' },
    { index: 'importAliases', title: 'Import Aliases' },
    { index: 'conditionalFormats', title: 'Conditional Formats' },
    { index: 'propertyValidators', title: 'Property Validators' },
    { index: 'valueExpression', title: 'Value Expression' },
    { index: 'hidden', title: 'Hidden' },
    { index: 'shownInUpdateView', title: 'Shown In Update View' },
    { index: 'shownInInsertView', title: 'Shown In Insert View' },
    { index: 'shownInDetailsView', title: 'Shown In Details View' },
    { index: 'defaultValueType', title: 'Default Value Type' },
    { index: 'defaultValue', title: 'Default Value' },
    { index: 'defaultDisplayValue', title: 'Default Display Value' },
    { index: 'excludeFromShifting', title: 'Exclude From Shifting' },
    { index: 'measure', title: 'Measure' },
    { index: 'dimension', title: 'Dimension' },
    { index: 'recommendedVariable', title: 'Recommended Variable' },
    { index: 'mvEnabled', title: 'Mv Enabled' },
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
        expect(PropDescType.fromName('date')).toBe(DATE_TYPE);
        expect(PropDescType.fromName('time')).toBe(TIME_TYPE);
    });

    test('isCalculation', () => {
        expect(PropDescType.isCalculation('text')).toBeFalsy();
        expect(PropDescType.isCalculation('Calculation')).toBeFalsy();
        expect(PropDescType.isCalculation('calculation')).toBeTruthy();
        expect(PropDescType.isCalculation(CALCULATED_CONCEPT_URI)).toBeTruthy();
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
        expect(isPropertyTypeAllowed(true, TEXT_TYPE, true, false)).toBeTruthy();
        expect(isPropertyTypeAllowed(true, LOOKUP_TYPE, true, false)).toBeFalsy();
        expect(isPropertyTypeAllowed(true, MULTILINE_TYPE, true, false)).toBeTruthy();
        expect(isPropertyTypeAllowed(true, BOOLEAN_TYPE, true, false)).toBeTruthy();
        expect(isPropertyTypeAllowed(true, INTEGER_TYPE, true, false)).toBeTruthy();
        expect(isPropertyTypeAllowed(true, DOUBLE_TYPE, true, false)).toBeTruthy();
        expect(isPropertyTypeAllowed(true, DATETIME_TYPE, true, false)).toBeTruthy();
        expect(isPropertyTypeAllowed(true, FLAG_TYPE, true, false)).toBeFalsy();
        expect(isPropertyTypeAllowed(true, FILE_TYPE, false, false)).toBeFalsy();
        expect(isPropertyTypeAllowed(true, FILE_TYPE, true, false)).toBeTruthy();
        expect(isPropertyTypeAllowed(true, ATTACHMENT_TYPE, true, false)).toBeTruthy();
        expect(isPropertyTypeAllowed(true, USERS_TYPE, true, false)).toBeTruthy();
        expect(isPropertyTypeAllowed(true, SAMPLE_TYPE, true, false)).toBeTruthy();
        expect(isPropertyTypeAllowed(true, PARTICIPANT_TYPE, true, false)).toBeFalsy();
        expect(isPropertyTypeAllowed(true, PARTICIPANT_TYPE, true, true)).toBeTruthy();
        expect(isPropertyTypeAllowed(true, ONTOLOGY_LOOKUP_TYPE, true, false)).toBeFalsy();
        expect(isPropertyTypeAllowed(true, TEXT_CHOICE_TYPE, true, false)).toBeTruthy();
        expect(isPropertyTypeAllowed(true, VISIT_DATE_TYPE, true, false)).toBeFalsy();
        expect(isPropertyTypeAllowed(true, VISIT_DATE_TYPE, true, true)).toBeTruthy();
        expect(isPropertyTypeAllowed(true, VISIT_ID_TYPE, true, false)).toBeFalsy();
        expect(isPropertyTypeAllowed(true, VISIT_ID_TYPE, true, true)).toBeTruthy();
        expect(isPropertyTypeAllowed(false, VISIT_ID_TYPE, true, true)).toBeTruthy();
        expect(isPropertyTypeAllowed(false, VISIT_ID_TYPE, true, false)).toBeFalsy();
        expect(isPropertyTypeAllowed(false, FILE_TYPE, false, false)).toBeFalsy();
        expect(isPropertyTypeAllowed(false, FLAG_TYPE, true, false)).toBeTruthy();
        expect(isPropertyTypeAllowed(true, CALCULATED_TYPE, true, false)).toBeTruthy();
        expect(isPropertyTypeAllowed(false, CALCULATED_TYPE, true, false)).toBeTruthy();
    });

    test('isPropertyTypeAllowed with premium', () => {
        LABKEY.moduleContext.api = { moduleNames: ['premium'] };
        expect(isPropertyTypeAllowed(true, TEXT_TYPE, true, false)).toBeTruthy();
        expect(isPropertyTypeAllowed(true, LOOKUP_TYPE, true, false)).toBeTruthy();
        expect(isPropertyTypeAllowed(true, MULTILINE_TYPE, true, false)).toBeTruthy();
        expect(isPropertyTypeAllowed(true, BOOLEAN_TYPE, true, false)).toBeTruthy();
        expect(isPropertyTypeAllowed(true, INTEGER_TYPE, true, false)).toBeTruthy();
        expect(isPropertyTypeAllowed(true, DOUBLE_TYPE, true, false)).toBeTruthy();
        expect(isPropertyTypeAllowed(true, DATETIME_TYPE, true, false)).toBeTruthy();
        expect(isPropertyTypeAllowed(true, FLAG_TYPE, true, false)).toBeTruthy();
        expect(isPropertyTypeAllowed(false, FLAG_TYPE, true, false)).toBeTruthy();
        expect(isPropertyTypeAllowed(true, FILE_TYPE, false, false)).toBeFalsy();
        expect(isPropertyTypeAllowed(false, FILE_TYPE, false, false)).toBeFalsy();
        expect(isPropertyTypeAllowed(true, FILE_TYPE, true, false)).toBeTruthy();
        expect(isPropertyTypeAllowed(false, FILE_TYPE, true, false)).toBeTruthy();
        expect(isPropertyTypeAllowed(true, ATTACHMENT_TYPE, true, false)).toBeTruthy();
        expect(isPropertyTypeAllowed(true, USERS_TYPE, true, false)).toBeTruthy();
        expect(isPropertyTypeAllowed(true, SAMPLE_TYPE, true, false)).toBeTruthy();
        expect(isPropertyTypeAllowed(true, PARTICIPANT_TYPE, true, false)).toBeFalsy();
        expect(isPropertyTypeAllowed(true, PARTICIPANT_TYPE, true, true)).toBeTruthy();
        expect(isPropertyTypeAllowed(true, ONTOLOGY_LOOKUP_TYPE, true, false)).toBeTruthy();
        expect(isPropertyTypeAllowed(true, TEXT_CHOICE_TYPE, true, false)).toBeTruthy();
        expect(isPropertyTypeAllowed(true, VISIT_DATE_TYPE, true, false)).toBeFalsy();
        expect(isPropertyTypeAllowed(true, VISIT_DATE_TYPE, true, true)).toBeTruthy();
        expect(isPropertyTypeAllowed(true, VISIT_ID_TYPE, true, false)).toBeFalsy();
        expect(isPropertyTypeAllowed(true, VISIT_ID_TYPE, true, true)).toBeTruthy();
        expect(isPropertyTypeAllowed(false, VISIT_ID_TYPE, true, true)).toBeTruthy();
        expect(isPropertyTypeAllowed(true, CALCULATED_TYPE, true, true)).toBeTruthy();
        expect(isPropertyTypeAllowed(false, CALCULATED_TYPE, true, true)).toBeTruthy();
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
        expect(acceptablePropertyType(DATE_TYPE, DATETIME_RANGE_URI)).toBeTruthy();
        expect(acceptablePropertyType(TIME_TYPE, DATETIME_RANGE_URI)).toBeTruthy();
        expect(acceptablePropertyType(DATETIME_TYPE, DATE_RANGE_URI)).toBeTruthy();
        expect(acceptablePropertyType(DATETIME_TYPE, TIME_RANGE_URI)).toBeFalsy();
        expect(acceptablePropertyType(DATE_TYPE, TIME_RANGE_URI)).toBeFalsy();
        expect(acceptablePropertyType(TIME_TYPE, DATE_RANGE_URI)).toBeFalsy();
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
        const gridData = GRID_DATA.getGridData(false, true, false);
        expect(gridData.toJS()).toStrictEqual(gridDataConstWithOntology);
    });

    test('getGridData without ontology', () => {
        const gridData = GRID_DATA.getGridData(false, false, false);
        expect(gridData.toJS()).toStrictEqual(gridDataConst);
    });

    test('getGridData appPropertiesOnly', () => {
        let gridData = GRID_DATA.getGridData(true, true, false);
        expect(gridData.toJS()).toStrictEqual(gridDataAppPropsOnlyConst);

        // should be the same with or without the Ontology module in this case
        gridData = GRID_DATA.getGridData(true, false, false);
        expect(gridData.toJS()).toStrictEqual(gridDataAppPropsOnlyConst);
    });

    test('getGridData with filterCriteria', () => {
        const expected = [
            {
                ...gridDataAppPropsOnlyConst[0],
                filterCriteria: '',
            },
        ];
        let gridData = GRID_DATA.getGridData(true, true, true);
        expect(gridData.toJS()).toStrictEqual(expected);

        // should be the same with or without the Ontology module in this case
        gridData = GRID_DATA.getGridData(true, false, true);
        expect(gridData.toJS()).toStrictEqual(expected);
    });

    test('getGridColumns', () => {
        const gridColumns = DomainDesign.create({
            fields: [
                { name: 'a', rangeURI: INTEGER_TYPE.rangeURI },
                { name: 'b', rangeURI: TEXT_TYPE.rangeURI },
            ],
        }).getGridColumns(jest.fn(), jest.fn(), 'domainKindName', false, false, false);

        expect(gridColumns.slice(2)).toStrictEqual(gridColumnsConst.slice(2));

        // Testing selection column. Must be handled especially due to cell function equality matching
        const selectionColTest = gridColumns[0];
        delete selectionColTest.cell;
        const selectionColConstTest = gridColumnsConst[0];
        delete selectionColConstTest.cell;
        expect(selectionColTest).toStrictEqual(selectionColConstTest);

        // Testing name column. Must be handled especially due to cell function equality matching
        const nameColTest = gridColumns[1];
        delete nameColTest.cell;
        const nameColConstTest = gridColumnsConst[1];
        delete nameColConstTest.cell;
        expect(nameColTest).toStrictEqual(nameColConstTest);

        const gridColumnsWithFilterCriteria = DomainDesign.create({
            fields: [
                { name: 'a', rangeURI: INTEGER_TYPE.rangeURI },
                { name: 'b', rangeURI: TEXT_TYPE.rangeURI },
            ],
        }).getGridColumns(jest.fn(), jest.fn(), 'domainKindName', false, false, true);
        const expectedFilterCriteriaColumn = { index: 'filterCriteria', title: 'Filter Criteria' };
        expect(gridColumnsWithFilterCriteria.find(c => c.index === 'filterCriteria')).toStrictEqual(
            expectedFilterCriteriaColumn
        );
    });

    test('uniqueConstraintFieldNames in create', () => {
        const dd = DomainDesign.create({
            fields: [
                { name: 'a', rangeURI: INTEGER_TYPE.rangeURI },
                { name: 'b', rangeURI: TEXT_TYPE.rangeURI },
            ],
            indices: [
                { columnNames: ['a', 'b', 'c'], unique: true },
                { columnNames: ['a'], unique: true },
                { columnNames: ['b'], unique: false },
                { columnNames: ['c'], unique: true },
            ],
        });
        expect(dd.indices.size).toBe(4);
        expect(dd.fields.get(0).uniqueConstraint).toBe(true); // field a
        expect(dd.fields.get(1).uniqueConstraint).toBe(false); // field b
    });

    test('serialize indices', () => {
        const dd = DomainDesign.create({
            fields: [
                { name: 'a', rangeURI: INTEGER_TYPE.rangeURI },
                { name: 'b', rangeURI: TEXT_TYPE.rangeURI },
            ],
            indices: [
                { columnNames: ['a', 'b', 'c'], unique: true },
                { columnNames: ['a'], unique: true },
                { columnNames: ['b'], unique: false },
                { columnNames: ['c'], unique: true },
            ],
        });
        const ddJson = DomainDesign.serialize(dd);
        expect(ddJson.indices.length).toBe(3);
        expect(ddJson.indices[0].columnNames).toStrictEqual(['a', 'b', 'c']);
        expect(ddJson.indices[0].unique).toBe(true);
        expect(ddJson.indices[1].columnNames).toStrictEqual(['b']);
        expect(ddJson.indices[1].unique).toBe(false);
        expect(ddJson.indices[2].columnNames).toStrictEqual(['a']);
        expect(ddJson.indices[2].unique).toBe(true);
    });
});

describe('DomainField', () => {
    const CONCEPT_A = new ConceptModel({ code: 'abc:123', label: 'ABC 123' });
    beforeAll(() => {
        // prime cache
        CONCEPT_CACHE.set(CONCEPT_A.code, CONCEPT_A);
    });

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
        const f4 = DomainField.create({
            name: 'foo',
            conceptURI: CALCULATED_CONCEPT_URI,
            rangeURI: undefined,
            propertyId: 0,
        });
        expect(f4.isSaved()).toBeFalsy();
        const f5 = DomainField.create({
            name: 'foo',
            conceptURI: CALCULATED_CONCEPT_URI,
            rangeURI: TEXT_TYPE.rangeURI,
            propertyId: 0,
        });
        expect(f5.isSaved()).toBeTruthy();
    });

    test('isPHI', () => {
        expect(DomainField.create({ name: 'foo', PHI: undefined }).isPHI()).toBeFalsy();
        expect(DomainField.create({ name: 'foo', PHI: null }).isPHI()).toBeFalsy();
        expect(DomainField.create({ name: 'foo', PHI: PHILEVEL_NOT_PHI }).isPHI()).toBeFalsy();
        expect(DomainField.create({ name: 'foo', PHI: PHILEVEL_LIMITED_PHI }).isPHI()).toBeTruthy();
        expect(DomainField.create({ name: 'foo', PHI: PHILEVEL_FULL_PHI }).isPHI()).toBeTruthy();
        expect(DomainField.create({ name: 'foo', PHI: PHILEVEL_RESTRICTED_PHI }).isPHI()).toBeTruthy();
    });

    test('isCalculatedField', () => {
        expect(DomainField.create({ name: 'foo' }).isCalculatedField()).toBeFalsy();
        expect(
            DomainField.create({ name: 'foo', conceptURI: TEXT_CHOICE_CONCEPT_URI }).isCalculatedField()
        ).toBeFalsy();
        expect(
            DomainField.create({ name: 'foo', conceptURI: CALCULATED_CONCEPT_URI }).isCalculatedField()
        ).toBeTruthy();
    });

    test('isDeletable', () => {
        expect(DomainField.create({ name: 'foo', lockExistingField: true }).isDeletable()).toBeFalsy();
        expect(DomainField.create({ name: 'foo', lockType: DOMAIN_FIELD_PARTIALLY_LOCKED }).isDeletable()).toBeFalsy();
        expect(DomainField.create({ name: 'foo', lockType: DOMAIN_FIELD_FULLY_LOCKED }).isDeletable()).toBeFalsy();
        expect(
            DomainField.create({ name: 'foo', lockType: DOMAIN_FIELD_PRIMARY_KEY_LOCKED }).isDeletable()
        ).toBeFalsy();
        expect(DomainField.create({ name: 'foo', lockType: DOMAIN_FIELD_NOT_LOCKED }).isDeletable()).toBeTruthy();
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
        expect(DomainField.create({ name: 'test' }).getErrors()).toBe(FieldErrors.NONE);
        expect(DomainField.create({ name: '' }).getErrors()).toBe(FieldErrors.MISSING_FIELD_NAME);

        expect(DomainField.create({ name: 'test', rangeURI: INT_RANGE_URI, dataType: LOOKUP_TYPE }).getErrors()).toBe(
            FieldErrors.MISSING_SCHEMA_QUERY
        );
        expect(
            DomainField.create({
                name: 'test',
                rangeURI: INT_RANGE_URI,
                dataType: LOOKUP_TYPE,
                lookupSchema: 'schema',
            }).getErrors()
        ).toBe(FieldErrors.MISSING_SCHEMA_QUERY);
        expect(
            DomainField.create({
                name: 'test',
                rangeURI: INT_RANGE_URI,
                dataType: LOOKUP_TYPE,
                lookupSchema: 'schema',
                lookupQuery: 'query',
            }).getErrors()
        ).toBe(FieldErrors.INVALID_LOOKUP);

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
                name: 'req',
                required: true,
                derivationDataScope: DERIVATION_DATA_SCOPES.CHILD_ONLY,
            }).getErrors()
        ).toBe(FieldErrors.ALIQUOT_ONLY_REQUIRED);

        expect(
            DomainField.create({
                name: 'test',
                rangeURI: STRING_RANGE_URI,
                conceptURI: CONCEPT_CODE_CONCEPT_URI,
                sourceOntology: 'test1',
            }).getErrors()
        ).toBe(FieldErrors.NONE);

        expect(
            DomainField.create({
                name: 'test',
                rangeURI: STRING_RANGE_URI,
                conceptURI: CALCULATED_CONCEPT_URI,
                valueExpression: '  ',
            }).getErrors()
        ).toBe(FieldErrors.MISSING_CALCULATION_EXPRESSION);

        expect(
            DomainField.create({
                name: 'test',
                rangeURI: STRING_RANGE_URI,
                conceptURI: CALCULATED_CONCEPT_URI,
                valueExpression: ' 1+1 ',
            }).getErrors()
        ).toBe(FieldErrors.NONE);
    });

    test('getDetailsArray', () => {
        let field = DomainField.create({ propertyId: undefined, name: 'test' });
        expect(field.getDetailsArray().join('')).toBe('New Field');

        field = field.merge({ propertyId: 0, updatedField: true }) as DomainField;
        expect(field.getDetailsArray().join('')).toBe('Updated');

        field = field.merge({ dataType: SAMPLE_TYPE, lookupSchema: 'exp', lookupQuery: 'SampleType1' }) as DomainField;
        expect(field.getDetailsArray().join('')).toBe('Updated. SampleType1');

        field = field.merge({ dataType: LOOKUP_TYPE }) as DomainField;
        expect(field.getDetailsArray().slice(0, 2).join('')).toBe('Updated. Current Folder > exp');
        expect((field.getDetailsArray()[3] as any).props.href).toBe(
            '/labkey/query/testContainer/executeQuery.view?schemaName=exp&query.queryName=SampleType1'
        );

        field = field.merge({ lookupContainer: 'Test Folder' }) as DomainField;
        expect(field.getDetailsArray().slice(0, 2).join('')).toBe('Updated. Test Folder > exp');
        expect((field.getDetailsArray()[3] as any).props.href).toBe(
            '/labkey/query/Test%20Folder/executeQuery.view?schemaName=exp&query.queryName=SampleType1'
        );

        field = field.merge({ dataType: ONTOLOGY_LOOKUP_TYPE, sourceOntology: 'SRC' }) as DomainField;
        expect(field.getDetailsArray().join('')).toBe('Updated. SRC');

        field = field.merge({ wrappedColumnName: 'Wrapped' }) as DomainField;
        expect(field.getDetailsArray().join('')).toBe('Updated. SRC. Wrapped column - Wrapped');

        field = field.merge({ wrappedColumnName: undefined, isPrimaryKey: true }) as DomainField;
        expect(field.getDetailsArray().join('')).toBe('Updated. SRC. Primary Key');

        field = field.merge({ lockType: DOMAIN_FIELD_FULLY_LOCKED }) as DomainField;
        expect(field.getDetailsArray().join('')).toBe('Updated. SRC. Primary Key. Locked');

        field = field.merge({ principalConceptCode: 'abc:123' }) as DomainField;
        expect(field.getDetailsArray().join('')).toBe(
            'Updated. SRC. Ontology Concept: ABC 123 (abc:123). Primary Key. Locked'
        );

        expect(field.getDetailsArray({ test: 'Additional Info' }).join('')).toBe(
            'Updated. SRC. Ontology Concept: ABC 123 (abc:123). Primary Key. Locked. Additional Info'
        );
        field = field.merge({ name: '' }) as DomainField;
        expect(field.getDetailsArray({ test: 'Additional Info' }).join('')).toBe(
            'Updated. SRC. Ontology Concept: ABC 123 (abc:123). Primary Key. Locked'
        );

        CONCEPT_CACHE.set('abc:123', new ConceptModel({ code: 'abc:123', label: 'Concept display text' }));
        expect(field.getDetailsArray().join('')).toBe(
            'Updated. SRC. Ontology Concept: Concept display text (abc:123). Primary Key. Locked'
        );
    });

    test('getDetailsTextArray, textChoiceValidator', () => {
        let field = DomainField.create({ propertyId: undefined, name: 'test' });
        field = field.merge({
            dataType: TEXT_CHOICE_TYPE,
            textChoiceValidator: DEFAULT_TEXT_CHOICE_VALIDATOR,
        }) as DomainField;
        expect(field.getDetailsArray().join('')).toBe('New Field. ');

        field = field.merge({
            textChoiceValidator: new PropertyValidator({
                type: 'TextChoice',
                name: 'Text Choice Validator',
                properties: { validValues: ['a', 'b'] },
                shouldShowWarning: true,
            }),
        }) as DomainField;
        expect(field.getDetailsArray().join('')).toBe('New Field. a, b');

        field = field.merge({
            textChoiceValidator: new PropertyValidator({
                type: 'TextChoice',
                name: 'Text Choice Validator',
                properties: { validValues: ['a', 'b', 'c', 'd', 'e', 'f'] },
                shouldShowWarning: true,
            }),
        }) as DomainField;
        expect(field.getDetailsArray().join('')).toBe('New Field. a, b, c, d (and 2 more)');

        // Saved fields with no choice values should warn
        let fieldSaved = DomainField.create({ propertyId: 1, name: 'testSaved', rangeURI: TEXT_CHOICE_TYPE.rangeURI });
        fieldSaved = fieldSaved.merge({
            dataType: TEXT_CHOICE_TYPE,
            textChoiceValidator: new PropertyValidator({
                type: 'TextChoice',
                name: 'Text Choice Validator',
                properties: { validValues: [] },
                shouldShowWarning: true,
            }),
        }) as DomainField;

        expect(fieldSaved.getDetailsArray()[0]).toBe('');
        expect((fieldSaved.getDetailsArray()[1] as any).props.fieldError.message).toBe(
            'No text choice values defined.'
        );

        // Saved PHI fields with no choice values should warn similarly
        fieldSaved = fieldSaved.merge({
            PHI: PHILEVEL_LIMITED_PHI,
        }) as DomainField;

        expect(fieldSaved.getDetailsArray()[0]).toBe('');
        expect((fieldSaved.getDetailsArray()[1] as any).props.fieldError.message).toBe(
            'No text choice values defined.'
        );

        // Only saved PHI fields with text choice values should notify that values will be visible
        fieldSaved = fieldSaved.merge({
            textChoiceValidator: new PropertyValidator({
                type: 'TextChoice',
                name: 'Text Choice Validator',
                properties: { validValues: ['a', 'b'] },
                shouldShowWarning: true,
            }),
        }) as DomainField;

        expect(fieldSaved.getDetailsArray().join('')).toBe(
            'Note: These text choice options are visible to all administrators, including those not granted any PHI reader role.'
        );
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
        expect(
            DomainField.hasRegExValidation(
                DomainField.create({
                    name: 'foo',
                    conceptURI: CALCULATED_TYPE.conceptURI,
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

    test('uniqueConstraintFieldNames in fromJS', () => {
        const fields = DomainField.fromJS(
            [{ name: 'a' } as IDomainField, { name: 'b' } as IDomainField, { name: 'c' } as IDomainField],
            undefined,
            List.of('A', 'b', 'd')
        );
        expect(fields.get(0).uniqueConstraint).toBe(true); // field a
        expect(fields.get(1).uniqueConstraint).toBe(true); // field b
        expect(fields.get(2).uniqueConstraint).toBe(false); // field c
    });

    // TODO add other test cases for DomainField.serialize code
});

describe('DomainIndex', () => {
    test('isSingleFieldUniqueConstraint', () => {
        let index = DomainIndex.fromJS([{ columnNames: ['a'], unique: true } as IDomainIndex]).get(0);
        expect(index.isSingleFieldUniqueConstraint()).toBe(true);
        index = DomainIndex.fromJS([{ columnNames: ['a'], unique: false } as IDomainIndex]).get(0);
        expect(index.isSingleFieldUniqueConstraint()).toBe(false);
        index = DomainIndex.fromJS([{ columnNames: ['a', 'b'], unique: true } as IDomainIndex]).get(0);
        expect(index.isSingleFieldUniqueConstraint()).toBe(false);
    });

    test('isMSSQLHashedSingleFieldUniqueConstraint', () => {
        let index = DomainIndex.fromJS([{ columnNames: ['a'], unique: true } as IDomainIndex]).get(0);
        expect(index.isMSSQLHashedSingleFieldUniqueConstraint()).toBe(false);
        index = DomainIndex.fromJS([{ columnNames: ['a'], unique: false } as IDomainIndex]).get(0);
        expect(index.isMSSQLHashedSingleFieldUniqueConstraint()).toBe(false);
        index = DomainIndex.fromJS([{ columnNames: ['_hashed_a'], unique: true } as IDomainIndex]).get(0);
        expect(index.isMSSQLHashedSingleFieldUniqueConstraint()).toBe(false);
        index = DomainIndex.fromJS([{ columnNames: ['_hashed_a'], unique: false } as IDomainIndex]).get(0);
        expect(index.isMSSQLHashedSingleFieldUniqueConstraint()).toBe(true);
        index = DomainIndex.fromJS([{ columnNames: ['_hashed_a', 'b'], unique: false } as IDomainIndex]).get(0);
        expect(index.isMSSQLHashedSingleFieldUniqueConstraint()).toBe(false);
    });
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
