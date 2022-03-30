import React, { ReactNode } from 'react';
import { fromJS, List, Map, OrderedMap } from 'immutable';
import { Domain } from '@labkey/api';

import { DomainDesign, DomainDetails, IAppDomainHeader, IDomainField, IDomainFormDisplayOptions } from '../models';
import DomainForm from '../DomainForm';
import {
    Alert,
    ConfirmModal,
    generateId,
    getHelpLink,
    initQueryGridState,
    IParentOption,
    ISelectRowsResult,
    MetricUnitProps,
    naturalSortByProperty,
    resolveErrorMessage,
    SCHEMAS,
} from '../../../..';

import { DEFAULT_DOMAIN_FORM_DISPLAY_OPTIONS } from '../constants';
import { addDomainField, getDomainPanelStatus, saveDomain } from '../actions';
import { initSampleSetSelects } from '../../samples/actions';
import { DEFAULT_SAMPLE_FIELD_CONFIG } from '../../samples/constants';
import { SAMPLE_SET_DISPLAY_TEXT } from '../../../constants';
import { BaseDomainDesigner, InjectedBaseDomainDesignerProps, withBaseDomainDesigner } from '../BaseDomainDesigner';

import { UNIQUE_ID_TYPE } from '../PropDescType';

import { hasModule, isCommunityDistribution } from '../../../app/utils';

import { NameExpressionValidationModal } from '../validation/NameExpressionValidationModal';

import { ComponentsAPIWrapper, getDefaultAPIWrapper } from '../../../APIWrapper';

import { GENID_SYNTAX_STRING } from '../NameExpressionGenIdBanner';

import { AliquotNamePatternProps, IParentAlias, SampleTypeModel } from './models';
import { SampleTypePropertiesPanel } from './SampleTypePropertiesPanel';
import { UniqueIdBanner } from './UniqueIdBanner';

const NEW_SAMPLE_SET_OPTION: IParentOption = {
    label: `(Current ${SAMPLE_SET_DISPLAY_TEXT})`,
    value: '{{this_sample_set}}',
    schema: SCHEMAS.SAMPLE_SETS.SCHEMA,
} as IParentOption;

const PROPERTIES_PANEL_INDEX = 0;
const DOMAIN_PANEL_INDEX = 1;

export const SAMPLE_SET_IMPORT_PREFIX = 'materialInputs/';
export const DATA_CLASS_IMPORT_PREFIX = 'dataInputs/';
const DATA_CLASS_SCHEMA_KEY = 'exp/dataclasses';
const SAMPLE_SET_NAME_EXPRESSION_TOPIC = 'sampleIDs#patterns';
const SAMPLE_SET_NAME_EXPRESSION_PLACEHOLDER = 'Enter a naming pattern (e.g., S-${now:date}-${dailySampleCount})';
const SAMPLE_SET_HELP_TOPIC = 'createSampleType';

interface Props {
    api?: ComponentsAPIWrapper;
    onChange?: (model: SampleTypeModel) => void;
    onCancel: () => void;
    onComplete: (response: DomainDesign) => void;
    beforeFinish?: (model: SampleTypeModel) => void;
    initModel: DomainDetails;
    defaultSampleFieldConfig?: Partial<IDomainField>;
    includeDataClasses?: boolean;
    headerText?: string;
    helpTopic?: string;
    useSeparateDataClassesAliasMenu?: boolean;
    sampleAliasCaption?: string;
    sampleTypeCaption?: string;
    dataClassAliasCaption?: string;
    dataClassTypeCaption?: string;
    dataClassParentageLabel?: string;
    showParentLabelPrefix?: boolean;
    isValidParentOptionFn?: (row: any, isDataClass: boolean) => boolean;
    testMode?: boolean;

    // EntityDetailsForm props
    nounSingular?: string;
    nounPlural?: string;
    nameExpressionInfoUrl?: string;
    nameExpressionPlaceholder?: string;

    // DomainDesigner props
    containerTop?: number; // This sets the top of the sticky header, default is 0
    useTheme?: boolean;
    showLinkToStudy?: boolean;
    appPropertiesOnly?: boolean;
    successBsStyle?: string;
    saveBtnText?: string;

