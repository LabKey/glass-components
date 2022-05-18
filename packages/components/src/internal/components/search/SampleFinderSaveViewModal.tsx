import React, { ChangeEvent, FC, memo, useCallback, useState } from 'react';
import { Modal } from 'react-bootstrap';

import { resolveErrorMessage } from '../../util/messaging';

import { WizardNavButtons } from '../buttons/WizardNavButtons';
import { Alert } from '../base/Alert';

import { FinderReport } from './models';
import { saveFinderSearch } from './actions';

export interface Props {
    cardsJson: string;
    onCancel: () => void;
    onSuccess: (savedView: FinderReport) => void;
    currentView?: FinderReport;
}

export const SampleFinderSaveViewModal: FC<Props> = memo(props => {
    const { cardsJson, currentView, onCancel, onSuccess } = props;

    const [viewName, setViewName] = useState<string>(currentView?.isSession ? '' : currentView?.reportName);
    const [errorMessage, setErrorMessage] = useState<string>();
    const [isSubmitting, setIsSubmitting] = useState<boolean>();

    const saveView = useCallback(async () => {
        if (!viewName) return;

        setErrorMessage(undefined);
        setIsSubmitting(true);

        try {
            const isCurrentView = viewName.toLowerCase() === currentView?.reportName?.toLowerCase();
            const savedView = await saveFinderSearch(
                { reportName: viewName, reportId: currentView?.reportId },
                cardsJson,
                isCurrentView
            );
            setIsSubmitting(false);
            onSuccess(savedView);
        } catch (error) {
            setErrorMessage(resolveErrorMessage(error));
            setIsSubmitting(false);
        }
    }, [viewName]);

    const onViewNameChange = useCallback((evt: ChangeEvent<HTMLInputElement>) => setViewName(evt.target.value), []);

    return (
        <Modal onHide={onCancel} show>
            <Modal.Header closeButton>
                <Modal.Title>Save Custom Search</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Alert>{errorMessage}</Alert>
                <form onSubmit={saveView}>
                    <div className="form-group">
                        <label className="control-label">Name *</label>

                        <input
                            placeholder="Give this search a name"
                            className="form-control"
                            value={viewName}
                            onChange={onViewNameChange}
                            type="text"
                        />
                    </div>
                </form>
            </Modal.Body>
            <Modal.Footer>
                <WizardNavButtons
                    cancel={onCancel}
                    cancelText="Cancel"
                    canFinish={!!viewName}
                    containerClassName=""
                    isFinishing={isSubmitting}
                    isFinishingText="Saving..."
                    finish
                    finishText="Save"
                    nextStep={saveView}
                />
            </Modal.Footer>
        </Modal>
    );
});
