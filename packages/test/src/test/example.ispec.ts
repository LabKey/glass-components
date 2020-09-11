/*
 * Copyright (c) 2020 LabKey Corporation
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
import { hookServer, RequestOptions, successfulResponse } from '../integrationUtils';

// Declare the name of the LabKey project for these tests.
const PROJECT_NAME = 'LabKeyTestExampleProject';

// Acquire an instance of the configured server. This will use the configuration supplied
// either by command line or configuration file.
const server = hookServer(process.env);

// Initialize the server with the specified test project. Optionally, you can ensure any
// modules that are needed for the test to run are enabled in the test container.
beforeAll(async () => {
    return server.init(PROJECT_NAME, {
        ensureModules: ['query']
    });
});

// After the tests complete the test project can be cleaned up by calling teardown().
afterAll(async () => {
    return server.teardown();
});

describe('query-selectRows.api', () => {
    it('requires a query parameter', async () => {
        // Act
        // Make a POST request against the server. Here we expect a 404 response status code.
        const response = await server
            .post('query', 'selectRows.api', { schemaName: 'core' })
            .expect(404);

        // Assert
        const { exception } = response.body;
        expect(exception).toEqual('Query not specified');
    });
});

describe('query-executeSql.api', () => {
    let requestOptions: RequestOptions;

    beforeAll(async () => {
        const testContainer = await server.createTestContainer();
        // TODO: Use a different user to make these requests -- must be given read permission in the test container
        // const testUser = await server.createUser('boom@test.com', 'pwSuper1Awesome!');

        requestOptions = {
            containerPath: testContainer.path,
            // requestContext: await server.createRequestContext(testUser),
        };
    });

    it('successfully processes request', async () => {
        // Act
        // Make a POST request against the server. Here we expect a successful response.
        const response = await server
            .post('query', 'executeSql.api', {
                schemaName: 'core',
                sql: 'SELECT Name FROM core.containers',
            }, requestOptions)
            .expect(successfulResponse);

        // Assert
        const { rowCount } = response.body;
        expect(rowCount).toEqual(1);
    });
});
