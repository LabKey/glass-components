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
import * as React from 'react';
import { List } from 'immutable'
import { storiesOf } from "@storybook/react";
import { boolean, number, text, withKnobs } from '@storybook/addon-knobs'

import { LineageGraph } from "../components/lineage/LineageGraph";
import './stories.scss'
import { LINEAGE_GROUPING_GENERATIONS, LineageFilter } from "..";

storiesOf('LineageGraph', module)
    .addDecorator(withKnobs)
    .add("with knobs", () => {
        return (
            <LineageGraph
                lsid={'urn:lsid:labkey.com:Sample.9273.ExpressionSystemSamples:ES-1.2'}
                grouping={{generations: LINEAGE_GROUPING_GENERATIONS.Specific}}
                filters={List([new LineageFilter('type', ['Sample', 'Data'])])}
                navigate={(node) => console.log(node)}
            />
        )
    });