import React, { FC, memo } from 'react';

import { ActionButton, ActionButtonProps } from './ActionButton';

export interface AddEntityButtonProps extends ActionButtonProps {
    asButton?: boolean;
    entity: string;
}

export const AddEntityButton: FC<AddEntityButtonProps> = memo(({ entity, asButton = true, ...actionButtonProps }) => {
    const content = (
        <>
            <i className="fa fa-plus-circle container--addition-icon" /> Add {entity}
        </>
    );

    if (!asButton) {
        return content;
    }

    return <ActionButton {...actionButtonProps}>{content}</ActionButton>;
});

AddEntityButton.displayName = 'AddEntityButton';
