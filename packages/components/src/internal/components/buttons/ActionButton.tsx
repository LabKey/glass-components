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

import { LabelHelpTip } from '../base/LabelHelpTip';

export interface ActionButtonProps {
    buttonClass?: string;
    spanClass?: string;
    containerClass?: string;
    disabled?: boolean;
    title?: string;
    onClick: () => void;
    helperTitle?: string;
    helperBody?: any;
}

export class ActionButton extends React.PureComponent<ActionButtonProps> {
    static defaultProps = {
        containerClass: 'form-group',
        helperTitle: 'More Info',
    };

    render() {
        const { buttonClass, containerClass, disabled, onClick, title, helperBody, helperTitle, children, spanClass } = this.props;

        const buttonClasses = classNames('container--action-button btn btn-default', spanClass, { disabled });

        return (
            <div className={containerClass} title={title}>
                <div className={buttonClass}>
                    <span className={buttonClasses} onClick={disabled ? undefined : onClick}>
                        {children}
                    </span>
                    {helperBody ? <LabelHelpTip body={helperBody} title={helperTitle} /> : ''}
                </div>
            </div>
        );
    }
}
