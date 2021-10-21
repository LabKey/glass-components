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
import Formsy from 'formsy-react';

import { QueryFormInputs, SampleOperation } from '../../..';

import { AssayPropertiesPanelProps } from './models';

export const BatchPropertiesPanel: FC<AssayPropertiesPanelProps> = memo(props => {
    const { model, onChange, title = 'Batch Details', showQuerySelectPreviewOptions } = props;

    if (model.batchColumns.size === 0) {
        return null;
    }

    const disabled = model.batchId !== undefined;

    return (
        <div className="panel panel-default">
            <div className="panel-heading">{title}</div>

            <div className="panel-body">
                <Formsy className="form-horizontal" onChange={onChange} disabled={disabled}>
                    <QueryFormInputs
                        fieldValues={model.batchProperties.toObject()}
                        queryColumns={model.batchColumns}
                        renderFileInputs
                        showQuerySelectPreviewOptions={showQuerySelectPreviewOptions}
                        sampleOperation={SampleOperation.AddAssayData}
                    />
                </Formsy>
            </div>
        </div>
    );
});

BatchPropertiesPanel.displayName = 'BatchPropertiesPanel';
