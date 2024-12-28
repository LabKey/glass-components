import React, {
    ChangeEvent,
    ComponentType,
    FC,
    memo,
    PureComponent,
    ReactNode,
    useCallback,
    useMemo,
    useState,
} from 'react';
import classNames from 'classnames';
import { fromJS, List, Map, Set } from 'immutable';
import { Filter, getServerContext, Query } from '@labkey/api';

import { EXPORT_TYPES, GRID_CHECKBOX_OPTIONS, GRID_SELECTION_INDEX } from '../../internal/constants';
import { headerCell, headerSelectionCell, isFilterColumnNameMatch } from '../../internal/renderers';

import {
    getGridView,
    revertViewEdit,
    saveGridView,
    saveAsSessionView,
    saveSessionView,
    incrementClientSideMetricCount,
} from '../../internal/actions';

import { hasServerContext, useServerContext } from '../../internal/components/base/ServerContext';

import { Pagination } from '../../internal/components/pagination/Pagination';

import { ViewInfo } from '../../internal/ViewInfo';

import { QueryColumn } from '../QueryColumn';

import { QuerySort } from '../QuerySort';

import { GridColumn, GridColumnProps } from '../../internal/components/base/models/GridColumn';

import { LoadingSpinner } from '../../internal/components/base/LoadingSpinner';

import { Grid, GridProps } from '../../internal/components/base/Grid';

import { Alert } from '../../internal/components/base/Alert';

import { userCanEditSharedViews } from '../../internal/app/utils';

import { User } from '../../internal/components/base/models/User';

import { MenuItem, SplitButton } from '../../internal/dropdowns';

import { DOMAIN_FIELD } from '../../internal/components/forms/DomainFieldHelpTipContents';

import { ActionValue } from './grid/actions/Action';
import { FilterAction } from './grid/actions/Filter';
import { SearchAction } from './grid/actions/Search';
import { SortAction } from './grid/actions/Sort';
import { ViewAction } from './grid/actions/View';

import { getSearchValueAction } from './grid/utils';
import { Change, ChangeType } from './grid/model';

import { createQueryModelId, QueryConfig, QueryModel } from './QueryModel';
import { ViewMenu } from './ViewMenu';
import { ExportMenu } from './ExportMenu';
import { SelectionStatus } from './SelectionStatus';
import { ChartMenu } from './ChartMenu';
import { SearchBox } from './SearchBox';
import { actionValuesToString, filterArraysEqual, filtersEqual, sortsEqual } from './utils';
import { GridFilterModal } from './GridFilterModal';
import { FiltersButton } from './FiltersButton';
import { FilterStatus } from './FilterStatus';
import { SaveViewModal } from './SaveViewModal';
import { CustomizeGridViewModal } from './CustomizeGridViewModal';
import { ManageViewsModal } from './ManageViewsModal';
import { Actions, InjectedQueryModels, RequiresModelAndActions, withQueryModels } from './withQueryModels';
import { ChartPanel } from './ChartPanel';

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
    hideEmptyViewMenu?: boolean;
    highlightLastSelectedRow?: boolean;
    loadOnMount?: boolean;
    onExport?: { [key: string]: (modelId?: string) => any };
    pageSizes?: number[];
    showButtonBar?: boolean;
    showChartMenu?: boolean;
    showExport?: boolean;
    showFilterStatus?: boolean;
    showFiltersButton?: boolean;
    showHeader?: boolean;
    showPagination?: boolean;
    showSearchInput?: boolean;
    showViewMenu?: boolean;
    supportedExportTypes?: Set<EXPORT_TYPES>;
    title?: string;
}

type Props<T> = GridPanelProps<T> & RequiresModelAndActions;

