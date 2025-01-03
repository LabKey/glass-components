import React, { FC, memo, useCallback, useEffect, useMemo, useState } from 'react';

import { PermissionTypes } from '@labkey/api';

import { User } from '../../internal/components/base/models/User';
import { RequiresPermission } from '../../internal/components/base/Permissions';
import { DropdownButton, MenuItem } from '../../internal/dropdowns';
import { ImportTemplate } from '../QueryInfo';
import { LoadingSpinner } from '../../internal/components/base/LoadingSpinner';
import { SchemaQuery } from '../SchemaQuery';
import { useAppContext } from '../../internal/AppContext';
import { downloadAttachment } from '../../internal/util/utils';
import { DisableableMenuItem } from '../../internal/components/samples/DisableableMenuItem';
import { useServerContext } from '../../internal/components/base/ServerContext';
import { getAppHomeFolderPath } from '../../internal/app/utils';

interface Props {
    className?: string;
    defaultTemplateUrl?: string;
    isGridRenderer?: boolean;
    onDownloadDefault?: () => void;
    schemaQuery?: SchemaQuery;
    text?: string;
    user?: User;
    dropDownClassName?: string;
}

export const TemplateDownloadButton: FC<Props> = memo(props => {
    const {
        schemaQuery,
        isGridRenderer,
        className,
        onDownloadDefault,
        defaultTemplateUrl,
        text = 'Template',
        user,
        dropDownClassName,
    } = props;
    const [customTemplates, setCustomTemplates] = useState<ImportTemplate[]>();
    const [loadingTemplates, setLoadingTemplates] = useState<boolean>(false);
    const { container, moduleContext } = useServerContext();
    const homeFolderPath = getAppHomeFolderPath(container, moduleContext);

    const { api } = useAppContext();

    useEffect(() => {
        if (!schemaQuery || isGridRenderer || customTemplates) return;

        (async () => {
            await loadTemplates();
        })();
    }, [schemaQuery, isGridRenderer, customTemplates]);

    const loadTemplates = useCallback(async (): Promise<boolean> => {
        try {
            setLoadingTemplates(true);
            const queryInfo = await api.query.getQueryDetails({
                schemaName: schemaQuery.schemaName,
                queryName: schemaQuery.queryName,
                containerPath: homeFolderPath
            });
            const customTemplates_ = queryInfo.getCustomTemplates();
            setCustomTemplates(customTemplates_);
            return customTemplates_?.length > 0;
        } catch (reason) {
            console.error(reason);
        } finally {
            setLoadingTemplates(false);
        }
    }, [schemaQuery, setLoadingTemplates, setCustomTemplates, homeFolderPath]);

    const showDropdown = useMemo(() => {
        return customTemplates?.length > 0 || (isGridRenderer && !customTemplates);
    }, [customTemplates, isGridRenderer]);

    const fetchTemplates = useCallback(async () => {
        if (customTemplates || !isGridRenderer) return;
        const hasCustomTemplates = await loadTemplates();
        if (!hasCustomTemplates) {
            if (onDownloadDefault)
                onDownloadDefault();
            else
                downloadAttachment(defaultTemplateUrl, true);
        }
    }, [isGridRenderer, onDownloadDefault, customTemplates, loadTemplates, defaultTemplateUrl]);

    const dropdownTitle = useMemo(() => {
        return (
            <span title="Download Template">
                <span className="fa fa-download" /> {text}
            </span>
        );
    }, [text]);

    if (!onDownloadDefault && !defaultTemplateUrl?.length && !showDropdown) return null;

    return (
        <RequiresPermission perms={[PermissionTypes.Insert, PermissionTypes.Update]} permissionCheck="any" user={user}>
            {!showDropdown && (
                <a
                    className={'btn btn-info ' + (className ?? '')}
                    title="Download Template"
                    onClick={onDownloadDefault}
                    href={defaultTemplateUrl}
                    rel="noopener noreferrer"
                    target="_blank"
                >
                    <span className="fa fa-download" /> {text}
                </a>
            )}
            {showDropdown && (
                <DropdownButton
                    onClick={fetchTemplates}
                    title={dropdownTitle}
                    bsStyle="info"
                    noCaret={!customTemplates || customTemplates.length === 0}
                    className="small-right-spacing"
                    buttonClassName={dropDownClassName ?? (isGridRenderer ? 'button-small-padding' : '')}
                >
                    {customTemplates?.length > 0 && (
                        <MenuItem
                            key={0}
                            href={defaultTemplateUrl}
                            onClick={onDownloadDefault}
                            rel="noopener noreferrer"
                            target="_blank"
                        >
                            Default Template
                        </MenuItem>
                    )}
                    {loadingTemplates && <LoadingSpinner />}
                    {customTemplates?.map((template, ind) => {
                        if (template.url.endsWith('(unavailable)'))
                            return (
                                <DisableableMenuItem disabled disabledMessage="File not found">
                                    {template.label}
                                </DisableableMenuItem>
                            );

                        return (
                            <MenuItem key={ind + 1} href={template.url} rel="noopener noreferrer" target="_blank">
                                {template.label}
                            </MenuItem>
                        );
                    })}
                </DropdownButton>
            )}
        </RequiresPermission>
    );
});

TemplateDownloadButton.displayName = 'TemplateDownloadButton';
