import React from 'react';

import { render } from '@testing-library/react';

import { BIOLOGICS_APP_PROPERTIES, LIMS_APP_PROPERTIES, SAMPLE_MANAGER_APP_PROPERTIES } from '../../app/constants';

import { DEFAULT_ICON_ALT_URL, DEFAULT_ICON_URL, ProductAppsDrawer } from './ProductAppsDrawer';
import { ProductModel } from './models';
import {
    BIOLOGICS_ALT_PRODUCT_ICON,
    BIOLOGICS_PRODUCT_ICON,
    SAMPLE_MANAGER_ALT_PRODUCT_ICON,
    SAMPLE_MANAGER_PRODUCT_ICON,
} from './constants';

const DEFAULT_PROPS = {
    products: [],
    onClick: jest.fn,
};

describe('ProductAppsDrawer', () => {
    function validate(count: number): void {
        expect(document.querySelectorAll('.product-icon')).toHaveLength(count);

        const lksProduct = document.querySelectorAll('.product-icon')[0];
        expect(lksProduct.querySelectorAll('img')[0].getAttribute('src')).toBe(DEFAULT_ICON_URL);
        expect(lksProduct.querySelectorAll('img')[1].getAttribute('src')).toBe(DEFAULT_ICON_ALT_URL);
        expect(document.querySelectorAll('.product-title')[0].textContent).toBe('LabKey Server');
    }

    test('no additional products', () => {
        render(<ProductAppsDrawer {...DEFAULT_PROPS} />);
        validate(1);
        expect(document.querySelector('.product-subtitle').textContent).toBe('Root');
    });

    test('project title', () => {
        LABKEY.project.title = 'Test project title';
        render(<ProductAppsDrawer {...DEFAULT_PROPS} />);
        validate(1);
        expect(document.querySelector('.product-subtitle').textContent).toBe('Test project title');
    });

    test('iconUrl and iconUrlAlt, lkb', () => {
        LABKEY.moduleContext = {
            samplemanagement: {},
            biologics: {},
        };
        // create them after setting the module context to properly set the disabled flags
        const products = [
            new ProductModel({ productId: SAMPLE_MANAGER_APP_PROPERTIES.productId, productName: 'LKSM Name' }),
            new ProductModel({ productId: BIOLOGICS_APP_PROPERTIES.productId, productName: 'LKB Name' }),
            new ProductModel({ productId: LIMS_APP_PROPERTIES.productId, productName: 'LIMS Name' }),
            new ProductModel({ productId: 'other', productName: 'Other Name' }),
        ];
        render(<ProductAppsDrawer {...DEFAULT_PROPS} products={products} />);
        validate(2);

        const lksProduct = document.querySelectorAll('.product-icon')[1];
        expect(lksProduct.querySelectorAll('img')[0].getAttribute('src')).toBe(
            '/labkey/biologics/images/' + BIOLOGICS_PRODUCT_ICON
        );
        expect(lksProduct.querySelectorAll('img')[1].getAttribute('src')).toBe(
            '/labkey/biologics/images/' + BIOLOGICS_ALT_PRODUCT_ICON
        );
        expect(document.querySelectorAll('.product-title')[1].textContent).toBe(products[1].productName);
    });

    test('iconUrl, only sample manager', () => {
        LABKEY.moduleContext = {
            samplemanagement: {},
        };
        // create them after setting the module context to properly set the disabled flags
        const products = [
            new ProductModel({ productId: SAMPLE_MANAGER_APP_PROPERTIES.productId, productName: 'LKSM Name' }),
            new ProductModel({ productId: BIOLOGICS_APP_PROPERTIES.productId, productName: 'LKB Name' }),
            new ProductModel({ productId: 'other', productName: 'Other Name' }),
        ];
        render(<ProductAppsDrawer {...DEFAULT_PROPS} products={products} />);
        validate(2);

        const lksProduct = document.querySelectorAll('.product-icon')[1];
        expect(lksProduct.querySelectorAll('img')[0].getAttribute('src')).toBe(
            '/labkey/sampleManagement/images/' + SAMPLE_MANAGER_PRODUCT_ICON
        );
        expect(lksProduct.querySelectorAll('img')[1].getAttribute('src')).toBe(
            '/labkey/sampleManagement/images/' + SAMPLE_MANAGER_ALT_PRODUCT_ICON
        );
        expect(document.querySelectorAll('.product-title')[1].textContent).toBe(products[0].productName);
    });
});
