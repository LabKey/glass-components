import React, { PureComponent, ReactNode } from 'react';
import { List } from 'immutable';

import { Modal } from '../../Modal';
import { ComponentsAPIWrapper, getDefaultAPIWrapper } from '../../APIWrapper';

import { HelpLink } from '../../util/helpLinks';
import { QuerySelect } from '../forms/QuerySelect';
import { Alert } from '../base/Alert';
import { LoadingSpinner } from '../base/LoadingSpinner';

import { InjectedQueryModels, withQueryModels } from '../../../public/QueryModel/withQueryModels';
import { QueryModel } from '../../../public/QueryModel/QueryModel';

import { FormButtons } from '../../FormButtons';

import { BarTenderResponse } from './models';
import { BAR_TENDER_TOPIC, LABEL_NOT_FOUND_ERROR, LABEL_TEMPLATE_SQ } from './constants';
import { ViewInfo } from '../../ViewInfo';
import { SchemaQuery } from '../../../public/SchemaQuery';

export interface PrintModalProps {
    afterPrint?: (numSamples: number, numLabels: number) => void;
    api?: ComponentsAPIWrapper;
    defaultLabel: number;
    model: QueryModel;
    onCancel?: () => void;
    printServiceUrl: string;
    sampleIds: string[];
    showSelection: boolean;
}

interface State {
    error: any;
    labelTemplate: number;
    loadingSelections: boolean;
    numCopies: number;
    sampleCount: number;
    submitting: boolean;
}

const PRINT_ERROR_MESSAGE =
    'There was a problem printing the labels for the selected samples. Verify the label template chosen is still valid and the connection to BarTender has been configured properly.';

export class PrintLabelsModalImpl extends PureComponent<PrintModalProps & InjectedQueryModels, State> {
    static defaultProps = {
        api: getDefaultAPIWrapper(),
    };

    _modelId = 'sampleModel';

    constructor(props: PrintModalProps & InjectedQueryModels) {
        super(props);

        // because of a timing issue with the clearSelections on componentWillUnmount, use distinct model ids for single sample vs grid selection case
        if (!props.showSelection) {
            this._modelId = 'singleSampleModel';
        }

        this.state = {
            error: undefined,
            labelTemplate: props.defaultLabel,
            loadingSelections: true,
            numCopies: 1,
            sampleCount: props.sampleIds.length,
            submitting: false,
        };
    }

    componentDidMount(): void {
        const { model } = this.props;

        let schemaQuery = model?.schemaQuery;
        // Issue 50657: from a sample's details page, use the default view instead of the details view for printing,
        // but use the given view's filters (filtering to this sample), since the default view may exclude this sample
        if (model?.schemaQuery.viewName === ViewInfo.DETAIL_NAME) {
            schemaQuery = new SchemaQuery(model.schemaQuery.schemaName, model.schemaQuery.queryName);
        }
        this.props.actions.addModel(
            {
                id: this._modelId,
                schemaQuery,
                baseFilters: model?.filters,
                sorts: model?.sorts,
            },
            true,
            true
        );
    }

    componentDidUpdate(prevProps, prevState): void {
        // only set initial model selections once after the loadingSelections state changes to LOADED
        if (this.state.loadingSelections && !this.getModel().isLoadingSelections) {
            this.setState(() => ({ loadingSelections: false }));
            this.props.actions.setSelections(this._modelId, true, this.props.sampleIds);
        }
    }

    componentWillUnmount(): void {
        this.props.actions.clearSelections(this._modelId);
    }

    getModel(): QueryModel {
        return this.props.queryModels[this._modelId];
    }

    getSampleCount(): number {
        return this.state.sampleCount;
    }

    onCopyCountChange = (event): void => {
        let numCopies = parseInt(event.target.value, 10);

        if (isNaN(numCopies)) {
            numCopies = undefined;
        }

        this.setState(() => ({ numCopies }));
    };

    onConfirmPrint = (): void => {
        this.setState(() => ({ error: undefined, submitting: true }));
        const { labelTemplate } = this.state;
        this.props.api.labelprinting
            .printGridLabels(this.getModel(), '' + labelTemplate, this.state.numCopies, this.props.printServiceUrl)
            .then((btResponse: BarTenderResponse): void => {
                if (btResponse.ranToCompletion()) {
                    this.onLabelPrintSuccess();
                } else if (btResponse.faulted() && btResponse.isLabelUnavailableError()) {
                    this.onLabelPrintError(btResponse.getFaultMessage(), LABEL_NOT_FOUND_ERROR);
                } else {
                    this.onLabelPrintError(btResponse.getFaultMessage());
                }
            })
            .catch(reason => {
                this.onLabelPrintError(reason);
            });
    };

