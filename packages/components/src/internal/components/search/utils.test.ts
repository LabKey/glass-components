import { Filter } from '@labkey/api';

import { QueryInfo } from '../../../public/QueryInfo';
import { QueryColumn } from '../../../public/QueryColumn';
import { SCHEMAS } from '../../schemas';

import { TEXT_TYPE } from '../domainproperties/PropDescType';

import { NOT_ANY_FILTER_TYPE } from '../../url/NotAnyFilterType';

import { SampleTypeDataType } from '../entities/constants';

import { ANCESTOR_MATCHES_ALL_OF_FILTER_TYPE } from '../../query/filter';

import {
    ALL_VALUE_DISPLAY,
    decodeErrorMessage,
    EMPTY_VALUE_DISPLAY,
    getCheckedFilterValues,
    getFieldFiltersValidationResult,
    getFilterSelections,
    getFilterValuesAsArray,
    getSearchResultCardData,
    getUpdatedCheckedValues,
    getUpdatedChooseValuesFilter,
    getUpdatedFilters,
    getUpdatedFilterSelection,
    getUpdateFilterExpressionFilter,
    isValidFilterField,
    escapeSearchQuery,
} from './utils';
import { SearchCategory } from './constants';
import { FieldFilter } from './models';

beforeAll(() => {
    LABKEY.container = {
        formats: {
            dateFormat: 'yyyy-MM-dd',
            dateTimeFormat: 'yyyy-MM-dd HH:mm',
            numberFormat: null,
            timeFormat: 'HH:mm',
        },
    };
});

const anyValueFilter = {
    fieldKey: 'textField',
    fieldCaption: 'textField',
    filter: Filter.create('textField', null, Filter.Types.HAS_ANY_VALUE),
    jsonType: 'string',
} as FieldFilter;

const matchesAllFilter = {
    fieldKey: 'textField',
    fieldCaption: 'textField',
    filter: Filter.create('textField', ['a', 'b'], ANCESTOR_MATCHES_ALL_OF_FILTER_TYPE),
    jsonType: 'string',
} as FieldFilter;

const matchesAllBadFilter = {
    fieldKey: 'textField',
    fieldCaption: 'textField',
    filter: Filter.create(
        'textField',
        ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k'],
        ANCESTOR_MATCHES_ALL_OF_FILTER_TYPE
    ),
    jsonType: 'string',
} as FieldFilter;

const matchesAllEmptyFilter = {
    fieldKey: 'textField',
    fieldCaption: 'textField',
    filter: Filter.create('textField', [], ANCESTOR_MATCHES_ALL_OF_FILTER_TYPE),
    jsonType: 'string',
} as FieldFilter;

const containsOneOfBadFilter = {
    fieldKey: 'textField',
    fieldCaption: 'textField',
    filter: Filter.create(
        'textField',
        ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k'],
        Filter.Types.CONTAINS_ONE_OF
    ),
    jsonType: 'string',
} as FieldFilter;

const containsNoneOfBadFilter = {
    fieldKey: 'otherTextField',
    fieldCaption: 'otherTextField',
    filter: Filter.create(
        'textField',
        ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k'],
        Filter.Types.CONTAINS_NONE_OF
    ),
    jsonType: 'string',
} as FieldFilter;

const equalsNoneOfBadFilter = {
    fieldKey: 'textField',
    fieldCaption: 'textField',
    filter: Filter.create(
        'textField',
        ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k'],
        Filter.Types.EQUALS_NONE_OF
    ),
    jsonType: 'string',
} as FieldFilter;

const intEqFilter = {
    fieldKey: 'intField',
    fieldCaption: 'intField',
    filter: Filter.create('intField', 1),
    jsonType: 'int',
} as FieldFilter;

const stringBetweenFilter = {
    fieldKey: 'strField',
    fieldCaption: 'strField',
    filter: Filter.create('strField', ['1', '5'], Filter.Types.BETWEEN),
    jsonType: 'string',
} as FieldFilter;

const stringEqualFilter = {
    fieldKey: 'strField',
    fieldCaption: 'strField',
    filter: Filter.create('strField', '2', Filter.Types.EQ),
    jsonType: 'string',
} as FieldFilter;

const emptyStringBetweenFilter = {
    fieldKey: 'strField',
    fieldCaption: 'strField',
    filter: Filter.create('strField', ['', '5'], Filter.Types.BETWEEN),
    jsonType: 'string',
} as FieldFilter;

const emptyStringLessThanFilter = {
    fieldKey: 'strField',
    fieldCaption: 'strField',
    filter: Filter.create('strField', '', Filter.Types.LT),
    jsonType: 'string',
} as FieldFilter;

const floatBetweenFilter = {
    fieldKey: 'floatField2',
    fieldCaption: 'floatField2',
    filter: Filter.create('floatField2', '1,5', Filter.Types.BETWEEN),
    jsonType: 'float',
} as FieldFilter;

const badIntFilter = {
    fieldKey: 'intField',
    fieldCaption: 'intField',
    filter: Filter.create('intField', null),
    jsonType: 'int',
} as FieldFilter;

const badBetweenFilter = {
    fieldKey: 'doubleField',
    fieldCaption: 'doubleField',
    filter: Filter.create('doubleField', '1', Filter.Types.BETWEEN),
    jsonType: 'float',
} as FieldFilter;

describe('getFilterValuesAsArray', () => {
    test('array value', () => {
        expect(getFilterValuesAsArray(Filter.create('textField', ['a', 'b'], Filter.Types.IN))).toStrictEqual([
            'a',
            'b',
        ]);
    });

    test('string value', () => {
        expect(getFilterValuesAsArray(Filter.create('textField', 'a;b;c', Filter.Types.IN))).toStrictEqual([
            'a',
            'b',
            'c',
        ]);
    });

    test('with blank value', () => {
        expect(getFilterValuesAsArray(Filter.create('textField', 'a;b;;c', Filter.Types.IN))).toStrictEqual([
            'a',
            'b',
            '[blank]',
            'c',
        ]);
    });

    test('with custom blank value', () => {
        expect(getFilterValuesAsArray(Filter.create('textField', 'a;b;;c', Filter.Types.IN), '[empty]')).toStrictEqual([
            'a',
            'b',
            '[empty]',
            'c',
        ]);
    });

    test('string value - between', () => {
        expect(getFilterValuesAsArray(Filter.create('textField', 'a,c', Filter.Types.BETWEEN))).toStrictEqual([
            'a',
            'c',
        ]);
    });

    test('null value, checkNull false', () => {
        expect(getFilterValuesAsArray(Filter.create('textField', null, Filter.Types.IN), '[empty]')).toStrictEqual([
            null,
        ]);
    });

    test('null value, checkNull true', () => {
        expect(
            getFilterValuesAsArray(Filter.create('textField', null, Filter.Types.IN), '[empty]', true)
        ).toStrictEqual([]);
    });
});

