import { Ajax, Utils, RequestOptions } from '@labkey/api';

import { handleRequestFailure } from './util/utils';

type Options = Omit<RequestOptions, 'success' | 'failure'>;

export function request<T>(options: Options, errorLogMsg = 'Error making ajax request'): Promise<T> {
    return new Promise((resolve, reject) => {
        Ajax.request({
            ...options,
            success: Utils.getCallbackWrapper((res: T) => {
                resolve(res);
            }),
            failure: handleRequestFailure(reject, errorLogMsg),
        });
    });
}