    metricUnitProps?: MetricUnitProps;

    validateProperties?: (designerDetails?: any) => Promise<any>;

    domainFormDisplayOptions?: IDomainFormDisplayOptions;

    aliquotNamePatternProps?: AliquotNamePatternProps;

    validateNameExpressions?: boolean;

    showGenIdBanner?: boolean;
}

interface State {
    model: SampleTypeModel;
    parentOptions: IParentOption[];
    error: React.ReactNode;
    showUniqueIdConfirmation: boolean;
    uniqueIdsConfirmed: boolean;
    nameExpressionWarnings: string[];
    namePreviewsLoading: boolean;
    namePreviews: string[];
}

class SampleTypeDesignerImpl extends React.PureComponent<Props & InjectedBaseDomainDesignerProps, State> {
    static defaultProps = {
        api: getDefaultAPIWrapper(),
        defaultSampleFieldConfig: DEFAULT_SAMPLE_FIELD_CONFIG,
        includeDataClasses: false,
        useSeparateDataClassesAliasMenu: false,
        nameExpressionInfoUrl: getHelpLink(SAMPLE_SET_NAME_EXPRESSION_TOPIC),
        nameExpressionPlaceholder: SAMPLE_SET_NAME_EXPRESSION_PLACEHOLDER,
        helpTopic: SAMPLE_SET_HELP_TOPIC,
        showParentLabelPrefix: true,
        useTheme: false,
        showLinkToStudy: false,
        domainFormDisplayOptions: { ...DEFAULT_DOMAIN_FORM_DISPLAY_OPTIONS, domainKindDisplayName: 'sample type' },
        validateNameExpressions: true,
    };

