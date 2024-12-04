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
import { Utils } from '@labkey/api';

import { Map } from 'immutable';

import { FileSizeLimitProps } from '../../../public/files/models';

import { Alert } from '../base/Alert';

import { cancelEvent } from '../../events';

import { fileMatchesAcceptedFormat, fileSizeLimitCompare } from './actions';
import { FileAttachmentEntry } from './FileAttachmentEntry';
import { ALL_FILES_LIMIT_KEY } from './models';

const isDirectoryEntry = (entry: FileSystemEntry): entry is FileSystemDirectoryEntry => entry.isDirectory;
const isFileEntry = (entry: FileSystemEntry): entry is FileSystemFileEntry => entry.isFile;

interface Props {
    acceptedFormats?: string; // comma separated list of allowed extensions i.e. '.png, .jpg, .jpeg'
    allowDirectories: boolean;
    allowMultiple: boolean;
    compact?: boolean;
    fileCountSuffix?: string;
    handleChange?: (files: Record<string, File>) => void;
    handleRemoval?: (name: string) => void;
    includeDirectoryFiles?: boolean;
    index?: number;
    initialFileNames?: string[];
    initialFiles?: Record<string, File>;
    labelLong?: string;
    // map between extension and SizeLimitProps.  Use "all" as the key for limits that apply to all formats.
    // "all" limits will be overridden by limits for a specific extension.
    sizeLimits?: Map<string, FileSizeLimitProps>;
    sizeLimitsHelpText?: React.ReactNode;
}

interface State {
    errorMsg: React.ReactNode;
    fileNames: string[]; // separate list of names for the case when an initial set of file names is provided for which we have no file object
    files: Record<string, File>;
    isDirty: boolean;
    isHover: boolean;
    warningMsg: React.ReactNode;
}

export class FileAttachmentContainer extends React.PureComponent<Props, State> {
    fileInput: React.RefObject<HTMLInputElement>;
    dirCbCount: number;
    fileCbCount: number;

    constructor(props: Props) {
        super(props);

        this.fileInput = React.createRef();

        this.state = {
            errorMsg: undefined,
            files: props.initialFiles ?? {},
            fileNames: props.initialFileNames ?? [],
            isDirty: false,
            isHover: false,
            warningMsg: undefined,
        };
    }

    componentDidMount(): void {
        this.initFileNames();
    }

    componentDidUpdate(prevProps: Props): void {
        if (!this.state.isDirty && this.props.initialFileNames !== prevProps.initialFileNames) {
            this.initFileNames();
        }
    }

    initFileNames = (): void => {
        const { initialFileNames, initialFiles } = this.props;

        // since we do not have the file objects themselves, we do not check if the
        // file "type" is valid.  There is presumably nothing a user could do if it were
        // invalid.
        this.setState({
            fileNames: initialFileNames || (initialFiles && Object.keys(initialFiles)) || [],
        });
    };

    // this is copied (and extended a bit) from the LABKEY.internal.ZipLoad.getFilesFromDirectory function in ZipLoad.js
    getFilesFromDirectory = (
        files: Record<string, File>,
        entry: FileSystemDirectoryEntry,
        scope: FileAttachmentContainer,
        callback: () => void
    ): void => {
        const dirReader: FileSystemDirectoryReader = entry.createReader();

        const entriesReader: FileSystemEntriesCallback = (scope => {
            return entries => {
                for (let i = 0; i < entries.length; i++) {
                    const _entry = entries[i];
                    if (isFileEntry(_entry)) {
                        scope.fileCbCount++;
                        _entry.file(file => {
                            scope.fileCbCount--;

                            // ignore hidden files
                            if (file.name.substring(0, 1) !== '.') {
                                if (files[file.name]) {
                                    scope.setState({
                                        warningMsg:
                                            'Duplicate files were uploaded. Only the last file provided for the duplicate name will be included in the file set.',
                                    });
                                }
                                // @ts-expect-error fullPath is not a property of File in lib.dom.ts
                                file.fullPath = entry.fullPath + '/' + file.name;
                                files[file.name] = file;
                            }

                            if (scope.dirCbCount === 0 && scope.fileCbCount === 0) {
                                callback();
                            }
                        });
                    } else if (isDirectoryEntry(_entry)) {
                        scope.getFilesFromDirectory(files, _entry, scope, callback);
                    }
                }

                // readEntries only reads 100 files in a batch for Chrome
                if (entries.length >= 100) {
                    scope.dirCbCount++;
                    dirReader.readEntries(entriesReader, console.error);
                }

                scope.dirCbCount--;
                if (scope.dirCbCount === 0 && scope.fileCbCount === 0) {
                    callback();
                }
            };
        })(scope);

        scope.dirCbCount++;
        dirReader.readEntries(entriesReader, console.error);
    };

