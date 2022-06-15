import React, { ComponentType, FC, memo, PureComponent, ReactNode, useCallback, useMemo, useState } from 'react';
import classNames from 'classnames';
import { fromJS, List, Set } from 'immutable';
import { Filter, getServerContext, Query } from '@labkey/api';

import { MenuItem, SplitButton } from 'react-bootstrap';

import {
    Actions,
    Alert,
    DataViewInfoTypes,
    EXPORT_TYPES,
    Grid,
    GRID_CHECKBOX_OPTIONS,
    GridColumn,
    LoadingSpinner,
    Pagination,
    QueryColumn,
    QueryConfig,
    QueryInfo,
    QuerySort,
    useServerContext,
    ViewInfo,
} from '../..';
import { GRID_SELECTION_INDEX } from '../../internal/constants';
import { DataViewInfo } from '../../internal/models';
import { headerCell, headerSelectionCell, isFilterColumnNameMatch } from '../../internal/renderers';

import { getGridView, revertViewEdit, saveGridView, saveAsSessionView, saveSessionView } from '../../internal/actions';

import { hasServerContext } from '../../internal/components/base/ServerContext';

import { ActionValue } from './grid/actions/Action';
import { FilterAction } from './grid/actions/Filter';
import { SearchAction } from './grid/actions/Search';
import { SortAction } from './grid/actions/Sort';
import { ViewAction } from './grid/actions/View';

import { getSearchValueAction } from './grid/utils';
import { Change, ChangeType } from './grid/model';

import { createQueryModelId, QueryModel } from './QueryModel';
import { InjectedQueryModels, RequiresModelAndActions, withQueryModels } from './withQueryModels';
import { ViewMenu } from './ViewMenu';
import { ExportMenu } from './ExportMenu';
import { SelectionStatus } from './SelectionStatus';
import { ChartMenu } from './ChartMenu';
import { SearchBox } from './SearchBox';

import { actionValuesToString, filtersEqual, sortsEqual } from './utils';
import { GridFilterModal } from './GridFilterModal';
import { FiltersButton } from './FiltersButton';
import { FilterStatus } from './FilterStatus';
import { SaveViewModal } from './SaveViewModal';
import { CustomizeGridViewModal } from './CustomizeGridViewModal';
import { isCustomizeViewsInAppEnabled } from '../../internal/app/utils';

export interface GridPanelProps<ButtonsComponentProps> {
    ButtonsComponent?: ComponentType<ButtonsComponentProps & RequiresModelAndActions>;
    ButtonsComponentRight?: ComponentType<ButtonsComponentProps & RequiresModelAndActions>;
    advancedExportOptions?: { [key: string]: any };
    allowFiltering?: boolean;
    allowSelections?: boolean;
    allowSorting?: boolean;
    allowViewCustomization?: boolean;
    asPanel?: boolean;
    buttonsComponentProps?: ButtonsComponentProps;
    emptyText?: string;
    getEmptyText?: (model: QueryModel) => string;
    getFilterDisplayValue?: (columnName: string, rawValue: string) => string;
    hasHeader?: boolean;
    hideEmptyChartMenu?: boolean;
    hideEmptyViewMenu?: boolean;
    highlightLastSelectedRow?: boolean;
    loadOnMount?: boolean;
    onChartClicked?: (chart: DataViewInfo) => boolean;
    onCreateReportClicked?: (type: DataViewInfoTypes) => void;
    onExport?: { [key: string]: () => any };
    pageSizes?: number[];
    showButtonBar?: boolean;
    showChartMenu?: boolean;
    showExport?: boolean;
    showFilterStatus?: boolean;
    showFiltersButton?: boolean;
    showHeader?: boolean;
    showPagination?: boolean;
    showSampleComparisonReports?: boolean;
    showSearchInput?: boolean;
    showViewMenu?: boolean;
    supportedExportTypes?: Set<EXPORT_TYPES>;
    title?: string;
}

type Props<T> = GridPanelProps<T> & RequiresModelAndActions;

interface GridBarProps<T> extends Props<T> {
    actionValues: ActionValue[];
    onFilter: () => void;
    onSaveView: () => void;
    onSearch: (token: string) => void;
    onViewSelect: (viewName: string) => void;
    onCustomizeView: () => void;
}

class ButtonBar<T> extends PureComponent<GridBarProps<T>> {
    loadFirstPage = (): void => {
        const { model, actions } = this.props;
        actions.loadFirstPage(model.id);
    };

    loadLastPage = (): void => {
        const { model, actions } = this.props;
        actions.loadLastPage(model.id);
    };

    loadNextPage = (): void => {
        const { model, actions } = this.props;
        actions.loadNextPage(model.id);
    };

    loadPreviousPage = (): void => {
        const { model, actions } = this.props;
        actions.loadPreviousPage(model.id);
    };

