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
import React, { PureComponent } from 'react';

import { capitalizeFirstChar, ConfirmModal } from '../../..';

import { helpLinkNode } from '../../util/helpLinks';

import { isSampleStatusEnabled } from '../../app/utils';

import { EntityDataType, OperationConfirmationData } from './models';
import { isSampleEntity } from './utils';

interface Props {
    confirmationData: OperationConfirmationData;
    entityDataType: EntityDataType;
    onCancel: () => any;
    onConfirm: (rowsToDelete: any[], rowsToKeep: any[]) => any;
    verb?: string;
}

/**
 * Displays the modal with a message about how many items can and cannot be deleted.
 * Note that the main reason this is a separate component is for testability.  When encompassed
 * within DeleteConfirmationModal, the jest tests do not render the component fully enough to test
 * different confirmation data scenarios.
 */
export class EntityDeleteConfirmModalDisplay extends PureComponent<Props> {
    static defaultProps = {
        verb: 'deleted',
    };

    getConfirmationProperties(): { canDelete: boolean; message: any; title: string } {
        const { confirmationData, entityDataType, verb } = this.props;
        const { deleteHelpLinkTopic, nounSingular, nounPlural, dependencyText } = entityDataType;
        const capNounSingular = capitalizeFirstChar(nounSingular);
        const capNounPlural = capitalizeFirstChar(nounPlural);

        if (!confirmationData) return undefined;

        // TODO when experimental flag for sample status is removed, move this text into the SampleTypeDataType constant
        const _dependencyText =
            isSampleStatusEnabled() && isSampleEntity(entityDataType)
                ? dependencyText + ' or status that prevents deletion'
                : dependencyText;

        const numCanDelete = confirmationData.allowed.length;
        const numCannotDelete = confirmationData.notAllowed.length;
        const canDeleteNoun = numCanDelete === 1 ? capNounSingular : capNounPlural;
        const cannotDeleteNoun = numCannotDelete === 1 ? nounSingular : nounPlural;
        const totalNum = numCanDelete + numCannotDelete;
        const totalNoun = totalNum === 1 ? nounSingular : nounPlural;
        let text;
        if (totalNum === 0) {
            text =
                'Either no ' +
                nounPlural +
                ' are selected for deletion or the selected ' +
                nounPlural +
                ' are no longer valid.';
        } else if (numCannotDelete === 0) {
            text = totalNum === 1 ? 'The selected ' : totalNum === 2 ? 'Both ' : 'All ' + totalNum + ' ';
            text += totalNoun + ' will be permanently ' + verb + '.';
        } else if (numCanDelete === 0) {
            if (totalNum === 1) {
                text =
                    'The ' + totalNoun + " you've selected cannot be deleted because it has " + _dependencyText + '.  ';
            } else {
                text = numCannotDelete === 2 ? 'Neither of' : 'None of';
                text += ' the ' + totalNum + ' ' + totalNoun + " you've selected can be deleted";
                text += ' because they have ' + _dependencyText + '.';
            }
        } else {
            text =
                "You've selected " +
                totalNum +
                ' ' +
                totalNoun +
                ' but only ' +
                numCanDelete +
                ' can be ' +
                verb +
                '. ';
            text += numCannotDelete + ' ' + cannotDeleteNoun + ' cannot be deleted because ';
            text += (numCannotDelete === 1 ? ' it has ' : ' they have ') + _dependencyText + '.';
        }
        const message = (
            <span>
                {text}
                {numCannotDelete > 0 && <>&nbsp;({helpLinkNode(deleteHelpLinkTopic, 'more info')})</>}
                {numCanDelete > 0 && (
                    <p className="top-spacing">
                        <strong>Deletion cannot be undone.</strong> Do you want to proceed?
                    </p>
                )}
            </span>
        );

        return {
            message,
            title:
                numCanDelete > 0
                    ? 'Permanently Delete ' + numCanDelete + ' ' + canDeleteNoun + '?'
                    : totalNum === 1
                    ? 'Cannot Delete ' + capNounSingular
                    : 'No ' + capNounPlural + ' Can Be Deleted',
            canDelete: numCanDelete > 0,
        };
    }

    onConfirm = (): void => {
        this.props.onConfirm?.(this.props.confirmationData.allowed, this.props.confirmationData.notAllowed);
    };

    render() {
        const { onCancel } = this.props;
        const confirmProps = this.getConfirmationProperties();
        return (
            <ConfirmModal
                title={confirmProps.title}
                onConfirm={confirmProps.canDelete ? this.onConfirm : undefined}
                onCancel={onCancel}
                confirmVariant="danger"
                confirmButtonText={confirmProps.canDelete ? 'Yes, Delete' : undefined}
                cancelButtonText={confirmProps.canDelete ? 'Cancel' : 'Dismiss'}
            >
                {confirmProps.message}
            </ConfirmModal>
        );
    }
}