    validateFiles = (fileList: FileList, transferItems?: DataTransferItemList): Set<string> => {
        const { acceptedFormats, allowDirectories, sizeLimits, sizeLimitsHelpText } = this.props;

        this.setState({ errorMsg: undefined, warningMsg: undefined, isHover: false });

        if (!acceptedFormats && allowDirectories && !sizeLimits) {
            return new Set<string>();
        }

        const invalidFileTypes: Record<string, string> = {}; // map from file name to extension
        const oversizedFiles: Record<string, string> = {}; // map from file name to display size limit
        const invalidDirectories: string[] = []; // list of directory names if not allowed;
        const invalidNames = new Set<string>();

        Array.from(fileList).forEach((file, index) => {
            if (transferItems && transferItems[index].webkitGetAsEntry().isDirectory) {
                if (!allowDirectories) {
                    invalidDirectories.push(file.name);
                    invalidNames.add(file.name);
                }
            } else if (acceptedFormats) {
                const formatCheck = fileMatchesAcceptedFormat(file.name, acceptedFormats);
                if (!formatCheck.isMatch) {
                    invalidFileTypes[file.name] = formatCheck.extension;
                    invalidNames.add(file.name);
                }
            }
            if (sizeLimits) {
                if (!invalidFileTypes.hasOwnProperty(file.name) && invalidDirectories.indexOf(file.name) < 0) {
                    const sizeCheck = fileSizeLimitCompare(file, sizeLimits);
                    if (sizeCheck.isOversized) {
                        oversizedFiles[file.name] = sizeCheck.limits.maxSize.displayValue;
                        invalidNames.add(file.name);
                    }
                }
            }
        });

        if (invalidNames.size > 0) {
            const errors: React.ReactNode[] = [];
            if (invalidDirectories.length > 0) {
                errors.push('Folders are not supported.');
            }

            const invalidFileNames = Object.keys(invalidFileTypes);
            if (invalidFileNames.length > 0) {
                let errorMsg = '';
                if (invalidFileNames.length === 1) {
                    const [fileName] = invalidFileNames;
                    errorMsg += `Invalid file type ${invalidFileTypes[fileName]}.`;
                } else {
                    errorMsg += `Invalid file types: ${Object.values(invalidFileTypes).join(', ')}.`;
                }
                errorMsg += `  Valid types are ${acceptedFormats}.  `;
                errors.push(errorMsg);
            }

            const oversizedFileNames = Object.keys(oversizedFiles);
            if (oversizedFileNames.length > 0) {
                if (oversizedFileNames.length === 1) {
                    const [fileName] = oversizedFileNames;
                    errors.push(
                        <>
                            The file '{fileName}' is larger than the maximum allowed size of {oversizedFiles[fileName]}.{' '}
                            {sizeLimitsHelpText}
                        </>
                    );
                } else {
                    errors.push(
                        <>
                            These files are larger than their maximum allowed sizes:
                            <ul>
                                {oversizedFileNames.map(fileName => (
                                    // eslint-disable-next-line react/no-array-index-key
                                    <li key={fileName}>
                                        {fileName} (max size: {oversizedFiles[fileName]})
                                    </li>
                                ))}
                            </ul>
                            {sizeLimitsHelpText}
                        </>
                    );
                }
            }

            if (errors.length > 0) {
                let errorMsg: React.ReactNode;
                if (errors.length === 1) {
                    errorMsg = errors[0];
                } else {
                    errorMsg = (
                        <ul>
                            {errors.map((error, index) => (
                                // eslint-disable-next-line react/no-array-index-key
                                <li key={index}>{error}</li>
                            ))}
                        </ul>
                    );
                }

                this.setState({ errorMsg, isHover: false });
            }
        }

        return invalidNames;
    };