    setPageSize = (pageSize: number): void => {
        const { model, actions } = this.props;
        actions.setMaxRows(model.id, pageSize);
    };

    render(): ReactNode {
        const {
            actionValues,
            allowViewCustomization,
            model,
            actions,
            advancedExportOptions,
            ButtonsComponent,
            ButtonsComponentRight,
            hideEmptyChartMenu,
            hideEmptyViewMenu,
            onChartClicked,
            onCreateReportClicked,
            onCustomizeView,
            onExport,
            onFilter,
            onSearch,
            onSaveView,
            onViewSelect,
            pageSizes,
            showChartMenu,
            showExport,
            showFiltersButton,
            showPagination,
            showSampleComparisonReports,
            showSearchInput,
            showViewMenu,
            supportedExportTypes,
        } = this.props;

        const { hasRows, queryInfo, queryInfoError, rowsError, selectionsError } = model;
        const hasError = queryInfoError !== undefined || rowsError !== undefined || selectionsError !== undefined;
        const paginate = showPagination && hasRows && !hasError;
        const canExport = showExport && !hasError;
        // Don't disable view selection when there is an error because it's possible the error may be caused by the view
        const canSelectView = showViewMenu && queryInfo !== undefined;
        const buttonsComponentProps = this.props.buttonsComponentProps ?? ({} as T);
        const hasLeftButtonsComp = ButtonsComponent !== undefined;
        const hiddenWithLeftButtonsCls = classNames({ 'hidden-md hidden-sm hidden-xs': hasLeftButtonsComp });

        const paginationComp = (
            <Pagination
                {...model.paginationData}
                loadNextPage={this.loadNextPage}
                loadFirstPage={this.loadFirstPage}
                loadPreviousPage={this.loadPreviousPage}
                loadLastPage={this.loadLastPage}
                pageSizes={pageSizes}
                setPageSize={this.setPageSize}
            />
        );

        return (
            <>
                <div className="grid-panel__button-bar">
                    <div className="grid-panel__button-bar-left">
                        <div className="button-bar__section">
                            {hasLeftButtonsComp && (
                                <ButtonsComponent {...buttonsComponentProps} model={model} actions={actions} />
                            )}
                            <span className={hiddenWithLeftButtonsCls}>
                                {showFiltersButton && <FiltersButton onFilter={onFilter} />}
                            </span>
                            <span className={hiddenWithLeftButtonsCls}>
                                {showSearchInput && <SearchBox actionValues={actionValues} onSearch={onSearch} />}
                            </span>
                        </div>
                    </div>

                    <div className="grid-panel__button-bar-right">
                        <div className="button-bar__section">
                            <span className={hiddenWithLeftButtonsCls}>{paginate && paginationComp}</span>
                            {canExport && (
                                <ExportMenu
                                    model={model}
                                    advancedOptions={advancedExportOptions}
                                    supportedTypes={supportedExportTypes}
                                    onExport={onExport}
                                />
                            )}
                            {showChartMenu && (
                                <ChartMenu
                                    hideEmptyChartMenu={hideEmptyChartMenu}
                                    actions={actions}
                                    model={model}
                                    onChartClicked={onChartClicked}
                                    onCreateReportClicked={onCreateReportClicked}
                                    showSampleComparisonReports={showSampleComparisonReports}
                                />
                            )}
                            {canSelectView && (
                                <ViewMenu
                                    model={model}
                                    onViewSelect={onViewSelect}
                                    onSaveView={onSaveView}
                                    onCustomizeView={allowViewCustomization && onCustomizeView}
                                    hideEmptyViewMenu={hideEmptyViewMenu}
                                />
                            )}
                            {ButtonsComponentRight !== undefined && (
                                <ButtonsComponentRight {...buttonsComponentProps} model={model} actions={actions} />
                            )}
                        </div>
                    </div>
                </div>

                {/*
                    This span is to show a 2nd grid button bar row in screen sizes < large which will display the
                    filter/search and pagination information so that they is room for the buttons in the 1st button bar.
                */}
                <span
                    className={classNames({
                        'visible-md visible-sm visible-xs': hasLeftButtonsComp,
                        hidden: !hasLeftButtonsComp,
                    })}
                >
                    <div className="grid-panel__button-bar margin-top">
                        <div className="grid-panel__button-bar-left">
                            <div className="button-bar__section">
                                {showFiltersButton && <FiltersButton onFilter={onFilter} iconOnly />}
                                {showSearchInput && <SearchBox actionValues={actionValues} onSearch={onSearch} />}
                            </div>
                        </div>
                        <div className="grid-panel__button-bar-right">
                            <div className="button-bar__section">{paginate && paginationComp}</div>
                        </div>
                    </div>
                </span>
            </>
        );
    }
}

