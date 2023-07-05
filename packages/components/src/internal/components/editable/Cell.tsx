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
import React, { ReactNode } from 'react';
import classNames from 'classnames';
import { List } from 'immutable';
import { OverlayTrigger, Popover } from 'react-bootstrap';
import { Filter, Query } from '@labkey/api';

import { cancelEvent, isCopyCutOrPaste, isFillDown, isSelectAll } from '../../events';

import { CELL_SELECTION_HANDLE_CLASSNAME, KEYS } from '../../constants';
import { Key } from '../../../public/useEnterEscape';

import { QueryColumn } from '../../../public/QueryColumn';

import { resolveInputRenderer } from '../forms/input/InputRenderFactory';

import { SelectInputChange } from '../forms/input/SelectInput';

import { CellMessage, ValueDescriptor } from './models';

import { CellActions, MODIFICATION_TYPES, SELECTION_TYPES } from './constants';
import { gridCellSelectInputProps, onCellSelectChange } from './utils';
import { LookupCell } from './LookupCell';
import { DateInputCell } from './DateInputCell';

// CSS Order: top, right, bottom, left
export type BorderMask = [boolean, boolean, boolean, boolean];

interface Props {
    borderMask: BorderMask;
    cellActions: CellActions;
    col: QueryColumn;
    colIdx: number;
    containerFilter?: Query.ContainerFilter;
    filteredLookupKeys?: List<any>;
    filteredLookupValues?: List<string>;
    focused?: boolean;
    forUpdate: boolean;
    getFilteredLookupKeys?: (linkedValues: any[]) => Promise<List<any>>;
    linkedValues?: any[];
    locked?: boolean;
    lookupValueFilters?: Filter.IFilter[];
    message?: CellMessage;
    name?: string;
    placeholder?: string;
    readOnly?: boolean;
    renderDragHandle?: boolean;
    row: any;
    rowIdx: number;
    selected?: boolean;
    selection?: boolean;
    values?: List<ValueDescriptor>;
}

interface State {
    filteredLookupKeys?: List<any>;
}

export class Cell extends React.PureComponent<Props, State> {
    private changeTO: number;
    private clickTO: number;
    private displayEl: React.RefObject<any>;

    static defaultProps = {
        focused: false,
        renderDragHandle: false,
        message: undefined,
        selected: false,
        selection: false,
        values: List<ValueDescriptor>(),
    };

    constructor(props: Props) {
        super(props);

        this.state = {
            filteredLookupKeys: this.props.filteredLookupKeys,
        };

        this.displayEl = React.createRef();
    }

    componentDidUpdate(prevProps: Readonly<Props>): void {
        if (!this.props.focused && this.props.selected) {
            this.displayEl.current.focus();

            if (!prevProps.selected) this.loadFilteredLookupKeys();
        }
    }

    loadFilteredLookupKeys = async (): Promise<void> => {
        const { getFilteredLookupKeys, linkedValues, readOnly } = this.props;

        if (!getFilteredLookupKeys || readOnly) return;

        const linkedFilteredLookupKeys = await getFilteredLookupKeys(linkedValues);

        this.setState({
            filteredLookupKeys: linkedFilteredLookupKeys,
        });
    };

    handleSelectionBlur = (): void => {
        const { cellActions, selected } = this.props;

        if (selected) {
            cellActions.clearSelection();
        }
    };

    replaceCurrentCellValue = (display: any, raw: any): void => {
        const { colIdx, rowIdx, cellActions } = this.props;
        cellActions.modifyCell(
            colIdx,
            rowIdx,
            [
                {
                    display,
                    raw,
                },
            ],
            MODIFICATION_TYPES.REPLACE
        );
    };

    handleBlur: React.FocusEventHandler<HTMLInputElement> = (evt): void => {
        clearTimeout(this.changeTO);
        this.handleSelectionBlur();
        this.replaceCurrentCellValue(evt.target.value, evt.target.value);
    };

    handleChange: React.ChangeEventHandler<HTMLInputElement> = (event): void => {
        event.persist();

        clearTimeout(this.changeTO);
        this.changeTO = window.setTimeout(() => {
            this.replaceCurrentCellValue(event.target.value, event.target.value);
        }, 250);
    };

    isReadOnly = (): boolean => {
        return this.props.readOnly || this.props.col.readOnly || this.props.locked;
    };

    isLocked = (): boolean => {
        return this.props.locked;
    };

    handleDblClick = (): void => {
        if (this.isReadOnly()) return;

        clearTimeout(this.clickTO);
        const { colIdx, cellActions, rowIdx } = this.props;
        cellActions.focusCell(colIdx, rowIdx);
    };

