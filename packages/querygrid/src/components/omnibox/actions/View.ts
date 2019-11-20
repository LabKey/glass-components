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
import { List } from 'immutable'

import { Action, ActionOption, ActionValue, Value } from './Action'
import { QueryColumn, QueryGridModel } from '../../base/models/model';

export class ViewAction implements Action {
    iconCls = 'table';
    param = 'view';
    keyword = 'view';
    oneWordLabel = 'view';
    optionalLabel = 'name';
    resolveColumns: () => Promise<List<QueryColumn>>;
    resolveModel: () => Promise<QueryGridModel>;
    singleton = true;
    urlPrefix: string;

    constructor(resolveColumns: () => Promise<List<QueryColumn>>, urlPrefix: string, resolveModel: () => Promise<QueryGridModel>) {
        this.resolveColumns = resolveColumns;
        this.resolveModel = resolveModel;
        this.urlPrefix = urlPrefix;
    }

    completeAction(tokens: Array<string>): Promise<Value> {

        return new Promise((resolve) => {

            return this.resolveModel().then((model) => {

                const { queryInfo } = model;
                let found = false;
                const name = tokens.join(' ').toLowerCase();

                queryInfo.views
                    .filter((view) => (
                        !view.isDefault &&
                        view.name.indexOf('~~') !== 0 &&
                        view.name.toLowerCase() === name
                    ))
                    .forEach((view) => {
                        found = true;
                        resolve({
                            param: this.getParamPrefix() + '=' + view.name,
                            value: view.name
                        });
                    });

                if (!found) {
                    resolve({
                        isValid: false,
                        value: name
                    });
                }
            });
        });
    }

    fetchOptions(tokens: Array<string>): Promise<Array<ActionOption>> {

        return new Promise((resolve) => {

            return this.resolveModel().then((model) => {

                const { queryInfo } = model;
                const name = tokens.join(' ').toLowerCase();

                let views = queryInfo.views
                    .filter((view) => !view.isDefault && view.name.indexOf('~~') !== 0);

                if (name) {
                    views = views.filter((view) => view.label.toLowerCase().indexOf(name) >= 0);
                }

                const results: Array<ActionOption> = views.reduce((arr, view) => {
                    arr.push({
                        appendValue: false,
                        isComplete: true,
                        label: view.label,
                        selectable: true,
                        value: view.name
                    });
                    return arr;
                }, []);

                if (results.length === 0) {
                    results.push({
                        label: '',
                        nextLabel: 'no views available',
                        selectable: false,
                        value: undefined
                    });
                }

                resolve(results);
            });
        });
    }

    getParamPrefix(): string {
        if (this.urlPrefix) {
            return [this.urlPrefix, this.param].join('.');
        }

        return this.param;
    }

    buildParams(actionValues: Array<ActionValue>): Array<{paramKey: string; paramValue: string}> {
        return actionValues.map((actionValue) => {
            const [ paramKey, paramValue ] = actionValue.param.split('=');

            return {
                paramKey,
                paramValue
            };
        });
    }

    matchParam(paramKey: string, paramValue: any): boolean {
        return paramKey && paramKey.toLowerCase() === this.param;
    }

    parseParam(paramKey: string, paramValue: any, columns: List<QueryColumn>): Array<string> | Array<Value> {
        let results: Array<Value> = [];

        if (paramValue) {
            results.push({
                param: `${paramKey}=${paramValue}`,
                value: paramValue
            });
        }

        return results;
    }
}
