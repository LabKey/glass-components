import React, { ChangeEvent, FC, memo, ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Modal, Tab, Tabs } from 'react-bootstrap';

import { Utils } from '@labkey/api';

import { User } from '../base/models/User';
import { formatDate, parseDate } from '../../util/Date';
import { Alert } from '../base/Alert';
import { ChoicesListItem } from '../base/ChoicesListItem';
import { resolveErrorMessage } from '../../util/messaging';
import { LoadingSpinner } from '../base/LoadingSpinner';
import { ColorIcon } from '../base/ColorIcon';

import { SampleOperation } from '../samples/constants';
import { OperationConfirmationData } from '../entities/models';
import { getOperationNotPermittedMessage } from '../samples/utils';
import { QueryModel } from '../../../public/QueryModel/QueryModel';

import { isLoading, LoadingState } from '../../../public/LoadingState';

import { useAppContext, useNotificationsContext } from '../../..';

import { Picklist } from './models';
import { addSamplesToPicklist, getPicklistsForInsert, getPicklistUrl, SampleTypeCount } from './actions';

interface PicklistListProps {
    activeItem: Picklist;
    emptyMessage: ReactNode;
    onSelect: (picklist: Picklist) => void;
    showSharedIcon?: boolean;
    items: Picklist[];
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

            <div className="choice-details-section top-spacing choice-details__summary">
                <PicklistItemsSummary picklist={picklist} />
            </div>
        </div>
    );
});

interface AddedToPicklistNotificationProps {
    picklist: Picklist;
    numAdded: number;
    numSelected: number;
    currentProductId?: string;
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
    picklists: Picklist[];
    picklistLoadError: ReactNode;
    loading: boolean;
    statusData: OperationConfirmationData;
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
            statusData,
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

