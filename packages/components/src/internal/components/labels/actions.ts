import { ActionURL, Ajax, Utils } from '@labkey/api';

import { handleRequestFailure } from '../../util/utils';

export const updateCustomLabels = (
    labelProvider: string,
    labels: Record<string, string>,
    containerPath?: string
): Promise<void> => {
    return new Promise((resolve, reject) => {
        Ajax.request({
            url: ActionURL.buildURL('core', 'customLabels.api', containerPath),
            method: 'POST',
            jsonData: {
                provider: labelProvider,
                labelsJson: JSON.stringify(labels),
            },
            success: Utils.getCallbackWrapper(() => {
                resolve();
            }),
            failure: handleRequestFailure(reject, 'Failed to update folder custom labels.'),
        });
    });
};

const getCustomLabels = (containerPath?: string): Promise<Record<string, Record<string, string>>> => {
    return new Promise((resolve, reject) => {
        Ajax.request({
            url: ActionURL.buildURL('core', 'getCustomLabels.api', containerPath),
            method: 'GET',
            success: Utils.getCallbackWrapper(({ labels }) => {
                resolve(labels);
            }),
            failure: handleRequestFailure(reject, 'Failed to get ELN custom labels.'),
        });
    });
};

export const getModuleCustomLabels = (moduleName: string, containerPath?: string): Promise<Record<string, string>> => {
    return new Promise((resolve, reject) => {
        getCustomLabels(containerPath)
            .then(results => {
                resolve(results?.[moduleName]);
            })
            .catch(reason => {
                console.error(reason);
                reject(reason);
            });
    });
};
