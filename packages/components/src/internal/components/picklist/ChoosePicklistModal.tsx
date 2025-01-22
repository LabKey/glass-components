import React, { ChangeEvent, FC, memo, ReactNode, useCallback, useEffect, useMemo, useState } from 'react';

import { Utils } from '@labkey/api';

import { User } from '../base/models/User';
import { formatDate, parseDate } from '../../util/Date';
import { Alert } from '../base/Alert';
import { ChoicesListItem } from '../base/ChoicesListItem';
import { Modal } from '../../Modal';
import { resolveErrorMessage } from '../../util/messaging';
import { LoadingSpinner } from '../base/LoadingSpinner';
import { ColorIcon } from '../base/ColorIcon';
import { Tab, Tabs } from '../../Tabs';

import { QueryModel } from '../../../public/QueryModel/QueryModel';

import { isLoading, LoadingState } from '../../../public/LoadingState';

import { useAppContext } from '../../AppContext';

import { useNotificationsContext } from '../notifications/NotificationsContext';

import { Picklist } from './models';
import { addSamplesToPicklist, getPicklistsForInsert, getPicklistUrl, SampleTypeCount } from './actions';

interface PicklistListProps {
    activeItem: Picklist;
    emptyMessage: ReactNode;
    items: Picklist[];
    onSelect: (picklist: Picklist) => void;
    showSharedIcon?: boolean;
}

// export for jest testing
export const PicklistList: FC<PicklistListProps> = memo(props => {
    const { activeItem, emptyMessage, onSelect, showSharedIcon = false, items } = props;
    const onClick = useCallback(
        index => {
            onSelect(items[index]);
        },
        [items, onSelect]
    );

    return (
        <div className="list-group choices-list">
            {items.map((item, index) => (
                <ChoicesListItem
                    active={activeItem?.listId === item.listId}
                    index={index}
                    key={item.listId}
                    label={item.name}
                    onSelect={onClick}
                    componentRight={
                        showSharedIcon &&
                        item.isPublic() && <span className="fa fa-users pull-right" title="Team Picklist" />
                    }
                />
            ))}
            {items.length === 0 && <p className="choices-list__empty-message">{emptyMessage}</p>}
        </div>
    );
});

interface PicklistItemsSummaryProps {
    picklist: Picklist;
}

// export for jest testing
export const PicklistItemsSummary: FC<PicklistItemsSummaryProps> = memo(({ picklist }) => {
    const { name } = picklist;
    const [countsByType, setCountsByType] = useState<SampleTypeCount[]>([]);
    const [loadingState, setLoadingState] = useState<LoadingState>(LoadingState.INITIALIZED);
    const { api } = useAppContext();

    useEffect(() => {
        (async () => {
            setLoadingState(LoadingState.LOADING);
            try {
                const counts = await api.picklist.getPicklistCountsBySampleType(name);
                setCountsByType(counts);
            } catch (e) {
                setCountsByType([]);
            }
            setLoadingState(LoadingState.LOADED);
        })();
    }, [api.picklist, name]);

    const isLoaded = !isLoading(loadingState);
    const hasCounts = countsByType.length > 0;
    const hasItems = picklist.ItemCount > 0;

    return (
        <div key="picklist-items-summary">
            <div key="header" className="picklist-items__header">
                Sample Counts
            </div>
            {!isLoaded && <LoadingSpinner />}
            {isLoaded && (
                <>
                    {hasCounts &&
                        countsByType.map(countData => (
                            <div key={countData.SampleType} className="row picklist-items__row">
                                <span className="col-md-1">
                                    <ColorIcon useSmall value={countData.LabelColor} />
                                </span>
                                <span className="col-md-5 picklist-items__sample-type choice-metadata-item__name">
                                    {countData.SampleType}
                                </span>
                                <span className="col-md-4 picklist-items__item-count">{countData.ItemCount}</span>
                            </div>
                        ))}
                    {hasItems && !hasCounts && (
                        <div key="summary">{Utils.pluralize(picklist.ItemCount, 'sample', 'samples')}</div>
                    )}
                    {!hasItems && !hasCounts && (
                        <div key="summary" className="choices-detail__empty-message">
                            This list is empty.
                        </div>
                    )}
                </>
            )}
        </div>
    );
});

