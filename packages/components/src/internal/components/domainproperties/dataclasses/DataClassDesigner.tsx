import React, { PureComponent, ReactNode } from 'react';
import { produce } from 'immer';
import { List, Map } from 'immutable';

import { Domain, getServerContext } from '@labkey/api';

import { DomainDesign, DomainFieldIndexChange, IDomainField, IDomainFormDisplayOptions, IFieldChange } from '../models';
import DomainForm from '../DomainForm';
import { getDomainPanelStatus, handleDomainUpdates, saveDomain, scrollDomainErrorIntoView } from '../actions';
import { BaseDomainDesigner, InjectedBaseDomainDesignerProps, withBaseDomainDesigner } from '../BaseDomainDesigner';

import { getAppHomeFolderPath, isSampleManagerEnabled } from '../../../app/utils';

import { NameExpressionValidationModal } from '../validation/NameExpressionValidationModal';

import { ComponentsAPIWrapper, getDefaultAPIWrapper } from '../../../APIWrapper';

import { GENID_SYNTAX_STRING } from '../NameExpressionGenIdBanner';

import { loadNameExpressionOptions } from '../../settings/actions';
import { DEFAULT_DOMAIN_FORM_DISPLAY_OPTIONS } from '../constants';
import { resolveErrorMessage } from '../../../util/messaging';

import { IImportAlias, IParentAlias, IParentOption, FolderConfigurableDataType } from '../../entities/models';
import { SCHEMAS } from '../../../schemas';

import { getDuplicateAlias, getParentAliasChangeResult, getParentAliasUpdateDupesResults } from '../utils';

import { DATA_CLASS_IMPORT_PREFIX, DataClassDataType } from '../../entities/constants';
import { initParentOptionsSelects } from '../../entities/actions';
import { DataTypeFoldersPanel } from '../DataTypeFoldersPanel';

import { Container } from '../../base/models/Container';

import { DataClassModel, DataClassModelConfig } from './models';
import { DataClassPropertiesPanel } from './DataClassPropertiesPanel';

interface Props {
    allowFolderExclusion?: boolean;
    allowParentAlias?: boolean;
    api?: ComponentsAPIWrapper;
    appPropertiesOnly?: boolean;
    beforeFinish?: (model: DataClassModel) => void;
    dataClassAliasCaption?: string;
    defaultNameFieldConfig?: Partial<IDomainField>;
    domainFormDisplayOptions?: IDomainFormDisplayOptions;
    headerText?: string;
    helpTopic?: string;
    initModel?: DataClassModel;
    isValidParentOptionsFn?: (row: any, isDataClass: boolean) => boolean;
    // loadNameExpressionOptions is a prop for testing purposes only, see default implementation below
    loadNameExpressionOptions?: (
        containerPath?: string
    ) => Promise<{ allowUserSpecifiedNames: boolean; prefix: string }>;
    nameExpressionInfoUrl?: string;
    nameExpressionPlaceholder?: string;
    nounPlural?: string;
    nounSingular?: string;
    onCancel: () => void;
    onChange?: (model: DataClassModel) => void;
    onComplete: (model: DataClassModel) => void;
    saveBtnText?: string;
    showGenIdBanner?: boolean;
    validateNameExpressions?: boolean;
}

interface State {
    model: DataClassModel;
    nameExpressionWarnings: string[];
    namePreviews: string[];
    namePreviewsLoading: boolean;
    parentOptions: IParentOption[];
}

const NEW_DATA_CLASS_OPTION: IParentOption = {
    label: '(Current Data Class)',
    value: '{{this_data_class}}',
    schema: SCHEMAS.DATA_CLASSES.SCHEMA,
} as IParentOption;

const PROPERTIES_PANEL_INDEX = 0;
const DOMAIN_PANEL_INDEX = 1;
const FOLDERS_PANEL_INDEX = 2;

export type DataClassDesignerProps = Props & InjectedBaseDomainDesignerProps;

// Exported for testing
export class DataClassDesignerImpl extends PureComponent<DataClassDesignerProps, State> {
    static defaultProps = {
        api: getDefaultAPIWrapper(),
        nounSingular: 'Data Class',
        nounPlural: 'Data Classes',
        domainFormDisplayOptions: { ...DEFAULT_DOMAIN_FORM_DISPLAY_OPTIONS, domainKindDisplayName: 'data class' },
        loadNameExpressionOptions,
        validateNameExpressions: true,
    };

    constructor(props: DataClassDesignerProps) {
        super(props);

        this.state = produce(
            {
                model: props.initModel || DataClassModel.create({}),
                nameExpressionWarnings: undefined,
                namePreviews: undefined,
                namePreviewsLoading: false,
                parentOptions: undefined,
            },
            () => {}
        );
    }

