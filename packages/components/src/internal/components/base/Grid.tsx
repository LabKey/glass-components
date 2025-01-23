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
import React, { CSSProperties, FC, Fragment, memo, PureComponent, ReactNode, RefObject } from 'react';
import classNames from 'classnames';
import { fromJS, List, Map } from 'immutable';

import { HelpTipRenderer } from '../forms/HelpTipRenderer';

import { GRID_HEADER_CELL_BODY, GRID_SELECTION_INDEX } from '../../constants';

import { LabelHelpTip } from './LabelHelpTip';
import { GridColumn } from './models/GridColumn';

function processColumns(columns: List<any>): List<GridColumn> {
    return columns
        .map(c => {
            if (c instanceof GridColumn) {
                return c;
            } else if (typeof c === 'string') {
                return new GridColumn({
                    index: c,
                    raw: c,
                    title: c,
                });
            }

            return new GridColumn({
                align: c.align,
                cell: c.cell,
                format: c.jsonType === 'float' || c.jsonType === 'int' ? c.format : undefined,
                helpTipRenderer: c.helpTipRenderer,
                hideTooltip: c.helpTipRenderer !== undefined,
                index: c.index,
                fixedWidth: c.fixedWidth,
                raw: c,
                tableCell: c.tableCell,
                title: c.title || c.caption,
                width: c.width,
            });
        })
        .toList();
}

function processData(data: GridData): List<Map<string, any>> {
    if (List.isList(data)) {
        return data as List<Map<string, any>>;
    }

    if (Array.isArray(data)) {
        return fromJS(data);
    }

    return List();
}

function resolveColumns(data: List<Map<string, any>>): List<GridColumn> {
    const columns = List<GridColumn>().asMutable();
    if (data.count() > 0) {
        data.get(0).map((value, title: string) => {
            columns.push(new GridColumn({ index: title, title }));
        });
    }

    return columns.asImmutable();
}

// export for jest testing
export function getColumnHoverText(info: any): string {
    let description = info?.description?.trim() || '';
    let sepLeft = description.length > 0 ? '(' : '';
    let sepRight = description.length > 0 ? ')' : '';

    // show field key for lookups to help determine path to field when the name is generic (i.e. "Name" is
    // from "Ancestors/Sources/Lab/Name"),  46256: use encoded fieldKeyPath, 49795: show tooltip for all columns
    description += info?.index ? ' ' + sepLeft + info.index + sepRight : '';
    sepLeft = description.length > 0 ? '(' : '';
    sepRight = description.length > 0 ? ')' : '';

    description += info?.phiProtected === true ? ' ' + sepLeft + 'PHI protected data removed' + sepRight : '';

    description = description.trim();
    return !description ? undefined : description;
}

interface GridHeaderProps {
    calcWidths?: boolean;
    columns: List<GridColumn>;
    headerCell?: any;
    onColumnDrop?: (sourceIndex: string, targetIndex: string) => void;
    showHeader?: boolean;
}

interface State {
    dragTarget: string;
}

// export for jest testing
export class GridHeader extends PureComponent<GridHeaderProps, State> {
    readonly state: State = { dragTarget: undefined };

    handleDragStart = (e): void => {
        const dragIndex = e.target.id;

        if (e.target?.tagName.toLowerCase() === 'th' && dragIndex !== GRID_SELECTION_INDEX) {
            e.dataTransfer.setData('dragIndex', dragIndex);
        }
    };
    handleDragOver = (e): void => {
        e.preventDefault();
    };
    handleDragEnd = (e): void => {
        this.setState({ dragTarget: undefined });
    };
    handleDragEnter = (e): void => {
        // Issue 51679: find parent TH element if hovering over child element
        let target = e.target;
        if (target?.tagName.toLowerCase() === 'div' && target.classNames?.indexOf('grid-header-cell__body') > -1) {
            target = target.parentElement;
        } else if (target?.tagName.toLowerCase() === 'span') {
            target = target.parentElement.parentElement;
        }

        const targetId = target?.tagName.toLowerCase() === 'th' ? target.id : undefined;
        if (targetId !== undefined && targetId !== '' && targetId !== GRID_SELECTION_INDEX) {
            this.setState({ dragTarget: targetId });
        }
    };
    handleDrop = (e): void => {
        var source = e.dataTransfer.getData('dragIndex');
        const target = this.state.dragTarget;
        if (source && target && source !== target) {
            this.props?.onColumnDrop(source, target);
        }
    };

