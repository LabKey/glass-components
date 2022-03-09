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
import { fromJS, List, Map } from 'immutable';

import { AppURL, ExperimentRunResolver } from '../..';

import { initMockServerContext, registerDefaultURLMappers } from '../testHelpers';

import { AssayResolver, AssayRunResolver, ListResolver, SamplesResolver } from './AppURLResolver';
import { URLResolver } from './URLResolver';
import {initUnitTestMocks} from "../testHelperMocks";

beforeAll(() => {
    initUnitTestMocks();
    registerDefaultURLMappers();
});

describe('URL Resolvers', () => {
    const selectRowsResult = fromJS({
        schemaName: ['Go'],
        queryName: 'Mariners',
        metaData: {
            fields: [
                {
                    fieldKey: 'LookupColumn',
                    lookup: {
                        schemaName: 'BoomSchema',
                        queryName: 'PowQuery',
                    },
                },
                {
                    fieldKey: 'DataClassLookupColumn',
                    lookup: {
                        schemaName: 'exp',
                        queryName: 'DataClasses',
                    },
                },
                {
                    fieldKey: 'NonLookupExpShowDataClass',
                },
                {
                    fieldKey: 'LookupExpShowDataClass',
                    lookup: {
                        schemaName: 'exp.data',
                    },
                },
                {
                    fieldKey: 'NonLookupExpShowData',
                },
                {
                    fieldKey: 'LookupExpShowData',
                    lookup: {
                        schemaName: 'exp.data',
                        queryName: 'someDataClass',
                    },
                },
                {
                    fieldKey: 'LookupIssues',
                    lookup: {
                        schemaName: 'issues',
                        queryName: 'someTracker',
                    },
                },
                {
                    fieldKey: 'LookupExpRun',
                    lookup: {
                        schemaName: 'exp',
                        queryName: 'runs',
                    },
                },
                {
                    fieldKey: 'LookupExpRun2',
                    lookup: {
                        schemaName: 'exp',
                        queryName: 'results',
                    },
                },
            ],
        },
        rows: [
            {
                // note: the "data" has been removed here as it would have already been processed by selectRows handler
                DataClassLookupColumn: {
                    displayValue: 'MyDataClass',
                    url: '/labkey/testContainer/url?blam=19',
                    value: 19,
                },
                LookupColumn: {
                    url: '/labkey/testContainer/url?blam=2392',
                    value: 101,
                },
                NonLookupExpShowDataClass: {
                    url: '/labkey/testContainer/experiment-showDataClass.view?rowId=124',
                    value: 'NoLookupDataClass',
                },
                LookupExpShowDataClass: {
                    displayValue: 'BeepBoop',
                    url: '/labkey/testContainer/experiment-showDataClass.view?rowId=124',
                    value: 'Has Lookup',
                },
                NonLookupExpShowData: {
                    url: '/labkey/testContainer/experiment-showData.view?rowId=124',
                    value: 'No Lookup',
                },
                LookupExpShowData: {
                    url: '/labkey/testContainer/experiment-showData.view?rowId=124',
                    value: 'Has Lookup',
                },
                LookupIssues: {
                    displayValue: 'My Foo Request',
                    url: '/labkey/testContainer/issues-details.view?issueId=523',
                    value: 523,
                },
                LookupExpRun: {
                    displayValue: 'An Assay Run',
                    url: '/labkey/testContainer/assay-assayDetailRedirect.view?runId=584',
                    value: 584,
                },
                LookupExpRun2: {
                    displayValue: 'An Assay Run - 2',
                    url: '/labkey/testContainer/assay-assayResults.view?rowId=94&Data.Run%2FRowId~eq=253',
                    value: 584,
                },
            },
            {
                // note: the "data" has been removed here as it would have already been processed by selectRows handler
                DataClassLookupColumn: {
                    displayValue: 'MyDataClass',
                    url: '/labkey/otherContainer/url?blam=19',
                    value: 19,
                },
                LookupColumn: {
                    url: '/labkey/otherContainer/url?blam=2392',
                    value: 101,
                },
                NonLookupExpShowDataClass: {
                    url: '/labkey/otherContainer/experiment-showDataClass.view?rowId=124',
                    value: 'NoLookupDataClass',
                },
                LookupExpShowDataClass: {
                    displayValue: 'BeepBoop',
                    url: '/labkey/otherContainer/experiment-showDataClass.view?rowId=124',
                    value: 'Has Lookup',
                },
                NonLookupExpShowData: {
                    url: '/labkey/otherContainer/experiment-showData.view?rowId=124',
                    value: 'No Lookup',
                },
                LookupExpShowData: {
                    url: '/labkey/otherContainer/experiment-showData.view?rowId=124',
                    value: 'Has Lookup',
                },
                LookupIssues: {
                    displayValue: 'My Foo Request',
                    url: '/labkey/otherContainer/issues-details.view?issueId=523',
                    value: 523,
                },
                LookupExpRun: {
                    displayValue: 'An Assay Run',
                    url: '/labkey/otherContainer/assay-assayDetailRedirect.view?runId=584',
                    value: 584,
                },
                LookupExpRun2: {
                    displayValue: 'An Assay Run - 2',
                    url: '/labkey/otherContainer/assay-assayResults.view?rowId=94&Data.Run%2FRowId~eq=253',
                    value: 584,
                },
            },
            {
                // note: the "data" has been removed here as it would have already been processed by selectRows handler
                DataClassLookupColumn: {
                    displayValue: 'MyDataClass',
                    url: '/labkey/testContainer/subContainer/url?blam=19',
                    value: 19,
                },
                LookupColumn: {
                    url: '/labkey/testContainer/subContainer/url?blam=2392',
                    value: 101,
                },
                NonLookupExpShowDataClass: {
                    url: '/labkey/testContainer/subContainer/experiment-showDataClass.view?rowId=124',
                    value: 'NoLookupDataClass',
                },
                LookupExpShowDataClass: {
                    displayValue: 'BeepBoop',
                    url: '/labkey/testContainer/subContainer/experiment-showDataClass.view?rowId=124',
                    value: 'Has Lookup',
                },
                NonLookupExpShowData: {
                    url: '/labkey/testContainer/subContainer/experiment-showData.view?rowId=124',
                    value: 'No Lookup',
                },
                LookupExpShowData: {
                    url: '/labkey/testContainer/subContainer/experiment-showData.view?rowId=124',
                    value: 'Has Lookup',
                },
                LookupIssues: {
                    displayValue: 'My Foo Request',
                    url: '/labkey/testContainer/subContainer/issues-details.view?issueId=523',
                    value: 523,
                },
                LookupExpRun: {
                    displayValue: 'An Assay Run',
                    url: '/labkey/testContainer/subContainer/assay-assayDetailRedirect.view?runId=584',
                    value: 584,
                },
                LookupExpRun2: {
                    displayValue: 'An Assay Run - 2',
                    url: '/labkey/testContainer/subContainer/assay-assayResults.view?rowId=94&Data.Run%2FRowId~eq=253',
                    value: 584,
                },
            },
        ],
    });

    test('Should remap URLs within SelectRowsResult', () => {
        const resolver = new URLResolver();

        // http://facebook.github.io/jest/docs/en/expect.html#expectassertionsnumber
        // avoid false positives by defining number of assertions in a test
        expect.assertions(9);

        const result = resolver.resolveSelectRows(selectRowsResult);
        const newResult = fromJS(result);

        // validate ActionMapper('experiment', 'showDataClass') -- no lookup
        expect(newResult.getIn(['rows', 0, 'NonLookupExpShowDataClass', 'url'])).toBe(
            '#/rd/dataclass/NoLookupDataClass'
        );

        // validate ActionMapper('experiment', 'showDataClass') -- with lookup
        expect(newResult.getIn(['rows', 0, 'LookupExpShowDataClass', 'url'])).toBe('#/rd/dataclass/BeepBoop');

        // validate ActionMapper('experiment', 'showData') -- no lookup
        expect(newResult.getIn(['rows', 0, 'NonLookupExpShowData', 'url'])).toBe('#/rd/expdata/124');

        // validate ActionMapper('experiment', 'showData') -- with lookup
        expect(newResult.getIn(['rows', 0, 'LookupExpShowData', 'url'])).toBe('#/rd/expdata/124');

        // validate LookupMapper('/q/')
        expect(newResult.getIn(['rows', 0, 'LookupColumn', 'url'])).toBe('#/q/BoomSchema/PowQuery/101');

        // validate LookupMapper('exp-dataclasses')
        expect(newResult.getIn(['rows', 0, 'DataClassLookupColumn', 'url'])).toBe('#/rd/dataclass/MyDataClass');

        // validate LookupMapper('issues')
        expect(newResult.getIn(['rows', 0, 'LookupIssues', 'url'])).toBe(
            '/labkey/testContainer/issues-details.view?issueId=523'
        );

        // validate LookupMapper('exp-runs')
        expect(newResult.getIn(['rows', 0, 'LookupExpRun', 'url'])).toBe('#/rd/assayrun/584');

        // validate ActionMapper('assay-assayResults.view?rowId=94&Data.Run%2FRowId~eq=253')
        expect(newResult.getIn(['rows', 0, 'LookupExpRun2', 'url'])).toBe('#/rd/assayrun/253');
    });

    test('Should not remap URLs within SelectRowsResult if lookup to different container not in folder tree', () => {
        const resolver = new URLResolver();

        // http://facebook.github.io/jest/docs/en/expect.html#expectassertionsnumber
        // avoid false positives by defining number of assertions in a test
        expect.assertions(9);

        const result = resolver.resolveSelectRows(selectRowsResult);
        const newResult = fromJS(result);

        // validate ActionMapper('experiment', 'showDataClass') -- no lookup
        expect(newResult.getIn(['rows', 1, 'NonLookupExpShowDataClass', 'url'])).toBe(
            '/labkey/otherContainer/experiment-showDataClass.view?rowId=124'
        );

        // validate ActionMapper('experiment', 'showDataClass') -- with lookup
        expect(newResult.getIn(['rows', 1, 'LookupExpShowDataClass', 'url'])).toBe('/labkey/otherContainer/experiment-showDataClass.view?rowId=124');

        // validate ActionMapper('experiment', 'showData') -- no lookup
        expect(newResult.getIn(['rows', 1, 'NonLookupExpShowData', 'url'])).toBe('/labkey/otherContainer/experiment-showData.view?rowId=124');

        // validate ActionMapper('experiment', 'showData') -- with lookup
        expect(newResult.getIn(['rows', 1, 'LookupExpShowData', 'url'])).toBe('/labkey/otherContainer/experiment-showData.view?rowId=124');

        // validate LookupMapper('/q/')
        expect(newResult.getIn(['rows', 1, 'LookupColumn', 'url'])).toBe('/labkey/otherContainer/url?blam=2392');

        // validate LookupMapper('exp-dataclasses')
        expect(newResult.getIn(['rows', 1, 'DataClassLookupColumn', 'url'])).toBe('/labkey/otherContainer/url?blam=19');

        // validate LookupMapper('issues')
        expect(newResult.getIn(['rows', 1, 'LookupIssues', 'url'])).toBe(
            '/labkey/otherContainer/issues-details.view?issueId=523'
        );

        // validate LookupMapper('exp-runs')
        expect(newResult.getIn(['rows', 1, 'LookupExpRun', 'url'])).toBe('/labkey/otherContainer/assay-assayDetailRedirect.view?runId=584');

        // validate ActionMapper('assay-assayResults.view?rowId=94&Data.Run%2FRowId~eq=253')
        expect(newResult.getIn(['rows', 1, 'LookupExpRun2', 'url'])).toBe('/labkey/otherContainer/assay-assayResults.view?rowId=94&Data.Run%2FRowId~eq=253');
    });

    test('Should remap URLs within SelectRowsResult if url containers are sub-folders', () => {
        const resolver = new URLResolver();

        // http://facebook.github.io/jest/docs/en/expect.html#expectassertionsnumber
        // avoid false positives by defining number of assertions in a test
        expect.assertions(9);

        const result = resolver.resolveSelectRows(selectRowsResult);
        const newResult = fromJS(result);

        // validate ActionMapper('experiment', 'showDataClass') -- no lookup
        expect(newResult.getIn(['rows', 2, 'NonLookupExpShowDataClass', 'url'])).toBe(
            '#/rd/dataclass/NoLookupDataClass'
        );

        // validate ActionMapper('experiment', 'showDataClass') -- with lookup
        expect(newResult.getIn(['rows', 2, 'LookupExpShowDataClass', 'url'])).toBe('#/rd/dataclass/BeepBoop');

        // validate ActionMapper('experiment', 'showData') -- no lookup
        expect(newResult.getIn(['rows', 2, 'NonLookupExpShowData', 'url'])).toBe('#/rd/expdata/124');

        // validate ActionMapper('experiment', 'showData') -- with lookup
        expect(newResult.getIn(['rows', 2, 'LookupExpShowData', 'url'])).toBe('#/rd/expdata/124');

        // validate LookupMapper('/q/')
        expect(newResult.getIn(['rows', 2, 'LookupColumn', 'url'])).toBe('#/q/BoomSchema/PowQuery/101');

        // validate LookupMapper('exp-dataclasses')
        expect(newResult.getIn(['rows', 2, 'DataClassLookupColumn', 'url'])).toBe('#/rd/dataclass/MyDataClass');

        // validate LookupMapper('issues')
        expect(newResult.getIn(['rows', 2, 'LookupIssues', 'url'])).toBe(
            '/labkey/testContainer/issues-details.view?issueId=523'
        );

        // validate LookupMapper('exp-runs')
        expect(newResult.getIn(['rows', 2, 'LookupExpRun', 'url'])).toBe('#/rd/assayrun/584');

        // validate ActionMapper('assay-assayResults.view?rowId=94&Data.Run%2FRowId~eq=253')
        expect(newResult.getIn(['rows', 2, 'LookupExpRun2', 'url'])).toBe('#/rd/assayrun/253');
    });

    test('Should remap URLs within SelectRowsResult if url containers are super-folders', () => {
        initMockServerContext({
            container: {
                id: 'subTestContainerEntityId',
                title: 'Sub Test Container',
                path: '/testContainer/subContainer1/subContainer2',
                formats: {
                    dateFormat: 'yyyy-MM-dd',
                    dateTimeFormat: 'yyyy-MM-dd HH:mm',
                    numberFormat: null,
                },
                activeModules: ['Core', 'Query'], // add in the Ontology module if you want to test the Field Editor integrations
            },
            contextPath: '/labkey',
        });

        const resolver = new URLResolver();

        // http://facebook.github.io/jest/docs/en/expect.html#expectassertionsnumber
        // avoid false positives by defining number of assertions in a test
        expect.assertions(9);

        const result = resolver.resolveSelectRows(selectRowsResult);
        const newResult = fromJS(result);

        // validate ActionMapper('experiment', 'showDataClass') -- no lookup
        expect(newResult.getIn(['rows', 0, 'NonLookupExpShowDataClass', 'url'])).toBe(
            '#/rd/dataclass/NoLookupDataClass'
        );

        // validate ActionMapper('experiment', 'showDataClass') -- with lookup
        expect(newResult.getIn(['rows', 0, 'LookupExpShowDataClass', 'url'])).toBe('#/rd/dataclass/BeepBoop');

        // validate ActionMapper('experiment', 'showData') -- no lookup
        expect(newResult.getIn(['rows', 0, 'NonLookupExpShowData', 'url'])).toBe('#/rd/expdata/124');

        // validate ActionMapper('experiment', 'showData') -- with lookup
        expect(newResult.getIn(['rows', 0, 'LookupExpShowData', 'url'])).toBe('#/rd/expdata/124');

        // validate LookupMapper('/q/')
        expect(newResult.getIn(['rows', 0, 'LookupColumn', 'url'])).toBe('#/q/BoomSchema/PowQuery/101');

        // validate LookupMapper('exp-dataclasses')
        expect(newResult.getIn(['rows', 0, 'DataClassLookupColumn', 'url'])).toBe('#/rd/dataclass/MyDataClass');

        // validate LookupMapper('issues')
        expect(newResult.getIn(['rows', 0, 'LookupIssues', 'url'])).toBe(
            '/labkey/testContainer/issues-details.view?issueId=523'
        );

        // validate LookupMapper('exp-runs')
        expect(newResult.getIn(['rows', 0, 'LookupExpRun', 'url'])).toBe('#/rd/assayrun/584');

        // validate ActionMapper('assay-assayResults.view?rowId=94&Data.Run%2FRowId~eq=253')
        expect(newResult.getIn(['rows', 0, 'LookupExpRun2', 'url'])).toBe('#/rd/assayrun/253');
    });
});

