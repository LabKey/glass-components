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
import React, { FC, useMemo } from 'react';

import { createPortal } from 'react-dom';

import { QueryModel } from '../../../public/QueryModel/QueryModel';
import { MenuItem } from '../../dropdowns';
import { useOverlayTriggerState } from '../../OverlayTrigger';
import { Popover } from '../../Popover';

interface Props {
    href?: string;
    maxSelection?: number;
    maxSelectionDisabledMsg?: string;
    nounPlural: string; // always used, doesn't need default value
    onClick?: () => void;
    queryModel: QueryModel;
    text: React.ReactNode;
}

interface DisabledSelectionMenuItemProps {
    message: string;
    text: React.ReactNode;
}

export const DisabledSelectionMenuItem: FC<DisabledSelectionMenuItemProps> = ({ message, text }) => {
    const { onMouseEnter, onMouseLeave, portalEl, show, targetRef } = useOverlayTriggerState<HTMLLIElement>(
        'disabled-selection-menu-item',
        true,
        false
    );
    const overlay = useMemo(
        () => (
            <Popover placement="right" id="disabled-selection-menu-item-popover" targetRef={targetRef}>
                {message}
            </Popover>
        ),
        [message, targetRef]
    );
    return (
        <MenuItem disabled onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave} ref={targetRef}>
            {text}
            {show && createPortal(overlay, portalEl)}
        </MenuItem>
    );
};
DisabledSelectionMenuItem.displayName = 'DisabledSelectionMenuItem';

export const SelectionMenuItem: FC<Props> = props => {
    const { href, maxSelection, maxSelectionDisabledMsg, nounPlural, onClick, queryModel, text } = props;
    const selectionSize = queryModel?.selections?.size;
    const { tooFewSelected, tooManySelected } = useMemo(
        () => ({
            tooFewSelected: selectionSize !== undefined && selectionSize === 0,
            tooManySelected: selectionSize !== undefined && selectionSize > maxSelection,
        }),
        [maxSelection, selectionSize]
    );
    const disabled = tooFewSelected || tooManySelected;

    if (disabled) {
        const message = tooFewSelected
            ? `Select one or more ${nounPlural}.`
            : maxSelectionDisabledMsg || `At most ${maxSelection?.toLocaleString()} ${nounPlural} can be selected.`;
        return <DisabledSelectionMenuItem message={message} text={text} />;
    }

    return (
        <MenuItem href={href} onClick={onClick}>
            {text}
        </MenuItem>
    );
};
SelectionMenuItem.displayName = 'SelectionMenuItem';
