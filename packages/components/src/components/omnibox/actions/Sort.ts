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

import { Action, ActionOption, ActionValue, Value } from './Action';
import { parseColumns, resolveFieldKey } from '../utils';
import { QueryColumn, QueryGridModel } from '../../base/models/model';

export class SortAction implements Action {
    iconCls = 'sort';
    param = 'sort';
    keyword = 'sort';
    optionalLabel = 'columns';
    separator = ',';
    getModel: () => QueryGridModel;

    constructor(urlPrefix: string, getModel: () => QueryGridModel) {
        this.getModel = getModel;

        if (urlPrefix) {
            this.param = [urlPrefix, this.param].join('.');
        }
    }

    static parseTokens(tokens: Array<string>, columns: List<QueryColumn>): {columnName: string, dir: string, column?: QueryColumn} {
        let options = {
            column: undefined,
            columnName: undefined,
            dir: undefined
        };

        if (tokens.length > 0) {
            options.columnName = tokens[0];

            // see if the column is in our current domain
            const column = parseColumns(columns, options.columnName).first();
            if (column) {
                options.column = column;
            }
        }

        if (tokens.length > 1 && tokens[1].length > 0) {
            options.dir = tokens[1].toUpperCase()
        }

        return options;
    }

    // e.g. inputValue - "Name ASC" or "Some/Column DESC"
    completeAction(tokens: Array<string>): Promise<Value> {
        return new Promise((resolve) => {
            const { column, columnName, dir } = SortAction.parseTokens(tokens, this.getModel().getDisplayColumns());
            // resolveFieldKey because of Issue 34627
            const name = column ? resolveFieldKey(columnName, column) : columnName;
            resolve({
                displayValue: column ? column.shortCaption : name,
                isValid: name ? true : false,
                param: dir ? (dir === 'DESC' ? '-' + name : name) : name,
                value: name + ' ' + (dir ? (dir === 'DESC' ? 'DESC' : 'ASC') : 'ASC')
            });
        });
    }

    fetchOptions(tokens: Array<string>): Promise<Array<ActionOption>> {
        return new Promise((resolve) => {
            const columns = this.getModel().getDisplayColumns();
            const options = SortAction.parseTokens(tokens, columns);
            let results: Array<ActionOption> = [];

            // user has a chosen column
            if (options.column) {
                const ASC = {
                    label: `"${options.column.shortCaption}" asc`,
                    value: 'asc',
                    isComplete: true
                };
                const DESC = {
                    label: `"${options.column.shortCaption}" desc`,
                    value: 'desc',
                    isComplete: true
                };

                if (options.dir) {
                    if (ASC.value.toLowerCase().indexOf(options.dir.toLowerCase()) == 0) {
                        results.push(ASC);
                    }
                    else if (DESC.value.toLowerCase().indexOf(options.dir.toLowerCase()) == 0) {
                        results.push(DESC);
                    }
                    else {
                        // leave results empty
                    }
                }
                else {
                    results.push(ASC);
                    results.push(DESC);
                }
            }
            else if (columns.size > 0) {
                let columnSet: List<QueryColumn>;

                if (options.columnName) {
                    columnSet = columns.filter(c => c.name.toLowerCase().indexOf(options.columnName.toLowerCase()) === 0).toList();
                }
                else {
                    columnSet = columns.filter(c => c.sortable === true).toList();
                }

                columnSet.forEach((c) => {
                    results.push({
                        label: `"${c.shortCaption}" ...`,
                        value: `"${c.shortCaption}"`,
                        isComplete: false
                    });
                });
            }

            resolve(results);
        });
    }

    buildParams(actionValues: Array<ActionValue>): Array<{paramKey: string; paramValue: string}> {
        let paramValue = '',
            sep = '';

        for (let i=0; i < actionValues.length; i++) {
            paramValue += sep + actionValues[i].param;
            sep = this.separator;
        }

        return [{
            paramKey: this.param,
            paramValue
        }];
    }

    matchParam(paramKey: string, paramValue: any): boolean {
        return paramKey && paramKey.toLowerCase() === this.param;
    }

    parseParam(paramKey: string, paramValue: any, columns: List<QueryColumn>): Array<string> | Array<Value> {

        let columnName,
            dir,
            params = paramValue.split(this.separator),
            raw;

        return params.map((param) => {
            raw = param.trim();

            if (raw.length > 0) {
                dir = raw.indexOf('-') === 0 ? 'DESC' : 'ASC';
                columnName = dir === 'DESC' ? raw.slice(1) : raw;
                const column = parseColumns(columns, columnName).first();
                const columnLabel = column ? column.shortCaption : columnName;

                return {
                    displayValue: columnLabel,
                    param: raw,
                    value: columnName + ' ' + dir.toLowerCase()
                };
            }
        });
    }
}