interface PicklistDetailsProps {
    picklist: Picklist;
}

// export for jest testing
export const PicklistDetails: FC<PicklistDetailsProps> = memo(props => {
    const { picklist } = props;

    return (
        <div className="choice-details">
            <div className="choice-details__name">{picklist.name}</div>

            <div className="choice-details-section choice-details__metadata">
                {picklist.isPublic() && (
                    <div className="choice-metadata-item">
                        <span className="choice-metadata-item__name">Created by:</span>
                        <span className="choice-metadata-item__value">{picklist.CreatedByDisplay}</span>
                    </div>
                )}

                <div className="choice-details-section choice-metadata-item">
                    <span className="choice-metadata-item__name">Created:</span>
                    <span className="choice-metadata-item__value">{formatDate(parseDate(picklist.Created))}</span>
                </div>
            </div>

            <div className="choice-details-section choice-details__description">{picklist.Description}</div>

            <div className="choice-details-section top-padding choice-details__summary">
                <PicklistItemsSummary picklist={picklist} />
            </div>
        </div>
    );
});

interface AddedToPicklistNotificationProps {
    currentProductId?: string;
    numAdded: number;
    numSelected: number;
    picklist: Picklist;
    picklistProductId?: string;
}

// export for jest testing
export const AddedToPicklistNotification: FC<AddedToPicklistNotificationProps> = props => {
    const { picklist, numAdded, numSelected, currentProductId, picklistProductId } = props;
    let numAddedNotification;
    if (numAdded === 0) {
        numAddedNotification = 'No samples added';
    } else {
        numAddedNotification = 'Successfully added ' + Utils.pluralize(numAdded, 'sample', 'samples');
    }
    let numNotAddedNotification = null;
    if (numAdded < numSelected) {
        const notAdded = numSelected - numAdded;
        numNotAddedNotification = ' ' + Utils.pluralize(notAdded, 'sample', 'samples');
        numNotAddedNotification += notAdded === 1 ? ' was ' : ' were ';
        numNotAddedNotification += 'already in the list.';
    }

    return (
        <>
            {numAddedNotification} to picklist "
            <a href={getPicklistUrl(picklist.listId, picklistProductId, currentProductId)}>{picklist.name}</a>".
            {numNotAddedNotification}
        </>
    );
};

interface ChoosePicklistModalDisplayProps {
    loading: boolean;
    picklistLoadError: ReactNode;
    picklists: Picklist[];
    validCount: number;
}

