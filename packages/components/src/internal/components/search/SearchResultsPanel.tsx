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
import React, { FC, memo } from 'react';

import { HelpLink, SEARCH_SYNTAX_TOPIC } from '../../util/helpLinks';

import { LoadingSpinner } from '../base/LoadingSpinner';

import { Alert } from '../base/Alert';

import { useServerContext } from '../base/ServerContext';

import { getArchivedFolders } from '../../app/utils';

import { SearchResultCard } from './SearchResultCard';
import { SearchResultsModel } from './models';
import { decodeErrorMessage } from './utils';

interface Props {
    emptyResultDisplay?: React.ReactNode;
    iconUrl?: string;
    model: SearchResultsModel;
    offset?: number;
}

export const SearchResultsPanel: FC<Props> = memo(({ emptyResultDisplay, iconUrl, model, offset = 0 }) => {
    const { moduleContext } = useServerContext();
    const archivedFolders = getArchivedFolders(moduleContext);

    const error = model?.error;
    const loading = model?.isLoading ?? false;
    const data = model?.getIn(['entities', 'hits']);
    const hasData = data?.size > 0;
    const empty = emptyResultDisplay ?? <div className="search-results__margin-top">No Results Found</div>;

    return (
        <div className="search-results-panel">
            {loading && (
                <div className="top-padding">
                    <LoadingSpinner />
                </div>
            )}
            {!loading && error && (
                <Alert className="margin-top">
                    There was an error with your search term(s). {decodeErrorMessage(error)}
                    <br />
                    <br />
                    See the <HelpLink topic={SEARCH_SYNTAX_TOPIC}>LabKey Search Documentation</HelpLink> page for more
                    information on search terms and operators.
                </Alert>
            )}
            {!loading && !error && hasData && (
                <div className="top-padding">
                    {data.size > 0 &&
                        data.map((item, i) => (
                            <div key={i} className="col-md-12 col-sm-12 search-results__margin-top">
                                <SearchResultCard
                                    summary={item.get('summary')}
                                    url={item.get('url')}
                                    iconUrl={iconUrl}
                                    cardData={item.get('cardData').toJS()}
                                    isTopResult={offset === 0 && i === 0}
                                    archived={archivedFolders?.indexOf(item.get('container')) > -1}
                                />
                            </div>
                        ))}
                </div>
            )}
            {!loading && !error && !hasData && empty}
        </div>
    );
});
