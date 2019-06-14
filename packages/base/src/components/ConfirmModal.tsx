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
import * as React from "react";
import {Button, Modal} from "react-bootstrap";

interface Props {
    show: boolean
    title: string
    msg: any
    onConfirm: (any) => void
    onCancel: (any) => void
    confirmButtonText: string
    cancelButtonText: string
    confirmVariant: string
}

export class ConfirmModal extends React.PureComponent<Props, any> {
    static defaultProps = {
        show: true,
        title: 'Confirm',
        confirmButtonText: 'Yes',
        cancelButtonText: 'No'
    };

    render() {
        const { show, title, msg, onConfirm, onCancel, confirmButtonText, cancelButtonText, confirmVariant } = this.props;

        return (
            <Modal show={show} onHide={onCancel}>
                <Modal.Header closeButton>
                    <Modal.Title>{title}</Modal.Title>
                </Modal.Header>

                <Modal.Body>
                    {msg}
                </Modal.Body>

                <Modal.Footer>
                    <Button bsClass='btn btn-light' onClick={onCancel}>{cancelButtonText}</Button>
                    <Button bsClass={'btn btn-' + confirmVariant} onClick={onConfirm}>{confirmButtonText}</Button>
                </Modal.Footer>
            </Modal>
        )
    }
}