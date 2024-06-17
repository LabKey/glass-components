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

import { cancelEvent, isFillDown, isCtrlOrMetaKey, isSelectAll } from '../../events';

import { CELL_SELECTION_HANDLE_CLASSNAME, KEYS } from '../../constants';
import { Key } from '../../../public/useEnterEscape';

import { QueryColumn } from '../../../public/QueryColumn';

import { resolveInputRenderer } from '../forms/input/InputRenderFactory';

import { SelectInputChange } from '../forms/input/SelectInput';

import { CellMessage, ValueDescriptor } from './models';

import { CellActions, MODIFICATION_TYPES, SELECTION_TYPES } from './constants';
import { EDIT_GRID_INPUT_CELL_CLASS, gridCellSelectInputProps, onCellSelectChange } from './utils';
import { LookupCell } from './LookupCell';
import { DateInputCell } from './DateInputCell';

// CSS Order: top, right, bottom, left
export type BorderMask = [boolean, boolean, boolean, boolean];

export interface CellProps {
    borderMaskBottom?: boolean;
    borderMaskLeft?: boolean;
    borderMaskRight?: boolean;
    borderMaskTop?: boolean;
    cellActions: CellActions;
    col: QueryColumn;
    colIdx: number;
    containerFilter?: Query.ContainerFilter;
    containerPath?: string;
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
    row?: any;
    rowIdx: number;
    selected?: boolean;
    selection?: boolean;
    values?: List<ValueDescriptor>;
}

interface State {
    filteredLookupKeys?: List<any>;
}

export class Cell extends React.PureComponent<CellProps, State> {
    private changeTO: number;
    private displayEl: React.RefObject<HTMLDivElement>;
    // This is used to record the dimensions of the cell before focusing so that the
    // subsequently rendered focused textarea can fit to the same dimensions
    private preFocusDOMRect: React.MutableRefObject<DOMRect>;
    private recordedKeys: string;
    private recordingTO: number;

    static defaultProps = {
        borderMaskBottom: false,
        borderMaskLeft: false,
        borderMaskRight: false,
        borderMaskTop: false,
        focused: false,
        renderDragHandle: false,
        message: undefined,
        selected: false,
        selection: false,
        values: List<ValueDescriptor>(),
    };

    constructor(props: CellProps) {
        super(props);

        this.state = {
            filteredLookupKeys: this.props.filteredLookupKeys,
        };

        this.displayEl = React.createRef();
        this.preFocusDOMRect = React.createRef();
    }

    get isDateTimeField(): boolean {
        const { col } = this.props;
        return col.jsonType === 'date' || col.jsonType === 'time';
    }

    get isLookup(): boolean {
        const { col } = this.props;
        return col.isPublicLookup() || this.isDateTimeField || !!col.validValues;
    }

    get isMultiline(): boolean {
        return this.props.col.inputType === 'textarea';
    }

    get isReadOnly(): boolean {
        return this.props.readOnly || this.props.col.readOnly || this.props.locked;
    }

    componentDidUpdate(prevProps: Readonly<CellProps>): void {
        if (!this.props.focused && this.props.selected) {
            this.displayEl.current.focus();

            if (prevProps.focused) {
                this.preFocusDOMRect.current = null;
            }
            if (!prevProps.selected) {
                this.loadFilteredLookupKeys();
            }
        }
    }

    focusCell = (colIdx: number, rowIdx: number, clearValue?: boolean): void => {
        this.preFocusDOMRect.current = this.displayEl.current.getBoundingClientRect();
        this.props.cellActions.focusCell(colIdx, rowIdx, clearValue);
    };

