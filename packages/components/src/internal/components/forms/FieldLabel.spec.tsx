/*
 * Copyright (c) 2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React from 'react';
import renderer from 'react-test-renderer';
import { mount, shallow } from 'enzyme';

import { QueryColumn } from '../../../public/QueryColumn';

import { FieldLabel } from './FieldLabel';
import { LabelOverlay } from './LabelOverlay';
import { ToggleWithInputField } from './input/ToggleWithInputField';

const queryColumn = QueryColumn.create({
    name: 'testColumn',
    caption: 'test Column',
});

describe('FieldLabel', () => {
    test("don't show label", () => {
        const tree = renderer.create(<FieldLabel showLabel={false} label="Label" />);
        expect(tree === null);
    });

    test('without overlay, with label', () => {
        const label = <span className="label-span">This is the label</span>;
        const wrapper = shallow(<FieldLabel withLabelOverlay={false} label={label} />);
        expect(wrapper.find('span.label-span')).toHaveLength(1);
        expect(wrapper.find(LabelOverlay)).toHaveLength(0);
    });

    test('without overlay, with column', () => {
        const wrapper = shallow(<FieldLabel withLabelOverlay={false} column={queryColumn} />);
        expect(wrapper.text()).toContain(queryColumn.caption);
        expect(wrapper.find(LabelOverlay)).toHaveLength(0);
    });

    test('with overlay, with label', () => {
        const label = <span className="label-span">This is the label</span>;
        const wrapper = shallow(<FieldLabel labelOverlayProps={label} />);
        expect(wrapper.find(LabelOverlay)).toHaveLength(1);
    });

    test('with overlay, with column', () => {
        const wrapper = mount(<FieldLabel column={queryColumn} />);
        expect(wrapper.text()).toContain(queryColumn.caption);
        expect(wrapper.find(LabelOverlay)).toHaveLength(1);
    });

    function verifyToggle(wrapper, className?: string, wrapperClassName?: string) {
        expect(wrapper.find(ToggleWithInputField)).toHaveLength(1);

        expect(wrapper.find(ToggleWithInputField).prop('className')).toEqual(className ?? 'control-label-toggle-input');
        if (wrapperClassName)
            expect(wrapper.find(ToggleWithInputField).prop('containerClassName')).toEqual(wrapperClassName);
        else expect(wrapper.find(ToggleWithInputField).prop('containerClassName')).toBeUndefined();
    }

    test('showToggle', () => {
        const wrapper = shallow(<FieldLabel column={queryColumn} showToggle />);
        verifyToggle(wrapper);
    });

    test('showToggle, with labelOverlayProps, not formsy', () => {
        const label = 'This is the label';
        const props = {
            label,
            isFormsy: false,
        };
        const wrapper = shallow(<FieldLabel column={queryColumn} showToggle labelOverlayProps={props} />);
        verifyToggle(wrapper, 'control-label-toggle-input control-label-toggle-input-size-fixed', 'col-xs-1');
    });

    test('showToggle, with labelOverlayProps, formsy', () => {
        const label = 'This is the label';
        const props = {
            label,
            isFormsy: true,
        };
        const wrapper = shallow(<FieldLabel column={queryColumn} showToggle labelOverlayProps={props} />);
        verifyToggle(wrapper);
    });

    test('showToggle, with labelOverlayProps, formsy, with toggleClassName', () => {
        const label = 'This is the label';
        const props = {
            label,
            isFormsy: true,
        };
        const wrapper = shallow(
            <FieldLabel column={queryColumn} showToggle labelOverlayProps={props} toggleClassName="toggle-wrapper" />
        );
        verifyToggle(wrapper, 'toggle-wrapper');
    });

    test('showToggle, with labelOverlayProps, not formsy, with toggleClassName', () => {
        const label = 'This is the label';
        const props = {
            label,
            isFormsy: false,
        };
        const wrapper = shallow(
            <FieldLabel column={queryColumn} showToggle labelOverlayProps={props} toggleClassName="toggle-wrapper" />
        );
        verifyToggle(wrapper, 'toggle-wrapper', 'col-xs-1');
    });

    // TODO these tests fail with: TypeError: Cannot read property 'style' of null
    // This is somewhere inside the ReactBootstrapToggle element.
    // test("without overlay, allow disable", () => {
    //     const wrapper = renderer.create(
    //         <Formsy>
    //             <FieldLabel allowDisable={true} withLabelOverlay={false} column={queryColumn}/>
    //         </Formsy>).toJSON();
    //     // expect(wrapper.find(LabelOverlay)).toHaveLength(1);
    // });
    //
    // test("with overlay, allow disable", () => {
    //
    // });
});
