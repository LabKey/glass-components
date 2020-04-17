/*
 * Copyright (c) 2020 LabKey Corporation
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

import {DatasetModel} from "./models";
import {NEW_DATASET_MODEL} from "../../../test/data/constants";
import getDatasetDesign from "../../../test/data/dataset-getDatasetDesign.json";
import {DatasetDesignerPanels} from "./DatasetDesignerPanels";
import renderer from "react-test-renderer";
import React from "react";
import {mount} from "enzyme";
import toJson from "enzyme-to-json";

describe("Dataset Designer", () => {

    const newDatasetModel = DatasetModel.create(NEW_DATASET_MODEL, undefined);
    const populatedDatasetModel = DatasetModel.create(null, getDatasetDesign);

    test("New dataset", () => {
        const designerPanel =
            <DatasetDesignerPanels
                initModel={newDatasetModel}
                useTheme={true}
                onCancel={jest.fn()}
                onComplete={jest.fn()}
            />;

        const dom = renderer.create(designerPanel).toJSON();
        expect(dom).toMatchSnapshot();
    });

    test("Edit existing dataset", () => {
        const designerPanels = mount(
            <DatasetDesignerPanels
                initModel={populatedDatasetModel}
                useTheme={true}
                onCancel={jest.fn()}
                onComplete={jest.fn()}
            />
        );

        expect(toJson(designerPanels)).toMatchSnapshot();
        designerPanels.unmount();
    })

    // TODO: testCase for testing the alert / error message similar to DataClassDesigner.spec.tsx
});
