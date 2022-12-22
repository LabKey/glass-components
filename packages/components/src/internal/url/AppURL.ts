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
import { List, Map, Record } from 'immutable';
import { ActionURL, Filter } from '@labkey/api';

export function createProductUrlFromParts(
    urlProductId: string,
    currentProductId: string,
    params: { [key: string]: any },
    ...parts
): string | AppURL {
    const appUrl = AppURL.create(...parts).addParams(params);
    return createProductUrl(urlProductId, currentProductId, appUrl);
}

export function createProductUrlFromPartsWithContainer(
    urlProductId: string,
    currentProductId: string,
    containerPath: string,
    params: { [key: string]: any },
    ...parts
): string | AppURL {
    const appUrl = AppURL.create(...parts).addParams(params);
    return createProductUrl(urlProductId, currentProductId, appUrl, containerPath);
}

export function createProductUrl(
    urlProductId: string,
    currentProductId: string,
    appUrl: string | AppURL,
    containerPath?: string
): string | AppURL {
    // if caller provided a containerPath, then buildURL
    // else if target productId of the URL is different then the current productId, then buildURL
    if (
        (containerPath && urlProductId) ||
        (urlProductId && (!currentProductId || urlProductId.toLowerCase() !== currentProductId.toLowerCase()))
    ) {
        const href = appUrl instanceof AppURL ? appUrl.toHref() : appUrl;
        return (
            buildURL(urlProductId.toLowerCase(), `${ActionURL.getAction() || 'app'}.view`, undefined, {
                returnUrl: false,
                container: containerPath, // if undefined, buildURL will use current container from server context
            }) + href
        );
    } else {
        return appUrl;
    }
}

export function applyURL(prop: string, options?: BuildURLOptions): string {
    if (options) {
        if (typeof options[prop] === 'string') {
            return options[prop];
        } else if (options[prop] instanceof AppURL) {
            return window.location.pathname + options[prop].toHref();
        }
    }
}

interface BuildURLOptions {
    cancelUrl?: string | AppURL;
    container?: string;
    returnUrl?: boolean | string | AppURL; // defaults to true when action does not end in '.api'
    successUrl?: string | AppURL;
}

export function buildURL(controller: string, action: string, params?: any, options?: BuildURLOptions): string {
    const constructedParams = {
        // server expects camel-case URL (e.g. Url)
        cancelUrl: undefined,
        returnUrl: undefined,
        successUrl: undefined,
    };

    const applyReturnURL = !options || (options && options.returnUrl !== false);

    if (applyReturnURL) {
        if (options && (typeof options.returnUrl === 'string' || options.returnUrl instanceof AppURL)) {
            constructedParams.returnUrl = applyURL('returnUrl', options);
        } else if (action.toLowerCase().indexOf('.api') === -1 && action.toLowerCase().indexOf('.post') === -1) {
            // use the current URL
            constructedParams.returnUrl = window.location.pathname + (window.location.hash ? window.location.hash : '');
        }
    }

    constructedParams.cancelUrl = applyURL('cancelUrl', options);
    constructedParams.successUrl = applyURL('successUrl', options);

    Object.keys(constructedParams).forEach(key => {
        if (!constructedParams[key]) {
            // remove any param keys that do not have values
            delete constructedParams[key];
        }
    });

    const parameters = Object.assign(params ? params : {}, constructedParams);

    return ActionURL.buildURL(controller, action, options?.container, parameters);
}

export class AppURL extends Record({
    _baseUrl: undefined,
    _filters: undefined,
    _params: undefined,
}) {
    declare _baseUrl: string;
    declare _filters: List<Filter.IFilter>;
    declare _params: Map<string, any>;

    static create(...parts): AppURL {
        let baseUrl = '';
        for (let i = 0; i < parts.length; i++) {
            if (parts[i] === undefined || parts[i] === null || parts[i] === '') {
                let sep = '';
                throw (
                    'AppURL: Unable to create URL with empty parts. Parts are [' +
                    parts.reduce((str, part) => {
                        str += sep + part;
                        sep = ', ';
                        return str;
                    }, '') +
                    '].'
                );
            }

            const stringPart = parts[i].toString();
            const newPart = encodeURIComponent(stringPart);

            if (i === 0) {
                if (stringPart.indexOf('/') === 0) {
                    baseUrl += newPart;
                } else {
                    baseUrl += '/' + newPart;
                }
            } else {
                baseUrl += '/' + newPart;
            }
        }

        return new AppURL({ _baseUrl: baseUrl });
    }

    addFilters(...filters: Filter.IFilter[]): AppURL {
        return this.merge({
            _filters: this._filters ? this._filters.concat(filters) : List(filters),
        }) as AppURL;
    }

    addParam(key: string, value: any): AppURL {
        return this.addParams({
            [key]: value,
        });
    }

    addParams(params: any): AppURL {
        if (params) {
            let mapParams = Map<string, any>();
            mapParams = mapParams.merge(params);
            let encodedParams = Map<string, any>();
            mapParams.forEach((value, key) => {
                encodedParams = encodedParams.set(encodeURIComponent(key), encodeURIComponent(value));
            });
            return this.merge({
                _params: this._params ? this._params.merge(encodedParams) : encodedParams,
            }) as AppURL;
        }

        return this;
    }

    toHref(urlPrefix?: string): string {
        return '#' + this.toString(urlPrefix);
    }

    toQuery(urlPrefix?: string): { [key: string]: any } {
        const query = {};

        if (this._params) {
            this._params.forEach((value: any, key: string) => {
                query[key] = value;
            });
        }

        if (this._filters) {
            this._filters.forEach(f => {
                query[f.getURLParameterName(urlPrefix)] = f.getURLParameterValue();
            });
        }

        return query;
    }

    toString(urlPrefix?: string): string {
        const url = this._baseUrl;
        const parts = [];

        if (this._params) {
            this._params.forEach((value: any, key: string) => {
                parts.push(key + '=' + value);
            });
        }

        if (this._filters) {
            this._filters.forEach(f => {
                parts.push(f.getURLParameterName(urlPrefix) + '=' + f.getURLParameterValue());
            });
        }

        return url + (parts.length > 0 ? '?' + parts.join('&') : '');
    }
}

/**
 * Helper method to splice into the parts of an AppURL what needs to be replaced.
 * E.g. "/me/go/here/43" -> "/john/goes/43"
 * parts ["me", "go", "here" 43"]
 * newParts ["john", "goes"]
 * startIndex 0
 * numToReplace 2 (replace "me" and "go")
 *
 * @param parts - the original parts of the URL
 * @param newParts - the new (and only new) parts of the URL that are to be spliced in
 * @param startIndex - where in the "parts" to start replacement
 * @param numToReplace - how far in the "parts" to replace (default is 1)
 * @returns {AppURL}
 */
export function spliceURL(parts: any[], newParts: any[], startIndex: number, numToReplace?: number): AppURL {
    parts.splice(startIndex, numToReplace === undefined ? 1 : numToReplace, ...newParts);
    const decodedParts = parts.map(p => decodeURIComponent(p)).filter(p => !!p);
    return AppURL.create(...decodedParts);
}
