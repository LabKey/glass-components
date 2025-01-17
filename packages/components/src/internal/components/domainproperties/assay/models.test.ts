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

import { AssayProtocolModel } from './models';

describe('AssayProtocolModel', () => {
    test('getDomainByNameSuffix', () => {
        const model = AssayProtocolModel.create({
            protocolId: 1,
            name: 'Test Assay Protocol',
            description: 'My assay protocol for you all to use.',
            domains: [
                {
                    name: 'Sample Fields',
                    fields: [
                        {
                            name: 'field1',
                            rangeURI: 'xsd:string',
                        },
                        {
                            name: 'field2',
                            rangeURI: 'xsd:int',
                        },
                        {
                            name: 'field3',
                            rangeURI: 'xsd:dateTime',
                        },
                    ],
                },
            ],
        });

        expect(model.getDomainByNameSuffix('Foo') === undefined).toBeTruthy();
        expect(model.getDomainByNameSuffix('sample') === undefined).toBeTruthy();
        expect(model.getDomainByNameSuffix('Sample') === undefined).toBeFalsy();
    });

    test('isNew', () => {
        // name should get removed for the case where it is a "new" model (i.e. doesn't have a protocolId)
        expect(AssayProtocolModel.create({ protocolId: 1, name: 'Test' }).isNew()).toBeFalsy();
        expect(AssayProtocolModel.create({ protocolId: 0, name: 'Test' }).isNew()).toBeTruthy();
        expect(AssayProtocolModel.create({ name: 'Test' }).isNew()).toBeTruthy();
    });

    test('name removal for copy case', () => {
        // name should get removed for the case where it is a "new" model (i.e. doesn't have a protocolId)
        expect(AssayProtocolModel.create({ protocolId: 1, name: 'Test' }).name).toBe('Test');
        expect(AssayProtocolModel.create({ protocolId: 0, name: 'Test' }).name).toBe(undefined);
        expect(AssayProtocolModel.create({ name: 'Test' }).name).toBe(undefined);
    });

    test('allowPlateTemplateSelection', () => {
        expect(AssayProtocolModel.create({}).allowPlateTemplateSelection()).toBeFalsy();
        expect(
            AssayProtocolModel.create({ availablePlateTemplates: 'test' }).allowPlateTemplateSelection()
        ).toBeFalsy();
        expect(AssayProtocolModel.create({ availablePlateTemplates: [] }).allowPlateTemplateSelection()).toBeTruthy();
        expect(
            AssayProtocolModel.create({ availablePlateTemplates: ['a', 'b', 'c'] }).allowPlateTemplateSelection()
        ).toBeTruthy();
    });

    test('allowDetectionMethodSelection', () => {
        expect(AssayProtocolModel.create({}).allowDetectionMethodSelection()).toBeFalsy();
        expect(
            AssayProtocolModel.create({ availableDetectionMethods: 'test' }).allowDetectionMethodSelection()
        ).toBeFalsy();
        expect(
            AssayProtocolModel.create({ availableDetectionMethods: [] }).allowDetectionMethodSelection()
        ).toBeTruthy();
        expect(
            AssayProtocolModel.create({ availableDetectionMethods: ['a', 'b', 'c'] }).allowDetectionMethodSelection()
        ).toBeTruthy();
    });

    test('allowMetadataInputFormatSelection', () => {
        expect(AssayProtocolModel.create({}).allowMetadataInputFormatSelection()).toBeFalsy();
        expect(
            AssayProtocolModel.create({ availableMetadataInputFormats: 'test' }).allowMetadataInputFormatSelection()
        ).toBeFalsy();
        expect(
            AssayProtocolModel.create({ availableMetadataInputFormats: {} }).allowMetadataInputFormatSelection()
        ).toBeFalsy();
        expect(
            AssayProtocolModel.create({
                availableMetadataInputFormats: { test1: 'abc', test2: 'def' },
            }).allowMetadataInputFormatSelection()
        ).toBeTruthy();
    });

    test('isValid', () => {
        const base = { protocolId: 1, name: 'test' };

        expect(AssayProtocolModel.create({ ...base, name: undefined }).hasValidProperties()).toBeFalsy();
        expect(AssayProtocolModel.create({ ...base, name: null }).hasValidProperties()).toBeFalsy();
        expect(AssayProtocolModel.create({ ...base, name: '' }).hasValidProperties()).toBeFalsy();
        expect(AssayProtocolModel.create({ ...base, name: 'test' }).hasValidProperties()).toBeTruthy();

        expect(
            AssayProtocolModel.create({
                ...base,
                availableMetadataInputFormats: { foo: 'bar' },
                selectedMetadataInputFormat: undefined,
            }).hasValidProperties()
        ).toBeFalsy();
        expect(
            AssayProtocolModel.create({
                ...base,
                availableMetadataInputFormats: { foo: 'bar' },
                selectedMetadataInputFormat: null,
            }).hasValidProperties()
        ).toBeFalsy();
        expect(
            AssayProtocolModel.create({
                ...base,
                availableMetadataInputFormats: { foo: 'bar' },
                selectedMetadataInputFormat: 1,
            }).hasValidProperties()
        ).toBeFalsy();
        expect(
            AssayProtocolModel.create({
                ...base,
                availableMetadataInputFormats: { foo: 'bar' },
                selectedMetadataInputFormat: 'foo',
            }).hasValidProperties()
        ).toBeTruthy();

        expect(
            AssayProtocolModel.create({
                ...base,
                availableDetectionMethods: ['foo'],
                selectedDetectionMethod: undefined,
            }).hasValidProperties()
        ).toBeFalsy();
        expect(
            AssayProtocolModel.create({
                ...base,
                availableDetectionMethods: ['foo'],
                selectedDetectionMethod: null,
            }).hasValidProperties()
        ).toBeFalsy();
        expect(
            AssayProtocolModel.create({
                ...base,
                availableDetectionMethods: ['foo'],
                selectedDetectionMethod: 1,
            }).hasValidProperties()
        ).toBeFalsy();
        expect(
            AssayProtocolModel.create({
                ...base,
                availableDetectionMethods: ['foo'],
                selectedDetectionMethod: 'foo',
            }).hasValidProperties()
        ).toBeTruthy();

        expect(
            AssayProtocolModel.create({
                ...base,
                availablePlateTemplates: ['foo'],
                selectedPlateTemplate: undefined,
            }).hasValidProperties()
        ).toBeFalsy();
        expect(
            AssayProtocolModel.create({
                ...base,
                availablePlateTemplates: ['foo'],
                selectedPlateTemplate: null,
            }).hasValidProperties()
        ).toBeFalsy();
        expect(
            AssayProtocolModel.create({
                ...base,
                availablePlateTemplates: ['foo'],
                selectedPlateTemplate: 1,
            }).hasValidProperties()
        ).toBeFalsy();
        expect(
            AssayProtocolModel.create({
                ...base,
                availablePlateTemplates: ['foo'],
                selectedPlateTemplate: 'foo',
            }).hasValidProperties()
        ).toBeTruthy();
    });

    test('validateTransformScripts', () => {
        const base = { protocolId: 1, name: 'test' };

        expect(AssayProtocolModel.create({ ...base }).validateTransformScripts()).toBe(undefined);
        expect(AssayProtocolModel.create({ ...base, protocolTransformScripts: [] }).validateTransformScripts()).toBe(
            undefined
        );
        expect(
            AssayProtocolModel.create({ ...base, protocolTransformScripts: List<string>() }).validateTransformScripts()
        ).toBe(undefined);
        expect(
            AssayProtocolModel.create({
                ...base,
                protocolTransformScripts: [{ scriptPath: 'foo.pl' }, { scriptPath: 'bar.R' }],
            }).validateTransformScripts()
        ).toBe(undefined);

        expect(
            AssayProtocolModel.create({
                ...base,
                protocolTransformScripts: [{ scriptPath: 'foo.pl' }, { scriptPath: 'bar.R' }, { scriptPath: '' }],
            }).validateTransformScripts()
        ).toContain('Missing required');
        expect(
            AssayProtocolModel.create({
                ...base,
                protocolTransformScripts: [{ scriptPath: 'foo.pl' }, null, { scriptPath: 'bar.R' }],
            }).validateTransformScripts()
        ).toContain('Missing required');
        expect(
            AssayProtocolModel.create({
                ...base,
                protocolTransformScripts: [undefined, { scriptPath: 'foo.pl' }, { scriptPath: 'bar.R' }],
            }).validateTransformScripts()
        ).toContain('Missing required');

        expect(
            AssayProtocolModel.create({
                ...base,
                saveScriptFiles: false,
                protocolTransformScripts: [{ scriptPath: 'foo.pl' }, { scriptPath: 'bar.R' }],
            }).validateTransformScripts()
        ).toBe(undefined);
        expect(
            AssayProtocolModel.create({
                ...base,
                saveScriptFiles: true,
                protocolTransformScripts: [{ scriptPath: 'foo.pl' }, { scriptPath: 'bar.R' }],
            }).validateTransformScripts()
        ).toBe(undefined);
        expect(
            AssayProtocolModel.create({
                ...base,
                saveScriptFiles: false,
                protocolTransformScripts: [{ scriptPath: 'foo.pl' }, { scriptPath: '/path with space/bar.R' }],
            }).validateTransformScripts()
        ).toBe(undefined);
        expect(
            AssayProtocolModel.create({
                ...base,
                saveScriptFiles: true,
                protocolTransformScripts: [{ scriptPath: 'foo.pl' }, { scriptPath: '/path with space/bar.R' }],
            }).validateTransformScripts()
        ).toBe(undefined);
    });

    test('container', () => {
        const newModel = AssayProtocolModel.create({
            name: 'Test Assay Protocol',
            domains: [
                {
                    name: 'Sample Fields',
                    container: 'Test Container',
                },
            ],
        });
        expect(newModel.container).toBe('');

        const existingModel = AssayProtocolModel.create({
            protocolId: 1,
            name: 'Test Assay Protocol',
            domains: [
                {
                    name: 'Sample Fields',
                    container: 'Test Container',
                },
            ],
        });
        expect(existingModel.container).toBe('Test Container');
    });

    test('domainContainerId', () => {
        const newModel = AssayProtocolModel.create({
            name: 'Test Assay Protocol',
            domains: [
                {
                    name: 'Sample Fields',
                    container: 'Test Container',
                },
            ],
        });
        expect(newModel.domainContainerId).toBe('Test Container');

        const existingModel = AssayProtocolModel.create({
            protocolId: 1,
            name: 'Test Assay Protocol',
            domains: [
                {
                    name: 'Sample Fields',
                    container: 'Test Container',
                },
            ],
        });
        expect(existingModel.domainContainerId).toBe('Test Container');
    });
});