    onLabelPrintSuccess = (): void => {
        const { afterPrint } = this.props;
        const { sampleCount } = this.state;

        this.setState(() => ({ submitting: false }));
        if (afterPrint) {
            afterPrint(sampleCount, sampleCount > 0 ? this.state.numCopies * sampleCount : this.state.numCopies);
        }
    };

    onLabelPrintError = (reason: string, errorMessage?: string): void => {
        console.error(reason);
        this.setState(() => ({
            submitting: false,
            error: errorMessage || PRINT_ERROR_MESSAGE,
        }));
    };

    getTitle(): string {
        const numSamples = this.getSampleCount();

        if (numSamples === 0) {
            return 'Print Labels with BarTender';
        } else {
            return (
                'Print Labels for ' +
                numSamples.toLocaleString() +
                (numSamples === 1 ? ' Sample' : ' Samples') +
                ' with BarTender'
            );
        }
    }

    changeSampleSelection = (name: string, value: string): void => {
        const sampleIds = value ? value.split(',') : [];
        this.setState(() => ({ sampleCount: sampleIds.length }));
        this.props.actions.replaceSelections(this._modelId, sampleIds);
    };

    changeTemplateSelection = (name: string, value: number): void => {
        this.setState(() => ({ labelTemplate: value }));
    };

    isReadyForPrint(): boolean {
        const { labelTemplate, numCopies } = this.state;
        return (
            labelTemplate !== undefined &&
            labelTemplate >= 0 &&
            numCopies !== undefined &&
            numCopies > 0 &&
            this.getSampleCount() > 0
        );
    }

    render(): ReactNode {
        const { onCancel, showSelection } = this.props;
        const { error, labelTemplate, numCopies, submitting } = this.state;
        const model = this.getModel();
        const isLoading = model === undefined || model.isLoading;
        let body;

        if (isLoading) {
            body = <LoadingSpinner />;
        } else if (submitting) {
            body = <LoadingSpinner msg="Printing ..." />;
        } else {
            const sampleCount = this.getSampleCount();
            let displayColumn = 'Name';
            let valueColumn = 'RowId';
            if (model?.queryInfo.pkCols?.[0] === 'rowId') {
                displayColumn = 'name';
                valueColumn = 'rowId';
            }
            let message;
            if (sampleCount === 0) {
                message = 'Select samples to print labels for.';
            } else if (showSelection) {
                message = "Confirm you've selected the samples you want and the proper label template.";
            } else {
                message =
                    'Choose the number of copies of the label for this sample to print and confirm the label template.';
            }
            body = (
                <>
                    <div className="bottom-padding">{message}</div>
                    <div>
                        <strong>Number of copies</strong>
                        <input
                            className="form-control label-printing--copies"
                            min={1}
                            name="numCopies"
                            onChange={this.onCopyCountChange}
                            type="number"
                            value={numCopies ? numCopies.toString() : undefined}
                        />
                        {showSelection && (
                            <div className="top-padding">
                                <strong>Selected samples to print</strong>
                                <QuerySelect
                                    formsy={false}
                                    fireQSChangeOnInit={true}
                                    showLabel={false}
                                    loadOnFocus
                                    maxRows={10}
                                    multiple={true}
                                    name="label-samples"
                                    onQSChange={this.changeSampleSelection}
                                    placeholder="Select or type to search..."
                                    required={false}
                                    schemaQuery={model.schemaQuery}
                                    queryFilters={List(model.filters)}
                                    displayColumn={displayColumn}
                                    valueColumn={valueColumn}
                                    value={this.props.sampleIds?.join(',')}
                                />
                            </div>
                        )}
                        <div className="top-padding">
                            <strong>Label template</strong>
                            <QuerySelect
                                formsy={false}
                                fireQSChangeOnInit
                                showLabel={false}
                                loadOnFocus
                                maxRows={10}
                                name="label-template"
                                onQSChange={this.changeTemplateSelection}
                                placeholder="Select or type to search..."
                                required
                                schemaQuery={LABEL_TEMPLATE_SQ}
                                displayColumn="name"
                                valueColumn="rowId"
                                value={labelTemplate}
                            />
                        </div>
                    </div>
                </>
            );
        }

        const footer = (
            <FormButtons sticky={false}>
                <button className="btn btn-default" onClick={onCancel} type="button">
                    Cancel
                </button>

                <HelpLink topic={BAR_TENDER_TOPIC} className="label-printing--help-link">
                    BarTender help
                </HelpLink>

                <button
                    className="btn btn-success"
                    disabled={submitting || !this.isReadyForPrint()}
                    onClick={this.onConfirmPrint}
                    type="button"
                >
                    Yes, Print
                </button>
            </FormButtons>
        );

        return (
            <Modal onCancel={onCancel} title={this.getTitle()} footer={footer}>
                <Alert>{error}</Alert>
                {body}
            </Modal>
        );
    }
}

export const PrintLabelsModal = withQueryModels<PrintModalProps>(PrintLabelsModalImpl);
