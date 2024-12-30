import React, { act } from 'react';

import { userEvent } from '@testing-library/user-event';

import { TEST_USER_EDITOR, TEST_USER_READER } from '../../internal/userFixtures';

import { renderWithAppContext } from '../../internal/test/reactTestLibraryHelpers';

import { SchemaQuery } from '../SchemaQuery';
import { getTestAPIWrapper } from '../../internal/APIWrapper';
import { getQueryTestAPIWrapper } from '../../internal/query/APIWrapper';
import { QueryInfo } from '../QueryInfo';

import { TemplateDownloadButton } from './TemplateDownloadButton';

const TEMPLATES = [
    {
        label: 'default',
        url: '/labkey/query-exportExcelTemplate.view?schemaName=samples&query.queryName=NameExpr&headerType=DisplayFieldKey',
    },
    { label: 'template1', url: '/samples/temp1.csv' },
    { label: 'temp2', url: '/samples/bloodtemplate.csv' },
];

const APP_CONTEXT = {
    api: getTestAPIWrapper(jest.fn, {
        query: getQueryTestAPIWrapper(jest.fn, {
            getQueryDetails: jest.fn().mockResolvedValue(
                QueryInfo.fromJsonForTests({
                    importTemplates: TEMPLATES,
                })
            ),
        }),
    }),
};

describe('TemplateDownloadButton', () => {
    test('no onDownloadDefault or defaultTemplateUrl', () => {
        const { container } = renderWithAppContext(<TemplateDownloadButton />);
        expect(container.textContent).toBe('');
    });

    test('no onDownloadDefault, empty defaultTemplateUrl', () => {
        const { container } = renderWithAppContext(<TemplateDownloadButton defaultTemplateUrl="" />);
        expect(container.textContent).toBe('');
    });

    test('reader', () => {
        const { container } = renderWithAppContext(
            <TemplateDownloadButton defaultTemplateUrl="" user={TEST_USER_READER} />
        );
        expect(container.textContent).toBe('');
    });

    test('editor', () => {
        const { container } = renderWithAppContext(
            <TemplateDownloadButton defaultTemplateUrl="testUrl" user={TEST_USER_EDITOR} />,
            {}
        );
        expect(container.textContent).toBe(' Template');
        expect(document.querySelectorAll('span.fa-download')).toHaveLength(1);
    });

    test('with custom templates, with defaultTemplateUrl', async () => {
        await act(async () => {
            renderWithAppContext(
                <TemplateDownloadButton
                    defaultTemplateUrl="testUrl"
                    schemaQuery={new SchemaQuery('a', 'b')}
                    user={TEST_USER_EDITOR}
                />,
                { appContext: APP_CONTEXT }
            );
        });
        expect(document.querySelectorAll('span.fa-download')).toHaveLength(1);
        expect(document.querySelector('button').textContent).toEqual(' Template');
        expect(document.querySelectorAll('.dropdown')).toHaveLength(1);
        const dropdown = document.querySelector('.dropdown');
        expect(document.querySelectorAll('.caret')).toHaveLength(1);
        const menuItems = dropdown.querySelectorAll('li');
        expect(menuItems).toHaveLength(3);
        const downloadLinks = dropdown.querySelectorAll('a');
        expect(downloadLinks).toHaveLength(3);
        expect(downloadLinks[0].getAttribute('href')).toEqual('testUrl');
        expect(downloadLinks[0].textContent).toEqual('Default Template');
        expect(downloadLinks[1].getAttribute('href')).toEqual(TEMPLATES[1].url);
        expect(downloadLinks[1].textContent).toEqual(TEMPLATES[1].label);
        expect(downloadLinks[2].getAttribute('href')).toEqual(TEMPLATES[2].url);
        expect(downloadLinks[2].textContent).toEqual(TEMPLATES[2].label);
    });

    test('with custom templates, with onDownloadDefault', async () => {
        let container;
        const downloadFn = jest.fn();
        await act(async () => {
            renderWithAppContext(
                <TemplateDownloadButton
                    onDownloadDefault={jest.fn()}
                    schemaQuery={new SchemaQuery('a', 'b')}
                    user={TEST_USER_EDITOR}
                />,
                { appContext: APP_CONTEXT }
            );
        });
        expect(document.querySelectorAll('span.fa-download')).toHaveLength(1);
        expect(document.querySelector('button').textContent).toEqual(' Template');
        expect(document.querySelectorAll('.dropdown')).toHaveLength(1);
        const dropdown = document.querySelector('.dropdown');
        expect(document.querySelectorAll('.caret')).toHaveLength(1);
        const menuItems = dropdown.querySelectorAll('li');
        expect(menuItems).toHaveLength(3);
        const downloadLinks = dropdown.querySelectorAll('a');
        expect(downloadLinks).toHaveLength(3);
        expect(downloadLinks[0].getAttribute('href')).toEqual('#');
        expect(downloadLinks[0].textContent).toEqual('Default Template');
        expect(downloadLinks[1].getAttribute('href')).toEqual(TEMPLATES[1].url);
        expect(downloadLinks[1].textContent).toEqual(TEMPLATES[1].label);
        expect(downloadLinks[2].getAttribute('href')).toEqual(TEMPLATES[2].url);
        expect(downloadLinks[2].textContent).toEqual(TEMPLATES[2].label);
    });

    test('isGridRenderer, with defaultTemplateUrl', async () => {
        let container;
        await act(async () => {
            renderWithAppContext(
                <TemplateDownloadButton
                    isGridRenderer
                    defaultTemplateUrl="testUrl"
                    schemaQuery={new SchemaQuery('a', 'b')}
                    user={TEST_USER_EDITOR}
                />,
                { appContext: APP_CONTEXT }
            );
        });
        expect(document.querySelectorAll('span.fa-download')).toHaveLength(1);
        expect(document.querySelector('button').textContent).toEqual(' Template');
        expect(document.querySelectorAll('.dropdown')).toHaveLength(1);
        expect(document.querySelectorAll('.caret')).toHaveLength(0);
        const dropdown = document.querySelector('.dropdown');
        const menuItems = dropdown.querySelectorAll('li');
        expect(menuItems).toHaveLength(0);
        let downloadLinks = dropdown.querySelectorAll('a');
        expect(downloadLinks).toHaveLength(0);

        await userEvent.click(document.querySelector('button'));

        expect(document.querySelectorAll('.dropdown')).toHaveLength(1);
        expect(document.querySelectorAll('.caret')).toHaveLength(1);
        downloadLinks = dropdown.querySelectorAll('a');
        expect(downloadLinks[0].getAttribute('href')).toEqual('testUrl');
        expect(downloadLinks[0].textContent).toEqual('Default Template');
        expect(downloadLinks[1].getAttribute('href')).toEqual(TEMPLATES[1].url);
        expect(downloadLinks[1].textContent).toEqual(TEMPLATES[1].label);
        expect(downloadLinks[2].getAttribute('href')).toEqual(TEMPLATES[2].url);
        expect(downloadLinks[2].textContent).toEqual(TEMPLATES[2].label);
    });

    test('editor, with custom properties', () => {
        const { container } = renderWithAppContext(
            <TemplateDownloadButton
                onDownloadDefault={jest.fn}
                text="Test Text"
                className="custom-styling"
                user={TEST_USER_EDITOR}
            />
        );
        expect(container.textContent).toBe(' Test Text');
        expect(document.querySelectorAll('span.fa-download')).toHaveLength(1);
        expect(document.querySelectorAll('.custom-styling')).toHaveLength(1);
    });
});
