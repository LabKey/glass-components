/*
 * Copyright (c) 2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import * as OrigReact from 'react'
import React from 'reactn'
import classNames from 'classnames'
import { List } from 'immutable'
import { OverlayTrigger, Popover } from 'react-bootstrap'
import { QueryColumn } from '@glass/base'

import { cancelEvent, isCopy, isPaste, isSelectAll } from '../../events'
import { focusCell, inDrag, modifyCell, selectCell } from '../../actions'
import { CellMessage, EditorModel, ValueDescriptor } from '../../model'
import { KEYS, MODIFICATION_TYPES, SELECTION_TYPES } from '../../constants'
import { LookupCell, LookupCellProps } from './LookupCell'

interface Props {
    className?: string // This is not used.  Remove?
    col: QueryColumn
    colIdx: number
    modelId: string
    name?: string
    placeholder?: string
    readOnly?: boolean
    row: any
    rowIdx: number
}

export class Cell extends React.Component<Props, any> {

    private changeTO: number;
    private clickTO: number;
    private displayEl: React.RefObject<any>;

    constructor(props: Props) {
        super(props);

        this.handleBlur = this.handleBlur.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.handleDblClick = this.handleDblClick.bind(this);
        this.handleKeys = this.handleKeys.bind(this);
        this.handleMouseEnter = this.handleMouseEnter.bind(this);
        this.handleSelect = this.handleSelect.bind(this);

        this.displayEl = OrigReact.createRef();
    }

    // shouldComponentUpdate -- don't ever use this

    componentDidUpdate() {
        if (!this.focused() && this.selected()) {
            this.displayEl.current.focus();
        }
    }

    handleBlur(evt: any) {
        clearTimeout(this.changeTO);
        const { colIdx, modelId, rowIdx } = this.props;
        modifyCell(modelId, colIdx, rowIdx, {
            display: evt.target.value,
            raw: evt.target.value
        }, MODIFICATION_TYPES.REPLACE);
    }

    handleChange(event: React.ChangeEvent<HTMLInputElement>) {
        event.persist();
        this.changeTO = window.setTimeout(() => {
            const { colIdx, modelId, rowIdx } = this.props;
            modifyCell(modelId, colIdx, rowIdx, {
                display: event.target.value,
                raw: event.target.value
            }, MODIFICATION_TYPES.REPLACE);
        }, 250);
    }

    isReadOnly() : boolean {
        return this.props.readOnly || this.props.col.readOnly;
    }

    handleDblClick() {;
        if (this.isReadOnly())
            return;

        clearTimeout(this.clickTO);
        const { colIdx, modelId, rowIdx } = this.props;
        focusCell(modelId, colIdx, rowIdx);
    }

    handleKeys(event: React.KeyboardEvent<HTMLElement>) {
        const { colIdx, modelId, rowIdx } = this.props;
        const focused = this.focused();
        const selected = this.selected();

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
                if (!focused && selected) {
                    cancelEvent(event);
                    modifyCell(modelId, colIdx, rowIdx, undefined, MODIFICATION_TYPES.REMOVE_ALL);
                }
                break;
            case KEYS.Tab:
                if (selected) {
                    cancelEvent(event);
                    selectCell(modelId, event.shiftKey ? colIdx - 1 : colIdx + 1, rowIdx);
                }
                break;
            case KEYS.Enter:
                // focus takes precedence
                if (focused) {
                    cancelEvent(event);
                    selectCell(modelId, colIdx, rowIdx + 1);
                }
                else if (selected) {
                    cancelEvent(event);
                    focusCell(modelId, colIdx, rowIdx);
                }
                break;
            case KEYS.Escape:
                if (focused) {
                    cancelEvent(event);
                    selectCell(modelId, colIdx, rowIdx, undefined, true);
                }
                break;
            default: // any other key
                if (!focused && !isCopy(event) && !isPaste(event)) {
                    if (isSelectAll(event)) {
                        cancelEvent(event);
                        selectCell(modelId, colIdx, rowIdx, SELECTION_TYPES.ALL);
                    }
                    else {
                        // Do not cancel event here, otherwise, key capture will be lost
                        focusCell(modelId, colIdx, rowIdx, true);
                    }
                }
        }
    }

    handleMouseEnter(event: any) {
        const { colIdx, modelId, rowIdx } = this.props;

        if (inDrag(modelId)) {
            cancelEvent(event);
            selectCell(modelId, colIdx, rowIdx, SELECTION_TYPES.AREA);
        }
    }

    handleSelect(event) {
        const { colIdx, modelId, rowIdx } = this.props;

        if (event.ctrlKey || event.metaKey) {
            selectCell(modelId, colIdx, rowIdx, SELECTION_TYPES.SINGLE);
        }
        else if (event.shiftKey) {
            cancelEvent(event);
            selectCell(modelId, colIdx, rowIdx, SELECTION_TYPES.AREA);
        }
        else if (!this.selected()) {
            selectCell(modelId, colIdx, rowIdx);
        }
    }

    getModel(): EditorModel {
        const { modelId } = this.props;

        // need to access this.global directly to connect this component to the re-render cycle
        return this.global.QueryGrid_editors.get(modelId);
    }

    focused(): boolean {
        const { colIdx, rowIdx } = this.props;
        const model = this.getModel();

        return model ? model.isFocused(colIdx, rowIdx) : false;
    }

    selected(): boolean {
        const { colIdx, rowIdx } = this.props;
        const model = this.getModel();

        return model ? model.isSelected(colIdx, rowIdx) : false;
    }

    selection(): boolean {
        const { colIdx, rowIdx } = this.props;
        const model = this.getModel();

        return model ? model.inSelection(colIdx, rowIdx) : false;
    }

    message(): CellMessage {
        const { colIdx, rowIdx } = this.props;
        const model = this.getModel();

        return model ? model.getMessage(colIdx, rowIdx) : undefined;
    }

    values(): List<ValueDescriptor> {
        const { colIdx, rowIdx } = this.props;
        const model = this.getModel();

        return model ? model.getValue(colIdx, rowIdx) : List<ValueDescriptor>();
    }

    render() {
        const { col, colIdx, modelId, placeholder, rowIdx } = this.props;
        const message = this.message();
        const selected = this.selected();
        const values = this.values();

        if (!this.focused()) {
            let valueDisplay = values
                .filter(vd => vd.display !== undefined)
                .reduce((v, vd, i) => v + (i > 0 ? ', ' : '') + vd.display, '');

            const displayProps = {
                autoFocus: selected,
                className: classNames('cellular-display', {
                    'cell-selected': selected,
                    'cell-selection': this.selection(),
                    'cell-warning': message !== undefined,
                    'cell-read-only': this.isReadOnly(),
                    'cell-placeholder': valueDisplay.length == 0 && placeholder !== undefined
                }),
                onDoubleClick: this.handleDblClick,
                onKeyDown: this.handleKeys,
                onMouseDown: this.handleSelect,
                onMouseEnter: this.handleMouseEnter,
                ref: this.displayEl,
                tabIndex: -1
            };

            if (valueDisplay.length == 0 && placeholder)
                valueDisplay=placeholder;
            const cell = <div {...displayProps}>{valueDisplay}</div>;

            if (message) {
                return (
                    <OverlayTrigger
                        overlay={(
                            <Popover bsClass="popover" id="grid-cell-popover">
                                {message.message}
                            </Popover>
                        )}
                        placement="top">
                        {cell}
                    </OverlayTrigger>
                );
            }

            return cell;
        }

        if (col.isLookup()) {
            const lookupProps: LookupCellProps = {
                col,
                colIdx,
                modelId,
                rowIdx: rowIdx,
                select: selectCell,
                values
            };

            return <LookupCell {...lookupProps} />;
        }

        const inputProps = {
            autoFocus: true,
            defaultValue: values.size === 0 ? '' : values.first().display !== undefined ? values.first().display : '',
            disabled: this.isReadOnly(),
            className: 'cellular-input',
            onBlur: this.handleBlur,
            onChange: this.handleChange,
            onKeyDown: this.handleKeys,
            placeholder: placeholder,
            tabIndex: -1,
            type: 'text'
        };

        return <input {...inputProps}/>;
    }
}