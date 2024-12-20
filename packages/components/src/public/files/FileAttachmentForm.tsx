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
import React, { PureComponent, ReactNode } from 'react';
import { List, Map } from 'immutable';
import classNames from 'classnames';

import { FileAttachmentContainer } from '../../internal/components/files/FileAttachmentContainer';
import {
    convertRowDataIntoPreviewData,
    fileMatchesAcceptedFormat,
    fileSizeLimitCompare,
    getFileExtension,
} from '../../internal/components/files/actions';
import { FilePreviewGrid } from '../../internal/components/files/FilePreviewGrid';
import { SimpleResponse } from '../../internal/components/files/models';

import { LoadingSpinner } from '../../internal/components/base/LoadingSpinner';
import { FormSection } from '../../internal/components/base/FormSection';
import { Progress } from '../../internal/components/base/Progress';

import { inferDomainFromFile } from '../InferDomainResponse';

import { SchemaQuery } from '../SchemaQuery';

import { TemplateDownloadButton } from './TemplateDownloadButton';
import { FileSizeLimitProps, FileGridPreviewProps } from './models';

export interface FileAttachmentFormProps {
    acceptedFormats?: string; // comma-separated list of allowed extensions i.e. '.png, .jpg, .jpeg'
    allowDirectories?: boolean;
    allowMultiple?: boolean;
    cancelText?: string;
    compact?: boolean;
    fileCountSuffix?: string;
    // map between file extension and the callback function to use instead of the standard uploadDataFileForPreview
    fileSpecificCallback?: Map<string, (file: File) => Promise<SimpleResponse>>;
    includeDirectoryFiles?: boolean;
    index?: number;
    initialFileNames?: string[];
    initialFiles?: Record<string, File>;
    isSubmitting?: boolean;
    label?: ReactNode;
    labelLong?: string;
    onCancel?: () => void;
    onError?: (error: string) => void;
    onFileChange?: (files: Map<string, File>) => void;
    onFileRemoval?: (attachmentName: string, updatedFiles?: Map<string, File>) => void;
    onSubmit?: (files: Map<string, File>) => void;
    previewGridProps?: FileGridPreviewProps;
    ref?: any;
    showAcceptedFormats?: boolean;
    showButtons?: boolean;
    showLabel?: boolean;
    showProgressBar?: boolean;
    // map between extension and SizeLimitProps.  Use "all" as the key for limits that apply to all formats.
    // "all" limits will be overridden by limits for a specific extension.
    sizeLimits?: Map<string, FileSizeLimitProps>;
    sizeLimitsHelpText?: ReactNode;
    submitText?: string;
    templateSchemaQuery?: SchemaQuery;
    templateUrl?: string;
}

interface State {
    attachedFiles: Map<string, File>;
    errorMessage?: string;
    previewData?: List<Map<string, any>>;
    previewStatus?: string;
}

export class FileAttachmentForm extends PureComponent<FileAttachmentFormProps, State> {
    static defaultProps = {
        acceptedFormats: '',
        showAcceptedFormats: true,
        allowDirectories: true,
        includeDirectoryFiles: false,
        allowMultiple: true,
        cancelText: 'Cancel',
        label: 'Attachments',
        labelLong: 'Select file or drag and drop here.',
        onCancel: undefined,
        onSubmit: undefined,
        showButtons: false,
        showLabel: true,
        showProgressBar: false,
        submitText: 'Upload',
        compact: false,
        fileSpecificCallback: undefined,
    };

    fileAttachmentContainerRef: React.RefObject<FileAttachmentContainer>;

    constructor(props?: FileAttachmentFormProps) {
        super(props);

        this.fileAttachmentContainerRef = React.createRef();

        if (props.allowMultiple && props.previewGridProps) {
            console.warn('Showing the file preview grid is only supported for single file upload.');
        }

        this.state = {
            attachedFiles: Map<string, File>(),
            errorMessage: undefined,
            previewStatus: undefined,
        };
    }

    componentDidMount(): void {
        this.initPreviewData();
    }

    componentDidUpdate(prevProps: FileAttachmentFormProps): void {
        if (prevProps.previewGridProps !== this.props.previewGridProps) {
            this.initPreviewData();
        }
    }

    initPreviewData(): void {
        const { previewGridProps } = this.props;

        if (previewGridProps?.initialData) {
            this.setState({
                previewData: convertRowDataIntoPreviewData(
                    previewGridProps.initialData.get('data'),
                    previewGridProps.previewCount
                ),
            });
        }
    }

