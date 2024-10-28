import React, { FC, memo, ReactNode } from 'react';
import { List, Map } from 'immutable';
import { Domain, getServerContext } from '@labkey/api';

import {
    DomainDesign,
    DomainDetails,
    DomainFieldIndexChange,
    IAppDomainHeader,
    IDomainField,
    IDomainFormDisplayOptions,
    IFieldChange,
} from '../models';
import DomainForm from '../DomainForm';

import { DEFAULT_DOMAIN_FORM_DISPLAY_OPTIONS, DERIVATION_DATA_SCOPES } from '../constants';
import { addDomainField, getDomainPanelStatus, handleDomainUpdates, scrollDomainErrorIntoView } from '../actions';
import { DEFAULT_SAMPLE_FIELD_CONFIG, SAMPLE_TYPE_NAME_EXPRESSION_TOPIC } from '../../samples/constants';
import { SAMPLE_SET_DISPLAY_TEXT } from '../../../constants';
import { BaseDomainDesigner, InjectedBaseDomainDesignerProps, withBaseDomainDesigner } from '../BaseDomainDesigner';

import { PropDescType, UNIQUE_ID_TYPE } from '../PropDescType';

import { biologicsIsPrimaryApp, getAppHomeFolderPath, hasModule, isCommunityDistribution } from '../../../app/utils';

import { NameExpressionValidationModal } from '../validation/NameExpressionValidationModal';

import { ComponentsAPIWrapper, getDefaultAPIWrapper } from '../../../APIWrapper';

import { GENID_SYNTAX_STRING } from '../NameExpressionGenIdBanner';

import { IImportAlias, IParentAlias, IParentOption, FolderConfigurableDataType } from '../../entities/models';
import { SCHEMAS } from '../../../schemas';
import {
    getHelpLink,
    HelpLink,
    LKS_SAMPLE_ALIQUOT_FIELDS_TOPIC,
    SAMPLE_ALIQUOT_FIELDS_TOPIC,
} from '../../../util/helpLinks';
import { resolveErrorMessage } from '../../../util/messaging';
import { Modal } from '../../../Modal';
import { Alert } from '../../base/Alert';

import { getDuplicateAlias, getParentAliasChangeResult, getParentAliasUpdateDupesResults } from '../utils';

import { SAMPLE_SET_IMPORT_PREFIX, SampleTypeDataType } from '../../entities/constants';

import { DataTypeFoldersPanel } from '../DataTypeFoldersPanel';

import { Container } from '../../base/models/Container';

import { UniqueIdBanner } from './UniqueIdBanner';
import { SampleTypePropertiesPanel } from './SampleTypePropertiesPanel';
import { AliquotNamePatternProps, MetricUnitProps, SampleTypeModel } from './models';

const NEW_SAMPLE_SET_OPTION: IParentOption = {
    label: `(Current ${SAMPLE_SET_DISPLAY_TEXT})`,
    value: '{{this_sample_set}}',
    schema: SCHEMAS.SAMPLE_SETS.SCHEMA,
} as IParentOption;

const PROPERTIES_PANEL_INDEX = 0;
const DOMAIN_PANEL_INDEX = 1;
const FOLDERS_PANEL_INDEX = 2;

const SAMPLE_TYPE_NAME_EXPRESSION_PLACEHOLDER = 'Enter a naming pattern (e.g., S-${now:date}-${dailySampleCount})';
const SAMPLE_TYPE_HELP_TOPIC = 'createSampleType';

const AliquotOptionsHelp: FC<{ helpTopic: string }> = memo(({ helpTopic }) => {
    return (
        <div>
            <p>
                <b>Editable for samples only:</b> Field is editable for samples but not for aliquots. An aliquot will
                inherit the field value from its parent sample.
            </p>
            <p>
                <b>Editable for aliquots only:</b> Field is viewable and editable for aliquots but not for samples.
            </p>
            <p>
                <b>Separately editable for samples and aliquots:</b> Field is editable for samples and aliquots
                independently.
            </p>
            <br />
            <p>
                Learn more about <HelpLink topic={helpTopic}>Sample Aliquots</HelpLink>.
            </p>
        </div>
    );
});

