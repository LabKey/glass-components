import React from 'react';

import { userEvent } from '@testing-library/user-event';

import { renderWithAppContext } from '../test/reactTestLibraryHelpers';

import { ThreadBlock } from './ThreadBlock';
import { createTestAPIWrapper } from './test/utils';
import { COMMENTER, NOUN_PLURAL, NOUN_SINGULAR, THREAD, THREAD_WITH_RESPONSE } from './test/fixtures';

describe('ThreadBlock', () => {
    test('displays thread', () => {
        renderWithAppContext(
            <ThreadBlock
                api={createTestAPIWrapper()}
                canReply={true}
                nounPlural={NOUN_PLURAL}
                nounSingular={NOUN_SINGULAR}
                thread={THREAD}
                user={COMMENTER}
            />,
            { serverContext: { user: COMMENTER } }
        );

        // Displays formatted body -- not body
        expect(document.querySelector('.thread-block-body__content').textContent).not.toContain(THREAD.body);
        expect(document.querySelector('.thread-block-body__content').textContent).toContain('Test Thread');

        // Does not display thread editors
        expect(document.querySelectorAll('.thread-editor')).toHaveLength(0);

        // Displays header
        expect(document.querySelectorAll('.user-link')).toHaveLength(1);
        expect(document.querySelector('.thread-block-header__user').textContent).toEqual(COMMENTER.displayName);

        // Allows for reply
        expect(document.querySelectorAll('.thread-block__reply')).toHaveLength(1);

        // Does not show reply toggle when responses are not available
        expect(document.querySelectorAll('.thread-block__toggle-reply')).toHaveLength(0);
    });

    test('toggles thread replies', async () => {
        const onToggleResponses = jest.fn();

        renderWithAppContext(
            <ThreadBlock
                api={createTestAPIWrapper()}
                canReply={true}
                nounPlural={NOUN_PLURAL}
                nounSingular={NOUN_SINGULAR}
                onToggleResponses={onToggleResponses}
                thread={THREAD_WITH_RESPONSE}
                user={COMMENTER}
            />,
            { serverContext: { user: COMMENTER } }
        );

        // Displays toggle with responses initially hidden
        const replyToggle = document.querySelector('.thread-block__toggle-reply');
        expect(replyToggle.textContent).toContain('Show all replies');

        await userEvent.click(replyToggle);
        expect(onToggleResponses).toHaveBeenCalled();

        // wrapper.setProps({ showResponses: true });
        //
        // replyToggle = document.querySelectorAll('.thread-block__toggle-reply');
        // expect(replyToggle.textContent).toContain('Hide all replies');
    });

    test('toggles thread replies, showResponses', async () => {
        const onToggleResponses = jest.fn();

        renderWithAppContext(
            <ThreadBlock
                api={createTestAPIWrapper()}
                canReply={true}
                nounPlural={NOUN_PLURAL}
                nounSingular={NOUN_SINGULAR}
                onToggleResponses={onToggleResponses}
                thread={THREAD_WITH_RESPONSE}
                showResponses
                user={COMMENTER}
            />,
            { serverContext: { user: COMMENTER } }
        );

        // Displays toggle with responses initially hidden
        const replyToggle = document.querySelector('.thread-block__toggle-reply');
        expect(replyToggle.textContent).toContain('Hide all replies');

        await userEvent.click(replyToggle);
        expect(onToggleResponses).toHaveBeenCalled();
    });

    test('delete thread, without permissions', async () => {
        const CANNOT_DELETE_USER = Object.assign({}, COMMENTER, { canDelete: false });

        renderWithAppContext(
            <ThreadBlock
                api={createTestAPIWrapper()}
                canReply={true}
                nounPlural={NOUN_PLURAL}
                nounSingular={NOUN_SINGULAR}
                onDelete={jest.fn()}
                thread={THREAD}
                user={CANNOT_DELETE_USER}
            />,
            { serverContext: { user: CANNOT_DELETE_USER } }
        );

        // respects "canDelete"
        expect(document.querySelectorAll('.thread-block-header__menu-delete')).toHaveLength(0);
    });

    test('delete thread, with permissions', async () => {
        const CANNOT_DELETE_USER = Object.assign({}, COMMENTER, { canDelete: false });

        renderWithAppContext(
            <ThreadBlock
                api={createTestAPIWrapper()}
                canReply={true}
                nounPlural={NOUN_PLURAL}
                nounSingular={NOUN_SINGULAR}
                onDelete={jest.fn()}
                thread={THREAD}
                user={COMMENTER}
            />,
            { serverContext: { user: COMMENTER } }
        );

        // respects "canDelete"
        expect(document.querySelectorAll('.thread-block-header__menu-delete')).toHaveLength(1);
    });
});
