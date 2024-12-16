import React from 'react';

import { render } from '@testing-library/react';

import { LKS_PRODUCT_ID } from '../../app/constants';

import { getSelectedProduct, ProductNavigationMenuImpl } from './ProductNavigationMenu';
import { ProductModel } from './models';

const TEST_PRODUCTS = [
    new ProductModel({ productId: 'a', productName: 'A', moduleName: 'modA' }),
    new ProductModel({ productId: 'b', productName: 'B', moduleName: 'modB' }),
    new ProductModel({ productId: 'c', productName: 'C', moduleName: 'modC' }),
];

const DEFAULT_PROPS = {
    error: undefined,
    products: TEST_PRODUCTS,
    disableLKSContainerLink: false,
    homeVisible: true,
    menuRef: undefined,
    onSelection: jest.fn,
    selectedProductId: undefined,
    selectedProject: undefined,
    tabs: [],
};

describe('ProductNavigationMenu', () => {
    function validate(rendered = true, wide = false, componentCounts?: Record<string, number>) {
        const count = rendered ? 1 : 0;
        expect(document.querySelectorAll('.product-navigation-listing')).toHaveLength(count);
        expect(document.querySelectorAll('.wider')).toHaveLength(wide ? 1 : 0);

        expect(document.querySelectorAll('.product-icon')).toHaveLength(componentCounts?.ProductAppsDrawer ?? 0); // ProductAppsDrawer
        expect(document.querySelectorAll('.container-item')).toHaveLength(componentCounts?.ProductLKSDrawer ?? 0); // ProductLKSDrawer
        expect(document.querySelectorAll('.menu-transition-left')).toHaveLength(
            componentCounts?.ProductSectionsDrawer ?? 0
        ); // ProductSectionsDrawer
    }

    test('error', () => {
        render(<ProductNavigationMenuImpl {...DEFAULT_PROPS} error="Test error" />);
        validate(false, true);
        expect(document.querySelector('.alert').textContent).toBe('Test error');
    });

    test('loading undefined products', () => {
        render(<ProductNavigationMenuImpl {...DEFAULT_PROPS} products={undefined} />);
        validate(false, true);
        expect(document.querySelectorAll('.fa-spinner')).toHaveLength(1);
    });

    test('loading undefined tabs', () => {
        render(<ProductNavigationMenuImpl {...DEFAULT_PROPS} tabs={undefined} />);
        validate(false, true);
        expect(document.querySelectorAll('.fa-spinner')).toHaveLength(1);
    });

    test('ProductNavigationHeader props', () => {
        render(<ProductNavigationMenuImpl {...DEFAULT_PROPS} selectedProductId="a" />);
        validate(true, false, { ProductSectionsDrawer: 1 });
        expect(document.querySelector('.header-title').textContent).toBe('A');
    });

    test('showProductDrawer', () => {
        render(<ProductNavigationMenuImpl {...DEFAULT_PROPS} selectedProductId={undefined} />);
        validate(true, true, { ProductAppsDrawer: 1 });
    });

    test('showLKSDrawer', () => {
        render(<ProductNavigationMenuImpl {...DEFAULT_PROPS} selectedProductId={LKS_PRODUCT_ID} />);
        validate(true, false, { ProductLKSDrawer: 2, ProductSectionsDrawer: 1 });
    });

    test('non-premium footer, no selectedProductId', () => {
        render(<ProductNavigationMenuImpl {...DEFAULT_PROPS} selectedProductId={undefined} />);
        expect(document.querySelectorAll('.product-navigation-footer')).toHaveLength(1);
        expect(document.querySelector('.product-navigation-footer').textContent).toBe('More LabKey Solutions');
    });

    test('non-premium footer, no selectedProductId, isRootAdmin', () => {
        LABKEY.user = {
            isRootAdmin: true,
        };
        render(<ProductNavigationMenuImpl {...DEFAULT_PROPS} selectedProductId={undefined} />);
        expect(document.querySelectorAll('.product-navigation-footer')).toHaveLength(1);
        expect(document.querySelector('.product-navigation-footer').textContent).toBe('More LabKey Solutions');
    });

    test('premium footer, root admin', () => {
        LABKEY.moduleContext = {
            api: {
                moduleNames: ['samplemanagement', 'study', 'premium'],
            },
        };
        LABKEY.user = {
            isRootAdmin: true,
        };
        render(<ProductNavigationMenuImpl {...DEFAULT_PROPS} selectedProductId={undefined} />);
        const footer = document.querySelectorAll('.product-navigation-footer');
        expect(footer).toHaveLength(1);
        const links = footer[0].querySelectorAll('a');
        expect(links).toHaveLength(2);
        expect(links[0].textContent).toBe('Menu Settings');
        expect(links[1].textContent).toBe('More LabKey Solutions');
    });

    test('premium footer, not root admin', () => {
        LABKEY.moduleContext = {
            api: {
                moduleNames: ['samplemanagement', 'study', 'premium'],
            },
        };
        LABKEY.user = {
            isRootAdmin: false,
        };

        render(<ProductNavigationMenuImpl {...DEFAULT_PROPS} selectedProductId={undefined} />);
        const footer = document.querySelectorAll('.product-navigation-footer');
        expect(footer).toHaveLength(1);
        const links = footer[0].querySelectorAll('a');
        expect(links).toHaveLength(1);
        expect(links[0].textContent).toBe('More LabKey Solutions');
    });

    test('premium footer, not admin', () => {
        LABKEY.moduleContext = {
            api: {
                moduleNames: ['samplemanagement', 'study', 'premium'],
            },
        };
        LABKEY.user = {
            isAdmin: false,
        };

        render(<ProductNavigationMenuImpl {...DEFAULT_PROPS} selectedProductId={undefined} />);
        const footer = document.querySelectorAll('.product-navigation-footer');
        expect(footer).toHaveLength(1);
        const links = footer[0].querySelectorAll('a');
        expect(links).toHaveLength(1);
        expect(links[0].textContent).toBe('More LabKey Solutions');
    });

    test('getSelectedProduct', () => {
        expect(getSelectedProduct(TEST_PRODUCTS, 'a')).toBe(TEST_PRODUCTS[0]);
        expect(getSelectedProduct(TEST_PRODUCTS, 'b')).toBe(TEST_PRODUCTS[1]);
        expect(getSelectedProduct(TEST_PRODUCTS, 'c')).toBe(TEST_PRODUCTS[2]);
        expect(getSelectedProduct(TEST_PRODUCTS, 'd')).toBe(undefined);
        expect(getSelectedProduct(TEST_PRODUCTS, undefined)).toBe(undefined);
        expect(getSelectedProduct(undefined, 'a')).toBe(undefined);
        expect(getSelectedProduct([], 'a')).toBe(undefined);
    });
});