interface Props {
    aliquotNamePatternProps?: AliquotNamePatternProps;
    allowFolderExclusion?: boolean;
    api?: ComponentsAPIWrapper;
    appPropertiesOnly?: boolean;
    beforeFinish?: (model: SampleTypeModel) => void;
    dataClassAliasCaption?: string;
    dataClassParentageLabel?: string;
    dataClassTypeCaption?: string;
    defaultSampleFieldConfig?: Partial<IDomainField>;
    domainFormDisplayOptions?: IDomainFormDisplayOptions;
    headerText?: string;
    helpTopic?: string;
    includeDataClasses?: boolean;
    initModel?: DomainDetails;
    isValidParentOptionFn?: (row: any, isDataClass: boolean) => boolean;
    metricUnitProps?: MetricUnitProps;
    nameExpressionInfoUrl?: string;
    nameExpressionPlaceholder?: string;
    nounPlural?: string;
    nounSingular?: string;
    onCancel: () => void;
    onChange?: (model: SampleTypeModel) => void;
    onComplete: (response: DomainDesign) => void;
    sampleAliasCaption?: string;
    sampleTypeCaption?: string;
    saveBtnText?: string;
    showAliquotOptions?: boolean;
    showGenIdBanner?: boolean;
    showLinkToStudy?: boolean;
    showParentLabelPrefix?: boolean;
    useSeparateDataClassesAliasMenu?: boolean;
    validateNameExpressions?: boolean;
    validateProperties?: (designerDetails?: any) => Promise<any>;
}

interface State {
    error: React.ReactNode;
    model: SampleTypeModel;
    nameExpressionWarnings: string[];
    namePreviews: string[];
    namePreviewsLoading: boolean;
    parentOptions: IParentOption[];
    showUniqueIdConfirmation: boolean;
    uniqueIdsConfirmed: boolean;
}
// Exported for testing
export class SampleTypeDesignerImpl extends React.PureComponent<Props & InjectedBaseDomainDesignerProps, State> {
    static defaultProps = {
        api: getDefaultAPIWrapper(),
        defaultSampleFieldConfig: DEFAULT_SAMPLE_FIELD_CONFIG,
        includeDataClasses: false,
        useSeparateDataClassesAliasMenu: false,
        nameExpressionInfoUrl: getHelpLink(SAMPLE_TYPE_NAME_EXPRESSION_TOPIC),
        nameExpressionPlaceholder: SAMPLE_TYPE_NAME_EXPRESSION_PLACEHOLDER,
        helpTopic: SAMPLE_TYPE_HELP_TOPIC,
        showParentLabelPrefix: true,
        showLinkToStudy: false,
        domainFormDisplayOptions: {
            ...DEFAULT_DOMAIN_FORM_DISPLAY_OPTIONS,
            domainKindDisplayName: SampleTypeDataType.typeNounSingular.toLowerCase(),
        },
        validateNameExpressions: true,
    };

    constructor(props: Props & InjectedBaseDomainDesignerProps) {
        super(props);

        let domainDetails = this.props.initModel || DomainDetails.create();
        if (props.defaultSampleFieldConfig) {
            const domainDesign = domainDetails.domainDesign.merge({
                reservedFieldNames: List<string>([props.defaultSampleFieldConfig?.name.toLowerCase()]),
            });
            domainDetails = domainDetails.set('domainDesign', domainDesign) as DomainDetails;
        }

        this.state = {
            model: SampleTypeModel.create(domainDetails, domainDetails.domainDesign?.name),
            parentOptions: undefined,
            error: undefined,
            showUniqueIdConfirmation: false,
            uniqueIdsConfirmed: undefined,
            nameExpressionWarnings: undefined,
            namePreviewsLoading: false,
            namePreviews: undefined,
        };
    }

