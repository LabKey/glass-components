import React from 'react';
import { Col, NavItem } from 'react-bootstrap';
import { mount, ReactWrapper } from 'enzyme';
import { Filter } from '@labkey/api';

import { QueryInfo } from '../../../public/QueryInfo';
import { ChoicesListItem } from '../base/ChoicesListItem';
import sampleSetAllFieldTypesQueryInfo from '../../../test/data/sampleSetAllFieldTypes-getQueryDetails.json';
import { FilterExpressionView } from './FilterExpressionView';
import { FilterFacetedSelector } from './FilterFacetedSelector';
import { QueryFilterPanel } from './QueryFilterPanel';
import { FieldFilter } from './models';

import { waitForLifecycle } from '../../testHelpers';
import { getTestAPIWrapper } from '../../APIWrapper';

describe('QueryFilterPanel', () => {
    const DEFAULT_PROPS = {
        api: getTestAPIWrapper(jest.fn, {}),
        filters: {},
        queryInfo: QueryInfo.fromJSON(sampleSetAllFieldTypesQueryInfo, true),
        onFilterUpdate: jest.fn,
    };

    function validate(
        wrapper: ReactWrapper,
        fieldItems: number,
        showFilterExpression = false,
        showChooseValues = false
    ): void {
        expect(wrapper.find('.filter-modal__col_fields').hostNodes()).toHaveLength(1);
        expect(wrapper.find('.filter-modal__col_filter_exp').hostNodes()).toHaveLength(1);
        expect(wrapper.find(ChoicesListItem)).toHaveLength(fieldItems);
        expect(wrapper.find(FilterExpressionView)).toHaveLength(showFilterExpression ? 1 : 0);
        expect(wrapper.find(FilterFacetedSelector)).toHaveLength(showChooseValues ? 1 : 0);
    }

    test('default props', () => {
        const wrapper = mount(<QueryFilterPanel {...DEFAULT_PROPS} />);
        validate(wrapper, 10);
        expect(wrapper.find('.filter-modal__container')).toHaveLength(0);
        wrapper.unmount();
    });

    test('skipDefaultViewCheck', () => {
        const wrapper = mount(<QueryFilterPanel {...DEFAULT_PROPS} skipDefaultViewCheck />);
        validate(wrapper, 28);
        wrapper.unmount();
    });

    test('asRow', () => {
        const wrapper = mount(<QueryFilterPanel {...DEFAULT_PROPS} asRow />);
        validate(wrapper, 10);
        expect(wrapper.find('.filter-modal__container').hostNodes()).toHaveLength(1);
        wrapper.unmount();
    });

    test('no queryName emptyMsg', () => {
        const wrapper = mount(<QueryFilterPanel {...DEFAULT_PROPS} queryInfo={undefined} emptyMsg="Select a query" />);
        validate(wrapper, 0);
        expect(wrapper.find('.filter-modal__empty-msg').hostNodes()).toHaveLength(1);
        expect(wrapper.find('.filter-modal__empty-msg').hostNodes().text()).toBe('Select a query');
        wrapper.unmount();
    });

    test('fullWidth', async () => {
        const wrapper = mount(<QueryFilterPanel {...DEFAULT_PROPS} />);
        validate(wrapper, 10);
        expect(wrapper.find(Col)).toHaveLength(2);
        expect(wrapper.find(Col).first().prop('sm')).toBe(3);
        expect(wrapper.find(Col).last().prop('sm')).toBe(6);
        wrapper.setProps({ fullWidth: true });
        await waitForLifecycle(wrapper);
        expect(wrapper.find(Col).first().prop('sm')).toBe(4);
        expect(wrapper.find(Col).last().prop('sm')).toBe(8);
        wrapper.unmount();
    });

    test('viewName', () => {
        const wrapper = mount(<QueryFilterPanel {...DEFAULT_PROPS} viewName="testview" />);
        validate(wrapper, 2);
        wrapper.unmount();
    });

    test('validFilterField', () => {
        const wrapper = mount(
            <QueryFilterPanel {...DEFAULT_PROPS} validFilterField={(field, queryInfo) => field.jsonType === 'string'} />
        );
        validate(wrapper, 6);
        wrapper.unmount();
    });

    test('with text activeField', () => {
        const wrapper = mount(<QueryFilterPanel {...DEFAULT_PROPS} fieldKey="Text" />);
        validate(wrapper, 10, false, true);
        expect(wrapper.find('.list-group-item.active').text()).toBe('Text');
        expect(wrapper.find('.filter-modal__col-sub-title').first().text()).toBe('Find values for Text');
        expect(wrapper.find('.filter-modal__empty-msg').hostNodes()).toHaveLength(0);
        expect(wrapper.find(NavItem)).toHaveLength(2);
        expect(wrapper.find('#filter-field-tabs').first().prop('activeKey')).toBe('ChooseValues');
        expect(wrapper.find('.filter-modal__field_dot')).toHaveLength(0);
        wrapper.unmount();
    });

    test('with non-text activeField', () => {
        const wrapper = mount(<QueryFilterPanel {...DEFAULT_PROPS} fieldKey="Integer" />);
        validate(wrapper, 10, true, false);
        expect(wrapper.find('.list-group-item.active').text()).toBe('Integer');
        expect(wrapper.find('.filter-modal__col-sub-title').text()).toBe('Find values for Integer');
        expect(wrapper.find('.filter-modal__empty-msg').hostNodes()).toHaveLength(0);
        expect(wrapper.find(NavItem)).toHaveLength(1);
        expect(wrapper.find('#filter-field-tabs').first().prop('activeKey')).toBe('Filter');
        wrapper.unmount();
    });

    test('text activeField with non-equal filter', () => {
        const wrapper = mount(
            <QueryFilterPanel
                {...DEFAULT_PROPS}
                fieldKey="Text"
                filters={{
                    [DEFAULT_PROPS.queryInfo.name.toLowerCase()]: [
                        {
                            fieldKey: 'Text',
                            filter: Filter.create('Text', 'a', Filter.Types.GREATER_THAN),
                        } as FieldFilter,
                    ],
                }}
            />
        );
        validate(wrapper, 10, true, false);
        expect(wrapper.find('.list-group-item.active').text()).toBe('Text');
        expect(wrapper.find('.filter-modal__col-sub-title').first().text()).toBe('Find values for Text');
        expect(wrapper.find('.filter-modal__empty-msg').hostNodes()).toHaveLength(0);
        expect(wrapper.find(NavItem)).toHaveLength(2);
        expect(wrapper.find('#filter-field-tabs').first().prop('activeKey')).toBe('Filter');
        expect(wrapper.find('.filter-modal__field_dot')).toHaveLength(1);
        wrapper.unmount();
    });
});
