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
    getExtraTemplates?: () => Promise<ImportTemplate[]>;
    onDownloadDefault?: () => void;
    schemaQuery?: SchemaQuery;
    text?: string;
    user?: User;
}

export const TemplateDownloadButton: FC<Props> = memo(props => {
    const {
        schemaQuery,
        getExtraTemplates,
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
        if (!schemaQuery) return;

        (async () => {
            try {
                setLoadingTemplates(true);
                const queryInfo = await api.query.getQueryDetails({
                    schemaName: schemaQuery.schemaName,
                    queryName: schemaQuery.queryName,
                });
                setCustomTemplates(queryInfo.getCustomTemplates());
            } catch (reason) {
                console.error(reason);
            } finally {
                setLoadingTemplates(false);
            }
        })();
    }, [schemaQuery, setLoadingTemplates]);

    const showDropdown = useMemo(() => {
        return customTemplates?.length > 0 || (!!getExtraTemplates && !customTemplates);
    }, [customTemplates, getExtraTemplates]);

    const fetchTemplates = useCallback(async () => {
        if (customTemplates || !getExtraTemplates) return;
        setLoadingTemplates(true);
        const templates_ = await getExtraTemplates();
        setCustomTemplates(templates_ ?? []);
        if (!templates_ || templates_.length === 0) onDownloadDefault();
        setLoadingTemplates(false);
    }, [getExtraTemplates, onDownloadDefault, customTemplates, setLoadingTemplates]);

    const dropdownTitle = useMemo(() => {
        return (
            <>
                <span className="fa fa-download" /> {text}
            </>
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
                    buttonClassName={getExtraTemplates ? 'button-small-padding' : ''}
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
                    {customTemplates?.map((template, ind) => (
                        <MenuItem key={ind + 1} href={template.url} rel="noopener noreferrer" target="_blank">
                            {template.label}
                        </MenuItem>
                    ))}
                </DropdownButton>
            )}
        </RequiresPermission>
    );
});

TemplateDownloadButton.displayName = 'TemplateDownloadButton';
