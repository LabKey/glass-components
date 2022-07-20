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
import React from 'react';
import classNames from 'classnames';
import {List} from 'immutable';
import {OverlayTrigger, Popover} from 'react-bootstrap';
import {Query} from '@labkey/api';

import {cancelEvent, isCopy, isPaste, isSelectAll} from '../../events';
import {CellMessage, ValueDescriptor} from '../../models';
import {CELL_SELECTION_HANDLE_CLASSNAME, KEYS, MODIFICATION_TYPES, SELECTION_TYPES} from '../../constants';

import {QueryColumn} from '../../..';

import {getQueryColumnRenderers} from '../../global';

import {LookupCell, LookupCellProps} from './LookupCell';
import {DateInputCell, DateInputCellProps} from './DateInputCell';

export interface CellActions {
    clearSelection: () => void;
    focusCell: (colIdx: number, rowIdx: number, clearValue?: boolean) => void;
    inDrag: () => boolean; // Not really an action, but useful to be part of this interface
    modifyCell: (colIdx: number, rowIdx: number, newValues: ValueDescriptor[], mod: MODIFICATION_TYPES) => void;
    selectCell: (colIdx: number, rowIdx: number, selection?: SELECTION_TYPES, resetValue?: boolean) => void;
}

interface Props {
    cellActions: CellActions;
    col: QueryColumn;
    colIdx: number;
    containerFilter?: Query.ContainerFilter;
    filteredLookupKeys?: List<any>;
    filteredLookupValues?: List<string>;
    focused?: boolean;
    lastSelection?: boolean;
    locked?: boolean;
    message?: CellMessage;
    name?: string;
    placeholder?: string;
    readOnly?: boolean;
    rowIdx: number;
    selected?: boolean;
    selection?: boolean;
    values?: List<ValueDescriptor>;
}

export class Cell extends React.PureComponent<Props> {
    private changeTO: number;
    private clickTO: number;
    private displayEl: React.RefObject<any>;

    static defaultProps = {
        focused: false,
        lastSelection: false,
        message: undefined,
        selected: false,
        selection: false,
        values: List<ValueDescriptor>(),
    };

    constructor(props: Props) {
        super(props);

        this.displayEl = React.createRef();
    }

    componentDidUpdate(): void {
        if (!this.props.focused && this.props.selected) {
            this.displayEl.current.focus();
        }
    }

    handleSelectionBlur = (): void => {
        const { cellActions, selected } = this.props;

        if (selected) {
            cellActions.clearSelection();
        }
    };

    handleBlur = (evt: any): void => {
        clearTimeout(this.changeTO);
        const { colIdx, rowIdx, cellActions } = this.props;
        cellActions.modifyCell(
            colIdx,
            rowIdx,
            [
                {
                    display: evt.target.value,
                    raw: evt.target.value,
                },
            ],
            MODIFICATION_TYPES.REPLACE
        );
    };

    handleChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
        event.persist();