describe('getFieldFiltersValidationResult', () => {
    test('no error', () => {
        expect(
            getFieldFiltersValidationResult({
                sampleType1: [anyValueFilter, stringBetweenFilter, matchesAllFilter],
                sampleType2: [intEqFilter, floatBetweenFilter],
            })
        ).toBeNull();
    });

    test('missing value', () => {
        expect(
            getFieldFiltersValidationResult({
                sampleType1: [anyValueFilter, badIntFilter],
                sampleType2: [intEqFilter],
            })
        ).toEqual('Missing filter values for: intField.');
    });

    test('missing value, with query label', () => {
        expect(
            getFieldFiltersValidationResult(
                {
                    sampleType1: [anyValueFilter, badIntFilter],
                    sampleType2: [intEqFilter],
                },
                { sampleType1: 'Sample Type 1' }
            )
        ).toEqual('Missing filter values for: Sample Type 1: intField.');
    });

    test('missing between filter value', () => {
        expect(
            getFieldFiltersValidationResult(
                {
                    sampleType1: [anyValueFilter, badIntFilter],
                    sampleType2: [intEqFilter, badIntFilter, badBetweenFilter],
                },
                { sampleType1: 'sampleType1', sampleType2: 'sampleType2' }
            )
        ).toEqual('Missing filter values for: sampleType1: intField; sampleType2: intField, doubleField.');
    });

    test('string value is empty', () => {
        expect(
            getFieldFiltersValidationResult(
                {
                    sampleType1: [emptyStringLessThanFilter, emptyStringBetweenFilter],
                    sampleType2: [emptyStringBetweenFilter],
                },
                { sampleType1: 'sampleType1', sampleType2: 'sampleType2' }
            )
        ).toEqual('Missing filter values for: sampleType1: strField; sampleType2: strField.');
    });

    test('empty matches all filter', () => {
        expect(
            getFieldFiltersValidationResult({
                sampleType1: [matchesAllEmptyFilter, stringBetweenFilter],
                sampleType2: [intEqFilter],
            })
        ).toEqual('Missing filter values for: textField.');
    });

    test('exceed max allowed, matchesAll', () => {
        expect(
            getFieldFiltersValidationResult({
                sampleType1: [matchesAllBadFilter, stringBetweenFilter],
                sampleType2: [intEqFilter],
            })
        ).toEqual("At most 10 values can be selected for 'Equals All Of' filter type for 'textField'. ");
    });

    test('exceed max allowed for multi-value', () => {
        expect(
            getFieldFiltersValidationResult(
                {
                    sampleType1: [containsOneOfBadFilter, stringBetweenFilter],
                    sampleType2: [intEqFilter],
                },
                undefined,
                4
            )
        ).toEqual(
            "Too many values provided for filters on 'textField'. At most 4 values may be provided for filters of type 'Contains One Of'."
        );
    });

    test('exceed max allowed for multi-value and matchesAll', () => {
        expect(
            getFieldFiltersValidationResult(
                {
                    sampleType1: [containsOneOfBadFilter, matchesAllBadFilter],
                    sampleType2: [intEqFilter],
                },
                undefined,
                4
            )
        ).toEqual(
            "At most 10 values can be selected for 'Equals All Of' filter type for 'textField'. Too many values provided for filters on 'textField'. At most 4 values may be provided for filters of type 'Contains One Of'."
        );
    });

    test('exceed max allowed for multiple multi-value fields', () => {
        expect(
            getFieldFiltersValidationResult(
                {
                    sampleType1: [containsOneOfBadFilter, equalsNoneOfBadFilter],
                    sampleType2: [containsNoneOfBadFilter],
                },
                undefined,
                10
            )
        ).toEqual(
            "Too many values provided for filters on 'otherTextField' and 'textField'. At most 10 values may be provided for filters of type 'Contains One Of', 'Does Not Contain Any Of' and 'Does Not Equal Any Of'."
        );
    });
});

describe('getUpdateFilterExpressionFilter', () => {
    const fieldKey = 'StringField';
    const stringField = new QueryColumn({
        name: fieldKey,
        rangeURI: TEXT_TYPE.rangeURI,
        jsonType: 'string',
        fieldKey,
    });

    const anyOp = {
        betweenOperator: false,
        label: 'Has Any Value',
        multiValue: false,
        value: 'any',
        valueRequired: false,
        isSoleFilter: false,
    };

    const equalOp = {
        betweenOperator: false,
        label: 'Equals',
        multiValue: false,
        value: 'eq',
        valueRequired: true,
        isSoleFilter: true,
    };

    const betweenOp = {
        betweenOperator: true,
        label: 'Between',
        multiValue: true,
        value: 'between',
        valueRequired: true,
        isSoleFilter: false,
    };

    const badOp = {
        betweenOperator: true,
        label: 'NotSupported',
        multiValue: true,
        value: 'NotSupported',
        valueRequired: true,
        isSoleFilter: false,
    };

    test('remove filter type', () => {
        expect(getUpdateFilterExpressionFilter(null)).toBeNull();
    });

    test('invalid filter type', () => {
        expect(getUpdateFilterExpressionFilter(badOp, stringField)).toBeNull();
    });

    test('value not required', () => {
        expect(getUpdateFilterExpressionFilter(anyOp, stringField, 'abc')).toStrictEqual(
            Filter.create(fieldKey, null, Filter.Types.HAS_ANY_VALUE)
        );
    });

    test('remove filter value', () => {
        expect(getUpdateFilterExpressionFilter(equalOp, stringField, 'abc', null, null)).toStrictEqual(
            Filter.create(fieldKey, null, Filter.Types.EQ)
        );
    });

    test('update filter value', () => {
        expect(getUpdateFilterExpressionFilter(equalOp, stringField, 'abc', null, 'def')).toStrictEqual(
            Filter.create(fieldKey, 'def', Filter.Types.EQ)
        );
    });

    test('update between filter first value', () => {
        expect(getUpdateFilterExpressionFilter(betweenOp, stringField, 'x', 'z', 'a')).toStrictEqual(
            Filter.create(fieldKey, 'a,z', Filter.Types.BETWEEN)
        );
    });

    test('update between filter second value', () => {
        expect(getUpdateFilterExpressionFilter(betweenOp, stringField, null, null, 'y', true)).toStrictEqual(
            Filter.create(fieldKey, 'y', Filter.Types.BETWEEN)
        );
    });

    test('remove between filter second value', () => {
        expect(getUpdateFilterExpressionFilter(betweenOp, stringField, 'x', 'z', null, true)).toStrictEqual(
            Filter.create(fieldKey, 'x', Filter.Types.BETWEEN)
        );
    });

    test('clear between filter values', () => {
        expect(getUpdateFilterExpressionFilter(betweenOp, stringField, 'x', 'z', null, null, true)).toStrictEqual(
            Filter.create(fieldKey, null, Filter.Types.BETWEEN)
        );
    });
});

