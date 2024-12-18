import React, { FC, useCallback, useMemo, useState } from 'react';
import { differenceInSeconds } from 'date-fns';
import { User, UserWithPermissions } from '@labkey/api';

import { resolveErrorMessage } from '../util/messaging';

import { Alert } from '../components/base/Alert';

import { UserLink } from '../components/user/UserLink';

import { DropdownMenu, MenuItem } from '../dropdowns';

import { Modal } from '../Modal';

import { fromNow, parseDate } from '../util/Date';

import { AnnouncementModel } from './model';
import { ThreadEditor, ThreadEditorProps } from './ThreadEditor';
import { ThreadAttachments } from './ThreadAttachments';

interface DeleteThreadBSModalProps {
    cancel: () => void;
    onDelete: () => void;
}

const DeleteThreadModal: FC<DeleteThreadBSModalProps> = ({ cancel, onDelete }) => (
    <Modal
        confirmText="Yes, Delete Thread"
        confirmClass="btn-danger"
        onCancel={cancel}
        onConfirm={onDelete}
        title="Delete this comment thread?"
    >
        Deleting this comment will also delete any replies to the original comment. Are you sure you want to delete this
        thread?
    </Modal>
);

const DeleteReplyModal: FC<DeleteThreadBSModalProps> = ({ cancel, onDelete }) => (
    <Modal
        confirmText="Yes, Delete Reply"
        confirmClass="btn-danger"
        onCancel={cancel}
        onConfirm={onDelete}
        title="Delete this reply?"
    >
        Are you sure you want to delete this reply?
    </Modal>
);

interface ThreadBlockHeaderProps {
    author: User;
    created: number | string;
    isThread?: boolean;
    modified: number | string;
    onDelete?: () => void;
    onEdit?: () => void;
}

const ThreadBlockHeader: FC<ThreadBlockHeaderProps> = props => {
    const { created, modified, onDelete, onEdit, author, isThread } = props;
    const [showDeleteBSModal, setShowDeleteBSModal] = useState(false);
    const { formattedCreate, isEdited } = useMemo(() => {
        const createdDate = parseDate(created);
        const modifiedDate = parseDate(modified);

        return {
            formattedCreate: fromNow(createdDate),
            isEdited: differenceInSeconds(modifiedDate, createdDate) > 1,
        };
    }, [created, modified]);

    const onCancelDelete = useCallback(() => {
        setShowDeleteBSModal(false);
    }, []);

    const onShowDelete = useCallback(() => {
        setShowDeleteBSModal(true);
    }, []);

    return (
        <div className="thread-block-header">
            <span className="thread-block-header__user">
                <UserLink userId={author.id} userDisplayValue={author.displayName} />
            </span>
            <div className="pull-right">
                <span className="thread-block-header__date">
                    {formattedCreate}
                    {isEdited ? ' (Edited)' : ''}
                </span>
                {(onDelete || onEdit) && (
                    <DropdownMenu
                        className="thread-block-header__menu"
                        title={<i className="fa fa-ellipsis-v" />}
                        pullRight
                    >
                        {onEdit !== undefined && (
                            <MenuItem className="thread-block-header__menu-edit" onClick={onEdit}>
                                Edit Comment
                            </MenuItem>
                        )}
                        {onDelete !== undefined && (
                            <MenuItem className="thread-block-header__menu-delete" onClick={onShowDelete}>
                                Delete {isThread ? 'Thread' : 'Reply'}
                            </MenuItem>
                        )}
                    </DropdownMenu>
                )}
            </div>
            {showDeleteBSModal && isThread && <DeleteThreadModal cancel={onCancelDelete} onDelete={onDelete} />}
            {showDeleteBSModal && !isThread && <DeleteReplyModal cancel={onCancelDelete} onDelete={onDelete} />}
        </div>
    );
};

export interface ThreadBlockProps extends ThreadEditorProps {
    canReply?: boolean;
    onDelete?: (thread: AnnouncementModel) => void;
    onToggleResponses?: () => void;
    readOnly?: boolean;
    showResponses?: boolean;
    thread: AnnouncementModel;
    user: UserWithPermissions;
}