        clearTimeout(this.changeTO);
        this.changeTO = window.setTimeout(() => {
            const { colIdx, rowIdx, cellActions } = this.props;
            cellActions.modifyCell(
                colIdx,
                rowIdx,
                [
                    {
                        display: event.target.value,
                        raw: event.target.value,
                    },
                ],
                MODIFICATION_TYPES.REPLACE
            );
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

    handleKeys = (event: React.KeyboardEvent<HTMLElement>) => {
        const { cellActions, colIdx, focused, rowIdx, selected } = this.props;
        const { focusCell, modifyCell, selectCell } = cellActions;

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
            default:
                // any other key
                if (!focused && !isCopy(event) && !isPaste(event)) {
                    if (isSelectAll(event)) {
                        cancelEvent(event);
                        selectCell(colIdx, rowIdx, SELECTION_TYPES.ALL);
                    } else {
                        // Do not cancel event here, otherwise, key capture will be lost
                        focusCell(colIdx, rowIdx, !this.isReadOnly());
                    }
                }
        }
    };

    handleMouseEnter = (event: any): void => {
        const { cellActions, colIdx, rowIdx } = this.props;

        if (cellActions.inDrag()) {
            cancelEvent(event);
            cellActions.selectCell(colIdx, rowIdx, SELECTION_TYPES.AREA);
        }
    };

    handleSelect = (event): void => {
        const { cellActions, colIdx, rowIdx, selected } = this.props;
        const { selectCell } = cellActions;
        const isDragHandle = event.target?.className?.indexOf(CELL_SELECTION_HANDLE_CLASSNAME) > -1;

        if (event.ctrlKey || event.metaKey) {
            selectCell(colIdx, rowIdx, SELECTION_TYPES.SINGLE);
        } else if (event.shiftKey) {
            cancelEvent(event);
            selectCell(colIdx, rowIdx, SELECTION_TYPES.AREA);
        } else if (!selected) {
            if (isDragHandle) {
                selectCell(colIdx, rowIdx, SELECTION_TYPES.AREA);
            } else {
                selectCell(colIdx, rowIdx);
            }
        }
    };

    render() {
        const {
            cellActions,
            col,
            colIdx,
            containerFilter,
            focused,
            lastSelection,
            message,
            placeholder,
            rowIdx,
            selected,
            selection,
            values,
            filteredLookupValues,
            filteredLookupKeys,
        } = this.props;
        const showLookup = col.isPublicLookup() || col.validValues;

        const isDateField = col.jsonType === 'date';

        if (!focused) {
            let valueDisplay = values
                .filter(vd => vd && vd.display !== undefined)
                .reduce((v, vd, i) => v + (i > 0 ? ', ' : '') + vd.display, '');

            const displayProps = {
                autoFocus: selected,
                className: classNames('cellular-display', {
                    'cell-selected': selected,
                    'cell-selection': selection,
                    'cell-warning': message !== undefined,
                    'cell-read-only': this.isReadOnly(),
                    'cell-locked': this.isLocked(),
                    'cell-menu': showLookup,
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
            let cell;
            if (showLookup) {
                cell = (
                    <div {...displayProps}>
                        {lastSelection && <i className={'fa fa-square ' + CELL_SELECTION_HANDLE_CLASSNAME} />}
                        <div className="cell-menu-value">{valueDisplay}</div>
                        <span onClick={this.handleDblClick} className="cell-menu-selector">
                            <i className="fa fa-chevron-down" />
                        </span>
                    </div>
                );
            } else {
                cell = (
                    <div {...displayProps}>
                        {lastSelection && <i className={'fa fa-square ' + CELL_SELECTION_HANDLE_CLASSNAME} />}
                        {valueDisplay}
                    </div>
                );
            }

            if (message) {
                return (
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

            return cell;
        }

        if (showLookup) {
            const lookupProps: LookupCellProps = {
                col,
                colIdx,
                containerFilter,
                disabled: this.isReadOnly(),
                modifyCell: cellActions.modifyCell,
                rowIdx,
                select: cellActions.selectCell,
                values,
                filteredLookupValues,
                filteredLookupKeys,
            };

            return <LookupCell {...lookupProps} />;
        }

        if (isDateField) {
            const rawDateValue = values.size === 0 ? '' : values.first().raw !== undefined ? values.first().raw : '';
            const dateProps: DateInputCellProps = {
                col,
                colIdx,
                rowIdx,
                disabled: this.isReadOnly(),
                modifyCell: cellActions.modifyCell,
                select: cellActions.selectCell,
                defaultValue: rawDateValue,
                onKeyDown: this.handleKeys,
            };

            return <DateInputCell {...dateProps} />;
        }

        // Some cells have custom displays such as multi value comma separated values like alias so
        // first check renderer for editable value
        let renderer;
        let defaultValue;
        if (col.columnRenderer) {
            renderer = getQueryColumnRenderers().get(col.columnRenderer.toLowerCase());
        }

        if (renderer?.getEditableValue) {
            defaultValue = renderer.getEditableValue(values);
        }

        if (defaultValue === undefined) {
            defaultValue = values.size === 0 ? '' : values.first().display !== undefined ? values.first().display : '';
        }

        const inputProps = {
            autoFocus: true,
            defaultValue,
            disabled: this.isReadOnly(),
            className: 'cellular-input',
            onBlur: this.handleBlur,
            onChange: this.handleChange,
            onKeyDown: this.handleKeys,
            placeholder,
            tabIndex: -1,
            type: 'text',
        };

        return <input {...inputProps} />;
    }
}