const distinctValues = ['[All]', '[blank]', 'ed', 'ned', 'ted', 'red', 'bed'];
const distinctValuesNoBlank = ['[All]', 'ed', 'ned', 'ted', 'red', 'bed'];
const distinctValuesExcludeAll = ['[blank]', 'ed', 'ned', 'ted', 'red', 'bed'];
const fieldKey = 'thing';

const checkedOne = Filter.create(fieldKey, 'ed');
const uncheckedOne = Filter.create(fieldKey, 'red', Filter.Types.NOT_EQUAL);
const uncheckedTwo = Filter.create(fieldKey, 'ed;ned', Filter.Types.NOT_IN);
const checkedTwo = Filter.create(fieldKey, 'ed;ned', Filter.Types.IN);
const checkedTwoWithBlank = Filter.create(fieldKey, ';ed', Filter.Types.IN);
const checkedThree = Filter.create(fieldKey, 'ed;ned;ted', Filter.Types.IN);
const checkedZero = Filter.create(fieldKey, null, NOT_ANY_FILTER_TYPE);
const anyFilter = Filter.create(fieldKey, null, Filter.Types.HAS_ANY_VALUE);
const blankFilter = Filter.create(fieldKey, null, Filter.Types.ISBLANK);
const notblankFilter = Filter.create(fieldKey, null, Filter.Types.NONBLANK);
const matchAllFilter = Filter.create(fieldKey, 'ed;ned;ted', ANCESTOR_MATCHES_ALL_OF_FILTER_TYPE);
const matchAll0Filter = Filter.create(fieldKey, [], ANCESTOR_MATCHES_ALL_OF_FILTER_TYPE);
const matchAll1Filter = Filter.create(fieldKey, 'ed', ANCESTOR_MATCHES_ALL_OF_FILTER_TYPE);
const matchAllEveryFilter = Filter.create(fieldKey, distinctValuesExcludeAll, ANCESTOR_MATCHES_ALL_OF_FILTER_TYPE);

describe('getCheckedFilterValues', () => {
    test('no filter or values', () => {
        expect(getCheckedFilterValues(null, undefined)).toEqual([]);
    });

    test('no filter', () => {
        expect(getCheckedFilterValues(null, distinctValues)).toEqual(distinctValues);
    });

    test('any filter', () => {
        expect(getCheckedFilterValues(anyFilter, distinctValues)).toEqual(distinctValues);
    });

    test('with filter but no values', () => {
        expect(getCheckedFilterValues(checkedTwo, undefined)).toEqual(['ed', 'ned']);
    });

    test('eq one', () => {
        expect(getCheckedFilterValues(checkedOne, distinctValues)).toEqual(['ed']);
    });

    test('not eq one', () => {
        expect(getCheckedFilterValues(uncheckedOne, distinctValues)).toEqual(['[blank]', 'ed', 'ned', 'ted', 'bed']);
    });

    test('isblank', () => {
        expect(getCheckedFilterValues(blankFilter, distinctValues)).toEqual(['[blank]']);
    });

    test('not blank', () => {
        expect(getCheckedFilterValues(notblankFilter, distinctValues)).toEqual(['ed', 'ned', 'ted', 'red', 'bed']);
        expect(getCheckedFilterValues(notblankFilter, distinctValuesNoBlank)).toEqual([
            '[All]',
            'ed',
            'ned',
            'ted',
            'red',
            'bed',
        ]);
    });

    test('in values', () => {
        expect(getCheckedFilterValues(checkedThree, distinctValues)).toEqual(['ed', 'ned', 'ted']);
    });

    test('not in values', () => {
        expect(getCheckedFilterValues(uncheckedTwo, distinctValues)).toEqual(['[blank]', 'ted', 'red', 'bed']);
    });

    test('ancestor matches all', () => {
        expect(getCheckedFilterValues(matchAllFilter, [])).toEqual(['ed', 'ned', 'ted']);
        expect(getCheckedFilterValues(matchAllFilter, distinctValues)).toEqual(['ed', 'ned', 'ted']);
    });
});

