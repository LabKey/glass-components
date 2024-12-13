import React, { FC, memo, useCallback } from 'react';

import { MenuItem } from '../../dropdowns';
import { QueryColumn } from '../../../public/QueryColumn';

interface Props {
    column: QueryColumn;
    onClick: (column: QueryColumn) => void;
}

export const RemoveColumnMenuItem: FC<Props> = memo(({ column, onClick }) => {
    const onClick_ = useCallback(() => onClick(column), [column, onClick]);
    return <MenuItem onClick={onClick_}>Remove Column</MenuItem>;
});
