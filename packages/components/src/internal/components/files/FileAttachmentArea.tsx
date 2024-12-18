import React, { ChangeEvent, DragEvent, FC, memo, useCallback, useState } from 'react';
import classNames from 'classnames';

import { cancelEvent } from '../../events';

interface SimpleFileAttachmentContainerProps {
    compact?: boolean;
    onAttach: (files: File[]) => void;
}

/**
 * This component looks like the FileAttachmentContainer, but does significantly less. It only renders the file drop
 * area/input, it does not render attached files. This is useful if you render attached files separately from your
 * attachment area, such as in cases where files are automatically uploaded.
 */
export const FileAttachmentArea: FC<SimpleFileAttachmentContainerProps> = memo(({ onAttach, compact }) => {
    const [highlight, setHighlight] = useState<boolean>(false);
    const onChange = useCallback(
        (evt: ChangeEvent<HTMLInputElement>) => {
            cancelEvent(evt);
            onAttach(Array.from(evt.target.files));
        },
        [onAttach]
    );
    const onDrag = useCallback((evt: DragEvent) => {
        cancelEvent(evt);
        setHighlight(true);
    }, []);
    const onDragLeave = useCallback((evt: DragEvent) => {
        cancelEvent(evt);
        setHighlight(false);
    }, []);
    const onDrop = useCallback(
        (evt: DragEvent) => {
            cancelEvent(evt);
            setHighlight(false);
            if (evt.dataTransfer?.files) {
                onAttach(Array.from(evt.dataTransfer.files));
            }
        },
        [onAttach]
    );

    return (
        <div className="file-attachment-area" onDrop={onDrop}>
            <div className="file-upload__container">
                <label
                    className={classNames({
                        'file-upload__label': !compact,
                        'file-upload__label--compact': compact,
                        'file-upload__is-hover': highlight,
                    })}
                    htmlFor="simple-file-attachment-container"
                    onDragEnter={onDrag}
                    onDragLeave={onDragLeave}
                    onDragOver={onDrag}
                    onDrop={onDrop}
                >
                    <span className={classNames('fa fa-cloud-upload', { 'fa-2x': !compact })} aria-hidden="true" />{' '}
                    Select file or drag and drop here
                </label>
                <input
                    className="file-upload__input"
                    id="simple-file-attachment-container"
                    multiple
                    onChange={onChange}
                    type="file"
                />
            </div>
        </div>
    );
});
