import React, {
    ChangeEvent,
    FC,
    KeyboardEvent,
    memo,
    MutableRefObject,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import classNames from 'classnames';

import { handleFileInputChange } from '../util/utils';
import { isLoading, LoadingState } from '../../public/LoadingState';
import { resolveErrorMessage } from '../util/messaging';
import { LoadingSpinner } from '../components/base/LoadingSpinner';
import { Key } from '../../public/useEnterEscape';

import { DropdownMenu, MenuItem } from '../dropdowns';

import { AnnouncementsAPIWrapper } from './APIWrapper';

import { RemoveAttachmentModal, ThreadAttachments } from './ThreadAttachments';
import { Attachment, AnnouncementModel } from './model';

// Check if a line starts with any spaces, a number, followed by a period and a space.
const orderedBulletRe = /^\s*\d+. /;
// Checks if the entire line consists of any spaces, followed by a number, followed by a period and a space.
const orderedBulletLine = /^\s*\d+. $/;

export const handleBulletedListEnter = (
    selectionStart: number,
    selectionEnd: number,
    value: string
): [string, number] => {
    if (selectionStart !== selectionEnd) {
        return [undefined, undefined];
    }

    // Subtract 1 because if the cursor is at the end of the line it will be on a "\n" character and the loop below will
    // exit prematurely.
    let index = selectionStart - 1;
    // The position of the first character of the line the cursor was on when the user hit enter.
    let startOfLine;

    // Travel backwards until we fine the start of the line the cursor is on.
    while (index >= 0) {
        if (value[index] === '\n') {
            startOfLine = index + 1;
            break;
        }

        if (index === 0) {
            startOfLine = index;
            break;
        }

        index = index - 1;
    }

    const line = value.slice(startOfLine, selectionStart);
    const trimmedLine = line.trimLeft();
    const padding = line.length - trimmedLine.length;
    const isUnordered = trimmedLine.startsWith('- ');
    const isOrdered = orderedBulletRe.test(line);
    const isList = isUnordered || orderedBulletRe.test(line);
    const entireLineIsBullet = trimmedLine === '- ' || orderedBulletLine.test(trimmedLine);

    if (isList) {
        let before;
        let after;
        let body;
        let cursorPos;

        if (entireLineIsBullet) {
            // If the user hit enter an the entire contents of the line is '- ' or a number then we
            // want to escape out of the list.
            before = value.slice(0, startOfLine);
            after = value.slice(selectionStart);
            body = before + after;
            cursorPos = startOfLine;
        } else {
            before = value.slice(0, selectionStart);
            after = value.slice(selectionStart);
            let bullet;

            if (isOrdered) {
                const periodIndex = trimmedLine.indexOf('.');
                bullet = `${parseInt(trimmedLine.slice(0, periodIndex), 10) + 1}. `;
            } else {
                bullet = '- ';
            }

            bullet = bullet.padStart(padding + bullet.length);
            body = `${before}\n${bullet}${after}`;
            cursorPos = selectionStart + bullet.length + 1;
        }

        return [body, cursorPos];
    }

    return [undefined, undefined];
};

enum EditorView {
    edit = 'Markdown mode',
    preview = 'Preview',
}

interface ToolbarButtonProps {
    disabled: boolean;
    iconName: string;
    onClick: () => void;
}

const ToolBarButton: FC<ToolbarButtonProps> = memo(({ disabled, iconName, onClick }) => {
    const iconClass = `fa fa-${iconName}`;
    const _onClick = useCallback(() => onClick(), [onClick]);

    return (
        <button className="editor-toolbar__button" disabled={disabled} onClick={_onClick}>
            <i className={iconClass} />
        </button>
    );
});

const extractTemplateParts = (element: HTMLTextAreaElement): [string, string, string] => {
    const { selectionStart, selectionEnd, value } = element;
    const before = value.slice(0, selectionStart);
    const selected = value.slice(selectionStart, selectionEnd);
    const after = value.slice(selectionEnd);
    return [before, selected, after];
};

export const applyTemplate = (element: HTMLTextAreaElement, prefix, postfix): [string, number, number] => {
    const [before, selected, after] = extractTemplateParts(element);
    const newText = `${prefix}${selected}${postfix}`;
    const selectionStart = element.selectionStart + prefix.length;
    const selectionEnd = element.selectionEnd + prefix.length;
    return [`${before}${newText}${after}`, selectionStart, selectionEnd];
};

type Mapper = (item: string, index: number) => string;

export const applyList = (element: HTMLTextAreaElement, mapper: Mapper): string => {
    const [before, selected, after] = extractTemplateParts(element);
    const items = selected.split('\n').map(mapper).join('\n');
    return `${before}${items}${after}`;
};

export const olMapper = (item, index) => `${index + 1}. ${item}`;
export const ulMapper = item => `- ${item}`;

interface ThreadEditorToolbarProps {
    inputRef: MutableRefObject<HTMLTextAreaElement>;
    setBody: (value: string, selectionStart?: number, selectionEnd?: number) => void;
    setView: (view: EditorView) => void;
    view: EditorView;
}

const ThreadEditorToolbar: FC<ThreadEditorToolbarProps> = memo(({ inputRef, setBody, setView, view }) => {
    const bold = useCallback(() => {
        const [body, selectionStart, selectionEnd] = applyTemplate(inputRef.current, '**', '**');
        setBody(body, selectionStart, selectionEnd);
    }, [inputRef]);
    const italic = useCallback(() => {
        const [body, selectionStart, selectionEnd] = applyTemplate(inputRef.current, '*', '*');
        setBody(body, selectionStart, selectionEnd);
    }, [inputRef]);
    const link = useCallback(() => {
        const [body, selectionStart, selectionEnd] = applyTemplate(inputRef.current, '[', '](url)');
        // Highlight url area instead of previously selected text
        const selectionLength = selectionEnd - selectionStart;
        setBody(body, selectionStart + selectionLength + 2, selectionEnd + 5);
    }, [inputRef]);
    const unorderedList = useCallback(() => {
        setBody(applyList(inputRef.current, ulMapper));
    }, [inputRef]);
    const orderedList = useCallback(() => {
        setBody(applyList(inputRef.current, olMapper));
    }, [inputRef]);
    const setEditMode = useCallback(() => setView(EditorView.edit), [setView]);
    const setPreviewMode = useCallback(() => setView(EditorView.preview), [setView]);
    const buttonsDisabled = view === EditorView.preview;

    return (
        <div className="thread-editor-toolbar editor-toolbar">
            <div className="editor-toolbar__section insert-menu">
                <DropdownMenu title={view}>
                    <MenuItem onClick={setEditMode}>{EditorView.edit}</MenuItem>
                    <MenuItem onClick={setPreviewMode}>{EditorView.preview}</MenuItem>
                </DropdownMenu>
            </div>

            <div className="editor-toolbar__section">
                <ToolBarButton disabled={buttonsDisabled} iconName="bold" onClick={bold} />
                <ToolBarButton disabled={buttonsDisabled} iconName="italic" onClick={italic} />
                <ToolBarButton disabled={buttonsDisabled} iconName="link" onClick={link} />
                <ToolBarButton disabled={buttonsDisabled} iconName="list-ul" onClick={unorderedList} />
                <ToolBarButton disabled={buttonsDisabled} iconName="list-ol" onClick={orderedList} />
            </div>
        </div>
    );
});

interface PreviewProps {
    containerPath?: string;
    content: string;
    renderContent: (content: string, containerPath?: string) => Promise<string>;
}

const Preview: FC<PreviewProps> = memo(({ containerPath, content, renderContent }) => {
    const [renderedContent, setRenderedContent] = useState<string>(undefined);
    const [loadingState, setLoadingState] = useState<LoadingState>(LoadingState.INITIALIZED);
    const [error, setError] = useState<string>(undefined);
    const _isLoading = isLoading(loadingState);

    useEffect(() => {
        (async () => {
            setLoadingState(LoadingState.LOADING);

            try {
                const _renderedContent = await renderContent(content, containerPath);
                setError(undefined);
                setRenderedContent(_renderedContent);
            } catch (e) {
                setError(resolveErrorMessage(e));
            } finally {
                setLoadingState(LoadingState.LOADED);
            }
        })();
    }, [containerPath, content]);

    return (
        <div className="thread-editor-preview">
            {_isLoading && <LoadingSpinner />}
            {!_isLoading && error === undefined && <div dangerouslySetInnerHTML={{ __html: renderedContent }} />}
            {!_isLoading && error !== undefined && <div className="help-block">Error loading preview: {error}</div>}
        </div>
    );
});

export interface ThreadEditorProps {
    api: AnnouncementsAPIWrapper;
    containerPath?: string;
    discussionSrcEntityType?: string;
    discussionSrcIdentifier?: string;
    nounPlural: string;
    nounSingular: string;
    onCancel?: () => void;
    onCreate?: (newThread: AnnouncementModel) => void;
    onUpdate?: (updatedThread: AnnouncementModel) => void;
    parent?: string;
    setPendingChange?: (threadId: number, hasPendingChange: boolean) => void;
    thread?: AnnouncementModel;
}

export const ThreadEditor: FC<ThreadEditorProps> = props => {
    const {
        api,
        containerPath,
        discussionSrcIdentifier,
        discussionSrcEntityType,
        nounSingular,
        onCancel,
        onCreate,
        onUpdate,
        parent,
        thread,
        setPendingChange,
    } = props;
    const bodyInputRef = useRef<HTMLTextAreaElement>(null);
    const [error, setError] = useState<string>(undefined);
    const [model, setModel] = useState<Partial<AnnouncementModel>>({ ...thread });
    const [submitting, setSubmitting] = useState(false);

    const hasError = error !== undefined;
    const isCreate = model.rowId === undefined;
    const submitDisabled = submitting || !model.body;
    const [attachmentError, setAttachmentError] = useState<string>(undefined);
    const [files, setFiles] = useState<File[]>([]);
    const attachments = useMemo<Attachment[]>(() => {
        return (model.attachments ?? []).concat(files.map(f => ({ name: f.name, documentSize: f.size })));
    }, [model.attachments, files]);
    const onAttach = useCallback(
        (newFiles: File[]) => {
            const duplicates = [];
            const filesToAdd = newFiles.filter(file => {
                const existingAttachment = attachments.find(attachment => attachment.name === file.name);
                if (existingAttachment !== undefined) {
                    duplicates.push(file.name);
                    return false;
                }

                return true;
            });

            if (duplicates.length > 0) {
                setAttachmentError(`Duplicate files can not be attached: ${duplicates.join(', ')}`);
            } else {
                setAttachmentError(undefined);
            }
            setFiles(files.concat(filesToAdd));
        },
        [files, attachments]
    );
    const onFileInputChange = useMemo(() => handleFileInputChange(onAttach), [onAttach]);
    const [attachmentToRemove, setAttachmentToRemove] = useState<string>(undefined);
    const openRemoveModal = useCallback(name => setAttachmentToRemove(name), []);
    const closeRemoveModal = useCallback(() => setAttachmentToRemove(undefined), []);
    const [isRemoving, setIsRemoving] = useState<boolean>(false);
    const [removeAttachmentError, setRemoveAttachmentError] = useState<string>(undefined);
    const removeAttachment = useCallback(async () => {
        const attachment = attachments.find(attachment => attachment.name === attachmentToRemove);

        if (attachment.created !== undefined) {
            // pre-existing attachment, delete from server
            setIsRemoving(true);
            try {
                await api.deleteAttachment(attachment.parent, attachment.name, containerPath);
                const updatedAttachments = model.attachments.filter(att => att.name !== attachmentToRemove);
                setModel({ ...model, attachments: updatedAttachments });
                setAttachmentToRemove(undefined);
            } catch (err) {
                const message = resolveErrorMessage(err, 'attachment', 'attachments', 'delete');
                setRemoveAttachmentError(`Error deleting attachment: ${message}`);
            } finally {
                setIsRemoving(false);
            }
        } else {
            // new attachment, remove from files
            setFiles(files.filter(file => file.name !== attachmentToRemove));
            setAttachmentToRemove(undefined);
        }
    }, [containerPath, model, attachments, attachmentToRemove, files]);

    const createThread = useCallback(async () => {
        const modelToCreate = { ...model };

        // Ensure title
        // This is required for announcements, however, it is not
        // exposed or utilized by this commenting UI at this time.
        if (!modelToCreate.title) {
            modelToCreate.title = `${nounSingular} thread`;
        }

        // apply "discussionSrcIdentifier"
        if (discussionSrcIdentifier) {
            modelToCreate.discussionSrcIdentifier = discussionSrcIdentifier;
        }

        if (discussionSrcEntityType) {
            modelToCreate.discussionSrcEntityType = discussionSrcEntityType;
        }

        // apply "parent"
        if (parent) {
            modelToCreate.parent = parent;
        }

        let createdThread: AnnouncementModel;

        try {
            createdThread = await api.createThread(modelToCreate, files, parent !== undefined, containerPath);
        } catch (err) {
            setError(resolveErrorMessage(err, 'thread', 'threads', 'create'));
        }

        setSubmitting(false);

        if (createdThread) {
            onCreate?.(createdThread);
        }
    }, [
        containerPath,
        model,
        discussionSrcIdentifier,
        discussionSrcEntityType,
        parent,
        nounSingular,
        api,
        files,
        onCreate,
    ]);

    const updateThread = useCallback(async () => {
        let updatedThread: AnnouncementModel;

        try {
            updatedThread = await api.updateThread(model, files, containerPath);
        } catch (err) {
            setError(resolveErrorMessage(err, 'thread', 'threads', 'update'));
        }

        setSubmitting(false);

        if (updatedThread) {
            onUpdate?.(updatedThread);
        }
    }, [api, containerPath, files, model, onUpdate]);

    const setBody = useCallback(
        (body, selectionStart?: number, selectionEnd?: number) => {
            // selectionStart / selectionEnd allow us to change the selected text and move the cursor.
            if (selectionStart !== undefined && selectionEnd !== undefined) {
                bodyInputRef.current.value = body;
                bodyInputRef.current.selectionStart = selectionStart;
                bodyInputRef.current.selectionEnd = selectionEnd;
                bodyInputRef.current.focus();
            }

            setModel({ ...model, body });
        },
        [model]
    );

    const handlePendingChange = useCallback(
        (hasPendingChange = false) => {
            setPendingChange?.(thread?.rowId ?? -1, hasPendingChange);
        },
        [setPendingChange, thread?.rowId]
    );

    const onBodyChange = useCallback(
        (event: ChangeEvent<HTMLTextAreaElement>) => {
            setError(undefined);
            setBody(event.target.value);
            handlePendingChange(!!event.target.value);
        },
        [setBody, handlePendingChange]
    );

    const handleCancel = useCallback(() => {
        onCancel?.();
        handlePendingChange();
    }, [thread?.rowId, onCancel, handlePendingChange]);

    const onSubmit = useCallback(() => {
        if (submitting) return;
        setSubmitting(true);
        if (isCreate) {
            createThread();
        } else {
            updateThread();
        }
        handlePendingChange();
    }, [createThread, isCreate, setSubmitting, submitting, updateThread, handlePendingChange]);

    const onKeyDown = useCallback(
        (evt: KeyboardEvent) => {
            if (evt.key === Key.ENTER) {
                if (evt.metaKey) {
                    onSubmit();
                } else {
                    const { selectionEnd, selectionStart, value } = bodyInputRef.current;
                    const [body, cursorPos] = handleBulletedListEnter(selectionStart, selectionEnd, value);

                    if (body !== undefined) {
                        // We're taking over the behavior now, so we cancel the conflicting default browser behavior.
                        evt.preventDefault();
                        setBody(body, cursorPos, cursorPos);
                    }
                }
            }
        },
        [onSubmit, setBody]
    );

    const [view, setView] = useState<EditorView>(EditorView.edit);

    return (
        <div className="thread-editor">
            <ThreadEditorToolbar inputRef={bodyInputRef} setBody={setBody} setView={setView} view={view} />

            {view === EditorView.edit && (
                <div className={classNames('form-group', { 'has-error': hasError })}>
                    <textarea
                        autoFocus
                        className="thread-editor__input form-control"
                        name="body"
                        onChange={onBodyChange}
                        onKeyDown={onKeyDown}
                        placeholder="Type your comment"
                        ref={bodyInputRef}
                        value={model.body}
                    />

                    {hasError && <span className="help-block">{error}</span>}
                </div>
            )}

            {view === EditorView.preview && (
                <Preview containerPath={containerPath} content={model.body} renderContent={api.renderContent} />
            )}

            <ThreadAttachments
                attachments={attachments}
                error={attachmentError}
                onRemove={openRemoveModal}
                containerPath={containerPath}
            />

            <button
                type="button"
                className="btn btn-default thread-editor__create-btn"
                disabled={submitDisabled}
                onClick={onSubmit}
            >
                {isCreate ? `Add ${nounSingular}` : 'Save Changes'}
            </button>

            <label className="thread-editor__attachment-input btn btn-default">
                <span className="fa fa-paperclip" />
                <input multiple onChange={onFileInputChange} type="file" />
            </label>

            <span className="clickable-text thread-editor__cancel-btn" onClick={handleCancel}>
                Cancel
            </span>

            {attachmentToRemove !== undefined && (
                <RemoveAttachmentModal
                    cancel={closeRemoveModal}
                    error={removeAttachmentError}
                    isRemoving={isRemoving}
                    name={attachmentToRemove}
                    remove={removeAttachment}
                />
            )}
        </div>
    );
};
