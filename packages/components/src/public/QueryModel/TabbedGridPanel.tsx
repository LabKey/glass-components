/*
 * Copyright (c) 2019 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import React, { FC, memo, useCallback, useState } from 'react';
import classNames from 'classnames';

import { ExportModal } from '../../internal/components/gridbar/ExportModal';
import { EXPORT_TYPES } from '../../internal/constants';
import { exportTabsXlsx } from '../../internal/actions';

import { useNotificationsContext } from '../../internal/components/notifications/NotificationsContext';

import { GridPanel, GridPanelProps } from './GridPanel';
import { InjectedQueryModels } from './withQueryModels';
import { QueryModel } from './QueryModel';
import { getQueryModelExportParams } from './utils';

interface GridTabProps {
    isActive: boolean;
    model: QueryModel;
    onSelect: (id: string) => void;
    pullRight: boolean;
    showRowCount: boolean;
}

const GridTab: FC<GridTabProps> = memo(({ isActive, model, onSelect, pullRight, showRowCount }) => {
    const { id, queryInfo, rowCount, title } = model;
    const className = classNames({
        active: isActive,
        'pull-right': pullRight,
        'no-data': showRowCount && !rowCount,
    });
    const onClick = useCallback(() => onSelect(id), [id, onSelect]);

    return (
        <li className={className}>
            <a onClick={onClick}>
                {title || queryInfo?.queryLabel || queryInfo?.name}
                {showRowCount && rowCount !== undefined && <> ({rowCount})</>}
            </a>
        </li>
    );
});

export interface TabbedGridPanelProps<T = {}> extends GridPanelProps<T> {
    /**
     * The id of the model you want to render. Required if you are using onTabSelect. If passed when not using
     * onTabSelect it will be used as the initial active tab.
     */
    activeModelId?: string;
    /**
     * Defaults to true. Determines if we allow the grid view to be customized (e.g., columns added, removed, or relabeled)
     */
    allowViewCustomization?: boolean;
    /**
     * By default, if there is only one model, the tabs will not be shown.  Setting this to true will show the tab
     * even if there is only one model.
     */
    alwaysShowTabs?: boolean;
    /**
     * Defaults to true. Determines if we render the TabbedGridPanel as a Bootstrap panel.
     */
    asPanel?: boolean;
    /**
     * Optional value to use as the filename prefix for the exported file, otherwise will default to 'Data'
     */
    exportFilename?: string;
    getAdvancedExportOptions?: (tabId: string) => { [key: string]: any };
    /**
     * Optional, if used the TabbedGridPanel will act as a controlled component, requiring you to always pass the
     * activeModelId. If not passed the TabbedGridPanel will maintain the activeModelId state internally.
     * @param string
     */
    onTabSelect?: (modelId: string) => void;
    /**
     * The model IDs you want to render as tabs that are pulled to the right side of the tabs.
     */
    rightTabs?: string[];
    /**
     * Display the rowCount for each QueryModel as a part of the tab title. In order for this to display properly
     * for all tabs you'll need to ensure that all models are loaded upon rendering the TabbedGridPanel.
     * Defaults to false.
     */
    showRowCountOnTabs?: boolean;
    /**
     * Array of model ids representing the order you want the tabs in. This component will only render Tabs and
     * GridPanels for Query Models in the TabOrder array.
     */
    tabOrder: string[];

    /**
     * The title to render, only used if asPanel is true.
     */
    title?: string;
}