export const ThreadBlock: FC<ThreadBlockProps> = props => {
    const {
        api,
        canReply = true,
        containerPath,
        onCreate,
        onDelete,
        onToggleResponses,
        onUpdate,
        readOnly,
        showResponses,
        thread,
        user,
        setPendingChange,
    } = props;
    const [editing, setEditing] = useState(false);
    const [error, setError] = useState<string>(undefined);
    const [recentTimeout, setRecentTimeout] = useState<number>(undefined);
    const [replying, setReplying] = useState(false);
    const [showRecent, setShowRecent] = useState(false);

    const threadBody = useMemo(() => ({ __html: thread.formattedHtml }), [thread.formattedHtml]);
    const allowDelete = !readOnly && user.canDelete;
    const allowReply = canReply && !readOnly && user.canInsert;
    const allowUpdate = !readOnly && user.canUpdate;
    const showReplyToggle = onToggleResponses !== undefined && thread.responses.length > 0;

    const onDeleteThread = useCallback(async () => {
        let deleted = false;
        try {
            deleted = await api.deleteThread(thread.rowId, containerPath);
        } catch (err) {
            setError(resolveErrorMessage(err, 'thread', 'thread', 'delete'));
        }

        if (deleted) {
            onDelete?.(thread);
        }
    }, [api, containerPath, onDelete, thread]);

    const onCancel = useCallback(() => {
        setEditing(false);
        setReplying(false);
    }, []);

    const onEdit = useCallback(() => {
        setEditing(true);
    }, []);

    const onEdited = useCallback((thread: AnnouncementModel) => {
        setEditing(false);
        onUpdate?.(thread);
    }, []);

    const onReply = useCallback(() => {
        setReplying(true);
    }, []);

    const onReplied = useCallback((thread: AnnouncementModel) => {
        clearTimeout(recentTimeout);

        setReplying(false);
        onCreate?.(thread);

        setShowRecent(true);
        setRecentTimeout(
            setTimeout(() => {
                setShowRecent(false);
            }, 10000) as any
        );
    }, []);

    return (
        <>
            <div className="thread-block">
                {editing && <ThreadEditor {...props} onCancel={onCancel} onUpdate={onEdited} />}
                {!editing && (
                    <div className="thread-block-body">
                        <ThreadBlockHeader
                            created={thread.created}
                            modified={thread.modified}
                            onDelete={allowDelete ? onDeleteThread : undefined}
                            onEdit={allowUpdate ? onEdit : undefined}
                            author={thread.author}
                            isThread={!thread.parent}
                        />
                        {error !== undefined && <Alert>{error}</Alert>}
                        <div className="thread-block-body__content" dangerouslySetInnerHTML={threadBody} />

                        <ThreadAttachments attachments={thread.attachments ?? []} containerPath={containerPath} />

                        {allowReply && (
                            <span className="clickable-text thread-block__reply" onClick={onReply}>
                                Reply
                            </span>
                        )}
                        {showReplyToggle && (
                            <span className="clickable-text thread-block__toggle-reply" onClick={onToggleResponses}>
                                {showResponses
                                    ? 'Hide all replies'
                                    : `Show all replies (${thread.responses.length.toLocaleString()})`}
                            </span>
                        )}
                        {showRecent && (
                            <span className="thread-block__toggle-reply-msg">
                                <i className="fa fa-check-circle" /> Your reply was posted
                            </span>
                        )}
                    </div>
                )}
            </div>
            {replying && (
                <div className="thread-responses-container">
                    <ThreadEditor
                        {...props}
                        onCancel={onCancel}
                        onCreate={onReplied}
                        parent={thread.parent ?? thread.entityId}
                        thread={undefined}
                        setPendingChange={setPendingChange}
                    />
                </div>
            )}
        </>
    );
};

ThreadBlock.displayName = 'ThreadBlock';
