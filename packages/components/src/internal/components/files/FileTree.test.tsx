import React from 'react';

import { render } from '@testing-library/react';

import { waitFor } from '@testing-library/dom';

import { userEvent } from '@testing-library/user-event';

import { FileTree, EMPTY_FILE_NAME, LOADING_FILE_NAME } from './FileTree';
import { fetchFileTestTree } from './FileTreeTest';
import { FileNodeIcon, Header } from './FileTreeHeader';

describe('FileTree', () => {
    test('with data', async () => {
        const component = <FileTree loadData={fetchFileTestTree} onFileSelect={jest.fn()} />;
        render(component);

        await waitFor(() => {
            expect(document.querySelectorAll('.filetree-checkbox-container').length).toBe(1);
        });

        expect(document.querySelectorAll('.filetree-resource-row').length).toBe(1);
        await userEvent.click(document.querySelector('.filetree-resource-row'));
        expect(document.querySelectorAll('.filetree-resource-row').length).toBe(5);
        expect(document.querySelectorAll('.filetree-folder-icon').length).toBe(5);
        expect(document.querySelectorAll('input[type = checkbox]').length).toBe(5);
        const dirNames = document.querySelectorAll('.filetree-directory-name');
        expect(dirNames.length).toBe(5);
        expect(dirNames[0].textContent).toBe('root');
        expect(dirNames[1].textContent).toBe('parent1');
        expect(dirNames[2].textContent).toBe('loading parent');
        expect(dirNames[3].textContent).toBe('parent2');
        expect(dirNames[4].textContent).toBe('empty directory');
    });

    test('with data allowMultiSelect false', async () => {
        const component = (
            <FileTree allowMultiSelect={false} loadData={fetchFileTestTree} onFileSelect={jest.fn(() => true)} />
        );
        render(component);

        await waitFor(() => {
            expect(document.querySelectorAll('.filetree-checkbox-container').length).toBe(1);
        });

        expect(document.querySelectorAll('.filetree-resource-row').length).toBe(1);
        await userEvent.click(document.querySelector('.filetree-resource-row'));
        expect(document.querySelectorAll('.filetree-resource-row').length).toBe(5);
        expect(document.querySelectorAll('.filetree-folder-icon').length).toBe(5);
        expect(document.querySelectorAll('input[type = checkbox]').length).toBe(0);
        const dirNames = document.querySelectorAll('.filetree-directory-name');
        expect(dirNames.length).toBe(5);
        expect(dirNames[0].textContent).toBe('root');
        expect(dirNames[1].textContent).toBe('parent1');
        expect(dirNames[2].textContent).toBe('loading parent');
        expect(dirNames[3].textContent).toBe('parent2');
        expect(dirNames[4].textContent).toBe('empty directory');
    });
});

describe('FileNodeIcon', () => {
    const DEFAULT_PROPS = {
        isDirectory: false,
        useFileIconCls: false,
        node: {},
    };

    test('default props', () => {
        render(<FileNodeIcon {...DEFAULT_PROPS} />);
        expect(document.querySelectorAll('i')).toHaveLength(0);
        expect(document.querySelectorAll('.fa-file-alt')).toHaveLength(1);
    });

    test('isDirectory', () => {
        render(<FileNodeIcon {...DEFAULT_PROPS} isDirectory={true} />);
        expect(document.querySelectorAll('i')).toHaveLength(0);
        expect(document.querySelectorAll('.fa-folder')).toHaveLength(1);
    });

    test('isDirectory toggled', () => {
        render(<FileNodeIcon {...DEFAULT_PROPS} isDirectory node={{ toggled: true }} />);
        expect(document.querySelectorAll('i')).toHaveLength(0);
        expect(document.querySelectorAll('.fa-folder-open')).toHaveLength(1);
    });

    test('useFileIconCls', () => {
        render(<FileNodeIcon {...DEFAULT_PROPS} useFileIconCls />);
        expect(document.querySelectorAll('i')).toHaveLength(0);
        expect(document.querySelectorAll('.fa.filetree-folder-icon')).toHaveLength(1);
    });

    test('useFileIconCls and iconFontCls', () => {
        render(<FileNodeIcon {...DEFAULT_PROPS} useFileIconCls node={{ data: { iconFontCls: 'test-cls' } }} />);
        expect(document.querySelectorAll('i')).toHaveLength(1);
        expect(document.querySelectorAll('.fa')).toHaveLength(0);
        expect(document.querySelector('i').getAttribute('class')).toBe('test-cls filetree-folder-icon');
    });
});