describe('getUpdatedCheckedValues', () => {
    test('check another, from eq one', () => {
        expect(getUpdatedCheckedValues(distinctValues, 'ned', true, checkedOne)).toEqual(['ed', 'ned']);
    });

    test('check blank, from eq one', () => {
        expect(getUpdatedCheckedValues(distinctValues, EMPTY_VALUE_DISPLAY, true, checkedOne)).toEqual([
            'ed',
            EMPTY_VALUE_DISPLAY,
        ]);
    });

    test('all checked, then uncheck one', () => {
        expect(getUpdatedCheckedValues(distinctValues, 'red', false, null)).toEqual([
            EMPTY_VALUE_DISPLAY,
            'ed',
            'ned',
            'ted',
            'bed',
        ]);
    });

    test('two checked, then uncheck one', () => {
        expect(getUpdatedCheckedValues(distinctValues, 'ed', false, checkedTwo)).toEqual(['ned']);
    });

    test('two checked, then uncheck another so blank is the only value left', () => {
        expect(getUpdatedCheckedValues(distinctValues, 'ed', false, checkedTwoWithBlank)).toEqual([
            EMPTY_VALUE_DISPLAY,
        ]);
    });

    test('all checked, then uncheck blank', () => {
        expect(getUpdatedCheckedValues(distinctValues, EMPTY_VALUE_DISPLAY, false, null)).toEqual([
            'ed',
            'ned',
            'ted',
            'red',
            'bed',
        ]);
    });

    test('none checked, then check blank', () => {
        expect(getUpdatedCheckedValues(distinctValues, EMPTY_VALUE_DISPLAY, true, checkedZero)).toEqual([
            EMPTY_VALUE_DISPLAY,
        ]);
    });

    test('none checked, then check one', () => {
        expect(getUpdatedCheckedValues(distinctValues, 'ed', true, checkedZero)).toEqual(['ed']);
    });

    test('all checked, then check blank and uncheck everything else', () => {
        expect(getUpdatedCheckedValues(distinctValues, EMPTY_VALUE_DISPLAY, true, null, true)).toEqual([
            EMPTY_VALUE_DISPLAY,
        ]);
    });

    test('half checked, then check one more', () => {
        expect(getUpdatedCheckedValues(distinctValues, 'red', true, checkedThree)).toEqual(['ed', 'ned', 'ted', 'red']);
    });

    test('half checked, then uncheck one', () => {
        expect(getUpdatedCheckedValues(distinctValues, 'ed', false, checkedThree)).toEqual(['ned', 'ted']);
    });

    test('one checked, then uncheck that one', () => {
        expect(getUpdatedCheckedValues(distinctValues, 'ed', false, checkedOne)).toEqual([]);
    });

    test('one unchecked, then check that one', () => {
        expect(getUpdatedCheckedValues(distinctValues, 'red', true, uncheckedOne)).toEqual([
            '[blank]',
            'ed',
            'ned',
            'ted',
            'bed',
            'red',
            '[All]',
        ]);
    });
});

describe('getUpdatedChooseValuesFilter', () => {
    function validate(resultFilter: Filter.IFilter, expectedFilterUrlSuffix: string, expectedFilterValue?: any) {
        expect(resultFilter.getFilterType().getURLSuffix()).toEqual(expectedFilterUrlSuffix);

        if (expectedFilterValue == null) expect(resultFilter.getValue()).toBeNull();
        else expect(resultFilter.getValue()).toEqual(expectedFilterValue);
    }

    test('check ALL, from eq one', () => {
        expect(getUpdatedChooseValuesFilter(distinctValues, fieldKey, ALL_VALUE_DISPLAY, true, checkedOne)).toBeNull();
        validate(
            getUpdatedChooseValuesFilter(distinctValues, fieldKey, ALL_VALUE_DISPLAY, true, matchAll1Filter),
            'ancestormatchesallof',
            distinctValuesExcludeAll
        );
    });

    test('check another, from eq one', () => {
        validate(getUpdatedChooseValuesFilter(distinctValues, fieldKey, 'ned', true, checkedOne), 'in', ['ed', 'ned']);
        validate(getUpdatedChooseValuesFilter(undefined, fieldKey, 'ned', true, checkedOne), 'in', ['ed', 'ned']);
        validate(
            getUpdatedChooseValuesFilter(distinctValues, fieldKey, 'ned', true, matchAll1Filter),
            'ancestormatchesallof',
            ['ed', 'ned']
        );
        validate(
            getUpdatedChooseValuesFilter(undefined, fieldKey, 'ned', true, matchAll1Filter),
            'ancestormatchesallof',
            ['ed', 'ned']
        );
    });

    test('check blank, from eq one', () => {
        validate(getUpdatedChooseValuesFilter(distinctValues, fieldKey, EMPTY_VALUE_DISPLAY, true, checkedOne), 'in', [
            'ed',
            '',
        ]);
    });

    test('all checked, then uncheck one', () => {
        validate(getUpdatedChooseValuesFilter(distinctValues, fieldKey, 'red', false, null), 'neqornull', 'red');
        validate(
            getUpdatedChooseValuesFilter(distinctValues, fieldKey, 'red', false, matchAllEveryFilter),
            'ancestormatchesallof',
            ['', 'ed', 'ned', 'ted', 'bed']
        );
    });

    test('two checked, then uncheck one', () => {
        validate(getUpdatedChooseValuesFilter(distinctValues, fieldKey, 'ed', false, checkedTwo), 'eq', 'ned');
        validate(getUpdatedChooseValuesFilter(undefined, fieldKey, 'ed', false, checkedTwo), 'eq', 'ned');
    });

    test('two checked, then uncheck another so blank is the only value left', () => {
        validate(getUpdatedChooseValuesFilter(distinctValues, fieldKey, 'ed', false, checkedTwoWithBlank), 'isblank');
    });

    test('uncheck all', () => {
        validate(
            getUpdatedChooseValuesFilter(distinctValues, fieldKey, ALL_VALUE_DISPLAY, false, checkedTwo),
            'notany',
            null
        );
        validate(
            getUpdatedChooseValuesFilter(distinctValues, fieldKey, ALL_VALUE_DISPLAY, false, matchAllEveryFilter),
            'ancestormatchesallof',
            []
        );
    });

    test('all checked, then uncheck blank', () => {
        validate(
            getUpdatedChooseValuesFilter(distinctValues, fieldKey, EMPTY_VALUE_DISPLAY, false, null),
            'isnonblank'
        );
    });

    test('none checked, then check blank', () => {
        validate(
            getUpdatedChooseValuesFilter(distinctValues, fieldKey, EMPTY_VALUE_DISPLAY, true, checkedZero),
            'isblank'
        );
    });

    test('none checked, then check one', () => {
        validate(getUpdatedChooseValuesFilter(distinctValues, fieldKey, 'ed', true, checkedZero), 'eq', 'ed');
        validate(getUpdatedChooseValuesFilter(undefined, fieldKey, 'ed', true, checkedZero), 'eq', 'ed');
        validate(
            getUpdatedChooseValuesFilter(distinctValues, fieldKey, 'ed', true, matchAll0Filter),
            'ancestormatchesallof',
            ['ed']
        );
    });

    test('all checked, then check blank and uncheck everything else', () => {
        validate(
            getUpdatedChooseValuesFilter(distinctValues, fieldKey, EMPTY_VALUE_DISPLAY, true, null, true),
            'isblank'
        );
    });

    test('half checked, then check one more', () => {
        validate(getUpdatedChooseValuesFilter(distinctValues, fieldKey, 'red', true, checkedThree), 'notin', [
            '',
            'bed',
        ]);
        validate(getUpdatedChooseValuesFilter(undefined, fieldKey, 'red', true, checkedThree), 'in', [
            'ed',
            'ned',
            'ted',
            'red',
        ]);
    });

    test('half checked, then uncheck one', () => {
        validate(getUpdatedChooseValuesFilter(distinctValues, fieldKey, 'ed', false, checkedThree), 'in', [
            'ned',
            'ted',
        ]);
        validate(getUpdatedChooseValuesFilter(undefined, fieldKey, 'ed', false, checkedThree), 'in', ['ned', 'ted']);
    });

    test('one checked, then uncheck that one', () => {
        validate(getUpdatedChooseValuesFilter(distinctValues, fieldKey, 'ed', false, checkedOne), 'notany');
        validate(getUpdatedChooseValuesFilter(undefined, fieldKey, 'ed', false, checkedOne), 'notany');
    });

    test('one unchecked, then check that one', () => {
        expect(getUpdatedChooseValuesFilter(distinctValues, fieldKey, 'red', true, uncheckedOne)).toBeNull();
    });

    test('check all, no blank', () => {
        validate(
            getUpdatedChooseValuesFilter(distinctValuesNoBlank, fieldKey, ALL_VALUE_DISPLAY, true, uncheckedOne),
            'isnonblank'
        );
    });
});