    componentDidMount = async (): Promise<void> => {
        const { model } = this.state;
        const { isValidParentOptionsFn } = this.props;

        if (this.props.allowParentAlias) {
            const { parentOptions, parentAliases } = await initParentOptionsSelects(
                false,
                true,
                model.containerPath,
                isValidParentOptionsFn,
                !model.rowId ? NEW_DATA_CLASS_OPTION : null,
                model.importAliases,
                'dataclass-parent-import-alias-',
                this.formatLabel
            );

            this.setState(
                produce<State>(draft => {
                    draft.model.parentAliases = parentAliases;
                    draft.parentOptions = parentOptions;
                })
            );
        }

        if (this.state.model.isNew && isSampleManagerEnabled()) {
            const response = await this.props.loadNameExpressionOptions(this.state.model.containerPath);

            if (response.prefix) {
                this.setState(
                    produce<State>(draft => {
                        draft.model.nameExpression =
                            response.prefix + (draft.model.nameExpression ? draft.model.nameExpression : '');
                    })
                );
            }
        }
    };

    formatLabel = (name: string): string => {
        const { model } = this.state;
        if (name === model?.name) return NEW_DATA_CLASS_OPTION.label;

        return name;
    };

    onFinish = (): void => {
        const { defaultNameFieldConfig, setSubmitting, nounSingular } = this.props;
        const { model } = this.state;
        const isValid = model.isValid(defaultNameFieldConfig);

        this.props.onFinish(isValid, this.saveDomain);

        if (!isValid) {
            let exception: string;

            if (model.hasInvalidNameField(defaultNameFieldConfig)) {
                exception =
                    'The ' +
                    defaultNameFieldConfig.name +
                    ' field name is reserved for imported or generated ' +
                    nounSingular +
                    ' ids.';
            } else if (getDuplicateAlias(model.parentAliases, true).size > 0) {
                exception =
                    'Duplicate parent alias header found: ' + getDuplicateAlias(model.parentAliases, true).join(', ');
            }

            setSubmitting(false, () => {
                this.saveModelForError({ exception });
            });
        }
    };

    getImportAliasesAsMap(model: DataClassModel): Record<string, IImportAlias> {
        const { name, parentAliases } = model;
        const aliases = {};

        if (parentAliases) {
            parentAliases.forEach((alias: IParentAlias) => {
                const { parentValue, required } = alias;

                let inputType = parentValue && parentValue.value ? (parentValue.value as string) : '';
                if (parentValue === NEW_DATA_CLASS_OPTION) {
                    inputType = DATA_CLASS_IMPORT_PREFIX + name;
                }

                aliases[alias.alias] = {
                    inputType,
                    required,
                };
            });
        }

        return aliases;
    }

    saveDomain = async (hasConfirmedNameExpression?: boolean): Promise<void> => {
        const { api, beforeFinish, onComplete, setSubmitting, validateNameExpressions } = this.props;
        const { model } = this.state;
        const { name, domain } = model;

        beforeFinish?.(model);

        const domainDesign = domain.merge({
            name, // This will be the Data Class Name
        }) as DomainDesign;

        // Remove display-only option field
        const { systemFields, ...otherOptions } = model.options;
        const options = { ...otherOptions };
        options.importAliases = this.getImportAliasesAsMap(model);

        if (validateNameExpressions && !hasConfirmedNameExpression) {
            try {
                const response = await api.domain.validateDomainNameExpressions(
                    domainDesign,
                    Domain.KINDS.DATA_CLASS,
                    options,
                    true
                );

                if (response.errors?.length > 0 || response.warnings?.length > 0) {
                    setSubmitting(false, () => {
                        if (response.errors?.length > 0)
                            this.saveModelForError({ exception: response.errors?.join('\n') });
                        this.setState({
                            nameExpressionWarnings: response.warnings,
                            namePreviews: response.previews,
                        });
                    });
                    return;
                }
            } catch (e) {
                const exception = resolveErrorMessage(e);

                setSubmitting(false, () => {
                    this.saveModelForError({ exception });
                });
                return;
            }
        }

        try {
            const savedDomain = await saveDomain({
                containerPath: model.isNew
                    ? getAppHomeFolderPath(new Container(getServerContext().container))
                    : model.containerPath,
                domain: domainDesign,
                kind: Domain.KINDS.DATA_CLASS,
                name: model.name,
                options,
            });

            setSubmitting(false, () => {
                this.saveModel({ domain: savedDomain, exception: undefined }, () => {
                    onComplete(this.state.model);
                });
            });
        } catch (error) {
            const exception = resolveErrorMessage(error);

            setSubmitting(false, () => {
                if (exception) {
                    this.saveModelForError({ exception });
                } else {
                    this.saveModelForError({ domain: error, exception: undefined });
                }
            });
        }
    };

