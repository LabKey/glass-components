import React, { FC, memo, useCallback, useState } from 'react';

import { User } from '../base/models/User';
import { userCanManagePicklists } from '../../app/utils';
import { QueryModel } from '../../../public/QueryModel/QueryModel';
import { SelectionMenuItem } from '../menus/SelectionMenuItem';

import { getSampleStatusType, isSampleOperationPermitted } from '../samples/utils';
import { SampleOperation } from '../samples/constants';
import { DisableableMenuItem } from '../samples/DisableableMenuItem';

import { PicklistEditModal } from './PicklistEditModal';
import { ChoosePicklistModal } from './ChoosePicklistModal';

interface Props {
    queryModel?: QueryModel;
    sampleIds?: string[];
    itemText?: string;
    user: User;
    currentProductId?: string;
    picklistProductId?: string;
    metricFeatureArea?: string;
    sampleFieldKey?: string;
    selectionMenuId?: string;
}

export const AddToPicklistMenuItem: FC<Props> = memo(props => {
    const {
        sampleIds,
        selectionMenuId,
        itemText,
        user,
        queryModel,
        currentProductId,
        picklistProductId,
        metricFeatureArea,
        sampleFieldKey,
    } = props;
    const [showChoosePicklist, setShowChoosePicklist] = useState<boolean>(false);
    const [showCreatePicklist, setShowCreatePicklist] = useState<boolean>(false);

    const closeAddToPicklist = useCallback((closeToCreate?: boolean) => {
        setShowChoosePicklist(false);
        if (closeToCreate) {
            setShowCreatePicklist(true);
        }
    }, []);

    const afterAddToPicklist = useCallback(() => {
        setShowChoosePicklist(false);
    }, []);

    const closeCreatePicklist = useCallback(() => {
        setShowCreatePicklist(false);
    }, []);

    const afterCreatePicklist = useCallback(() => {
        setShowCreatePicklist(false);
    }, []);

    const onClick = useCallback(() => {
        if (queryModel?.hasSelections || sampleIds?.length) {
            setShowChoosePicklist(true);
        }
    }, [queryModel, sampleIds]);

    if (!userCanManagePicklists(user)) {
        return null;
    }

    const useSelection = sampleIds === undefined;
    const id = sampleIds ? undefined : queryModel?.id;
    const numSelected = sampleIds ? sampleIds.length : queryModel.selections?.size;

    return (
        <>
            {useSelection ? (
                <SelectionMenuItem
                    id={selectionMenuId}
                    text={itemText}
                    onClick={onClick}
                    queryModel={queryModel}
                    nounPlural="samples"
                />
            ) : (
                <DisableableMenuItem
                    onClick={onClick}
                    operationPermitted={isSampleOperationPermitted(
                        getSampleStatusType(queryModel.getRow()),
                        SampleOperation.AddToPicklist
                    )}
                >
                    {itemText}
                </DisableableMenuItem>
            )}
            {showChoosePicklist && (
                <ChoosePicklistModal
                    onCancel={closeAddToPicklist}
                    afterAddToPicklist={afterAddToPicklist}
                    user={user}
                    selectionKey={id}
                    numSelected={numSelected}
                    sampleIds={sampleIds}
                    currentProductId={currentProductId}
                    picklistProductId={picklistProductId}
                    metricFeatureArea={metricFeatureArea}
                    queryModel={queryModel}
                    sampleFieldKey={sampleFieldKey}
                />
            )}
            {showCreatePicklist && (
                <PicklistEditModal
                    selectionKey={sampleFieldKey ? undefined : id}   //If a sampleField is being used it, the id may not map correctly
                    selectedQuantity={numSelected}
                    sampleIds={sampleIds}
                    onFinish={afterCreatePicklist}
                    onCancel={closeCreatePicklist}
                    showNotification
                    metricFeatureArea={metricFeatureArea}
                    queryModel={queryModel}
                    sampleFieldKey={sampleFieldKey}
                />
            )}
        </>
    );
});

AddToPicklistMenuItem.defaultProps = {
    itemText: 'Add to Picklist',
    selectionMenuId: 'add-to-picklist-menu-item',
};
