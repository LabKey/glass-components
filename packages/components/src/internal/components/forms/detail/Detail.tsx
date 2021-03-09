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
import { List } from 'immutable';

import { LoadingSpinner, QueryColumn, QueryGridModel } from '../../../..';

import { DetailDisplay, DetailDisplaySharedProps } from './DetailDisplay';

interface DetailProps extends DetailDisplaySharedProps {
    editColumns?: List<QueryColumn>;
    queryColumns?: List<QueryColumn>;
    queryModel?: QueryGridModel;
}

export const Detail: FC<DetailProps> = memo(props => {
    const { editColumns, queryColumns, queryModel, ...detailDisplayProps } = props;

    if (!queryModel?.isLoaded) {
        return <LoadingSpinner />;
    }

    // This logic should be kept consistent with corollary logic in <DetailPanel/>
    let displayColumns: List<QueryColumn>;
    if (queryColumns) {
        displayColumns = queryColumns;
    } else {
        if (props.editingMode) {
            if (editColumns) {
                displayColumns = editColumns;
            } else {
                displayColumns = queryModel.getUpdateDisplayColumns();
            }
        } else {
            displayColumns = queryModel.getDetailsDisplayColumns();
        }
    }

    return <DetailDisplay {...detailDisplayProps} data={queryModel.getData()} displayColumns={displayColumns} />;
});
