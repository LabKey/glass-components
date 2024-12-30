import React from 'react';

import { render } from '@testing-library/react';

import { AppURL } from '../../url/AppURL';

import { Breadcrumb } from './Breadcrumb';

describe('Breadcrumb', () => {
    test('empty render', () => {
        render(<Breadcrumb />);
        expect(document.querySelectorAll('.breadcrumb')).toHaveLength(0);
        expect(document.querySelectorAll('li')).toHaveLength(0);
        expect(document.querySelectorAll('a')).toHaveLength(0);
    });

    test('null render', () => {
        render(<Breadcrumb>null</Breadcrumb>);
        expect(document.querySelectorAll('.breadcrumb')).toHaveLength(1);
        expect(document.querySelectorAll('li')).toHaveLength(1);
        expect(document.querySelectorAll('a')).toHaveLength(0);
    });

    test('with links', () => {
        render(
            <Breadcrumb>
                <a href={AppURL.create('q').toString()}>First</a>
                <a href={AppURL.create('q', 'two').toString()}>Second</a>
                {false && <a href={AppURL.create('q', 'two', 'three').toString()}>Third</a>}
                <a href={AppURL.create('q', 'two', 'three', 'four').toString()}>Fourth</a>
            </Breadcrumb>
        );

        expect(document.querySelectorAll('ol.breadcrumb')).toHaveLength(1);

        const links = document.querySelectorAll('a');
        expect(links).toHaveLength(3);
        expect(links[0].textContent).toEqual('First');
        expect(links[1].textContent).toEqual('Second');
        expect(links[2].textContent).toEqual('Fourth');
    });

    test('with className prop', () => {
        render(
            <Breadcrumb className="anotherclass">
                <a href={AppURL.create('q').toString()}>First</a>
            </Breadcrumb>
        );
        expect(document.querySelector('ol').getAttribute('class')).toBe('breadcrumb anotherclass');
    });
});
