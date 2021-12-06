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

import { formatDate, formatDateTime, generateNameWithTimestamp, getJsonDateTimeFormatString } from './Date';

beforeAll(() => {
    initUnitTests();
});

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