    componentDidMount = async (): Promise<void> => {
        const { api, includeDataClasses, setSubmitting, isValidParentOptionFn } = this.props;
        const { model } = this.state;

        try {
            const { parentOptions, parentAliases } = await api.entity.initParentOptionsSelects(
                true,
                includeDataClasses,
                model.containerPath,
                isValidParentOptionFn,
                model.isNew() ? NEW_SAMPLE_SET_OPTION : null,
                model.importAliases,
                'sampleset-parent-import-alias-',
                this.formatLabel
            );
            this.setState(state => ({
                model: state.model.merge({ parentAliases }) as SampleTypeModel,
                parentOptions,
            }));
        } catch (error) {
            setSubmitting(false, () => {
                this.setState({ error: resolveErrorMessage(error) });
            });
        }
    };

    formatLabel = (name: string, prefix: string, isDataClass?: boolean, containerPath?: string): string => {
        const { includeDataClasses, useSeparateDataClassesAliasMenu, showParentLabelPrefix } = this.props;
        const { model } = this.state;
        if (name === model?.name && !isDataClass) return NEW_SAMPLE_SET_OPTION.label;

        return includeDataClasses && !useSeparateDataClassesAliasMenu && showParentLabelPrefix
            ? `${prefix}: ${name} (${containerPath})`
            : name;
    };

    getImportAliasesAsMap(model: SampleTypeModel): Record<string, IImportAlias> {
        const { name, parentAliases } = model;
        const aliases = {};

        parentAliases?.forEach((alias: IParentAlias) => {
            const { parentValue, required } = alias;

            let inputType = parentValue && parentValue.value ? (parentValue.value as string) : '';
            if (parentValue === NEW_SAMPLE_SET_OPTION) {
                inputType = SAMPLE_SET_IMPORT_PREFIX + name;
            }

            aliases[alias.alias] = {
                inputType,
                required,
            };
        });

        return aliases;
    }