    loadFilteredLookupKeys = async (): Promise<void> => {
        const { getFilteredLookupKeys, linkedValues, readOnly } = this.props;

        if (!getFilteredLookupKeys || readOnly) return;

        const linkedFilteredLookupKeys = await getFilteredLookupKeys(linkedValues);

        this.setState({ filteredLookupKeys: linkedFilteredLookupKeys });
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

    handleBlur: React.FocusEventHandler<HTMLInputElement | HTMLTextAreaElement> = (evt): void => {
        clearTimeout(this.changeTO);
        this.handleSelectionBlur();
        this.replaceCurrentCellValue(evt.target.value, evt.target.value);
    };

    handleChange: React.ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement> = (event): void => {
        event.persist();

        clearTimeout(this.changeTO);
        this.changeTO = window.setTimeout(() => {
            this.replaceCurrentCellValue(event.target.value, event.target.value);
        }, 250);
    };

    handleDblClick = (): void => {
        if (this.isReadOnly) return;

        const { colIdx, rowIdx } = this.props;
        this.focusCell(colIdx, rowIdx);
    };

    handleKeys: React.KeyboardEventHandler<HTMLElement> = (event): void => {
        const { cellActions, colIdx, focused, rowIdx, selected } = this.props;
        const { modifyCell, selectCell, fillDown } = cellActions;
        const isRecording = this.recordingTO !== undefined;

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
                // "Backspace" and "Delete" are ignored on recorded input
                if (!focused && selected && !isRecording && !this.isReadOnly) {
                    cancelEvent(event);
                    modifyCell(colIdx, rowIdx, undefined, MODIFICATION_TYPES.REMOVE_ALL);
                }
                break;
            case KEYS.Tab:
                // "Tab" is ignored on recorded input
                if (selected && !isRecording) {
                    cancelEvent(event);
                    selectCell(event.shiftKey ? colIdx - 1 : colIdx + 1, rowIdx);
                }
                break;
            case KEYS.Enter:
                if (focused || this.isReadOnly) {
                    // Multi-line cells support "Shift" + "Enter" to start a new line.
                    if (!event.shiftKey || !this.isMultiline) {
                        cancelEvent(event);
                        selectCell(colIdx, rowIdx + 1);
                    }
                } else if (selected) {
                    // Record "Enter" key iff recording is in progress. Does not initiate recording.
                    if (isRecording) {
                        // Do not cancel event here, otherwise, key capture will be lost
                        this.recordKeys(event);
                    } else {
                        cancelEvent(event);
                        this.focusCell(colIdx, rowIdx);
                    }
                }
                break;
            case KEYS.Escape:
                // "Escape" is ignored on recorded input
                if (focused && !isRecording) {
                    cancelEvent(event);
                    selectCell(colIdx, rowIdx, undefined, true);
                }
                break;
            case KEYS.D:
                if (!focused && isFillDown(event) && !this.isReadOnly) {
                    cancelEvent(event);
                    fillDown();
                    break;
                }
            // eslint-disable-next-line no-fallthrough
            case KEYS.A:
                if (!focused && isSelectAll(event) && !this.isReadOnly) {
                    cancelEvent(event);
                    selectCell(colIdx, rowIdx, SELECTION_TYPES.ALL);
                    break;
                }
            // eslint-disable-next-line no-fallthrough -- intentionally fallthrough for "D" and "A" characters
            default:
                // any other key
                if (!focused && !isCtrlOrMetaKey(event) && !this.isReadOnly) {
                    // Do not cancel event here, otherwise, key capture will be lost
                    if (this.isLookup && !this.isDateTimeField) {
                        this.recordKeys(event);
                    } else {
                        this.focusCell(colIdx, rowIdx, true);
                    }
                }
                break;
        }
    };

