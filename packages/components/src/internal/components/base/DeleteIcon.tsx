import React, { FC, memo } from 'react';

interface Props {
    className?: string;
    iconCls?: string;
    id?: string;
    onDelete: (event) => void;
    title?: string;
}

export const DeleteIcon: FC<Props> = memo(({ id, title = 'Delete this item', className = 'field-icon', onDelete, iconCls = 'field-delete' }) => (
    <span id={id} title={title} className={className} onClick={onDelete}>
        <span className={`fa fa-times-circle ${iconCls}`} />
    </span>
));