    onFieldChange = (model: SampleTypeModel): void => {
        this.setState({ model, uniqueIdsConfirmed: undefined }, () => {
            this.props.onChange?.(model);
        });
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

    parentAliasChange = (id: string, field: string, newValue: any): void => {
        const { model } = this.state;
        const newAliases = getParentAliasChangeResult(model.parentAliases, id, field, newValue);
        const newModel = model.merge({ parentAliases: newAliases }) as SampleTypeModel;
        this.onFieldChange(newModel);
    };

    updateDupes = (id: string): void => {
        const { model } = this.state;
        if (!model) {
            return;
        }
        const newAliases = getParentAliasUpdateDupesResults(model.parentAliases, id);
        const newModel = model.merge({ parentAliases: newAliases }) as SampleTypeModel;
        this.onFieldChange(newModel);
    };

    addParentAlias = (id: string, newAlias: IParentAlias): void => {
        const { model } = this.state;
        const { parentAliases } = model;
        const newModel = model.merge({ parentAliases: parentAliases.set(id, newAlias) }) as SampleTypeModel;
        this.onFieldChange(newModel);
    };

    removeParentAlias = (id: string): void => {
        const { model } = this.state;
        const { parentAliases } = model;
        const aliases = parentAliases.delete(id);
        const newModel = model.set('parentAliases', aliases) as SampleTypeModel;
        this.onFieldChange(newModel);
    };

    onUpdateExcludedFolders = (dataType: FolderConfigurableDataType, excludedContainerIds: string[]): void => {
        this.setState(
            prevState => {
                let newModel = prevState.model;
                if (dataType === 'SampleType') {
                    newModel = newModel.set('excludedContainerIds', excludedContainerIds) as SampleTypeModel;
                } else if (dataType === 'DashboardSampleType') {
                    newModel = newModel.set('excludedDashboardContainerIds', excludedContainerIds) as SampleTypeModel;
                }
                return {
                    ...prevState,
                    model: newModel,
                    uniqueIdsConfirmed: undefined,
                };
            },
            () => {
                this.props.onChange?.(this.state.model);
            }
        );
    };

    domainChangeHandler = (
        domain: DomainDesign,
        dirty: boolean,
        rowIndexChange?: DomainFieldIndexChange[],
        changes?: List<IFieldChange>
    ): void => {
        this.setState(
            state => ({
                model: state.model.merge({
                    domain: domain ?? handleDomainUpdates(state.model.domain, changes),
                }) as SampleTypeModel,
            }),
            () => {
                // Issue 39918: use the dirty property that DomainForm onChange passes
                if (dirty) {
                    this.props.onChange?.(this.state.model);
                }
            }
        );
    };

    onUniqueIdCancel = (): void => {
        this.setState({ showUniqueIdConfirmation: false, uniqueIdsConfirmed: false });
    };

    onUniqueIdConfirm = (): void => {
        this.setState({ showUniqueIdConfirmation: false, uniqueIdsConfirmed: true }, this.onFinish);
    };

    onNameExpressionWarningCancel = (): void => {
        const { setSubmitting } = this.props;

        setSubmitting(false, () => {
            this.setState({ nameExpressionWarnings: undefined });
        });
    };

    onNameExpressionWarningConfirm = (): void => {
        this.setState({ nameExpressionWarnings: undefined }, () => {
            this.saveDomain(true);
        });
    };

    onFinish = (): void => {
        const { defaultSampleFieldConfig, setSubmitting, metricUnitProps } = this.props;
        const { model, uniqueIdsConfirmed } = this.state;

        if (!model.isNew() && this.getNumNewUniqueIdFields() > 0 && !uniqueIdsConfirmed) {
            this.setState({ showUniqueIdConfirmation: true });
            return;
        }

        const metricUnitRequired = metricUnitProps?.metricUnitRequired;
        const isValid = model.isValid(defaultSampleFieldConfig, metricUnitRequired);

        this.props.onFinish(isValid, this.saveDomain);

        if (isValid) return;

        let exception: string;

        if (model.hasInvalidNameField(defaultSampleFieldConfig)) {
            exception =
                'The ' +
                defaultSampleFieldConfig.name +
                ' field name is reserved for imported or generated sample ids.';
        } else if (getDuplicateAlias(model.parentAliases, true).size > 0) {
            exception =
                'Duplicate parent alias header found: ' + getDuplicateAlias(model.parentAliases, true).join(', ');
        } else if (!model.isMetricUnitValid(metricUnitRequired)) {
            exception = metricUnitProps?.metricUnitLabel + ' field is required.';
        } else {
            exception = model.domain.getFirstFieldError();
        }

        const updatedModel = model.set('exception', exception) as SampleTypeModel;
        setSubmitting(false, () => {
            this.setState({ model: updatedModel }, () => {
                scrollDomainErrorIntoView();
            });
        });
    };

    saveDomain = async (hasConfirmedNameExpression?: boolean): Promise<void> => {
        const { api, beforeFinish, setSubmitting } = this.props;
        const { model } = this.state;
        const { name, domain, description } = model;
        if (!hasConfirmedNameExpression) {
            beforeFinish?.(model);
        }

        let domainDesign = domain.merge({
            name, // This will be the Sample Type Name
            description,
        }) as DomainDesign;

        const details = this.getDomainDetails();

        if (model.isNew()) {
            // Initialize a sampleId column, this is not displayed as part of the designer.
            domainDesign = addDomainField(domainDesign, { name: 'Name' });
        }

        try {
            if (!hasConfirmedNameExpression && this.props.validateProperties) {
                const response = await this.props.validateProperties(details);
                if (response.error) {
                    const updatedModel = model.set('exception', response.error) as SampleTypeModel;
                    setSubmitting(false, () => {
                        this.setState(
                            () => ({ model: updatedModel, showUniqueIdConfirmation: false }),
                            () => {
                                scrollDomainErrorIntoView();
                            }
                        );
                    });
                    return;
                }
            }
        } catch (error) {
            const exception = resolveErrorMessage(error);
            setSubmitting(false, () => {
                this.setState(
                    () => ({
                        model: model.set('exception', exception) as SampleTypeModel,
                        showUniqueIdConfirmation: false,
                    }),
                    () => {
                        scrollDomainErrorIntoView();
                    }
                );
            });
            return;
        }

        try {
            if (this.props.validateNameExpressions && !hasConfirmedNameExpression) {
                const response = await api.domain.validateDomainNameExpressions(
                    domainDesign,
                    Domain.KINDS.SAMPLE_TYPE,
                    details,
                    true
                );
                if (response.errors?.length > 0 || response.warnings?.length > 0) {
                    const updatedModel = model.set('exception', response.errors?.join('\n')) as SampleTypeModel;
                    setSubmitting(false, () => {
                        this.setState(
                            () => ({
                                model: updatedModel,
                                nameExpressionWarnings: response.warnings,
                                namePreviews: response.previews,
                                showUniqueIdConfirmation: false,
                            }),
                            () => {
                                scrollDomainErrorIntoView();
                            }
                        );
                    });
                    return;
                }
            }
        } catch (error) {
            console.error(error);
            const exception = resolveErrorMessage(error);
            setSubmitting(false, () => {
                this.setState(
                    () => ({
                        model: model.set('exception', exception) as SampleTypeModel,
                        showUniqueIdConfirmation: false,
                    }),
                    () => {
                        scrollDomainErrorIntoView();
                    }
                );
            });
            return;
        }

        try {
            const response = await api.domain.saveDomain({
                containerPath: model.isNew()
                    ? getAppHomeFolderPath(new Container(getServerContext().container))
                    : model.containerPath,
                domain: domainDesign,
                kind: Domain.KINDS.SAMPLE_TYPE,
                name,
                options: details,
            });
            setSubmitting(false, () => {
                this.props.onComplete(response);
            });
        } catch (response) {
            const exception = resolveErrorMessage(response);
            const updatedModel = exception
                ? (model.set('exception', exception) as SampleTypeModel)
                : (model.merge({
                      // since the isNew case adds in the Name column, we need to go back to the state model's domain to merge in the error info
                      domain: domain.merge({ domainException: response.domainException }) as DomainDesign,
                      exception: undefined,
                  }) as SampleTypeModel);

            setSubmitting(false, () => {
                this.setState({ model: updatedModel, showUniqueIdConfirmation: false }, () => {
                    scrollDomainErrorIntoView();
                });
            });
        }
    };

    onAddUniqueIdField = (fieldConfig: Partial<IDomainField>): void => {
        this.setState(state => ({
            model: state.model.set('domain', addDomainField(state.model.domain, fieldConfig)) as SampleTypeModel,
        }));
    };

    uniqueIdBannerRenderer = (config: IAppDomainHeader): ReactNode => {
        const { model } = this.state;
        if (isCommunityDistribution() || !model.isNew() || model.domain?.fields?.isEmpty()) {
            return null;
        }
        return <UniqueIdBanner model={this.state.model} isFieldsPanel={true} onAddField={config.onAddField} />;
    };

    getNumNewUniqueIdFields(): number {
        const { model } = this.state;
        return model.domain.fields.filter(field => field.isNew() && field.isUniqueIdField()).count();
    }

    getDomainDetails = (): { [key: string]: any } => {
        const { model } = this.state;

        const {
            name,
            nameExpression,
            aliquotNameExpression,
            labelColor,
            metricUnit,
            autoLinkTargetContainerId,
            autoLinkCategory,
            excludedContainerIds,
            excludedDashboardContainerIds,
        } = model;

        return {
            name,
            nameExpression,
            aliquotNameExpression,
            labelColor,
            metricUnit,
            autoLinkTargetContainerId,
            autoLinkCategory,
            importAliases: this.getImportAliasesAsMap(model),
            excludedContainerIds,
            excludedDashboardContainerIds,
        };
    };

    onNameFieldHover = async (): Promise<void> => {
        const { api } = this.props;
        const { model, namePreviewsLoading } = this.state;

        if (namePreviewsLoading) return;

        const { name, domain, description } = model;

        const domainDesign = domain.merge({
            name,
            description,
        }) as DomainDesign;

        try {
            if (this.props.validateNameExpressions) {
                const response = await api.domain.validateDomainNameExpressions(
                    domainDesign,
                    Domain.KINDS.SAMPLE_TYPE,
                    this.getDomainDetails(),
                    true
                );
                this.setState({ namePreviews: response?.previews, namePreviewsLoading: false });
            }
        } catch (error) {
            this.setState({ namePreviewsLoading: false });
        }
    };

    render() {
        const {
            allowFolderExclusion,
            api,
            appPropertiesOnly,
            currentPanelIndex,
            visitedPanels,
            firstState,
            validatePanel,
            submitting,
            onCancel,
            nameExpressionPlaceholder,
            nameExpressionInfoUrl,
            nounSingular,
            nounPlural,
            headerText,
            saveBtnText,
            helpTopic,
            includeDataClasses,
            useSeparateDataClassesAliasMenu,
            sampleAliasCaption,
            sampleTypeCaption,
            dataClassAliasCaption,
            dataClassTypeCaption,
            dataClassParentageLabel,
            metricUnitProps,
            domainFormDisplayOptions,
            showLinkToStudy,
            aliquotNamePatternProps,
            initModel,
            showAliquotOptions,
            showGenIdBanner,
        } = this.props;
        const {
            error,
            model,
            parentOptions,
            showUniqueIdConfirmation,
            nameExpressionWarnings,
            namePreviews,
            namePreviewsLoading,
        } = this.state;
        const numNewUniqueIdFields = this.getNumNewUniqueIdFields();
        // For non-premium LKSM the showLinkToStudy will be true, but the study module will not be present.
        // We also don't want to always show the link to study even if the study module is available (the LKB case).
        const _showLinkToStudy = showLinkToStudy && hasModule('study');
        const confirmModalMessage =
            'You have added ' +
            numNewUniqueIdFields +
            ' ' +
            UNIQUE_ID_TYPE.display +
            ' field' +
            (numNewUniqueIdFields !== 1 ? 's' : '') +
            ' to this ' +
            SampleTypeDataType.typeNounSingular +
            '. ' +
            'Values for ' +
            (numNewUniqueIdFields !== 1 ? 'these fields' : 'this field') +
            ' will be created for all existing samples.';

        const options = initModel?.get('options');

        const hasGenIdInExpression =
            model.nameExpression?.indexOf(GENID_SYNTAX_STRING) > -1 ||
            model.aliquotNameExpression?.indexOf(GENID_SYNTAX_STRING) > -1;

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
            >
                <SampleTypePropertiesPanel
                    api={api}
                    nounSingular={nounSingular}
                    nounPlural={nounPlural}
                    nameExpressionInfoUrl={nameExpressionInfoUrl}
                    nameExpressionPlaceholder={nameExpressionPlaceholder}
                    headerText={headerText}
                    helpTopic={helpTopic}
                    model={model}
                    parentOptions={parentOptions}
                    includeDataClasses={includeDataClasses}
                    useSeparateDataClassesAliasMenu={useSeparateDataClassesAliasMenu}
                    sampleAliasCaption={sampleAliasCaption}
                    sampleTypeCaption={sampleTypeCaption}
                    dataClassAliasCaption={dataClassAliasCaption}
                    dataClassTypeCaption={dataClassTypeCaption}
                    dataClassParentageLabel={dataClassParentageLabel}
                    onParentAliasChange={this.parentAliasChange}
                    onAddParentAlias={this.addParentAlias}
                    onRemoveParentAlias={this.removeParentAlias}
                    updateDupeParentAliases={this.updateDupes}
                    updateModel={this.onFieldChange}
                    controlledCollapse
                    initCollapsed={currentPanelIndex !== PROPERTIES_PANEL_INDEX}
                    panelStatus={
                        model.isNew()
                            ? getDomainPanelStatus(PROPERTIES_PANEL_INDEX, currentPanelIndex, visitedPanels, firstState)
                            : 'COMPLETE'
                    }
                    validate={validatePanel === PROPERTIES_PANEL_INDEX}
                    onToggle={this.propertiesToggle}
                    appPropertiesOnly={appPropertiesOnly}
                    showLinkToStudy={_showLinkToStudy}
                    metricUnitProps={metricUnitProps}
                    onAddUniqueIdField={this.onAddUniqueIdField}
                    aliquotNamePatternProps={aliquotNamePatternProps}
                    namePreviewsLoading={namePreviewsLoading}
                    namePreviews={namePreviews}
                    onNameFieldHover={this.onNameFieldHover}
                    nameExpressionGenIdProps={
                        showGenIdBanner && options && hasGenIdInExpression
                            ? {
                                  containerPath: model.containerPath,
                                  dataTypeName: options.get('name'),
                                  dataTypeLSID: options.get('lsid'),
                                  rowId: options.get('rowId'),
                                  kindName: 'SampleSet',
                                  api,
                              }
                            : undefined
                    }
                />
                <DomainForm
                    api={api.domain}
                    key={model.domain.domainId || 0}
                    appDomainHeaderRenderer={this.uniqueIdBannerRenderer}
                    domainIndex={0}
                    domain={model.domain}
                    headerTitle="Fields"
                    helpTopic={null} // null so that we don't show the "learn more about this tool" link for this domains
                    controlledCollapse
                    initCollapsed={currentPanelIndex !== DOMAIN_PANEL_INDEX}
                    validate={validatePanel === DOMAIN_PANEL_INDEX}
                    panelStatus={
                        model.isNew()
                            ? getDomainPanelStatus(1, currentPanelIndex, visitedPanels, firstState)
                            : 'COMPLETE'
                    }
                    onChange={this.domainChangeHandler}
                    onToggle={this.formToggle}
                    appPropertiesOnly={appPropertiesOnly}
                    domainFormDisplayOptions={{
                        ...domainFormDisplayOptions,
                        hideStudyPropertyTypes: !_showLinkToStudy,
                        showScannableOption: true,
                        textChoiceLockedSqlFragment:
                            "MAX(CASE WHEN SampleState.StatusType = 'Locked' THEN 1 ELSE 0 END)",
                        derivationDataScopeConfig: {
                            show: showAliquotOptions,
                            dataTypeFilter: (dataType: PropDescType) => !dataType.isUniqueId(),
                            sectionTitle: 'Sample/Aliquot Options',
                            labelAll: 'Separately editable for samples and aliquots',
                            labelChild: 'Editable for aliquots only',
                            labelParent: 'Editable for samples only (default)',
                            helpLinkNode: (
                                <AliquotOptionsHelp
                                    helpTopic={
                                        biologicsIsPrimaryApp()
                                            ? LKS_SAMPLE_ALIQUOT_FIELDS_TOPIC
                                            : SAMPLE_ALIQUOT_FIELDS_TOPIC
                                    }
                                />
                            ),
                            scopeChangeWarning:
                                "Updating a 'Samples Only' field to be 'Samples and Aliquots' will blank out the field values for all aliquots. This action cannot be undone. ",
                        },
                    }}
                    newFieldConfig={{
                        derivationDataScope: DERIVATION_DATA_SCOPES.PARENT_ONLY,
                    }}
                    systemFields={options?.get('systemFields')}
                />
                {appPropertiesOnly && allowFolderExclusion && (
                    // appPropertiesOnly check will prevent this panel from showing in LKS and in LKB media types
                    <DataTypeFoldersPanel
                        controlledCollapse
                        dataTypeRowId={model?.rowId}
                        dataTypeName={model?.name}
                        entityDataType={SampleTypeDataType}
                        relatedFolderConfigurableDataType="DashboardSampleType"
                        relatedDataTypeLabel="Include in Dashboard Insights graphs"
                        initCollapsed={currentPanelIndex !== FOLDERS_PANEL_INDEX}
                        onToggle={this.foldersToggle}
                        onUpdateExcludedFolders={this.onUpdateExcludedFolders}
                    />
                )}
                {error && <div className="domain-form-panel">{error && <Alert bsStyle="danger">{error}</Alert>}</div>}
                {showUniqueIdConfirmation && (
                    <Modal
                        title={
                            'Updating ' +
                            SampleTypeDataType.typeNounSingular +
                            ' with Unique ID field' +
                            (numNewUniqueIdFields !== 1 ? 's' : '')
                        }
                        onCancel={this.onUniqueIdCancel}
                        onConfirm={this.onUniqueIdConfirm}
                        confirmText="Continue"
                    >
                        {confirmModalMessage}
                    </Modal>
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

export const SampleTypeDesigner = withBaseDomainDesigner<Props>(SampleTypeDesignerImpl);