    constructor(props: Props & InjectedBaseDomainDesignerProps) {
        super(props);

        initQueryGridState();
        let domainDetails = this.props.initModel || DomainDetails.create();
        if (props.defaultSampleFieldConfig) {
            const domainDesign = domainDetails.domainDesign.merge({
                reservedFieldNames: List<string>([props.defaultSampleFieldConfig?.name.toLowerCase()]),
            });
            domainDetails = domainDetails.set('domainDesign', domainDesign) as DomainDetails;
        }

        const model = SampleTypeModel.create(
            domainDetails,
            domainDetails.domainDesign ? domainDetails.domainDesign.name : undefined
        );

        this.state = {
            model,
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
        const { includeDataClasses, setSubmitting } = this.props;
        const { model } = this.state;

        try {
            const results = await initSampleSetSelects(!model.isNew(), includeDataClasses, model.containerPath);
            this.initParentOptions(results);
        } catch (error) {
            setSubmitting(false, () => {
                this.setState({ error: resolveErrorMessage(error) });
            });
        }
    };

    formatLabel = (name: string, prefix: string, containerPath?: string): string => {
        const { includeDataClasses, useSeparateDataClassesAliasMenu, showParentLabelPrefix } = this.props;
        return includeDataClasses && !useSeparateDataClassesAliasMenu && showParentLabelPrefix
            ? `${prefix}: ${name} (${containerPath})`
            : name;
    };

    initParentOptions = (responses: ISelectRowsResult[]): void => {
        const { isValidParentOptionFn } = this.props;
        const { model } = this.state;
        const sets: IParentOption[] = [];

        responses.forEach(result => {
            const domain = fromJS(result.models[result.key]);

            const isDataClass = result.key === DATA_CLASS_SCHEMA_KEY;

            const prefix = isDataClass ? DATA_CLASS_IMPORT_PREFIX : SAMPLE_SET_IMPORT_PREFIX;
            const labelPrefix = isDataClass ? 'Data Class' : 'Sample Type';

            domain.forEach(row => {
                if (isValidParentOptionFn) {
                    if (!isValidParentOptionFn(row, isDataClass)) return;
                }
                const name = row.getIn(['Name', 'value']);
                const containerPath = row.getIn(['Folder', 'displayValue']);
                const label =
                    name === model.name && !isDataClass
                        ? NEW_SAMPLE_SET_OPTION.label
                        : this.formatLabel(name, labelPrefix, containerPath);
                sets.push({
                    value: prefix + name,
                    label,
                    schema: isDataClass ? SCHEMAS.DATA_CLASSES.SCHEMA : SCHEMAS.SAMPLE_SETS.SCHEMA,
                    query: name, // Issue 33653: query name is case-sensitive for some data inputs (sample parents)
                });
            });
        });

        if (model.isNew()) {
            sets.push(NEW_SAMPLE_SET_OPTION);
        }

        const parentOptions = sets.sort(naturalSortByProperty('label'));

        let parentAliases = Map<string, IParentAlias>();

        if (model?.importAliases) {
            const initialAlias = Map<string, string>(model.importAliases);
            initialAlias.forEach((val, key) => {
                const newId = generateId('sampleset-parent-import-alias-');
                const parentValue = parentOptions.find(opt => opt.value === val);
                if (!parentValue)
                    // parent option might have been filtered out by isValidParentOptionFn
                    return;

                parentAliases = parentAliases.set(newId, {
                    id: newId,
                    alias: key,
                    parentValue,
                    ignoreAliasError: false,
                    ignoreSelectError: false,
                } as IParentAlias);
            });
        }

        this.setState({
            model: model.merge({ parentAliases }) as SampleTypeModel,
            parentOptions,
        });
    };

    getImportAliasesAsMap(model: SampleTypeModel): Map<string, string> {
        const { name, parentAliases } = model;
        const aliases = {};

        if (parentAliases) {
            parentAliases.forEach((alias: IParentAlias) => {
                const { parentValue } = alias;

                let value = parentValue && parentValue.value ? (parentValue.value as string) : '';
                if (parentValue === NEW_SAMPLE_SET_OPTION) {
                    value = SAMPLE_SET_IMPORT_PREFIX + name;
                }

                aliases[alias.alias] = value;
            });
        }

        return Map<string, string>(aliases);
    }

    onFieldChange = (model: SampleTypeModel): void => {
        const { onChange } = this.props;

        this.setState(
            () => ({ model, uniqueIdsConfirmed: undefined }),
            () => {
                if (onChange) {
                    onChange(model);
                }
            }
        );
    };

    propertiesToggle = (collapsed: boolean, callback: () => void): void => {
        this.props.onTogglePanel(PROPERTIES_PANEL_INDEX, collapsed, callback);
    };

    formToggle = (collapsed: boolean, callback: () => void): void => {
        this.props.onTogglePanel(DOMAIN_PANEL_INDEX, collapsed, callback);
    };

    updateAliasValue = (id: string, field: string, newValue: any): IParentAlias => {
        const { model } = this.state;
        const { parentAliases } = model;
        return {
            ...parentAliases.get(id),
            isDupe: false, // Clear error because of change
            [field]: newValue,
        } as IParentAlias;
    };

    parentAliasChange = (id: string, field: string, newValue: any): void => {
        const { model } = this.state;
        const { parentAliases } = model;
        const changedAlias = this.updateAliasValue(id, field, newValue);

        const newAliases = parentAliases.set(id, changedAlias);
        const newModel = model.merge({ parentAliases: newAliases }) as SampleTypeModel;
        this.onFieldChange(newModel);
    };

    updateDupes = (id: string): void => {
        const { model } = this.state;
        if (!model) {
            return;
        }

        const { parentAliases } = model;
        const dupes = model.getDuplicateAlias();
        let newAliases = OrderedMap<string, IParentAlias>();
        parentAliases.forEach((alias: IParentAlias) => {
            const isDupe = dupes && dupes.has(alias.id);
            let changedAlias = alias;
            if (isDupe !== alias.isDupe) {
                changedAlias = this.updateAliasValue(alias.id, 'isDupe', isDupe);
            }

            if (alias.id === id) {
                changedAlias = {
                    ...changedAlias,
                    ignoreAliasError: false,
                    ignoreSelectError: false,
                };
            }

            newAliases = newAliases.set(alias.id, changedAlias);
        });

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

    domainChangeHandler = (domain: DomainDesign, dirty: boolean): void => {
        const { onChange } = this.props;
        const { model } = this.state;

        this.setState(
            () => ({
                model: model.merge({ domain }) as SampleTypeModel,
            }),
            () => {
                // Issue 39918: use the dirty property that DomainForm onChange passes
                if (onChange && dirty) {
                    onChange(model);
                }
            }
        );
    };

    onUniqueIdCancel = (): void => {
        this.setState({
            showUniqueIdConfirmation: false,
            uniqueIdsConfirmed: false,
        });
    };

    onUniqueIdConfirm = (): void => {
        this.setState(
            () => ({
                uniqueIdsConfirmed: true,
            }),
            () => this.onFinish()
        );
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

    onFinish = (): void => {
        const { defaultSampleFieldConfig, setSubmitting, metricUnitProps } = this.props;
        const { model, uniqueIdsConfirmed } = this.state;

        if (!model.isNew() && this.getNumNewUniqueIdFields() > 0 && !uniqueIdsConfirmed) {
            this.setState({
                showUniqueIdConfirmation: true,
            });
            return;
        }

        const metricUnitLabel = metricUnitProps?.metricUnitLabel;
        const metricUnitRequired = metricUnitProps?.metricUnitRequired;
        const isValid = model.isValid(defaultSampleFieldConfig, metricUnitRequired);

        this.props.onFinish(isValid, this.saveDomain);

        if (!isValid) {
            let exception: string;

            if (model.hasInvalidNameField(defaultSampleFieldConfig)) {
                exception =
                    'The ' +
                    defaultSampleFieldConfig.name +
                    ' field name is reserved for imported or generated sample ids.';
            } else if (model.getDuplicateAlias(true).size > 0) {
                exception = 'Duplicate parent alias header found: ' + model.getDuplicateAlias(true).join(', ');
            } else if (!model.isMetricUnitValid(metricUnitRequired)) {
                exception = metricUnitLabel + ' field is required.';
            } else {
                exception = model.domain.getFirstFieldError();
            }

            const updatedModel = model.set('exception', exception) as SampleTypeModel;
            setSubmitting(false, () => {
                this.setState(() => ({ model: updatedModel }));
            });
        }
    };

    saveDomain = async (hasConfirmedNameExpression?: boolean) => {
        const { beforeFinish, setSubmitting, api } = this.props;
        const { model } = this.state;
        const { name, domain, description } = model;

        if (beforeFinish && !hasConfirmedNameExpression) {
            beforeFinish(model);
        }

        let domainDesign = domain.merge({
            name, // This will be the Sample Type Name
            description,
        }) as DomainDesign;

        const details = this.getDomainDetails();

        if (model.isNew()) {
            // Initialize a sampleId column, this is not displayed as part of the designer.
            const nameCol = {
                name: 'Name',
            };

            domainDesign = addDomainField(domainDesign, nameCol);
        }

        try {
            if (!hasConfirmedNameExpression && this.props.validateProperties) {
                const response = await this.props.validateProperties(details);
                if (response.error) {
                    const updatedModel = model.set('exception', response.error) as SampleTypeModel;
                    setSubmitting(false, () => {
                        this.setState(() => ({ model: updatedModel, showUniqueIdConfirmation: false, }));
                    });
                    return;
                }
            }
        } catch (error) {
            console.error(error);
            const exception = resolveErrorMessage(error);
            setSubmitting(false, () => {
                this.setState(() => ({ model: model.set('exception', exception) as SampleTypeModel, showUniqueIdConfirmation: false, }));
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
                        this.setState(() => ({
                            model: updatedModel,
                            nameExpressionWarnings: response.warnings,
                            namePreviews: response.previews,
                            showUniqueIdConfirmation: false,
                        }));
                    });
                    return;
                }
            }
        } catch (error) {
            console.error(error);
            const exception = resolveErrorMessage(error);
            setSubmitting(false, () => {
                this.setState(() => ({ model: model.set('exception', exception) as SampleTypeModel, showUniqueIdConfirmation: false, }));
            });
            return;
        }

        try {
            const response: DomainDesign = await saveDomain(domainDesign, Domain.KINDS.SAMPLE_TYPE, details, name);
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
                this.setState(() => ({ model: updatedModel, showUniqueIdConfirmation: false, }));
            });
        }
    };

    onAddUniqueIdField = (fieldConfig: Partial<IDomainField>): void => {
        this.setState(state => ({
            model: state.model.set('domain', addDomainField(this.state.model.domain, fieldConfig)) as SampleTypeModel,
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
        } = model;

        return {
            name,
            nameExpression,
            aliquotNameExpression,
            labelColor,
            metricUnit,
            autoLinkTargetContainerId,
            autoLinkCategory,
            importAliases: this.getImportAliasesAsMap(model).toJS(),
        };
    };

    onNameFieldHover = async () => {
        const { api } = this.props;
        const { model, namePreviewsLoading } = this.state;

        if (namePreviewsLoading) return;

        const { name, domain, description } = model;

        const domainDesign = domain.merge({
            name,
            description,
        }) as DomainDesign;

        const details = this.getDomainDetails();

        try {
            if (this.props.validateNameExpressions) {
                const response = await api.domain.validateDomainNameExpressions(
                    domainDesign,
                    Domain.KINDS.SAMPLE_TYPE,
                    details,
                    true
                );
                this.setState(() => ({
                    namePreviewsLoading: false,
                    namePreviews: response?.previews,
                }));
            }
        } catch (error) {
            console.error(error);
            this.setState(() => ({
                namePreviewsLoading: false,
            }));
        }
    };

    render() {
        const {
            api,
            containerTop,
            useTheme,
            appPropertiesOnly,
            successBsStyle,
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
            testMode,
            domainFormDisplayOptions,
            showLinkToStudy,
            aliquotNamePatternProps,
            initModel,
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
            ' to this Sample Type. ' +
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
                successBsStyle={successBsStyle}
            >
                <SampleTypePropertiesPanel
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
                    controlledCollapse={true}
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
                    useTheme={useTheme}
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
                    key={model.domain.domainId || 0}
                    appDomainHeaderRenderer={this.uniqueIdBannerRenderer}
                    domainIndex={0}
                    domain={model.domain}
                    headerTitle="Fields"
                    helpTopic={null} // null so that we don't show the "learn more about this tool" link for this domains
                    controlledCollapse={true}
                    initCollapsed={currentPanelIndex !== DOMAIN_PANEL_INDEX}
                    validate={validatePanel === DOMAIN_PANEL_INDEX}
                    panelStatus={
                        model.isNew()
                            ? getDomainPanelStatus(1, currentPanelIndex, visitedPanels, firstState)
                            : 'COMPLETE'
                    }
                    containerTop={containerTop}
                    onChange={this.domainChangeHandler}
                    onToggle={this.formToggle}
                    appPropertiesOnly={appPropertiesOnly}
                    useTheme={useTheme}
                    successBsStyle={successBsStyle}
                    testMode={testMode}
                    domainFormDisplayOptions={{
                        ...domainFormDisplayOptions,
                        hideStudyPropertyTypes: !_showLinkToStudy,
                        showScannableOption: true,
                        textChoiceLockedSqlFragment:
                            "MAX(CASE WHEN SampleState.StatusType = 'Locked' THEN 1 ELSE 0 END)",
                    }}
                />
                {error && <div className="domain-form-panel">{error && <Alert bsStyle="danger">{error}</Alert>}</div>}
                {showUniqueIdConfirmation && (
                    <ConfirmModal
                        title={'Updating Sample Type with Unique ID field' + (numNewUniqueIdFields !== 1 ? 's' : '')}
                        onCancel={this.onUniqueIdCancel}
                        onConfirm={this.onUniqueIdConfirm}
                        confirmButtonText={submitting ? "Finishing ..." : "Finish Updating Sample Type"}
                        confirmVariant="success"
                        cancelButtonText="Cancel"
                        submitting={submitting}
                    >
                        {confirmModalMessage}
                    </ConfirmModal>
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
