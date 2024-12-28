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
import React, { FC } from 'react';

import { GridColumn } from '../base/models/GridColumn';
import { Grid } from '../base/Grid';

import { DomainDesign } from './models';

export const DOMAIN_FIELD_COLS = [
    new GridColumn({ index: 'name', title: 'Name' }),
    new GridColumn({ index: 'label', title: 'Label' }),
    new GridColumn({ index: 'rangeURI', title: 'Range URI' }),
    new GridColumn({ index: 'conceptURI', title: 'Concept URI' }),
    new GridColumn({ index: 'required', title: 'Required' }),
    new GridColumn({ index: 'scale', title: 'Scale' }),
];

type Props = {
    domain: DomainDesign;
    title?: string;
};

export const DomainFieldsDisplay: FC<Props> = ({ domain, title }) => (
    <div className="panel panel-default">
        <div className="panel-heading">
            <div className="panel-title">{title || domain.name}</div>
        </div>
        <div className="panel-body">
            <p>{domain.description}</p>
            <Grid columns={DOMAIN_FIELD_COLS} data={domain.fields} />
        </div>
    </div>
);
DomainFieldsDisplay.displayName = 'DomainFieldsDisplay';
