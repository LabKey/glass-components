import React, { FC, memo } from 'react';
import { Alert } from '../base/Alert';

interface Props {
    archived: boolean;
}

export const ArchivedFolderTag: FC<Props> = memo((archived) => {
    if (!archived)
        return null;
    return <Alert className="folder-field_archived-tag">Archived</Alert>;
});
