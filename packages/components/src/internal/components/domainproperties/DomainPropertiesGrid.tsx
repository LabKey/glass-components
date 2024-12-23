import React, { ReactNode } from 'react';
import { List } from 'immutable';

import { headerCell } from '../../renderers';

import { GRID_SELECTION_INDEX } from '../../constants';

import { GridColumn } from '../base/models/GridColumn';

import { Grid } from '../base/Grid';

import { DomainDesignerCheckbox } from './DomainDesignerCheckbox';

import { compareStringsAlphabetically } from './propertiesUtil';

import { DomainDesign, DomainPropertiesGridColumn, IFieldChange } from './models';

interface DomainPropertiesGridProps {
    actions: {
        onFieldsChange: (changes: List<IFieldChange>, index: number, expand: boolean) => void;
        scrollFunction: (i: number) => void;
        toggleSelectAll: () => void;
    };
    appPropertiesOnly?: boolean;
    domain: DomainDesign;
    hasOntologyModule: boolean;
    search: string;
    selectAll: boolean;
    showFilterCriteria: boolean;
}

interface DomainPropertiesGridState {
    gridColumns?: List<GridColumn | DomainPropertiesGridColumn>;
    gridData: List<any>;
    search: string;
    visibleGridData: List<any>;
}

export class DomainPropertiesGrid extends React.PureComponent<DomainPropertiesGridProps, DomainPropertiesGridState> {
    constructor(props: DomainPropertiesGridProps) {
        super(props);
        const { domain, actions, appPropertiesOnly, hasOntologyModule, showFilterCriteria } = this.props;
        const { onFieldsChange, scrollFunction } = actions;
        const { domainKindName } = domain;
        const gridData = domain.getGridData(appPropertiesOnly, hasOntologyModule, showFilterCriteria);

        // TODO: Maintain hash of fieldIndex : gridIndex on state in order to make delete and filter run in N rather than N^2 time.
        this.state = {
            gridData,
            gridColumns: domain.getGridColumns(
                onFieldsChange,
                scrollFunction,
                domainKindName,
                appPropertiesOnly,
                hasOntologyModule,
                showFilterCriteria
            ),
            visibleGridData: this.getVisibleGridData(gridData),
            search: this.props.search,
        };
    }

    componentDidUpdate(prevProps: Readonly<DomainPropertiesGridProps>): void {
        const { appPropertiesOnly, domain, hasOntologyModule, showFilterCriteria } = this.props;
        const prevSearch = prevProps.search;
        const newSearch = this.props.search;
        const prevGridData = prevProps.domain.getGridData(appPropertiesOnly, hasOntologyModule, showFilterCriteria);
        const newGridData = domain.getGridData(appPropertiesOnly, hasOntologyModule, showFilterCriteria);

        // When new field added
        if (prevGridData.size < newGridData.size) {
            this.uponRowAdd(newGridData);
            // When fields are deleted
        } else if (prevGridData.size > newGridData.size) {
            this.uponRowDelete();
            // When search is updated
        } else if (prevSearch !== newSearch) {
            this.uponFilter();
            // If selection updated
        } else {
            this.uponRowSelection();
        }
    }

    getVisibleGridData = (gridData: List<any>): List<any> => {
        return gridData.filter(row => row.get('visible')) as List<any>;
    };

    uponRowAdd = (newGridData: List<any>): void => {
        const { gridData, visibleGridData } = this.state;
        const updatedGridData = gridData.push(newGridData.get(-1));
        const updatedVisibleGridData = visibleGridData.push(newGridData.get(-1));

        this.setState({ gridData: updatedGridData, visibleGridData: updatedVisibleGridData });
    };

    uponRowDelete = (): void => {
        const { appPropertiesOnly, domain, hasOntologyModule, showFilterCriteria } = this.props;
        const { gridData } = this.state;
        const initGridData = domain.getGridData(appPropertiesOnly, hasOntologyModule, showFilterCriteria);

        // Handle bug that occurs if multiple fields have the same name
        const replaceGridData = new Set(gridData.map(row => row.get('name')).toJS()).size !== gridData.size;
        if (replaceGridData) {
            this.setState({ gridData: initGridData, visibleGridData: this.getVisibleGridData(initGridData) });
            return;
        }

        const updatedGridData = gridData.reduce((updatedGridData, row) => {
            const newRowIndex = initGridData.findIndex(newRow => newRow.get('name') === row.get('name'));
            return newRowIndex !== -1
                ? updatedGridData.set(updatedGridData.size, row.set('fieldIndex', newRowIndex))
                : updatedGridData;
        }, List());

        const visibleGridData = this.getVisibleGridData(updatedGridData);

        this.setState({ gridData: updatedGridData, visibleGridData });
    };

    uponFilter = (): void => {
        const { appPropertiesOnly, domain, hasOntologyModule, showFilterCriteria } = this.props;
        const { gridData } = this.state;
        const initGridData = domain.getGridData(appPropertiesOnly, hasOntologyModule, showFilterCriteria);

        const updatedGridData = gridData.map(row => {
            const nextRowIndex = initGridData.findIndex(nextRow => nextRow.get('fieldIndex') === row.get('fieldIndex'));
            return row.set('visible', initGridData.get(nextRowIndex).get('visible'));
        }) as List<any>;
        const visibleGridData = this.getVisibleGridData(updatedGridData);

        this.setState({ gridData: updatedGridData, visibleGridData });
    };

    uponRowSelection = (): void => {
        const { appPropertiesOnly, domain, hasOntologyModule, showFilterCriteria } = this.props;
        const { gridData } = this.state;
        const initGridData = domain.getGridData(appPropertiesOnly, hasOntologyModule, showFilterCriteria);

        for (let i = 0; i < gridData.size; i++) {
            const row = gridData.get(i);
            const rowSelection = row.get('selected');

            const newRowIndex = initGridData.findIndex(newRow => newRow.get('fieldIndex') === row.get('fieldIndex'));
            const newRow = initGridData.get(newRowIndex);
            const newRowSelection = newRow.get('selected');

            if (rowSelection !== newRowSelection) {
                const updatedGridData = gridData.update(i, field => field.set('selected', newRowSelection));
                const visibleGridData = this.getVisibleGridData(updatedGridData);

                this.setState({ gridData: updatedGridData, visibleGridData });
                break;
            }
        }
    };

    sortColumn = (column, direction): void => {
        const { gridData } = this.state;

        const sortedFields = gridData.sort((field1, field2) => {
            const col = column.index;

            return compareStringsAlphabetically(field1.get(col), field2.get(col), direction);
        }) as List<any>;
        const updatedVisibleGridData = this.getVisibleGridData(sortedFields);

        this.setState({ gridData: sortedFields, visibleGridData: updatedVisibleGridData });
    };

    headerCell = (column: GridColumn, index: number, columnCount?: number): ReactNode => {
        const { selectAll, actions } = this.props;
        if (column.index === GRID_SELECTION_INDEX) {
            return (
                <DomainDesignerCheckbox className="domain-summary-selectAll" checked={selectAll} onChange={actions.toggleSelectAll} />
            );
        }

        return headerCell(index, column, false, columnCount, this.sortColumn);
    };

    render() {
        const { visibleGridData, gridColumns } = this.state;

        return (
            <Grid
                data={visibleGridData}
                columns={gridColumns}
                headerCell={this.headerCell}
                condensed={true}
                calcWidths={true}
            />
        );
    }
}
