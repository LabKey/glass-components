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
import { ClipboardEvent, KeyboardEvent, MouseEvent, SyntheticEvent } from 'react';

import { KEYS } from './constants';

export function cancelEvent(event: SyntheticEvent<any>): void {
    if (event) {
        event.stopPropagation();
        event.preventDefault();
    }
}

export function getPasteValue(event: ClipboardEvent<any>): string {
    if (isEvent(event)) {
        return (event.clipboardData || window['clipboardData']).getData('text');
    }
}

function isEvent(event: SyntheticEvent<any>): boolean {
    return event !== undefined && event !== null;
}

export function isCtrlOrMetaKey(event: KeyboardEvent<unknown> | MouseEvent<unknown>): boolean {
    return event.ctrlKey || event.metaKey;
}

function isMetaKeyEvent(event: KeyboardEvent<any>, keyCode: number): boolean {
    return isEvent(event) && event.keyCode === keyCode && isCtrlOrMetaKey(event);
}

export const isFillDown = (event: KeyboardEvent<any>): boolean => isMetaKeyEvent(event, KEYS.D);
export const isSelectAll = (event: KeyboardEvent<any>): boolean => isMetaKeyEvent(event, KEYS.A);

export function setCopyValue(event: any, value: string): boolean {
    if (isEvent(event)) {
        (event.clipboardData || window['clipboardData']).setData('text/plain', value);
        return true;
    }

    return false;
}