describe('App Route Resolvers', () => {
    test('Should resolve /assays routes', () => {
        const routes = Map<number, { name: string; provider: string }>().asMutable();
        routes.set(13, {
            provider: 'general',
            name: 'thirteen',
        });
        routes.set(91, {
            provider: 'specific',
            name: 'ninety-one',
        });
        const assayResolver = new AssayResolver(routes.asImmutable());

        // test regex
        expect.assertions(8);
        expect(assayResolver.matches(undefined)).toBe(false);
        expect(assayResolver.matches('/assays/91f')).toBe(false);
        expect(assayResolver.matches('/assays/91')).toBe(true);
        expect(assayResolver.matches('/assays/91/foo')).toBe(true);
        expect(assayResolver.matches('/assays/91/foo?bar=1')).toBe(true);

        return Promise.all([
            assayResolver.fetch(['assays', 'foo']).then((result: boolean) => {
                expect(result).toBe(true);
            }),
            assayResolver.fetch(['assays', '13']).then((url: AppURL) => {
                expect(url.toString()).toBe('/assays/general/thirteen');
            }),
            assayResolver.fetch(['assays', '91', 'foo bar']).then((url: AppURL) => {
                expect(url.toString()).toBe('/assays/specific/ninety-one/foo%20bar');
            }),
        ]);
    });

    test('Should resolve /rd/assayrun routes', () => {
        const routes = Map<number, number>().asMutable();
        routes.set(595, 13);
        routes.set(923, 15);

        const assayRunResolver = new AssayRunResolver(routes.asImmutable());

        // test regex
        expect.assertions(8);
        expect(assayRunResolver.matches(undefined)).toBe(false);
        expect(assayRunResolver.matches('/rd/assayrun/91f')).toBe(false);
        expect(assayRunResolver.matches('/rd/assayrun/91')).toBe(true);
        expect(assayRunResolver.matches('/rd/assayrun/91/foo')).toBe(true);
        expect(assayRunResolver.matches('/rd/assayrun/91/foo?bar=1')).toBe(true);

        return Promise.all([
            assayRunResolver.fetch(['rd', 'assayrun', 'boom']).then(result => {
                expect(result).toBe(true);
            }),
            assayRunResolver.fetch(['rd', 'assayrun', '923']).then(result => {
                expect(result.toString()).toBe('/assays/15/runs/923');
            }),
            assayRunResolver.fetch(['rd', 'assayrun', '595', 'extra']).then(result => {
                expect(result.toString()).toBe('/assays/13/runs/595/extra');
            }),
        ]);
    });

    test('Should resolve /q/lists routes', () => {
        const routes = Map<string, string>().asMutable();
        routes.set('/bulls|23', 'Jordan');
        routes.set('/lakers|8', 'KObE');
        routes.set('/jazz|7', 'PistolPete');
        const listResolver = new ListResolver(routes.asImmutable());

        // test regex
        expect.assertions(10);
        expect(listResolver.matches(undefined)).toBe(false);
        expect(listResolver.matches('/q/lists/f23')).toBe(false);
        expect(listResolver.matches('/q/lists/2.3')).toBe(false);
        expect(listResolver.matches('/q/lists/$CPSpath$CPE/23')).toBe(true);
        expect(listResolver.matches('/q/lists/$CPS1/23$CPE/3221/foo/bar')).toBe(true);
        expect(listResolver.matches('/q/lists/$CPSq/we/ry$CPE/919/foo/bar?bar=1')).toBe(true);

        return Promise.all([
            listResolver
                .fetch(['q', 'lists', ListResolver.encodeResolverPath('/BULLS'), 'jordan', 4])
                .then((result: boolean) => {
                    expect(result).toBe(true);
                }),
            listResolver.fetch(['q', 'lists', ListResolver.encodeResolverPath('/BULLS'), 23]).then((url: AppURL) => {
                expect(url.toString()).toBe('/q/lists/Jordan');
            }),
            listResolver
                .fetch(['q', 'lists', ListResolver.encodeResolverPath('/lakers'), '8', 'mamba'])
                .then((url: AppURL) => {
                    expect(url.toString()).toBe('/q/lists/KObE/mamba');
                }),
            listResolver
                .fetch(['q', 'lists', ListResolver.encodeResolverPath('/JaZz'), '7', 17, '?'])
                .then((url: AppURL) => {
                    expect(url.toString()).toBe('/q/lists/PistolPete/17/%3F');
                }),
        ]);
    });

    test('Should resolve /rd/samples/### routes', () => {
        const routes = Map<number, List<string>>().asMutable();
        routes.set(7, List(['samples', 'Elway']));
        routes.set(30, List(['samples', 'TD']));
        routes.set(80, List(['samples', 'RodSmith']));
        routes.set(24, List(['media', 'Woodson']));
        const samplesResolver = new SamplesResolver(routes.asImmutable());

        // test regex
        expect.assertions(11);
        expect(samplesResolver.matches(undefined)).toBe(false);
        expect(samplesResolver.matches('/rd/samples/f23')).toBe(false);
        expect(samplesResolver.matches('/rd/samples/2.3')).toBe(false);
        expect(samplesResolver.matches('/rd/samples/80')).toBe(true);
        expect(samplesResolver.matches('/rd/samples/3221/foo/bar')).toBe(true);
        expect(samplesResolver.matches('/rd/samples/919/foo/bar?bar=1')).toBe(true);

        return Promise.all([
            samplesResolver.fetch(['rd', 'samples', 'notvalid', 14]).then((result: boolean) => {
                expect(result).toBe(true);
            }),
            samplesResolver.fetch(['rd', 'samples', 30]).then((url: AppURL) => {
                expect(url.toString()).toBe('/samples/TD/30');
            }),
            samplesResolver.fetch(['rd', 'samples', '80', 'wideOut']).then((url: AppURL) => {
                expect(url.toString()).toBe('/samples/RodSmith/80/wideOut');
            }),
            samplesResolver.fetch(['rd', 'samples', '7', 77, '?']).then((url: AppURL) => {
                expect(url.toString()).toBe('/samples/Elway/7/77/%3F');
            }),
            samplesResolver.fetch(['rd', 'samples', 24]).then((url: AppURL) => {
                expect(url.toString()).toBe('/media/Woodson/24');
            }),
        ]);
    });

    test('Should resolve /rd/run/### routes', () => {
        const jobsResolver = new ExperimentRunResolver(new Set([4, 5, 10]));

        // test regex
        expect(jobsResolver.matches(undefined)).toBe(false);
        expect(jobsResolver.matches('/rd/samples/4')).toBe(false);
        expect(jobsResolver.matches('/rd/run/b')).toBe(false);
        expect(jobsResolver.matches('/a/rd/run/b')).toBe(false);
        expect(jobsResolver.matches('/rd/run/4')).toBe(true);
        expect(jobsResolver.matches('/rd/run/141345')).toBe(true);

        return Promise.all([
            jobsResolver.fetch(['rd', 'runs', 'notanumber']).then((result: boolean) => {
                expect(result).toBe(true);
            }),
            jobsResolver.fetch(['rd', 'runs', 4]).then((result: AppURL) => {
                expect(result.toString()).toBe('/workflow/4');
            }),
        ]);
    });
});