interface GridBarProps<T> extends Props<T> {
    actionValues: ActionValue[];
    onCustomizeView: () => void;
    onFilter: () => void;
    onManageViews: () => void;
    onSaveView: () => void;
    onSearch: (token: string) => void;
    onViewSelect: (viewName: string) => void;
    searchActionValues: ActionValue[];
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
            searchActionValues,
            allowViewCustomization,
            model,
            actions,
            advancedExportOptions,
            ButtonsComponent,
            ButtonsComponentRight,
            hideEmptyViewMenu,
            onCustomizeView,
            onExport,
            onFilter,
            onManageViews,
            onSearch,
            onSaveView,
            onViewSelect,
            pageSizes,
            showChartMenu,
            showExport,
            showFiltersButton,
            showPagination,
            showSearchInput,
            showViewMenu,
            supportedExportTypes,
        } = this.props;

        const { hasData, hasRows, queryInfo, queryInfoError, rowsError, selectionsError } = model;
        const hasError = queryInfoError !== undefined || rowsError !== undefined || selectionsError !== undefined;
        const paginate = showPagination && hasRows && !hasError;
        const canExport = showExport && !hasError;
        // Don't disable view selection when there is an error because it's possible the error may be caused by the view
        const canSelectView = showViewMenu && queryInfo !== undefined;
        const buttonsComponentProps = this.props.buttonsComponentProps ?? ({} as T);
        const hasLeftButtonsComp = ButtonsComponent !== undefined;
        // We do not want to render the buttons component until after we've loaded the query model at least once,
        // otherwise the ResponsiveMenuButtonGroup will not be able to collapse buttons correctly.
        const showButtonsComponent = hasLeftButtonsComp && (hasData || rowsError);
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
                            {showButtonsComponent && (
                                <ButtonsComponent {...buttonsComponentProps} model={model} actions={actions} />
                            )}

                            <div className={'button-bar__filter-search ' + hiddenWithLeftButtonsCls}>
                                {showFiltersButton && <FiltersButton onFilter={onFilter} />}
                                {showSearchInput && <SearchBox actionValues={searchActionValues} onSearch={onSearch} />}
                            </div>
                        </div>
                    </div>

                    <div className="grid-panel__button-bar-right">
                        <div className="button-bar__section">
                            <span className={hiddenWithLeftButtonsCls}>{paginate && paginationComp}</span>
                            {canExport && (
                                <ExportMenu
                                    actions={actions}
                                    model={model}
                                    advancedOptions={advancedExportOptions}
                                    supportedTypes={supportedExportTypes?.toJS()}
                                    onExport={onExport}
                                />
                            )}
                            {showChartMenu && <ChartMenu actions={actions} model={model} />}
                            {canSelectView && (
                                <ViewMenu
                                    allowViewCustomization={allowViewCustomization}
                                    model={model}
                                    onViewSelect={onViewSelect}
                                    onSaveView={onSaveView}
                                    onCustomizeView={onCustomizeView}
                                    onManageViews={onManageViews}
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
                                {showSearchInput && <SearchBox actionValues={searchActionValues} onSearch={onSearch} />}
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
    const [errorMsg, setErrorMsg] = useState<string>();

    // TODO: unable to get jest to pass with useServerContext() due to GridPanel being Component instead of FC
    // const { user } = useServerContext();
    const user = hasServerContext() ? useServerContext().user : getServerContext().user;

    const currentView = view ?? model.currentView;
    let displayTitle = title;
    if (viewName && !currentView?.hidden && !currentView?.isSystemView) {
        const label = currentView?.label ?? viewName;
        displayTitle = displayTitle ? displayTitle + ' - ' + label : label;
    }

    const isEdited = currentView?.session;
    const showSave = allowViewCustomization && isEdited && currentView?.savable;
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
        await actions.loadModel(model.id, allowSelections, true);
        onRevertView?.();
    }, [model, onRevertView, actions, allowSelections]);

    const _onSaveCurrentView = useCallback((): void => {
        onSaveView(userCanEditSharedViews(user as User));
    }, [onSaveView, user]);

    if (!displayTitle && (!allowViewCustomization || (!isEdited && !isUpdated))) {
        return null;
    }

    return (
        <div className="panel-heading view-header">
            {isEdited && allowViewCustomization && <span className="alert-info view-edit-alert">Edited</span>}
            {isUpdated && allowViewCustomization && <span className="alert-success view-edit-alert">Updated</span>}
            {displayTitle ?? 'Default View'}
            {showRevert && (
                <button
                    className="btn btn-default button-left-margin button-right-margin"
                    onClick={_revertViewEdit}
                    type="button"
                >
                    Undo
                </button>
            )}
            {showSave && !canSaveCurrent && (
                <button className="btn btn-success" onClick={onSaveNewView} type="button">
                    Save
                </button>
            )}
            {showSave && canSaveCurrent && (
                <SplitButton bsStyle="success" onClick={_onSaveCurrentView} title="Save">
                    <MenuItem title="Save as new view" onClick={onSaveNewView} key="saveNewGridView">
                        Save as...
                    </MenuItem>
                </SplitButton>
            )}
            {errorMsg && <span className="view-edit-error">{errorMsg}</span>}
        </div>
    );
});

