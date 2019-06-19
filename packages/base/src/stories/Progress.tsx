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
import * as React from "react";
import { storiesOf } from "@storybook/react";
import { boolean, number, text, withKnobs } from '@storybook/addon-knobs'

import { Progress } from "../components/Progress";

storiesOf("Progress", module)
    .addDecorator(withKnobs)
    .add("default properties", () => {
        return <Progress toggle={boolean("Toggle progress", false)}/>
    })
    .add("with knobs", () => {
        return <Progress
            toggle={boolean("Toggle progress", false)}
            delay={number("Delay in ms", 350)}
            estimate={number("Estimate in ms", 1000)}
            modal={boolean('Modal?', false)}
            title={text("Title", "Progress")}
            updateIncrement={number("Update increment in ms", 50)}
            />
    });