    handleKeys: React.KeyboardEventHandler<HTMLElement> = (event): void => {
        const { cellActions, colIdx, focused, rowIdx, selected } = this.props;
        const { focusCell, modifyCell, selectCell, fillDown } = cellActions;

        switch (event.keyCode) {
            case KEYS.Alt:
            case KEYS.SelectKey:
            case KEYS.Shift:
            case KEYS.Ctrl:

            case KEYS.LeftArrow:
            case KEYS.UpArrow:
            case KEYS.RightArrow:
            case KEYS.DownArrow:

            case KEYS.PageUp:
            case KEYS.PageDown:
            case KEYS.Home:
            case KEYS.End:

            case KEYS.LeftMetaKey:
            case KEYS.FFLeftMetaKey:
            case KEYS.CapsLock:
                break;
            case KEYS.Backspace:
            case KEYS.Delete:
                if (!focused && selected && !this.isReadOnly()) {
                    cancelEvent(event);
                    modifyCell(colIdx, rowIdx, undefined, MODIFICATION_TYPES.REMOVE_ALL);
                }
                break;
            case KEYS.Tab:
                if (selected) {
                    cancelEvent(event);
                    selectCell(event.shiftKey ? colIdx - 1 : colIdx + 1, rowIdx);
                }
                break;
            case KEYS.Enter:
                // focus takes precedence
                if (focused) {
                    cancelEvent(event);
                    selectCell(colIdx, rowIdx + 1);
                } else if (selected) {
                    cancelEvent(event);
                    focusCell(colIdx, rowIdx);
                }
                break;
            case KEYS.Escape:
                if (focused) {
                    cancelEvent(event);
                    selectCell(colIdx, rowIdx, undefined, true);
                }
                break;
            case KEYS.D:
                if (isFillDown(event)) {
                    cancelEvent(event);
                    fillDown();
                    break;
                }
            case KEYS.A:
                if (isSelectAll(event)) {
                    cancelEvent(event);
                    selectCell(colIdx, rowIdx, SELECTION_TYPES.ALL);
                    break;
                }
            default:
                // any other key
                if (!focused && !isCopyCutOrPaste(event)) {
                    // Do not cancel event here, otherwise, key capture will be lost
                    focusCell(colIdx, rowIdx, !this.isReadOnly());
                }
        }
    };

    /** This handles a subset of cell navigation key bindings from within a focused dropdown cell. */
    handleFocusedDropdownKeys: React.KeyboardEventHandler<HTMLElement> = (event): void => {
        const { cellActions, colIdx, rowIdx } = this.props;
        const { selectCell } = cellActions;

        switch (event.key) {
            case Key.ESCAPE:
                cancelEvent(event);
                selectCell(colIdx, rowIdx, undefined, true);
                break;
            case Key.TAB:
                cancelEvent(event);
                selectCell(event.shiftKey ? colIdx - 1 : colIdx + 1, rowIdx);
                break;
            default:
                break;
        }
    };

    handleMouseEnter: React.MouseEventHandler<HTMLDivElement> = (event): void => {
        const { cellActions, colIdx, rowIdx } = this.props;

        if (cellActions.inDrag()) {
            cancelEvent(event);
            cellActions.selectCell(colIdx, rowIdx, SELECTION_TYPES.AREA);
        }
    };

    handleSelect: React.MouseEventHandler<HTMLDivElement> = (event): void => {
        const { cellActions, colIdx, rowIdx, selected } = this.props;
        const { selectCell } = cellActions;

        if (event.ctrlKey || event.metaKey) {
            selectCell(colIdx, rowIdx, SELECTION_TYPES.SINGLE);
        } else if (event.shiftKey) {
            cancelEvent(event);
            selectCell(colIdx, rowIdx, SELECTION_TYPES.AREA);
        } else if (!selected) {
            const isDragHandle = (event.target as any)?.className?.indexOf(CELL_SELECTION_HANDLE_CLASSNAME) > -1;
            if (isDragHandle) {
                selectCell(colIdx, rowIdx, SELECTION_TYPES.AREA); // use AREA to keep initial selection in the range
            } else {
                selectCell(colIdx, rowIdx);
            }
        }
    };

    onSelectChange: SelectInputChange = (name, value, selectedOptions, props_): void => {
        const { cellActions, colIdx, rowIdx } = this.props;
        onCellSelectChange(cellActions, colIdx, rowIdx, selectedOptions, props_.multiple);
    };

