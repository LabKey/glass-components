import React from 'react';
import { List } from 'immutable';

import { AppURL } from '../../url/AppURL';

import { SAMPLE_MANAGER_APP_PROPERTIES } from '../../app/constants';

import { TEST_PROJECT_CONTAINER } from '../../containerFixtures';

import { renderWithAppContext } from '../../test/reactTestLibraryHelpers';

import { ProductMenuSection } from './ProductMenuSection';
import { MenuSectionModel, MenuSectionConfig } from './model';

describe('ProductMenuSection', () => {
    const sampleSetItems = List<MenuSectionModel>([
        {
            id: 1,
            label: 'Sample Set 1',
        },
        {
            id: 2,
            label: 'Sample Set 2',
            hasActiveJob: true,
        },
        {
            id: 3,
            label: 'Sample Set 3',
        },
        {
            id: 4,
            label: 'Sample Set 4',
        },
    ]);

    const sampleSetItemsAllHidden = List<MenuSectionModel>([
        {
            id: 1,
            label: 'Sample Set 1',
            hidden: true,
        },
        {
            id: 2,
            label: 'Sample Set 2',
            hasActiveJob: true,
            hidden: true,
        },
    ]);

    const sampleSetItemsSomeHidden = List<MenuSectionModel>([
        {
            id: 1,
            label: 'Sample Set 1',
        },
        {
            id: 2,
            label: 'Sample Set 2',
            hasActiveJob: true,
            hidden: true,
        },
    ]);

    const assayItems = List<MenuSectionModel>([
        {
            id: 11,
            label: 'Assay 1',
        },
        {
            id: 12,
            label: 'Assay 2',
        },
        {
            id: 13,
            label: 'Assay 3',
        },
        {
            id: 14,
            label: 'Assay 4',
        },
        {
            id: 15,
            label: 'Assay 5',
        },
    ]);

    function getDefaultServerContext() {
        return {
            container: TEST_PROJECT_CONTAINER,
            moduleContext: {
                api: {
                    moduleNames: ['samplemanagement', 'premium'],
                },
                samplemanagement: { productId: SAMPLE_MANAGER_APP_PROPERTIES.productId },
            },
        };
    }

    test('empty section no text', () => {
        const section = MenuSectionModel.create({
            label: 'Sample Sets',
            items: List<MenuSectionModel>(),
            key: 'samples',
        });

        renderWithAppContext(
            <ProductMenuSection
                containerPath="/test/path"
                currentProductId="testProduct"
                section={section}
                config={
                    new MenuSectionConfig({
                        iconURL: '/testProduct/images/samples.svg',
                    })
                }
            />,
            { serverContext: getDefaultServerContext() }
        );

        expect(document.querySelectorAll('li').length).toBe(2); // header and hr
    });

    test('empty section with empty text and create link', () => {
        const config = new MenuSectionConfig({
            emptyText: 'Test empty text',
            filteredEmptyText: 'Empty due to exclusion',
            emptyURL: AppURL.create('sample', 'new'),
            emptyURLText: 'Test empty link',
            iconURL: '/testProduct/images/samples.svg',
        });
        const section = MenuSectionModel.create({
            label: 'Sample Sets',
            items: List<MenuSectionModel>(),
            key: 'samples',
        });

        renderWithAppContext(
            <ProductMenuSection
                config={config}
                containerPath="/test/path"
                currentProductId="testProduct"
                section={section}
            />,
            { serverContext: getDefaultServerContext() }
        );

        expect(document.querySelectorAll('li.empty-section').length).toBe(1);
        expect(document.querySelector('.empty-section').textContent).toBe('Test empty text');
        expect(document.querySelector('.empty-section').textContent).not.toContain('Empty due to exclusion');

        expect(document.querySelectorAll('.menu-section-header').length).toBe(1);
        expect(document.querySelectorAll('.clickable-item').length).toBe(1);
    });

    test('not empty, but all items hidden', () => {
        const config = new MenuSectionConfig({
            emptyText: 'Test empty text',
            filteredEmptyText: 'Empty due to exclusion',
            emptyURL: AppURL.create('sample', 'new'),
            emptyURLText: 'Test empty link',
            iconURL: '/testProduct/images/samples.svg',
        });
        const section = MenuSectionModel.create({
            label: 'Sample Sets',
            items: sampleSetItemsAllHidden,
            key: 'samples',
        });

        renderWithAppContext(
            <ProductMenuSection
                config={config}
                containerPath="/test/path"
                currentProductId="testProduct"
                section={section}
            />,
            { serverContext: getDefaultServerContext() }
        );

        expect(document.querySelectorAll('.empty-section').length).toBe(1);
        expect(document.querySelector('.empty-section').textContent).not.toContain('Test empty text');
        expect(document.querySelector('.empty-section').textContent).toBe('Empty due to exclusion');

        expect(document.querySelectorAll('.menu-section-header').length).toBe(1);
        expect(document.querySelectorAll('.clickable-item').length).toBe(1);
    });

    test('some items hidden', () => {
        const config = new MenuSectionConfig({
            emptyText: 'Test empty text',
            filteredEmptyText: 'Empty due to exclusion',
            emptyURL: AppURL.create('sample', 'new'),
            emptyURLText: 'Test empty link',
            iconURL: '/testProduct/images/samples.svg',
        });
        const section = MenuSectionModel.create({
            label: 'Sample Sets',
            items: sampleSetItemsSomeHidden,
            key: 'samples',
        });

        renderWithAppContext(
            <ProductMenuSection
                config={config}
                containerPath="/test/path"
                currentProductId="testProduct"
                section={section}
            />,
            { serverContext: getDefaultServerContext() }
        );

        expect(document.querySelectorAll('.empty-section').length).toBe(0);
        expect(document.querySelectorAll('li').length).toBe(3);
    });

    test('section with custom headerURL and headerText', () => {
        const section = MenuSectionModel.create({
            label: 'Sample Sets',
            items: List<MenuSectionModel>(),
            key: 'samples',
        });

        renderWithAppContext(
            <ProductMenuSection
                containerPath="/test/path"
                currentProductId="testProductHeaderUrl"
                section={section}
                config={
                    new MenuSectionConfig({
                        iconURL: '/testProduct/images/samples.svg',
                        headerURLPart: AppURL.create('sample', 'new').addParams({ sort: 'date' }),
                        headerText: 'Custom Sample Sets',
                    })
                }
            />,
            { serverContext: getDefaultServerContext() }
        );

        expect(document.querySelectorAll('.menu-section-header').length).toBe(1);
        expect(document.querySelectorAll('.clickable-item').length).toBe(1);
        expect(document.querySelectorAll('.product-menu-section').length).toBe(1);
    });

    test('one-column section', () => {
        const productId = 'testProduct3Columns';

        const section = MenuSectionModel.create({
            label: 'Sample Sets',
            url: undefined,
            items: sampleSetItems,
            key: 'samples',
        });

        renderWithAppContext(
            <ProductMenuSection
                containerPath="/test/path"
                currentProductId={productId}
                section={section}
                config={
                    new MenuSectionConfig({
                        iconURL: '/testProduct3Columns/images/samples.svg',
                    })
                }
            />,
            { serverContext: getDefaultServerContext() }
        );
        expect(document.querySelectorAll('ul').length).toBe(2);
        expect(document.querySelectorAll('i.fa-spinner').length).toBe(1); // verify active job indicator

        const listItems = document.querySelector('.product-menu-section').querySelectorAll('li');
        expect(listItems[0].textContent).toBe('Sample Set 1');
        expect(listItems[1].textContent).toBe('Sample Set 2');
        expect(listItems[2].textContent).toBe('Sample Set 3');
        expect(listItems[3].textContent).toBe('Sample Set 4');
    });

    test('one column section', () => {
        const productId = 'testProduct4Columns';

        const section = MenuSectionModel.create({
            label: 'Assays',
            items: assayItems,
            key: 'assays',
        });

        const sectionConfig = new MenuSectionConfig({
            iconURL: '/testProduct4Columns/images/assays.svg',
        });

        renderWithAppContext(
            <ProductMenuSection
                section={section}
                containerPath="/test/path"
                currentProductId={productId}
                config={sectionConfig}
            />,
            { serverContext: getDefaultServerContext() }
        );

        expect(document.querySelectorAll('ul').length).toBe(2);
        expect(document.querySelectorAll('i.fa-spinner').length).toBe(0); // no active jobs present

        const listItems = document.querySelector('.product-menu-section').querySelectorAll('li');
        expect(listItems[0].textContent).toBe('Assay 1');
        expect(listItems[1].textContent).toBe('Assay 2');
        expect(listItems[2].textContent).toBe('Assay 3');
        expect(listItems[3].textContent).toBe('Assay 4');
    });

    test('do not show active job', () => {
        const section = MenuSectionModel.create({
            label: 'Sample Sets',
            items: List<MenuSectionModel>(),
            key: 'samples',
        });

        renderWithAppContext(
            <ProductMenuSection
                containerPath="/test/path"
                currentProductId="testProductHeaderUrl"
                section={section}
                config={
                    new MenuSectionConfig({
                        showActiveJobIcon: false,
                    })
                }
            />,
            { serverContext: getDefaultServerContext() }
        );

        expect(document.querySelectorAll('i.fa-spinner').length).toBe(0);
    });

    test('use custom active job cls', () => {
        const section = MenuSectionModel.create({
            label: 'Sample Sets',
            items: List<MenuSectionModel>(),
            key: 'samples',
        });

        renderWithAppContext(
            <ProductMenuSection
                containerPath="/test/path"
                currentProductId="testProductHeaderUrl"
                section={section}
                config={
                    new MenuSectionConfig({
                        activeJobIconCls: 'job-running-icon',
                    })
                }
            />,
            { serverContext: getDefaultServerContext() }
        );

        expect(document.querySelectorAll('i.fa-spinner').length).toBe(0);
        expect(document.querySelectorAll('i.job-running-icon').length).toBe(0);
    });

    test('home project', () => {
        const section = MenuSectionModel.create({
            label: 'Sample Sets',
            items: List<MenuSectionModel>(),
            key: 'samples',
        });

        renderWithAppContext(
            <ProductMenuSection
                containerPath="/test"
                currentProductId="testProductHeaderUrl"
                section={section}
                config={
                    new MenuSectionConfig({
                        emptyText: 'Testing empty',
                        emptyAppURL: 'home',
                        emptyURLText: 'Create it',
                    })
                }
            />,
            { serverContext: getDefaultServerContext() }
        );

        expect(document.querySelector('.empty-section').textContent).toBe('Testing empty');
        expect(document.querySelectorAll('.empty-section-link').length).toBe(1);
        expect(document.querySelectorAll('.empty-section-link')[0].textContent).toBe('Create it');
        expect(document.querySelectorAll('.empty-section-link')[0].querySelector('a').getAttribute('href')).toBe(
            'home'
        );
    });

    test('useOriginalURL', () => {
        const section = MenuSectionModel.create({
            label: 'Sample Sets',
            items: List<MenuSectionModel>(),
            key: 'samples',
            url: 'www.labkey.org',
        });

        renderWithAppContext(
            <ProductMenuSection
                containerPath="/test/sub"
                currentProductId="testProductHeaderUrl"
                section={section}
                config={
                    new MenuSectionConfig({
                        useOriginalURL: true,
                    })
                }
            />,
            { serverContext: getDefaultServerContext() }
        );

        expect(document.querySelectorAll('.menu-section-header').length).toBe(1);
        expect(document.querySelectorAll('.menu-section-header')[0].querySelector('a').getAttribute('href')).toBe(
            'www.labkey.org'
        );
    });
});