export const TabbedGridPanel: FC<TabbedGridPanelProps & InjectedQueryModels> = memo(props => {
    const {
        activeModelId,
        actions,
        allowViewCustomization = true,
        alwaysShowTabs,
        asPanel = true,
        onTabSelect,
        queryModels,
        rightTabs = [],
        showRowCountOnTabs,
        tabOrder,
        onExport,
        exportFilename,
        advancedExportOptions,
        getAdvancedExportOptions,
        ...rest
    } = props;
    const { createNotification } = useNotificationsContext();
    const [internalActiveId, setInternalActiveId] = useState<string>(activeModelId ?? tabOrder[0]);
    const [showExportModal, setShowExportModal] = useState<boolean>(false);
    const [canExport, setCanExport] = useState<boolean>(true);
    const onSelect = useCallback(
        (modelId: string) => {
            if (onTabSelect !== undefined) {
                onTabSelect(modelId);
            } else {
                setInternalActiveId(modelId);
            }
        },
        [onTabSelect]
    );

    const exportTabs = useCallback(
        async (selectedTabs: string[] | Set<string>) => {
            try {
                // set exporting blocker
                setCanExport(false);
                const models = [];
                selectedTabs.forEach(selected => {
                    const selectedModel = queryModels[selected];
                    let exportOptions = { ...advancedExportOptions };
                    if (getAdvancedExportOptions) exportOptions = { ...getAdvancedExportOptions(selected) };
                    const tabForm = getQueryModelExportParams(selectedModel, EXPORT_TYPES.EXCEL, {
                        ...exportOptions,
                        sheetName: selectedModel.title,
                    });
                    models.push(tabForm);
                });
                const filename = exportFilename ?? 'Data';
                await exportTabsXlsx(filename, models);
                onExport?.[EXPORT_TYPES.EXCEL]?.();
                createNotification({ message: 'Successfully exported tabs to file.', alertClass: 'success' });
            } catch (e) {
                // Set export error
                createNotification({ message: 'Export failed: ' + e, alertClass: 'danger' });
            } finally {
                // unset exporting blocker
                setCanExport(true);
                setShowExportModal(false);
            }
        },
        [exportFilename, canExport, createNotification, queryModels, advancedExportOptions, getAdvancedExportOptions]
    );

    const excelExportHandler = useCallback(async () => {
        if (Object.keys(tabOrder).length > 1) {
            setShowExportModal(true);
            return;
        }

        await exportTabs([internalActiveId]);
    }, [tabOrder, exportTabs, internalActiveId]);

    const exportHandlers = { ...onExport, [EXPORT_TYPES.EXCEL]: excelExportHandler };

    const closeExportModal = useCallback(() => {
        setShowExportModal(false);
    }, []);

    // If the component is passed onTabSelect we will only honor the activeModelId passed to this component.
    let activeId = onTabSelect === undefined ? internalActiveId : activeModelId;

    // Default activeId if current activeId not in tabOrder
    activeId = tabOrder.indexOf(activeId) === -1 ? tabOrder[0] : activeId;

    const activeModel = queryModels[activeId];
    const hasTabs = tabOrder.length > 1 || alwaysShowTabs;

    const gridDisplay = (
        <GridPanel
            allowViewCustomization={allowViewCustomization}
            key={activeId}
            actions={actions}
            hasHeader={!hasTabs}
            asPanel={!hasTabs}
            model={activeModel}
            onExport={exportHandlers}
            advancedExportOptions={
                getAdvancedExportOptions ? getAdvancedExportOptions(activeId) : advancedExportOptions
            }
            {...rest}
        />
    );

    return (
        <>
            {hasTabs && (
                <div className={classNames('tabbed-grid-panel', { panel: asPanel, 'panel-default': asPanel })}>
                    <div className={classNames('tabbed-grid-panel__body', { 'panel-body': asPanel })}>
                        {hasTabs && (
                            <ul className="nav nav-tabs">
                                {tabOrder.map(modelId => {
                                    if (queryModels[modelId]) {
                                        return (
                                            <GridTab
                                                key={modelId}
                                                model={queryModels[modelId]}
                                                isActive={activeId === modelId}
                                                onSelect={onSelect}
                                                pullRight={rightTabs.indexOf(modelId) > -1}
                                                showRowCount={showRowCountOnTabs}
                                            />
                                        );
                                    } else {
                                        return null;
                                    }
                                })}
                            </ul>
                        )}
                        {gridDisplay}
                    </div>
                </div>
            )}
            {!hasTabs && <>{gridDisplay}</>}
            {showExportModal && !!queryModels && (
                <ExportModal
                    queryModels={queryModels}
                    tabOrder={tabOrder}
                    onClose={closeExportModal}
                    onExport={exportTabs}
                    canExport={canExport}
                />
            )}
        </>
    );
});