describe('isValidFilterField', () => {
    test('lookup field', () => {
        const field = new QueryColumn({ name: 'test', lookup: { isPublic: true } });
        const queryInfo = QueryInfo.fromJsonForTests({
            schemaName: 'test',
            name: 'query',
            supportGroupConcatSubSelect: true,
        });
        expect(isValidFilterField(field, queryInfo, SampleTypeDataType.exprColumnsWithSubSelect)).toBe(true);
    });

    test('mult-value lookup field', () => {
        const field = new QueryColumn({ name: 'test', lookup: { isPublic: true }, multiValue: true });
        const queryInfo = QueryInfo.fromJsonForTests({
            schemaName: 'test',
            name: 'query',
            supportGroupConcatSubSelect: true,
        });
        expect(isValidFilterField(field, queryInfo, SampleTypeDataType.exprColumnsWithSubSelect)).toBe(true);
    });

    test('mult-value lookup field and not supportGroupConcatSubSelect', () => {
        const field = new QueryColumn({ name: 'test', lookup: { isPublic: true }, multiValue: true });
        const queryInfo = QueryInfo.fromJsonForTests({
            schemaName: 'test',
            name: 'query',
            supportGroupConcatSubSelect: false,
        });
        expect(isValidFilterField(field, queryInfo, SampleTypeDataType.exprColumnsWithSubSelect)).toBe(true);
    });

    test('Units field', () => {
        const field = new QueryColumn({ name: 'Units', fieldKey: 'Units' });
        const queryInfo = QueryInfo.fromJsonForTests({
            schemaName: SCHEMAS.SAMPLE_SETS.SCHEMA,
            name: 'test',
            supportGroupConcatSubSelect: true,
        });
        expect(isValidFilterField(field, queryInfo, SampleTypeDataType.exprColumnsWithSubSelect)).toBe(false);
    });

    test('group concat field not supported', () => {
        const field = new QueryColumn({ name: 'StorageStatus', fieldKey: 'StorageStatus' });
        const queryInfo = QueryInfo.fromJsonForTests({
            schemaName: SCHEMAS.SAMPLE_SETS.SCHEMA,
            name: 'test',
            supportGroupConcatSubSelect: false,
        });
        expect(isValidFilterField(field, queryInfo, SampleTypeDataType.exprColumnsWithSubSelect)).toBe(false);
    });

    test('group concat field not supported, regular field', () => {
        const field = new QueryColumn({ name: 'RowId', fieldKey: 'RowId' });
        const queryInfo = QueryInfo.fromJsonForTests({
            schemaName: SCHEMAS.SAMPLE_SETS.SCHEMA,
            name: 'test',
            supportGroupConcatSubSelect: false,
        });
        expect(isValidFilterField(field, queryInfo, SampleTypeDataType.exprColumnsWithSubSelect)).toBe(true);
    });

    test('group concat field not supported, no group concat fields', () => {
        const field = new QueryColumn({ name: 'RowId', fieldKey: 'RowId' });
        const queryInfo = QueryInfo.fromJsonForTests({
            schemaName: SCHEMAS.SAMPLE_SETS.SCHEMA,
            name: 'test',
            supportGroupConcatSubSelect: false,
        });
        expect(isValidFilterField(field, queryInfo, undefined)).toBe(true);
    });

    test('group concat field is supported', () => {
        const field = new QueryColumn({ name: 'StorageStatus', fieldKey: 'StorageStatus' });
        const queryInfo = QueryInfo.fromJsonForTests({
            schemaName: SCHEMAS.SAMPLE_SETS.SCHEMA,
            name: 'test',
            supportGroupConcatSubSelect: true,
        });
        expect(isValidFilterField(field, queryInfo, SampleTypeDataType.exprColumnsWithSubSelect)).toBe(true);
    });

    test('regular field', () => {
        const field = new QueryColumn({ name: 'Regular', fieldKey: 'Regular' });
        const queryInfo = QueryInfo.fromJsonForTests({
            schemaName: SCHEMAS.SAMPLE_SETS.SCHEMA,
            name: 'test',
            supportGroupConcatSubSelect: false,
        });
        expect(isValidFilterField(field, queryInfo, SampleTypeDataType.exprColumnsWithSubSelect)).toBe(true);
    });
});