interface GridTitleProps {
    actions: Actions;
    allowSelections: boolean;
    allowViewCustomization: boolean;
    isUpdated?: boolean;
    model: QueryModel;
    onRevertView?: () => void;
    onSaveNewView?: () => void;
    onSaveView?: (canSaveShared) => void;
    title?: string;
    view?: ViewInfo;
}

export const GridTitle: FC<GridTitleProps> = memo(props => {
    const {
        title,
        view,
        model,
        onRevertView,
        onSaveView,
        onSaveNewView,
        actions,
        allowSelections,
        allowViewCustomization,
        isUpdated,
    } = props;
    const { viewName } = model;
    const [errorMsg, setErrorMsg] = useState<string>(undefined);

    // TODO: unable to get jest to pass with useServerContext() due to GridPanel being Component instead of FC
    // const { user } = useServerContext();
    const user = hasServerContext() ? useServerContext().user : getServerContext().user;

    const currentView = view ?? model.currentView;
    let displayTitle = title;
    if (viewName && !currentView?.hidden) {
        const label = currentView?.label ?? viewName;
        displayTitle = displayTitle ? displayTitle + ' - ' + label : label;
    }

    const isEdited = currentView?.session;
    const showSave = isCustomizeViewsInAppEnabled() && allowViewCustomization && isEdited && currentView?.savable;
    const showRevert = allowViewCustomization && isEdited && currentView?.revertable;

    let canSaveCurrent = false;

    if (viewName) {
        canSaveCurrent = !user?.isGuest && !currentView?.hidden;
    }

    const _revertViewEdit = useCallback(async () => {
        try {
            await revertViewEdit(model.schemaQuery, model.containerPath, model.viewName);
        } catch (error) {
            setErrorMsg(error);
        }
        await actions.loadModel(model.id, allowSelections);
        onRevertView?.();
    }, [model, onRevertView, actions, allowSelections]);

    const _onSaveCurrentView = (): void => {
        onSaveView(user?.isAdmin);
    };

    if (!displayTitle && !isEdited && !isUpdated) {
        return null;
    }

    return (
        <div className="panel-heading view-header">
            {isEdited && <span className="alert-info view-edit-alert">Edited</span>}
            {isUpdated && <span className="alert-success view-edit-alert">Updated</span>}
            {displayTitle ?? 'Default View'}
            {showRevert && (
                <button className="btn btn-default button-left-spacing button-right-spacing" onClick={_revertViewEdit}>
                    Undo
                </button>
            )}
            {showSave && !canSaveCurrent && (
                <button className="btn btn-success" onClick={onSaveNewView}>
                    Save
                </button>
            )}
            {showSave && canSaveCurrent && (
                <SplitButton id="saveViewDropdown" bsStyle="success" onClick={_onSaveCurrentView} title="Save">
                    <MenuItem title="Save as new view" onClick={onSaveNewView} key="saveNewGridView">
                        Save as
                    </MenuItem>
                </SplitButton>
            )}
            {errorMsg && <span className="view-edit-error">{errorMsg}</span>}
        </div>
    );
});

interface State {
    actionValues: ActionValue[];
    errorMsg: React.ReactNode;
    headerClickCount: { [key: string]: number };
    isViewSaved?: boolean;
    showFilterModalFieldKey: string;
    showSaveViewModal: boolean;
    showCustomizeViewModal: boolean;
    selectedColumn: QueryColumn;
}

/**
 * Render a QueryModel as an interactive grid. For in-depth documentation and examples see components/docs/QueryModel.md.
 */
export class GridPanel<T = {}> extends PureComponent<Props<T>, State> {
    static defaultProps = {
        allowSelections: true,
        allowSorting: true,
        allowFiltering: true,
        allowViewCustomization: true,
        asPanel: true,
        hideEmptyChartMenu: true,
        hideEmptyViewMenu: true,
        highlightLastSelectedRow: false,
        loadOnMount: true,
        showPagination: true,
        showButtonBar: true,
        showChartMenu: true,
        showExport: true,
        showFiltersButton: true,
        showFilterStatus: true,
        showSampleComparisonReports: false,
        showSearchInput: true,
        showViewMenu: true,
        showHeader: true,
    };

    constructor(props) {
        super(props);
        const { id } = props.model;

        this.gridActions = {
            filter: new FilterAction(id, this.getColumns, null, props.getFilterDisplayValue),
            search: new SearchAction(id),
            sort: new SortAction(id, this.getColumns),
            view: new ViewAction(id, this.getColumns, this.getQueryInfo),
        };

        this.state = {
            actionValues: [],
            showFilterModalFieldKey: undefined,
            showSaveViewModal: false,
            showCustomizeViewModal: false,
            headerClickCount: {},
            errorMsg: undefined,
            isViewSaved: false,
            selectedColumn: undefined,
        };
    }

