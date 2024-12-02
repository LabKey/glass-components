import React, { Component, ReactNode } from 'react';
import { Map, Set, List } from 'immutable';

import { FileAttachmentForm } from '../../../public/files/FileAttachmentForm';

import { IFile } from './models';
import { FilesListing } from './FilesListing';

interface Props {
    addFileText?: string;
    canDelete?: boolean;
    canInsert?: boolean;
    files?: List<IFile>;
    getFilePropertiesEditTrigger?: (file: IFile) => ReactNode;
    handleDelete?: (file: string) => void;
    handleDownload?: (files: Set<string>) => void;
    handleFileChange?: (cancel: boolean) => void;
    handleUpload?: (files: Map<string, File>) => Promise<void>;
    headerText?: string;
    noFilesMessage?: string;
    noReadOnlyFilesMessage?: string;
    onPropertyUpdate?: () => void;
    onSubmit?: () => void;
    onUploadFiles?: () => void;
    readOnlyFiles?: List<IFile>;
    readOnlyHeaderText?: string;
    useFilePropertiesEditTrigger?: boolean;
}

interface State {
    confirmDeletionSet: Set<string>;
    selectedFiles?: Set<string>;
    showFileUploadPanel?: boolean;
}

export class FilesListingForm extends Component<Props, State> {
    static defaultProps = {
        addFileText: 'Attach File',
    };

    constructor(props: Props) {
        super(props);

        this.state = {
            confirmDeletionSet: Set<string>(),
            selectedFiles: Set<string>(),
            showFileUploadPanel: false,
        };
    }

    toggleUploadSection = (): void => {
        this.setState(state => ({ showFileUploadPanel: !state.showFileUploadPanel }));
        this.props.handleFileChange?.(true);
    };

    toggleFileSelection = (event): void => {
        const { target } = event;
        const { name } = target;
        this.setState(state => ({
            selectedFiles: target.checked ? state.selectedFiles.add(name) : state.selectedFiles.delete(name),
        }));
    };

    uploadAttachedFiles = async (files: Map<string, File>): Promise<void> => {
        const { handleUpload, onSubmit, onUploadFiles } = this.props;

        if (!handleUpload) {
            throw new Error(
                'FilesListingForm configuration error. Must specify "handleUpload" handler if uploading files is allowed.'
            );
        }

        // Before upload
        onSubmit?.();

        // Upload
        try {
            await handleUpload(files);
        } catch (err) {
            // handleUpload expected to handle failures
        }

        // After upload
        onUploadFiles?.();
        this.toggleUploadSection();
    };

    downloadSelectedFiles = (): void => {
        this.props.handleDownload?.(this.state.selectedFiles);
    };

    handleFileChange = (): void => {
        this.props.handleFileChange?.(false);
    };

    toggleDeleteConfirmation = (fileName: string): void => {
        this.setState(({ confirmDeletionSet }) => ({
            confirmDeletionSet: confirmDeletionSet.has(fileName)
                ? confirmDeletionSet.delete(fileName)
                : confirmDeletionSet.add(fileName),
        }));
    };

    deleteFile = (fileName: string): void => {
        this.setState(state => ({ selectedFiles: state.selectedFiles.delete(fileName) }));
        this.props.handleDelete?.(fileName);
    };

    render(): ReactNode {
        const {
            addFileText,
            canDelete,
            canInsert,
            files,
            getFilePropertiesEditTrigger,
            headerText,
            noFilesMessage,
            readOnlyFiles,
            readOnlyHeaderText,
            noReadOnlyFilesMessage,
            useFilePropertiesEditTrigger,
        } = this.props;
        const { selectedFiles, showFileUploadPanel } = this.state;

        const hasEditable = files?.size > 0;
        const hasReadOnly = readOnlyFiles?.size > 0;
        const hasFiles = hasEditable || hasReadOnly;

        return (
            <>
                <div className="row bottom-padding">
                    <div className="col-md-7">
                        {canInsert && (
                            <button
                                className="btn btn-primary"
                                onClick={this.toggleUploadSection}
                                title={addFileText}
                                type="button"
                            >
                                {addFileText}
                            </button>
                        )}
                    </div>
                    <div className="col-md-5">
                        {hasFiles && (
                            <div className="pull-right">
                                <button
                                    className="btn btn-default"
                                    disabled={selectedFiles.size === 0}
                                    onClick={this.downloadSelectedFiles}
                                    title="Download selected files"
                                    type="button"
                                >
                                    <i className="fa fa-download" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {showFileUploadPanel && (
                    <FileAttachmentForm
                        allowDirectories={false}
                        allowMultiple={true}
                        onCancel={this.toggleUploadSection}
                        onSubmit={this.uploadAttachedFiles}
                        onFileChange={this.handleFileChange}
                        onFileRemoval={this.handleFileChange}
                        showButtons={true}
                        showLabel={false}
                        showProgressBar={true}
                    />
                )}

                {(hasReadOnly || noReadOnlyFilesMessage) && (
                    <>
                        {hasEditable && <hr />}
                        <FilesListing
                            files={readOnlyFiles}
                            headerText={readOnlyHeaderText}
                            noFilesMessage={noReadOnlyFilesMessage}
                            onFileSelection={this.toggleFileSelection}
                            selectedFiles={selectedFiles}
                            canDelete={false}
                        />
                        {hasEditable && <hr />}
                    </>
                )}

                {(hasEditable || noFilesMessage) && (
                    <FilesListing
                        files={files}
                        headerText={headerText}
                        noFilesMessage={noFilesMessage}
                        useFilePropertiesEditTrigger={useFilePropertiesEditTrigger}
                        getFilePropertiesEditTrigger={getFilePropertiesEditTrigger}
                        canDelete={canDelete}
                        onDelete={this.deleteFile}
                        onFileSelection={this.toggleFileSelection}
                        selectedFiles={selectedFiles}
                    />
                )}
            </>
        );
    }
}
