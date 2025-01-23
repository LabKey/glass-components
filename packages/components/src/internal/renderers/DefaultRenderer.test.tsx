import React from 'react';
import { render } from '@testing-library/react';
import { fromJS, List } from 'immutable';

import { DefaultRenderer } from './DefaultRenderer';
import { ProductFeature } from '../app/constants';
import { TEST_LKS_STARTER_MODULE_CONTEXT, TEST_LKSM_STARTER_MODULE_CONTEXT } from '../productFixtures';

describe('DefaultRenderer', () => {
    test('undefined', () => {
        const component = <DefaultRenderer data={undefined} />;
        const { container } = render(component);
        expect(container).toMatchSnapshot();
    });

    test('string', () => {
        const component = <DefaultRenderer data="test string" />;
        const { container } = render(component);
        expect(container).toMatchSnapshot();
    });

    test('boolean', () => {
        const component = <DefaultRenderer data={true} />;
        const { container } = render(component);
        expect(container).toMatchSnapshot();
    });

    test('list', () => {
        const component = <DefaultRenderer data={List.of('a', 'b')} />;
        const { container } = render(component);
        expect(container).toMatchSnapshot();
    });

    test('value', () => {
        const component = <DefaultRenderer data={fromJS({ value: 1 })} />;
        const { container } = render(component);
        expect(container).toMatchSnapshot();
    });

    test('displayValue', () => {
        const component = <DefaultRenderer data={fromJS({ value: 1, displayValue: 'Value 1' })} />;
        const { container } = render(component);
        expect(container).toMatchSnapshot();
    });

    test('formattedValue', () => {
        const component = (
            <DefaultRenderer data={fromJS({ value: 1, displayValue: 'Value 1', formattedValue: 'Value 1.00' })} />
        );
        const { container } = render(component);
        expect(container).toMatchSnapshot();
    });

    test('url', () => {
        const component = <DefaultRenderer data={fromJS({ value: 1, displayValue: 'Value 1', url: 'labkey.com' })} />;
        const { container } = render(component);
        expect(container).toMatchSnapshot();
    });

    test('url, but noLink', () => {
        const component = (
            <DefaultRenderer noLink data={fromJS({ value: 1, displayValue: 'Value 1', url: 'labkey.com' })} />
        );
        const { container } = render(component);
        expect(container).toMatchSnapshot();
    });

    test('new line', () => {
        const component = <DefaultRenderer data={'test1\ntest2'} />;
        const { container } = render(component);
        expect(container).toMatchSnapshot();
    });

    test('with style, conditional formatting enabled', () => {
        LABKEY.moduleContext = { ...TEST_LKS_STARTER_MODULE_CONTEXT };
        const component = (
            <DefaultRenderer
                data={fromJS({
                    value: 1,
                    displayValue: 'Value 1',
                    formattedValue: 'Value 1.00',
                    style: ';background-color: blue',
                })}
            />
        );
        const { container } = render(component);
        expect(container).toMatchSnapshot();
    });

    test('with style, conditional formatting not enabled', () => {
        LABKEY.moduleContext = { ...TEST_LKSM_STARTER_MODULE_CONTEXT };
        const component = (
            <DefaultRenderer
                data={fromJS({
                    value: 1,
                    displayValue: 'Value 1',
                    formattedValue: 'Value 1.00',
                    style: ';background-color: blue',
                })}
            />
        );
        const { container } = render(component);
        expect(container).toMatchSnapshot();
    });
});
