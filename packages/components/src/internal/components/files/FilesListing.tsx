import React, { PureComponent, ReactNode } from 'react';

import { List, Set } from 'immutable';

import { IFile } from './models';

export interface FilesListingProps {
    canDelete?: boolean;
    files: List<IFile>;
    getFilePropertiesEditTrigger?: (file: IFile) => ReactNode;
    headerText?: string;
    noFilesMessage: string;
    onDelete?: (fileName: string) => void;
    onFileSelection: (event) => void;
    selectedFiles: Set<string>;
    useFilePropertiesEditTrigger?: boolean;
}

interface State {
    confirmDeletionSet: Set<string>;
}

export class FilesListing extends PureComponent<FilesListingProps, State> {
    constructor(props: FilesListingProps) {
        super(props);
        this.state = { confirmDeletionSet: Set<string>() };
    }

    toggleDeleteConfirmation = (fileName: string): void => {
        const { confirmDeletionSet } = this.state;

        this.setState({
            confirmDeletionSet: confirmDeletionSet.has(fileName)
                ? confirmDeletionSet.delete(fileName)
                : confirmDeletionSet.add(fileName),
        });
    };

    deleteFile = (fileName: string): void => {
        this.setState(state => ({ confirmDeletionSet: state.confirmDeletionSet.delete(fileName) }));
        this.props.onDelete?.(fileName);
    };

    render() {
        const {
            files,
            headerText,
            noFilesMessage,
            useFilePropertiesEditTrigger,
            getFilePropertiesEditTrigger,
            canDelete,
            onFileSelection,
            selectedFiles,
        } = this.props;
        const { confirmDeletionSet } = this.state;

        if (!files || files.size === 0) return <div>{noFilesMessage}</div>;

        return (
            <div>
                {headerText && <div className="file-listing--header bottom-padding">{headerText}</div>}
                {files.map((file, key) => {
                    const { description, downloadUrl, name } = file;
                    const confirmDelete = confirmDeletionSet.has(name);

                    return (
                        <div className="component file-listing-row--container" key={key}>
                            <div className="detail-component">
                                <div className="row">
                                    <div className="col-xs-4 file-listing-icon--container">
                                        <input
                                            checked={selectedFiles.contains(name)}
                                            name={name}
                                            onClick={onFileSelection}
                                            type="checkbox"
                                        />
                                        <i className={file.iconFontCls + ' file-listing-icon'} />
                                    </div>
                                    <div className="col-xs-3 file-listing-info">
                                        <strong>
                                            <a href={downloadUrl} title={name}>
                                                <div className="file-listing-filename">{name}</div>
                                            </a>
                                        </strong>
                                        <br />
                                        <span className="file-listing-info-light">
                                            <span className="test-loc-file-created-by">{file.createdBy}</span>
                                            <span className="test-loc-file-created">{file.created}</span>
                                        </span>
                                    </div>

                                    <div className="col-xs-5">{description}</div>

                                    <span className="pull-right">
                                        {useFilePropertiesEditTrigger && getFilePropertiesEditTrigger(file)}
                                        {canDelete && confirmDelete ? (
                                            <span>
                                                <div className="pull-right">Permanently delete?</div>
                                                <br />
                                                <span className="file-listing-canceldel-icon">
                                                    <button
                                                        className="btn btn-default"
                                                        onClick={() => this.toggleDeleteConfirmation(name)}
                                                        type="button"
                                                    >
                                                        Cancel
                                                    </button>
                                                </span>
                                                <button
                                                    className="btn btn-danger"
                                                    onClick={() => this.deleteFile(name)}
                                                    type="button"
                                                >
                                                    Delete File
                                                </button>
                                            </span>
                                        ) : (
                                            canDelete && (
                                                <span
                                                    className="pull-right file-listing-delete"
                                                    onClick={() => this.toggleDeleteConfirmation(name)}
                                                >
                                                    <i className="fa fa-times-circle file-listing-delete-icon" />
                                                </span>
                                            )
                                        )}
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                }).toArray()}
            </div>
        );
    }
}
