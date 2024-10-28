import React, { act } from 'react';
import { Map } from 'immutable';

import { FolderColumnRenderer } from './FolderColumnRenderer';
import { renderWithAppContext } from '../test/reactTestLibraryHelpers';

describe('FolderColumnRenderer', () => {
    test('No data', async () => {
        await act(async () => {
            renderWithAppContext(<FolderColumnRenderer data={undefined} />);
        });

        expect(document.querySelector('body').textContent).toBe('');
    });

    test('empty data', async () => {
        await act(async () => {
            renderWithAppContext(<FolderColumnRenderer data={Map({})} />);
        });
        expect(document.querySelector('body').textContent).toBe('');
    });

    test('has archived, current archived, with data map', async () => {
        const data = {
            value: 'testContainerEntityId',
            displayValue: 'Folder1',
            url: 'http://samples.org/Folder1',
        };
        await act(async () => {
            renderWithAppContext(<FolderColumnRenderer data={Map(data)} />, {
                serverContext: {
                    moduleContext: {
                        samplemanagement: {
                            archivedContainers: ['Folder1', 'testContainerEntityId']
                        },
                    },
                },
            });
        });

        expect(document.querySelector('body').textContent).toBe('Folder1Archived');
    });

    test('has archived, current archived, with string value', async () => {
        await act(async () => {
            renderWithAppContext(<FolderColumnRenderer data="Folder1" />, {
                serverContext: {
                    moduleContext: {
                        samplemanagement: {
                            archivedContainers: ['Folder1', 'testContainerEntityId']
                        },
                    },
                },
            });
        });

        expect(document.querySelector('body').textContent).toBe('Folder1Archived');
    });

    test('has archived, current not archived', async () => {
        const data = {
            value: 'testContainerEntityId',
            displayValue: 'Folder2',
            url: 'http://samples.org/Folder2',
        };
        await act(async () => {
            renderWithAppContext(<FolderColumnRenderer data={Map(data)} />, {
                serverContext: {
                    moduleContext: {
                        samplemanagement: {
                            archivedContainers: ['Folder1', 'archivedContainerEntityId2']
                        },
                    },
                },
            });
        });

        expect(document.querySelector('body').textContent).toBe('Folder2');
    });


});
