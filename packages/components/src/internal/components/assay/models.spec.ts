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
import { TEST_ASSAY_STATE_MODEL } from '../../../test/data/constants';
import {GENERAL_ASSAY_PROVIDER_NAME} from "./actions";

describe('AssayStateModel', () => {
    test('getById', () => {
        expect(TEST_ASSAY_STATE_MODEL.getById(0)?.name).toBe(undefined);
        expect(TEST_ASSAY_STATE_MODEL.getById(1)?.name).toBe('GPAT 1');
        expect(TEST_ASSAY_STATE_MODEL.getById(3)?.name).toBe('NAb 1');
    });

    test('getByName', () => {
        expect(TEST_ASSAY_STATE_MODEL.getByName('BOGUS')?.id).toBe(undefined);
        expect(TEST_ASSAY_STATE_MODEL.getByName('GPAT 1')?.id).toBe(1);
        expect(TEST_ASSAY_STATE_MODEL.getByName('NAb 1')?.id).toBe(3);
    });

    describe('getDefinitionsByType', () => {
        test('included list', () => {
            expect(TEST_ASSAY_STATE_MODEL.getDefinitionsByTypes(['BOGUS'])).toHaveLength(0);
            expect(TEST_ASSAY_STATE_MODEL.getDefinitionsByTypes([GENERAL_ASSAY_PROVIDER_NAME])).toHaveLength(2);
            expect(TEST_ASSAY_STATE_MODEL.getDefinitionsByTypes(['NAb'])).toHaveLength(1);
            expect(TEST_ASSAY_STATE_MODEL.getDefinitionsByTypes(['nab'])).toHaveLength(1);
        });
        test('excluded list', () => {
            expect(TEST_ASSAY_STATE_MODEL.getDefinitionsByTypes(undefined, ['NAb'])).toHaveLength(4);
            expect(TEST_ASSAY_STATE_MODEL.getDefinitionsByTypes(undefined, [GENERAL_ASSAY_PROVIDER_NAME])).toHaveLength(3);
        });
    });
});
