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
import { initUnitTests } from '../testHelpers';

import { QueryColumn } from '../../public/QueryColumn';
import { DATE_TYPE, DATETIME_TYPE } from '../components/domainproperties/PropDescType';

import {
    formatDate,
    formatDateTime,
    generateNameWithTimestamp,
    getColDateFormat,
    getColFormattedDateValue,
    getJsonDateTimeFormatString,
    parseDate,
} from './Date';

beforeAll(() => {
    initUnitTests();
});

describe('Date Utilities', () => {
    describe('generateNameWithTimestamp', () => {
        test('generated text', () => {
            const prefix = 'Test';
            const name = generateNameWithTimestamp(prefix);
            expect(name.indexOf(prefix + '_') === 0).toBeTruthy();
            expect(name.length === prefix.length + 20).toBeTruthy(); // 2 underscores, 10 for date string, 8 for time string
        });
    });

    describe('formatDate', () => {
        const datePOSIX = 1596750283812; // Aug 6, 2020 14:44 America/Vancouver
        const testDate = new Date(datePOSIX);

        test('invalid date', () => {
            expect(formatDate(undefined)).toBe(undefined);
        });
        test('default to context dateFormat', () => {
            const actualFormat = formatDate(testDate);

            expect(actualFormat).toBe('2020-08-06');
            expect(actualFormat).toEqual(formatDate(testDate, undefined, LABKEY.container.formats.dateFormat));
        });
        test('supports timezone', () => {
            expect(formatDate(datePOSIX, 'Europe/Athens')).toBe('2020-08-07');
            expect(formatDate(testDate, 'Europe/Athens')).toBe('2020-08-07');
        });
        test('supports custom format', () => {
            expect(formatDate(datePOSIX, 'America/New_York', 'DDYYYYMM')).toBe('06202008');
            expect(formatDate(testDate, 'America/New_York', 'DDYYYYMM')).toBe('06202008');
        });
    });

    describe('formatDateTime', () => {
        const datePOSIX = 1596750283812; // Aug 6, 2020 14:44 America/Vancouver
        const testDate = new Date(datePOSIX);

        test('invalid date', () => {
            expect(formatDateTime(undefined)).toBe(undefined);
        });
        test('default to context dateTimeFormat', () => {
            const actualFormat = formatDateTime(testDate);

            expect(actualFormat).toEqual(formatDateTime(testDate, undefined, LABKEY.container.formats.dateTimeFormat));
        });
        test('supports timezone', () => {
            expect(formatDateTime(datePOSIX, 'Europe/Athens')).toBe('2020-08-07 00:44');
            expect(formatDateTime(testDate, 'Europe/Athens')).toBe('2020-08-07 00:44');
        });
        test('supports custom format', () => {
            expect(formatDateTime(datePOSIX, 'America/New_York', 'DDYYYYMM')).toBe('06202008');
            expect(formatDateTime(testDate, 'America/New_York', 'DDYYYYMM')).toBe('06202008');
        });
    });

    describe('getJsonDateTimeFormatString', () => {
        test('without date', () => {
            expect(getJsonDateTimeFormatString(undefined)).toBe(undefined);
            expect(getJsonDateTimeFormatString(null)).toBe(undefined);
        });

        test('with date', () => {
            expect(getJsonDateTimeFormatString(new Date('2021-12-03 00:00'))).toBe('2021-12-03 00:00:00');
            expect(getJsonDateTimeFormatString(new Date('2021-12-03 23:59'))).toBe('2021-12-03 23:59:00');
        });
    });

    describe('getColDateFormat', () => {
        test('datePlaceholder', () => {
            const col = QueryColumn.create({ shortCaption: 'DateCol', rangeURI: DATETIME_TYPE.rangeURI });
            expect(getColDateFormat(col)).toBe('yyyy-MM-dd HH:mm');
        });

        test('datePlaceholder without col.rangeURI', () => {
            const col = QueryColumn.create({ shortCaption: 'DateCol', rangeURI: undefined });
            expect(getColDateFormat(col)).toBe('yyyy-MM-dd HH:mm');
        });

        test('queryColumn.format', () => {
            const col = QueryColumn.create({
                shortCaption: 'DateCol',
                rangeURI: DATETIME_TYPE.rangeURI,
                format: 'dd/MM/yyyy HH:mm',
            });
            expect(getColDateFormat(col)).toBe('dd/MM/yyyy HH:mm');
        });

        test('provided dateFormat', () => {
            const col = QueryColumn.create({
                shortCaption: 'DateCol',
                rangeURI: DATETIME_TYPE.rangeURI,
                format: 'dd/MM/yyyy HH:mm',
            });
            expect(getColDateFormat(col, 'yyyy-MM HH')).toBe('yyyy-MM HH');
        });

        test('moment.js replacement', () => {
            const col = QueryColumn.create({ shortCaption: 'DateCol', rangeURI: DATETIME_TYPE.rangeURI });
            expect(getColDateFormat(col, 'YYYY-MM-DD')).toBe('yyyy-MM-dd');
        });

        test('shortcut formats', () => {
            const col = QueryColumn.create({ shortCaption: 'DateCol', rangeURI: DATETIME_TYPE.rangeURI });
            expect(getColDateFormat(col, 'Date')).toBe('yyyy-MM-dd');
            expect(getColDateFormat(col, 'DateTime')).toBe('yyyy-MM-dd HH:mm');
            expect(getColDateFormat(col, 'Time')).toBe('HH:mm:ss');
        });
    });

    describe('getColFormattedDateValue', () => {
        test('formatDateTime with QueryColumn format', () => {
            const col = QueryColumn.create({
                shortCaption: 'DateCol',
                rangeURI: DATETIME_TYPE.rangeURI,
                format: 'dd/MM/yyyy HH:mm',
            });
            expect(getColFormattedDateValue(col, '2022-04-19 01:02')).toBe('19/04/2022 01:02');
        });

        test('formatDateTime without QueryColumn format', () => {
            const col = QueryColumn.create({ shortCaption: 'DateCol', rangeURI: DATETIME_TYPE.rangeURI });
            expect(getColFormattedDateValue(col, '2022-04-19 01:02')).toBe('2022-04-19 01:02');
        });

        test('formatDate with QueryColumn format', () => {
            const col = QueryColumn.create({
                shortCaption: 'DateCol',
                rangeURI: DATE_TYPE.rangeURI,
                format: 'dd/MM/yyyy',
            });
            expect(getColFormattedDateValue(col, '2022-04-19 01:02')).toBe('19/04/2022');
        });

        test('formatDate without QueryColumn format', () => {
            const col = QueryColumn.create({ shortCaption: 'DateCol', rangeURI: DATE_TYPE.rangeURI });
            expect(getColFormattedDateValue(col, '2022-04-19 01:02')).toBe('2022-04-19');
        });
    });

    describe('parseDate', () => {
        test('no dateStr', () => {
            expect(parseDate(undefined)).toBe(null);
            expect(parseDate(null)).toBe(null);
            expect(parseDate('')).toBe(null);
        });

        test('invalid date', () => {
            expect(parseDate('test')).toBe(null);
            expect(parseDate('test', 'yyyy-MM-dd')).toBe(null);
        });

        test('valid date without dateFormat', () => {
            expect(parseDate('2022-04-19 01:02').toString()).toContain('Apr 19 2022');
            expect(parseDate('2022-04-19').toString()).toContain('Apr 19 2022');
            expect(parseDate('04/19/2022').toString()).toContain('Apr 19 2022');
        });

        test('valid date with dateFormat', () => {
            expect(parseDate('01:02 2022-04-19', 'HH:mm yyyy-MM-dd').toString()).toContain('Apr 19 2022');
            expect(parseDate('19/04/2022', 'dd/MM/yyyy').toString()).toContain('Apr 19 2022');
            expect(parseDate('4/11/2022', 'dd/MM/yyyy').toString()).toContain('Apr 11 2022');
            expect(parseDate('04/11/2022', 'dd/MM/yyyy').toString()).toContain('Nov 04 2022');
            expect(parseDate('4/11/2022', 'yyyy-MM-dd').toString()).toContain('Apr 11 2022');
            expect(parseDate('04/11/2022', 'yyyy-MM-dd').toString()).toContain('Apr 11 2022');
            expect(parseDate('4/11/2022', 'yyyy-MM-dd HH:ss').toString()).toContain('Apr 11 2022');
            expect(parseDate('04/11/2022', 'yyyy-MM-dd HH:ss').toString()).toContain('Apr 11 2022');
        });
    });
});