    handleChange = (evt: React.ChangeEvent<HTMLInputElement>): void => {
        cancelEvent(evt);
        if (evt.currentTarget?.files) {
            this.handleFiles(evt.currentTarget.files);
        }
    };

    handleDrag = (evt: React.DragEvent<HTMLLabelElement>): void => {
        cancelEvent(evt);
        if (!this.state.isHover) {
            this.setState({ isHover: true });
        }
    };

    handleDrop = (evt: React.DragEvent<HTMLLabelElement>): void => {
        cancelEvent(evt);
        if (evt.dataTransfer?.files) {
            this.handleFiles(evt.dataTransfer.files, evt.dataTransfer.items);
        }
    };

    handleFiles(fileList: FileList, transferItems?: DataTransferItemList): void {
        const { allowMultiple, allowDirectories, includeDirectoryFiles } = this.props;

        if (!allowMultiple && fileList.length > 1) {
            this.setState({ errorMsg: 'Only one file allowed.', isHover: false });
            return;
        }

        const invalidFiles = this.validateFiles(fileList, transferItems);

        // iterate through the file list and set the names as the object key
        const newFiles = {};
        let haveValidFiles = false;
        let hasDirectory = false;
        Array.from(fileList).forEach((file, index) => {
            if (!invalidFiles.has(file.name)) {
                if (this.state.files?.[file.name]) {
                    this.setState({
                        warningMsg:
                            'Duplicate files were uploaded. Only the last file will be included in the file set.',
                    });
                }

                newFiles[file.name] = file;
                haveValidFiles = true;

                if (transferItems && transferItems[index].webkitGetAsEntry().isDirectory) {
                    hasDirectory = true;
                }
            }
        });

        if (haveValidFiles) {
            const files = Object.assign({}, newFiles, this.state.files);

            if (hasDirectory && allowDirectories && includeDirectoryFiles) {
                this.dirCbCount = 0;
                this.fileCbCount = 0;
                Array.from(fileList).forEach((file, index) => {
                    const entry = transferItems[index].webkitGetAsEntry();
                    if (isDirectoryEntry(entry)) {
                        delete files[file.name];
                        this.getFilesFromDirectory(files, entry, this, () => {
                            this._handleFiles(files);
                        });
                    }
                });
            } else {
                this._handleFiles(files);
            }
        }
    }

    _handleFiles = (files: Record<string, File>): void => {
        const { sizeLimits } = this.props;

        const totalSizeLimit = sizeLimits?.get(ALL_FILES_LIMIT_KEY)?.totalSize;
        if (totalSizeLimit) {
            const totalFileSize = Object.values(files).reduce((total, file) => {
                return total + file.size;
            }, 0);

            if (totalFileSize > totalSizeLimit.value) {
                this.setState({
                    errorMsg: `The total file size of all files exceeds the maximum allowed size of ${totalSizeLimit.displayValue}.`,
                    isHover: false,
                });
                return;
            }
        }

        this.setState(
            {
                files,
                fileNames: Object.keys(files),
                isHover: false,
                isDirty: true,
            },
            () => {
                this.props.handleChange?.(this.state.files);
            }
        );
    };

