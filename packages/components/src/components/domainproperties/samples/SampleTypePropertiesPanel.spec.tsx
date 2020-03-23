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
import React from 'react';
import renderer from 'react-test-renderer';
import { mount } from 'enzyme';
import {fromJS, Map} from 'immutable';
import { initUnitTestMocks } from "../../../testHelpers";
import { ENTITY_FORM_IDS } from "../entities/constants";
import { DomainDetails, DomainPanelStatus } from "../models";
import {SampleTypePropertiesPanel} from "./SampleTypePropertiesPanel";
import {SampleTypeModel} from "./models";

const BASE_PROPS = {
    panelStatus: 'NONE' as DomainPanelStatus,
    validate: false,
    useTheme: false,
    controlledCollapse: false,
    initCollapsed: false,
    collapsed: false
};

beforeAll(() => {
    initUnitTestMocks();
});

describe("<SampleTypePropertiesPanel/>", () => {

    test("default props", (done) => {
        const tree = renderer.create(
            <SampleTypePropertiesPanel
                {...BASE_PROPS}
                model={SampleTypeModel.create()}
                updateModel={jest.fn}
                onAddParentAlias={jest.fn}
                onRemoveParentAlias={jest.fn}
                onParentAliasChange={jest.fn}
                parentOptions={[]}
            />
        );

        setTimeout(() => {
            expect(tree.toJSON()).toMatchSnapshot();
            done();
        });
    });

    test("nameExpressionInfoUrl", (done) => {
        const tree = renderer.create(
            <SampleTypePropertiesPanel
                {...BASE_PROPS}
                model={SampleTypeModel.create()}
                updateModel={jest.fn}
                nameExpressionInfoUrl={'#anything'}
                onAddParentAlias={jest.fn}
                onRemoveParentAlias={jest.fn}
                onParentAliasChange={jest.fn}
                parentOptions={[]}
            />
        );

        setTimeout(() => {
            expect(tree.toJSON()).toMatchSnapshot();
            done();
        });
    });

    test("Load existing SampleTypeModel", () => {
        const nameExpVal = 'S-${genId}';
        const descVal = 'My sample set description.';
        const data = DomainDetails.create(fromJS({
            options: Map<string, any>({
                rowId: 1,
                nameExpression: nameExpVal,
                description: descVal,
            }),
            domainKindName: "SampleType",
        }));

        const component = (
            <SampleTypePropertiesPanel
                {...BASE_PROPS}
                model={SampleTypeModel.create(data)}
                updateModel={jest.fn}
                onAddParentAlias={jest.fn}
                onRemoveParentAlias={jest.fn}
                onParentAliasChange={jest.fn}
                parentOptions={[]}
            />
        );

        const wrapper = mount(component);

        // Name input should be visible but disabled
        expect(wrapper.find('input#' + ENTITY_FORM_IDS.NAME)).toHaveLength(1);
        expect(wrapper.find('input#' + ENTITY_FORM_IDS.NAME).prop('disabled')).toBeTruthy();

        // Check initial input values
        expect(wrapper.find('input#' + ENTITY_FORM_IDS.NAME_EXPRESSION).props().value).toBe(nameExpVal);
        expect(wrapper.find('textarea#' + ENTITY_FORM_IDS.DESCRIPTION).props().value).toBe(descVal);

        //Add parent alias button should be visible
        expect(wrapper.find('.container--addition-icon')).toHaveLength(1);

        wrapper.unmount();
    });

});
