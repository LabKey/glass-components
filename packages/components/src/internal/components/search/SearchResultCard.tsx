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

import { SearchResultCardData } from './models';
import { incrementClientSideMetricCount } from '../../actions';
import { getCurrentAppProperties } from '../../app/utils';

interface SearchResultProps {
    cardData: SearchResultCardData;
    iconUrl?: string;
    isTopResult: boolean;
    summary: string;
    url: string;
}

export const SearchResultCard: FC<SearchResultProps> = memo(({ cardData, iconUrl, isTopResult, summary, url }) => {
    const { altText, category, iconDir, iconSrc, title, typeName } = cardData;
    const { productId } = getCurrentAppProperties();
    let summaryText = 'No summary provided';

    const onClick = useCallback(() => {
        if (isTopResult) incrementClientSideMetricCount(productId + 'Search', 'firstResultClicked');
    }, [isTopResult, productId]);

    if (summary.length) {
        summaryText = summary.length <= 35 ? summary : summary.substr(0, 35);
    }

    return (
        <a href={url} onClick={onClick}>
            <div className="row search-result__card-container">
                <div className="hidden-xs search-result__card-icon__container">
                    {iconUrl && <img className="search-result__card-icon" src={iconUrl} />}
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
                        <h4 className="text-capitalize">{title}</h4>
                        {category && <div className="search-result__category-badge">{category}</div>}
                        {typeName && <div className="search-result__type-badge">{typeName}</div>}
                    </div>
                    <div className="search-result__summary">{summaryText}</div>
                </div>
            </div>
        </a>
    );
});