    handleHeaderClick = (e): void => {
        // Issue 48610: app grid column header <th> element to trigger click on child <div>
        const childEl = e.target.getElementsByClassName(GRID_HEADER_CELL_BODY);
        if (childEl?.length === 1) {
            childEl[0].click();
            e.stopPropagation(); // Issue 51879
        }
    };

    render() {
        const { calcWidths, columns, headerCell, showHeader, onColumnDrop } = this.props;
        const { dragTarget } = this.state;

        if (!showHeader) {
            // returning null here causes <noscript/> to render which is not expected
            return <thead style={{ display: 'none' }} />;
        }

        return (
            <thead>
                <tr>
                    {columns
                        .map((column, i) => {
                            const { headerCls, index, fixedWidth, raw, title, width, hideTooltip } = column;
                            const draggable = onColumnDrop !== undefined;

                            let style: CSSProperties;
                            if (fixedWidth) {
                                style = {
                                    width: `${fixedWidth}px`,
                                };
                            }

                            let colMinWidth = width;
                            if (colMinWidth === undefined) {
                                // the additional 45px is to account for the grid column header icons for sort/filter and the dropdown toggle
                                colMinWidth = calcWidths && title ? Math.max(45 + title.length * 8, 150) : undefined;
                            }
                            if (!fixedWidth && colMinWidth !== undefined) {
                                if (!style) style = {};
                                style.minWidth = `${colMinWidth}px`;
                            }

                            if (column.showHeader) {
                                const className = classNames(headerCls, {
                                    'grid-header-cell': headerCls === undefined,
                                    'phi-protected': raw?.phiProtected === true,
                                    'grid-header-draggable': draggable && index !== GRID_SELECTION_INDEX,
                                    'grid-header-drag-over': dragTarget === index,
                                });
                                const description = getColumnHoverText(raw);

                                return (
                                    <th
                                        id={index}
                                        key={index}
                                        className={className}
                                        style={style}
                                        title={hideTooltip ? undefined : description}
                                        draggable={draggable}
                                        onDragStart={this.handleDragStart}
                                        onDragOver={this.handleDragOver}
                                        onDrop={this.handleDrop}
                                        onDragEnter={this.handleDragEnter}
                                        onDragEnd={this.handleDragEnd}
                                        onClick={this.handleHeaderClick}
                                    >
                                        {headerCell ? headerCell(column, i, columns.size) : title}
                                        {/* headerCell will render the helpTip, so only render here if not using headerCell() */}
                                        {!headerCell && column.helpTipRenderer && (
                                            <LabelHelpTip title={title} popoverClassName="label-help-arrow-top">
                                                <HelpTipRenderer type={column.helpTipRenderer} />
                                            </LabelHelpTip>
                                        )}
                                    </th>
                                );
                            }
                            return <th key={index} style={{ minWidth: style?.minWidth }} />;
                        }, this)
                        .toArray()}
                </tr>
            </thead>
        );
    }
}

interface GridMessagesProps {
    messages: List<Map<string, string>>;
}

const GridMessages: FC<GridMessagesProps> = memo(({ messages }) => (
    <div className="grid-messages">
        {messages
            .map((message: Map<string, string>, i) => {
                return (
                    // eslint-disable-next-line react/no-array-index-key
                    <div className={classNames('grid-message', message.get('type'))} key={i}>
                        {message.get('content')}
                    </div>
                );
            })
            .toArray()}
    </div>
));

interface GridRowProps {
    columns: List<GridColumn>;
    highlight: boolean;
    row: Map<string, any>;
    rowIdx: number;
}

const GridRow: FC<GridRowProps> = memo(({ columns, highlight, row, rowIdx }) => {
    // style cast to "any" type due to @types/react@16.3.14 switch to csstype package usage which does not declare
    // "textAlign" property correctly for <td> elements.
    return (
        <tr
            className={classNames({
                'grid-row-highlight': highlight,
                'grid-row-alternate': rowIdx % 2 === 0,
                'grid-row': rowIdx % 2 === 1,
            })}
        >
            {columns
                .map((column: GridColumn, c: number) =>
                    column.tableCell ? (
                        <Fragment key={column.index}>
                            {column.cell(row.get(column.index), row, column, rowIdx, c)}
                        </Fragment>
                    ) : (
                        <td key={column.index} style={{ textAlign: column.align || 'left' } as any}>
                            {column.cell(row.get(column.index), row, column, rowIdx, c)}
                        </td>
                    )
                )
                .toArray()}
        </tr>
    );
});
GridRow.displayName = 'GridRow';

