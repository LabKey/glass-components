import React, { FC, memo, ReactNode, useCallback, useState } from 'react';

import { Button } from 'react-bootstrap';

import { Utils } from '@labkey/api';

import { isLoading, LoadingState } from '../../../public/LoadingState';
import { QueryModel } from '../../../public/QueryModel/QueryModel';
import { LoadingSpinner } from '../base/LoadingSpinner';

import { Alert } from '../base/Alert';
import { FindByIdsModal } from '../navigation/FindByIdsModal';
import { Section } from '../base/Section';

import { SAMPLE_ID_FIND_FIELD, UNIQUE_ID_FIND_FIELD } from './constants';

interface HeaderPanelProps {
    loadingState: LoadingState;
    listModel: QueryModel;
    error?: ReactNode;
    missingIds: { [key: string]: string[] };
    ids: string[];
    onFindSamples: (sessionKey: string) => void;
    onClearSamples: () => void;
    sessionKey: string;
    workWithSamplesMsg?: ReactNode;
}

// exported for jest testing
export function getFindIdCountsByTypeMessage(findIds: string[]): string {
    if (!findIds) {
        return undefined;
    }

    let numIdsMsg = '';
    const numSampleIds = findIds.filter(id => id.startsWith(SAMPLE_ID_FIND_FIELD.storageKeyPrefix)).length;
    const numUniqueIds = findIds.filter(id => id.startsWith(UNIQUE_ID_FIND_FIELD.storageKeyPrefix)).length;
    if (numSampleIds) {
        numIdsMsg += Utils.pluralize(numSampleIds, SAMPLE_ID_FIND_FIELD.nounSingular, SAMPLE_ID_FIND_FIELD.nounPlural);
    }
    if (numUniqueIds) {
        numIdsMsg +=
            (numIdsMsg ? ' and ' : '') +
            Utils.pluralize(numUniqueIds, UNIQUE_ID_FIND_FIELD.nounSingular, UNIQUE_ID_FIND_FIELD.nounPlural);
    }
    return numIdsMsg;
}

export const FindSamplesByIdHeaderPanel: FC<HeaderPanelProps> = memo(props => {
    const title = 'Find Samples in Bulk';
    const panelClassName = 'find-samples-header-panel';
    const [showFindModal, setShowFindModal] = useState<boolean>(false);

    const {
        loadingState,
        listModel,
        onFindSamples,
        onClearSamples,
        missingIds,
        sessionKey,
        error,
        ids,
        workWithSamplesMsg,
    } = props;

    const numIdsMsg = getFindIdCountsByTypeMessage(ids);

    const onAddMoreSamples = useCallback(() => {
        setShowFindModal(true);
    }, []);

    const onCancelAdd = useCallback(() => {
        setShowFindModal(false);
    }, []);

    const onFind = useCallback(
        sessionKey => {
            setShowFindModal(false);
            onFindSamples(sessionKey);
        },
        [onFindSamples]
    );

    let foundSamplesMsg;
    let showButtons = true;
    if (isLoading(loadingState) || (listModel?.isLoading && !listModel.queryInfoError)) {
        foundSamplesMsg = (
            <div className="bottom-spacing">
                <LoadingSpinner />
            </div>
        );
        showButtons = false;
    } else if (!numIdsMsg || !listModel || listModel.queryInfoError) {
        foundSamplesMsg = null;
    } else {
        foundSamplesMsg = (
            <div className="bottom-spacing">
                <i className="fa fa-check-circle find-samples-success" />{' '}
                <span id="found-samples-message">
                    Found {Utils.pluralize(listModel.rowCount, 'sample', 'samples')} matching {numIdsMsg}.
                </span>
            </div>
        );
    }

    if (error) {
        return (
            <Section title={title} panelClassName={panelClassName}>
                <Alert>{error}</Alert>
            </Section>
        );
    }

    const hasSamples = !listModel?.isLoading && listModel?.rowCount > 0;

    return (
        <Section title={title} panelClassName={panelClassName}>
            {foundSamplesMsg}
            <SamplesNotFoundMsg missingIds={missingIds} />
            {showButtons && (
                <div className="bottom-spacing">
                    <Button className="button-right-spacing" bsClass="btn btn-default" onClick={onAddMoreSamples}>
                        Add {hasSamples ? 'More ' : ''}Samples
                    </Button>
                    <Button bsClass="btn btn-default" onClick={onClearSamples} disabled={!numIdsMsg}>
                        Reset
                    </Button>
                </div>
            )}
            {hasSamples && <Alert bsStyle="info">{workWithSamplesMsg}</Alert>}
            <FindByIdsModal
                show={showFindModal}
                onCancel={onCancelAdd}
                onFind={onFind}
                nounPlural="samples"
                sessionKey={sessionKey}
            />
        </Section>
    );
});

FindSamplesByIdHeaderPanel.defaultProps = {
    workWithSamplesMsg: 'Work with the selected samples in the grid now or save them to a picklist for later use.',
};

export const SamplesNotFoundMsg: FC<{ missingIds: { [key: string]: string[] } }> = memo(({ missingIds }) => {
    if (!missingIds) return null;

    const [showIds, setShowIds] = useState<boolean>(false);

    const toggleShowIdAlert = useCallback(() => {
        setShowIds(!showIds);
    }, [showIds]);

    let count = 0;
    Object.values(missingIds).forEach(ids => {
        count += ids.length;
    });

    if (count === 0) return null;

    return (
        <>
            <div className="bottom-spacing">
                <span className="find-samples-warning">
                    <i className="fa fa-exclamation-circle" />{' '}
                </span>
                <span>
                    Couldn't locate {Utils.pluralize(count, 'sample', 'samples')}
                    {'. '}
                    <a className="find-samples-warning-toggle" onClick={toggleShowIdAlert}>
                        {showIds ? (
                            <>
                                Hide <i className="fa fa-caret-down" aria-hidden="true" />
                            </>
                        ) : (
                            <>
                                Show all <i className="fa fa-caret-right" aria-hidden="true" />
                            </>
                        )}
                    </a>
                </span>
            </div>
            {showIds && (
                <Alert bsStyle="warning">
                    {Object.keys(missingIds).map((key, index) => {
                        if (missingIds[key].length > 0) {
                            return <p key={index}>{key + ': ' + missingIds[key].join(', ')}</p>;
                        }
                    })}
                </Alert>
            )}
        </>
    );
});