    componentDidMount(): void {
        const { model, actions, allowSelections, loadOnMount } = this.props;
        if (loadOnMount) {
            actions.loadModel(model.id, allowSelections);
        }
    }

    componentDidUpdate(prevProps: Readonly<Props<T>>): void {
        if (this.props.model.queryInfo !== undefined && this.props.model !== prevProps.model) {
            this.populateGridActions();
        }
    }

    gridActions: {
        filter: FilterAction;
        search: SearchAction;
        sort: SortAction;
        view: ViewAction;
    };

    getModelView = (): ViewInfo => {
        const { queryInfo, viewName } = this.props.model;
        return queryInfo?.getView(viewName, true);
    };

    createGridActionValues = (): ActionValue[] => {
        const { model } = this.props;
        const { filterArray, sorts } = model;
        const view = this.getModelView();
        const actionValues = [];

        const _sorts = view ? sorts.concat(view.sorts.toArray()) : sorts;
        _sorts.forEach((sort): void => {
            const column = model.getColumn(sort.fieldKey);
            if (column) {
                actionValues.push(this.gridActions.sort.actionValueFromSort(sort, column?.shortCaption));
            }
        });

        // handle the view's saved filters (which will be shown as read only)
        if (view && view.filters.size) {
            view.filters.forEach((filter): void => {
                const column = model.getColumn(filter.getColumnName());
                if (column) {
                    actionValues.push(
                        this.gridActions.filter.actionValueFromFilter(filter, column, 'Locked (saved with view)')
                    );
                }
            });
        }

        // handle the model.filterArray (user-defined filters)
        filterArray.forEach((filter): void => {
            if (filter.getColumnName() === '*') {
                actionValues.push(this.gridActions.search.actionValueFromFilter(filter));
            } else {
                const column = model.getColumn(filter.getColumnName());
                if (column) {
                    actionValues.push(this.gridActions.filter.actionValueFromFilter(filter, column));
                }
            }
        });

        return actionValues;
    };

    /**
     * Populates the grid with ActionValues based on the current model state. Requires that the model has a QueryInfo
     * so we can properly render Column and View labels.
     */
    populateGridActions = (): void => {
        const modelActionValues = this.createGridActionValues();
        const modelActionValuesStr = actionValuesToString(modelActionValues);
        const currentActionValuesStr = actionValuesToString(this.state.actionValues);

        if (modelActionValuesStr !== currentActionValuesStr) {
            // The action values have changed due to external model changes (likely URL changes), so we need to
            // update the actionValues state with the newest values.
            this.setState({ actionValues: modelActionValues, errorMsg: undefined });
        }
    };

    selectRow = (row, event): void => {
        const { model, actions } = this.props;
        const checked = event.target.checked === true;
        // Have to call toJS() on the row because <Grid /> converts rows to Immutable objects.
        actions.selectRow(model.id, checked, row.toJS());
    };

    selectPage = (event): void => {
        const { model, actions } = this.props;
        const checked = event.target.checked === true && model.selectedState !== GRID_CHECKBOX_OPTIONS.SOME;
        actions.selectPage(model.id, checked);
    };

    getColumns = (all = false): List<QueryColumn> => {
        const { model } = this.props;
        return all ? List(model.allColumns) : List(model.displayColumns);
    };

    getQueryInfo = (): QueryInfo => {
        return this.props.model.queryInfo;
    };

    getSelectDistinctOptions = (): Query.SelectDistinctOptions => {
        const { model } = this.props;
        return {
            column: undefined,
            containerFilter: model.containerFilter,
            containerPath: model.containerPath,
            schemaName: model.schemaName,
            queryName: model.queryName,
            filterArray: model.modelFilters,
            parameters: model.queryParameters,
        };
    };

    handleFilterRemove = (change: Change, column?: QueryColumn): void => {
        const { model, actions, allowSelections } = this.props;
        const { actionValues } = this.state;
        const view = this.getModelView();

        if (change.type === ChangeType.remove) {
            let newFilters = model.filterArray;
            let viewUpdates;

            // If a column is provided instead of a change.index, then we will remove all filters for that column.
            if (change.index !== undefined) {
                const value = actionValues[change.index].valueObject;

                // first check if we are removing a filter from the saved view
                const viewFilterIndex = view?.filters.findIndex(filter => filtersEqual(filter, value)) ?? -1;
                if (viewFilterIndex > -1) {
                    this.saveAsSessionView({ filters: view.filters.remove(viewFilterIndex) });
                    return;
                }

                newFilters = newFilters.filter(filter => !filtersEqual(filter, value));
            } else if (column) {
                newFilters = newFilters.filter(filter => !isFilterColumnNameMatch(filter, column));
                if (view?.filters.size) {
                    viewUpdates = { filters: view.filters.filter(filter => !isFilterColumnNameMatch(filter, column)) };
                }
            } else {
                // remove all filters, but keep the search
                newFilters = newFilters.filter(filter => filter.getFilterType() === Filter.Types.Q);
                if (view?.filters.size) {
                    viewUpdates = { filters: view.filters.filter(filter => filter.getFilterType() === Filter.Types.Q) };
                }
            }

            // Defer model updates after localState is updated so we don't unnecessarily repopulate the grid actionValues
            this.setState({ headerClickCount: {} }, () => {
                actions.setFilters(model.id, newFilters, allowSelections);
                if (viewUpdates) this.saveAsSessionView(viewUpdates);
            });
        }
    };

