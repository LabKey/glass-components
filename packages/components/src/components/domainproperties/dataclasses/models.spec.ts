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

import { DomainDesign } from '../models';

import { DataClassModel } from './models';

describe('DataClassModel', () => {
    test('isNew', () => {
        expect(DataClassModel.create({ rowId: undefined }).isNew()).toBeTruthy();
        expect(DataClassModel.create({ rowId: 0 }).isNew()).toBeTruthy();
        expect(DataClassModel.create({ rowId: 1 }).isNew()).toBeFalsy();
    });

    test('hasValidProperties', () => {
        expect(DataClassModel.create({ name: undefined }).hasValidProperties()).toBeFalsy();
        expect(DataClassModel.create({ name: null }).hasValidProperties()).toBeFalsy();
        expect(DataClassModel.create({ name: '' }).hasValidProperties()).toBeFalsy();
        expect(DataClassModel.create({ name: ' ' }).hasValidProperties()).toBeFalsy();
        expect(DataClassModel.create({ name: 'test' }).hasValidProperties()).toBeTruthy();
    });

    test('getOptions', () => {
        const model = DataClassModel.create({
            rowId: 1,
            exception: 'exception',
            name: 'name',
            nameExpression: 'nameExpression',
            description: 'description',
            sampleSet: 2,
            category: 'category',
            domain: DomainDesign.create({}),
        });

        expect(model.getOptions()['exception']).toBeUndefined();
        expect(model.getOptions()['domain']).toBeUndefined();
        expect(model.getOptions()['rowId']).toBe(1);
        expect(model.getOptions()['name']).toBe('name');
        expect(model.getOptions()['nameExpression']).toBe('nameExpression');
        expect(model.getOptions()['description']).toBe('description');
        expect(model.getOptions()['sampleSet']).toBe(2);
        expect(model.getOptions()['category']).toBe('category');
    });
});
