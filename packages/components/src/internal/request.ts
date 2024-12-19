import { Ajax, Utils } from '@labkey/api';

import { handleRequestFailure } from './util/utils';

type Options = Omit<Ajax.RequestOptions, 'success' | 'failure'>;
type RequestHandler = (request: XMLHttpRequest) => void;

/**
 * This is a light wrapper around Ajax.request that takes the same options, minus success and failure. Instead of
 * passing success or failure you wrap the call in try/catch and await the call to request e.g.:
 *
 * try {
 *     const resp = await request(myOptions);
 * } catch (error) {
 *     // handle error here
 * }
 */
export function request<T>(
    options: Options,
    errorLogMsg = 'Error making ajax request',
    requestHandler?: RequestHandler
): Promise<T> {
    return new Promise((resolve, reject) => {
        const xmlHttpRequest = Ajax.request({
            ...options,
            success: Utils.getCallbackWrapper((res: T) => resolve(res)),
            failure: handleRequestFailure(reject, errorLogMsg),
        });
        requestHandler?.(xmlHttpRequest);
    });
}
