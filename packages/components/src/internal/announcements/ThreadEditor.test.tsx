import React from 'react';

import { render } from '@testing-library/react';

import { userEvent } from '@testing-library/user-event';

import { applyList, applyTemplate, handleBulletedListEnter, olMapper, ThreadEditor, ulMapper } from './ThreadEditor';
import { createTestAPIWrapper } from './test/utils';
import { NOUN_PLURAL, NOUN_SINGULAR, RESPONSE, THREAD } from './test/fixtures';

const COMMENT_TEXTAREA = '.thread-editor textarea.form-control';
const SUBMIT_BUTTON = '.thread-editor__create-btn';
const TOOLBAR_BUTTON = '.editor-toolbar__button';

describe('ThreadEditor', () => {
    test('creates new thread', async () => {
        const onCreate = jest.fn();
        const createThread = jest.fn().mockResolvedValue(THREAD);
        const expectedBody = '### I have been created!';
        const expectedIdentifier = 'abc-123';
        const expectedParent = 'parent-1';
        const expectedContainerPath = '/FolderOne';

        const expectedCreateThread = {
            body: expectedBody,
            discussionSrcIdentifier: expectedIdentifier,
            title: `${NOUN_SINGULAR} thread`,
        };

        render(
            <ThreadEditor
                api={createTestAPIWrapper({ createThread })}
                containerPath={expectedContainerPath}
                discussionSrcIdentifier={expectedIdentifier}
                nounPlural={NOUN_PLURAL}
                nounSingular={NOUN_SINGULAR}
                onCreate={onCreate}
            />
        );

        expect(document.querySelectorAll(COMMENT_TEXTAREA)).toHaveLength(1);
        await userEvent.type(document.querySelector(COMMENT_TEXTAREA), expectedBody);
        await userEvent.click(document.querySelector(SUBMIT_BUTTON));

        expect(createThread).toHaveBeenCalledWith(expectedCreateThread, [], false, expectedContainerPath);
        expect(onCreate).toHaveBeenCalledWith(THREAD);
    });
    test('updates thread', async () => {
        const updateThread = jest.fn().mockResolvedValue(THREAD);
        const onUpdate = jest.fn();
        const expectedBody = '**This is updated**';
        const expectedContainerPath = '/FolderOne';

        const expectedUpdatedThread = { ...RESPONSE, body: expectedBody };

        render(
            <ThreadEditor
                api={createTestAPIWrapper({ updateThread })}
                containerPath={expectedContainerPath}
                nounPlural={NOUN_PLURAL}
                nounSingular={NOUN_SINGULAR}
                onUpdate={onUpdate}
                thread={RESPONSE}
            />
        );

        // Initialize with original value
        expect(document.querySelector(COMMENT_TEXTAREA).textContent).toEqual(RESPONSE.body);

        // Update comment block
        await userEvent.clear(document.querySelector(COMMENT_TEXTAREA));
        await userEvent.type(document.querySelector(COMMENT_TEXTAREA), expectedBody);

        // Submit
        await userEvent.click(document.querySelector(SUBMIT_BUTTON));

        expect(updateThread).toHaveBeenCalledWith(expectedUpdatedThread, [], expectedContainerPath);
        expect(onUpdate).toHaveBeenCalledWith(THREAD);
    });
    test('renders preview', async () => {
        const body = '**This is a test preview**';
        const expectedContainerPath = '/FolderOne';
        const renderedBody = '<div class="fake-class">This is a test preview</div>';
        // Note: the mocked response here doesn't have to match what would actually get rendered, we're not testing
        // our server response.
        const renderContent = jest.fn().mockResolvedValue(renderedBody);
        render(
            <ThreadEditor
                api={createTestAPIWrapper({ renderContent })}
                containerPath={expectedContainerPath}
                nounPlural={NOUN_PLURAL}
                nounSingular={NOUN_SINGULAR}
            />
        );

        await userEvent.type(document.querySelector(COMMENT_TEXTAREA), body);
        await userEvent.click(document.querySelectorAll('.dropdown li a')[1]);
        expect(renderContent).toHaveBeenCalledWith(body, expectedContainerPath);
        expect(document.querySelector('.thread-editor-preview div').textContent).toBe('This is a test preview');
        // Toolbar buttons should all be disabled when rendering previews.
        document
            .querySelectorAll(TOOLBAR_BUTTON)
            .forEach(button => expect(button.hasAttribute('disabled')).toEqual(true));
    });
    test('renders preview error', async () => {
        const error = 'oh no, server is busted';
        const expectedError = 'Error loading preview: ' + error;
        // Note: the mocked response here doesn't have to match what would actually get rendered, we're not testing
        // our server response.
        const renderContent = jest.fn(() => Promise.reject(error));
        render(
            <ThreadEditor
                api={createTestAPIWrapper({ renderContent })}
                nounPlural={NOUN_PLURAL}
                nounSingular={NOUN_SINGULAR}
            />
        );

        await userEvent.click(document.querySelectorAll('.dropdown li a')[1]);
        expect(document.querySelector('.thread-editor-preview .help-block').textContent).toEqual(expectedError);
    });
    const expectToolbarButton = async (selector, text, expected) => {
        await userEvent.clear(document.querySelector(COMMENT_TEXTAREA));
        await userEvent.type(document.querySelector(COMMENT_TEXTAREA), text);
        await userEvent.click(document.querySelector(TOOLBAR_BUTTON + ' .fa' + selector));
        expect(document.querySelector(COMMENT_TEXTAREA).textContent).toEqual(text + expected);
    };
    test('toolbar', async () => {
        const body = 'This is a test preview\n';
        render(<ThreadEditor api={createTestAPIWrapper()} nounPlural={NOUN_PLURAL} nounSingular={NOUN_SINGULAR} />);

        await expectToolbarButton('.fa-bold', body, '****');
        await expectToolbarButton('.fa-italic', body, '**');
        await expectToolbarButton('.fa-link', body, '[](url)');
        await expectToolbarButton('.fa-list-ul', body, '- ');
        await expectToolbarButton('.fa-list-ol', body, '1. ');
    });
    test('applyTemplate', () => {
        const value = 'hello world';
        const element = { selectionStart: 6, selectionEnd: 11, value } as HTMLTextAreaElement;
        expect(applyTemplate(element, '*', '*')).toEqual(['hello *world*', 7, 12]);
        expect(applyTemplate(element, '**', '**')).toEqual(['hello **world**', 8, 13]);
        expect(applyTemplate(element, '[', '](url)')).toEqual(['hello [world](url)', 7, 12]);
    });
    test('applyList', () => {
        const value = 'one\ntwo\n';
        const element = { selectionStart: 0, selectionEnd: value.length - 1, value } as HTMLTextAreaElement;
        expect(applyList(element, ulMapper)).toEqual('- one\n- two\n');
        expect(applyList(element, olMapper)).toEqual('1. one\n2. two\n');
        element.selectionStart = value.length;
        element.selectionEnd = value.length;
        expect(applyList(element, ulMapper)).toEqual(value + '- ');
    });
    test('handleBulletedListEnter', () => {
        // Should returned undefined if we're not in a list.
        expect(handleBulletedListEnter(4, 4, 'hello')).toEqual([undefined, undefined]);

        // We don't currently handle selections
        expect(handleBulletedListEnter(3, 4, 'hello')).toEqual([undefined, undefined]);

        // Should append a new bullet in these cases
        expect(handleBulletedListEnter(7, 7, '- hello')).toEqual(['- hello\n- ', 10]);
        expect(handleBulletedListEnter(8, 8, '1. hello')).toEqual(['1. hello\n2. ', 12]);
        expect(handleBulletedListEnter(8, 8, '9. hello')).toEqual(['9. hello\n10. ', 13]);

        // Should handle padded bulleted lists
        expect(handleBulletedListEnter(11, 11, '    - hello')).toEqual(['    - hello\n    - ', 18]);

        // Should exit the bulleted list in these cases
        expect(handleBulletedListEnter(10, 10, '- hello\n- ')).toEqual(['- hello\n', 8]);
        expect(handleBulletedListEnter(12, 12, '1. hello\n2. ')).toEqual(['1. hello\n', 9]);
    });
});