    handleApplyFilters = (newFilters: Filter.IFilter[]): void => {
        const { model, actions, allowSelections } = this.props;

        this.setState(
            {
                showFilterModalFieldKey: undefined,
                showSaveViewModal: false,
                headerClickCount: {},
            },
            () => actions.setFilters(model.id, newFilters, allowSelections)
        );
    };

    handleSortChange = (change: Change, newQuerySort?: QuerySort): void => {
        const { model, actions } = this.props;
        const { actionValues } = this.state;
        const view = this.getModelView();
        let newSorts;

        if (change.type === ChangeType.remove) {
            const value = actionValues[change.index].valueObject;

            // first check if we are removing a sort from the saved view
            const viewSortIndex = view?.sorts.findIndex(sort => sortsEqual(sort, value)) ?? -1;
            if (viewSortIndex > -1) {
                this.saveAsSessionView({ sorts: view.sorts.remove(viewSortIndex) });
                return;
            }

            newSorts = model.sorts.filter(sort => !sortsEqual(sort, value));
        } else if (newQuerySort) {
            // first check if we are changing a sort from the saved view
            const viewSortIndex = view?.sorts.findIndex(sort => sort.fieldKey === newQuerySort.fieldKey) ?? -1;
            if (viewSortIndex > -1) {
                let newViewSorts = view.sorts.remove(viewSortIndex);
                newViewSorts = newViewSorts.push(newQuerySort);
                this.saveAsSessionView({ sorts: newViewSorts });
                return;
            }

            // remove any existing sorts on the given column (doesn't make sense to keep multiple)
            // before adding the new sort value
            newSorts = model.sorts.filter(sort => sort.fieldKey !== newQuerySort.fieldKey);
            newSorts.push(newQuerySort);
        }

        // Defer sorts update to after setState is complete so we don't unnecessarily repopulate the grid actionValues
        this.setState({ headerClickCount: {} }, () => actions.setSorts(model.id, newSorts));
    };

    onSearch = (value: string): void => {
        const { model, actions, allowSelections } = this.props;
        const { actionValues } = this.state;

        const change = getSearchValueAction(actionValues, value);
        if (!change) return;

        let newFilters = model.filterArray;
        if (change.type === ChangeType.modify || change.type === ChangeType.remove) {
            // Remove the filter with the value of oldValue
            const oldValue = actionValues[change.index].valueObject;
            newFilters = newFilters.filter(filter => !filtersEqual(filter, oldValue));
        }

        if (change.type === ChangeType.add || change.type === ChangeType.modify) {
            newFilters = newFilters.concat(Filter.create('*', value, Filter.Types.Q));
        }

        // Defer search update to after setState so we don't unnecessarily repopulate the grid actionValues
        this.setState({ headerClickCount: {} }, () => actions.setFilters(model.id, newFilters, allowSelections));
    };

    onRevertView = (): void => {
        this.setState({ errorMsg: undefined });
    };

    filterColumn = (column: QueryColumn, remove = false): void => {
        if (remove) {
            this.handleFilterRemove({ type: ChangeType.remove }, column);
        } else {
            const fieldKey = column.resolveFieldKey(); // resolveFieldKey because of Issue 34627
            this.setState({ showFilterModalFieldKey: fieldKey });
        }
    };

    removeAllFilters = (): void => {
        this.handleFilterRemove({ type: ChangeType.remove });
    };

    removeFilter = (index: number): void => {
        this.handleFilterRemove({ type: ChangeType.remove, index });
    };

    showFilterModal = (actionValue?: ActionValue): void => {
        const { model } = this.props;
        const displayColumns = model.displayColumns;

        // if the user clicked to edit an existing filter, use that filter's column name when opening the modal
        // else open modal with the first field selected
        const columnName = actionValue?.valueObject?.getColumnName();
        const colIndex = columnName
            ? Math.max(
                  displayColumns.findIndex(col => col.resolveFieldKey() === columnName),
                  0 // fall back to the first field if no match
              )
            : 0;
        const fieldKey = displayColumns[colIndex]?.resolveFieldKey();

        this.setState({ showFilterModalFieldKey: fieldKey });
    };

