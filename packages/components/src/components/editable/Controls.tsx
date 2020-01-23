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
import { Button, MenuItem, SplitButton } from 'react-bootstrap';
import classNames from 'classnames';
import { MAX_EDITABLE_GRID_ROWS } from '../../constants';
import { LabelHelpTip } from '../..';

export type PlacementType = 'top' | 'bottom' | 'both';

export interface AddRowsControlProps {
    disable?: boolean
    initialCount?: number
    maxCount?: number
    maxTotalCount?: number
    minCount?: number
    nounPlural?: string
    nounSingular?: string
    addText?: string
    onAdd: Function
    quickAddText?: string
    onQuickAdd?: Function
    placement?: PlacementType
    wrapperClass?: string
}

interface AddRowsControlState {
    count?: number
}

export class AddRowsControl extends React.Component<AddRowsControlProps, AddRowsControlState> {

    static defaultProps = {
        addText: "Add",
        disable: false,
        initialCount: 1,
        maxCount: MAX_EDITABLE_GRID_ROWS,
        minCount: 1,
        nounPlural: 'rows',
        nounSingular: 'row',
        placement: 'bottom'
    };

    private addCount: React.RefObject<any>;

    constructor(props: AddRowsControlProps) {
        super(props);

        this.state = {
            count: this.props.initialCount
        };

        this.getAddCount = this.getAddCount.bind(this);
        this.onAdd = this.onAdd.bind(this);
        this.onBlur = this.onBlur.bind(this);
        this.onChange = this.onChange.bind(this);
        this.onQuickAdd = this.onQuickAdd.bind(this);

        this.addCount = React.createRef();
    }

    getAddCount(): number {
        if (this.addCount.current) {
            return parseInt(this.addCount.current.value);
        }
    }

    isValid(count: number): boolean {
        return (!this.props.minCount || count > this.props.minCount - 1) && (!this.props.maxCount || count <= this.getMaxRowsToAdd());
    }

    onAdd() {
        if (this.isValid(this.state.count)) {
            this.props.onAdd(this.state.count);
        }
    }

    onBlur() {
        if (!this.isValid(this.state.count)) {
            this.setState({
                count: this.props.initialCount
            });
        }
    }

    onChange(event) {
        let count = parseInt(event.target.value);

        if (isNaN(count)) {
            count = undefined
        }

        this.setState({
            count
        });
    }

    hasError(): boolean {
        const { count } = this.state;

        return count !== undefined && !this.isValid(count);
    }

    onQuickAdd() {
        const { onQuickAdd } = this.props;
        if (onQuickAdd) {
            onQuickAdd(this.state.count);
        }
    }

    renderButton() {
        const { disable, quickAddText, onQuickAdd, addText, nounPlural } = this.props;

        return (
            <span className="input-group-btn">
                {quickAddText && onQuickAdd ?
                    <SplitButton
                        id="addRowsDropdown"
                        onClick={this.onAdd}
                        title={addText}
                    >
                        <MenuItem onClick={this.onQuickAdd}>{quickAddText}</MenuItem>
                    </SplitButton> :
                    <Button title={disable ? "Maximum number of " + nounPlural + " reached." : undefined} disabled={disable || this.hasError()} onClick={this.onAdd}>{addText}</Button>
                }
            </span>
        )
    }

    shouldRenderHelpText() {
        return this.props.maxCount || this.props.maxTotalCount;
    }

    renderRowHelpText = () => {
        const { nounPlural, maxTotalCount } = this.props;

        const maxIncrement = this.getMaxRowsToAdd();
        const haveMaxIncrement = maxIncrement !== 0 && maxIncrement !== undefined && maxIncrement < maxTotalCount;
        return (
            <>
                {haveMaxIncrement && <>At most {maxIncrement} {nounPlural} can be added at one time</>}
                {maxTotalCount &&
                <>
                    {haveMaxIncrement ? " and no " : "No "}
                    more than {maxTotalCount} {nounPlural} are allowed in total
                </>
                }
                .
            </>
        );
    };

    getMaxRowsToAdd() {
        const {maxCount, maxTotalCount} = this.props;

        return maxCount && maxTotalCount && maxCount > maxTotalCount ? maxTotalCount : maxCount;
    }

    render() {
        const { disable, minCount, nounPlural, nounSingular, placement, wrapperClass } = this.props;
        const { count } = this.state;

        const hasError = !disable && this.hasError();
        const wrapperClasses = classNames('editable-grid__controls', 'text-nowrap', wrapperClass, {
            'margin-top': placement === 'bottom',
            'has-error': hasError
        });
        const maxToAdd = this.getMaxRowsToAdd();

        return (
            <div className={wrapperClasses}>
                <span className="input-group">
                    {this.renderButton()}
                    <input
                        className="form-control"
                        max={disable ? undefined : maxToAdd}
                        min={disable ? undefined : minCount}
                        disabled={disable}
                        name="addCount"
                        onBlur={this.onBlur}
                        onChange={this.onChange}
                        ref={this.addCount}
                        style={{width: '65px'}}
                        type="number"
                        value={count ? count.toString() : undefined}
                    />
                    <span style={{display: 'inline-block', padding: '6px 8px'}}>
                        {hasError ? <span className="text-danger">{`${minCount}-${maxToAdd} ${nounPlural}.`}</span> : (count === 1 ? nounSingular : nounPlural)}
                        {this.shouldRenderHelpText() && <LabelHelpTip body={this.renderRowHelpText} title={"Data Limits"}/>}
                    </span>
                </span>
            </div>
        )
    }
}

interface RightClickToggleProps {
    bsRole?: any
    onClick?: any
}

export class RightClickToggle extends React.Component<RightClickToggleProps, any> {

    constructor(props) {
        super(props);
        this.handleClick = this.handleClick.bind(this);
    }

    handleClick(e) {
        if (e.button === 2 || e.buttons === 2) {
            e.preventDefault();
            this.props.onClick(e);
        }
    }

    render() {
        return (
            <div className="cellular-count-content" onClick={this.handleClick} onContextMenu={this.handleClick}>
                {this.props.children}
            </div>
        )
    }
}
