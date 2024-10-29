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
import React, { FC, memo, useCallback } from 'react';

import { SVGIcon } from '../base/SVGIcon';

import { incrementClientSideMetricCount } from '../../actions';
import { getCurrentAppProperties } from '../../app/utils';

import { ArchivedFolderTag } from '../folder/ArchivedFolderTag';

import { SearchResultCardData } from './models';

interface SearchResultProps {
    archived?: boolean;
    cardData: SearchResultCardData;
    iconUrl?: string;
    isTopResult: boolean;
    summary: string;
    url: string;
}

export const SearchResultCard: FC<SearchResultProps> = memo(
    ({ cardData, iconUrl, isTopResult, summary, url, archived }) => {
        const { altText, category, iconDir, iconSrc, title, typeName } = cardData;
        const productId = getCurrentAppProperties()?.productId;
        const summaryText = summary?.length ? summary : 'No summary provided';

        const onClick = useCallback(() => {
            if (isTopResult) incrementClientSideMetricCount(productId + 'Search', 'firstResultClicked');
            incrementClientSideMetricCount(productId + 'Search', 'resultClicked');
        }, [isTopResult, productId]);

        const textParts = [];
        if (category) textParts.push(category);
        if (typeName) textParts.push(typeName);
        return (
            <a href={url} onClick={onClick}>
                <div className="row search-result__card-container">
                    <div className="hidden-xs search-result__card-icon__container">
                        {iconUrl && <img className="search-result__card-icon" src={iconUrl} alt={altText} />}
                        {!iconUrl && (
                            <SVGIcon
                                iconDir={iconDir}
                                iconSrc={iconSrc}
                                alt={altText}
                                className="search-result__card-icon"
                            />
                        )}
                    </div>
                    <div className="col-sm-12">
                        <div className="col-sm-12 search-result__title">
                            <h4>{title}</h4>
                            {textParts.length > 0 && (
                                <div className="margin-left status-pill muted">{textParts.join(': ')}</div>
                            )}
                            <ArchivedFolderTag archived={archived} />
                        </div>
                        <div className="search-result__summary">{summaryText}</div>
                    </div>
                </div>
            </a>
        );
    }
);