interface EmptyGridRowProps {
    colSpan: number;
    emptyText: string;
    isLoading: boolean;
    loadingText: ReactNode;
}

const EmptyGridRow: FC<EmptyGridRowProps> = memo(({ colSpan, emptyText, isLoading, loadingText }) => (
    <tr key="grid-default-row" className={isLoading ? 'grid-loading' : 'grid-empty'}>
        <td colSpan={colSpan}>{isLoading ? loadingText : emptyText}</td>
    </tr>
));
EmptyGridRow.displayName = 'EmptyGridRow';

interface GridBodyProps {
    columns: List<GridColumn>;
    data: List<Map<string, any>>;
    emptyText: string;
    highlightRowIndexes?: List<number>;
    isLoading: boolean;
    loadingText: ReactNode;
    rowKey: string;
}

const GridBody: FC<GridBodyProps> = memo(props => {
    const { columns, data, emptyText, highlightRowIndexes, isLoading, loadingText, rowKey } = props;

    return (
        <tbody>
            {data
                .map((row, ind) => {
                    const highlight = highlightRowIndexes && highlightRowIndexes.contains(ind);
                    const key = rowKey ? row.get(rowKey) : ind;
                    return <GridRow columns={columns} highlight={highlight} key={key} row={row} rowIdx={ind} />;
                })
                .toArray()}

            {data.isEmpty() && (
                <EmptyGridRow
                    colSpan={columns.count()}
                    emptyText={emptyText}
                    isLoading={isLoading}
                    loadingText={loadingText}
                />
            )}
        </tbody>
    );
});

export type GridData = Array<Record<string, any>> | List<Map<string, any>>;

export interface GridProps {
    bordered?: boolean;
    calcWidths?: boolean;
    cellular?: boolean;
    columns?: List<any>;
    condensed?: boolean;
    data?: GridData;
    emptyText?: string;
    fixedHeight?: boolean;
    gridId?: string;
    headerCell?: any;
    highlightRowIndexes?: List<number>;
    isLoading?: boolean;
    loadingText?: ReactNode;
    messages?: List<Map<string, string>>;
    onColumnDrop?: (sourceIndex: string, targetIndex: string) => void;
    responsive?: boolean;
    /**
     * If a rowKey is specified the <Grid> will use it as a lookup key into each row. The associated value
     * will be used as the Key for the row.
     */
    rowKey?: string;
    showHeader?: boolean;
    striped?: boolean;
    tableRef?: RefObject<HTMLTableElement>;
}

export const Grid: FC<GridProps> = memo(props => {
    const {
        bordered = true,
        calcWidths = false,
        cellular = false,
        condensed = false,
        data = List<Map<string, any>>(),
        emptyText = 'No data available.',
        isLoading = false,
        loadingText = 'Loading...',
        messages = List<Map<string, string>>(),
        responsive = true,
        showHeader = true,
        striped = true,
        tableRef = undefined,
        fixedHeight = false,
        columns,
        headerCell,
        onColumnDrop,
        rowKey,
        highlightRowIndexes,
        gridId,
    } = props;
    const gridData = processData(data);
    const gridColumns = columns !== undefined ? processColumns(columns) : resolveColumns(gridData);
    const headerProps: GridHeaderProps = {
        calcWidths,
        columns: gridColumns,
        headerCell,
        onColumnDrop,
        showHeader,
    };

    const bodyProps: GridBodyProps = {
        columns: gridColumns,
        data: gridData,
        emptyText,
        isLoading,
        loadingText,
        rowKey,
        highlightRowIndexes,
    };

    const tableClasses = classNames({
        table: !cellular,
        'table-cellular': cellular,
        'table-striped': striped,
        'table-bordered': bordered,
        'table-condensed': condensed,
    });

    const wrapperClasses = classNames({
        'table-responsive': responsive,
        // fixedHeight is a misnomer, we used to set a fixed height, but now we use a max-height set via css
        'table-responsive--max-height': fixedHeight,
    });

    return (
        <div className={wrapperClasses} data-gridid={gridId}>
            <GridMessages messages={messages} />

            <table className={tableClasses} ref={tableRef}>
                <GridHeader {...headerProps} />
                <GridBody {...bodyProps} />
            </table>
        </div>
    );
});
