import React from 'react';
import {OrderedMap} from "immutable";
import {SampleTypeModel} from './models';
import {EntityDetailsForm,} from "../entities/EntityDetailsForm";
import {IParentOption} from "../../entities/models";
import {IParentAlias} from "./models";
import {getFormNameFromId,} from "../entities/actions";
import {Col, Row} from "react-bootstrap";
import {AddEntityButton, generateId, helpLinkNode, SCHEMAS} from "../../..";
import { PARENT_ALIAS_HELPER_TEXT, SAMPLE_SET_DISPLAY_TEXT } from "../../../constants";
import { DERIVE_SAMPLES_ALIAS_TOPIC, DEFINE_SAMPLE_TYPE_TOPIC } from "../../../util/helpLinks";
import {SampleSetParentAliasRow} from "../../samples/SampleSetParentAliasRow";
import { InjectedDomainPropertiesPanelCollapseProps, withDomainPropertiesPanelCollapse } from "../DomainPropertiesPanelCollapse";
import { BasePropertiesPanel, BasePropertiesPanelProps } from "../BasePropertiesPanel";
import { HelpTopicURL } from "../HelpTopicURL";

const PROPERTIES_HEADER_ID = 'sample-type-properties-hdr';

//Splitting these out to clarify where they end-up
interface OwnProps {
    model: SampleTypeModel
    parentOptions: Array<IParentOption>
    updateModel: (newModel: SampleTypeModel) => void
    onParentAliasChange: (id:string, field: string, newValue: any) => void
    onAddParentAlias: (id:string, newAlias: IParentAlias ) => void
    onRemoveParentAlias: (id:string) => void
    updateDupeParentAliases?: (id:string) => void
    appPropertiesOnly?: boolean
    headerText?: string
    helpTopic?: string
    includeDataClasses?: boolean
    useSeparateDataClasses?: boolean
    sampleAliasCaption?: string
    sampleTypeCaption?: string
    dataClassAliasCaption?: string
    dataClassTypeCaption?: string
    dataClassParentageLabel?: string
}

//Splitting these out to clarify where they end-up
interface EntityProps {
    nameExpressionInfoUrl?: string
    nameExpressionPlaceholder?: string
    nounSingular?: string
    nounPlural?: string
}

interface State {
    isValid: boolean
}

type Props = OwnProps & EntityProps & BasePropertiesPanelProps;

const sampleSeAliasFilterFn = (alias: IParentAlias) => {
    return alias.parentValue && alias.parentValue.schema === SCHEMAS.SAMPLE_SETS.SCHEMA;
};

const sampleSetOptionFilterFn = (option: IParentOption) => {
    return option && option.schema === SCHEMAS.SAMPLE_SETS.SCHEMA;
};

const dataClassAliasFilterFn = (alias: IParentAlias) => {
    return alias.parentValue && alias.parentValue.schema === SCHEMAS.DATA_CLASSES.SCHEMA;
};

const dataClassOptionFilterFn = (option: IParentOption) => {
    return option && option.schema === SCHEMAS.DATA_CLASSES.SCHEMA;
};

class SampleTypePropertiesPanelImpl extends React.PureComponent<Props & InjectedDomainPropertiesPanelCollapseProps, State> {

    static defaultProps = {
        nounSingular: SAMPLE_SET_DISPLAY_TEXT,
        nounPlural: SAMPLE_SET_DISPLAY_TEXT + 's',
        nameExpressionInfoUrl: '',
        nameExpressionPlaceholder: 'S-\${now:date}-\${dailySampleCount}',
        appPropertiesOnly: false,
        helpTopic: DEFINE_SAMPLE_TYPE_TOPIC,
        sampleAliasCaption: 'Sample Alias',
        sampleTypeCaption: 'Sample Type',
        dataClassAliasCaption: 'DataClass Alias',
        dataClassTypeCaption: 'Dataclass',
        dataClassParentageLabel: 'dataclass'
    };

    constructor(props) {
        super(props);

        this.state = {
            isValid: true
        };
    }

    updateValidStatus = (newModel?: SampleTypeModel) => {
        const { model, updateModel } = this.props;
        const updatedModel = newModel || model;
        const isValid = updatedModel && updatedModel.hasValidProperties();
        this.setState(() => ({isValid}),
            () => {
                // Issue 39918: only consider the model changed if there is a newModel param
                if (newModel) {
                    updateModel(updatedModel)
                }
            });
    };

    onFormChange = (evt: any): void => {
        const {model } = this.props;
        const id = evt.target.id;
        const value = evt.target.value;
        const newModel = model.set(getFormNameFromId(id), value) as SampleTypeModel;
        this.updateValidStatus(newModel);
    };

    parentAliasChanges = (id:string, field: string, newValue: any): void => {
        const {onParentAliasChange,} = this.props;
        onParentAliasChange(id, field, newValue);
    };

    addParentAlias = (schema: string): void => {
        const {onAddParentAlias} = this.props;

        //Generates a temporary id for add/delete of the import aliases
        const newId = generateId("sampletype-parent-import-alias-");

        const newParentAlias = {
            id: newId,
            alias:'',
            parentValue: {schema},
            ignoreAliasError: true,
            ignoreSelectError: true,
            isDupe: false,
        };

        onAddParentAlias(newId, newParentAlias);
    };

    renderAddEntityHelper = (parentageLabel?: string):any => {
        const msg = parentageLabel ? PARENT_ALIAS_HELPER_TEXT.replace("parentage", parentageLabel) : PARENT_ALIAS_HELPER_TEXT;
        return (
            <>
                <span>
                    <p>{msg}</p>
                    <p>{helpLinkNode(DERIVE_SAMPLES_ALIAS_TOPIC, "More info")}</p>
                </span>
            </>
        );
    };