const equalFilterOption = {
    value: Filter.Types.EQUAL.getURLSuffix(),
    label: 'Equal',
    valueRequired: true,
    multiValue: false,
    betweenOperator: false,
    isSoleFilter: false,
};

const lessThanFilterOption = {
    value: Filter.Types.LT.getURLSuffix(),
    label: 'Less Than',
    valueRequired: true,
    multiValue: false,
    betweenOperator: false,
    isSoleFilter: false,
};

const betweenFilterOption = {
    value: Filter.Types.BETWEEN.getURLSuffix(),
    label: 'Between',
    valueRequired: true,
    multiValue: false,
    betweenOperator: true,
    isSoleFilter: false,
};

const notBetweenFilterOption = {
    value: Filter.Types.NOT_BETWEEN.getURLSuffix(),
    label: 'Not Between',
    valueRequired: true,
    multiValue: false,
    betweenOperator: true,
    isSoleFilter: false,
};

const oneOfOption = {
    value: Filter.Types.IN.getURLSuffix(),
    label: 'Is One Of',
    valueRequired: true,
    multiValue: true,
    betweenOperator: false,
    isSoleFilter: false,
};

const isBlankFilterOption = {
    value: Filter.Types.ISBLANK.getURLSuffix(),
    label: 'Blank',
    valueRequired: false,
    multiValue: false,
    betweenOperator: false,
    isSoleFilter: true,
};

describe('getFilterSelections', () => {
    test('no filters', () => {
        const filterSelections = getFilterSelections(undefined, undefined);
        expect(filterSelections).toStrictEqual([]);
    });

    test('no matching filter option', () => {
        const filterOptions = [
            {
                value: 'none-such',
                label: 'Not Valid',
                valueRequired: true,
                multiValue: true,
                betweenOperator: false,
                isSoleFilter: false,
            },
        ];
        const filterSelections = getFilterSelections([Filter.create('strField', 'test')], filterOptions);
        expect(filterSelections).toStrictEqual([
            {
                filterType: filterOptions[0],
            },
        ]);
    });

    test('single filter, single value', () => {
        const filterSelections = getFilterSelections(
            [Filter.create('strField', 'test')],
            [equalFilterOption, betweenFilterOption]
        );
        expect(filterSelections).toStrictEqual([
            {
                filterType: equalFilterOption,
                firstFilterValue: 'test',
            },
        ]);
    });

    test('single filter, multiple values', () => {
        const filterSelections = getFilterSelections(
            [Filter.create('strField', ['test', 'zebra'], Filter.Types.IN)],
            [equalFilterOption, betweenFilterOption, oneOfOption]
        );
        expect(filterSelections).toStrictEqual([
            {
                filterType: oneOfOption,
                firstFilterValue: 'test;zebra',
            },
        ]);
    });

    test('single filter, between values', () => {
        const filterSelections = getFilterSelections(
            [Filter.create('strField', ['test', 'zebra'], Filter.Types.BETWEEN)],
            [equalFilterOption, betweenFilterOption, oneOfOption]
        );
        expect(filterSelections).toStrictEqual([
            {
                filterType: betweenFilterOption,
                firstFilterValue: 'test',
                secondFilterValue: 'zebra',
            },
        ]);
    });

    test('multiple filters', () => {
        const filterSelections = getFilterSelections(
            [
                Filter.create('strField', ['test', 'zebra'], Filter.Types.BETWEEN),
                Filter.create('strField', ['unicorn', 'walrus'], Filter.Types.IN),
            ],
            [equalFilterOption, betweenFilterOption, oneOfOption]
        );
        expect(filterSelections).toStrictEqual([
            {
                filterType: betweenFilterOption,
                firstFilterValue: 'test',
                secondFilterValue: 'zebra',
            },
            {
                filterType: oneOfOption,
                firstFilterValue: 'unicorn;walrus',
            },
        ]);
    });
});