// export for jest testing
export const ChoosePicklistModalDisplay: FC<ChoosePicklistModalProps & ChoosePicklistModalDisplayProps> = memo(
    props => {
        const {
            picklists,
            loading,
            picklistLoadError,
            onCancel,
            afterAddToPicklist,
            user,
            selectionKey,
            sampleIds,
            currentProductId,
            picklistProductId,
            metricFeatureArea,
            validCount,
        } = props;
        const [search, setSearch] = useState<string>('');
        const [error, setError] = useState<string>(undefined);
        const [submitting, setSubmitting] = useState<boolean>(false);
        const [activeItem, setActiveItem] = useState<Picklist>(undefined);
        const { api } = useAppContext();
        const { createNotification } = useNotificationsContext();

        const onSearchChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
            setSearch(event.target.value.trim().toLowerCase());
        }, []);

        const filteredItems = useMemo<Picklist[]>(() => {
            if (search !== '') {
                return picklists.filter(item => item.name.toLowerCase().indexOf(search) > -1);
            }

            return picklists;
        }, [search, picklists]);

        const [myItems, teamItems] = useMemo(() => {
            const mine = [];
            const team = [];

            filteredItems.forEach(item => {
                if (item.isUserList(user)) {
                    mine.push(item);
                }
                if (item.isPublic()) {
                    team.push(item);
                }
            });

            return [mine, team];
        }, [filteredItems, user]);

        const onAddClicked = useCallback(async (): Promise<void> => {
            setSubmitting(true);
            setError(undefined);
            let numAdded = 0;

            try {
                const response = await addSamplesToPicklist(activeItem.name, false, selectionKey, sampleIds);
                api.query.incrementClientSideMetricCount(metricFeatureArea, 'addSamplesToPicklist');
                numAdded = response.rows.length;
                setSubmitting(false);
            } catch (e) {
                setSubmitting(false);
                setError(resolveErrorMessage(e) ?? 'Failed to add samples to picklist.');
                return;
            }

            createNotification({
                message: (
                    <AddedToPicklistNotification
                        picklist={activeItem}
                        numAdded={numAdded}
                        numSelected={validCount}
                        currentProductId={currentProductId}
                        picklistProductId={picklistProductId}
                    />
                ),
                alertClass: numAdded === 0 ? 'info' : 'success',
            });

            afterAddToPicklist();
        }, [
            createNotification,
            activeItem,
            validCount,
            currentProductId,
            picklistProductId,
            afterAddToPicklist,
            selectionKey,
            sampleIds,
            api.query,
            metricFeatureArea,
        ]);

        const closeModal = useCallback(() => {
            setError(undefined);
            onCancel(false);
        }, [onCancel]);

        const goToCreateNewList = useCallback(() => {
            setError(undefined);
            onCancel(true);
        }, [onCancel]);

        const createNewListMessage = (
            <>
                Do you want to <a onClick={goToCreateNewList}>create a new one</a>?
            </>
        );

        let body = <LoadingSpinner />;

        if (!loading) {
            const isSearching = !!search;
            let myEmptyMessage: ReactNode = 'You do not have any picklists ';
            let teamEmptyMessage: ReactNode = 'There are no shared picklists  ';
            let suffix = '';
            if (isSearching) {
                suffix = ' matching your search';
            }
            suffix += ' to add ' + (validCount === 1 ? 'this sample to.' : 'these samples to.');
            myEmptyMessage += suffix;
            teamEmptyMessage += suffix;
            if (!isSearching) {
                myEmptyMessage = (
                    <>
                        {myEmptyMessage} {createNewListMessage}
                    </>
                );
                teamEmptyMessage = (
                    <>
                        {teamEmptyMessage} {createNewListMessage}
                    </>
                );
            }
            body = (
                <>
                    <div className="row">
                        <div className="col-md-12">
                            <Alert bsStyle="info">
                                Adding {Utils.pluralize(validCount, 'sample', 'samples')} to selected picklist.{' '}
                            </Alert>
                        </div>
                    </div>
                    <div className="row">
                        <div className="col-md-6">
                            <input
                                autoFocus
                                className="form-control"
                                onChange={onSearchChange}
                                placeholder="Find a picklist"
                            />
                        </div>
                    </div>

                    <div className="row choices-container">
                        <div className="col-md-6">
                            <Tabs className="choose-items-tabs">
                                <Tab eventKey="yours" title="Your Picklists">
                                    <PicklistList
                                        activeItem={activeItem}
                                        emptyMessage={myEmptyMessage}
                                        onSelect={setActiveItem}
                                        showSharedIcon
                                        items={myItems}
                                    />
                                </Tab>

                                <Tab eventKey="shared" title="Shared Picklists">
                                    <PicklistList
                                        activeItem={activeItem}
                                        emptyMessage={teamEmptyMessage}
                                        onSelect={setActiveItem}
                                        items={teamItems}
                                    />
                                </Tab>
                            </Tabs>
                        </div>

                        <div className="col-md-6">
                            {activeItem === undefined && (
                                <div className="choices-list__empty-message">Choose a picklist</div>
                            )}

                            {activeItem !== undefined && <PicklistDetails picklist={activeItem} />}
                        </div>
                    </div>
                </>
            );
        }

        return (
            <Modal
                bsSize="lg"
                canConfirm={activeItem !== undefined && !loading}
                confirmText="Add to Picklist"
                confirmingText="Adding to Picklist..."
                isConfirming={submitting}
                onCancel={closeModal}
                onConfirm={onAddClicked}
                title="Choose a Picklist"
            >
                <Alert>{picklistLoadError ?? error}</Alert>
                {body}
            </Modal>
        );
    }
);

