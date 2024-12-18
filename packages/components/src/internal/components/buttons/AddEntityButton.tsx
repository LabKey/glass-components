import React, { FC, memo } from 'react';

import { ActionButton, ActionButtonProps } from './ActionButton';

export interface AddEntityButtonProps extends ActionButtonProps {
    entity: string;
}

export const AddEntityButton: FC<AddEntityButtonProps> = memo(({ entity, ...actionButtonProps }) => {
    return (
        <ActionButton {...actionButtonProps}>
            <i className="fa fa-plus-circle container--addition-icon" /> Add {entity}
        </ActionButton>
    );
});

AddEntityButton.displayName = 'AddEntityButton';

export interface AddEntityElementProps {
    entity: string;
}

export const AddEntityElement: FC<AddEntityElementProps> = memo(({ entity }) => {
    return (
        <>
            <i className="fa fa-plus-circle container--addition-icon" /> Add {entity}
        </>
    );
});

AddEntityElement.displayName = 'AddEntityElement';
