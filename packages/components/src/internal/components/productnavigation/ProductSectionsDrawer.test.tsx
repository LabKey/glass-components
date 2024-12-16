import React from 'react';
import { List } from 'immutable';

import { render } from '@testing-library/react';

import { FREEZERS_KEY, MEDIA_KEY, NOTEBOOKS_KEY, WORKFLOW_KEY } from '../../app/constants';

import { Container } from '../base/models/Container';

import { MenuSectionModel } from '../navigation/model';

import {
    getProductSectionUrl,
    parseProductMenuSectionResponse,
    ProductSectionsDrawerImpl,
} from './ProductSectionsDrawer';
import { ProductModel, ProductSectionModel } from './models';

const TEST_SECTIONS = [
    new ProductSectionModel({ key: 'a', label: 'A', url: 'http://sectionA' }),
    new ProductSectionModel({ key: 'b', label: 'B', url: 'http://sectionB' }),
    new ProductSectionModel({ key: 'c', label: 'C', url: 'http://sectionC' }),
];

const TEST_PRODUCT = new ProductModel({ productId: 'a', productName: 'A' });
const TEST_PROJECT = new Container({ id: '1', path: '/test' });

const DEFAULT_PROPS = {
    error: undefined,
    sections: [],
    product: TEST_PRODUCT,
};

describe('ProductSectionsDrawer', () => {
    function validate(count: number, hasError = false) {
        expect(document.querySelectorAll('.menu-transition-left')).toHaveLength(!hasError ? 1 : 0);
        expect(document.querySelectorAll('.clickable-item')).toHaveLength(count);
        expect(document.querySelectorAll('.alert')).toHaveLength(hasError ? 1 : 0);
    }

    test('error', () => {
        render(<ProductSectionsDrawerImpl {...DEFAULT_PROPS} error="Test error" />);
        validate(0, true);
        expect(document.querySelector('.alert').textContent).toBe('Test error');
    });

    test('with sections', () => {
        render(<ProductSectionsDrawerImpl {...DEFAULT_PROPS} sections={TEST_SECTIONS} />);
        validate(TEST_SECTIONS.length, false);
        TEST_SECTIONS.forEach((section, index) => {
            const item = document.querySelectorAll('.clickable-item')[index];
            expect(item.textContent).toBe(section.label);
        });
    });

    test('getProductSectionUrl', () => {
        expect(getProductSectionUrl('id', 'key', '/test')).toBe('/labkey/id/test/app.view#/key');

        // note ActionURL.getController() is '' for this jest test
        expect(getProductSectionUrl('', 'key', '/test')).toBe('#/key');
    });

    test('parseProductMenuSectionResponse, no modelSections', () => {
        const sections = parseProductMenuSectionResponse(List<MenuSectionModel>(), TEST_PRODUCT, TEST_PROJECT.path);
        expect(sections).toHaveLength(1);
        expect(sections[0].key).toBe('home');
        expect(sections[0].label).toBe('Dashboard');
        expect(sections[0].url).toBe('/labkey/a/test/app.view#/home');
    });

    test('parseProductMenuSectionResponse, with modelSections to skip', () => {
        const modelSections = List<MenuSectionModel>([
            new MenuSectionModel({ key: 's1', productId: 'a', label: 'S1' }),
            new MenuSectionModel({ key: 's2', productId: 'a', label: 'S2' }),
            new MenuSectionModel({ key: 'user', productId: 'a', label: 'User' }),
            new MenuSectionModel({ key: 'biologicsWorkflow', productId: 'a', label: 'Workflow' }),
            new MenuSectionModel({ key: 's3', productId: 'a', label: 'S3' }),
        ]);

        const sections = parseProductMenuSectionResponse(modelSections, TEST_PRODUCT, TEST_PROJECT.path);
        expect(sections).toHaveLength(4);
        expect(sections[0].key).toBe('home');
        expect(sections[1].key).toBe('s1');
        expect(sections[1].label).toBe('S1');
        expect(sections[1].url).toBe('/labkey/a/test/app.view#/s1');
        expect(sections[2].key).toBe('s2');
        expect(sections[2].label).toBe('S2');
        expect(sections[2].url).toBe('/labkey/a/test/app.view#/s2');
        expect(sections[3].key).toBe('s3');
        expect(sections[3].label).toBe('S3');
        expect(sections[3].url).toBe('/labkey/a/test/app.view#/s3');
    });

    test('parseProductMenuSectionResponse, LKSM sorting', () => {
        const modelSections = List<MenuSectionModel>([
            new MenuSectionModel({ key: 's1', productId: 'a', label: 'S1' }),
            new MenuSectionModel({ key: WORKFLOW_KEY, productId: 'a', label: 'Workflow' }),
            new MenuSectionModel({ key: FREEZERS_KEY, productId: 'a', label: 'Storage' }),
        ]);

        const sections = parseProductMenuSectionResponse(modelSections, TEST_PRODUCT, TEST_PROJECT.path);
        expect(sections).toHaveLength(4);
        expect(sections[0].key).toBe('home');
        expect(sections[1].key).toBe('s1');
        expect(sections[2].key).toBe(FREEZERS_KEY);
        expect(sections[3].key).toBe(WORKFLOW_KEY);
    });

    test('parseProductMenuSectionResponse, LKB sorting', () => {
        const modelSections = List<MenuSectionModel>([
            new MenuSectionModel({ key: 's1', productId: 'a', label: 'S1' }),
            new MenuSectionModel({ key: WORKFLOW_KEY, productId: 'a', label: 'Workflow' }),
            new MenuSectionModel({ key: MEDIA_KEY, productId: 'a', label: 'Media' }),
            new MenuSectionModel({ key: NOTEBOOKS_KEY, productId: 'a', label: 'Notebooks' }),
            new MenuSectionModel({ key: FREEZERS_KEY, productId: 'a', label: 'Storage' }),
        ]);

        const sections = parseProductMenuSectionResponse(modelSections, TEST_PRODUCT, TEST_PROJECT.path);
        expect(sections).toHaveLength(6);
        expect(sections[0].key).toBe('home');
        expect(sections[1].key).toBe('s1');
        expect(sections[2].key).toBe(FREEZERS_KEY);
        expect(sections[3].key).toBe(WORKFLOW_KEY);
        expect(sections[4].key).toBe(MEDIA_KEY);
        expect(sections[5].key).toBe(NOTEBOOKS_KEY);
    });
});
