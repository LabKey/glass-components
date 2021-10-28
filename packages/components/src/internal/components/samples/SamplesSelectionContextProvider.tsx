/*
 * Copyright (c) 2018 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React from 'react';

import { LoadingSpinner, SampleOperation } from '../../..';

import { getSampleOperationConfirmationData } from '../entities/actions';

import { SamplesSelectionProviderProps, SamplesSelectionResultProps } from './models';
import {
    getAliquotSampleIds,
    getGroupedSampleDomainFields,
    getNotInStorageSampleIds,
    getSampleSelectionLineageData,
    getSampleSelectionStorageData,
} from './actions';

const Context = React.createContext<SamplesSelectionResultProps>(undefined);
const SamplesSelectionContextProvider = Context.Provider;
export const SamplesSelectionContextConsumer = Context.Consumer;

type Props = SamplesSelectionProviderProps;

type State = SamplesSelectionResultProps;

export const SamplesSelectionProvider = (Component: React.ComponentType) => {
    return class SamplesSelectionProviderImpl extends React.Component<Props, State> {
        state: Readonly<State> = {
            sampleTypeDomainFields: undefined,
            aliquots: undefined,
            noStorageSamples: undefined,
            selectionInfoError: undefined,
            sampleItems: undefined,
            sampleLineageKeys: undefined,
            sampleLineage: undefined,
            editStatusData: undefined,
        };

        componentDidMount() {
            this.loadSampleTypeDomain();
            this.loadEditConfirmationData();
            this.loadAliquotData();
            this.loadStorageData();
            this.loadLineageData();
        }

        componentDidUpdate(prevProps: Props): void {
            if (prevProps.selection !== this.props.selection) {
                this.loadEditConfirmationData();
                this.loadAliquotData();
                this.loadStorageData();
                this.loadLineageData();
            }
        }

        loadSampleTypeDomain(): void {
            getGroupedSampleDomainFields(this.props.sampleSet)
                .then(sampleTypeDomainFields => {
                    this.setState({
                        sampleTypeDomainFields,
                    });
                })
                .catch(reason => {
                    this.setState({ selectionInfoError: reason });
                });
        }

        loadEditConfirmationData(): void {
            const { selection, sampleSet } = this.props;
            getSampleOperationConfirmationData(SampleOperation.EditMetadata, undefined, selection.toArray())
                .then(editConfirmationData => {
                    this.setState({
                        editStatusData: editConfirmationData,
                    });
                })
                .catch(error => {
                    this.setState({
                        selectionInfoError: error,
                        editStatusData: undefined,
                    });
                });
        }

        loadAliquotData(): void {
            const { determineAliquot, selection, sampleSet } = this.props;
            if (determineAliquot && selection && selection.size > 0) {
                getAliquotSampleIds(selection, sampleSet)
                    .then(aliquots => {
                        this.setState({
                            aliquots,
                        });
                    })
                    .catch(error => {
                        this.setState({
                            aliquots: undefined,
                            selectionInfoError: error,
                        });
                    });
            }
        }

        loadStorageData(): void {
            const { determineStorage, selection, sampleSet } = this.props;
            if (determineStorage && selection && selection.size > 0) {
                getNotInStorageSampleIds(selection, sampleSet)
                    .then(samples => {
                        this.setState({
                            noStorageSamples: samples,
                        });
                    })
                    .catch(error => {
                        this.setState({
                            noStorageSamples: undefined,
                            selectionInfoError: error,
                        });
                    });
                getSampleSelectionStorageData(selection)
                    .then(sampleItems => {
                        this.setState(() => ({
                            sampleItems,
                        }));
                    })
                    .catch(error => {
                        this.setState({
                            sampleItems: undefined,
                            selectionInfoError: error,
                        });
                    });
            }
        }

        loadLineageData(): void {
            const { determineLineage, selection, sampleSet } = this.props;
            if (determineLineage && selection && selection.size > 0) {
                getSampleSelectionLineageData(selection, sampleSet)
                    .then(response => {
                        const { key, models, orderedModels } = response;
                        this.setState(() => ({
                            sampleLineageKeys: orderedModels[key].toArray(),
                            sampleLineage: models[key],
                        }));
                    })
                    .catch(error => {
                        this.setState({
                            sampleLineageKeys: undefined,
                            sampleLineage: undefined,
                            selectionInfoError: error,
                        });
                    });
            }
        }

        render() {
            const { determineAliquot, determineStorage, determineLineage } = this.props;
            const {
                aliquots,
                noStorageSamples,
                selectionInfoError,
                sampleTypeDomainFields,
                sampleLineage,
                editStatusData,
            } = this.state;

            let isLoaded = !!sampleTypeDomainFields;
            if (isLoaded && !selectionInfoError) {
                if (
                    !editStatusData ||
                    (determineAliquot && !aliquots) ||
                    (determineStorage && !noStorageSamples) ||
                    (determineLineage && !sampleLineage)
                ) {
                    isLoaded = false;
                }
            }

            if (isLoaded) {
                return (
                    <SamplesSelectionContextProvider value={this.state}>
                        <Component {...this.props} {...this.state} />
                    </SamplesSelectionContextProvider>
                );
            } else {
                return <LoadingSpinner />;
            }
        }
    };
};
