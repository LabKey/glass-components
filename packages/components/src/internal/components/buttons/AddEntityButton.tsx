import React, { FC, memo } from 'react';

import { ActionButton, ActionButtonProps } from './ActionButton';

export interface AddEntityElementProps {
    entity: string;
    isAnother?: boolean;
}

export const AddEntityElement: FC<AddEntityElementProps> = memo(({ entity }) => {
    return (
        <>
            <i className="fa fa-plus-circle container--addition-icon" /> Add {entity}
        </>
    );
});

AddEntityElement.displayName = 'AddEntityElement';

export interface AddEntityButtonProps extends ActionButtonProps, AddEntityElementProps {}

export const AddEntityButton: FC<AddEntityButtonProps> = memo(({ isAnother, entity, ...actionButtonProps }) => {
    return (
        <ActionButton {...actionButtonProps}>
            <AddEntityElement isAnother={isAnother} entity={entity} />
        </ActionButton>
    );
});

AddEntityButton.displayName = 'AddEntityButton';