    closeFilterModal = (): void => {
        this.setState({ showFilterModalFieldKey: undefined });
    };

    sortColumn = (column: QueryColumn, direction?: string): void => {
        const fieldKey = column.resolveFieldKey(); // resolveFieldKey because of Issue 34627

        if (direction) {
            const dir = direction === '+' ? '' : '-'; // Sort Action only uses '-' and ''
            const sort = new QuerySort({ fieldKey, dir });
            this.handleSortChange({ type: ChangeType.add }, sort);
        } else {
            const actionIndex = this.state.actionValues.findIndex(
                actionValue =>
                    actionValue.action === this.gridActions.sort && actionValue.valueObject.fieldKey === fieldKey
            );

            if (actionIndex > -1) {
                this.handleSortChange({ type: ChangeType.remove, index: actionIndex });
            }
        }
    };

    hideColumn = (columnToHide: QueryColumn): void => {
        const { model } = this.props;
        this.saveAsSessionView({
            columns: model.displayColumns.filter(column => column.index !== columnToHide.index),
        });
    };

    addColumn = (selectedColumn: QueryColumn): void => {
        this.setState({
            selectedColumn: selectedColumn,
            showCustomizeViewModal: true
        });
    };

    saveAsSessionView = (updates: Record<string, any>): void => {
        const { schemaQuery, containerPath } = this.props.model;
        const view = this.getModelView();
        const viewInfo = view.mutate(updates);

        saveAsSessionView(schemaQuery, containerPath, viewInfo)
            .then(this.afterViewChange)
            .catch(errorMsg => {
                this.setState({ errorMsg });
            });
    };

    afterViewChange = (): void => {
        const { actions, model, allowSelections } = this.props;
        actions.loadModel(model.id, allowSelections);
        this.setState({
            headerClickCount: {},
            errorMsg: undefined,
        });
    };

    onSaveCurrentView = async (canSaveShared: boolean): Promise<void> => {
        const { model } = this.props;
        const { queryInfo, viewName } = model;
        const view = queryInfo?.getView(viewName, true);

        let currentView = view;
        try {
            if (view.session) currentView = await getGridView(queryInfo.schemaQuery, viewName, true);
            await this.onSaveView(viewName, currentView?.inherit, true, currentView.shared && canSaveShared);
        } catch (errorMsg) {
            this.setState({ errorMsg });
        }
    };

    onSaveNewView = (): void => {
        this.setState({ showSaveViewModal: true });
    };

    toggleCustomizeView = (): void => {
        this.setState((state) => ( {showCustomizeViewModal: !state.showCustomizeViewModal } ));
    }

    onSessionViewUpdate = (): void => {
        const { actions, model, allowSelections } = this.props;

        actions.loadModel(model.id, allowSelections);
    }


    onSaveView = (newName: string, inherit: boolean, replace: boolean, shared?: boolean): Promise<any> => {
        const { model } = this.props;
        const { viewName, queryInfo } = model;

        return new Promise((resolve, reject) => {
            const view = queryInfo?.getView(viewName, true);

            const updatedViewInfo = view.mutate({
                // update/set sorts and filters to combine view and user defined items
                filters: List(model.filterArray.concat(view.filters.toArray())),
                sorts: List(model.sorts.concat(view.sorts.toArray())),
            });

            if (view.session) {
                // first save an updated session view with the concatenated sorts/filters (without name update),
                // then convert the session view to a non session view (with name update)
                saveAsSessionView(model.schemaQuery, model.containerPath, updatedViewInfo)
                    .then(() => {
                        saveSessionView(
                            model.schemaQuery,
                            model.containerPath,
                            viewName,
                            newName,
                            inherit,
                            shared,
                            replace
                        )
                            .then(response => {
                                this.afterSaveViewComplete(newName);
                                resolve(response);
                            })
                            .catch(errorMsg => {
                                reject(errorMsg);
                            });
                    })
                    .catch(errorMsg => {
                        this.setState({ errorMsg });
                    });
            } else {
                const finalViewInfo = updatedViewInfo.mutate({
                    name: newName,
                });

                saveGridView(model.schemaQuery, model.containerPath, finalViewInfo, replace, false, inherit, shared)
                    .then(response => {
                        this.afterSaveViewComplete(newName);
                        resolve(response);
                    })
                    .catch(errorMsg => {
                        reject(errorMsg);
                    });
            }
        });
    };