        const onAddClicked = async (): Promise<void> => {
            setSubmitting(true);
            setError(undefined);
            let numAdded = 0;

            try {
                const response = await addSamplesToPicklist(activeItem.name, statusData, selectionKey, sampleIds);
                api.query.incrementClientSideMetricCount(metricFeatureArea, 'addSamplesToPicklist');
                numAdded = response.rows.length;
                setSubmitting(false);
            } catch (e) {
                setSubmitting(false);
                setError(resolveErrorMessage(e) ?? 'Failed to add samples to picklist.');
                return;
            }

            createNotification({
                message: () => (
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
        };

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
        const isSearching = !!search;
        let myEmptyMessage: ReactNode = <LoadingSpinner />;
        let teamEmptyMessage: ReactNode = <LoadingSpinner />;

        if (!loading) {
            myEmptyMessage = 'You do not have any picklists ';
            teamEmptyMessage = 'There are no shared picklists  ';

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
        }

        let body;
        let title;
        let buttons;
        if (statusData?.anyAllowed) {
            title = 'Choose a Picklist';
            body = (
                <>
                    <div className="row">
                        <div className="col-md-12">
                            <Alert bsStyle="info">
                                Adding {Utils.pluralize(validCount, 'sample', 'samples')} to selected picklist.{' '}
                                {getOperationNotPermittedMessage(SampleOperation.AddToPicklist, statusData)}
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
                            <Tabs id="choose-items-tabs" className="choose-items-tabs" animation={false}>
                                <Tab eventKey={1} title="My Picklists">
                                    <PicklistList
                                        activeItem={activeItem}
                                        emptyMessage={myEmptyMessage}
                                        onSelect={setActiveItem}
                                        showSharedIcon
                                        items={myItems}
                                    />
                                </Tab>

                                <Tab eventKey={2} title="Team Picklists">
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
            buttons = (
                <>
                    <div className="pull-left">
                        <button type="button" className="btn btn-default" onClick={closeModal}>
                            Cancel
                        </button>
                    </div>

                    <div className="pull-right">
                        <button
                            type="button"
                            className="btn btn-success"
                            onClick={onAddClicked}
                            disabled={activeItem === undefined || submitting}
                        >
                            {submitting ? 'Adding to Picklist...' : 'Add to Picklist'}
                        </button>
                    </div>
                </>
            );
        } else {
            title = 'Cannot Add to Picklist';
            buttons = (
                <Button bsClass="btn btn-default pull-right" onClick={closeModal}>
                    Dismiss
                </Button>
            );
            body = getOperationNotPermittedMessage(SampleOperation.AddToPicklist, statusData);
        }

        return (
            <Modal show bsSize="large" onHide={closeModal}>
                <Modal.Header closeButton>
                    <Modal.Title>{title}</Modal.Title>
                </Modal.Header>

                <Modal.Body>
                    <Alert>{picklistLoadError ?? error}</Alert>
                    {body}
                </Modal.Body>

                <Modal.Footer>{buttons}</Modal.Footer>
            </Modal>
        );
    }
);

interface ChoosePicklistModalProps {
    afterAddToPicklist: () => void;
    currentProductId?: string;
    numSelected: number;
    onCancel: (cancelToCreate?: boolean) => void;
    metricFeatureArea?: string;
    picklistProductId?: string;
    queryModel?: QueryModel;
    sampleFieldKey?: string;
    sampleIds?: string[];
    selectionKey?: string;
    user: User;
}

export const ChoosePicklistModal: FC<ChoosePicklistModalProps> = memo(props => {
    const { numSelected, selectionKey, queryModel, sampleFieldKey, sampleIds } = props;
    const [error, setError] = useState<string>();
    const [items, setItems] = useState<Picklist[]>([]);
    const [idsLoading, setIdsLoading] = useState<LoadingState>(LoadingState.INITIALIZED);
    const [itemsLoading, setItemsLoading] = useState<LoadingState>(LoadingState.INITIALIZED);
    const [ids, setIds] = useState<string[]>(sampleIds);
    const [validCount, setValidCount] = useState<number>(numSelected);
    const [statusData, setStatusData] = useState<OperationConfirmationData>();
    const schemaQuery = queryModel?.schemaQuery;
    const selections = queryModel?.selections;
    const { api } = useAppContext();

    useEffect(() => {
        setItemsLoading(LoadingState.LOADING);
        (async () => {
            try {
                const picklists = await getPicklistsForInsert();
                setItems(picklists);
            } catch (e) {
                setError(resolveErrorMessage(e) ?? 'Failed to retrieve picklists.');
            }
            setItemsLoading(LoadingState.LOADED);
        })();
    }, []);

    useEffect(() => {
        setIdsLoading(LoadingState.LOADING);
        (async () => {
            // This method is responsible for:
            // 1. Determining the sample IDs for the set of samples to be added to the picklist.
            // 2. Verifying what operations are allowed for those samples.
            let ids_: string[];
            if (sampleIds) {
                ids_ = sampleIds;
            } else if (sampleFieldKey && schemaQuery) {
                // Look up SampleIds from the selected row ids.
                // Using sampleFieldKey as proxy flag to determine if lookup is needed.
                try {
                    ids_ = await api.samples.getFieldLookupFromSelection(
                        schemaQuery.schemaName,
                        schemaQuery.queryName,
                        [...selections],
                        sampleFieldKey
                    );
                } catch (e) {
                    setError(resolveErrorMessage(e) ?? 'Failed to retrieve picklist selection.');
                }
            }

            try {
                const data = await api.samples.getSampleOperationConfirmationData(
                    SampleOperation.AddToPicklist,
                    // If sample IDs are explicitly provided, then do not pass
                    // the selectionKey to ensure the ids are processed.
                    ids_ ? undefined : selectionKey,
                    ids_
                );
                setIds(ids_);
                setStatusData(data);
                setValidCount(data.allowed.length);
            } catch (e) {
                setError(resolveErrorMessage(e) ?? 'Failed to retrieve sample operations.');
            }

            setIdsLoading(LoadingState.LOADED);
        })();
    }, [api.samples, sampleFieldKey, sampleIds, schemaQuery, selectionKey, selections]);

    return (
        <ChoosePicklistModalDisplay
            {...props}
            loading={isLoading(itemsLoading) || isLoading(idsLoading)}
            picklists={items}
            picklistLoadError={error}
            sampleIds={ids}
            selectionKey={selectionKey}
            statusData={statusData}
            validCount={validCount}
        />
    );
});

ChoosePicklistModal.displayName = 'ChoosePicklistModal';
