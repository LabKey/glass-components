import React, { PureComponent } from 'react';

interface Props {
    allowDelete?: boolean;
    deleteTitleText?: string;
    downloadUrl?: string;
    name: string;
    onDelete?: (name: string) => void;
}

export class FileAttachmentEntry extends PureComponent<Props, any> {
    static defaultProps = {
        allowDelete: true,
        deleteTitleText: 'Remove file',
    };

    render() {
        const { allowDelete, downloadUrl, onDelete, name, deleteTitleText } = this.props;
        return (
            <div key={name} className="attached-file--container">
                {allowDelete && (
                    <span
                        className="fa fa-times-circle file-upload__remove--icon"
                        onClick={() => onDelete(name)}
                        title={deleteTitleText}
                    />
                )}
                <span className="fa fa-file-text attached-file--icon attached-file--bottom-padding" />
                {downloadUrl ? (
                    <strong>
                        <a href={downloadUrl} title={name}>
                            <div className="file-listing-filename">{name}</div>
                        </a>
                    </strong>
                ) : (
                    name
                )}
            </div>
        );
    }
}
