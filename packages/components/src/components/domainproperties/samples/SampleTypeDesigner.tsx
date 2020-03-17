import React from 'react';
import { SampleTypeModel } from './models';
import { SampleTypePropertiesPanel } from "./SampleTypePropertiesPanel";
import {
    Alert,
    DomainDesign,
    DomainDetails,
    generateId,
    IDomainField,
    initQueryGridState,
    naturalSort,
    resolveErrorMessage,
    SAMPLE_TYPE,
    saveDomain,
    SCHEMAS,
    WizardNavButtons
} from "../../..";
import DomainForm from "../DomainForm";
import {IParentOption} from "../../entities/models";
import {IParentAlias} from "./models";
import {addDomainField, getDomainPanelStatus, getUpdatedVisitedPanelsList} from "../actions";
import {initSampleSetSelects,} from "../../samples/actions";
import {SAMPLE_SET_DISPLAY_TEXT, STICKY_HEADER_HEIGHT} from "../../../constants";
import {fromJS, List, Map, OrderedMap} from "immutable";
import {Domain} from "@labkey/api";

const DEFAULT_SAMPLE_FIELD_CONFIG = {
    required: true,
    dataType: SAMPLE_TYPE,
    conceptURI: SAMPLE_TYPE.conceptURI,
    rangeURI: SAMPLE_TYPE.rangeURI,
    lookupSchema: 'exp',
    lookupQuery: 'Materials',
    lookupType: {...SAMPLE_TYPE},
    name: 'SampleId',
} as Partial<IDomainField>;

const NEW_SAMPLE_SET_OPTION: IParentOption = {
    label: `(Current ${SAMPLE_SET_DISPLAY_TEXT})`,
    value: "{{this_sample_set}}"
} as IParentOption;

const PROPERTIES_PANEL_INDEX: number = 0;
const DOMAIN_PANEL_INDEX: number = 1;

export const SAMPLE_SET_IMPORT_PREFIX :string = 'materialInputs/';
export const DATA_CLASS_IMPORT_PREFIX :string = 'dataInputs/';
const DATA_CLASS_SCHEMA_KEY:string = 'exp/dataclasses';
const SAMPLE_ID_RESERVED_ERROR = 'The ' + DEFAULT_SAMPLE_FIELD_CONFIG.name + ' field name is reserved for imported or generated sample ids.';

interface Props {
    onCancel: () => void
    onComplete: (response: any) => void
    beforeFinish?: (formValues: {}) => void
    initModel: DomainDetails
    defaultSampleFieldConfig?: Partial<IDomainField>
    includeDataClasses?: boolean

    //EntityDetailsForm props
    noun?: string
    nameExpressionInfoUrl?: string
    nameExpressionPlaceholder?: string

    //DomainDesigner props
    containerTop?: number, // This sets the height of the sticky header, default is 60
    useTheme?: boolean,
    appPropertiesOnly?: boolean,
}

interface OwnState {
    model: SampleTypeModel
    parentOptions: Array<IParentOption>
    invalidDomainField: string
    submitting: boolean

    error: React.ReactNode
}

//TODO Move this somewhere it can be shared
interface PanelledPageState {
    visitedPanels?: List<number>,
    validatePanel?: number,
    firstState?: boolean,
    currentPanelIndex?: number
    activePanelIndex?: number
}

type State = OwnState & PanelledPageState

export class SampleTypeDesigner extends React.PureComponent<Props, State> {
    private _dirty = false;

    static defaultProps = {
        nameExpressionPlaceholder: 'Enter a naming pattern (e.g., S-${now:date}-${dailySampleCount})',
        defaultSampleFieldConfig: DEFAULT_SAMPLE_FIELD_CONFIG,
        noun: SAMPLE_SET_DISPLAY_TEXT,
        includeDataClasses: false,

        containerTop: STICKY_HEADER_HEIGHT,
        useTheme: false,
        appPropertiesOnly: true,
    };

