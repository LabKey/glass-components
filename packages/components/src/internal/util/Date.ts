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
import moment from 'moment-jdateformatparser';
import momentTZ from 'moment-timezone';
import numeral from 'numeral';
import { Container, getServerContext } from '@labkey/api';

import { QueryColumn } from '../..';

const CREATED_CONCEPT_URI = "http://www.labkey.org/types#createdTimestamp";    // JbcType.TIMESTAMP
const MODIFIED_CONCEPT_URI = "http://www.labkey.org/types#modifiedTimestamp";   // JbcType.TIMESTAMP

export function datePlaceholder(col: QueryColumn): string {
    let placeholder;

    if (col) {
        const rangeURI = col.rangeURI.toLowerCase();

        // attempt to use the rangeURI to figure out if we are working with a dateTime or date object
        // note Created and Modified columns do not include the rangeURI information
        if (rangeURI.indexOf('datetime') > -1) {
            placeholder = getDateTimeFormat();
        } else if (rangeURI.indexOf('date') > -1) {
            placeholder = getDateFormat();
        } else {
            placeholder = getDateTimeFormat();
        }
    }

    return placeholder;
}

export function isDateTimeCol(col: QueryColumn): boolean {
    if (col) {
        const rangeURI = col.rangeURI?.toLowerCase();

        // attempt to use the rangeURI to figure out if we are working with a dateTime or date object
        // note Created and Modified columns do not include the rangeURI information
        if (rangeURI?.indexOf('datetime') > -1) {
            return true;
        }
    }

    return false;
}

export function getColDateFormat(queryColumn: QueryColumn, dateFormat?: string): string {
    let rawFormat = dateFormat || queryColumn.format || datePlaceholder(queryColumn);

    // Issue 44011: account for the shortcut values (i.e. "Date", "DateTime", and "Time")
    if (rawFormat === 'Date') rawFormat = getDateFormat();
    if (rawFormat === 'DateTime') rawFormat = getDateTimeFormat();
    if (rawFormat === 'Time') rawFormat = getTimeFormat();

    // Moment.js and react datepicker date format is different
    // https://github.com/Hacker0x01/react-datepicker/issues/1609
    return rawFormat.replace('YYYY', 'yyyy').replace('DD', 'dd');
}

export function getColFormattedDateValue(column: QueryColumn, value: string): string {
    const dateFormat = getColDateFormat(column);
    return isDateTimeCol(column)
        ? formatDateTime(new Date(value), null, dateFormat)
        : formatDate(new Date(value), null, dateFormat);
}

// 30834: get look and feel display formats
export function getDateFormat(container?: Partial<Container>): string {
    return moment().toMomentFormatString((container ?? getServerContext().container).formats.dateFormat);
}

export function getDateTimeFormat(container?: Partial<Container>): string {
    return moment().toMomentFormatString((container ?? getServerContext().container).formats.dateTimeFormat);
}

// hard-coded value, see docs: https://www.labkey.org/Documentation/Archive/21.7/wiki-page.view?name=studyDateNumber#short
export function getTimeFormat(): string {
    return moment().toMomentFormatString('HH:mm:ss');
}

export function parseDate(dateStr: string, dateFormat?: string): Date {
    if (!dateStr) return null;

    // Moment.js and react datepicker date format is different
    // https://github.com/Hacker0x01/react-datepicker/issues/1609
    const _dateFormat = dateFormat?.replace('yyyy', 'YYYY').replace('dd', 'DD');

    const date = moment(dateStr, _dateFormat);
    if (date && date.isValid()) {
        return date.toDate();
    }

    return null;
}

function _formatDate(date: Date | number, dateFormat: string, timezone?: string): string {
    if (!date) return undefined;
    const _date = moment(timezone ? momentTZ(date).tz(timezone) : date);
    return _date.formatWithJDF(dateFormat);
}

export function formatDate(date: Date | number, timezone?: string, dateFormat?: string): string {
    return _formatDate(date, dateFormat ?? getDateFormat(), timezone);
}

export function formatDateTime(date: Date | number, timezone?: string, dateFormat?: string): string {
    return _formatDate(date, dateFormat ?? getDateTimeFormat(), timezone);
}

export function getUnFormattedNumber(n): number {
    return n ? numeral(n).value() : n;
}

// Issue 44398: see DateUtil.java getJsonDateTimeFormatString(), this function is to match the format, which is
// provided by the LabKey server for the API response, from a JS Date object
export function getJsonDateTimeFormatString(date: Date): string {
    return _formatDate(date, 'YYYY-MM-dd HH:mm:ss');
}

export function generateNameWithTimestamp(name: string): string {
    const date = new Date();
    const dateStr = date.toISOString().split('T')[0];
    let timeStr = date.toTimeString().split(' ')[0];
    timeStr = timeStr.replace(/:/g, '-');
    return name + '_' + dateStr + '_' + timeStr;
}

function twoDigit(num: number): string {
    if (num < 10) {
        return '0' + num;
    }
    return '' + num;
}

// From a current date string, get the next date string
// example, from "2022-02-02", return "2022-02-03"
export function getNextDateStr(currentDateStr: string) : string {
    let nextDate = new Date(new Date(currentDateStr).getTime() + 60 * 60 * 24 * 1000); // add 24 hours

    const userTimezoneOffset = nextDate.getTimezoneOffset() * 60*1000;
    nextDate = new Date(nextDate.getTime() + userTimezoneOffset);

    const year = nextDate.getFullYear();
    const month = nextDate.getMonth() + 1;
    const day = nextDate.getDate();

    return '' + year + '-' + twoDigit(month) + '-' + twoDigit(day);
}
