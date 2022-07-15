import React, { FC, useCallback, useEffect, useState } from 'react';
import { Button, Col, FormControl, Row } from 'react-bootstrap';

import { Alert, ConfirmModal, LoadingSpinner, resolveErrorMessage, useNotificationsContext } from '../../..';

import { ComponentsAPIWrapper, getDefaultAPIWrapper } from '../../APIWrapper';

export interface NameExpressionGenIdProps {
    api?: ComponentsAPIWrapper;
    containerPath?: string;
    dataTypeLSID?: string;
    dataTypeName: string; // sampletype or dataclass name
    kindName: 'SampleSet' | 'DataClass';
    rowId: number;
}

export const GENID_SYNTAX_STRING = '${genId'; // skip closing tag to allow existence of formatter

export const NameExpressionGenIdBanner: FC<NameExpressionGenIdProps> = props => {
    const { api, containerPath, rowId, kindName, dataTypeName, dataTypeLSID } = props;
    const [currentGenId, setCurrentGenId] = useState<number>(undefined);
    const [newGenId, setNewGenId] = useState<number>(undefined);
    const [minNewGenId, setMinNewGenId] = useState<number>(undefined);
    const [error, setError] = useState<string>(undefined);
    const [canReset, setCanReset] = useState<boolean>(false);
    const [showResetDialog, setShowResetDialog] = useState<boolean>(false);
    const [showEditDialog, setShowEditDialog] = useState<boolean>(false);

    // useNotificationsContext will not always be available depending on if the app wraps the NotificationsContext.Provider
    let _createNotification;
    try {
        _createNotification = useNotificationsContext().createNotification;
    } catch (e) {
        // this is expected for LKS usages, so don't throw or console.error
    }

    const init = async () => {
        if (rowId && kindName) {
            try {
                const hasData = await api.domain.hasExistingDomainData(kindName, dataTypeLSID, rowId, containerPath);
                const canResetGen = !hasData;
                setCanReset(canResetGen);

                try {
                    const genId = (await api.domain.getGenId(rowId, kindName)) + 1; // when creating new data, seq.next() will be used, so display the next number to users instead of current
                    setCurrentGenId(genId);
                    const minNewGenId = canResetGen ? 1 : genId;
                    setMinNewGenId(minNewGenId);
                    setNewGenId(minNewGenId);
                } catch (reason) {
                    console.error(reason);
                }
            } catch (reason) {
                console.error(reason);
            }
        }
    };

    useEffect(() => {
        init();
    }, [rowId, kindName]);

    const onEditClick = useCallback(() => {
        setShowEditDialog(true);
        setError(undefined);
    }, []);

    const onEditCancel = useCallback(() => {
        setShowEditDialog(false);
    }, []);

    const onEditConfirm = useCallback(async () => {
        const newGen = newGenId ?? minNewGenId;
        if (newGen === currentGenId) {
            setShowEditDialog(false);
            return;
        }

        try {
            await api.domain.setGenId(
                rowId,
                kindName,
                (newGenId ?? minNewGenId) - 1 /* Reset to N-1 so seq.next will be N. */
            );
            _createNotification?.('Successfully updated genId.');
            init();
            setShowEditDialog(false);
        } catch (reason) {
            console.error(reason);
            setError(resolveErrorMessage(reason, 'genId', 'genId', 'edit'));
        }
    }, [rowId, kindName, newGenId, _createNotification]);

    const onResetClick = useCallback(() => {
        setShowResetDialog(true);
        setError(undefined);
    }, []);

    const onResetCancel = useCallback(() => {
        setShowResetDialog(false);
    }, []);

    const onResetConfirm = useCallback(async () => {
        try {
            await api.domain.setGenId(rowId, kindName, 0 /* Reset to 0 so seq.next will be 1. */);
            _createNotification?.('Successfully reset genId.');
            init();
            setShowResetDialog(false);
        } catch (reason) {
            console.error(reason);
            setError(resolveErrorMessage(reason, 'genId', 'genId', 'reset'));
        }
    }, [rowId, kindName, _createNotification]);

    if (currentGenId === undefined) return <LoadingSpinner />;

    return (
        <>
            <Alert bsStyle="info" className="genid-alert">
                Current genId: {currentGenId}
                <Button className="pull-right alert-button edit-genid-btn" bsStyle="info" onClick={onEditClick}>
                    Edit genId
                </Button>
                {canReset && currentGenId > 1 && (
                    <Button className="pull-right alert-button reset-genid-btn" bsStyle="info" onClick={onResetClick}>
                        Reset genId
                    </Button>
                )}
            </Alert>
            {showResetDialog && (
                <ConfirmModal
                    cancelButtonText="Cancel"
                    confirmButtonText="Reset"
                    onCancel={onResetCancel}
                    onConfirm={onResetConfirm}
                    title={`Are you sure you want to reset genId for ${dataTypeName}?`}
                >
                    {error && <Alert>{error}</Alert>}
                    <div>
                        The current genId is at {currentGenId}. Resetting will reset genId back to 1 and cannot be
                        undone.
                    </div>
                </ConfirmModal>
            )}
            {showEditDialog && (
                <ConfirmModal
                    cancelButtonText="Cancel"
                    confirmButtonText="Update"
                    onCancel={onEditCancel}
                    onConfirm={onEditConfirm}
                    title={`Are you sure you want to update genId for ${dataTypeName}?`}
                >
                    {error && <Alert>{error}</Alert>}
                    <div>
                        The current genId is at {currentGenId}. Updating genId will allow new{' '}
                        {kindName === 'SampleSet' ? 'samples' : 'data'} to use a new start value (min {minNewGenId}).
                        This action cannot be undone.
                    </div>
                    <Row className="margin-top">
                        <Col xs={5}>
                            <FormControl
                                className="update-genId-input "
                                min={minNewGenId}
                                step={1}
                                name="newgenidval"
                                onChange={(event: any) => setNewGenId(event?.target?.value)}
                                type="number"
                                value={newGenId ?? minNewGenId}
                                placeholder="Enter new genId..."
                            />
                        </Col>
                        <Col xs={7} />
                    </Row>
                </ConfirmModal>
            )}
        </>
    );
};

NameExpressionGenIdBanner.defaultProps = {
    api: getDefaultAPIWrapper(),
};
