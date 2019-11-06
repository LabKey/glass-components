import * as React from 'react'
import { Map, List } from 'immutable'
import { Alert, WizardNavButtons } from "@glass/base";

import {AssayPanelStatus, AssayProtocolModel, DomainDesign, HeaderRenderer} from "../../models";
import {saveAssayDesign} from "../../actions/actions";
import { AssayPropertiesPanel } from "./AssayPropertiesPanel";
import DomainForm from "../DomainForm";
import {Button, Col, Row} from "react-bootstrap";

interface Props {
    onChange?: (model: AssayProtocolModel) => void
    onCancel: () => void
    beforeFinish?: (model: AssayProtocolModel) => void
    onComplete: (model: AssayProtocolModel) => void
    initModel: AssayProtocolModel
    hideEmptyBatchDomain?: boolean
    containerTop?: number // This sets the top of the sticky header, default is 0
    basePropertiesOnly?: boolean
    appDomainHeaders?: Map<string, HeaderRenderer>
    appIsValid?: (model: AssayProtocolModel) => boolean
    useTheme?: boolean
}

interface State {
    submitting: boolean
    currentPanelIndex: number
    protocolModel: AssayProtocolModel
    visitedPanels: List<number>
    validatePanel: number
    firstState: boolean
}

export class AssayDesignerPanels extends React.PureComponent<Props, State> {
    panelCount = 1;// start at 1 for the AssayPropertiesPanel, will updated count after domains are defined in constructor

    constructor(props: Props) {
        super(props);

        this.panelCount = this.panelCount + props.initModel.domains.size;

        const errors = List<number>();
        if (props.initModel.isNew()) {
            errors.push(0);
        }

        this.state = {
            submitting: false,
            currentPanelIndex: 0,
            protocolModel: props.initModel,
            visitedPanels: List<number>().push(0),
            validatePanel: undefined,
            firstState: true
        }
    }

    isLastStep(): boolean {
        return this.state.currentPanelIndex  + 1 ===  this.panelCount;
    }

    onDomainChange = (index: number, updatedDomain: DomainDesign) => {
        const { onChange } = this.props;

        this.setState((state) => {
            const domains = state.protocolModel.domains.map((domain, i) => {
                return i === index ? updatedDomain : domain;
            });
            const updatedModel = state.protocolModel.merge({domains}) as AssayProtocolModel;

            return {
                protocolModel: updatedModel
            }
        }, () => {
            if (onChange) {
                onChange(this.state.protocolModel);
            }
        });
    };

    shouldSkipStep(stepIndex: number): boolean {
        const { protocolModel } = this.state;
        const index = stepIndex - 1; // subtract 1 because the first step is not a domain step (i.e. Assay Properties panel)
        const domain = protocolModel.domains.get(index);

        return this.shouldSkipBatchDomain(domain);
    }

    shouldSkipBatchDomain(domain: DomainDesign): boolean {
        return this.props.hideEmptyBatchDomain && domain && domain.isNameSuffixMatch('Batch') && domain.fields.size === 0;
    }

    onPrevious = () => {
        if (this.state.currentPanelIndex !== 0) {
            const step = this.shouldSkipStep(this.state.currentPanelIndex - 1) ? 2 : 1;
            const nextStepIndex = this.state.currentPanelIndex - step;
            this.setState(() => ({currentPanelIndex: nextStepIndex}));
        }
    };

    onNext = () => {
        if (!this.isLastStep()) {
            const step = this.shouldSkipStep(this.state.currentPanelIndex + 1) ? 2 : 1;
            const nextStepIndex = this.state.currentPanelIndex + step;
            this.setState(() => ({currentPanelIndex: nextStepIndex}));
        }
    };

    onTogglePanel = (index: number, collapsed: boolean, callback: () => any) => {
        const { visitedPanels, currentPanelIndex } = this.state;

        if (!collapsed) {
            if (!visitedPanels.contains(index)) {
                this.setState(() => ({currentPanelIndex: index,
                    visitedPanels: visitedPanels.push(index),
                    firstState: false}), callback());
            }
            else {
                this.setState(() => ({currentPanelIndex: index, firstState: false}), callback());
            }
        }
        else {
            if (collapsed && currentPanelIndex === index) {
                this.setState(() => ({currentPanelIndex: undefined, firstState: false}), callback());
            }
            else {
                callback();
            }
        }
    };

    onFinish = () => {
        const { protocolModel } = this.state;
        const { beforeFinish } = this.props;

        this.setState((state) => ({validatePanel: state.currentPanelIndex}), () => {
            this.setState((state) => ({validatePanel: undefined}), () => {

                if (AssayProtocolModel.isValid(protocolModel)) {
                    this.setSubmitting(true, protocolModel);
                    if (beforeFinish)
                    {
                        beforeFinish(protocolModel);
                    }

                    saveAssayDesign(protocolModel)
                        .then((response) => this.onFinishSuccess(response))
                        .catch((protocolModel) => this.onFinishFailure(protocolModel));
                }
            })

        });

    };

