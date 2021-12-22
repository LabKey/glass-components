import React from 'react';

import { ConfirmModal } from '../../../..';

export interface Props {
    title?: string;
    warnings: string[];
    previews: string[];
    show: boolean;
    onHide: () => any;
    onConfirm: () => any;
}

const nameExpressionWarningPrefix = 'Name Pattern warning: ';
const aliquotNameExpressionWarningPrefix = 'Aliquot Name Pattern warning: ';

export class NameExpressionValidationModal extends React.PureComponent<Props> {
    onConfirm = () => {
        const { onConfirm, onHide } = this.props;
        onConfirm();
        onHide();
    };

    render() {
        const { title, onHide, onConfirm, warnings, show, previews } = this.props;

        if (!show || !warnings || warnings.length === 0) return null;

        const nameWarnings = [],
            aliquotNameWarnings = [];
        warnings?.forEach(warning => {
            if (warning.indexOf(nameExpressionWarningPrefix) === 0)
                nameWarnings.push(warning.substring(nameExpressionWarningPrefix.length));
            else if (warning.indexOf(aliquotNameExpressionWarningPrefix) === 0)
                aliquotNameWarnings.push(warning.substring(aliquotNameExpressionWarningPrefix.length));
        });

        let warnTitle = title,
            hasMultiGroup = false;
        if (!warnTitle) {
            if (nameWarnings.length > 0 && aliquotNameWarnings.length > 0) {
                hasMultiGroup = true;
                warnTitle = 'Sample and Aliquot Naming Patten Warning(s)';
            } else if (nameWarnings.length > 0) warnTitle = 'Naming Patten Warning(s)';
            else if (aliquotNameWarnings.length > 0) warnTitle = 'Aliquot Naming Patten Warning(s)';
        }

        let nameWarnDisplay = null,
            aliquotNameWarnDisplay = null;
        if (nameWarnings.length > 0) {
            nameWarnDisplay = (
                <div>
                    {hasMultiGroup && <p>Naming Patten Warning(s):</p>}
                    <p>Example name generated: {previews[0]}</p>
                    <ul className="name-expression-warning-list">
                        {nameWarnings.map(warning => (
                            <li>{warning}</li>
                        ))}
                    </ul>
                    <br />
                </div>
            );
        }
        if (aliquotNameWarnings.length > 0) {
            aliquotNameWarnDisplay = (
                <div>
                    {hasMultiGroup && <p>Aliquot Naming Patten Warning(s):</p>}
                    <p>Example aliquot name generated: {previews[1]}</p>
                    <ul className="aliquot-expression-warning-list">
                        {aliquotNameWarnings.map(warning => (
                            <li>{warning}</li>
                        ))}
                    </ul>
                </div>
            );
        }

        return (
            <ConfirmModal
                title={warnTitle}
                onCancel={onHide}
                onConfirm={onConfirm}
                confirmButtonText="Save anyways..."
                confirmVariant="danger"
                cancelButtonText="Cancel"
            >
                {nameWarnDisplay}
                {aliquotNameWarnDisplay}
            </ConfirmModal>
        );
    }
}
