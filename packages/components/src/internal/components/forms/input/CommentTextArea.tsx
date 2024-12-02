import React, { FC, useCallback, useEffect, useRef, useState } from 'react';
import classNames from 'classnames';

export interface Props {
    actionName: string;
    containerClassName?: string;
    disabled?: boolean;
    inline?: boolean;
    maxLength?: number;
    onChange: (comment: string) => void;
    requiresUserComment?: boolean;
    resizable?: boolean;
    rows?: number;
    value?: string;
}

export const COMMENT_FIELD_ID = 'actionComments';

export const CommentTextArea: FC<Props> = props => {
    const {
        actionName,
        containerClassName = 'top-padding',
        disabled,
        inline,
        onChange,
        maxLength = 1000,
        requiresUserComment,
        rows,
        value,
    } = props;
    const label = `Reason for ${actionName}${requiresUserComment ? ' *' : ''}`;

    const [showError, setShowError] = useState<boolean>(false);
    const inputRef = useRef<HTMLTextAreaElement>();

    // borrowed from https://css-tricks.com/the-cleanest-trick-for-autogrowing-textareas/
    const onTextAreaInput = useCallback(() => {
        const textArea = inputRef.current;
        textArea.addEventListener('input', () => {
            textArea.style.height = 'auto';
            textArea.style.height = Math.min(92, textArea.scrollHeight) + 'px';
        });
    }, []);

    useEffect(() => {
        const textArea = inputRef.current;
        if (inline) {
            textArea.addEventListener('input', onTextAreaInput);
        }

        return () => {
            // always remove the event listener in case "inline" prop has changed
            textArea.removeEventListener('input', onTextAreaInput);
        };
    }, [inline, onTextAreaInput]);

    const onCommentChange = useCallback(
        event => {
            const _comment = event.target.value;
            // Not trimming here when checking length because it won't properly show an error if the user
            // has entered a new line as the last character, but the input will still impose the character limit.
            const tooLong = _comment.length > maxLength;
            setShowError(tooLong);
            if (!tooLong) {
                onChange(_comment);
            }
        },
        [maxLength, onChange]
    );

    return (
        <div className={containerClassName}>
            <label className={inline ? 'inline-comment-label' : ''} htmlFor={COMMENT_FIELD_ID}>
                {label}
            </label>
            <div className={classNames('form-group', { 'has-error': showError })}>
                <textarea
                    className="form-control"
                    id={COMMENT_FIELD_ID}
                    placeholder={'Enter reason ' + (requiresUserComment ? '(required)' : '(optional)')}
                    rows={rows ?? (inline ? 1 : 5)}
                    disabled={disabled}
                    onChange={onCommentChange}
                    maxLength={maxLength + 1} // allow an extra character, so we can trigger the error message
                    ref={inputRef}
                    value={value}
                />
                {showError && (
                    <span className="help-block">
                        Please limit your reason to {maxLength.toLocaleString()} characters.
                    </span>
                )}
            </div>
        </div>
    );
};

CommentTextArea.displayName = 'CommentTextArea';