    onFinishSuccess(protocolModel: AssayProtocolModel) {
        this.setSubmitting(false, protocolModel);
        this.props.onComplete(protocolModel);
    }

    onFinishFailure(protocolModel: AssayProtocolModel) {
        this.setSubmitting(false, protocolModel);
    }

    setSubmitting(submitting: boolean, protocolModel: AssayProtocolModel) {
        this.setState(() => ({
            protocolModel,
            submitting
        }));
    }

    isValid(): boolean {
        const { appIsValid } = this.props;
        const { protocolModel } = this.state;

        return (appIsValid ? AssayProtocolModel.isValid(protocolModel) && appIsValid(protocolModel) : AssayProtocolModel.isValid(protocolModel));
    }

    onAssayPropertiesChange = (model: AssayProtocolModel) => {
        const { onChange } = this.props;

        this.setState(() => ({
            protocolModel: model
        }), () => {
            if (onChange) {
                onChange(model);
            }
        });
    };

    getPanelStatus = (index: number): AssayPanelStatus => {
        const { currentPanelIndex, visitedPanels, firstState } = this.state;

        if (index === 0 && firstState) {
            return 'NONE';
        }

        if (currentPanelIndex === index) {
            return 'INPROGRESS';
        }

        if (visitedPanels.contains(index)) {
            return 'COMPLETE';
        }

        return 'TODO';
    };

    getAppDomainHeaderRenderer = (domain: DomainDesign): HeaderRenderer =>  {
        const {appDomainHeaders} = this.props;

        if (!appDomainHeaders)
            return undefined;

        return appDomainHeaders.filter((v,k) => domain.isNameSuffixMatch(k)).first();
    };

    render() {
        const { onCancel, basePropertiesOnly, containerTop, useTheme } = this.props;
        const { protocolModel, currentPanelIndex, validatePanel } = this.state;

        let errorDomains = List<String>();

        return (
            <>
                <AssayPropertiesPanel
                    model={protocolModel}
                    onChange={this.onAssayPropertiesChange}
                    controlledCollapse={true}
                    initCollapsed={currentPanelIndex !== 0 }
                    panelStatus={protocolModel.isNew() ? this.getPanelStatus(0) : "COMPLETE"}
                    validate={validatePanel === 0}
                    basePropertiesOnly={basePropertiesOnly}
                    onToggle={(collapsed, callback) => {
                        this.onTogglePanel(0, collapsed, callback);
                    }}
                    useTheme={useTheme}
                />
                {protocolModel.domains.map((domain, i) => {
                    // optionally hide the Batch Fields domain from the UI (for sample management use case)
                    if (this.shouldSkipBatchDomain(domain)) {
                        return;
                    }

                    // allow empty domain to be inferred from a file for Data Fields in General assay
                    const showInferFromFile = protocolModel.providerName === 'General' && domain.isNameSuffixMatch('Data');
                    const appDomainHeaderRenderer = this.getAppDomainHeaderRenderer(domain);

                    // collapse domain panel for new assays (unless it is the active step)
                    // for existing assays, collapse unless the assay is invalidate and the domain has appDomainHeaderRenderer
                    let initCollapsed = currentPanelIndex !== (i+1);
                    if (!this.isValid() && appDomainHeaderRenderer !== undefined) {
                        initCollapsed = false;
                    }

                    if (domain.hasException()) {
                        errorDomains = errorDomains.push(domain.name);
                    }

                    return (
                        <DomainForm
                            key={domain.domainId || i}
                            domain={domain}
                            headerPrefix={protocolModel.name}
                            controlledCollapse={true}
                            initCollapsed={initCollapsed}
                            validate={validatePanel === i + 1}
                            panelStatus={protocolModel.isNew() ? this.getPanelStatus(i + 1) : "COMPLETE"}
                            showInferFromFile={showInferFromFile}
                            containerTop={containerTop}
                            helpURL={null} // so we only show the helpURL link for the first assay domain
                            onChange={(updatedDomain, dirty) => {
                                this.onDomainChange(i, updatedDomain);
                            }}
                            onToggle={(collapsed, callback) => {
                                this.onTogglePanel((i + 1), collapsed, callback);
                            }}
                            appDomainHeaderRenderer={appDomainHeaderRenderer}
                            modelDomains={protocolModel.domains}
                            useTheme={useTheme}
                        >
                            <div>{domain.description}</div>
                        </DomainForm>
                    )
                })}
                <Row className='domain-field-padding-top'>
                    <Col xs={1}>
                        <Button className='domain-assay-save-btn' onClick={onCancel}>Cancel</Button>
                    </Col>
                    <Col xs={10}>
                        {errorDomains.size > 0 &&
                            <Alert bsStyle="danger">{"Please correct errors in " + errorDomains.join(', ')}</Alert>
                        }
                        {protocolModel.exception &&
                            <Alert bsStyle="danger">{protocolModel.exception}</Alert>
                        }
                    </Col>
                    <Col xs={1}>
                        <Button className='pull-right domain-assay-save-btn' bsStyle='success' disabled={!this.isValid()} onClick={this.onFinish}>Save</Button>
                    </Col>
                </Row>
            </>
        )
    }
}