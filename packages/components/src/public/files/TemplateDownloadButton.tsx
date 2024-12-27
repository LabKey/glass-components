import React, { FC, memo, useCallback, useEffect, useMemo, useState } from 'react';

import { PermissionTypes } from '@labkey/api';

import { User } from '../../internal/components/base/models/User';
import { RequiresPermission } from '../../internal/components/base/Permissions';
import { DropdownButton, MenuItem } from '../../internal/dropdowns';
import { ImportTemplate } from '../QueryInfo';
import { LoadingSpinner } from '../../internal/components/base/LoadingSpinner';
import { SchemaQuery } from '../SchemaQuery';
import { useAppContext } from '../../internal/AppContext';

interface Props {
    className?: string;
    defaultTemplateUrl?: string;
    onDownloadDefault?: () => void;
    schemaQuery?: SchemaQuery;
    isGridRenderer?: boolean;
    text?: string;
    user?: User;
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
    } = props;
    const [customTemplates, setCustomTemplates] = useState<ImportTemplate[]>();
    const [loadingTemplates, setLoadingTemplates] = useState<boolean>(false);
    const { api } = useAppContext();

    useEffect(() => {
        if (!schemaQuery || isGridRenderer) return;

        (async () => {
            await loadTemplates();
        })();
    }, [schemaQuery, setLoadingTemplates, isGridRenderer]);

    const loadTemplates = useCallback(async () : Promise<boolean> => {
        try {
            setLoadingTemplates(true);
            const queryInfo = await api.query.getQueryDetails({
                schemaName: schemaQuery.schemaName,
                queryName: schemaQuery.queryName,
            });
            const customTemplates_ = queryInfo.getCustomTemplates();
            setCustomTemplates(customTemplates_);
            return customTemplates_?.length > 0;
        }
        catch (reason) {
            console.error(reason);
        }
        finally {
            setLoadingTemplates(false);
        }
    }, [schemaQuery, setLoadingTemplates]);

    const showDropdown = useMemo(() => {
        return customTemplates?.length > 0 || (isGridRenderer && !customTemplates);
    }, [customTemplates, isGridRenderer]);

    const fetchTemplates = useCallback(async () => {
        if (customTemplates || !isGridRenderer) return;
        const hasCustomTemplates = await loadTemplates();
        if (!hasCustomTemplates) onDownloadDefault();
    }, [isGridRenderer, onDownloadDefault, customTemplates, setLoadingTemplates]);

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
                    className={'btn btn-info ' + className}
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
                    buttonClassName={isGridRenderer ? 'button-small-padding' : ''}
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
                        if (template.url.endsWith("(unavailable)"))
                            return (
                                <MenuItem disabled key={ind + 1} title="File not found">
                                    {template.label}
                                </MenuItem>
                            );

                            return (
                                <MenuItem key={ind + 1} href={template.url} rel="noopener noreferrer" target="_blank">
                                    {template.label}
                                </MenuItem>
                            );
                        }
                    )}
                </DropdownButton>
            )}
        </RequiresPermission>
    );
});

TemplateDownloadButton.displayName = 'TemplateDownloadButton';