interface ChoosePicklistModalProps {
    afterAddToPicklist: () => void;
    currentProductId?: string;
    metricFeatureArea?: string;
    numSelected: number;
    onCancel: (cancelToCreate?: boolean) => void;
    picklistProductId?: string;
    queryModel?: QueryModel;
    sampleFieldKey?: string;
    sampleIds?: number[];
    selectionKey?: string;
    user: User;
}

export const ChoosePicklistModal: FC<ChoosePicklistModalProps> = memo(props => {
    const { numSelected, selectionKey, queryModel, sampleFieldKey, sampleIds } = props;
    const [error, setError] = useState<string>();
    const [items, setItems] = useState<Picklist[]>([]);
    const [idsLoading, setIdsLoading] = useState<LoadingState>(LoadingState.INITIALIZED);
    const [itemsLoading, setItemsLoading] = useState<LoadingState>(LoadingState.INITIALIZED);
    const [ids, setIds] = useState<number[]>(sampleIds);
    const [validCount, setValidCount] = useState<number>(numSelected);
    const [selectionsLoading, setSelectionsLoading] = useState<LoadingState>(LoadingState.INITIALIZED);
    const useSnapshotSelection = queryModel.filterArray.length > 0;
    const schemaQuery = queryModel.schemaQuery;
    const selections = queryModel.selections;
    const intSelections = queryModel.intSelections;
    const { api } = useAppContext();

    useEffect(() => {
        (async () => {
            if (selectionsLoading === LoadingState.INITIALIZED) {
                setItemsLoading(LoadingState.LOADING);
                try {
                    const picklists = await getPicklistsForInsert();
                    setItems(picklists);
                } catch (e) {
                    console.error(e);
                    setError(resolveErrorMessage(e) ?? 'Failed to retrieve picklists.');
                }
                setItemsLoading(LoadingState.LOADED);
            }
            if (useSnapshotSelection) {
                if (!queryModel?.isLoadingSelections) {
                    try {
                        await api.query.setSnapshotSelections(queryModel.selectionKey, [...selections]);
                    } catch (reason) {
                        console.error(
                            'There was a problem loading the filtered selection data. Your actions will not obey these filters.',
                            reason
                        );
                    }
                    setSelectionsLoading(LoadingState.LOADED);
                }
            } else {
                setSelectionsLoading(LoadingState.LOADED);
            }
        })();
    }, [
        api.query,
        selectionsLoading,
        queryModel?.selectionKey,
        selections,
        queryModel?.isLoadingSelections,
        useSnapshotSelection,
    ]);

    useEffect(() => {
        setIdsLoading(LoadingState.LOADING);
        if (selectionsLoading === LoadingState.LOADED) {
            (async () => {
                // This method is responsible for:
                // 1. Determining the sample IDs for the set of samples to be added to the picklist.
                // 2. Verifying what operations are allowed for those samples.
                let ids_: number[];
                if (sampleIds) {
                    ids_ = sampleIds;
                } else if (sampleFieldKey && schemaQuery) {
                    // Look up SampleIds from the selected row ids.
                    // Using sampleFieldKey as proxy flag to determine if lookup is needed.
                    try {
                        ids_ = await api.samples.getLookupRowIdsFromSelection(
                            schemaQuery.schemaName,
                            schemaQuery.queryName,
                            intSelections,
                            sampleFieldKey
                        );
                    } catch (e) {
                        setError(resolveErrorMessage(e) ?? 'Failed to retrieve picklist selection.');
                    }
                } else if (intSelections) {
                    ids_ = intSelections;
                }
                setIds(ids_);
                setValidCount(ids_?.length ?? 0);
                setIdsLoading(LoadingState.LOADED);
            })();
        }
    }, [
        api.samples,
        intSelections,
        selectionsLoading,
        sampleFieldKey,
        sampleIds,
        schemaQuery,
        selectionKey,
        useSnapshotSelection,
    ]);

    return (
        <ChoosePicklistModalDisplay
            {...props}
            loading={isLoading(itemsLoading) || isLoading(idsLoading) || isLoading(selectionsLoading)}
            picklists={items}
            picklistLoadError={error}
            sampleIds={ids}
            selectionKey={selectionKey}
            validCount={validCount}
        />
    );
});

ChoosePicklistModal.displayName = 'ChoosePicklistModal';