    constructor(props: Props) {
        super(props);

        initQueryGridState();
        const domainDetails = this.props.initModel || DomainDetails.create();
        const model = SampleTypeModel.create(domainDetails, domainDetails.domainDesign ? domainDetails.domainDesign.name : undefined);

        this.state = {
            submitting: false,
            model,
            invalidDomainField: undefined,
            parentOptions: undefined,
            error: undefined,

            visitedPanels: List<number>(),
            validatePanel: undefined,
            firstState: true,
            currentPanelIndex: PROPERTIES_PANEL_INDEX,
            activePanelIndex: PROPERTIES_PANEL_INDEX,
        };
    }

    componentDidMount = (): void => {
        const {includeDataClasses} = this.props;
        const {model} = this.state;

        initSampleSetSelects(!model.isNew(), model.name, includeDataClasses)
            .then((results) => {
                this.initParentOptions(model, results);
            })
            .catch((error) => {
                this.onFinishFailure(resolveErrorMessage(error));
            });
    };

    formatLabel = (name:string, prefix: string, containerPath?: string): string => {
        const {includeDataClasses} = this.props;
        return includeDataClasses ?
            `${prefix}: ${name} (${containerPath})`:
            name;
    };

    initParentOptions = (model: SampleTypeModel, responses: any[]) => {
        let sets = List<IParentOption>();
        responses.forEach((results) => {
            const domain = fromJS(results.models[results.key]);

            const prefix = results.key === DATA_CLASS_SCHEMA_KEY ? DATA_CLASS_IMPORT_PREFIX : SAMPLE_SET_IMPORT_PREFIX;
            const labelPrefix = results.key === DATA_CLASS_SCHEMA_KEY ? "Data Class" : "Sample Set";

            domain.forEach(row => {
                const name = row.getIn(['Name', 'value']);
                const containerPath = row.getIn(['Folder', 'displayValue']);
                let label = NEW_SAMPLE_SET_OPTION && name === model.name ? NEW_SAMPLE_SET_OPTION.label : this.formatLabel(name, labelPrefix, containerPath);
                sets = sets.push({
                    value: prefix + name,
                    label: label,
                    schema: SCHEMAS.SAMPLE_SETS.SCHEMA,
                    query: name, // Issue 33653: query name is case-sensitive for some data inputs (sample parents)
                });
            });
        });

        if(model.isNew()) {
            sets = sets.push(NEW_SAMPLE_SET_OPTION);
        }

        this.mapParentAliasOptions(model, sets.sortBy(p => p.label, naturalSort) as List<IParentOption>);
    };

    mapParentAliasOptions = (model: SampleTypeModel, results: List<IParentOption>): void => {
        const options = results.toArray();

        let parentAliases = Map<string, IParentAlias>();

        if (model && model.importAliases)
        {
            let initialAlias = Map<string,string>(model.importAliases);
            initialAlias.forEach((val, key) => {
                const newId = SampleTypeDesigner.generateAliasId();
                parentAliases = parentAliases.set(newId, {
                    id: newId,
                    alias: key,
                    parentValue: options.find(opt => opt.value === val),
                    ignoreAliasError: false,
                    ignoreSelectError: false,
                } as IParentAlias);
            });
        }

        this.setState(() => ({
            parentOptions: options,
            model: model.merge({parentAliases}) as SampleTypeModel
        }));
    };



    //Generates a temporary id for add/delete of the import aliases
    static generateAliasId() {
        return generateId("sampleset-parent-import-alias-");
    }

    static getImportAliasesAsMap(model: SampleTypeModel): Map<string,string> {
        const {name, parentAliases } = model;


        let aliases = {};

        if (parentAliases) {
            parentAliases.map((alias: IParentAlias) => {
                const {parentValue} = alias;
                let value = parentValue.value as string;
                if (parentValue === NEW_SAMPLE_SET_OPTION)
                    value = SAMPLE_SET_IMPORT_PREFIX + name;

                aliases[alias.alias] = value;
            });
        }

        return Map<string,string>(aliases);
    };

    onFieldChange = (newModel: SampleTypeModel) => {
        this.setState(()=>({model:newModel}));
    };

