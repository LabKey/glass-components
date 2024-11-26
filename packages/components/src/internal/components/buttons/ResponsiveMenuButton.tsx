import React, { FC, memo, PropsWithChildren } from 'react';

import { DropdownButton, MenuHeader } from '../../dropdowns';

interface Props extends PropsWithChildren {
    asSubMenu?: boolean;
    className?: string;
    text: string;
}

export const ResponsiveMenuButton: FC<Props> = memo(({ asSubMenu, className, text, children }) => {
    if (asSubMenu) {
        return (
            <>
                <MenuHeader text={text} />
                {children}
            </>
        );
    }

    return (
        <DropdownButton className={className + ' responsive-menu'} title={text}>
            {children}
        </DropdownButton>
    );
});