    // Issue 49779: Support barcode scanners "streaming" input keys
    recordKeys = (event: React.KeyboardEvent<HTMLElement>): void => {
        clearTimeout(this.recordingTO);

        // record the key
        const { key } = event;
        if (key) {
            if (key === Key.ENTER) {
                this.recordedKeys += '\n';
            } else if (this.recordedKeys) {
                this.recordedKeys += key;
            } else {
                this.recordedKeys = key;
            }
        }

        // wait for more keystrokes and then fill or focus
        this.recordingTO = window.setTimeout(() => {
            this.recordingTO = undefined;
            const { cellActions, colIdx, rowIdx } = this.props;
            const { fillText, selectCell } = cellActions;

            if (this.recordedKeys.indexOf('\n') > -1) {
                fillText(colIdx, rowIdx, this.recordedKeys);
                selectCell(colIdx, rowIdx + 1);
            } else {
                this.focusCell(colIdx, rowIdx, !this.isReadOnly);
            }

            this.recordedKeys = undefined;
            // Wait for a very brief amount of time as automated input is
            // expected to quickly input subsequent characters
        }, 25);
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
        // Only handle event if the left mouse button is clicked
        if (event.buttons !== 1) return;

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

    onFocusCapture: React.FocusEventHandler<HTMLTextAreaElement> = (event): void => {
        // Move the cursor the end of the input value upon focus
        if (event.target.value) {
            event.target.selectionStart = event.target.selectionEnd = event.target.value.length;
        }
    };

    render() {
        const {
            borderMaskBottom,
            borderMaskLeft,
            borderMaskRight,
            borderMaskTop,
            cellActions,
            col,
            colIdx,
            containerFilter,
            filteredLookupValues,
            focused,
            forUpdate,
            locked,
            lookupValueFilters,
            message,
            placeholder,
            renderDragHandle,
            row,
            rowIdx,
            selected,
            selection,
            values,
            containerPath,
        } = this.props;

        const { filteredLookupKeys } = this.state;
        const alignRight = col.align === 'right';
        const isDateTimeField = this.isDateTimeField;
        const showLookup = this.isLookup;
        const showMenu = showLookup || (col.inputRenderer && col.inputRenderer !== 'AppendUnitsInput');

        if (!focused) {
            let valueDisplay = values
                .filter(vd => vd && vd.display !== undefined)
                .reduce((v, vd, i) => v + (i > 0 ? ', ' : '') + vd.display, '');

            const displayProps = {
                autoFocus: selected,
                className: classNames('cellular-display', {
                    'cell-align-right': alignRight,
                    'cell-border-top': borderMaskTop,
                    'cell-border-right': borderMaskRight,
                    'cell-border-bottom': borderMaskBottom,
                    'cell-border-left': borderMaskLeft,
                    'cell-locked': locked,
                    'cell-menu': showMenu,
                    'cell-placeholder': valueDisplay.length === 0 && placeholder !== undefined,
                    'cell-read-only': this.isReadOnly,
                    'cell-selected': selected,
                    'cell-selection': selection,
                    'cell-warning': message !== undefined,
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

            if (showMenu && !this.isReadOnly) {
                cell = (
                    <div {...displayProps}>
                        <div className="cell-content">
                            <div className="cell-menu-value">{valueDisplay}</div>
                            <span className="cell-menu-selector" onClick={this.handleDblClick}>
                                <i className="fa fa-chevron-down" />
                            </span>
                        </div>
                    </div>
                );
            } else {
                cell = (
                    <div {...displayProps}>
                        <div className="cell-content">
                            <span className="cell-content-value">{valueDisplay}</span>
                        </div>
                    </div>
                );
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
                    {renderDragHandle && !this.isReadOnly && (
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

        if (showLookup && !isDateTimeField) {
            return (
                <LookupCell
                    col={col}
                    colIdx={colIdx}
                    containerFilter={containerFilter}
                    containerPath={containerPath}
                    defaultInputValue={this.recordedKeys}
                    disabled={this.isReadOnly}
                    lookupValueFilters={lookupValueFilters}
                    filteredLookupKeys={filteredLookupKeys}
                    filteredLookupValues={filteredLookupValues}
                    forUpdate={forUpdate}
                    modifyCell={cellActions.modifyCell}
                    onKeyDown={this.handleFocusedDropdownKeys}
                    row={row}
                    rowIdx={rowIdx}
                    select={cellActions.selectCell}
                    values={values}
                />
            );
        }

        if (isDateTimeField) {
            const rawDateValue = values.size === 0 ? '' : values.first().raw !== undefined ? values.first().raw : '';
            return (
                <DateInputCell
                    col={col}
                    colIdx={colIdx}
                    defaultValue={rawDateValue}
                    disabled={this.isReadOnly}
                    modifyCell={cellActions.modifyCell}
                    onKeyDown={this.handleKeys}
                    rowIdx={rowIdx}
                    select={cellActions.selectCell}
                />
            );
        }

        let style: React.CSSProperties;
        if (this.preFocusDOMRect.current) {
            const { height, width } = this.preFocusDOMRect.current;
            style = {
                height: `${height}px`,
                minHeight: `${height}px`,
                minWidth: `${width}px`,
                width: `${width}px`,
            };
        }

        return (
            <textarea
                autoFocus
                className={classNames(`${EDIT_GRID_INPUT_CELL_CLASS} cellular-input`, {
                    'cellular-input-align-right': alignRight,
                    'cellular-input-multiline': this.isMultiline,
                })}
                defaultValue={
                    values.size === 0 ? '' : values.first().display !== undefined ? values.first().display : ''
                }
                disabled={this.isReadOnly}
                onBlur={this.handleBlur}
                onChange={this.handleChange}
                onFocusCapture={this.onFocusCapture}
                onKeyDown={this.handleKeys}
                placeholder={placeholder}
                style={style}
                tabIndex={-1}
            />
        );
    }
}
