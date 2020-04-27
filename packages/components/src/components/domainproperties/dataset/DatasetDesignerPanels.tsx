/*
 * Copyright (c) 2020 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import React from 'react';

import { List } from 'immutable';

import { ActionURL, getServerContext } from '@labkey/api';

import produce, { Draft } from 'immer';

import { BaseDomainDesigner, InjectedBaseDomainDesignerProps, withBaseDomainDesigner } from '../BaseDomainDesigner';

import { DomainDesign } from '../models';

import { getDomainPanelStatus, saveDomain } from '../actions';
import DomainForm from '../DomainForm';

import { importData, Progress, resolveErrorMessage } from '../../..';

import { DatasetColumnMappingPanel } from './DatasetColumnMappingPanel';

import { DatasetPropertiesPanel } from './DatasetPropertiesPanel';
import { DatasetModel } from './models';
import { getStudySubjectProp } from './actions';

interface Props {
    initModel?: DatasetModel;
    onChange?: (model: DatasetModel) => void;
    onCancel: () => void;
    onComplete: (model: DatasetModel, fileImportError?: string) => void;
    useTheme?: boolean;
    saveBtnText?: string;
    containerTop?: number; // This sets the top of the sticky header, default is 0
    successBsStyle?: string;
}

interface State {
    model: DatasetModel;
    fileImportData: File;
    keyPropertyIndex?: number;
    visitDatePropertyIndex?: number;
}

export class DatasetDesignerPanelImpl extends React.PureComponent<Props & InjectedBaseDomainDesignerProps, State> {
    constructor(props: Props & InjectedBaseDomainDesignerProps) {
        super(props);

        this.state = {
            model: props.initModel || DatasetModel.create(null, {}),
            fileImportData: undefined,
        };
    }

    componentDidMount(): void {
        const { model } = this.state;
        let keyPropertyIndex;
        let visitDatePropertyIndex;

        // setting initial indexes if these properties are already present and there are changes to them in
        // the domain form
        model.domain.fields.map((field, index) => {
            if (model.keyPropertyName && field.name === model.keyPropertyName) {
                keyPropertyIndex = index;
            }
            if (model.visitDatePropertyName && field.name === model.visitDatePropertyName) {
                visitDatePropertyIndex = index;
            }
        });

        this.setState(() => ({
            keyPropertyIndex,
            visitDatePropertyIndex,
        }));
    }

    onPropertiesChange = (model: DatasetModel) => {
        const { onChange } = this.props;

        this.setState(
            () => ({ model }),
            () => {
                if (onChange) {
                    onChange(model);
                }
            }
        );
    };

    onIndexChange = (keyPropertyIndex?: number, visitDatePropertyIndex?: number) => {
        this.setState(() => ({ keyPropertyIndex, visitDatePropertyIndex }));
    };

    onFinish = () => {
        const { model } = this.state;

        this.props.onFinish(model.isValid(), this.saveDomain);
    };

    onDomainChange = (domain: DomainDesign, dirty: boolean) => {
        const { onChange } = this.props;
        const { keyPropertyIndex, visitDatePropertyIndex } = this.state;

        this.setState(
            produce((draft: Draft<State>) => {
                draft.model.domain = domain;
                if (keyPropertyIndex) {
                    draft.model.keyPropertyName = domain.fields.get(keyPropertyIndex).name;
                }
                if (visitDatePropertyIndex) {
                    draft.model.visitDatePropertyName = domain.fields.get(visitDatePropertyIndex).name;
                }
            }),
            () => {
                // Issue 39918: use the dirty property that DomainForm onChange passes
                if (onChange && dirty) {
                    onChange(this.state.model);
                }
            }
        );
    };

    setFileImportData = fileImportData => {
        this.setState({ fileImportData });
    };

    onColumnMappingChange = (participantIdField?: string, timePointField?: string) => {
        // TODO: these will be needed in import data call
    };

    datasetColumnMapping = () => {
        const { model } = this.state;

        return (
            <>
                {model && model.domain.fields && model.domain.fields.size > 0 && (
                    <DatasetColumnMappingPanel
                        model={model}
                        onColumnMappingChange={this.onColumnMappingChange}
                        subjectColumnName={getStudySubjectProp('columnName')}
                        timepointType={getServerContext().moduleContext.study.timepointType}
                    />
                )}
            </>
        );
    };

    handleFileImport() {
        const { setSubmitting } = this.props;
        const { fileImportData, model } = this.state;

        importData({
            schemaName: 'study',
            queryName: model.name,
            file: fileImportData,
            importUrl: ActionURL.buildURL('study', 'import', getServerContext().container.path, { name: model.name }),
        })
            .then(response => {
                setSubmitting(false, () => {
                    this.props.onComplete(model);
                });
            })
            .catch(error => {
                console.error(error);
                setSubmitting(false, () => {
                    this.props.onComplete(model, resolveErrorMessage(error));
                });
            });
    }

    saveDomain = () => {
        const { setSubmitting } = this.props;
        const { model, fileImportData } = this.state;

        saveDomain(model.domain, model.getDomainKind(), model.getOptions(), model.name)
            .then(response => {
                this.setState(
                    produce((draft: Draft<State>) => {
                        const updatedModel = draft.model;
                        updatedModel.exception = undefined;
                        updatedModel.domain = response;
                    }),
                    () => {
                        // If we're importing Dataset file data, import file contents
                        if (fileImportData) {
                            this.handleFileImport();
                        } else {
                            const { model } = this.state;
                            setSubmitting(false, () => {
                                this.props.onComplete(model);
                            });
                        }
                    }
                );
            })
            .catch(response => {
                const exception = resolveErrorMessage(response);

                setSubmitting(false, () => {
                    this.setState(
                        produce((draft: Draft<State>) => {
                            const updatedModel = draft.model;
                            if (exception) {
                                updatedModel.exception = exception;
                            } else {
                                updatedModel.exception = undefined;
                                updatedModel.domain = response;
                            }
                        })
                    );
                });
            });
    };

    render() {
        const {
            useTheme,
            onTogglePanel,
            visitedPanels,
            submitting,
            onCancel,
            currentPanelIndex,
            firstState,
            validatePanel,
            containerTop,
            successBsStyle,
            saveBtnText,
        } = this.props;

        const { model, fileImportData, keyPropertyIndex, visitDatePropertyIndex } = this.state;

        return (
            <BaseDomainDesigner
                name={model.name}
                exception={model.exception}
                domains={List.of(model.domain)}
                hasValidProperties={model.hasValidProperties()}
                visitedPanels={visitedPanels}
                submitting={submitting}
                onCancel={onCancel}
                onFinish={this.onFinish}
                saveBtnText={saveBtnText}
                successBsStyle={successBsStyle}
            >
                <DatasetPropertiesPanel
                    initCollapsed={currentPanelIndex !== 0}
                    model={model}
                    keyPropertyIndex={keyPropertyIndex}
                    visitDatePropertyIndex={visitDatePropertyIndex}
                    onIndexChange={this.onIndexChange}
                    controlledCollapse={true}
                    useTheme={useTheme}
                    panelStatus={
                        model.isNew()
                            ? getDomainPanelStatus(0, currentPanelIndex, visitedPanels, firstState)
                            : 'COMPLETE'
                    }
                    validate={validatePanel === 0}
                    onToggle={(collapsed, callback) => {
                        onTogglePanel(0, collapsed, callback);
                    }}
                    onChange={this.onPropertiesChange}
                    successBsStyle={successBsStyle}
                />
                <DomainForm
                    key={model.domain.domainId || 0}
                    domainIndex={0}
                    domain={model.domain}
                    headerTitle="Fields"
                    helpNoun="dataset"
                    helpTopic={null} // null so that we don't show the "learn more about this tool" link for this domains
                    onChange={this.onDomainChange}
                    setFileImportData={this.setFileImportData}
                    controlledCollapse={true}
                    initCollapsed={currentPanelIndex !== 1}
                    validate={validatePanel === 1}
                    panelStatus={
                        model.isNew()
                            ? getDomainPanelStatus(1, currentPanelIndex, visitedPanels, firstState)
                            : 'COMPLETE'
                    }
                    showInferFromFile={true}
                    containerTop={containerTop}
                    onToggle={(collapsed, callback) => {
                        onTogglePanel(1, collapsed, callback);
                    }}
                    useTheme={useTheme}
                    importDataChildRenderer={this.datasetColumnMapping}
                    successBsStyle={successBsStyle}
                    domainFormDisplayOptions={{
                        isDragDisabled: model.isFromAssay(),
                        showAddFieldsButton: !model.isFromAssay(),
                    }}
                />
                <Progress
                    modal={true}
                    delay={1000}
                    estimate={fileImportData ? fileImportData.size * 0.005 : undefined}
                    title="Importing data from selected file..."
                    toggle={submitting && fileImportData !== undefined}
                />
            </BaseDomainDesigner>
        );
    }
}

export const DatasetDesignerPanels = withBaseDomainDesigner<Props>(DatasetDesignerPanelImpl);
