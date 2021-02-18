import React from 'react';
import { mount, ReactWrapper } from 'enzyme';

import { ProductClickableItem } from './ProductClickableItem';

const DEFAULT_PROPS = {
    id: 'test-id',
    onClick: jest.fn,
};

describe('ProductClickableItem', () => {
    function validate(wrapper: ReactWrapper) {
        expect(wrapper.find('.clickable-item')).toHaveLength(1);
    }

    test('with child comp', () => {
        const wrapper = mount(
            <ProductClickableItem {...DEFAULT_PROPS}>
                <div className="child-comp" />
            </ProductClickableItem>
        );
        validate(wrapper);
        expect(wrapper.find('.child-comp')).toHaveLength(1);
        wrapper.unmount();
    });

    test('hovered', () => {
        const wrapper = mount(<ProductClickableItem {...DEFAULT_PROPS} />);
        validate(wrapper);
        expect(wrapper.find('div').prop('className')).not.toContain('labkey-page-nav');

        wrapper.find('div').simulate('mouseenter');
        expect(wrapper.find('div').prop('className')).toContain('labkey-page-nav');

        wrapper.find('div').simulate('mouseleave');
        expect(wrapper.find('div').prop('className')).not.toContain('labkey-page-nav');

        wrapper.unmount();
    });
});
