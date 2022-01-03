import React from 'react';

import { mount } from 'enzyme';
import { MenuItem } from 'react-bootstrap';

import { EXPERIMENTAL_SAMPLE_FINDER } from '../../app/constants';

import { FindAndSearchDropdown } from './FindAndSearchDropdown';

describe('FindAndSearchDropdown', () => {
    const { location } = window;

    beforeAll(() => {
        delete window.location;
    });

    afterAll(() => {
        window.location = location;
    });

    test('search but no find', () => {
        const wrapper = mount(<FindAndSearchDropdown title="Test title" onSearch={jest.fn} />);
        expect(wrapper.find('DropdownToggle').text().trim()).toBe('Test title');
        const items = wrapper.find(MenuItem);
        expect(items).toHaveLength(1);
        expect(items.at(0).text().trim()).toBe('Search');
        expect(wrapper.find('Modal')).toHaveLength(0);
    });

    test('find but no search', () => {
        const wrapper = mount(
            <FindAndSearchDropdown title="Test title" findNounPlural="tests" onFindByIds={jest.fn} />
        );
        const items = wrapper.find(MenuItem);
        expect(items).toHaveLength(2);
        expect(items.at(0).text().trim()).toBe('Find Tests by Barcode');
        expect(items.at(1).text().trim()).toBe('Find Tests by ID');
    });

    test('with sample finder', () => {
        window.location = Object.assign(
            { ...location },
            {
                pathname: 'labkey/Sam Man/samplemanager-app.view#',
            }
        );
        LABKEY.moduleContext = {
            api: {
                moduleNames: ['samplemanagement', 'study', 'premium'],
            },
            samplemanagement: {
                [EXPERIMENTAL_SAMPLE_FINDER]: true,
            },
        };
        const wrapper = mount(
            <FindAndSearchDropdown title="Test title" findNounPlural="tests" onFindByIds={jest.fn} />
        );
        const items = wrapper.find(MenuItem);
        expect(items).toHaveLength(3);
        expect(items.at(2).text().trim()).toBe('Sample Finder');
    });
});
