import React, { FC, memo } from 'react';

import { CommentTextArea } from '../forms/input/CommentTextArea';
import { useDataChangeCommentsRequired } from '../forms/input/useDataChangeCommentsRequired';

interface Props {
    comment?: string;
    discardTitle?: string;
    onCommentChange?: (comment: string) => void;
    shouldDiscard: boolean;
    toggleShouldDiscard: () => void;
}

export const DISCARD_CONSUMED_CHECKBOX_FIELD = 'discardcheckbox';

export const DiscardConsumedSamplesPanel: FC<Props> = memo(props => {
    const {
        discardTitle = 'Remove Sample(s) from Storage?',
        shouldDiscard,
        toggleShouldDiscard,
        onCommentChange,
        comment,
    } = props;
    const { requiresUserComment } = useDataChangeCommentsRequired();

    // TODO: Make clicking the discardTitle check the checkbox!
    return (
        <>
            <div className="form-group">
                <label className="form-check">
                    <input
                        className="form-check-input"
                        type="checkbox"
                        id={DISCARD_CONSUMED_CHECKBOX_FIELD}
                        name={DISCARD_CONSUMED_CHECKBOX_FIELD}
                        onChange={toggleShouldDiscard}
                        checked={shouldDiscard}
                    />
                    <span className="discard-consumed-title"> {discardTitle}</span>
                </label>
            </div>
            {onCommentChange && (
                <CommentTextArea
                    onChange={onCommentChange}
                    disabled={!shouldDiscard}
                    actionName="Removing"
                    containerClassName="top-padding bottom-padding"
                    requiresUserComment={requiresUserComment}
                    value={comment}
                />
            )}
        </>
    );
});

DiscardConsumedSamplesPanel.displayName = 'DiscardConsumedSamplesPanel';
