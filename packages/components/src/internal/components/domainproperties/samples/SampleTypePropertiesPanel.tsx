import React, { ReactNode } from 'react';
import { List, OrderedMap } from 'immutable';
import { Col, FormControl, FormControlProps, Row } from 'react-bootstrap';

import classNames from 'classnames';

import { getFormNameFromId } from '../entities/actions';
import { EntityDetailsForm } from '../entities/EntityDetailsForm';

import { PARENT_ALIAS_HELPER_TEXT, SAMPLE_SET_DISPLAY_TEXT } from '../../../constants';
import {
    DEFINE_SAMPLE_TYPE_TOPIC,
    DERIVE_SAMPLES_ALIAS_TOPIC,
    UNIQUE_IDS_TOPIC,
    HelpLink,
    getHelpLink,
} from '../../../util/helpLinks';
import { SampleSetParentAliasRow } from '../../samples/SampleSetParentAliasRow';
import {
    InjectedDomainPropertiesPanelCollapseProps,
    withDomainPropertiesPanelCollapse,
} from '../DomainPropertiesPanelCollapse';
import { BasePropertiesPanel, BasePropertiesPanelProps } from '../BasePropertiesPanel';
import { HelpTopicURL } from '../HelpTopicURL';

import { DomainFieldLabel } from '../DomainFieldLabel';
import { SectionHeading } from '../SectionHeading';

import { getValidPublishTargets } from '../assay/actions';
import { ENTITY_FORM_IDS } from '../entities/constants';

import { AutoLinkToStudyDropdown } from '../AutoLinkToStudyDropdown';

import { getCurrentProductName, isCommunityDistribution, isSampleManagerEnabled } from '../../../app/utils';

import { loadNameExpressionOptions } from '../../settings/actions';

import { PREFIX_SUBSTITUTION_EXPRESSION, PROPERTIES_PANEL_NAMING_PATTERN_WARNING_MSG } from '../constants';

import { NameExpressionPreview } from '../NameExpressionPreview';

import { NameExpressionGenIdProps } from '../NameExpressionGenIdBanner';

import { SCHEMAS } from '../../../schemas';
import { IParentOption } from '../../entities/models';
import { Container } from '../../base/models/Container';
import { IDomainField } from '../models';
import { generateId } from '../../../util/utils';
import { AddEntityButton } from '../../buttons/AddEntityButton';
import { ColorPickerInput } from '../../forms/input/ColorPickerInput';
import { SelectInput } from '../../forms/input/SelectInput';

import { UniqueIdBanner } from './UniqueIdBanner';
import { AliquotNamePatternProps, IParentAlias, MetricUnitProps, SampleTypeModel } from './models';

const PROPERTIES_HEADER_ID = 'sample-type-properties-hdr';
const ALIQUOT_HELP_LINK = getHelpLink('aliquotIDs');
const ALIQUOT_NAME_PLACEHOLDER = 'Enter a naming pattern for aliquots (e.g., ${${AliquotedFrom}-:withCounter})';

// Splitting these out to clarify where they end-up
interface OwnProps {
    aliquotNamePatternProps?: AliquotNamePatternProps;
    appPropertiesOnly?: boolean;
    dataClassAliasCaption?: string;
    dataClassParentageLabel?: string;
    dataClassTypeCaption?: string;
    headerText?: string;
    helpTopic?: string;
    includeDataClasses?: boolean;
    metricUnitProps?: MetricUnitProps;
    model: SampleTypeModel;
    nameExpressionGenIdProps?: NameExpressionGenIdProps;
    onRemoveParentAlias: (id: string) => void;
    namePreviewsLoading?: boolean;
    useSeparateDataClassesAliasMenu?: boolean;
    sampleAliasCaption?: string;
    sampleTypeCaption?: string;
    parentOptions: IParentOption[];
    onParentAliasChange: (id: string, field: string, newValue: any) => void;
    updateModel: (newModel: SampleTypeModel) => void;
    showLinkToStudy?: boolean;
    onAddUniqueIdField: (fieldConfig: Partial<IDomainField>) => void;
    namePreviews?: string[];
    onNameFieldHover?: () => any;
    updateDupeParentAliases?: (id: string) => void;
    onAddParentAlias: (id: string, newAlias: IParentAlias) => void;
}

