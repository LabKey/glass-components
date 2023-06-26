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

import { KEYS } from './constants';

export function cancelEvent(event: React.SyntheticEvent<any>): void {
    if (event) {
        event.stopPropagation();
        event.preventDefault();
    }
}

export function getPasteValue(event: React.ClipboardEvent<any>): string {
    if (isEvent(event)) {
        return (event.clipboardData || window['clipboardData']).getData('text');
    }
}

function isEvent(event: React.SyntheticEvent<any>): boolean {
    return event !== undefined && event !== null;
}

function isMetaKeyEvent(event: React.KeyboardEvent<any>, keyCode: number): boolean {
    return isEvent(event) && event.keyCode === keyCode && (event.ctrlKey || event.metaKey);
}

export const isFillDown = (event: React.KeyboardEvent<any>): boolean => isMetaKeyEvent(event, KEYS.D);
export const isSelectAll = (event: React.KeyboardEvent<any>): boolean => isMetaKeyEvent(event, KEYS.A);
export const isCopyCutOrPaste = (event: React.KeyboardEvent<any>): boolean =>
    isMetaKeyEvent(event, KEYS.C) || isMetaKeyEvent(event, KEYS.X) || isMetaKeyEvent(event, KEYS.V);

export function setCopyValue(event: any, value: string): boolean {
    if (isEvent(event)) {
        (event.clipboardData || window['clipboardData']).setData('text/plain', value);
        return true;
    }

    return false;
}