    saveModelForError = (modelOrProps: DataClassModel | Partial<DataClassModelConfig>): void => {
        this.saveModel(modelOrProps, () => {
            scrollDomainErrorIntoView();
        });
    };

    saveModel = (modelOrProps: DataClassModel | Partial<DataClassModelConfig>, callback?: () => void): void => {
        this.setState(
            produce<State>(draft => {
                if (modelOrProps instanceof DataClassModel) {
                    draft.model = modelOrProps;
                } else {
                    Object.assign(draft.model, modelOrProps);
                }
            }),
            callback
        );
    };

    onDomainChange = (
        domain: DomainDesign,
        dirty: boolean,
        rowIndexChange?: DomainFieldIndexChange[],
        changes?: List<IFieldChange>
    ): void => {
        const { onChange } = this.props;

        if (changes) {
            this.setState(
                produce<State>(draft => {
                    Object.assign(draft.model.domain, handleDomainUpdates(draft.model.domain, changes));
                })
            );
            return;
        }

        this.saveModel({ domain }, () => {
            // Issue 39918: use the dirty property that DomainForm onChange passes
            if (dirty) {
                onChange?.(this.state.model);
            }
        });
    };

    onPropertiesChange = (model: DataClassModel): void => {
        const { onChange } = this.props;

        this.saveModel(model, () => {
            onChange?.(this.state.model);
        });
    };

    onNameExpressionWarningCancel = (): void => {
        const { setSubmitting } = this.props;

        setSubmitting(false, () => {
            this.setState({
                nameExpressionWarnings: undefined,
            });
        });
    };

    onNameExpressionWarningConfirm = (): void => {
        this.setState(
            () => ({
                nameExpressionWarnings: undefined,
            }),
            () => this.saveDomain(true)
        );
    };

    onNameFieldHover = (): void => {
        const { api } = this.props;
        const { model, namePreviewsLoading } = this.state;

        if (namePreviewsLoading) return;

        if (this.props.validateNameExpressions) {
            api.domain
                .validateDomainNameExpressions(model.domain, Domain.KINDS.DATA_CLASS, model.options, true)
                .then(response => {
                    this.setState(() => ({
                        namePreviewsLoading: false,
                        namePreviews: response?.previews,
                    }));
                })
                .catch(response => {
                    console.error(response);
                    this.setState(() => ({
                        namePreviewsLoading: false,
                    }));
                });
        }
    };

    parentAliasChange = (id: string, field: string, newValue: any): void => {
        const { model } = this.state;
        const newAliases = getParentAliasChangeResult(model.parentAliases, id, field, newValue);
        const newModel = {
            ...model,
            parentAliases: newAliases,
        };
        this.saveModel(newModel);
    };

    updateDupes = (id: string): void => {
        const { model } = this.state;
        if (!model) {
            return;
        }

        const newModel = {
            ...model,
            parentAliases: getParentAliasUpdateDupesResults(model.parentAliases, id),
        };
        this.saveModel(newModel);
    };

    addParentAlias = (id: string, newAlias: IParentAlias): void => {
        const { model } = this.state;
        const { parentAliases } = model;
        const newModel = {
            ...model,
            parentAliases: parentAliases.set(id, newAlias),
        };
        this.saveModel(newModel);
    };

    removeParentAlias = (id: string): void => {
        const { model } = this.state;
        const { parentAliases } = model;
        const aliases = parentAliases.delete(id);
        const newModel = {
            ...model,
            parentAliases: aliases,
        };
        this.saveModel(newModel);
    };

    onUpdateExcludedFolders = (_: FolderConfigurableDataType, excludedContainerIds: string[]): void => {
        const { model } = this.state;
        const newModel = {
            ...model,
            excludedContainerIds,
        } as DataClassModel;
        this.onPropertiesChange(newModel);
    };

    propertiesToggle = (collapsed: boolean, callback: () => void): void => {
        this.props.onTogglePanel(PROPERTIES_PANEL_INDEX, collapsed, callback);
    };

    formToggle = (collapsed: boolean, callback: () => void): void => {
        this.props.onTogglePanel(DOMAIN_PANEL_INDEX, collapsed, callback);
    };

    foldersToggle = (collapsed: boolean, callback: () => void): void => {
        this.props.onTogglePanel(FOLDERS_PANEL_INDEX, collapsed, callback);
    };

