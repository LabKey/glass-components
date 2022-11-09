import React from 'react';

import { convertRowDataIntoPreviewData } from '../files/actions';
import { ToggleWithInputField } from '../forms/input/ToggleWithInputField';
import { FilePreviewGrid } from '../files/FilePreviewGrid';
import { InferDomainResponse } from '../../../public/InferDomainResponse';
import { DeleteIcon } from '../base/DeleteIcon';

interface Props {
    file: File;
    filePreviewData: InferDomainResponse;
    noun: string;
    setFileImportData: (file: File, shouldImportData: boolean) => any;
}

interface State {
    shouldImportData: boolean;
}

export class ImportDataFilePreview extends React.PureComponent<Props, State> {
    constructor(props) {
        super(props);

        this.state = {
            shouldImportData: true,
        };
    }

    onToggleClick = () => {
        const { setFileImportData, file } = this.props;

        this.setState(
            state => ({ shouldImportData: !state.shouldImportData }),
            () => {
                setFileImportData(file, this.state.shouldImportData);
            }
        );
    };

    render() {
        const { filePreviewData, noun, file } = this.props;
        const { shouldImportData } = this.state;

        if (filePreviewData == null) {
            return;
        }

        const data = convertRowDataIntoPreviewData(filePreviewData.get('data'), 4);

        return (
            <div className="domain-form__file-preview">
                <div className="domain-form__file-preview__text">Import data from this file upon {noun} creation? </div>
                <div className="domain-form__file-preview__toggle">
                    <ToggleWithInputField
                        active={shouldImportData}
                        id="importData"
                        onClick={this.onToggleClick}
                        on="Import Data"
                        off="Don't Import"
                    />
                    {shouldImportData && file && (
                        <>
                            <DeleteIcon title={null} iconCls="domain-field-delete-icon" onDelete={this.onToggleClick} />
                            <span className="domain__import-data__file-icon">
                                <span className="fa fa-lg fa-file-alt" />
                            </span>

                            <span className="domain__import-data__file-title"> {file.name} </span>
                        </>
                    )}
                </div>

                {shouldImportData && this.props.children}

                {shouldImportData && <FilePreviewGrid previewCount={4} data={data} header={null} />}
            </div>
        );
    }
}