interface State {
    // TODO: replace actionValues with individual properties tracking searches, sorts, filters, and views separately.
    //  actionValues is a vestigal structure left behind from OmniBox which required us to store everything together.
    actionValues: ActionValue[];
    disableColumnDrag: boolean;
    errorMsg: React.ReactNode;
    isViewSaved: boolean;
    searchActionValues: ActionValue[];
    selectedColumn: QueryColumn;
    showCustomizeViewModal: boolean;
    showFilterModalFieldKey: string;
    showManageViewsModal: boolean;
    showSaveViewModal: boolean;
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
        hideEmptyViewMenu: true,
        highlightLastSelectedRow: false,
        loadOnMount: true,
        showPagination: true,
        showButtonBar: true,
        showChartMenu: true,
        showExport: true,
        showFiltersButton: true,
        showFilterStatus: true,
        showSearchInput: true,
        showViewMenu: true,
        showHeader: true,
    };

    constructor(props) {
        super(props);

        // TODO: gridActions is a vestigal structure left behind from the days of Omnibox, which we have since removed.
        //  We should remove gridActions and the related classes.
        this.gridActions = {
            filter: new FilterAction(props.getFilterDisplayValue),
            search: new SearchAction(),
            sort: new SortAction(),
            view: new ViewAction(),
        };

        this.state = {
            actionValues: [],
            searchActionValues: [],
            disableColumnDrag: false,
            showFilterModalFieldKey: undefined,
            showSaveViewModal: false,
            showCustomizeViewModal: false,
            showManageViewsModal: false,
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

    createGridActionValues = (): { actionValues: ActionValue[]; searchActionValues: ActionValue[] } => {
        const { model } = this.props;
        const { filterArray, sorts } = model;
        const view = model.currentView;
        const actionValues = [];
        const searchActionValues = [];

        const _sorts = view ? sorts.concat(view.sorts) : sorts;
        _sorts.forEach((sort): void => {
            const column = model.getColumn(sort.fieldKey);
            if (column) {
                actionValues.push(this.gridActions.sort.actionValueFromSort(sort, column?.shortCaption));
            }
        });

        // handle the view's saved filters (which will be shown as read only)
        if (view && view.filters.length) {
            view.filters.forEach((filter): void => {
                const column = model.getColumn(filter.getColumnName());
                if (column) {
                    actionValues.push(
                        this.gridActions.filter.actionValueFromFilter(filter, column, 'Locked (saved with view)')
                    );
                } else if (filter.getColumnName() === '*') {
                    actionValues.push(
                        this.gridActions.search.actionValueFromFilter(filter, 'Locked (saved with view)')
                    );
                }
            });
        }

        // handle the model.filterArray (user-defined filters)
        filterArray.forEach((filter): void => {
            if (filter.getColumnName() === '*') {
                const searchAction = this.gridActions.search.actionValueFromFilter(filter);
                searchActionValues.push(searchAction);
            } else {
                const column = model.getColumn(filter.getColumnName());
                if (column) {
                    actionValues.push(this.gridActions.filter.actionValueFromFilter(filter, column));
                } else if (filter.getColumnName().indexOf('/') > -1) {
                    const lookupCol = model.getColumn(filter.getColumnName().split('/')[0]);
                    if (lookupCol) actionValues.push(this.gridActions.filter.actionValueFromFilter(filter, column));
                }
            }
        });

        return {
            actionValues,
            searchActionValues,
        };
    };

    /**
     * Populates the grid with ActionValues based on the current model state. Requires that the model has a QueryInfo
     * so we can properly render Column and View labels.
     */
    populateGridActions = (): void => {
        const { actionValues, searchActionValues } = this.createGridActionValues();
        const modelActionValuesStr = actionValuesToString(actionValues);
        const currentActionValuesStr = actionValuesToString(this.state.actionValues);
        const searchActionsValuesStr = actionValuesToString(searchActionValues);
        const currentSearchActionValuesStr = actionValuesToString(this.state.searchActionValues);

        if (
            modelActionValuesStr !== currentActionValuesStr ||
            searchActionsValuesStr !== currentSearchActionValuesStr
        ) {
            // The action values have changed due to external model changes (likely URL changes), so we need to
            // update the actionValues state with the newest values.
            this.setState({ actionValues, searchActionValues, errorMsg: undefined });
        }
    };

    selectRow = (row: Map<string, any>, event: ChangeEvent<HTMLInputElement>): void => {
        const { model, actions } = this.props;
        const checked = event.target.checked === true;
        // Look through to the nativeEvent to determine if the shift key is engaged.
        const useSelectionPivot = (event.nativeEvent as any).shiftKey ?? false;
        actions.selectRow(model.id, checked, row.toJS(), useSelectionPivot);
        if (useSelectionPivot) {
            incrementClientSideMetricCount('grid', 'shiftSelect');
        }
    };

    selectPage = (event): void => {
        const { model, actions } = this.props;
        const checked = event.target.checked === true && model.selectedState !== GRID_CHECKBOX_OPTIONS.SOME;
        actions.selectPage(model.id, checked);
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
        const view = model.currentView;

        if (change.type === ChangeType.remove) {
            let newFilters = model.filterArray;
            let viewUpdates;

            // If a column is provided instead of a change.index, then we will remove all filters for that column.
            if (change.index !== undefined) {
                const value = actionValues[change.index].valueObject;

                // first check if we are removing a filter from the saved view
                const viewFilterIndex = view?.filters.findIndex(filter => filtersEqual(filter, value)) ?? -1;
                if (viewFilterIndex > -1) {
                    this.saveAsSessionView({ filters: view.filters.filter((f, i) => viewFilterIndex !== i) });
                    return;
                }

                newFilters = newFilters.filter(filter => !filtersEqual(filter, value));
            } else if (column) {
                newFilters = newFilters.filter(filter => !isFilterColumnNameMatch(filter, column));
                if (view?.filters.length) {
                    viewUpdates = { filters: view.filters.filter(filter => !isFilterColumnNameMatch(filter, column)) };
                }
            } else {
                // remove all filters, but keep the search that's not part of the view
                newFilters = newFilters.filter(filter => filter.getFilterType() === Filter.Types.Q);
                if (view?.filters.length) {
                    viewUpdates = { filters: [] };
                }
            }

            actions.setFilters(model.id, newFilters, allowSelections);
            if (viewUpdates) this.saveAsSessionView(viewUpdates);
        }
    };

    handleApplyFilters = (newFilters: Filter.IFilter[]): void => {
        const { model, actions, allowSelections } = this.props;

        this.setState(
            {
                showFilterModalFieldKey: undefined,
                showSaveViewModal: false,
                showManageViewsModal: false,
            },
            () => actions.setFilters(model.id, newFilters, allowSelections)
        );
    };

    handleSortChange = (change: Change, newQuerySort?: QuerySort): void => {
        const { model, actions } = this.props;
        const { actionValues } = this.state;
        const view = model.currentView;
        let newSorts;

        if (change.type === ChangeType.remove) {
            const value = actionValues[change.index].valueObject;

            // first check if we are removing a sort from the saved view
            const viewSortIndex = view?.sorts.findIndex(sort => sortsEqual(sort, value)) ?? -1;
            if (viewSortIndex > -1) {
                this.saveAsSessionView({ sorts: view.sorts.filter((s, i) => viewSortIndex !== i) });
                return;
            }

            newSorts = model.sorts.filter(sort => !sortsEqual(sort, value));
        } else if (newQuerySort) {
            // first check if we are changing a sort from the saved view
            const viewSortIndex = view?.sorts.findIndex(sort => sort.fieldKey === newQuerySort.fieldKey) ?? -1;
            if (viewSortIndex > -1) {
                const newViewSorts = view.sorts.filter((s, i) => viewSortIndex !== i);
                newViewSorts.push(newQuerySort);
                this.saveAsSessionView({ sorts: newViewSorts });
                return;
            }

            // remove any existing sorts on the given column (doesn't make sense to keep multiple)
            // before adding the new sort value
            newSorts = model.sorts.filter(sort => sort.fieldKey !== newQuerySort.fieldKey);
            newSorts.push(newQuerySort);
        }

        actions.setSorts(model.id, newSorts);
    };

    onSearch = (value: string): void => {
        const { model, actions, allowSelections } = this.props;
        const { searchActionValues } = this.state;

        const change = getSearchValueAction(searchActionValues, value);
        if (!change) return;

        let newFilters = model.filterArray;
        if (change.type === ChangeType.modify || change.type === ChangeType.remove) {
            // Remove the filter with the value of oldValue
            const oldValue = searchActionValues[change.index].valueObject;
            newFilters = newFilters.filter(filter => !filtersEqual(filter, oldValue));
        }

        if (change.type === ChangeType.add || change.type === ChangeType.modify) {
            newFilters = newFilters.concat(Filter.create('*', value, Filter.Types.Q));
        }

        actions.setFilters(model.id, newFilters, allowSelections);
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
            columns: model.displayColumns
                .filter(column => column.index !== columnToHide.index)
                .map(col => ({
                    fieldKey: col.fieldKeyPath /* 46256: use encoded fieldKeyPath */,
                    title: model.getCustomViewTitleOverride(col),
                })),
        });
    };

    addColumn = (selectedColumn: QueryColumn): void => {
        this.setState({ selectedColumn, showCustomizeViewModal: true });
    };

    onColumnTitleEdit = (): void => {
        this.setState(state => ({ disableColumnDrag: !state.disableColumnDrag }));
    };

    updateColumnTitle = (updatedCol: QueryColumn): void => {
        this.saveAsSessionView({}, updatedCol);
        this.setState({ disableColumnDrag: false });
    };

    saveAsSessionView = (updates: Partial<ViewInfo>, updatedCol?: QueryColumn): void => {
        const { model } = this.props;
        const { schemaQuery, containerPath } = model;
        const changedFilters = updates.filters && !filterArraysEqual(updates.filters, model.currentView.filters);
        if (!updates.columns) {
            updates.columns = model.displayColumns.map(col => {
                if (updatedCol && col.index === updatedCol.index) {
                    return {
                        fieldKey: updatedCol.fieldKeyPath /* 46256: use encoded fieldKeyPath */,
                        title: model.getCustomViewTitleOverride(updatedCol),
                    };
                } else {
                    return {
                        fieldKey: col.fieldKeyPath /* 46256: use encoded fieldKeyPath */,
                        title: model.getCustomViewTitleOverride(col),
                    };
                }
            });
        }
        const viewInfo = model.currentView.mutate(updates);

        saveAsSessionView(schemaQuery, containerPath, viewInfo)
            .then(() => this.afterViewChange(changedFilters))
            .catch(errorMsg => {
                this.setState({ errorMsg });
            });
    };

    afterViewChange = (reloadTotalCount?: boolean): void => {
        const { actions, model, allowSelections } = this.props;
        actions.loadModel(model.id, allowSelections, reloadTotalCount);
        this.setState({ errorMsg: undefined });
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

    onManageViews = (): void => {
        this.setState({ showManageViewsModal: true });
    };

    closeManageViewsModal = (hasChange?: boolean, reselectViewName?: string): void => {
        const { model, actions, allowSelections } = this.props;

        if (hasChange) {
            actions.loadModel(model.id, allowSelections, true);
            if (reselectViewName !== undefined) {
                // don't reselect if reselectViewName is undefined
                this.onViewSelect(reselectViewName);
            }
        }

        this.setState({ showManageViewsModal: false });
    };

    onSaveNewView = (): void => {
        this.setState({ showSaveViewModal: true });
    };

    toggleCustomizeView = (): void => {
        this.setState(state => ({ showCustomizeViewModal: !state.showCustomizeViewModal }));
    };

    onSessionViewUpdate = (): void => {
        const { actions, model, allowSelections } = this.props;
        actions.loadModel(model.id, allowSelections);
    };

    onSaveView = (newName: string, inherit: boolean, replace: boolean, shared?: boolean): Promise<any> => {
        const { model } = this.props;
        const { viewName, queryInfo } = model;

        return new Promise((resolve, reject) => {
            const view = queryInfo?.getView(viewName, true);
            let updatedViewInfo = view.addSystemViewColumns(queryInfo);
            updatedViewInfo = updatedViewInfo.mutate({
                // update/set sorts and filters to combine view and user-defined items
                filters: model.filterArray.concat(view.filters),
                sorts: model.sorts.concat(view.sorts),
                columns: model.displayColumns.map(col => {
                    return {
                        fieldKey: col.fieldKeyPath /* 46256: use encoded fieldKeyPath */,
                        title: model.getCustomViewTitleOverride(col),
                    };
                }),
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
                const isCustomView = !!newName && newName !== ViewInfo.DEFAULT_NAME;
                const finalViewInfo = updatedViewInfo.mutate({
                    name: newName,
                    isDefault: isCustomView ? false : updatedViewInfo.isDefault,
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

        if (viewName !== undefined && viewName !== null && viewName !== '') {
            if (viewName !== model.viewName) {
                // Only trigger view change if the viewName has changed
                actions.setView(model.id, viewName, allowSelections);
            }
        } else {
            actions.setView(model.id, undefined, allowSelections);
        }

        // since the grid ChartMenu filters to charts for a given view, when the view changes clear the selectedReportId
        if (model.selectedReportId) {
            actions.selectReport(model.id, undefined);
        }
    };

    getGridColumns = (): GridColumnProps[] => {
        const { allowSelections, model } = this.props;

        const columns: GridColumnProps[] = [];
        if (allowSelections) {
            const disabled = model.isLoading || model.isLoadingSelections;

            columns.push(
                new GridColumn({
                    index: GRID_SELECTION_INDEX,
                    title: '',
                    showHeader: true,
                    cell: (selected: boolean, row: Map<string, any>): ReactNode => (
                        <input
                            checked={selected === true}
                            className="grid-panel__row-checkbox"
                            disabled={disabled}
                            onChange={this.selectRow.bind(this, row)} // eslint-disable-line
                            type="checkbox"
                        />
                    ),
                })
            );
        }

        model.displayColumns.forEach(col => {
            if (!col.helpTipRenderer && col.hasHelpTipData) {
                col = col.mutate({ helpTipRenderer: DOMAIN_FIELD });
            }
            columns.push(col);
        });

        return columns;
    };

    onColumnDrop = (source: string, target: string): void => {
        const { model } = this.props;
        const { displayColumns } = model;

        const sourceIndex = displayColumns.findIndex(col => col.index === source);
        const colInMotion = displayColumns.find(col => col.index === source);
        if (colInMotion) {
            let updatedColumns = displayColumns.filter(col => col.index !== source);
            const targetIndex = updatedColumns.findIndex(col => col.index === target);
            if (targetIndex > -1 && targetIndex !== sourceIndex) {
                updatedColumns = [
                    ...updatedColumns.slice(0, targetIndex),
                    colInMotion,
                    ...updatedColumns.slice(targetIndex),
                ];

                this.saveAsSessionView({
                    columns: updatedColumns.map(col => ({
                        fieldKey: col.fieldKeyPath /* 46256: use encoded fieldKeyPath */,
                        title: model.getCustomViewTitleOverride(col),
                    })),
                });

                incrementClientSideMetricCount('customViews', 'columnReorderDragNDrop');
            }
        }
    };

    headerCell = (column: GridColumn, index: number, columnCount?: number): ReactNode => {
        const { allowSelections, allowSorting, allowFiltering, allowViewCustomization, model } = this.props;
        const { isLoading, isLoadingSelections, hasRows, rowCount } = model;
        const disabled = isLoadingSelections || isLoading || (hasRows && rowCount === 0);
        const nonSelectableColumnCount = allowSelections ? columnCount - 1 : columnCount;

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
            allowViewCustomization && nonSelectableColumnCount > 1 ? this.hideColumn : undefined,
            allowViewCustomization ? this.onColumnTitleEdit : undefined,
            allowViewCustomization ? this.updateColumnTitle : undefined,
            model
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
            allowFiltering,
            allowSorting,
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
        const {
            selectedColumn,
            showCustomizeViewModal,
            showFilterModalFieldKey,
            showManageViewsModal,
            showSaveViewModal,
            actionValues,
            searchActionValues,
            errorMsg,
            isViewSaved,
            disableColumnDrag,
        } = this.state;
        const {
            hasData,
            id,
            isLoading,
            isLoadingSelections,
            rowsError,
            viewError,
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
                        className={classNames('grid-panel__body', { 'panel-body': asPanel, 'top-padding': !hasHeader })}
                    >
                        {!gridIsLoading && <ChartPanel actions={actions} model={model} />}

                        {showButtonBar && (
                            <ButtonBar
                                {...this.props}
                                actionValues={actionValues}
                                searchActionValues={searchActionValues}
                                onExport={onExport}
                                onFilter={this.showFilterModal}
                                onSearch={this.onSearch}
                                onViewSelect={this.onViewSelect}
                                onSaveView={this.onSaveNewView}
                                onCustomizeView={this.toggleCustomizeView}
                                onManageViews={this.onManageViews}
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

                        <div
                            className={classNames('grid-panel__grid ', 'grid-panel__lock-left', {
                                'grid-panel__lock-left-with-checkboxes': allowSelections,
                            })}
                        >
                            {viewError && <Alert>{viewError}</Alert>}
                            {hasError && <Alert>{errorMsg || queryInfoError || rowsError || selectionsError}</Alert>}

                            {hasData && (
                                <Grid
                                    headerCell={this.headerCell}
                                    onColumnDrop={
                                        allowViewCustomization && !disableColumnDrag ? this.onColumnDrop : undefined
                                    }
                                    showHeader={showHeader}
                                    calcWidths={allowSorting || allowFiltering}
                                    condensed
                                    emptyText={gridEmptyText}
                                    fixedHeight
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
                        selectedColumn={selectedColumn}
                    />
                )}
                {showManageViewsModal && (
                    <ManageViewsModal
                        schemaQuery={model.schemaQuery}
                        containerPath={model.containerPath}
                        currentView={view}
                        onDone={this.closeManageViewsModal}
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
    const queryConfigs = useMemo(() => ({ [id]: { ...queryConfig } }), [id, queryConfig]);
    return <GridPanelWithModelBody {...props} id={id} key={id} queryConfigs={queryConfigs} />;
});
