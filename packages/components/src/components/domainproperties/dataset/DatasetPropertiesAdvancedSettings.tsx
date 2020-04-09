import React from 'react';
import {Button, Checkbox, Col, FormControl, Modal, Row} from 'react-bootstrap';
import {helpLinkNode, SelectInput} from '../../..';
import {DatasetAdvancedSettingsForm, DatasetModel} from "./models";
import {fetchCohorts, fetchVisitDateColumns, getHelpTip} from "./actions";
import "../../../theme/dataset.scss";
import {DomainFieldLabel} from "../DomainFieldLabel";
import {SectionHeading} from "../SectionHeading";
import {Option} from "react-select";
import {DATASET_PROPERTIES_TOPIC} from "../../../util/helpLinks";

interface DatasetSettingsSelectProps {
    name: string;
    label: string;
    helpTip?: JSX.Element;
    selectedValue?: any;
    selectOptions: any;
    onSelectChange: (name, formValue, selected) => void;
    labelKey?: string;
    valueKey?: string;
    disabled?: boolean;
    clearable?: boolean;
}

export class DatasetSettingsSelect extends React.PureComponent<DatasetSettingsSelectProps> {
    render() {
        const {
            name,
            label,
            helpTip,
            selectedValue,
            selectOptions,
            onSelectChange,
            labelKey,
            valueKey,
            disabled,
            clearable
        } = this.props;

        return(
            <Row className={'margin-top'}>

                <Col xs={5} >
                    <DomainFieldLabel
                        label={label}
                        helpTipBody={() => helpTip}
                    />
                </Col>

                <Col xs={7} >
                    <SelectInput
                        onChange={onSelectChange}
                        value={selectedValue}
                        options={selectOptions}
                        inputClass=""
                        containerClass=""
                        labelClass=""
                        formsy={false}
                        multiple={false}
                        required={false}
                        name={name}
                        labelKey={labelKey}
                        valueKey={valueKey}
                        disabled={disabled}
                        clearable={clearable}
                    />
                </Col>
            </Row>
        );
    }
}

interface DatasetSettingsInputProps {
    name: string;
    label: string;
    helpTip: JSX.Element;
    value?: any;
    placeholder?: string;
    onValueChange: (evt: any) => any;
    disabled: boolean;
    required: boolean;
    showInAdvancedSettings: boolean;
}

export class DatasetSettingsInput extends React.PureComponent<DatasetSettingsInputProps> {
    render() {
        const {
            name,
            label,
            helpTip,
            value,
            placeholder,
            onValueChange,
            disabled,
            showInAdvancedSettings,
            required
        } = this.props;

        return (
            <Row className={'margin-top'}>
                <Col xs={4} >
                    <DomainFieldLabel
                        label={label}
                        required={required}
                        helpTipBody={() => helpTip}
                    />
                </Col>

                { showInAdvancedSettings && < Col xs={1}/> }

                <Col xs={7} >
                    <FormControl
                        id={name}
                        type="text"
                        placeholder={placeholder}
                        value={value}
                        onChange={onValueChange}
                        disabled={disabled}
                    />
                </Col>

                { !showInAdvancedSettings && < Col xs={1}/> }
            </Row>
        );
    }
}

interface AdvancedSettingsProps {
    model: DatasetModel;
    title: string;
    applyAdvancedProperties: (datasetAdvancedSettingsForm: DatasetAdvancedSettingsForm) => void;
    showDataspace: boolean;
    showVisitDate: boolean;
}

interface AdvancedSettingsState extends DatasetAdvancedSettingsForm {
    modalOpen?: boolean;
    availableCohorts?: Option | Array<Option>;
    visitDateColumns?: Option | Array<Option>;
    dataSharing?: string;
}

export class AdvancedSettings extends React.PureComponent<AdvancedSettingsProps, AdvancedSettingsState> {
    constructor(props) {
        super(props);
        const initialState = this.getInitialState();

        this.state = {
            modalOpen: false,
            ...initialState,
        } as AdvancedSettingsState;
    }

    componentDidMount() {
        const { model } = this.props;

        fetchCohorts()
            .then((data) => {
                this.setState(() => ({
                    availableCohorts: data.cohorts
                }));
            });

        fetchVisitDateColumns()
            .then((data) => {
                this.setState(() => ({
                    visitDateColumns: data.visitDateColumns
                }));
            })
    }

    getInitialState = () => {
        const model = this.props.model;

        return {
            datasetId: model.datasetId,
            tag: model.tag,
            showInOverview: model.showInOverview,
            cohortId: model.cohortId,
            visitDatePropertyName: model.visitDatePropertyName,
            dataSharing: model.dataSharing
        };
    };