describe('getUpdatedFilters', () => {
    const field = new QueryColumn({
        name: stringEqualFilter.fieldKey,
        caption: stringEqualFilter.fieldCaption,
        fieldKey: stringEqualFilter.fieldKey,
    });

    test('no new filter, one existing filter', () => {
        const updatedFilters = getUpdatedFilters(
            field,
            [
                {
                    filterType: equalFilterOption,
                    firstFilterValue: stringEqualFilter.filter.getValue(),
                },
            ],
            0,
            undefined
        );
        expect(updatedFilters).toStrictEqual([]);
    });

    test('no new filter, two existing filters', () => {
        const updatedFilters = getUpdatedFilters(
            field,
            [
                {
                    filterType: equalFilterOption,
                    firstFilterValue: stringEqualFilter.filter.getValue(),
                },
                {
                    filterType: lessThanFilterOption,
                    firstFilterValue: emptyStringLessThanFilter.filter.getValue(),
                },
            ],
            0,
            undefined
        );
        expect(updatedFilters).toStrictEqual([emptyStringLessThanFilter.filter]);
    });

    test('new filter is sole filter, with two original', () => {
        const updatedFilters = getUpdatedFilters(
            field,
            [
                {
                    filterType: equalFilterOption,
                    firstFilterValue: stringEqualFilter.filter.getValue(),
                },
                {
                    filterType: lessThanFilterOption,
                    firstFilterValue: emptyStringLessThanFilter.filter.getValue(),
                },
            ],
            0,
            isBlankFilterOption
        );
        expect(updatedFilters).toHaveLength(1);
        expect(updatedFilters[0].getFilterType().getURLSuffix()).toBe(Filter.Types.ISBLANK.getURLSuffix());
        expect(updatedFilters[0].getValue()).toBe(null);
    });

    test('new filter is sole filter, with one original', () => {
        const updatedFilters = getUpdatedFilters(
            field,
            [
                {
                    filterType: equalFilterOption,
                    firstFilterValue: stringEqualFilter.filter.getValue(),
                },
            ],
            0,
            isBlankFilterOption
        );
        expect(updatedFilters).toHaveLength(1);
        expect(updatedFilters[0].getFilterType().getURLSuffix()).toBe(Filter.Types.ISBLANK.getURLSuffix());
        expect(updatedFilters[0].getValue()).toBe(null);
    });

    test('new filter not sole filter, two existing, update first', () => {
        const updatedFilters = getUpdatedFilters(
            field,
            [
                {
                    filterType: equalFilterOption,
                    firstFilterValue: stringEqualFilter.filter.getValue(),
                },
                {
                    filterType: lessThanFilterOption,
                    firstFilterValue: emptyStringLessThanFilter.filter.getValue(),
                },
            ],
            0,
            lessThanFilterOption,
            '5'
        );
        expect(updatedFilters).toHaveLength(2);
        expect(updatedFilters[0].getFilterType().getURLSuffix()).toBe(Filter.Types.LT.getURLSuffix());
        expect(updatedFilters[0].getValue()).toBe('5');
        expect(updatedFilters[1].getFilterType().getURLSuffix()).toBe(Filter.Types.LT.getURLSuffix());
        expect(updatedFilters[1].getValue()).toBe(emptyStringLessThanFilter.filter.getValue());
    });

    test('new filter not sole filter, two existing, update second', () => {
        const updatedFilters = getUpdatedFilters(
            field,
            [
                {
                    filterType: equalFilterOption,
                    firstFilterValue: stringEqualFilter.filter.getValue(),
                },
                {
                    filterType: lessThanFilterOption,
                    firstFilterValue: emptyStringLessThanFilter.filter.getValue(),
                },
            ],
            1,
            lessThanFilterOption,
            '5'
        );
        expect(updatedFilters).toHaveLength(2);
        expect(updatedFilters[0].getFilterType().getURLSuffix()).toBe(Filter.Types.EQUAL.getURLSuffix());
        expect(updatedFilters[0].getValue()).toBe(stringEqualFilter.filter.getValue());
        expect(updatedFilters[1].getFilterType().getURLSuffix()).toBe(Filter.Types.LT.getURLSuffix());
        expect(updatedFilters[1].getValue()).toBe('5');
    });

    test('new filter not sole filter, only one existing', () => {
        const updatedFilters = getUpdatedFilters(
            field,
            [
                {
                    filterType: equalFilterOption,
                    firstFilterValue: stringEqualFilter.filter.getValue(),
                },
            ],
            0,
            lessThanFilterOption,
            '5'
        );
        expect(updatedFilters).toHaveLength(1);
        expect(updatedFilters[0].getFilterType().getURLSuffix()).toBe(Filter.Types.LT.getURLSuffix());
        expect(updatedFilters[0].getValue()).toBe('5');
    });
});

describe('getUpdatedFilterSelection', () => {
    test('new value not required', () => {
        const { shouldClear, filterSelection } = getUpdatedFilterSelection(isBlankFilterOption, {
            filterType: equalFilterOption,
            firstFilterValue: 'x',
        });
        expect(shouldClear).toBe(true);
        expect(filterSelection).toStrictEqual({
            filterType: isBlankFilterOption,
            firstFilterValue: null,
            secondFilterValue: undefined,
        });
    });

    test('new value is required, old not required', () => {
        const { shouldClear, filterSelection } = getUpdatedFilterSelection(equalFilterOption, {
            filterType: isBlankFilterOption,
            firstFilterValue: null,
        });
        expect(shouldClear).toBe(true);
        expect(filterSelection).toStrictEqual({
            filterType: equalFilterOption,
            firstFilterValue: undefined,
            secondFilterValue: undefined,
        });
    });

    test('new value is required, old value required', () => {
        const { shouldClear, filterSelection } = getUpdatedFilterSelection(equalFilterOption, {
            filterType: lessThanFilterOption,
            firstFilterValue: 'test',
        });
        expect(shouldClear).toBe(false);
        expect(filterSelection).toStrictEqual({
            filterType: equalFilterOption,
            firstFilterValue: 'test',
            secondFilterValue: undefined,
        });
    });

    test('new value not multivalued, old is', () => {
        const { shouldClear, filterSelection } = getUpdatedFilterSelection(equalFilterOption, {
            filterType: oneOfOption,
            firstFilterValue: 'test;one;two;three',
        });
        expect(shouldClear).toBe(true);
        expect(filterSelection).toStrictEqual({
            filterType: equalFilterOption,
            firstFilterValue: undefined,
            secondFilterValue: undefined,
        });
    });

    test('both are between operators', () => {
        const { shouldClear, filterSelection } = getUpdatedFilterSelection(notBetweenFilterOption, {
            filterType: betweenFilterOption,
            firstFilterValue: 'test',
            secondFilterValue: 'unicorn',
        });
        expect(shouldClear).toBe(false);
        expect(filterSelection).toStrictEqual({
            filterType: notBetweenFilterOption,
            firstFilterValue: 'test',
            secondFilterValue: 'unicorn',
        });
    });

    test('new not between, old is', () => {
        const { shouldClear, filterSelection } = getUpdatedFilterSelection(equalFilterOption, {
            filterType: betweenFilterOption,
            firstFilterValue: 'test',
            secondFilterValue: 'unicorn',
        });
        expect(shouldClear).toBe(false);
        expect(filterSelection).toStrictEqual({
            filterType: equalFilterOption,
            firstFilterValue: 'test',
            secondFilterValue: 'unicorn',
        });
    });

    test("new is between, old isn't", () => {
        const { shouldClear, filterSelection } = getUpdatedFilterSelection(betweenFilterOption, {
            filterType: equalFilterOption,
            firstFilterValue: 'test',
        });
        expect(shouldClear).toBe(false);
        expect(filterSelection).toStrictEqual({
            filterType: betweenFilterOption,
            firstFilterValue: 'test',
            secondFilterValue: undefined,
        });
    });
});

