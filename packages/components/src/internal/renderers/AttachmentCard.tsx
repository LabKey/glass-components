import React, { FC, memo, useCallback, useMemo, useState } from 'react';
import classNames from 'classnames';

import { Modal } from '../Modal';
import { formatBytes, getIconFontCls, isImage } from '../util/utils';
import { isLoading, LoadingState } from '../../public/LoadingState';
import { LoadingSpinner } from '../components/base/LoadingSpinner';
import { DropdownMenu, MenuItem } from '../dropdowns';

const now = (): number => new Date().valueOf();

export interface IAttachment {
    created?: number;
    description?: string;
    fileIcon?: string;
    iconFontCls?: string;
    loadingState?: LoadingState;
    name: string;
    size?: number;
    title?: string;
    unavailable?: boolean;
}

export interface AttachmentCardProps {
    allowDownload?: boolean;
    allowRemove?: boolean;
    attachment: IAttachment;
    copyNoun?: string;
    imageCls?: string;
    imageURL?: string;
    noun?: string;
    onCopyLink?: (attachment: IAttachment) => void;
    onDownload?: (attachment: IAttachment) => void;
    onRemove?: (attachment: IAttachment) => void;
    outerCls?: string;
}

export const AttachmentCard: FC<AttachmentCardProps> = memo(props => {
    const {
        attachment,
        imageURL,
        imageCls,
        onCopyLink,
        onRemove,
        onDownload,
        outerCls = '',
        noun = 'attachment',
        copyNoun = 'link',
        allowRemove = true,
        allowDownload = true,
    } = props;
    const [showModal, setShowModal] = useState<boolean>();

    const _showModal = useCallback(() => {
        setShowModal(true);
    }, [setShowModal]);

    const _hideModal = useCallback(() => {
        setShowModal(false);
    }, [setShowModal]);

    const _onCopyLink = useCallback((): void => onCopyLink(attachment), [attachment, onCopyLink]);

    const _onDownload = useCallback((): void => {
        if (allowDownload) {
            onDownload?.(attachment);
        }
    }, [allowDownload, attachment, onDownload]);

    const _onRemove = useCallback(() => {
        if (allowRemove) {
            onRemove?.(attachment);
        }
    }, [allowRemove, attachment, onRemove]);

    const showMenu = useMemo(() => {
        return ((onCopyLink || allowDownload) && !attachment?.unavailable) || allowRemove;
    }, [onCopyLink, allowDownload, attachment, allowRemove]);

    if (!attachment) {
        return null;
    }

    const { iconFontCls, loadingState, name, title, size, description, unavailable } = attachment;
    const _iconFontCls = iconFontCls ?? getIconFontCls(name);
    const isLoaded = !isLoading(loadingState);
    const recentlyCreated = attachment.created ? attachment.created > now() - 30000 : false;
    const _isImage = isImage(attachment.name);
    const modalTitle = (
        <a onClick={_onDownload} className="clickable" title={'Download ' + noun}>
            {title ?? name}
        </a>
    );

    return (
        <>
            <div
                className={classNames('attachment-card ' + outerCls, {
                    'attachment-unavailable': unavailable,
                    'attachment-unavailable-wide': unavailable && !showMenu,
                })}
                title={name + (unavailable ? ' (unavailable)' : '')}
            >
                <div
                    className="attachment-card__body"
                    onClick={isLoaded && !unavailable ? (_isImage ? _showModal : _onDownload) : undefined}
                >
                    <div className="attachment-card__icon">
                        {_isImage && !isLoaded && <LoadingSpinner msg="" />}
                        {_isImage && isLoaded && !unavailable && (
                            <img className={`attachment-card__icon_img ${imageCls}`} src={imageURL} alt={name} />
                        )}
                        {(!_isImage || unavailable) && <i className={`attachment-card__icon_tile ${_iconFontCls}`} />}
                    </div>
                    <div className="attachment-card__content">
                        <div className="attachment-card__name">{title ?? name}</div>
                        <div className="attachment-card__size">
                            {!isLoaded && <LoadingSpinner msg="Uploading..." />}
                            {isLoaded && recentlyCreated && (
                                <>
                                    <i className="fa fa-check-circle" /> File attached
                                </>
                            )}
                            {isLoaded && !recentlyCreated && size && formatBytes(size)}
                        </div>
                        {description && <div className="attachment-card__description">{description}</div>}
                    </div>
                </div>
                {isLoaded && showMenu && (
                    <DropdownMenu
                        className="attachment-card__menu"
                        title={<i className="fa fa-ellipsis-v" />}
                        pullRight
                    >
                        {onCopyLink && !unavailable && <MenuItem onClick={_onCopyLink}>Copy {copyNoun}</MenuItem>}
                        {allowDownload && !unavailable && <MenuItem onClick={_onDownload}>Download</MenuItem>}
                        {allowRemove && <MenuItem onClick={_onRemove}>Remove {noun}</MenuItem>}
                    </DropdownMenu>
                )}
            </div>

            {showModal && (
                <Modal bsSize="lg" cancelText="Dismiss" onCancel={_hideModal} title={modalTitle}>
                    <img src={imageURL} alt={`${name} image`} title={name} className="attachment-card__img_modal" />
                </Modal>
            )}
        </>
    );
});