    toggleModal = (isModalOpen: boolean): void => {
        this.setState({ modalOpen: isModalOpen });

        // If modal is re-opened, reset unsaved values
        if (isModalOpen) {
            this.setState(this.getInitialState());
        }
    };

    onCheckboxChange = (name, checked) => {
        this.setState(() => ({ showInOverview: !checked }));
    };

    onInputChange = e => {
        const id = e.target.id;
        let value = e.target.value;

        if (e.target.type === "checkbox") {
            value = e.target.checked;
        }

        this.setState({ [id]: value });
    };

    onSelectChange = (name, formValue, selected): void => {
        this.setState({ [name]: formValue });
    };

    getHelpTipElement(field: string) : JSX.Element {
        return <> {getHelpTip(field)} </> as JSX.Element;
    }

    applyChanges = (): void => {
      const {
          datasetId,
          cohortId,
          visitDatePropertyName,
          showInOverview,
          tag,
          dataSharing
      } = this.state;

      const datasetAdvancedSettingsForm = {showInOverview, datasetId, cohortId, visitDatePropertyName, tag, dataSharing};

      const { applyAdvancedProperties } = this.props;

      applyAdvancedProperties(datasetAdvancedSettingsForm as DatasetAdvancedSettingsForm);
      this.toggleModal(false);
    };

    render() {
        const {
            modalOpen,
            datasetId,
            availableCohorts,
            cohortId,
            tag,
            showInOverview,
            visitDatePropertyName,
            visitDateColumns,
            dataSharing
        } = this.state;

        const {
            model,
            title,
            showDataspace,
            showVisitDate
        } = this.props;

        return (
            <>
                <Button className="domain-field-float-right" onClick={() => this.toggleModal(true)}>
                    {title}
                </Button>

                <Modal show={modalOpen} onHide={() => this.toggleModal(false)}>
                    <Modal.Header closeButton>
                        <Modal.Title> Advanced Dataset Settings </Modal.Title>
                    </Modal.Header>

                    <Modal.Body>

                        <SectionHeading title="Miscellaneous Options" />

                        <div className='margin-top'>
                            <Checkbox
                                checked={showInOverview}
                                onChange={this.onInputChange}
                                id={"showInOverview"}
                            >
                                Show dataset in overview
                            </Checkbox>
                        </div>

                        <DatasetSettingsInput
                            name="datasetId"
                            label="Dataset ID"
                            helpTip={this.getHelpTipElement("datasetId")}
                            value={datasetId}
                            placeholder="Auto Assign"
                            disabled={!model.isNew()}
                            onValueChange={this.onInputChange}
                            showInAdvancedSettings={true}
                            required={true}
                        />
                        {
                            showVisitDate &&
                            <DatasetSettingsSelect
                                name="visitDatePropertyName"
                                label="Visit Date Column"
                                helpTip={this.getHelpTipElement("visitDateColumn")}
                                selectOptions={visitDateColumns}
                                selectedValue={visitDatePropertyName}
                                onSelectChange={this.onSelectChange}
                            />
                        }

                        <DatasetSettingsSelect
                            name="cohortId"
                            label="Cohort Association"
                            helpTip={this.getHelpTipElement("cohort")}
                            selectOptions={availableCohorts}
                            selectedValue={cohortId}
                            onSelectChange={this.onSelectChange}
                        />

                        <DatasetSettingsInput
                            name="tag"
                            label="Tag"
                            helpTip={this.getHelpTipElement("tag")}
                            value={tag}
                            disabled={false}
                            onValueChange={this.onInputChange}
                            showInAdvancedSettings={true}
                            required={false}
                        />

                        {
                            showDataspace &&
                            <>
                                <div className='margin-top'>
                                    <SectionHeading title="Dataspace Project Options" />
                                </div>

                                <DatasetSettingsSelect
                                    name="dataSharing"
                                    label="Share demographic data"
                                    helpTip={this.getHelpTipElement("dataspace")}
                                    selectOptions={[{label: 'No', value: 'NONE'}, {label: 'Share by Participants', value: 'PTID'}]}
                                    selectedValue={dataSharing}
                                    onSelectChange={this.onSelectChange}
                                 />
                            </>
                        }

                    </Modal.Body>

                    <Modal.Footer>
                        <>
                            <Button
                                onClick={() => this.toggleModal(false)}
                                className='domain-adv-footer domain-adv-cancel-btn'
                            >
                                Cancel
                            </Button>

                            { helpLinkNode(DATASET_PROPERTIES_TOPIC, "Learn more about using datasets", 'domain-adv-footer domain-adv-link') }

                            <Button
                                onClick={this.applyChanges}
                                bsStyle={'success'}
                                className='domain-adv-footer domain-adv-apply-btn'
                            >
                                Apply
                            </Button>
                        </>
                    </Modal.Footer>
                </Modal>
            </>
        );
    }
}