    determineFileSize = (): number => {
        return this.state.attachedFiles.reduce((total, file) => (total += file.size), 0);
    };

    reportFileOversized = (sizeStr: string): void => {
        const errorMessage = `This file is too large to be previewed. The maximum size allowed for previewing files of this type is ${sizeStr}.`;
        this.setState({ errorMessage });
    };

    handleFileChange = (fileList: Record<string, File>): void => {
        this.setState(
            state => ({ attachedFiles: state.attachedFiles.merge(fileList) }),
            () => {
                const { onFileChange, sizeLimits, fileSpecificCallback, allowMultiple } = this.props;
                const { attachedFiles } = this.state;

                if (!allowMultiple) {
                    // currently only supporting 1 file for processing contents
                    const firstFile = attachedFiles.valueSeq().first();
                    const sizeCheck = fileSizeLimitCompare(firstFile, sizeLimits);

                    const fileTypeFn = fileSpecificCallback?.get(getFileExtension(firstFile.name));
                    if (fileTypeFn) {
                        if (!sizeCheck.isOversized) {
                            fileTypeFn(firstFile)
                                .then(res => {
                                    this.updateErrors(res.success ? null : res.msg);
                                })
                                .catch(res => {
                                    this.updateErrors(res.msg);
                                });
                        } else {
                            this.reportFileOversized(sizeCheck.limits.maxSize.displayValue);
                        }
                    } else if (this.isShowPreviewGrid()) {
                        if (!sizeCheck.isOversizedForPreview) {
                            this.uploadDataFileForPreview();
                        } else {
                            this.reportFileOversized(sizeCheck.limits.maxPreviewSize.displayValue);
                        }
                    }
                }

                onFileChange?.(attachedFiles);
            }
        );
    };

    handleFileRemoval = (attachmentName: string): void => {
        this.setState(
            state => ({
                attachedFiles: state.attachedFiles.remove(attachmentName),
                errorMessage: undefined,
                previewData: undefined,
                previewStatus: undefined,
            }),
            () => {
                this.props.onFileRemoval?.(attachmentName, this.state.attachedFiles);
            }
        );
    };

    // Used in module editor—see DirectoryOperations.tsx
    manuallyClearFiles = (attachmentName: string): void => {
        this.fileAttachmentContainerRef.current.handleRemove(attachmentName);
    };

    handleSubmit = (): void => {
        this.props.onSubmit?.(this.state.attachedFiles);

        // clear out attached files once they have been submitted.
        this.setState({ attachedFiles: Map<string, File>() });
    };

    renderButtons(): ReactNode {
        const { cancelText, onCancel, submitText, compact } = this.props;

        const button = (
            <button
                className={classNames('file-form-submit-btn btn btn-success', {
                    'file-form-submit-btn--compact': compact,
                })}
                disabled={this.state.attachedFiles.size === 0}
                onClick={this.handleSubmit}
                title={submitText}
                type="button"
            >
                {submitText}
            </button>
        );

        if (compact) {
            return button;
        }

        return (
            <div className="row top-padding bottom-padding">
                <div className="col-xs-6">
                    <button className="btn btn-default" onClick={onCancel} title={cancelText} type="button">
                        {cancelText}
                    </button>
                </div>
                <div className="col-xs-6">
                    <div className="pull-right">{button}</div>
                </div>
            </div>
        );
    }

    isShowPreviewGrid = (): boolean => {
        return !this.props.allowMultiple && !!this.props.previewGridProps;
    };

    shouldShowPreviewGrid = (): boolean => {
        const { errorMessage, previewData, previewStatus } = this.state;
        return !!(errorMessage || previewStatus || previewData);
    };

    renderPreviewGrid(): ReactNode {
        const { previewGridProps } = this.props;
        const { errorMessage, previewData, previewStatus } = this.state;

        if (this.shouldShowPreviewGrid()) {
            if (previewData || errorMessage) {
                return <FilePreviewGrid {...previewGridProps} data={previewData} errorMsg={errorMessage} />;
            } else if (previewStatus) {
                return (
                    <div className="margin-top">
                        <LoadingSpinner msg={previewStatus} />
                    </div>
                );
            }
        }

        return null;
    }

    updatePreviewStatus(previewStatus: string): void {
        this.setState({ previewStatus });
    }