    updateAliasValue = (id:string, field: string, newValue: any): IParentAlias => {
        const {model} = this.state;
        const {parentAliases} = model;
        return {
            ...parentAliases.get(id),
            isDupe: false,             //Clear error because of change
            [field]: newValue,
        } as IParentAlias;
    };

    parentAliasChange = (id:string, field: string, newValue: any) => {
        const {model} = this.state;
        const {parentAliases} = model;
        const changedAlias = this.updateAliasValue(id, field, newValue);

        const newAliases = parentAliases.set(id, changedAlias);
        const newModel = model.merge({parentAliases: newAliases}) as SampleTypeModel;
        this.setState(() => ({model: newModel}));
    };

    updateDupes = (id: string):void => {
        const {model} = this.state;
        if (!model) {
            return;
        }

        const {parentAliases} = model;
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
                    ignoreAliasError: false
                };
            }

            newAliases = newAliases.set(alias.id, changedAlias);
        });

        const newModel = model.merge({parentAliases: newAliases}) as SampleTypeModel;
        this.setState(() => ({model: newModel}));
    };

    addParentAlias = (id:string, newAlias: IParentAlias): void => {
        const {model} = this.state;
        let {parentAliases} = model;
        const newModel = model.merge({parentAliases:parentAliases.set(id, newAlias)}) as SampleTypeModel;
        this.setState(() => ({model: newModel}));
    };

    removeParentAlias = (id:string) => {
        const {model} = this.state;
        let {parentAliases} = model;
        const aliases = parentAliases.delete(id);
        const newModel = model.set('parentAliases', aliases) as SampleTypeModel;
        this.setState(() => ({model: newModel}));
    };

    //TODO REVIEW recommendations on where to put this that is shareable?
    onTogglePanel = (index: number, collapsed: boolean, callback: () => any) => {
        const { visitedPanels, currentPanelIndex } = this.state;
        const updatedVisitedPanels = getUpdatedVisitedPanelsList(visitedPanels, index);

        if (!collapsed) {
            this.setState(
                () => ({
                    visitedPanels: updatedVisitedPanels,
                    currentPanelIndex: index,
                    firstState: false,
                    validatePanel: currentPanelIndex,
                }), callback());
        } else {
            if (currentPanelIndex === index) {
                this.setState(
                    () => ({
                        visitedPanels: updatedVisitedPanels,
                        currentPanelIndex: undefined,
                        firstState: false,
                        validatePanel: currentPanelIndex,
                    }), callback());
            } else {
                callback();
            }
        }
    };

    renderDetailsPanel = () => {
        const {noun, nameExpressionInfoUrl, nameExpressionPlaceholder, useTheme } = this.props;
        const {model, parentOptions, validatePanel, currentPanelIndex, visitedPanels, firstState} = this.state;

        return (
            <>Sample Type
                <SampleTypePropertiesPanel
                    model={model}
                    parentOptions={parentOptions}
                    onParentAliasChange={this.parentAliasChange}
                    onAddParentAlias={this.addParentAlias}
                    onRemoveParentAlias={this.removeParentAlias}
                    noun={noun}
                    nameExpressionInfoUrl={nameExpressionInfoUrl}
                    nameExpressionPlaceholder={nameExpressionPlaceholder}
                    updateModel={this.onFieldChange}
                    updateDupeParentAliases={this.updateDupes}
                    useTheme={useTheme}

                    collapsible={true}
                    onToggle={(collapsed, callback) => this.onTogglePanel(PROPERTIES_PANEL_INDEX, collapsed, callback)}
                    panelStatus={model.isNew() ? getDomainPanelStatus(PROPERTIES_PANEL_INDEX, currentPanelIndex, visitedPanels, firstState) : 'COMPLETE'}
                    controlledCollapse={true}
                    initCollapsed={currentPanelIndex !== PROPERTIES_PANEL_INDEX}
                    validate={validatePanel === PROPERTIES_PANEL_INDEX}
                />
            </>
        )
    };

    domainChangeHandler = (newDomain: DomainDesign): void => {
        const {defaultSampleFieldConfig} = this.props;
        let {model, error} = this.state;
        let invalidDomainField = undefined;
        if (newDomain && newDomain.fields) {
            newDomain.fields.forEach(field => {
                if (field && field.name && field.name.toLowerCase() === defaultSampleFieldConfig.name.toLowerCase()) {
                    invalidDomainField = field.name;
                    error = SAMPLE_ID_RESERVED_ERROR;
                }
            });
        }

        //If error field cleared and error message matches then clear it.
        if (!invalidDomainField && error === SAMPLE_ID_RESERVED_ERROR) //Splice || regex better?
            error = undefined;

        this._dirty = true;
        model = model.merge({domain:newDomain}) as SampleTypeModel;
        this.setState(() => ({
            model,
            invalidDomainField,
            error,
        }));
    };

    renderDomainPanel = () => {
        const {noun, containerTop, useTheme, appPropertiesOnly} = this.props;
        const {model, currentPanelIndex, visitedPanels, firstState, validatePanel} = this.state;
        const {domain} = model;

        return (
            <>
                {domain &&
                <DomainForm
                    domain={domain}
                    onChange={this.domainChangeHandler}
                    showHeader={true}
                    helpNoun={noun.toLowerCase()}
                    useTheme={useTheme}
                    appPropertiesOnly={appPropertiesOnly}
                    containerTop={containerTop}

                    collapsible={true}
                    onToggle={(collapsed, callback) => this.onTogglePanel(DOMAIN_PANEL_INDEX, collapsed, callback)}
                    panelStatus={model.isNew() ? getDomainPanelStatus(1, currentPanelIndex, visitedPanels, firstState) : 'COMPLETE'}
                    controlledCollapse={true}
                    initCollapsed={currentPanelIndex !== DOMAIN_PANEL_INDEX}
                    validate={validatePanel === DOMAIN_PANEL_INDEX}

                />
                }
            </>
        );
    };

    isFormValid = (): boolean => {
        const {invalidDomainField} = this.state;
        return SampleTypeModel.isValid(this.state.model) && !invalidDomainField;
    };

    onFinish = (): void => {
        const { beforeFinish } = this.props;
        const { model } = this.state;

        this.setSubmitting(true);

        if (beforeFinish) {
            beforeFinish(model);
        }

        const {name, domain, description, nameExpression } = model;

        let domainDesign = domain.merge({
            name: name, //This will be the Sample Type Name
            description: description,
        }) as DomainDesign;

        const details = {
            name,
            nameExpression,
            importAliases: SampleTypeDesigner.getImportAliasesAsMap(model).toJS(),
        };

        if (model.isNew())
        {
            //Initialize a sampleId column, this is not displayed as part of the designer.
            const nameCol = {
                name: 'Name'
            };

            domainDesign = addDomainField(domainDesign, nameCol);
        }

        saveDomain(domainDesign, Domain.KINDS.SAMPLE_TYPE, details, name)
            .then((savedDomain) => {
                this.onFinishSuccess(savedDomain);
            })
            .catch((errorDomain) => {
                this.onFinishFailure(resolveErrorMessage(errorDomain));
            });

    };

    onFinishSuccess(response: any) {
        this.setSubmitting(false);
        this.props.onComplete(response);
    }

    onFinishFailure(error: React.ReactNode): void {
        this.setState(() => ({
            error,
            submitting: false
        }));
    }

    setSubmitting(submitting: boolean) {
        this.setState(() => ({
            error: undefined,
            submitting
        }));
    }

    render() {
        const { onCancel } = this.props;
        const { submitting, error, model } = this.state;
        if (!model)
            return null;

        return (
            <>
                {this.renderDetailsPanel()}
                {this.renderDomainPanel()}
                {error && <Alert>{error}</Alert>}
                <WizardNavButtons
                    containerClassName="margin-top"
                    cancel={onCancel}
                    finish={true}
                    canFinish={this.isFormValid()}
                    isFinishing={submitting}
                    nextStep={this.onFinish}
                    finishText={"Save"}
                    isFinishingText={"Saving..."}
                />
            </>
        );
    }
}
