import React from 'reactn';
import { Button, Panel } from 'react-bootstrap';
import {
    AddEntityButton,
    Alert,
    capitalizeFirstChar,
    EntityDataType,
    getActionErrorMessage,
    getQueryGridModel,
    LoadingSpinner,
    Progress,
    QueryGridModel,
    resolveErrorMessage,
    updateRows
} from '../..';
import { DetailPanelHeader } from '../forms/detail/DetailPanelHeader';
import {
    getEntityTypeOptions,
    getInitialParentChoices,
    getUpdatedRowForParentChanges,
    invalidateParentModels,
    parentValuesDiffer
} from './actions';
import { List } from 'immutable';
import { EntityChoice, IEntityTypeOption } from './models';
import { SingleParentEntityPanel } from './SingleParentEntityPanel';
import { DELIMITER } from '../forms/input/SelectInput';
import { AuditBehaviorTypes } from '@labkey/api';

interface Props {
    canUpdate: boolean
    childName: string
    childNounSingular: string
    childModel: QueryGridModel
    onUpdate?: () => void
    parentDataType: EntityDataType
    title: string
    cancelText?: string
    submitText?: string
    auditBehavior?: AuditBehaviorTypes
}

interface State {
    editing: boolean
    error: React.ReactNode
    loading: boolean
    parentTypeOptions: List<IEntityTypeOption>
    submitting: boolean
    originalParents: List<EntityChoice>
    currentParents: List<EntityChoice>
}

export class ParentEntityEditPanel extends React.Component<Props, State> {

    static defaultProps = {
        cancelText: "Cancel",
        submitText: "Save",
    };

    constructor(props: Props) {
        super();

        this.state = {
            editing: false,
            error: undefined,
            loading: true,
            parentTypeOptions: undefined,
            submitting: false,
            originalParents: undefined,
            currentParents: undefined
        };
    }

    componentWillMount() {
        this.init();
    }

    componentWillUnmount() {
        invalidateParentModels(this.state.originalParents, this.state.currentParents, this.props.parentDataType);
    }

    init()  {
        const { parentDataType } = this.props;
        const { typeListingSchemaQuery, instanceSchemaName, filterArray } = parentDataType;

        getEntityTypeOptions(typeListingSchemaQuery, instanceSchemaName, filterArray)
            .then((optionsMap) => {
                const parentTypeOptions = optionsMap.get(typeListingSchemaQuery.queryName);
                const originalParents = getInitialParentChoices(parentTypeOptions, parentDataType, this.getChildModel());
                let currentParents = originalParents.reduce((list, parent) => {
                    return list.push({...parent})
                }, List<EntityChoice>());

                this.setState(() => ({
                    loading: false,
                    parentTypeOptions,
                    originalParents,
                    currentParents,
                }));
            }
        ).catch((reason) => {
            this.setState(() => ({
                error: getActionErrorMessage("Unable to load " + parentDataType.descriptionSingular + " data.", parentDataType.descriptionPlural, true)
            }))
        })
    }

    getChildModel() {
        return getQueryGridModel(this.props.childModel.getId());
    }

    hasParents() : boolean {
        return this.state.currentParents && !this.state.currentParents.isEmpty()
    }

    toggleEdit = () => {
        this.setState((state) => ({editing: !state.editing}))
    };

    changeEntityType = (fieldName: string, formValue: any, selectedOption: IEntityTypeOption, index): void  => {
        this.setState((state) => {
            const updatedParents = state.currentParents.set(index, {type: selectedOption, value: undefined, ids: undefined});
            return {
                currentParents: updatedParents,
            }
        });
    };

    onParentValueChange = (name: string, value: string | Array<any>, index: number) => {
        this.updateParentValue(value, index, false)
    };

    onInitialParentValue = (value: string, selectedValues: List<any>, index: number) => {
        this.updateParentValue(value, index, true);
    };

    updateParentValue(value: string | Array<any>, index: number, updateOriginal: boolean) {
        this.setState((state) => {
            let newChoice = state.currentParents.get(index);
            newChoice.value = Array.isArray(value) ? value.join(DELIMITER) : value;
            return {
                currentParents: state.currentParents.set(index, newChoice),
                originalParents: updateOriginal ? state.originalParents.set(index, {...newChoice}) : state.originalParents,
            }
        });
    }

    onCancel = () => {
        this.setState((state) => ({
            currentParents: state.originalParents,
            editing: false
        }))
    };

    onSubmit = (values) => {
        if (!this.canSubmit())
            return;

        this.setState(() => ({submitting: true}));

        const { auditBehavior, parentDataType, onUpdate } = this.props;
        const { currentParents, originalParents } = this.state;
        const childModel = this.getChildModel();

        const queryInfo = childModel.queryInfo;
        const schemaQuery = queryInfo.schemaQuery;

        return updateRows({
            schemaQuery,
            rows: [getUpdatedRowForParentChanges(parentDataType, originalParents, currentParents, childModel)],
            auditBehavior
        }).then(() => {
            this.setState(() => ({
                submitting: false,
                editing: false
            }));

            invalidateParentModels(this.state.originalParents, this.state.currentParents, this.props.parentDataType);

            if (onUpdate) {
                onUpdate();
            }
        }).catch((error) => {
            console.error(error);
            this.setState(() => ({
                submitting: false,
                error: resolveErrorMessage(error, 'data', undefined, 'update')
            }));
        });
    };

