import { Map } from 'immutable';
import mock, { proxy } from 'xhr-mock';

import {
    initDomainPropertiesMocks,
    initLineageMocks,
    initPipelineStatusDetailsMocks,
    initQueryGridMocks,
    initUserPropsMocks,
} from '../stories/mock';

import { initUnitTests } from './testHelpers';

/**
 * Use this method in beforeAll() for your jest tests and you'll have full access
 * to all of the same mock API responses we use in storybook.
 */
export function initUnitTestMocks(
    extraMocks?: (() => void)[],
    metadata?: Map<string, any>
): void {
    window['__react-beautiful-dnd-disable-dev-warnings'] = true;
    initUnitTests(metadata);
    mock.setup();
    initQueryGridMocks();
    initDomainPropertiesMocks();
    initUserPropsMocks();
    if (extraMocks) {
        extraMocks.forEach(mock => mock());
    }
    mock.use(proxy);
}
