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

interface DetailPanelHeaderProps {
    isEditable: boolean;
    canUpdate: boolean;
    editing?: boolean;
    verb?: string;
    onClickFn?: () => void;
    title?: string;
    warning?: string;
    useEditIcon: boolean;
}

export class DetailPanelHeader extends React.Component<DetailPanelHeaderProps, any> {
    static defaultProps = {
        title: 'Details',
        useEditIcon: true,
        verb: 'Editing',
    };

    render() {
        const { isEditable, canUpdate, editing, onClickFn, warning, title, useEditIcon, verb } = this.props;

        if (editing) {
            return (
                <div className="detail__edit--heading">
                    {verb}{' '}{title}
                    {warning !== undefined && (
                        <span>
                            <span> - </span>
                            <span className="edit__warning">{warning}</span>
                        </span>
                    )}
                </div>
            );
        }

        return (
            <div className="detail__edit--heading">
                {title}
                {isEditable && canUpdate && (
                    <>
                        <div className="detail__edit-button" onClick={onClickFn}>
                            {useEditIcon ? <i className="fa fa-pencil-square-o" /> : 'Edit'}
                        </div>
                        <div className="clearfix" />
                    </>
                )}
            </div>
        );
    }
}
