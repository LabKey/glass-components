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
import { List, Record } from 'immutable';
import { ActionURL, Ajax, Utils, QueryKey } from '@labkey/api';

// These imports cannot be shortened or tests will start failing.
import { buildURL, createProductUrl, createProductUrlFromParts, AppURL } from '../../url/AppURL';

export class MenuSectionModel extends Record({
    label: undefined,
    url: undefined,
    items: List<MenuItemModel>(),
    totalCount: 0,
    itemLimit: undefined,
    key: undefined,
    productId: undefined,
    sectionKey: undefined,
}) {
    declare label: string;
    declare url: string;
    declare items: List<MenuItemModel>;
    declare totalCount: number;
    declare itemLimit: number;
    declare key: string;
    declare productId: string;
    declare sectionKey: string;

    static create(rawData: any, currentProductId?: string): MenuSectionModel {
        if (rawData) {
            let items;

            if (rawData.items) {
                items = rawData.items.map(i => MenuItemModel.create(i, rawData.sectionKey, currentProductId));
            }

            return new MenuSectionModel(
                Object.assign({}, rawData, {
                    items: List(items),
                })
            );
        }

        return new MenuSectionModel();
    }
}

export class MenuItemModel extends Record({
    id: undefined,
    key: undefined,
    label: undefined,
    url: undefined,
    orderNum: undefined,
    requiresLogin: false,
    hasActiveJob: false,
    fromSharedContainer: false,
}) {
    declare id: number;
    declare key: string;
    declare label: string;
    declare url: string | AppURL;
    declare orderNum: number;
    declare requiresLogin: boolean;
    declare hasActiveJob: boolean;
    declare fromSharedContainer: boolean;

    static create(rawData, sectionKey: string, currentProductId?: string): MenuItemModel {
        if (rawData) {
            const dataProductId = rawData.productId ? rawData.productId.toLowerCase() : undefined;

            if (rawData.key && sectionKey !== 'user') {
                const parts = rawData.key.split('?');  //TODO: This may cause issues with non-url keys that have '?' as they will be split unexpectedly. Issue #46611

                // for assay name that contains slash, full raw key (protocol/assayname: general/a/b) is encoded using QueryKey.encodePart as general/a$Sb on server side
                // use QueryKey.decodePart to decode the assay name so url can be correctly called by encodeURIComponent and key be used to display decoded assay name
                const subParts = parts[0]
                    .split('/')
                    .filter(val => val !== '')
                    .map(QueryKey.decodePart);

                const decodedPart = subParts.join('/').replace('$','$$$$'); // Need to escape any '$' in the replacement string https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/replace#specifying_a_string_as_the_replacement
                const decodedKey = rawData.key.replace(parts[0], decodedPart);

                let params;
                if (parts.length > 1 && parts[1]) {
                    params = ActionURL.getParameters(rawData.key);
                }

                return new MenuItemModel(
                    Object.assign({}, rawData, {
                        url: createProductUrlFromParts(
                            dataProductId,
                            currentProductId,
                            params,
                            sectionKey,
                            ...subParts
                        ),
                        key: decodedKey,
                    })
                );
            } else {
                return new MenuItemModel(
                    Object.assign({}, rawData, {
                        url: createProductUrl(dataProductId, currentProductId, rawData.url),
                    })
                );
            }
        }
        return new MenuItemModel();
    }

    getUrlString(): string {
        return typeof this.url === 'string' ? this.url : this.url?.toHref();
    }
}

export class ProductMenuModel extends Record({
    isError: false,
    isLoaded: false,
    isLoading: false,
    sections: List<MenuSectionModel>(),
    message: undefined,
    currentProductId: undefined,
    userMenuProductId: undefined,
    productIds: undefined,
    needsReload: false,
}) {
    declare isError: boolean;
    declare isLoaded: boolean;
    declare isLoading: boolean;
    declare message: string;
    declare sections: List<MenuSectionModel>;
    declare currentProductId: string; // the current product's id
    declare userMenuProductId: string; // the product's id for the user menu items
    declare productIds: List<string>; // the list of all product ids to be included in the menu; leave undefined for all products in the container
    declare needsReload: boolean;

    init(): void {
        if (!this.isLoaded && !this.isLoading) {
            this.getMenuSections()
                .then(this.setLoadedSections)
                .catch(reason => {
                    console.error('Problem retrieving product menu data.', reason);
                    return this.setError(
                        'Error in retrieving product menu data. Please contact your site administrator.'
                    );
                });
        }
    }

    /**
     * Retrieve the product menu sections for this productId
     */
    getMenuSections(itemLimit?: number): Promise<List<MenuSectionModel>> {
        return new Promise((resolve, reject) => {
            return Ajax.request({
                url: buildURL('product', 'menuSections.api'),
                params: Object.assign({
                    currentProductId: this.currentProductId,
                    userMenuProductId: this.userMenuProductId,
                    productIds: List.isList(this.productIds) ? this.productIds.toArray().join(',') : this.productIds,
                    itemLimit,
                }),
                success: Utils.getCallbackWrapper(response => {
                    let sections = List<MenuSectionModel>();
                    if (response) {
                        response.forEach(sectionData => {
                            sections = sections.push(MenuSectionModel.create(sectionData, this.currentProductId));
                        });
                    }
                    resolve(sections);
                }),
                failure: Utils.getCallbackWrapper(response => {
                    console.error(response);
                    reject(response);
                }),
            });
        });
    }

    setLoadedSections(sections: List<MenuSectionModel>): ProductMenuModel {
        return this.merge({
            isLoaded: true,
            isLoading: false,
            needsReload: false,
            sections,
        }) as ProductMenuModel;
    }

    setError(message: string): ProductMenuModel {
        return this.merge({
            isLoading: false,
            isLoaded: true,
            needsReload: false,
            isError: true,
            message,
        }) as ProductMenuModel;
    }

    getSection(key: string): MenuSectionModel {
        return this.sections.find(section => section.key.toLowerCase() === key.toLowerCase());
    }

    hasSectionItems(key: string): boolean {
        return this.isLoaded && this.getSection(key)?.totalCount > 0;
    }

    setNeedsReload(): ProductMenuModel {
        return this.merge({
            needsReload: true,
        }) as ProductMenuModel;
    }
}
