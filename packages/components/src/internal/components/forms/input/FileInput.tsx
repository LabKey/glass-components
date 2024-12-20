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
import React, { FC, ReactNode, RefObject } from 'react';
import classNames from 'classnames';
import { Map } from 'immutable';

import { FormsyInjectedProps, withFormsy } from '../formsy';
import { INPUT_WRAPPER_CLASS_NAME } from '../constants';
import { FieldLabel } from '../FieldLabel';
import { cancelEvent } from '../../../events';

import { QueryColumn } from '../../../../public/QueryColumn';
import { FileColumnRenderer } from '../../../renderers/FileColumnRenderer';

import { FILELINK_RANGE_URI } from '../../domainproperties/constants';

import { DisableableInput, DisableableInputProps, DisableableInputState } from './DisableableInput';

export interface FileInputProps extends DisableableInputProps {
    addLabelAsterisk?: boolean;
    changeDebounceInterval?: number;
    elementWrapperClassName?: string;
    formsy?: boolean;
    initialValue?: any;
    labelClassName?: string;
    maxFileSize?: number;
    name?: string;
    onChange?: (fileMap: Record<string, File>) => void;
    queryColumn?: QueryColumn;
    renderFieldLabel?: (queryColumn: QueryColumn, label?: string, description?: string) => ReactNode;
    showLabel?: boolean;
    toggleDisabledTooltip?: string;
}

type FileInputImplProps = FileInputProps & FormsyInjectedProps<any>;

interface State extends DisableableInputState {
    data: any;
    error: string;
    file: File;
    isHover: boolean;
}

class FileInputImpl extends DisableableInput<FileInputImplProps, State> {
    fileInput: RefObject<HTMLInputElement>;

    static defaultProps = {
        ...DisableableInput.defaultProps,
        ...{
            changeDebounceInterval: 0,
            elementWrapperClassName: INPUT_WRAPPER_CLASS_NAME,
            showLabel: true,
        },
    };

    constructor(props: FileInputImplProps) {
        super(props);
        this.processFiles = this.processFiles.bind(this);
        this.onChange = this.onChange.bind(this);
        this.onDrag = this.onDrag.bind(this);
        this.onDragLeave = this.onDragLeave.bind(this);
        this.onDrop = this.onDrop.bind(this);
        this.onRemove = this.onRemove.bind(this);
        this.setFormValue = this.setFormValue.bind(this);
        this.toggleDisabled = this.toggleDisabled.bind(this);

        this.fileInput = React.createRef<HTMLInputElement>();
        this.state = {
            // FileInput only accepts query-shaped row data as the initialValue
            // as that is what is accepted by FileColumnRenderer. Without this there is likely insufficient
            // metadata to render and act on the associated file value.
            data: Map.isMap(props.initialValue) ? props.initialValue : undefined,
            isHover: false,
            file: null,
            error: '',
            isDisabled: props.initiallyDisabled,
        };
    }

    getInputName(): string {
        // FIXME if there's more than one of these on the page with the same inputName
        // files will go to the wrong place when uploaded unless the names are unique
        return this.props.name ?? this.props.queryColumn.fieldKey;
    }

    processFiles(fileList: FileList, transferItems?: DataTransferItemList): void {
        if (fileList.length > 1) {
            this.setState({ error: 'Only one file allowed' });
            return;
        }

        if (transferItems && transferItems[0].webkitGetAsEntry().isDirectory) {
            this.setState({ error: 'Folders are not supported, only one file allowed' });
            return;
        }

        if (this.props.maxFileSize && fileList[0].size > this.props.maxFileSize) {
            this.setState({ error: 'File must not exceed acceptable size.' });
            return;
        }
        this.setFormValue(fileList[0]);
    }

    setFormValue(file: File): void {
        const { formsy, onChange, setValue } = this.props;
        this.setState({ data: undefined, file, error: '' });
        onChange?.({ [this.getInputName()]: file });

        if (formsy) {
            setValue?.(file);
        }
    }

    onChange(event: React.FormEvent<HTMLInputElement>): void {
        cancelEvent(event);
        this.processFiles(this.fileInput.current.files);
    }

    onDrag(event: React.DragEvent<HTMLElement>): void {
        cancelEvent(event);

        if (!this.state.isHover) {
            this.setState({ isHover: true });
        }
    }