    render(): ReactNode {
        const {
            api,
            onCancel,
            appPropertiesOnly,
            dataClassAliasCaption,
            nounSingular,
            nounPlural,
            nameExpressionInfoUrl,
            nameExpressionPlaceholder,
            headerText,
            submitting,
            saveBtnText,
            currentPanelIndex,
            visitedPanels,
            validatePanel,
            firstState,
            helpTopic,
            domainFormDisplayOptions,
            showGenIdBanner,
            allowParentAlias,
            allowFolderExclusion,
        } = this.props;
        const { model, nameExpressionWarnings, namePreviews, namePreviewsLoading, parentOptions } = this.state;

        const hasGenIdInExpression = model.nameExpression?.indexOf(GENID_SYNTAX_STRING) > -1;

        return (
            <BaseDomainDesigner
                name={model.name}
                exception={model.exception}
                domains={List.of(model.domain)}
                hasValidProperties={model.hasValidProperties}
                visitedPanels={visitedPanels}
                submitting={submitting}
                onCancel={onCancel}
                onFinish={this.onFinish}
                saveBtnText={saveBtnText}
            >
                <DataClassPropertiesPanel
                    nounSingular={nounSingular}
                    nounPlural={nounPlural}
                    nameExpressionInfoUrl={nameExpressionInfoUrl}
                    nameExpressionPlaceholder={nameExpressionPlaceholder}
                    headerText={headerText}
                    helpTopic={helpTopic}
                    model={model}
                    onChange={this.onPropertiesChange}
                    controlledCollapse
                    initCollapsed={currentPanelIndex !== PROPERTIES_PANEL_INDEX}
                    panelStatus={
                        model.isNew
                            ? getDomainPanelStatus(PROPERTIES_PANEL_INDEX, currentPanelIndex, visitedPanels, firstState)
                            : 'COMPLETE'
                    }
                    validate={validatePanel === PROPERTIES_PANEL_INDEX}
                    appPropertiesOnly={appPropertiesOnly}
                    onToggle={this.propertiesToggle}
                    namePreviewsLoading={namePreviewsLoading}
                    previewName={namePreviews?.[0]}
                    onNameFieldHover={this.onNameFieldHover}
                    nameExpressionGenIdProps={
                        showGenIdBanner && hasGenIdInExpression
                            ? {
                                  containerPath: model.containerPath,
                                  dataTypeName: model.name,
                                  rowId: model.rowId,
                                  kindName: 'DataClass',
                              }
                            : undefined
                    }
                    allowParentAlias={allowParentAlias}
                    parentOptions={parentOptions}
                    onParentAliasChange={this.parentAliasChange}
                    dataClassAliasCaption={dataClassAliasCaption}
                    onAddParentAlias={this.addParentAlias}
                    onRemoveParentAlias={this.removeParentAlias}
                    updateDupeParentAliases={this.updateDupes}
                    parentAliasHelpText={`Column headings used during import to set a ${nounSingular.toLowerCase()}'s parentage. The referenced type will also be added as a parent type by default when adding ${nounPlural.toLowerCase()} manually.`}
                />
                <DomainForm
                    key={model.domain.domainId || 0}
                    api={api.domain}
                    domainIndex={0}
                    domain={model.domain}
                    headerTitle="Fields"
                    helpTopic={null} // null so that we don't show the "learn more about this tool" link for this domains
                    controlledCollapse
                    initCollapsed={currentPanelIndex !== DOMAIN_PANEL_INDEX}
                    validate={validatePanel === DOMAIN_PANEL_INDEX}
                    panelStatus={
                        model.isNew
                            ? getDomainPanelStatus(DOMAIN_PANEL_INDEX, currentPanelIndex, visitedPanels, firstState)
                            : 'COMPLETE'
                    }
                    onChange={this.onDomainChange}
                    onToggle={this.formToggle}
                    appPropertiesOnly={appPropertiesOnly}
                    domainFormDisplayOptions={domainFormDisplayOptions}
                    systemFields={model.options.systemFields}
                />
                {appPropertiesOnly && !model.isBuiltIn && allowFolderExclusion && (
                    <DataTypeFoldersPanel
                        controlledCollapse
                        dataTypeRowId={model?.rowId}
                        dataTypeName={model?.name}
                        entityDataType={DataClassDataType}
                        initCollapsed={currentPanelIndex !== FOLDERS_PANEL_INDEX}
                        onToggle={this.foldersToggle}
                        onUpdateExcludedFolders={this.onUpdateExcludedFolders}
                    />
                )}
                <NameExpressionValidationModal
                    onHide={this.onNameExpressionWarningCancel}
                    onConfirm={this.onNameExpressionWarningConfirm}
                    warnings={nameExpressionWarnings}
                    previews={namePreviews}
                    show={!!nameExpressionWarnings && !model.exception}
                />
            </BaseDomainDesigner>
        );
    }
}

export const DataClassDesigner = withBaseDomainDesigner<Props>(DataClassDesignerImpl);