    updateErrors(errorMessage: string): void {
        if (errorMessage) {
            this.props.onError?.(errorMessage);
        }
        this.setState({ errorMessage });
    }

    uploadDataFileForPreview(): void {
        const { previewGridProps } = this.props;
        const { attachedFiles } = this.state;

        // just take the first file, since we only support 1 file at this time
        const file = attachedFiles.first();

        // check if this usage has a set of formats which are supported for preview
        if (previewGridProps.acceptedFormats) {
            const fileCheck = fileMatchesAcceptedFormat(file.name, previewGridProps.acceptedFormats);
            // if the file extension doesn't match the accepted preview formats, return without trying to get preview data
            if (!fileCheck.isMatch) {
                return;
            }
        }

        this.updatePreviewStatus('Uploading file...');

        inferDomainFromFile(file, previewGridProps.previewCount, previewGridProps.domainKindName)
            .then(response => {
                this.updatePreviewStatus(null);

                if (!previewGridProps.skipPreviewGrid) {
                    if (response.data.size > 1) {
                        const previewData = convertRowDataIntoPreviewData(
                            response.data,
                            previewGridProps.previewCount,
                            response.fields
                        );
                        this.setState(() => ({ previewData }));
                        this.updateErrors(null);
                    } else {
                        this.updateErrors('No data found in the attached file.');
                    }
                }

                previewGridProps.onPreviewLoad?.(response, file);
            })
            .catch(reason => {
                this.updateErrors(
                    reason
                        ? reason?.exception || reason
                        : 'There was a problem determining the fields in the uploaded file.  Please check the format of the file.'
                );
            });
    }

    shouldRenderAcceptedFormats(): boolean {
        return !!(this.props.acceptedFormats && this.props.showAcceptedFormats && !this.shouldShowPreviewGrid());
    }

    shouldRenderTemplateButton = (): boolean => {
        return this.props.templateUrl?.length > 0 && !this.shouldShowPreviewGrid();
    };

    render(): React.ReactNode {
        const {
            acceptedFormats,
            allowDirectories,
            includeDirectoryFiles,
            fileCountSuffix,
            allowMultiple,
            index,
            initialFileNames,
            initialFiles,
            label,
            labelLong,
            showButtons,
            showLabel,
            showProgressBar,
            sizeLimits,
            sizeLimitsHelpText,
            isSubmitting,
            compact,
        } = this.props;
        const renderAcceptFormats = this.shouldRenderAcceptedFormats();
        const renderTemplateButton = this.shouldRenderTemplateButton();

        return (
            <>
                <span className="translator--toggle__wizard">
                    <FormSection iconSpacer={false} label={label} showLabel={showLabel}>
                        <div className={classNames({ 'file-upload--one-row': compact })}>
                            <FileAttachmentContainer
                                ref={this.fileAttachmentContainerRef}
                                index={index}
                                acceptedFormats={acceptedFormats}
                                allowDirectories={allowDirectories}
                                includeDirectoryFiles={includeDirectoryFiles}
                                fileCountSuffix={fileCountSuffix}
                                handleChange={this.handleFileChange}
                                handleRemoval={this.handleFileRemoval}
                                initialFileNames={initialFileNames}
                                initialFiles={initialFiles}
                                allowMultiple={allowMultiple}
                                sizeLimits={sizeLimits}
                                sizeLimitsHelpText={sizeLimitsHelpText}
                                labelLong={labelLong}
                                compact={compact}
                            />
                            {compact && showButtons && this.renderButtons()}
                        </div>
                    </FormSection>
                </span>
                {this.renderPreviewGrid()}
                {showProgressBar && (
                    <Progress estimate={this.determineFileSize() * 0.1} modal title="Uploading" toggle={isSubmitting} />
                )}
                {(renderAcceptFormats || renderTemplateButton) && (
                    <div className="row">
                        <div className="col-md-9">
                            {renderAcceptFormats && (
                                <div className="file-form-formats">
                                    <strong>Supported formats include: </strong>
                                    {acceptedFormats}
                                </div>
                            )}
                        </div>
                        <div className="col-md-3">
                            <div className="pull-right">
                                {renderTemplateButton && (
                                    <TemplateDownloadButton
                                        defaultTemplateUrl={this.props.templateUrl}
                                        schemaQuery={this.props.templateSchemaQuery}
                                    />
                                )}
                            </div>
                        </div>
                    </div>
                )}
                {!compact && showButtons && this.renderButtons()}
            </>
        );
    }
}
