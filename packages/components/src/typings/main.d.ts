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
// This allows for IntelliJ to resolve custom jest matcher typings from
// @testing-library/jest-dom which are included via import in jest.setup.ts.
/// <reference types="@testing-library/jest-dom" />

/**
 * @deprecated Use getServerContext() from @labkey/api instead
 */
declare const LABKEY: import('@labkey/api').LabKey;

/**
 * Needed so we can use process.env.NODE_ENV, which is injected by webpack, but not included in the types declared in
 * the browser environments.
 */
declare const process: {
    env: {
        NODE_ENV: string;
    };
};