    render() {
        const {
            borderMask,
            cellActions,
            col,
            colIdx,
            containerFilter,
            focused,
            forUpdate,
            renderDragHandle,
            message,
            placeholder,
            row,
            rowIdx,
            selected,
            selection,
            values,
            filteredLookupValues,
            lookupValueFilters,
        } = this.props;

        const { filteredLookupKeys } = this.state;

        const showLookup = col.isPublicLookup() || col.validValues;

        const isDateField = col.jsonType === 'date';

        if (!focused) {
            let valueDisplay = values
                .filter(vd => vd && vd.display !== undefined)
                .reduce((v, vd, i) => v + (i > 0 ? ', ' : '') + vd.display, '');

            const displayProps = {
                autoFocus: selected,
                className: classNames('cellular-display', {
                    'cell-border-top': borderMask[0],
                    'cell-border-right': borderMask[1],
                    'cell-border-bottom': borderMask[2],
                    'cell-border-left': borderMask[3],
                    'cell-selected': selected,
                    'cell-selection': selection,
                    'cell-warning': message !== undefined,
                    'cell-read-only': this.isReadOnly(),
                    'cell-locked': this.isLocked(),
                    'cell-menu': showLookup || col.inputRenderer,
                    'cell-placeholder': valueDisplay.length === 0 && placeholder !== undefined,
                }),
                onDoubleClick: this.handleDblClick,
                onKeyDown: this.handleKeys,
                onMouseDown: this.handleSelect,
                onMouseEnter: this.handleMouseEnter,
                onBlur: this.handleSelectionBlur,
                ref: this.displayEl,
                tabIndex: -1,
            };

            if (valueDisplay.length === 0 && placeholder) valueDisplay = placeholder;
            let cell: ReactNode;

            if (showLookup || col.inputRenderer) {
                cell = (
                    <div {...displayProps}>
                        <div className="cell-menu-value">{valueDisplay}</div>
                        {!this.isReadOnly() && (
                            <span onClick={this.handleDblClick} className="cell-menu-selector">
                                <i className="fa fa-chevron-down" />
                            </span>
                        )}
                    </div>
                );
            } else {
                cell = <div {...displayProps}>{valueDisplay}</div>;
            }

            if (message) {
                cell = (
                    <OverlayTrigger
                        overlay={
                            <Popover bsClass="popover" id="grid-cell-popover">
                                {message.message}
                            </Popover>
                        }
                        placement="top"
                    >
                        {cell}
                    </OverlayTrigger>
                );
            }

            return (
                <>
                    {cell}
                    {renderDragHandle && !this.isReadOnly() && (
                        <i className={'fa fa-square ' + CELL_SELECTION_HANDLE_CLASSNAME} />
                    )}
                </>
            );
        }

        const ColumnInputRenderer = resolveInputRenderer(col, true);
        if (ColumnInputRenderer) {
            return (
                <ColumnInputRenderer
                    col={col}
                    data={row}
                    formsy={false}
                    onSelectChange={this.onSelectChange}
                    selectInputProps={{
                        ...gridCellSelectInputProps,
                        onKeyDown: this.handleFocusedDropdownKeys,
                    }}
                    showLabel={false}
                    value={values?.get(0)?.raw}
                    values={values}
                />
            );
        }

        if (showLookup) {
            return (
                <LookupCell
                    col={col}
                    colIdx={colIdx}
                    containerFilter={containerFilter}
                    disabled={this.isReadOnly()}
                    lookupValueFilters={lookupValueFilters}
                    filteredLookupKeys={filteredLookupKeys}
                    filteredLookupValues={filteredLookupValues}
                    forUpdate={forUpdate}
                    modifyCell={cellActions.modifyCell}
                    onKeyDown={this.handleFocusedDropdownKeys}
                    rowIdx={rowIdx}
                    select={cellActions.selectCell}
                    values={values}
                />
            );
        }

        if (isDateField) {
            const rawDateValue = values.size === 0 ? '' : values.first().raw !== undefined ? values.first().raw : '';
            return (
                <DateInputCell
                    col={col}
                    colIdx={colIdx}
                    defaultValue={rawDateValue}
                    disabled={this.isReadOnly()}
                    modifyCell={cellActions.modifyCell}
                    onKeyDown={this.handleKeys}
                    select={cellActions.selectCell}
                    rowIdx={rowIdx}
                />
            );
        }

        return (
            <input
                autoFocus
                className="cellular-input"
                defaultValue={
                    values.size === 0 ? '' : values.first().display !== undefined ? values.first().display : ''
                }
                disabled={this.isReadOnly()}
                onBlur={this.handleBlur}
                onChange={this.handleChange}
                onKeyDown={this.handleKeys}
                placeholder={placeholder}
                tabIndex={-1}
                type="text"
            />
        );
    }
}
