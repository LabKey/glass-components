import React from 'react';
import { List } from 'immutable';
import { produce } from 'immer';

import { BaseDomainDesigner, InjectedBaseDomainDesignerProps, withBaseDomainDesigner } from '../BaseDomainDesigner';
import { getDomainPanelStatus, handleDomainUpdates, saveDomain } from '../actions';
import DomainForm from '../DomainForm';
import { DomainDesign, DomainFieldIndexChange, IFieldChange } from '../models';

import { resolveErrorMessage } from '../../../util/messaging';

import { IssuesListDefPropertiesPanel } from './IssuesListDefPropertiesPanel';
import { IssuesListDefModel } from './models';
import { getDefaultIssuesAPIWrapper, IssuesAPIWrapper } from './actions';

interface Props {
    api?: IssuesAPIWrapper;
    initModel?: IssuesListDefModel;
    onCancel: () => void;
    onChange?: (model: IssuesListDefModel) => void;
    onComplete: (model: IssuesListDefModel) => void;
    saveBtnText?: string;
}

interface State {
    model: IssuesListDefModel;
}

// exported for testing
export class IssuesDesignerPanelsImpl extends React.PureComponent<Props & InjectedBaseDomainDesignerProps, State> {
    static defaultProps = {
        api: getDefaultIssuesAPIWrapper(),
    };

    constructor(props: Props & InjectedBaseDomainDesignerProps) {
        super(props);
        this.state = produce(
            {
                model: props.initModel || IssuesListDefModel.create({}),
            },
            () => {}
        );
    }

    onPropertiesChange = (model: IssuesListDefModel): void => {
        this.setState(
            produce<State>(draft => {
                draft.model = model;
            }),
            () => {
                this.props.onChange?.(this.state.model);
            }
        );
    };

    onDomainChange = (
        domain: DomainDesign,
        dirty: boolean,
        rowIndexChange?: DomainFieldIndexChange[],
        changes?: List<IFieldChange>
    ): void => {
        if (changes) {
            this.setState(
                produce<State>(draft => {
                    Object.assign(draft.model.domain, handleDomainUpdates(draft.model.domain, changes));
                })
            );
            return;
        }

        this.setState(
            produce<State>(draft => {
                draft.model.domain = domain;
            }),
            () => {
                if (dirty) {
                    this.props.onChange?.(this.state.model);
                }
            }
        );
    };

    onFinish = (): void => {
        const { model } = this.state;
        this.props.onFinish(model.isValid(), model.domain.isSharedDomain() ? this.saveOptions : this.saveDomain);
    };

    saveOptions = (): void => {
        const { api, setSubmitting } = this.props;
        const { model } = this.state;

        api.saveIssueListDefOptions(model.getOptions())
            .then(() => this.onSaveComplete())
            .catch(response => {
                setSubmitting(false, () => {
                    this.setState(
                        produce<State>(draft => {
                            draft.model.exception = response.exception;
                        })
                    );
                });
            });
    };

    saveDomain = (): void => {
        const { setSubmitting } = this.props;
        const { model } = this.state;

        saveDomain({
            domain: model.domain,
            kind: model.domainKindName,
            options: model.getOptions(),
            name: model.issueDefName,
        })
            .then(response => this.onSaveComplete(response))
            .catch(response => {
                const exception = resolveErrorMessage(response);

                setSubmitting(false, () => {
                    this.setState(
                        produce<State>(draft => {
                            if (exception) {
                                draft.model.exception = exception;
                            } else {
                                draft.model.exception = undefined;
                                draft.model.domain = response;
                            }
                        })
                    );
                });
            });
    };

    onSaveComplete = (response?: any): void => {
        const { setSubmitting } = this.props;

        this.setState(
            produce<State>(draft => {
                draft.model.exception = undefined;
                if (response) {
                    draft.model.domain = response;
                }
            }),
            () => {
                setSubmitting(false, () => {
                    const { model } = this.state;
                    this.props.onComplete(model);
                });
            }
        );
    };

    render() {
        const {
            api,
            onCancel,
            visitedPanels,
            currentPanelIndex,
            firstState,
            validatePanel,
            submitting,
            onTogglePanel,
            saveBtnText,
        } = this.props;
        const { model } = this.state;

        return (
            <BaseDomainDesigner
                name={model.issueDefName}
                exception={model.exception}
                domains={List.of(model.domain)}
                hasValidProperties={model.hasValidProperties()}
                visitedPanels={visitedPanels}
                submitting={submitting}
                onCancel={onCancel}
                onFinish={this.onFinish}
                saveBtnText={saveBtnText}
            >
                <IssuesListDefPropertiesPanel
                    api={api}
                    model={model}
                    onChange={this.onPropertiesChange}
                    controlledCollapse
                    initCollapsed={currentPanelIndex !== 0}
                    panelStatus={
                        model.isNew()
                            ? getDomainPanelStatus(0, currentPanelIndex, visitedPanels, firstState)
                            : 'COMPLETE'
                    }
                    validate={validatePanel === 0}
                    onToggle={(collapsed, callback) => {
                        onTogglePanel(0, collapsed, callback);
                    }}
                />
                <DomainForm
                    key={model.domain.domainId || 0}
                    domainIndex={0}
                    domain={model.domain}
                    headerTitle="Fields"
                    helpNoun="issues list"
                    helpTopic={null} // null so that we don't show the "learn more about this tool" link for this domains
                    onChange={this.onDomainChange}
                    controlledCollapse
                    initCollapsed={currentPanelIndex !== 1}
                    validate={validatePanel === 1}
                    panelStatus={
                        model.isNew()
                            ? getDomainPanelStatus(1, currentPanelIndex, visitedPanels, firstState)
                            : 'COMPLETE'
                    }
                    onToggle={(collapsed, callback) => {
                        onTogglePanel(1, collapsed, callback);
                    }}
                    domainFormDisplayOptions={{
                        isDragDisabled: model.domain.isSharedDomain(),
                        hideAddFieldsButton: model.domain.isSharedDomain(),
                        hideImportExport: true,
                        hideInferFromFile: true,
                    }}
                />
            </BaseDomainDesigner>
        );
    }
}

export const IssuesListDefDesignerPanels = withBaseDomainDesigner<Props>(IssuesDesignerPanelsImpl);