describe('getSearchResultCardData', () => {
    const QUERY_METADATA = {
        schema: {
            samples: {
                query: {
                    testmedia: {
                        iconURL: 'test-media',
                    },
                },
            },
        },
    };
    test('no data, not workflow', () => {
        expect(getSearchResultCardData(undefined, 'other' as SearchCategory)).toStrictEqual({});
    });

    test('no data, workflow category', () => {
        expect(getSearchResultCardData(undefined, SearchCategory.WorkflowJob)).toStrictEqual({ category: 'Job' });
    });

    test('data.dataClass', () => {
        expect(
            getSearchResultCardData(
                {
                    name: 'Test',
                    dataClass: {
                        name: 'Test Class',
                        category: 'sources',
                    },
                },
                undefined
            )
        ).toStrictEqual({
            iconSrc: 'sources',
            category: 'Sources',
            title: 'Test',
        });
    });

    test('data.type is sampleSet, no metadata', () => {
        expect(
            getSearchResultCardData(
                {
                    name: 'Test',
                    type: 'sampleSet',
                },
                undefined
            )
        ).toStrictEqual({
            iconSrc: 'sample_set',
            category: 'Sample Type',
            altText: 'sample_type-icon',
            title: 'Test',
        });
    });

    test('data.type is sampleSet, with metadata, no match', () => {
        expect(
            getSearchResultCardData(
                {
                    name: 'Test',
                    type: 'sampleSet',
                },
                undefined,
                QUERY_METADATA
            )
        ).toStrictEqual({
            iconSrc: 'sample_set',
            category: 'Sample Type',
            altText: 'sample_type-icon',
            title: 'Test',
        });
    });

    test('data.type is sampleSet, with matching metadata', () => {
        expect(
            getSearchResultCardData(
                {
                    name: 'testMedia',
                    type: 'sampleSet',
                },
                undefined,
                QUERY_METADATA
            )
        ).toStrictEqual({
            iconSrc: 'test-media',
            category: 'Sample Type',
            altText: 'sample_type-icon',
            title: 'testMedia',
        });
    });

    test('data.sampleSet, with matching metadata', () => {
        expect(
            getSearchResultCardData(
                {
                    name: 'someMedia',
                    sampleSet: {
                        name: 'testMedia',
                    },
                },
                undefined,
                QUERY_METADATA
            )
        ).toStrictEqual({
            iconSrc: 'test-media',
            category: 'Sample Type',
            altText: 'sample_type-icon',
            title: 'someMedia',
        });
    });

    test('data.sampleSet, without matching metadata', () => {
        expect(
            getSearchResultCardData(
                {
                    name: 'someMedia',
                    sampleSet: {
                        name: 'otherMedia',
                    },
                },
                undefined,
                QUERY_METADATA
            )
        ).toStrictEqual({
            iconSrc: 'samples',
            category: 'Sample Type',
            altText: 'sample_type-icon',
            title: 'someMedia',
        });
    });

    test('data.type is generic dataClass', () => {
        expect(
            getSearchResultCardData(
                {
                    name: 'Test Source',
                    type: 'dataClass',
                },
                undefined
            )
        ).toStrictEqual({
            iconSrc: 'source_type',
            category: 'Source Type',
            altText: 'source_type-icon',
            title: 'Test Source',
        });
    });

    test('data.type is source dataClass', () => {
        expect(
            getSearchResultCardData(
                {
                    name: 'Test Source',
                    type: 'dataClass:sources',
                },
                undefined
            )
        ).toStrictEqual({
            iconSrc: 'source_type',
            category: 'Source Type',
            altText: 'source_type-icon',
            title: 'Test Source',
        });
    });

    test('data.type is registry dataClass', () => {
        expect(
            getSearchResultCardData(
                {
                    name: 'TestRegistrySource',
                    type: 'dataClass:registry',
                },
                undefined
            )
        ).toStrictEqual({
            iconSrc: 'testregistrysource',
            category: 'Source Type',
            altText: 'source_type-icon',
        });
    });

    test('data.type is assay', () => {
        expect(
            getSearchResultCardData(
                {
                    name: 'Test Assay',
                    type: 'assay',
                },
                undefined
            )
        ).toStrictEqual({
            category: 'Assay',
        });
    });

    test('data.name with material category', () => {
        expect(
            getSearchResultCardData(
                {
                    name: 'S-1',
                },
                SearchCategory.Material
            )
        ).toStrictEqual({
            category: 'Sample',
            title: 'S-1',
        });
    });
});

describe('decodeErrorMessage', () => {
    test('empty string', () => {
        expect(decodeErrorMessage('')).toBe('');
    });
    test('undefined', () => {
        expect(decodeErrorMessage(undefined)).toBeUndefined();
    });
    test('null', () => {
        expect(decodeErrorMessage(null)).toBeNull();
    });

    test('nothing encoded', () => {
        expect(decodeErrorMessage('Nothing to see here. Move along.')).toBe('Nothing to see here. Move along.');
        expect(decodeErrorMessage('errors are fun.')).toBe('errors are fun.');
    });

    test('encoded', () => {
        expect(decodeErrorMessage('Can&#039;t do &quot;this&quot; or &lt;that&gt;.')).toBe(
            'Can\'t do "this" or <that>.'
        );
        expect(decodeErrorMessage('Can&#039;t do &quot;this&quot; or &lt;that&gt;')).toBe(
            'Can\'t do "this" or <that>.'
        );
    });
});

describe('escapeSearchQuery', () => {
    test('empty values', () => {
        expect(escapeSearchQuery(undefined)).toBeUndefined();
        expect(null).toBeNull();
        expect(escapeSearchQuery('')).toEqual('');
    });
    test('escapes special characters', () => {
        // eslint-disable-next-line
        const luceneCharacters = ['+', '-', '&&', '||', '!', '(', ')', '[', ']', '{', '}', '^', '"', '~', '*', '?', ':', '\\'];
        luceneCharacters.forEach(char => {
            expect(escapeSearchQuery(char, true)).toEqual(`\\${char} OR \\${char}*`);
        });
    });
    test('handles UTF-8 characters', () => {
        expect(escapeSearchQuery('(I am a little 🫖)')).toEqual('\\(I am a little 🫖\\) OR \\(I am a little 🫖\\)*');
        expect(escapeSearchQuery('野球が大好きです')).toEqual('野球が大好きです OR 野球が大好きです*');
    });
    test('handles quotes well', () => {
        expect(escapeSearchQuery('"Fresh" and "Flowers"', false)).toEqual('"Fresh" and "Flowers"');
        expect(escapeSearchQuery('Fl"ower', true)).toEqual('Fl\\"ower OR Fl\\"ower*');
    });
});
