import React from 'react';

import { render } from '@testing-library/react';

import { userEvent } from '@testing-library/user-event';

import { ProductAppMenuItem } from './ProductAppMenuItem';

const DEFAULT_PROPS = {
    iconUrl: 'icon-url-test',
    title: 'Test title',
    subtitle: 'Test subtitle',
    onClick: jest.fn,
};

describe('ProductAppMenuItem', () => {
    function validate() {
        expect(document.querySelectorAll('.product-icon')).toHaveLength(1);
        expect(document.querySelectorAll('img')).toHaveLength(2);
        expect(document.querySelectorAll('.nav-icon')).toHaveLength(1);
        expect(document.querySelectorAll('.fa-chevron-right')).toHaveLength(1);
    }

    test('default props', () => {
        render(<ProductAppMenuItem {...DEFAULT_PROPS} />);
        validate();
        expect(document.querySelector('li').getAttribute('class')).toBe('');
        expect(document.querySelectorAll('img')).toHaveLength(2);
        expect(document.querySelectorAll('img')[0].getAttribute('src')).toBe('icon-url-test');
        expect(document.querySelectorAll('img')[1].getAttribute('src')).toBe('icon-url-test');
    });

    test('no subtitle', () => {
        render(<ProductAppMenuItem {...DEFAULT_PROPS} subtitle={undefined} />);
        validate();
        expect(document.querySelector('.product-title').textContent).toBe(DEFAULT_PROPS.title);
        expect(document.querySelectorAll('.no-subtitle')).toHaveLength(1);
    });

    test('iconUrlAlt', () => {
        render(<ProductAppMenuItem {...DEFAULT_PROPS} iconUrlAlt="icon-url-alt-test" />);
        validate();
        expect(document.querySelectorAll('img')).toHaveLength(2);
        expect(document.querySelectorAll('img')[0].getAttribute('src')).toBe('icon-url-test');
        expect(document.querySelectorAll('img')[1].getAttribute('src')).toBe('icon-url-alt-test');
    });

    test('hovered', async () => {
        render(<ProductAppMenuItem {...DEFAULT_PROPS} />);
        validate();
        expect(document.querySelector('li').getAttribute('class')).toBe('');

        await userEvent.hover(document.querySelector('li'));
        expect(document.querySelector('li').getAttribute('class')).toBe('labkey-page-nav');

        await userEvent.unhover(document.querySelector('li'));
        expect(document.querySelector('li').getAttribute('class')).toBe('');
    });
});
