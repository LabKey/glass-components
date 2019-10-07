import { initQueryGridState } from './global';
import { initMocks } from './stories/mock';
import { Map } from 'immutable';

/**
 * Use this method in beforeAll() for your jest tests and you'll have full access
 * to all of the same mock API responses we use in storybook.
 */
export function initUnitTestMocks(metadata?: Map<string, any>, columnRenderers?: Map<string, any>) {
    LABKEY.container = {
        path: "testContainer",
        formats: {
            dateFormat: "yyyy-MM-dd",
            dateTimeFormat: "yyyy-MM-dd HH:mm",
            numberFormat: null
        }
    };
    LABKEY.contextPath = 'labkey';
    initQueryGridState(metadata, columnRenderers);
    initMocks();
}