    afterSaveViewComplete = (newName: string): void => {
        const { model, actions } = this.props;
        const { showSaveViewModal } = this.state;

        // if the model had any user defined sorts/filters, clear those since they are now saved with the view
        if (model.filterArray.length > 0) actions.setFilters(model.id, [], false);
        if (model.sorts.length > 0) actions.setSorts(model.id, []);

        this.afterViewChange();
        if (showSaveViewModal) {
            this.closeSaveViewModal();
            this.onViewSelect(newName);
        }

        this.showViewSavedIndicator();
    };

    showViewSavedIndicator = (): void => {
        this.setState({ isViewSaved: true });
        setTimeout(() => {
            this.setState({ isViewSaved: false });
        }, 5000);
    };

    closeSaveViewModal = (): void => {
        this.setState({ showSaveViewModal: false });
    };

    onViewSelect = (viewName: string): void => {
        const { actions, model, allowSelections } = this.props;
        let updateViewCallback: () => void;

        if (viewName !== undefined) {
            if (viewName !== model.viewName) {
                // Only trigger view change if the viewName has changed
                updateViewCallback = () => actions.setView(model.id, viewName, allowSelections);
            }
        } else {
            updateViewCallback = () => actions.setView(model.id, undefined, allowSelections);
        }

        // Defer view update to after setState so we don't unnecessarily repopulate the grid actionValues.
        // View change will refresh the grid, so clear the headerClickCount values
        if (updateViewCallback) this.setState({ headerClickCount: {} }, updateViewCallback);
    };

    getGridColumns = (): List<GridColumn | QueryColumn> => {
        const { allowSelections, model } = this.props;
        const { isLoading, isLoadingSelections } = model;

        if (allowSelections) {
            const selectColumn = new GridColumn({
                index: GRID_SELECTION_INDEX,
                title: '',
                showHeader: true,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                cell: (selected: boolean, row: any): ReactNode => {
                    const onChange = (event): void => this.selectRow(row, event);
                    const disabled = isLoading || isLoadingSelections;
                    return (
                        // eslint-disable-next-line react/jsx-no-bind
                        <input
                            className="grid-panel__row-checkbox"
                            type="checkbox"
                            disabled={disabled}
                            checked={selected === true}
                            onChange={onChange} // eslint-disable-line
                        />
                    );
                },
            });

            return List([selectColumn, ...model.displayColumns]);
        }

        return List(model.displayColumns);
    };

    onHeaderCellClick = (column: GridColumn): void => {
        this.setState(state => {
            return {
                headerClickCount: {
                    ...state.headerClickCount,
                    [column.index]: (state.headerClickCount[column.index] ?? 0) + 1,
                },
            };
        });
    };

    headerCell = (column: GridColumn, index: number, columnCount?: number): ReactNode => {
        const { headerClickCount } = this.state;
        const { allowSelections, allowSorting, allowFiltering, allowViewCustomization, model } = this.props;
        const { isLoading, isLoadingSelections, hasRows, rowCount } = model;
        const disabled = isLoadingSelections || isLoading || (hasRows && rowCount === 0);

        if (column.index === GRID_SELECTION_INDEX) {
            return headerSelectionCell(this.selectPage, model.selectedState, disabled, 'grid-panel__page-checkbox');
        }

        return headerCell(
            index,
            column,
            allowSelections,
            columnCount,
            allowSorting ? this.sortColumn : undefined,
            allowFiltering ? this.filterColumn : undefined,
            allowViewCustomization ? this.addColumn : undefined,
            allowViewCustomization ? this.hideColumn : undefined,
            model,
            headerClickCount[column.index]
        );
    };

    getHighlightRowIndexes(): List<number> {
        const { highlightLastSelectedRow, model } = this.props;
        if (!highlightLastSelectedRow || !model.hasSelections) return undefined;

        const lastSelectedId = Array.from(model.selections).pop();
        return List<number>([model.orderedRows.indexOf(lastSelectedId)]);
    }