    renderParentAliases = (includeSampleSet: boolean, includeDataClass: boolean) => {
        const {model, parentOptions, updateDupeParentAliases, sampleAliasCaption, sampleTypeCaption, dataClassAliasCaption, dataClassTypeCaption, dataClassParentageLabel } = this.props;
        const {parentAliases} = model;

        if (!parentAliases || !parentOptions)
            return [];

        let filteredParentAliases = OrderedMap<string, IParentAlias>();
        let filteredParentOptions = Array<IParentOption>();
        let aliasCaption;
        let parentTypeCaption;

        let helpMsg = undefined;
        if (includeSampleSet && includeDataClass) {
            filteredParentAliases = parentAliases;
            filteredParentOptions = parentOptions;
        }
        else if (includeSampleSet) {
            filteredParentAliases = parentAliases.filter(sampleSeAliasFilterFn) as OrderedMap<string, IParentAlias>;
            filteredParentOptions = parentOptions.filter(sampleSetOptionFilterFn);
            if (sampleAliasCaption)
                aliasCaption = sampleAliasCaption;
            if (sampleTypeCaption)
                parentTypeCaption = sampleTypeCaption;
        }
        else if (includeDataClass) {
            filteredParentAliases = parentAliases.filter(dataClassAliasFilterFn) as OrderedMap<string, IParentAlias>;
            filteredParentOptions = parentOptions.filter(dataClassOptionFilterFn);
            if (dataClassAliasCaption)
                aliasCaption = dataClassAliasCaption;
            if (dataClassTypeCaption)
                parentTypeCaption = dataClassTypeCaption;

            if (dataClassParentageLabel)
                helpMsg = PARENT_ALIAS_HELPER_TEXT.replace("parentage", dataClassParentageLabel)
        }

        return filteredParentAliases.valueSeq().map((alias:IParentAlias) => {
            return (
                <SampleSetParentAliasRow
                    key={alias.id}
                    id={alias.id}
                    parentAlias={alias}
                    parentOptions={filteredParentOptions}
                    onAliasChange={this.parentAliasChanges}
                    onRemove={this.removeParentAlias}
                    updateDupeParentAliases={updateDupeParentAliases}
                    aliasCaption={aliasCaption}
                    parentTypeCaption={parentTypeCaption}
                    helpMsg={helpMsg}
                />
            );
        });
    };

    removeParentAlias = (index: string): void => {
        const {onRemoveParentAlias} = this.props;
        onRemoveParentAlias(index);
        this.updateValidStatus();
    };

    containsDataClassOptions = () => {
        const { parentOptions } = this.props;
        if (!parentOptions || parentOptions.length === 0)
            return false;

        return parentOptions.filter(dataClassOptionFilterFn).length > 0;
    };

    render = () => {
        const { model, parentOptions, nameExpressionInfoUrl, nameExpressionPlaceholder, nounSingular, nounPlural, headerText, helpTopic, includeDataClasses,
            useSeparateDataClasses, dataClassAliasCaption, sampleAliasCaption, dataClassParentageLabel } = this.props;
        const { isValid } = this.state;

        const showDataClass = includeDataClasses && useSeparateDataClasses && this.containsDataClassOptions();
        return (
            <BasePropertiesPanel
                {...this.props}
                headerId={PROPERTIES_HEADER_ID}
                title={'Sample Type Properties'}
                titlePrefix={model.name}
                updateValidStatus={this.updateValidStatus}
                isValid={isValid}
            >
                <Row className={'margin-bottom'}>
                    {headerText &&
                        <Col xs={9}>
                            <div className={'entity-form--headerhelp'}>{headerText}</div>
                        </Col>
                    }
                    <Col xs={headerText ? 3 : 12}>
                        <HelpTopicURL helpTopic={helpTopic} nounPlural={nounPlural}/>
                    </Col>
                </Row>
                <EntityDetailsForm
                    noun={nounSingular}
                    onFormChange={this.onFormChange}
                    data={model}
                    nameReadOnly={model.nameReadOnly}
                    nameExpressionInfoUrl={nameExpressionInfoUrl}
                    nameExpressionPlaceholder={nameExpressionPlaceholder}
                />
                {this.renderParentAliases(true, includeDataClasses && !useSeparateDataClasses)}
                {parentOptions &&
                <Row>
                    <Col xs={2}>
                    </Col>
                    <Col xs={10}>
                        <span>
                            <AddEntityButton entity={includeDataClasses && useSeparateDataClasses ? sampleAliasCaption : 'Parent Alias'}
                                             onClick={() => this.addParentAlias(SCHEMAS.SAMPLE_SETS.SCHEMA)}
                                             helperBody={this.renderAddEntityHelper}/>
                        </span>
                    </Col>
                </Row>
                }
                {showDataClass && this.renderParentAliases(false, true)}
                {showDataClass &&
                <Row>
                    <Col xs={2}>
                    </Col>
                    <Col xs={10}>
                        <span>
                            <AddEntityButton entity={dataClassAliasCaption} onClick={() => this.addParentAlias(SCHEMAS.DATA_CLASSES.SCHEMA)}
                                             helperBody={() => this.renderAddEntityHelper(dataClassParentageLabel)}/>
                        </span>
                    </Col>
                </Row>
                }
            </BasePropertiesPanel>
        )
    }
}

export const SampleTypePropertiesPanel = withDomainPropertiesPanelCollapse<Props>(SampleTypePropertiesPanelImpl);
