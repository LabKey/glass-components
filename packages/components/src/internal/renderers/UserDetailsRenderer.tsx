import React, { FC, memo } from 'react';
import { Map } from 'immutable';

import { UserLink } from '../components/user/UserLink';
import { getDataStyling } from '../util/utils';
import { isConditionalFormattingEnabled } from '../app/utils';
import { useServerContext } from '../components/base/ServerContext';

interface Props {
    data: Map<any, any>;
}

export const UserDetailsRenderer: FC<Props> = memo(({ data }) => {
    const { moduleContext } = useServerContext();
    if (!data) return null;

    const { displayValue, value } = data.toJS();
    const style = isConditionalFormattingEnabled(moduleContext) ? getDataStyling(data) : undefined;
    const className = style?.backgroundColor && displayValue ? 'status-pill' : undefined;

    return (
        <span className={className} style={style}>
            <UserLink userId={value} userDisplayValue={displayValue} />
        </span>
    );
});