    canSubmit() {
        return parentValuesDiffer(this.state.originalParents, this.state.currentParents)
    }

    renderProgress() {
        const { submitting } = this.state;
        const parentCount = this.state.currentParents
            .reduce((count, parent) => {
                    const values = parent.value ? parent.value.split(",") : [];
                    return count + values.length;
                },
                0);
        return (
            <Progress
                estimate={parentCount * 200}
                modal={true}
                title={"Updating " + this.props.parentDataType.nounPlural}
                toggle={parentCount > 2 && submitting}
            />
        )
    }

    renderEditControls() {
        const { cancelText, submitText } = this.props;
        const { submitting } = this.state;

        return (
            <div className="full-width bottom-spacing">
                <Button
                    className="pull-left"
                    onClick={this.onCancel}
                >
                    {cancelText}
                </Button>
                <Button
                    className="pull-right"
                    bsStyle={"success"}
                    type="submit"
                    disabled={submitting || !this.canSubmit()}
                    onClick={this.onSubmit}
                >
                    {submitText}
                </Button>
            </div>
        )
    }


    getParentTypeOptions(currentIndex: number) : List<IEntityTypeOption> {
        const { currentParents, parentTypeOptions } = this.state;
        // include the current parent type as a choice, but not the others already chosen
        let toRemove = List<string>();
        currentParents.forEach((parent, index) => {
            if (index !== currentIndex && parent.type) {
                toRemove = toRemove.push(parent.type.label);
            }
        });
        return parentTypeOptions.filter((option) => (!toRemove.contains(option.label))).toList();
    }

    onRemoveParentType = (index: number) => {
        this.setState((state) => {
            return {
                currentParents: state.currentParents.delete(index),
            }
        });
    };

    renderSingleParentPanels() {
        const { parentDataType } = this.props;

        return this.state.currentParents.map((choice, index) => {
            let key = choice.type ? choice.type.label + '-' + index : 'unknown-' + index;
            return (
                <div key={key}>
                    {this.state.editing && <hr/>}
                    <SingleParentEntityPanel
                        key={key}
                        parentDataType={parentDataType}
                        parentTypeOptions={this.getParentTypeOptions(index)}
                        parentTypeQueryName={choice.type ? choice.type.label : undefined}
                        parentLSIDs={choice.ids}
                        index={index}
                        editing={this.state.editing}
                        chosenValue={choice.value}
                        onChangeParentType={this.changeEntityType}
                        onChangeParentValue={this.onParentValueChange}
                        onInitialParentValue={this.onInitialParentValue}
                        onRemoveParentType={this.onRemoveParentType}
                    />
                </div>
            )

        }).toArray();
    }

    renderParentData() {
        const { parentDataType, childNounSingular } = this.props;
        if (this.hasParents()) {
            return this.renderSingleParentPanels();
        }
        else {
            return (
                <div key={1}>
                    <hr/>
                    <SingleParentEntityPanel
                       editing={this.state.editing}
                       parentTypeOptions={this.state.parentTypeOptions}
                       parentDataType={parentDataType}
                       childNounSingular={childNounSingular}
                       index={0}
                       onChangeParentType={this.changeEntityType}
                       onChangeParentValue={this.onParentValueChange}
                       onInitialParentValue={this.onInitialParentValue}
                    />
                </div>
            )
        }
    }

    onAddParent = () => {
        this.setState((state) => ({
            currentParents: state.currentParents.push({type: undefined, value: undefined, ids: undefined})
        }));
    };

    renderAddParentButton() {
        const { parentTypeOptions } = this.state;
        if (!parentTypeOptions || parentTypeOptions.size === 0)
            return null;
        else {
            const { parentDataType } = this.props;
            const { currentParents } = this.state;

            const disabled = parentTypeOptions.size <= currentParents.size;
            const title = disabled ? 'Only ' + parentTypeOptions.size + ' ' + (parentTypeOptions.size === 1 ? parentDataType.descriptionSingular : parentDataType.descriptionPlural) + ' available.' : undefined;

            return (
                <AddEntityButton
                    containerClass={'top-spacing'}
                    onClick={this.onAddParent}
                    title={title}
                    disabled={disabled}
                    entity={this.props.parentDataType.nounSingular}
                />
            )
        }

    }

    render() {
        const { parentDataType, title, canUpdate, childName } = this.props;
        const { editing, error, loading } = this.state;

        const heading = (
            <DetailPanelHeader
                useEditIcon={true}
                isEditable={!loading && canUpdate}
                canUpdate={canUpdate}
                editing={editing}
                title={title}
                onClickFn={this.toggleEdit}
            />
        );

        return (
            <>
                <Panel bsStyle={editing ? "info" : "default"}>
                    <Panel.Heading>{heading}</Panel.Heading>
                    <Panel.Body>
                        {error && <Alert>{error}</Alert>}
                        <div className={'bottom-spacing'}><b>{capitalizeFirstChar(parentDataType.nounPlural)} for {childName}</b></div>
                        {loading ? <LoadingSpinner/> : this.renderParentData()}
                        {editing && this.renderAddParentButton()}
                    </Panel.Body>
                </Panel>
                {editing && this.renderEditControls()}
                {editing && this.renderProgress()}
            </>
        )
    }
}