    onDragLeave(event: React.DragEvent<HTMLElement>): void {
        cancelEvent(event);

        if (this.state.isHover) {
            this.setState({ isHover: false });
        }
    }

    onDrop(event: React.DragEvent<HTMLElement>): void {
        cancelEvent(event);

        if (event.dataTransfer && event.dataTransfer.files) {
            this.processFiles(event.dataTransfer.files, event.dataTransfer.items);
            this.setState({ isHover: false });
        }
    }

    onRemove(): void {
        // A value of null is supported by server APIs to clear/remove a file field's value.
        this.setFormValue(null);
    }

    render() {
        const {
            addLabelAsterisk,
            allowDisable,
            elementWrapperClassName,
            labelClassName,
            queryColumn,
            renderFieldLabel,
            showLabel,
            toggleDisabledTooltip,
        } = this.props;
        const { data, file, isDisabled, isHover } = this.state;

        const name = this.getInputName();
        const inputId = `${name}-fileUpload`;
        let body;

        if (file) {
            const attachedFileClass = classNames('attached-file__inline-container', {
                'file-upload__is-hover': isHover,
            });
            body = (
                <div
                    className={attachedFileClass}
                    onDrop={this.onDrop}
                    onDragEnter={this.onDrag}
                    onDragOver={this.onDrag}
                    onDragLeave={this.onDragLeave}
                >
                    <span className="fa fa-times-circle attached-file__remove-icon" onClick={this.onRemove} />
                    <span className="fa fa-file-text attached-file--icon" />
                    <span>{file.name}</span>
                    <span className="file-upload__error-message">{this.state.error}</span>
                </div>
            );
        } else if (data?.get('value')) {
            body = (
                <FileColumnRenderer
                    isFileLink={queryColumn?.rangeURI === FILELINK_RANGE_URI}
                    data={data}
                    onRemove={isDisabled ? undefined : this.onRemove}
                />
            );
        } else {
            body = (
                <>
                    <input
                        disabled={this.state.isDisabled}
                        type="file"
                        className="file-upload__input" // This class makes the file input hidden
                        name={name}
                        id={inputId}
                        multiple={false}
                        onChange={this.onChange}
                        ref={this.fileInput}
                    />

                    {/* We render a label here so click and drag events propagate to the input above */}
                    <label
                        className={classNames('file-upload--compact-label', {
                            'file-upload--is-disabled': isDisabled,
                            'file-upload__is-hover': isHover && !isDisabled,
                        })}
                        htmlFor={inputId}
                        onDrop={this.onDrop}
                        onDragEnter={this.onDrag}
                        onDragOver={this.onDrag}
                        onDragLeave={this.onDragLeave}
                    >
                        <i className="fa fa-cloud-upload" aria-hidden="true" />
                        &nbsp;
                        <span>Select file or drag and drop here.</span>
                        <span className="file-upload__error-message">{this.state.error}</span>
                    </label>
                </>
            );
        }

        const labelOverlayProps = {
            addLabelAsterisk,
            inputId,
            // While this component supports binding Formsy it does not use a Formsy component
            // to render the associated label. As such, the label overlay is always configured as isFormsy={false}.
            isFormsy: false,
            labelClass: labelClassName,
        };

        return (
            <div className="form-group row">
                {renderFieldLabel ? (
                    renderFieldLabel(queryColumn)
                ) : (
                    <FieldLabel
                        labelOverlayProps={labelOverlayProps}
                        showLabel={showLabel}
                        showToggle={allowDisable}
                        column={queryColumn}
                        isDisabled={isDisabled}
                        toggleProps={{
                            onClick: toggleDisabledTooltip ? undefined : this.toggleDisabled,
                            toolTip: toggleDisabledTooltip,
                        }}
                    />
                )}
                <div className={elementWrapperClassName}>{body}</div>
            </div>
        );
    }
}

/**
 * This class is a wrapper around FileInputImpl to be able to bind formsy-react. It uses
 * the Formsy.Decorator to bind formsy-react so the element can be validated, submitted, etc.
 */
const FileInputFormsy = withFormsy<FileInputProps, any>(FileInputImpl);

export const FileInput: FC<FileInputProps> = props => {
    const { formsy = false } = props;
    if (formsy) {
        return <FileInputFormsy name={undefined} {...props} formsy />;
    }
    return <FileInputImpl {...(props as FileInputImplProps)} formsy={false} />;
};

FileInput.displayName = 'FileInput';
