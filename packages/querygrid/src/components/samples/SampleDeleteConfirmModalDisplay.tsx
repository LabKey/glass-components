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
import * as React from 'react'
import { ConfirmModal } from "@glass/base";
import { DeleteConfirmationData } from './actions';

interface Props {
    onConfirm:  (rowsToDelete: Array<any>, rowsToKeep: Array<any>) => any
    onCancel: () => any
    confirmationData: DeleteConfirmationData
}

/**
 * Displays the modal with a message about how many samples can and cannot be deleted.
 * Note that the main reason this is a separate component is for testability.  When encompassed
 * within SampleDeleteConfirmation, the jest tests do not render the component fully enough to test
 * different confirmation data scenarios.
 */
export class SampleDeleteConfirmModalDisplay extends React.Component<Props, any> {

    getConfirmationProperties() : {message: any, title: string, canDelete: boolean}{

        const { confirmationData } = this.props;

        if (!confirmationData)
            return undefined;

        const nounSingular = "sample";
        const nounPlural = "samples";
        const numCanDelete = confirmationData.canDelete.length;
        const numCannotDelete = confirmationData.cannotDelete.length;
        const canDeleteNoun = numCanDelete === 1 ? nounSingular : nounPlural;
        const cannotDeleteNoun = numCannotDelete === 1 ? nounSingular : nounPlural;
        const totalNum = numCanDelete + numCannotDelete;
        const totalNoun = totalNum === 1 ? nounSingular : nounPlural;
        const dependencyText = "derived sample or assay data dependencies";
        let text;
        if (totalNum === 0) {
            text = "No " + nounPlural + " selected for deletion."
        }
        else if (numCannotDelete === 0)  {
            text = totalNum === 1 ? "The selected "  : (totalNum === 2 ? "Both " : "All " + totalNum + " ");
            text += totalNoun + " will be permanently deleted."
        }
        else if (numCanDelete === 0) {
            if (totalNum === 1) {
                text = "The " + totalNoun + " you've selected cannot be deleted because it has " + dependencyText + ".  ";
            } else {
                text = (numCannotDelete === 2) ? "Neither of" : "None of";
                text += " the " + totalNum + " " + totalNoun + " you've selected can be deleted";
                text += " because they have " + dependencyText + ".";
            }
        }
        else {
            text = "You've selected " + totalNum + " " + totalNoun + " but only " + numCanDelete + " can be deleted.  ";
            text += numCannotDelete + " " + cannotDeleteNoun + " cannot be deleted because ";
            text += (numCannotDelete === 1 ? " it has ": " they have ") + dependencyText + "."
        }
        const message = (
            <span>
                {text}
                {numCannotDelete > 0 && <>&nbsp;(<a target='_blank' href={LABKEY.helpLinkPrefix + "viewSampleSets"}>more info</a>)</>}
                {numCanDelete > 0 && <p className={'top-spacing'}><strong>Deletion cannot be undone.</strong>  Do you want to proceed?</p>}
            </span>
        );

        return {
            message: message,
            title: numCanDelete > 0 ? "Permanently delete " + numCanDelete + " " + canDeleteNoun + "?" : (totalNum === 1 ? "Cannot delete " + nounSingular : "No " + nounPlural + " can be deleted"),
            canDelete: numCanDelete > 0
        };
    }

    onConfirm = () => {
        const { onConfirm } = this.props;
        if (onConfirm) {
            onConfirm(this.props.confirmationData.canDelete, this.props.confirmationData.cannotDelete)
        }
    };

    render() {
        const {onCancel } = this.props;
        const confirmProps = this.getConfirmationProperties();
        return (
            <ConfirmModal
                title={confirmProps.title}
                msg={confirmProps.message}
                onConfirm={confirmProps.canDelete ? this.onConfirm : undefined}
                onCancel={onCancel}
                confirmVariant='danger'
                confirmButtonText={confirmProps.canDelete ? 'Yes, Delete' : undefined}
                cancelButtonText={confirmProps.canDelete ? 'Cancel' : 'Dismiss'}
            />
        )
    }
}