    render(): ReactNode {
        const {
            actions,
            allowSelections,
            allowViewCustomization,
            hasHeader,
            asPanel,
            emptyText,
            getEmptyText,
            model,
            onExport,
            showButtonBar,
            showFilterStatus,
            showHeader,
            title,
        } = this.props;
        const { showCustomizeViewModal, showFilterModalFieldKey, showSaveViewModal, actionValues, errorMsg, isViewSaved } = this.state;
        const {
            hasData,
            id,
            isLoading,
            isLoadingSelections,
            rowsError,
            selectionsError,
            messages,
            queryInfoError,
            queryInfo,
            viewName,
        } = model;
        const hasGridError = queryInfoError !== undefined || rowsError !== undefined;
        const hasError = hasGridError || selectionsError !== undefined || errorMsg;
        let loadingMessage;
        const gridIsLoading = !hasGridError && isLoading;
        const selectionsAreLoading = !hasError && allowSelections && isLoadingSelections;

        if (gridIsLoading) {
            loadingMessage = 'Loading data...';
        } else if (selectionsAreLoading) {
            loadingMessage = 'Loading selections...';
        }

        const gridEmptyText = getEmptyText?.(model) ?? emptyText;
        const view = queryInfo?.getView(viewName, true);

        return (
            <>
                <div className={classNames('grid-panel', { panel: asPanel, 'panel-default': asPanel })}>
                    <GridTitle
                        model={model}
                        view={view}
                        title={title}
                        actions={actions}
                        allowSelections={allowSelections}
                        allowViewCustomization={allowViewCustomization}
                        onRevertView={this.onRevertView}
                        onSaveView={this.onSaveCurrentView}
                        onSaveNewView={this.onSaveNewView}
                        isUpdated={isViewSaved}
                    />

                    <div
                        className={classNames('grid-panel__body', { 'panel-body': asPanel, 'top-spacing': !hasHeader })}
                    >
                        {showButtonBar && (
                            <ButtonBar
                                {...this.props}
                                actionValues={actionValues}
                                onExport={onExport}
                                onFilter={this.showFilterModal}
                                onSearch={this.onSearch}
                                onViewSelect={this.onViewSelect}
                                onSaveView={this.onSaveNewView}
                                onCustomizeView={this.toggleCustomizeView}
                            />
                        )}

                        {(loadingMessage || allowSelections) && (
                            <div className="grid-panel__info">
                                {loadingMessage && (
                                    <div className="grid-panel__loading">
                                        <LoadingSpinner msg={loadingMessage} />
                                    </div>
                                )}
                                {allowSelections && <SelectionStatus model={model} actions={actions} />}
                                {showFilterStatus && (
                                    <FilterStatus
                                        actionValues={actionValues}
                                        onClick={this.showFilterModal}
                                        onRemove={this.removeFilter}
                                        onRemoveAll={this.removeAllFilters}
                                    />
                                )}
                            </div>
                        )}

                        <div className="grid-panel__grid">
                            {hasError && <Alert>{errorMsg || queryInfoError || rowsError || selectionsError}</Alert>}

                            {!hasGridError && hasData && (
                                <Grid
                                    headerCell={this.headerCell}
                                    onHeaderCellClick={this.onHeaderCellClick}
                                    showHeader={showHeader}
                                    calcWidths
                                    condensed
                                    emptyText={gridEmptyText}
                                    gridId={id}
                                    messages={fromJS(messages)}
                                    columns={this.getGridColumns()}
                                    data={model.gridData}
                                    highlightRowIndexes={this.getHighlightRowIndexes()}
                                />
                            )}
                        </div>
                    </div>
                </div>
                {showFilterModalFieldKey && (
                    <GridFilterModal
                        fieldKey={showFilterModalFieldKey}
                        selectDistinctOptions={this.getSelectDistinctOptions()}
                        initFilters={model.filterArray} // using filterArray to indicate user-defined filters only
                        model={model}
                        onApply={this.handleApplyFilters}
                        onCancel={this.closeFilterModal}
                    />
                )}
                {showSaveViewModal && (
                    <SaveViewModal
                        gridLabel={queryInfo?.schemaQuery?.queryName}
                        currentView={view}
                        onCancel={this.closeSaveViewModal}
                        onConfirmSave={this.onSaveView}
                    />
                )}
                {showCustomizeViewModal && (
                    <CustomizeGridViewModal
                        model={model}
                        onCancel={this.toggleCustomizeView}
                        onUpdate={this.onSessionViewUpdate}
                        selectedColumn={this.state.selectedColumn}
                    />
                )}
            </>
        );
    }
}

interface GridPaneWithModelBodyProps<T = {}> extends GridPanelProps<T> {
    id: string;
}

const GridPanelWithModelBodyImpl: FC<GridPaneWithModelBodyProps & InjectedQueryModels> = memo(
    ({ actions, id, queryModels, ...props }) => {
        return <GridPanel actions={actions} model={queryModels[id]} {...props} />;
    }
);

const GridPanelWithModelBody = withQueryModels<GridPaneWithModelBodyProps>(GridPanelWithModelBodyImpl);

interface GridPanelWithModelProps<T = {}> extends GridPanelProps<T> {
    queryConfig: QueryConfig;
}

/**
 * GridPanelWithModel is the same as a GridPanel component, but it takes a single QueryConfig and loads the model.
 */
export const GridPanelWithModel: FC<GridPanelWithModelProps> = memo(({ queryConfig, ...props }) => {
    const id = useMemo(() => queryConfig.id ?? createQueryModelId(queryConfig.schemaQuery), [queryConfig]);
    const queryConfigs = useMemo(() => ({ [id]: queryConfig }), [id, queryConfig]);
    return <GridPanelWithModelBody {...props} id={id} key={id} queryConfigs={queryConfigs} />;
});