describe('Header', () => {
    const DEFAULT_PROPS = {
        node: { id: 'test-id', active: false, children: undefined, name: 'test name' },
        style: { base: {} },
        showNodeIcon: true,
        isEmpty: false,
        isLoading: false,
    };

    function validate(
        isEmpty = false,
        loading = false,
        hasCheckbox = false,
        showNodeIcon = true,
        isDirectory = false
    ): void {
        expect(document.querySelectorAll('.filetree-empty-directory')).toHaveLength(isEmpty ? 1 : 0);
        expect(document.querySelectorAll('.fa-spinner')).toHaveLength(loading ? 1 : 0);

        const rendered = !isEmpty && !loading;
        expect(document.querySelectorAll('.filetree-checkbox-container')).toHaveLength(rendered ? 1 : 0);
        expect(document.querySelectorAll('.checkbox')).toHaveLength(rendered && hasCheckbox ? 1 : 0);
        expect(document.querySelectorAll('.filetree-resource-row')).toHaveLength(rendered ? 1 : 0);
        expect(document.querySelectorAll('.filetree-folder-icon')).toHaveLength(rendered && showNodeIcon ? 1 : 0);
        expect(document.querySelectorAll('.filetree-file-name')).toHaveLength(rendered && !isDirectory ? 1 : 0);
        expect(document.querySelectorAll('.filetree-directory-name')).toHaveLength(rendered && isDirectory ? 1 : 0);
    }

    test('file node, no checkbox', () => {
        render(<Header {...DEFAULT_PROPS} />);
        validate();
        expect(document.querySelectorAll('.filetree-leaf-node')).toHaveLength(1);
        expect(document.querySelectorAll('.active')).toHaveLength(0);
        expect(document.querySelector('.filetree-resource-row').getAttribute('title')).toBe('test name');
        expect(document.querySelector('.filetree-file-name').textContent).toBe('test name');
    });

    test('file node, with checkbox', () => {
        render(<Header {...DEFAULT_PROPS} handleCheckbox={jest.fn} />);
        validate(false, false, true);
    });

    test('directory node', () => {
        render(<Header {...DEFAULT_PROPS} node={{ id: 'test-id', active: false, children: [], name: 'test name' }} />);
        validate(false, false, false, true, true);
        expect(document.querySelectorAll('.filetree-leaf-node')).toHaveLength(0);
    });

    test('showNodeIcon false', () => {
        render(<Header {...DEFAULT_PROPS} showNodeIcon={false} />);
        validate(false, false, false, false);
    });

    test('active and not allowMultiSelect', () => {
        render(
            <Header {...DEFAULT_PROPS} node={{ id: 'test-id', active: true, children: undefined, name: 'test name' }} />
        );
        validate();
        expect(document.querySelectorAll('.active')).toHaveLength(1);
        expect(document.querySelectorAll('.lk-text-theme-dark')).toHaveLength(1);
    });

    test('active and allowMultiSelect', () => {
        render(
            <Header
                {...DEFAULT_PROPS}
                node={{ id: 'test-id', active: true, children: undefined, name: 'test name' }}
                allowMultiSelect
            />
        );
        validate();
        expect(document.querySelectorAll('.active')).toHaveLength(1);
        expect(document.querySelectorAll('.lk-text-theme-dark')).toHaveLength(0);
    });

    test('empty node', () => {
        render(<Header {...DEFAULT_PROPS} isEmpty={true} node={{ id: 'test|' + EMPTY_FILE_NAME }} />);
        validate(true);
    });

    test('loading node', () => {
        render(<Header {...DEFAULT_PROPS} isLoading={true} node={{ id: 'test|' + LOADING_FILE_NAME }} />);
        validate(true, true);
    });

    test('customStyles and not selected', () => {
        const title = { fontWeight: 'normal' };
        const customTitle = { fontWeight: 'bold' };
        render(
            <Header
                {...DEFAULT_PROPS}
                node={{
                    id: 'test-id',
                    active: false,
                    children: undefined,
                    name: 'test name',
                    selected: false,
                }}
                style={{ base: {}, title }}
                customStyles={{ header: { title: customTitle } }}
            />
        );
        validate();
        expect(document.querySelector('.filetree-resource-row').getAttribute('style')).toBe('font-weight: normal;');
    });

    test('customStyles and selected', () => {
        const title = { fontWeight: 'normal' };
        const customTitle = { fontWeight: 'bold' };
        render(
            <Header
                {...DEFAULT_PROPS}
                node={{
                    id: 'test-id',
                    active: false,
                    children: undefined,
                    name: 'test name',
                    selected: true,
                    style: { base: {}, title },
                }}
                customStyles={{ header: { title: customTitle } }}
            />
        );
        validate();
        expect(document.querySelector('.filetree-resource-row').getAttribute('style')).toBe('font-weight: bold;');
    });
});
