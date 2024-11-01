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
import { addDays, addHours, subDays, subHours } from 'date-fns';

import { getServerContext } from '@labkey/api';

import { QueryColumn } from '../../public/QueryColumn';
import { DATE_TYPE, DATETIME_TYPE, TIME_TYPE } from '../components/domainproperties/PropDescType';

import {
    DateFormatType,
    formatDate,
    formatDateTime,
    generateNameWithTimestamp,
    getColDateFormat,
    getColFormattedDateFilterValue,
    getColFormattedTimeFilterValue,
    getDateFNSDateFormat,
    getDateFNSDateTimeFormat,
    getDateFNSTimeFormat,
    getDateTimeInputOptions,
    getFormattedStringFromDate,
    getJsonDateTimeFormatString,
    getJsonFormatString,
    getNextDateStr,
    getNonStandardDateTimeFormatWarning,
    getNonStandardFormatWarning,
    getParsedRelativeDateStr,
    getPickerDateAndTimeFormat,
    isDateBetween,
    isDateTimeInPast,
    isRelativeDateFilterValue,
    parseDate,
    parseDateFNSTimeFormat,
    parseFNSTimeFormat,
    parseTime,
    splitDateTimeFormat,
} from './Date';

describe('Date Utilities', () => {
    const SERVER_FORMATS = getServerContext().container.formats;

    test('it should always be UTC', () => {
        expect(new Date().getTimezoneOffset()).toBe(0);
    });

    test('splitDateTimeFormat', () => {
        expect(splitDateTimeFormat(null)).toEqual(['', '']);
        expect(splitDateTimeFormat('')).toEqual(['', '']);
        expect(splitDateTimeFormat(' ')).toEqual(['', '']);
        expect(splitDateTimeFormat('yyyy-MM-dd')).toEqual(['yyyy-MM-dd', '']);
        expect(splitDateTimeFormat('yyyy-MM-dd HH:mm')).toEqual(['yyyy-MM-dd', 'HH:mm']);
        expect(splitDateTimeFormat('yyyy-MM-dd hh:mm a')).toEqual(['yyyy-MM-dd', 'hh:mm a']);
        expect(splitDateTimeFormat('ddMMMyyyy hh:mm a')).toEqual(['ddMMMyyyy', 'hh:mm a']);
        expect(splitDateTimeFormat('ddMMMyyyy KK:mm a z')).toEqual(['ddMMMyyyy', 'KK:mm a z']);
        expect(splitDateTimeFormat('yyyy MM dd')).toEqual(['yyyy', 'MM dd']);
        expect(splitDateTimeFormat('yyyy MM dd HH:mm')).toEqual(['yyyy MM dd', 'HH:mm']);
    });

    test('getNonStandardDateTimeFormatWarning', () => {
        expect(getNonStandardDateTimeFormatWarning(null)).toBe('Non-standard date-time format.');
        expect(getNonStandardDateTimeFormatWarning('')).toBe('Non-standard date-time format.');
        expect(getNonStandardDateTimeFormatWarning('yyyy-MM-dd')).toBeNull();
        expect(getNonStandardDateTimeFormatWarning('yyyy-MM-dd HH:mm')).toBeNull();
        expect(getNonStandardDateTimeFormatWarning('yyyy-MM-dd hh:mm a')).toBeNull();
        expect(getNonStandardDateTimeFormatWarning('ddMMMyyyy hh:mm a')).toBeNull();
        expect(getNonStandardDateTimeFormatWarning('HH:mm ddMMMyyyy')).toBe('Non-standard date-time format.');
        expect(getNonStandardDateTimeFormatWarning('yyyy-MM-DD')).toBe('Non-standard date-time format.');
        expect(getNonStandardDateTimeFormatWarning('yyyy-MM-ddHH:mm')).toBe('Non-standard date-time format.');
        expect(getNonStandardDateTimeFormatWarning('yyyy-MM-dd hh:mm aa')).toBe('Non-standard date-time format.');
        expect(getNonStandardDateTimeFormatWarning('yyyy MM dd hh:mm aa')).toBe('Non-standard date-time format.');
    });

    test('getNonStandardFormatWarning', () => {
        expect(getNonStandardFormatWarning(DateFormatType.Date, null)).toBe('Non-standard date format.');
        expect(getNonStandardFormatWarning(DateFormatType.Time, '')).toBe('Non-standard time format.');
        expect(getNonStandardFormatWarning(DateFormatType.DateTime, undefined)).toBe('Non-standard date-time format.');

        expect(getNonStandardFormatWarning(DateFormatType.Date, 'yyyy-MM-dd')).toBeNull();
        expect(getNonStandardFormatWarning(DateFormatType.DateTime, 'yyyy-MM-dd')).toBeNull();
        expect(getNonStandardFormatWarning(DateFormatType.Time, 'yyyy-MM-dd')).toBe('Non-standard time format.');

        expect(getNonStandardFormatWarning(DateFormatType.Date, 'yyyy-MM-dd HH:mm')).toBe('Non-standard date format.');
        expect(getNonStandardFormatWarning(DateFormatType.DateTime, 'yyyy-MM-dd HH:mm')).toBeNull();
        expect(getNonStandardFormatWarning(DateFormatType.Time, 'yyyy-MM-dd HH:mm')).toBe('Non-standard time format.');

        expect(getNonStandardFormatWarning(DateFormatType.Date, 'HH:mm')).toBe('Non-standard date format.');
        expect(getNonStandardFormatWarning(DateFormatType.DateTime, 'HH:mm')).toBe('Non-standard date-time format.');
        expect(getNonStandardFormatWarning(DateFormatType.Time, 'HH:mm')).toBeNull();

        expect(getNonStandardFormatWarning(DateFormatType.Date, 'yyyy/MM/dd')).toBe('Non-standard date format.');
        expect(getNonStandardFormatWarning(DateFormatType.DateTime, 'yyyy/MM/dd HH-mm')).toBe(
            'Non-standard date-time format.'
        );
        expect(getNonStandardFormatWarning(DateFormatType.Time, 'hh:mm aa')).toBe('Non-standard time format.');

        expect(getNonStandardFormatWarning(DateFormatType.Date, 'DaTe')).toBe('Non-standard date format.');
        expect(getNonStandardFormatWarning(DateFormatType.Date, 'DaTeTime')).toBe('Non-standard date format.');
        expect(getNonStandardFormatWarning(DateFormatType.Date, 'time')).toBe('Non-standard date format.');
        expect(getNonStandardFormatWarning(DateFormatType.DateTime, 'time')).toBe('Non-standard date-time format.');
        expect(getNonStandardFormatWarning(DateFormatType.DateTime, 'datetime')).toBe('Non-standard date-time format.');
        expect(getNonStandardFormatWarning(DateFormatType.DateTime, 'DATE')).toBe('Non-standard date-time format.');
        expect(getNonStandardFormatWarning(DateFormatType.Time, 'DateTime')).toBe('Non-standard time format.');
        expect(getNonStandardFormatWarning(DateFormatType.Time, 'Date')).toBe('Non-standard time format.');
        expect(getNonStandardFormatWarning(DateFormatType.Time, 'TIME')).toBe('Non-standard time format.');

        expect(getNonStandardFormatWarning(DateFormatType.Date, 'DaTe', true)).toBeNull();
        expect(getNonStandardFormatWarning(DateFormatType.Date, 'DaTeTime', true)).toBeNull();
        expect(getNonStandardFormatWarning(DateFormatType.Date, 'time', true)).toBeNull();
        expect(getNonStandardFormatWarning(DateFormatType.DateTime, 'time', true)).toBeNull();
        expect(getNonStandardFormatWarning(DateFormatType.DateTime, 'datetime', true)).toBeNull();
        expect(getNonStandardFormatWarning(DateFormatType.DateTime, 'DATE', true)).toBeNull();
        expect(getNonStandardFormatWarning(DateFormatType.Time, 'DateTime', true)).toBeNull();
        expect(getNonStandardFormatWarning(DateFormatType.Time, 'Date', true)).toBeNull();
        expect(getNonStandardFormatWarning(DateFormatType.Time, 'TIME', true)).toBeNull();

        expect(getNonStandardFormatWarning(DateFormatType.Date, 'Date Time', true)).toBe('Non-standard date format.');
        expect(getNonStandardFormatWarning(DateFormatType.Date, 'timestamp', true)).toBe('Non-standard date format.');
        expect(getNonStandardFormatWarning(DateFormatType.DateTime, 'time ', true)).toBe(
            'Non-standard date-time format.'
        );
        expect(getNonStandardFormatWarning(DateFormatType.DateTime, 'date and time', true)).toBe(
            'Non-standard date-time format.'
        );
        expect(getNonStandardFormatWarning(DateFormatType.DateTime, 'DATEONLY', true)).toBe(
            'Non-standard date-time format.'
        );
        expect(getNonStandardFormatWarning(DateFormatType.Time, 'Time only', true)).toBe('Non-standard time format.');
    });

    test('getDateTimeInputOptions', () => {
        const datePOSIX = 1596750283812; // Aug 6, 2020 21:44 UTC
        const date = new Date(datePOSIX);
        const tz = 'America/New_York';

        const expectedOptions = {
            dateOptions: [
                { label: 'yyyy-MM-dd (2020-08-06)', value: 'yyyy-MM-dd' },
                { label: 'yyyy-MMM-dd (2020-Aug-06)', value: 'yyyy-MMM-dd' },
                { label: 'yyyy-MM (2020-08)', value: 'yyyy-MM' },
                { label: 'dd-MM-yyyy (06-08-2020)', value: 'dd-MM-yyyy' },
                { label: 'dd-MMM-yyyy (06-Aug-2020)', value: 'dd-MMM-yyyy' },
                { label: 'dd-MMM-yy (06-Aug-20)', value: 'dd-MMM-yy' },
                { label: 'ddMMMyyyy (06Aug2020)', value: 'ddMMMyyyy' },
                { label: 'ddMMMyy (06Aug20)', value: 'ddMMMyy' },
                { label: 'MM/dd/yyyy (08/06/2020)', value: 'MM/dd/yyyy' },
                { label: 'MM-dd-yyyy (08-06-2020)', value: 'MM-dd-yyyy' },
                { label: 'MMMM dd yyyy (August 06 2020)', value: 'MMMM dd yyyy' },
            ],
            optionalTimeOptions: [
                { label: '<none>', value: '' },
                { label: 'HH:mm:ss (17:44:43)', value: 'HH:mm:ss' },
                { label: 'HH:mm (17:44)', value: 'HH:mm' },
                { label: 'HH:mm:ss.SSS (17:44:43.812)', value: 'HH:mm:ss.SSS' },
                { label: 'hh:mm a (05:44 PM)', value: 'hh:mm a' },
            ],
            timeOptions: [
                { label: 'HH:mm:ss (17:44:43)', value: 'HH:mm:ss' },
                { label: 'HH:mm (17:44)', value: 'HH:mm' },
                { label: 'HH:mm:ss.SSS (17:44:43.812)', value: 'HH:mm:ss.SSS' },
                { label: 'hh:mm a (05:44 PM)', value: 'hh:mm a' },
            ],
        };
        expect(getDateTimeInputOptions(tz, date)).toEqual(expectedOptions);
    });

    describe('generateNameWithTimestamp', () => {
        test('generated text', () => {
            const prefix = 'Test';
            const name = generateNameWithTimestamp(prefix);
            expect(name.indexOf(prefix + '_') === 0).toBeTruthy();
            expect(name.length === prefix.length + 20).toBeTruthy(); // 2 underscores, 10 for date string, 8 for time string
        });
    });

    describe('isDateBetween', () => {
        const datePOSIX = 1596750283812; // Aug 6, 2020 21:44 UTC
        const date = new Date(datePOSIX);
        const datePlusDay = addDays(date, 1);
        const datePlusHours = addHours(date, 5);
        const dateMinusDay = subDays(date, 1);
        const dateMinusHours = subHours(date, 5);
        const invalidDate = new Date(NaN);

        test('invalid dates', () => {
            expect(isDateBetween(undefined, undefined, undefined)).toBe(false);
            expect(isDateBetween(null, undefined, undefined)).toBe(false);
            expect(isDateBetween(date, undefined, undefined)).toBe(true);
            expect(isDateBetween(date, null, undefined)).toBe(true);
            expect(isDateBetween(date, undefined, null)).toBe(true);
            expect(isDateBetween(date, invalidDate, undefined)).toBe(true);
            expect(isDateBetween(date, undefined, invalidDate)).toBe(true);
            expect(isDateBetween(date, invalidDate, invalidDate)).toBe(true);
        });

        test('only start date', () => {
            expect(isDateBetween(date, date, undefined, false)).toBe(true);
            expect(isDateBetween(date, date, undefined, true)).toBe(false);
            expect(isDateBetween(date, datePlusDay, undefined)).toBe(false);
            expect(isDateBetween(date, datePlusHours, undefined, true)).toBe(false);
            expect(isDateBetween(date, datePlusHours, undefined, false)).toBe(false);
            expect(isDateBetween(date, dateMinusDay, undefined)).toBe(true);
            expect(isDateBetween(date, dateMinusHours, undefined, true)).toBe(false);
            expect(isDateBetween(date, dateMinusHours, undefined, false)).toBe(true);
        });

        test('only end date', () => {
            expect(isDateBetween(date, undefined, date)).toBe(true);
            expect(isDateBetween(date, undefined, datePlusDay)).toBe(true);
            expect(isDateBetween(date, undefined, dateMinusDay)).toBe(false);
        });

        test('between', () => {
            expect(isDateBetween(date, date, date, true)).toBe(false);
            expect(isDateBetween(date, date, date, false)).toBe(true);
            expect(isDateBetween(date, datePlusHours, datePlusDay)).toBe(false);
            expect(isDateBetween(date, dateMinusDay, dateMinusHours)).toBe(false);
            expect(isDateBetween(date, dateMinusDay, datePlusDay)).toBe(true);
            expect(isDateBetween(date, dateMinusHours, datePlusHours)).toBe(true);
        });
    });

    describe('formatDate', () => {
        const datePOSIX = 1596750283812; // Aug 6, 2020 21:44 UTC
        const testDate = new Date(datePOSIX);

        test('invalid date', () => {
            expect(formatDate(undefined)).toBeUndefined();
            expect(formatDate(undefined)).toBeUndefined();
        });
        test('default to context dateFormat', () => {
            const actualFormat = formatDate(testDate);

            expect(actualFormat).toBe('2020-08-06');
            expect(actualFormat).toEqual(formatDate(testDate, undefined, SERVER_FORMATS.dateFormat));
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
        const datePOSIX = 1596750283812; // Aug 6, 2020 21:44 UTC
        const testDate = new Date(datePOSIX);

        test('invalid date', () => {
            expect(formatDateTime(undefined)).toBeUndefined();
        });
        test('default to context dateTimeFormat', () => {
            const actualFormat = formatDateTime(testDate);

            expect(actualFormat).toEqual(formatDateTime(testDate, undefined, SERVER_FORMATS.dateTimeFormat));
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

    describe('get date-fns formats', () => {
        const testFormats = {
            dateFormat: 'BEEP-123',
            dateTimeFormat: 'BEEP-456',
            numberFormat: 'IMA-789',
            timeFormat: 'JEEP-101112',
        };

        test('getDateFNSDateFormat', () => {
            expect(getDateFNSDateFormat()).toBe(SERVER_FORMATS.dateFormat);
            expect(getDateFNSDateFormat({ formats: testFormats })).toEqual(testFormats.dateFormat);
        });
        test('getDateFNSDateTimeFormat', () => {
            expect(getDateFNSDateTimeFormat()).toBe(SERVER_FORMATS.dateTimeFormat);
            expect(getDateFNSDateTimeFormat({ formats: testFormats })).toEqual(testFormats.dateTimeFormat);
        });
        test('getDateFNSTimeFormat', () => {
            expect(getDateFNSTimeFormat()).toBe(SERVER_FORMATS.timeFormat);
            expect(getDateFNSTimeFormat({ formats: testFormats })).toEqual(testFormats.timeFormat);
        });
    });

    describe('getFormattedStringFromDate', () => {
        const datePOSIX = 1596750283812; // Aug 6, 2020 21:44 UTC
        const testDate = new Date(datePOSIX);
        const invalidDate = new Date(NaN);

        const dateOnlyColumn = new QueryColumn({ rangeURI: DATE_TYPE.rangeURI });
        const timeColumn = new QueryColumn({ rangeURI: TIME_TYPE.rangeURI });

        test('preconditions', () => {
            expect(dateOnlyColumn.isDateOnlyColumn).toBe(true);
            expect(timeColumn.isTimeColumn).toBe(true);
        });

        test('invalid date', () => {
            expect(getFormattedStringFromDate(undefined, timeColumn)).toBeUndefined();
            expect(getFormattedStringFromDate(null, timeColumn)).toBeUndefined();
            expect(getFormattedStringFromDate(invalidDate, timeColumn)).toBeUndefined();
        });

        test('uses column format', () => {
            const columnFormat = 'yyyy-dd-MM-dd-yyyy';
            const dateOnlyColumnWithFormat = dateOnlyColumn.mutate({ format: columnFormat });
            const timeColumnWithFormat = timeColumn.mutate({ format: columnFormat });

            expect(getFormattedStringFromDate(testDate, dateOnlyColumnWithFormat)).toEqual('2020-06-08-06-2020');
            expect(getFormattedStringFromDate(testDate, timeColumnWithFormat)).toEqual('2020-06-08-06-2020');
        });

        test('resolved format matches column configuration', () => {
            expect(getFormattedStringFromDate(testDate, timeColumn)).toEqual('21:44');
            expect(getFormattedStringFromDate(testDate, dateOnlyColumn)).toEqual('2020-08-06');
        });
    });

    describe('getJsonDateTimeFormatString', () => {
        test('without date', () => {
            expect(getJsonDateTimeFormatString(undefined)).toBeUndefined();
            expect(getJsonDateTimeFormatString(null)).toBeUndefined();
        });

        test('with date', () => {
            expect(getJsonDateTimeFormatString(new Date('2021-12-03 00:00'))).toBe('2021-12-03 00:00:00');
            expect(getJsonDateTimeFormatString(new Date('2021-12-03 23:59'))).toBe('2021-12-03 23:59:00');
        });
    });

    describe('getJsonFormatString', () => {
        test('without date', () => {
            expect(getJsonFormatString(undefined, 'Date')).toBeUndefined();
            expect(getJsonFormatString(null, 'Date')).toBeUndefined();
            expect(getJsonFormatString(undefined, 'DateTime')).toBeUndefined();
            expect(getJsonFormatString(null, 'DateTime')).toBeUndefined();
            expect(getJsonFormatString(undefined, 'Time')).toBeUndefined();
            expect(getJsonFormatString(null, 'Time')).toBeUndefined();
            expect(getJsonFormatString(new Date(NaN), 'Time')).toBeUndefined();
        });

        test('with date', () => {
            expect(getJsonFormatString(new Date('2021-12-03 00:00'), 'Date')).toBe('2021-12-03');
            expect(getJsonFormatString(new Date('2021-12-03 23:59'), 'Date')).toBe('2021-12-03');
            expect(getJsonFormatString(new Date('2021-12-03 00:00'), 'DateTime')).toBe('2021-12-03 00:00:00');
            expect(getJsonFormatString(new Date('2021-12-03 23:59'), 'DateTime')).toBe('2021-12-03 23:59:00');
            expect(getJsonFormatString(new Date('2021-12-03 00:00'), 'Time')).toBe('00:00:00');
            expect(getJsonFormatString(new Date('2021-12-03 23:59'), 'Time')).toBe('23:59:00');
        });
    });

    describe('getColDateFormat', () => {
        test('datePlaceholder', () => {
            const col = new QueryColumn({ shortCaption: 'DateCol', rangeURI: DATETIME_TYPE.rangeURI });
            expect(getColDateFormat(col)).toBe('yyyy-MM-dd HH:mm');
            expect(getColDateFormat(col, null, true)).toBe('yyyy-MM-dd');

            expect(getPickerDateAndTimeFormat(col)).toEqual({
                dateFormat: 'yyyy-MM-dd HH:mm',
                timeFormat: 'HH:mm',
            });
            expect(getPickerDateAndTimeFormat(col, true)).toEqual({
                dateFormat: 'yyyy-MM-dd',
                timeFormat: undefined,
            });

            const timeCol = new QueryColumn({ shortCaption: 'TimeCol', rangeURI: TIME_TYPE.rangeURI });
            expect(getColDateFormat(timeCol)).toBe('HH:mm');
            expect(getColDateFormat(col, 'Time')).toBe('HH:mm');

            expect(getPickerDateAndTimeFormat(timeCol)).toEqual({
                dateFormat: 'HH:mm',
                timeFormat: 'HH:mm',
            });
        });

        test('datePlaceholder without col.rangeURI', () => {
            const col = new QueryColumn({ shortCaption: 'DateCol', rangeURI: undefined });
            expect(getColDateFormat(col)).toBe('yyyy-MM-dd HH:mm');
            expect(getColDateFormat(col, null, true)).toBe('yyyy-MM-dd');

            expect(getPickerDateAndTimeFormat(col)).toEqual({
                dateFormat: 'yyyy-MM-dd HH:mm',
                timeFormat: 'HH:mm',
            });
            expect(getPickerDateAndTimeFormat(col, true)).toEqual({
                dateFormat: 'yyyy-MM-dd',
                timeFormat: undefined,
            });

            const timeCol = new QueryColumn({ shortCaption: 'TimeCol', rangeURI: undefined });
            expect(getColDateFormat(timeCol, 'Time')).toBe('HH:mm');

            expect(getPickerDateAndTimeFormat(timeCol)).toEqual({
                dateFormat: 'yyyy-MM-dd HH:mm',
                timeFormat: 'HH:mm',
            });
        });

        test('queryColumn.format', () => {
            const col = new QueryColumn({
                shortCaption: 'DateCol',
                rangeURI: DATETIME_TYPE.rangeURI,
                format: 'dd/MM/yyyy HH:mm',
            });
            expect(getColDateFormat(col)).toBe('dd/MM/yyyy HH:mm');
            expect(getColDateFormat(col, null, true)).toBe('dd/MM/yyyy HH:mm');

            expect(getPickerDateAndTimeFormat(col)).toEqual({
                dateFormat: 'dd/MM/yyyy HH:mm',
                timeFormat: 'HH:mm',
            });

            expect(getPickerDateAndTimeFormat(col, true)).toEqual({
                dateFormat: 'yyyy-MM-dd',
                timeFormat: undefined,
            });
        });

        test('provided dateFormat', () => {
            const col = new QueryColumn({
                shortCaption: 'DateCol',
                rangeURI: DATETIME_TYPE.rangeURI,
                format: 'dd/MM/yyyy HH:mm',
            });
            expect(getColDateFormat(col, 'yyyy-MM HH')).toBe('yyyy-MM HH');
            expect(getColDateFormat(col, 'yyyy-MM HH HH:mm')).toBe('yyyy-MM HH HH:mm');
            expect(getColDateFormat(col, 'yyyy-MM HH HH:mm', true)).toBe('yyyy-MM HH HH:mm');
        });

        test('date-fns replacement', () => {
            const col = new QueryColumn({ shortCaption: 'DateCol', rangeURI: DATETIME_TYPE.rangeURI });
            expect(getColDateFormat(col, 'YYYY-MM-DD')).toBe('yyyy-MM-dd');
            expect(getColDateFormat(col, 'YY-MM-dd')).toBe('yy-MM-dd');
            expect(getColDateFormat(col, 'YY-MM-dd z')).toBe('yy-MM-dd xxx');
            expect(getColDateFormat(col, 'YY-MM-dd Z')).toBe('yy-MM-dd xxx');
            expect(getColDateFormat(col, 'YY-MM-dd zz')).toBe('yy-MM-dd xxx');
            expect(getColDateFormat(col, 'ZZ YY-MM-dd ZZ')).toBe('xxx yy-MM-dd xxx');
            expect(getColDateFormat(col, 'xxx YY-MM-dd ZZ')).toBe('xxx yy-MM-dd xxx');
            expect(getColDateFormat(col, 'YY-MM-dd ZZZZ')).toBe('yy-MM-dd xxx');
            expect(getColDateFormat(col, 'zzzz YY-MM-dd u')).toBe('xxx yy-MM-dd i');
        });

        test('shortcut formats', () => {
            const col = new QueryColumn({ shortCaption: 'DateCol', rangeURI: DATETIME_TYPE.rangeURI });
            expect(getColDateFormat(col, 'Date')).toBe('yyyy-MM-dd');
            expect(getColDateFormat(col, 'DateTime')).toBe('yyyy-MM-dd HH:mm');
            expect(getColDateFormat(col, 'DateTime', true)).toBe('yyyy-MM-dd HH:mm');
            expect(getColDateFormat(col, 'Time')).toBe('HH:mm');
        });
    });

    describe('parseFNSTimeFormat', () => {
        test('various formats', () => {
            expect(parseFNSTimeFormat('kk:mm aa')).toBe('HH:mm');
            expect(parseFNSTimeFormat('HH:mm')).toBe('HH:mm');
            expect(parseFNSTimeFormat('kk:mm')).toBe('HH:mm');
            expect(parseFNSTimeFormat('hh:mm')).toBe('hh:mm a');
            expect(parseFNSTimeFormat('KK:mm')).toBe('hh:mm a');
        });
    });

    describe('parseDateFNSTimeFormat', () => {
        test('various formats', () => {
            expect(parseDateFNSTimeFormat('yyyy-MM HH')).toBeUndefined();
            expect(parseDateFNSTimeFormat('yyyy-MM-DD HHmm')).toBeUndefined();
            expect(parseDateFNSTimeFormat('yyyy-MM HH HH:mm')).toBe('HH:mm');
            expect(parseDateFNSTimeFormat('yyyy:MM:DD kk:mm aa')).toBe('HH:mm');
            expect(parseDateFNSTimeFormat('yyyy-MM-DD HH:mm')).toBe('HH:mm');
            expect(parseDateFNSTimeFormat('yyyy:MM:DD kk:mm')).toBe('HH:mm');
            expect(parseDateFNSTimeFormat('yyyy:MM:DD hh:mm')).toBe('hh:mm a');
            expect(parseDateFNSTimeFormat('yyyy:MM:DD KK:mm')).toBe('hh:mm a');
            expect(parseDateFNSTimeFormat('MMMM dd yyyy HH:mm')).toBe('HH:mm');
            expect(parseDateFNSTimeFormat('MMMM dd yyyy HH:mm:ss')).toBe('HH:mm:ss');
            expect(parseDateFNSTimeFormat('MMMM dd yyyy hh:mm:ss a')).toBe('hh:mm:ss a');
            expect(parseDateFNSTimeFormat('MMMM dd yyyy hh:mm:ss aa')).toBe('hh:mm:ss a');
        });
    });

    describe('getColFormattedDateFilterValue', () => {
        test('formatDateTime with QueryColumn format', () => {
            const col = new QueryColumn({
                shortCaption: 'DateCol',
                rangeURI: DATETIME_TYPE.rangeURI,
                format: 'dd/MM/yyyy HH:mm',
            });

            expect(getColFormattedDateFilterValue(col, ['', null, '2022-04-19 01:02', 'ABCDEFG'])).toStrictEqual([
                '',
                null,
                '19/04/2022 01:02',
                'ABCDEFG',
            ]);
        });

        test('formatDateTime without QueryColumn format', () => {
            const col = new QueryColumn({ shortCaption: 'DateCol', rangeURI: DATETIME_TYPE.rangeURI });
            expect(getColFormattedDateFilterValue(col, '2022-04-19 01:02')).toBe('2022-04-19');
        });

        test('formatDate with QueryColumn format', () => {
            const col = new QueryColumn({
                shortCaption: 'DateCol',
                rangeURI: DATE_TYPE.rangeURI,
                format: 'dd/MM/yyyy',
            });
            expect(getColFormattedDateFilterValue(col, '2022-04-19 01:02')).toBe('19/04/2022');
        });

        test('formatDate without QueryColumn format', () => {
            const col = new QueryColumn({ shortCaption: 'DateCol', rangeURI: DATE_TYPE.rangeURI });
            expect(getColFormattedDateFilterValue(col, '2022-04-19 01:02')).toBe('2022-04-19');
        });

        test('formatDate without QueryColumn format, without timestamp', () => {
            const col = new QueryColumn({ shortCaption: 'DateCol', rangeURI: DATE_TYPE.rangeURI });
            expect(getColFormattedDateFilterValue(col, '2022-04-19')).toBe('2022-04-19');
        });

        test('formatDate with QueryColumn format, without timestamp', () => {
            const col = new QueryColumn({
                shortCaption: 'DateCol',
                rangeURI: DATE_TYPE.rangeURI,
                format: 'dd/MM/yyyy',
            });
            expect(getColFormattedDateFilterValue(col, '2022-04-19')).toBe('19/04/2022');
        });
    });

    describe('getColFormattedTimeFilterValue', () => {
        test('format time with QueryColumn format', () => {
            let col = new QueryColumn({
                shortCaption: 'TimeCol',
                rangeURI: TIME_TYPE.rangeURI,
                format: 'HH:mm:ss',
            });
            expect(getColFormattedTimeFilterValue(col, '01:02 PM')).toBe('13:02:00');
            expect(getColFormattedTimeFilterValue(col, '01:02:03 AM')).toBe('01:02:03');
            expect(getColFormattedTimeFilterValue(col, '01:02 AM')).toBe('01:02:00');
            expect(getColFormattedTimeFilterValue(col, '01:02')).toBe('01:02:00');
            expect(getColFormattedTimeFilterValue(col, '21:02:30')).toBe('21:02:30');

            col = new QueryColumn({
                shortCaption: 'TimeCol',
                rangeURI: TIME_TYPE.rangeURI,
                format: 'hh:mm a',
            });
            expect(getColFormattedTimeFilterValue(col, '01:02 PM')).toBe('01:02 PM');
            expect(getColFormattedTimeFilterValue(col, '01:02:03 AM')).toBe('01:02 AM');
            expect(getColFormattedTimeFilterValue(col, '01:02')).toBe('01:02 AM');
            expect(getColFormattedTimeFilterValue(col, '21:02:30')).toBe('09:02 PM');
        });

        test('formatDateTime without QueryColumn format', () => {
            const col = new QueryColumn({
                shortCaption: 'TimeCol',
                rangeURI: TIME_TYPE.rangeURI,
            });
            expect(getColFormattedTimeFilterValue(col, '01:02 PM')).toBe('13:02');
            expect(getColFormattedTimeFilterValue(col, '01:02:03 AM')).toBe('01:02');
            expect(getColFormattedTimeFilterValue(col, '01:02 AM')).toBe('01:02');
            expect(getColFormattedTimeFilterValue(col, '01:02:03')).toBe('01:02');
            expect(getColFormattedTimeFilterValue(col, '21:02:03')).toBe('21:02');
        });
    });

    describe('parseDate', () => {
        test('no dateStr', () => {
            expect(parseDate(undefined)).toBeNull();
            expect(parseDate(null)).toBeNull();
            expect(parseDate('')).toBeNull();
        });

        test('invalid date', () => {
            expect(parseDate('test')).toBeNull();
            expect(parseDate('test', 'yyyy-MM-dd')).toBeNull();
            expect(parseDate(new Date(NaN))).toBeNull();
            expect(parseDate(new Date(''))).toBeNull();
            expect(parseDate({} as any)).toBeNull();
        });

        test('valid date without dateFormat', () => {
            expect(parseDate('2022-04-19 01:02').toString()).toContain('Apr 19 2022');
            expect(parseDate('2022-04-19').toString()).toContain('Apr 19 2022');
            expect(parseDate('04/19/2022').toString()).toContain('Apr 19 2022');
        });

        test('valid date with dateFormat', () => {
            expect(parseDate('01:02 2022-04-19', 'HH:mm yyyy-MM-dd').toString()).toContain('Apr 19 2022');
            expect(parseDate('19/04/2022', 'dd/MM/yyyy').toString()).toContain('Apr 19 2022');
            expect(parseDate('4/11/2022', 'dd/MM/yyyy').toString()).toContain('Nov 04 2022');
            expect(parseDate('04/11/2022', 'dd/MM/yyyy').toString()).toContain('Nov 04 2022');
            expect(parseDate('4/11/2022', 'yyyy-MM-dd').toString()).toContain('Apr 11 2022');
            expect(parseDate('04/11/2022', 'yyyy-MM-dd').toString()).toContain('Apr 11 2022');
            expect(parseDate('4/11/2022', 'yyyy-MM-dd HH:ss').toString()).toContain('Apr 11 2022');
            expect(parseDate('04/11/2022', 'yyyy-MM-dd HH:ss').toString()).toContain('Apr 11 2022');
            expect(parseDate('22-04-11', 'yy-MM-dd').toString()).toContain('Apr 11 2022');
            expect(parseDate('22-04-11', 'YY-MM-DD').toString()).toContain('Apr 11 2022');
            expect(parseDate('22/04/11', 'yy/MM/dd').toString()).toContain('Apr 11 2022');
            expect(parseDate('22/04/11', 'YY/MM/DD').toString()).toContain('Apr 11 2022');
        });

        test('minDate', () => {
            expect(parseDate('0218-11-18', undefined).toString()).toContain('0218');
            expect(parseDate('0218-11-18', undefined, new Date('1000-01-01'))).toBeNull();
            expect(parseDate('0218-11-18 00:00', 'yyyy-MM-dd HH:ss').toString()).toContain('0218');
            expect(parseDate('0218-11-18 00:00', 'yyyy-MM-dd HH:ss', new Date('1000-01-01'))).toBeNull();
        });

        test('dateOnly', () => {
            expect(parseDate('01:02', undefined, undefined, undefined, true)).toBeNull();
            expect(parseDate('1985-09-11', undefined, undefined, undefined, true).toString()).toContain(
                'Sep 11 1985 00:00:00'
            );
        });

        test('timeOnly', () => {
            expect(parseDate('01:02', undefined, undefined, true).toString()).toContain('01:02:00');
            expect(parseDate('11:02:59', undefined, undefined, true)).toBeNull();
            // The following fails in parseTime() but succeeds in parseDate() since the
            // latter can successfully parse dates with a post-fixed time.
            expect(parseDate('1985-09-11 12:50:22', undefined, undefined, true).toString()).toContain(
                'Sep 11 1985 12:50:22'
            );
        });
    });

    describe('parseTime', () => {
        test('invalid times', () => {
            expect(parseTime(undefined)).toBeNull();
            expect(parseTime(null)).toBeNull();
            expect(parseTime('')).toBeNull();
            expect(parseTime('13:02 AM')).toBeNull();
            expect(parseTime('13:02 PM')).toBeNull();
            expect(parseTime('09/11/1985')).toBeNull();
            // The following fails in parseTime() but succeeds in parseDate() since the
            // latter can successfully parse dates with a post-fixed time.
            expect(parseTime('1985-09-11 12:50:22')).toBeNull();
        });

        test('valid times', () => {
            expect(parseTime('01:02 AM').toString()).toContain('01:02');
            expect(parseTime('01:02 PM').toString()).toContain('13:02');
            expect(parseTime('11:02 AM').toString()).toContain('11:02');
            expect(parseTime('13:02').toString()).toContain('13:02');
            expect(parseTime('11:02:59 AM').toString()).toContain('11:02:59');
            expect(parseTime('21:02:30').toString()).toContain('21:02:30');
        });
    });

    describe('getNextDateStr', () => {
        test('default days', () => {
            expect(getNextDateStr('2022-02-02')).toEqual('2022-02-03');
            expect(getNextDateStr('2022-02-02 01:02')).toEqual('2022-02-03');
        });

        test('0 day', () => {
            expect(getNextDateStr('2022-02-02', 0)).toEqual('2022-02-02');
        });

        test('n positive days', () => {
            expect(getNextDateStr('2022-02-02', 3)).toEqual('2022-02-05');
            expect(getNextDateStr('2022-02-02 01:02', 3)).toEqual('2022-02-05');
            expect(getNextDateStr('2022-02-27', 3)).toEqual('2022-03-02');
            expect(getNextDateStr('2022-02-27 01:02', 3)).toEqual('2022-03-02');
        });

        test('n negative days', () => {
            expect(getNextDateStr('2022-02-02', -3)).toEqual('2022-01-30');
            expect(getNextDateStr('2022-02-02 01:02', -3)).toEqual('2022-01-30');
            expect(getNextDateStr('2022-02-27', -3)).toEqual('2022-02-24');
            expect(getNextDateStr('2022-02-27 01:02', -3)).toEqual('2022-02-24');
        });
    });

    describe('isRelativeDateFilterValue', () => {
        test('empty value', () => {
            expect(isRelativeDateFilterValue(undefined)).toBeFalsy();
            expect(isRelativeDateFilterValue(null)).toBeFalsy();
            expect(isRelativeDateFilterValue('')).toBeFalsy();
        });

        test('date value', () => {
            expect(isRelativeDateFilterValue('2022-04-19 01:02')).toBeFalsy();
            expect(isRelativeDateFilterValue('2022-04-19')).toBeFalsy();
        });

        test('incomplete value', () => {
            expect(isRelativeDateFilterValue('3d')).toBeFalsy();
            expect(isRelativeDateFilterValue('d')).toBeFalsy();
            expect(isRelativeDateFilterValue('3')).toBeFalsy();
            expect(isRelativeDateFilterValue('0d')).toBeFalsy();
            expect(isRelativeDateFilterValue('+d')).toBeFalsy();
            expect(isRelativeDateFilterValue('+3')).toBeFalsy();
            expect(isRelativeDateFilterValue('++3d')).toBeFalsy();
        });

        test('valid', () => {
            expect(isRelativeDateFilterValue('+3d')).toBeTruthy();
            expect(isRelativeDateFilterValue('+300d')).toBeTruthy();
            expect(isRelativeDateFilterValue('-3d')).toBeTruthy();
            expect(isRelativeDateFilterValue('-0d')).toBeTruthy();
        });
    });

    describe('getParsedRelativeDateStr', () => {
        test('getParsedRelativeDateStr', () => {
            expect(getParsedRelativeDateStr('+3d')).toStrictEqual({
                positive: true,
                days: 3,
            });
            expect(getParsedRelativeDateStr('+300d')).toStrictEqual({
                positive: true,
                days: 300,
            });
            expect(getParsedRelativeDateStr('-3d')).toStrictEqual({
                positive: false,
                days: 3,
            });
            expect(getParsedRelativeDateStr('-0d')).toStrictEqual({
                positive: false,
                days: 0,
            });
        });
    });

    describe('isDateTimeInPast', () => {
        test('empty', () => {
            expect(isDateTimeInPast(undefined)).toBeFalsy();
            expect(isDateTimeInPast(null)).toBeFalsy();
            expect(isDateTimeInPast('')).toBeFalsy();
        });

        test('past', () => {
            expect(isDateTimeInPast('2022-02-02')).toBeTruthy();
            expect(isDateTimeInPast('2022-02-02 01:02')).toBeTruthy();
            expect(isDateTimeInPast('2022-02-02 01:02:03.123')).toBeTruthy();
        });

        test('today midnight', () => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            expect(isDateTimeInPast(today)).toBeTruthy();
        });

        test('now', () => {
            const nowDate = new Date();
            const now = getJsonDateTimeFormatString(nowDate);
            const in10SecondsDate = new Date(nowDate.getTime() + 10 * 6000);
            const in10Seconds = getJsonDateTimeFormatString(in10SecondsDate);

            expect(isDateTimeInPast(now)).toBeTruthy();
            expect(isDateTimeInPast(in10Seconds)).toBeFalsy();
        });

        test('futurama', () => {
            expect(isDateTimeInPast('3000-01-01')).toBeFalsy();
            expect(isDateTimeInPast('3000-01-01 00:01')).toBeFalsy();
            expect(isDateTimeInPast('3000-01-01 00:00:00.001')).toBeFalsy();
        });
    });

    describe('toDateFNSFormatString', () => {
        const datePOSIX = 1724734973542; // Mon Aug 26 2024 22:02:53.542 GMT-0700 (Pacific Daylight Time)
        const testDate = new Date(datePOSIX);

        // Default to a timezone so the tests reproduce same result regardless of test running location
        function checkFormat(format: string, timezone = 'PST'): string {
            return formatDate(testDate, timezone, format);
        }

        test('Date checks', () => {
            expect(checkFormat('dd.')).toBe('26.');
            expect(checkFormat('dd.MM.')).toBe('26.08.');
            expect(checkFormat('dd.MM.yyyy')).toBe('26.08.2024');
            expect(checkFormat('DD.MM.yyyy')).toBe('26.08.2024');
            expect(checkFormat('d.M.yyyy')).toBe('26.8.2024');
            expect(checkFormat('D.M.yyyy')).toBe('26.8.2024');
            expect(checkFormat('YYYY')).toBe('2024');
            expect(checkFormat('yyyy')).toBe('2024');
            expect(checkFormat('YY')).toBe('24');
            expect(checkFormat('yy')).toBe('24');
            expect(checkFormat('M')).toBe('8');
            expect(checkFormat('MM')).toBe('08');
            expect(checkFormat('MMM')).toBe('Aug');
            expect(checkFormat('MMMM')).toBe('August');
        });

        test('Hour and minute checks', () => {
            expect(checkFormat('HH:mm')).toBe('22:02');
            expect(checkFormat('hh:mm')).toBe('10:02');
            expect(checkFormat('hh:mm A')).toBe('10:02 PM');
            expect(checkFormat('hh:mm a')).toBe('10:02 PM');
            expect(checkFormat('h:mm A')).toBe('10:02 PM');
            expect(checkFormat('h:mm a')).toBe('10:02 PM');
            expect(checkFormat('m')).toBe('2');
            expect(checkFormat('h')).toBe('10');
            expect(checkFormat('H')).toBe('22');
        });

        test('Seconds and milliseconds checks', () => {
            expect(checkFormat('HH:mm:ss')).toBe('22:02:53');
            expect(checkFormat('HH:mm:ss.SSS')).toBe('22:02:53.542');
            expect(checkFormat('s')).toBe('53');
            expect(checkFormat('ss')).toBe('53');
            expect(checkFormat('S')).toBe('5');
            expect(checkFormat('SS')).toBe('54');
            expect(checkFormat('SSS')).toBe('542');
        });

        test('Weekday checks', () => {
            expect(checkFormat('EEE')).toEqual('Mon');
            expect(checkFormat('EEEE')).toEqual('Monday');
            expect(checkFormat('u')).toEqual('1');
            expect(checkFormat('uu')).toEqual('1');
            expect(checkFormat('uuuu')).toEqual('1');
            expect(checkFormat('w')).toEqual('35');
            expect(checkFormat('ww')).toEqual('35');
            expect(checkFormat('www')).toEqual('035');
        });

        test('Timezone checks', () => {
            const tz = 'EST';
            expect(checkFormat('z', tz)).toBe('-05:00');
            expect(checkFormat('zzzz', tz)).toBe('-05:00');
            expect(checkFormat('Z', tz)).toBe('-05:00');
            expect(checkFormat('ZZZZ', tz)).toBe('-05:00');
            expect(checkFormat('X', tz)).toBe('-05');
            expect(checkFormat('XX', tz)).toBe('-0500');
            expect(checkFormat('XXX', tz)).toBe('-05:00');
        });
    });
});