// Splitting these out to clarify where they end-up
interface EntityProps {
    nameExpressionInfoUrl?: string;
    nameExpressionPlaceholder?: string;
    nounPlural?: string;
    nounSingular?: string;
}

interface State {
    containers: List<Container>;
    isValid: boolean;
    loadingError: string;
    prefix: string;
}

type Props = OwnProps & EntityProps & BasePropertiesPanelProps;

const sampleSetAliasFilterFn = (alias: IParentAlias): boolean => {
    return alias.parentValue?.schema === SCHEMAS.SAMPLE_SETS.SCHEMA;
};

const sampleSetOptionFilterFn = (option: IParentOption): boolean => {
    return option?.schema === SCHEMAS.SAMPLE_SETS.SCHEMA;
};

const dataClassAliasFilterFn = (alias: IParentAlias): boolean => {
    return alias.parentValue?.schema === SCHEMAS.DATA_CLASSES.SCHEMA;
};

const dataClassOptionFilterFn = (option: IParentOption): boolean => {
    return option?.schema === SCHEMAS.DATA_CLASSES.SCHEMA;
};

class SampleTypePropertiesPanelImpl extends React.PureComponent<
    Props & InjectedDomainPropertiesPanelCollapseProps,
    State
> {
    static defaultProps = {
        nounSingular: SAMPLE_SET_DISPLAY_TEXT,
        nounPlural: SAMPLE_SET_DISPLAY_TEXT + 's',
        nameExpressionInfoUrl: getHelpLink('sampleIDs'),
        nameExpressionPlaceholder: 'Enter a naming pattern (e.g., S-${now:date}-${dailySampleCount})',
        appPropertiesOnly: false,
        showLinkToStudy: true,
        helpTopic: DEFINE_SAMPLE_TYPE_TOPIC,
        sampleAliasCaption: 'Sample Alias',
        sampleTypeCaption: 'Sample Type',
        dataClassAliasCaption: 'Data Class Alias',
        dataClassTypeCaption: 'Data Class',
        dataClassParentageLabel: 'data class',
        metricUnitProps: {
            metricUnitLabel: 'Metric Unit',
            metricUnitHelpMsg: 'The unit of measurement used for the sample type.',
        },
    };

    constructor(props) {
        super(props);

        this.state = {
            isValid: true,
            containers: undefined,
            prefix: undefined,
            loadingError: undefined,
        };
    }

    componentDidMount = async (): Promise<void> => {
        const { model } = this.props;

        try {
            const containers = await getValidPublishTargets(model.containerPath);
            this.setState({ containers });
        } catch (e) {
            console.error('Unable to load valid study targets for Auto-Link Data to Study input.');
            this.setState({ containers: List() });
        }

        if (isSampleManagerEnabled()) {
            try {
                const response = await loadNameExpressionOptions(model.containerPath);
                this.setState({ prefix: response.prefix ?? null });
            } catch (error) {
                this.setState({ loadingError: 'There was a problem retrieving the Naming Pattern prefix.' });
            }
        }
    };

    updateValidStatus = (newModel?: SampleTypeModel): void => {
        const { model, updateModel, metricUnitProps } = this.props;

        const updatedModel = newModel || model;
        const isValid =
            updatedModel?.hasValidProperties() && updatedModel?.isMetricUnitValid(metricUnitProps?.metricUnitRequired);

        this.setState(
            () => ({ isValid }),
            () => {
                // Issue 39918: only consider the model changed if there is a newModel param
                if (newModel) {
                    updateModel(updatedModel);
                }
            }
        );
    };

    onFormChange = (evt: any): void => {
        const id = evt.target.id;
        const value = evt.target.value;
        this.onFieldChange(getFormNameFromId(id), value);
    };

    onFieldChange = (key: string, value: any): void => {
        const { model } = this.props;
        const newModel = model.set(key, value) as SampleTypeModel;
        this.updateValidStatus(newModel);
    };

    addParentAlias = (schema: string): void => {
        // Generates a temporary id for add/delete of the import aliases
        const newId = generateId('sampletype-parent-import-alias-');

        const newParentAlias = {
            id: newId,
            alias: '',
            parentValue: { schema },
            ignoreAliasError: true,
            ignoreSelectError: true,
            isDupe: false,
        };

        this.props.onAddParentAlias(newId, newParentAlias);
    };

    renderAddEntityHelper = (parentageLabel?: string): any => {
        const msg = parentageLabel
            ? PARENT_ALIAS_HELPER_TEXT.replace('parentage', parentageLabel)
            : PARENT_ALIAS_HELPER_TEXT;
        return (
            <>
                <p>{msg}</p>
                <p>
                    <HelpLink topic={DERIVE_SAMPLES_ALIAS_TOPIC}>More info</HelpLink>
                </p>
            </>
        );
    };

    renderParentAliases = (includeSampleSet: boolean, includeDataClass: boolean) => {
        const {
            model,
            parentOptions,
            updateDupeParentAliases,
            sampleAliasCaption,
            sampleTypeCaption,
            dataClassAliasCaption,
            dataClassTypeCaption,
            dataClassParentageLabel,
            onParentAliasChange,
            onRemoveParentAlias,
        } = this.props;
        const { parentAliases } = model;

        if (!parentAliases || !parentOptions) return [];

        let filteredParentAliases = OrderedMap<string, IParentAlias>();
        let filteredParentOptions = Array<IParentOption>();
        let aliasCaption;
        let parentTypeCaption;

        let helpMsg;
        if (includeSampleSet && includeDataClass) {
            filteredParentAliases = parentAliases;
            filteredParentOptions = parentOptions;
        } else if (includeSampleSet) {
            filteredParentAliases = parentAliases.filter(sampleSetAliasFilterFn) as OrderedMap<string, IParentAlias>;
            filteredParentOptions = parentOptions.filter(sampleSetOptionFilterFn);
            aliasCaption = sampleAliasCaption;
            parentTypeCaption = sampleTypeCaption;
        } else if (includeDataClass) {
            filteredParentAliases = parentAliases.filter(dataClassAliasFilterFn) as OrderedMap<string, IParentAlias>;
            filteredParentOptions = parentOptions.filter(dataClassOptionFilterFn);
            aliasCaption = dataClassAliasCaption;
            parentTypeCaption = dataClassTypeCaption;

            helpMsg = PARENT_ALIAS_HELPER_TEXT.replace('parentage', dataClassParentageLabel);
        }

        return filteredParentAliases
            .valueSeq()
            .map(alias => (
                <SampleSetParentAliasRow
                    key={alias.id}
                    id={alias.id}
                    parentAlias={alias}
                    parentOptions={filteredParentOptions}
                    onAliasChange={onParentAliasChange}
                    onRemove={onRemoveParentAlias}
                    updateDupeParentAliases={updateDupeParentAliases}
                    aliasCaption={aliasCaption}
                    parentTypeCaption={parentTypeCaption}
                    helpMsg={helpMsg}
                />
            ))
            .toArray();
    };

    containsDataClassOptions(): boolean {
        return this.props.parentOptions?.filter(dataClassOptionFilterFn).length > 0;
    }

    renderUniqueIdHelpText = (): ReactNode => {
        return (
            <>
                <p>Use a Unique ID field to represent barcodes or other ID fields in use in your lab.</p>
                <p>
                    Learn more about using <HelpLink topic={UNIQUE_IDS_TOPIC}>barcodes and unique IDs</HelpLink> in{' '}
                    {getCurrentProductName()}.
                </p>
            </>
        );
    };

    render() {
        const {
            model,
            onAddUniqueIdField,
            parentOptions,
            nameExpressionInfoUrl,
            nameExpressionPlaceholder,
            aliquotNamePatternProps,
            nounSingular,
            nounPlural,
            headerText,
            helpTopic,
            includeDataClasses,
            useSeparateDataClassesAliasMenu,
            dataClassAliasCaption,
            sampleAliasCaption,
            dataClassParentageLabel,
            appPropertiesOnly,
            showLinkToStudy,
            metricUnitProps,
            namePreviews,
            namePreviewsLoading,
            onNameFieldHover,
            nameExpressionGenIdProps,
        } = this.props;
        const { isValid, containers, prefix, loadingError } = this.state;

        const showAliquotNameExpression = aliquotNamePatternProps?.showAliquotNameExpression;
        const aliquotNameExpressionInfoUrl = aliquotNamePatternProps?.aliquotNameExpressionInfoUrl;
        const aliquotNameExpressionPlaceholder = aliquotNamePatternProps?.aliquotNameExpressionPlaceholder;

        const includeMetricUnitProperty = metricUnitProps?.includeMetricUnitProperty,
            metricUnitLabel = metricUnitProps?.metricUnitLabel || 'Metric Unit',
            metricUnitHelpMsg =
                metricUnitProps?.metricUnitHelpMsg || 'The unit of measurement used for the sample type.',
            metricUnitOptions = metricUnitProps?.metricUnitOptions,
            metricUnitRequired = metricUnitProps?.metricUnitRequired;
        const allowTimepointProperties = model.domain.get('allowTimepointProperties');

        const showDataClass = includeDataClasses && useSeparateDataClassesAliasMenu && this.containsDataClassOptions();

        let warning;
        if (
            prefix &&
            !model.isNew() &&
            model.nameExpression &&
            !model.nameExpression.includes(PREFIX_SUBSTITUTION_EXPRESSION)
        ) {
            warning = `${PROPERTIES_PANEL_NAMING_PATTERN_WARNING_MSG}: "${prefix}".`;
        } else if (
            prefix &&
            showAliquotNameExpression &&
            model.aliquotNameExpression &&
            !model.aliquotNameExpression.includes(PREFIX_SUBSTITUTION_EXPRESSION)
        ) {
            warning = `Aliquot ${PROPERTIES_PANEL_NAMING_PATTERN_WARNING_MSG}: "${prefix}".`;
        } else if (loadingError !== undefined) {
            warning = loadingError;
        }

        const autoLinkDataToStudyHelpTip = (
            <>
                <p>
                    Automatically link Sample Type data rows to the specified target study. Only rows that include
                    subject and visit/date information will be linked.
                </p>
                <p>
                    The user performing the import must have insert permission in the target study and the corresponding
                    dataset.
                </p>
            </>
        );
        const linkedDatasetCategoryHelpTip = (
            <>
                <p>
                    Specify the desired category for the Sample Type Dataset that will be created (or appended to) in
                    the target study when rows are linked. If the category you specify does not exist, it will be
                    created.
                </p>
                <p>
                    If the Sample Type Dataset already exists, this setting will not overwrite a previously assigned
                    category. Leave blank to use the default category of "Uncategorized".
                </p>
            </>
        );

        return (
            <BasePropertiesPanel
                {...this.props}
                headerId={PROPERTIES_HEADER_ID}
                title="Sample Type Properties"
                titlePrefix={model.name}
                updateValidStatus={this.updateValidStatus}
                isValid={isValid}
                warning={warning}
            >
                <Row className="margin-bottom">
                    {headerText && (
                        <Col xs={9}>
                            <div className="entity-form--headerhelp">{headerText}</div>
                        </Col>
                    )}
                    <Col xs={headerText ? 3 : 12}>
                        <HelpTopicURL helpTopic={helpTopic} nounPlural={nounPlural} />
                    </Col>
                </Row>
                {appPropertiesOnly && <SectionHeading title="General Properties" />}
                <EntityDetailsForm
                    noun={nounSingular}
                    onFormChange={this.onFormChange}
                    data={model}
                    nameReadOnly={model.nameReadOnly}
                    nameExpressionInfoUrl={nameExpressionInfoUrl}
                    nameExpressionPlaceholder={nameExpressionPlaceholder}
                    warning={warning}
                    showPreviewName={!!model.nameExpression}
                    onNameFieldHover={onNameFieldHover}
                    namePreviewsLoading={namePreviewsLoading}
                    previewName={namePreviews?.[0]}
                    nameExpressionGenIdProps={nameExpressionGenIdProps}
                />
                {showAliquotNameExpression && (
                    <Row className="margin-bottom">
                        <Col xs={2}>
                            <div onMouseEnter={() => onNameFieldHover()}>
                                <DomainFieldLabel
                                    label="Aliquot Naming Pattern"
                                    helpTipBody={
                                        <>
                                            <p>Pattern used for generating unique Ids for Aliquots.</p>
                                            <p>
                                                By default, the name of the aliquot will use the name of its parent
                                                followed by a dash and a counter for that parent’s aliquots.
                                            </p>
                                            <p>
                                                For example, if the original sample is S1, aliquots of that sample will
                                                be named S1-1, S1-2, etc.
                                            </p>
                                            {model.aliquotNameExpression && (
                                                <NameExpressionPreview
                                                    previewName={namePreviews?.[1]}
                                                    isPreviewLoading={namePreviewsLoading}
                                                />
                                            )}
                                            <p>
                                                <a
                                                    target="_blank"
                                                    href={aliquotNameExpressionInfoUrl ?? ALIQUOT_HELP_LINK}
                                                    rel="noopener noreferrer"
                                                >
                                                    More info
                                                </a>
                                            </p>
                                        </>
                                    }
                                />
                            </div>
                        </Col>
                        <Col xs={10}>
                            <FormControl
                                className={classNames({
                                    'naming-pattern-border-warning': warning?.startsWith('Aliquot'),
                                })}
                                name="aliquotNameExpression"
                                type="text"
                                placeholder={aliquotNameExpressionPlaceholder ?? ALIQUOT_NAME_PLACEHOLDER}
                                onChange={(e: React.ChangeEvent<FormControlProps>) => {
                                    this.onFieldChange(e.target.name, e.target.value);
                                }}
                                value={model.aliquotNameExpression}
                            />
                        </Col>
                    </Row>
                )}
                {this.renderParentAliases(true, includeDataClasses && !useSeparateDataClassesAliasMenu)}
                {parentOptions && (
                    <Row>
                        <Col xs={2} />
                        <Col xs={10}>
                            <span>
                                <AddEntityButton
                                    entity={
                                        includeDataClasses && useSeparateDataClassesAliasMenu
                                            ? sampleAliasCaption
                                            : 'Parent Alias'
                                    }
                                    onClick={() => this.addParentAlias(SCHEMAS.SAMPLE_SETS.SCHEMA)}
                                    helperBody={this.renderAddEntityHelper()}
                                />
                            </span>
                        </Col>
                    </Row>
                )}
                {showDataClass && this.renderParentAliases(false, true)}
                {showDataClass && (
                    <Row>
                        <Col xs={2} />
                        <Col xs={10}>
                            <span>
                                <AddEntityButton
                                    entity={dataClassAliasCaption}
                                    onClick={() => this.addParentAlias(SCHEMAS.DATA_CLASSES.SCHEMA)}
                                    helperBody={this.renderAddEntityHelper(dataClassParentageLabel)}
                                />
                            </span>
                        </Col>
                    </Row>
                )}

                {allowTimepointProperties && showLinkToStudy && (
                    <>
                        <Row className="margin-top">
                            <Col xs={2}>
                                <DomainFieldLabel
                                    label="Auto-Link Data to Study"
                                    helpTipBody={autoLinkDataToStudyHelpTip}
                                />
                            </Col>
                            <Col xs={5}>
                                <AutoLinkToStudyDropdown
                                    containers={containers}
                                    onChange={this.onFormChange}
                                    autoLinkTarget={ENTITY_FORM_IDS.AUTO_LINK_TARGET}
                                    value={model.autoLinkTargetContainerId}
                                />
                            </Col>
                        </Row>
                        <Row className="margin-top">
                            <Col xs={2}>
                                <DomainFieldLabel
                                    label="Linked Dataset Category"
                                    helpTipBody={linkedDatasetCategoryHelpTip}
                                />
                            </Col>

                            <Col xs={5}>
                                <FormControl
                                    type="text"
                                    id={ENTITY_FORM_IDS.AUTO_LINK_CATEGORY}
                                    onChange={this.onFormChange}
                                    value={model.autoLinkCategory || ''}
                                />
                            </Col>
                        </Row>
                    </>
                )}

                {(appPropertiesOnly || !isCommunityDistribution()) && (
                    <SectionHeading cls="top-spacing" title="Storage Settings" />
                )}
                {appPropertiesOnly && (
                    <>
                        <Row className="margin-top">
                            <Col xs={2}>
                                <DomainFieldLabel
                                    label="Label Color"
                                    helpTipBody="The label color will be used to distinguish this sample type in various views in the application."
                                />
                            </Col>
                            <Col xs={10}>
                                <ColorPickerInput
                                    name="labelColor"
                                    value={model.labelColor}
                                    onChange={this.onFieldChange}
                                    allowRemove={true}
                                />
                            </Col>
                        </Row>
                        {includeMetricUnitProperty && (
                            <Row className="margin-top">
                                <Col xs={2}>
                                    <DomainFieldLabel
                                        label={metricUnitLabel}
                                        required={metricUnitRequired}
                                        helpTipBody={metricUnitHelpMsg}
                                    />
                                </Col>
                                <Col xs={3}>
                                    {metricUnitOptions ? (
                                        <SelectInput
                                            containerClass="sampleset-metric-unit-select-container"
                                            inputClass="sampleset-metric-unit-select"
                                            name="metricUnit"
                                            options={metricUnitOptions}
                                            required={metricUnitRequired}
                                            clearable={!metricUnitRequired}
                                            onChange={(name, formValue, option) => {
                                                this.onFieldChange(
                                                    name,
                                                    formValue === undefined && option ? option.id : formValue
                                                );
                                            }}
                                            placeholder="Select a unit..."
                                            value={model.metricUnit}
                                        />
                                    ) : (
                                        <FormControl
                                            name="metricUnit"
                                            type="text"
                                            placeholder="Enter a unit"
                                            required={metricUnitRequired}
                                            value={model.metricUnit}
                                            onChange={(e: React.ChangeEvent<FormControlProps>) => {
                                                this.onFieldChange(e.target.name, e.target.value);
                                            }}
                                        />
                                    )}
                                </Col>
                            </Row>
                        )}
                    </>
                )}
                {!isCommunityDistribution() && (
                    <Row className="margin-top">
                        <Col xs={2}>
                            <DomainFieldLabel label="Barcodes" helpTipBody={this.renderUniqueIdHelpText()} />
                        </Col>
                        <Col xs={10}>
                            <UniqueIdBanner model={model} isFieldsPanel={false} onAddField={onAddUniqueIdField} />
                        </Col>
                    </Row>
                )}
            </BasePropertiesPanel>
        );
    }
}

export const SampleTypePropertiesPanel = withDomainPropertiesPanelCollapse<Props>(SampleTypePropertiesPanelImpl);
