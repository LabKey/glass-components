import React, { FC, memo } from 'react';
import { Iterable, Map } from 'immutable';

import { useServerContext } from '../components/base/ServerContext';
import { getArchivedFolders } from '../app/utils';
import { ArchivedFolderTag } from '../components/folder/ArchivedFolderTag';

export interface FolderColumnRendererProps {
    className?: string;
    data: Map<any, any> | { [key: string]: any };
}

export const FolderColumnRenderer: FC<FolderColumnRendererProps> = memo(({ data, className = 'ws-pre-wrap' }) => {
    const { moduleContext } = useServerContext();
    const archivedFolders = getArchivedFolders(moduleContext);
    let archived = false;
    let displayValue = null;
    let value = null;
    if (data) {
        if (Iterable.isIterable(data)) {
            value = data.get('value');
            displayValue = data.get('displayValue');
        } else if (data['value']) {
            value = data['value'];
            displayValue = data['displayValue'];
        } else if (typeof data === 'string') {
            value = data;
        }

        displayValue = displayValue ?? value;
    }

    if (value) archived = archivedFolders?.indexOf(value) > -1;

    return (
        <span className={className}>
            {displayValue}
            <ArchivedFolderTag archived={archived} />
        </span>
    );
});

FolderColumnRenderer.displayName = 'FolderColumnRenderer';
