import { Ajax, Utils } from '@labkey/api';

import { handleRequestFailure } from './util/utils';

export type RequestHandler = (request: XMLHttpRequest) => void;

export interface RequestOptions extends Omit<Ajax.RequestOptions, 'failure' | 'scope' | 'success'> {
    errorLogMsg?: string;
    requestHandler?: RequestHandler;
}

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
export function request<T>(options: RequestOptions): Promise<T> {
    const { errorLogMsg = 'Error making ajax request', requestHandler, ...ajaxOptions } = options;

    return new Promise((resolve, reject) => {
        const xmlHttpRequest = Ajax.request({
            ...ajaxOptions,
            success: Utils.getCallbackWrapper((res: T) => resolve(res)),
            failure: handleRequestFailure(reject, errorLogMsg),
        });
        requestHandler?.(xmlHttpRequest);
    });
}