    handleLeave = (evt: React.DragEvent<HTMLLabelElement>): void => {
        cancelEvent(evt);
        if (this.state.isHover) {
            this.setState({ isHover: false });
        }
    };

    handleRemove = (name: string): void => {
        // NOTE: This will clear the field entirely so multiple file support
        // will need to account for this and rewrite this clearing mechanism
        if (this.fileInput.current) {
            this.fileInput.current.value = '';
        }

        this.setState(
            state => {
                const fileNames = state.fileNames.filter(fileName => name !== fileName);

                const files: Record<string, File> = {};
                for (const filename of Object.keys(state.files)) {
                    if (fileNames.indexOf(filename) >= 0) files[filename] = state.files[filename];
                }

                return {
                    errorMsg: undefined,
                    files,
                    fileNames,
                    isDirty: true,
                    warningMsg: undefined,
                };
            },
            () => {
                this.props.handleRemoval?.(name);
            }
        );
    };

    getLabelLong = (): React.ReactNode => {
        const { labelLong, sizeLimits } = this.props;

        if (!sizeLimits || !sizeLimits.has(ALL_FILES_LIMIT_KEY) || sizeLimits.size > 1) {
            return labelLong;
        }

        const allMaxSize = sizeLimits.get(ALL_FILES_LIMIT_KEY).maxSize;
        if (allMaxSize) {
            return `${labelLong} The maximum file size allowed is ${allMaxSize.displayValue}.`;
        }

        return labelLong;
    };

    render(): React.ReactNode {
        const { acceptedFormats, allowMultiple, index, compact, fileCountSuffix } = this.props;
        const { fileNames, isHover, errorMsg, warningMsg } = this.state;
        const hideFileUpload = !allowMultiple && fileNames.length > 0;
        const fileUploadText = 'fileUpload' + (index !== undefined ? index : '');

        return (
            <>
                <div
                    className={classNames('file-upload--container', hideFileUpload ? 'hidden' : 'block', {
                        'file-upload--container--compact': compact,
                    })}
                >
                    <label
                        className={classNames({
                            'file-upload--label': !compact,
                            'file-upload--label--compact': compact,
                            'file-upload__is-hover': isHover,
                        })}
                        htmlFor={fileUploadText}
                        onDragEnter={this.handleDrag}
                        onDragLeave={this.handleLeave}
                        onDragOver={this.handleDrag}
                        onDrop={this.handleDrop}
                    >
                        <i
                            className={classNames('fa fa-cloud-upload', {
                                'fa-2x cloud-logo': !compact,
                                'file-upload__label__icon': compact,
                            })}
                            aria-hidden="true"
                        />
                        {this.getLabelLong()}
                    </label>
                    <input
                        accept={acceptedFormats}
                        className="file-upload--input"
                        id={fileUploadText}
                        multiple={allowMultiple}
                        name={fileUploadText}
                        onChange={this.handleChange}
                        ref={this.fileInput}
                        type="file"
                    />
                </div>

                <Alert bsStyle="warning" className={classNames({ 'file-upload--error-message--compact': compact })}>
                    {warningMsg}
                </Alert>

                <Alert className={classNames({ 'file-upload--error-message--compact': compact })}>{errorMsg}</Alert>

                <div
                    className={classNames('file-upload--file-entry-listing', {
                        'well well-sm': allowMultiple && fileNames.length,
                    })}
                >
                    {fileNames.map(fileName => (
                        <FileAttachmentEntry key={fileName} name={fileName} onDelete={this.handleRemove} />
                    ))}
                </div>
                {fileCountSuffix && fileNames.length > 0 && (
                    <div className="file-upload--scroll-footer">
                        {Utils.pluralBasic(fileNames.length, 'file')} {fileCountSuffix}.
                    </div>
                )}
            </>
        );
    }
}
