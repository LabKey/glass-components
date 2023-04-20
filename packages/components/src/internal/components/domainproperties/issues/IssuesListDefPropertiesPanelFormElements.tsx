import React, { PureComponent } from 'react';
import { Col, FormControl, Row } from 'react-bootstrap';

import { List } from 'immutable';

import { SectionHeading } from '../SectionHeading';

import { DomainFieldLabel } from '../DomainFieldLabel';

import { Principal } from '../../permissions/models';

import { LoadingSpinner } from '../../base/LoadingSpinner';

import { SelectInput } from '../../forms/input/SelectInput';

import { IssuesListDefModel, IssuesRelatedFolder } from './models';
import {
    ISSUES_LIST_DEF_SINGULAR_PLURAL_TIP,
    ISSUES_LIST_DEF_SORT_DIRECTION_TIP,
    ISSUES_LIST_GROUP_ASSIGN_TIP,
    ISSUES_LIST_RELATED_FOLDER_TIP,
    ISSUES_LIST_RESTRICTED_GROUP_TIP,
    ISSUES_LIST_RESTRICTED_TRACKER_TIP,
    ISSUES_LIST_USER_ASSIGN_TIP,
} from './constants';
import { getProjectGroups, getRelatedFolders, getUsersForGroup } from './actions';

interface IssuesListDefBasicPropertiesInputsProps {
    model: IssuesListDefModel;
    onInputChange?: (any) => void;
    onSelect?: (name: string, value: any) => any;
}

interface AssignmentOptionsProps {
    model: IssuesListDefModel;
    onSelect: (name: string, value: any) => any;
}

interface AssignmentOptionsState {
    coreGroups?: List<Principal>;
    coreUsers?: List<Principal>;
    relatedFolders?: List<IssuesRelatedFolder>;
}

// For AssignedToGroupInput & DefaultUserAssignmentInput components
interface AssignmentOptionsInputProps {
    coreGroups?: List<Principal>;
    coreUsers?: List<Principal>;
    model: IssuesListDefModel;
    onGroupChange?: (groupId: number) => any;
    onSelect: (name: string, value: any) => any;
    relatedFolders?: List<IssuesRelatedFolder>;
}

interface RestrictedOptionsProps {
    coreGroups?: List<Principal>;
    model: IssuesListDefModel;
    onCheckChange?: (any) => void;
    onSelect: (name: string, value: any) => any;
}

interface RestrictedOptionsState {
    coreGroups?: List<Principal>;
}

export class BasicPropertiesFields extends PureComponent<IssuesListDefBasicPropertiesInputsProps> {
    render() {
        const { model, onInputChange, onSelect } = this.props;
        return (
            <div>
                <SectionHeading title="Basic Properties" />
                <CommentSortDirectionDropDown model={model} onSelect={onSelect} />
                <SingularItemNameInput model={model} onInputChange={onInputChange} />
                <PluralItemNameInput model={model} onInputChange={onInputChange} />
            </div>
        );
    }
}

export class AssignmentOptions extends PureComponent<AssignmentOptionsProps, AssignmentOptionsState> {
    state: Readonly<AssignmentOptionsState> = {
        coreGroups: undefined,
        coreUsers: undefined,
        relatedFolders: undefined,
    };

    componentDidMount = async (): Promise<void> => {
        try {
            const coreGroups = await getProjectGroups();
            const relatedFolders = await getRelatedFolders(this.props.model.issueDefName);
            this.setState({ coreGroups, relatedFolders });
        } catch (e) {
            console.error('AssignmentOptions: failed to load initialize project groups and related folders.', e);
        }

        await this.loadUsersForGroup(this.props.model.assignedToGroup);
    };

    loadUsersForGroup = async (groupId: number): Promise<void> => {
        try {
            const coreUsers = await getUsersForGroup(groupId);
            this.setState({ coreUsers });
        } catch (e) {
            console.error(`AssignmentOptions: failed to load users for group ${groupId}`, e);
        }
    };

    render() {
        const { model, onSelect } = this.props;
        const { coreUsers, coreGroups, relatedFolders } = this.state;

        return (
            <Col xs={12} md={6}>
                <SectionHeading title="Assignment Options" />
                <AssignedToGroupInput
                    model={model}
                    coreGroups={coreGroups}
                    onSelect={onSelect}
                    onGroupChange={this.loadUsersForGroup}
                />
                <DefaultUserAssignmentInput model={model} coreUsers={coreUsers} onSelect={onSelect} />
                <DefaultRelatedFolderInput model={model} relatedFolders={relatedFolders} onSelect={onSelect} />
            </Col>
        );
    }
}

export class RestrictedOptions extends PureComponent<RestrictedOptionsProps, RestrictedOptionsState> {
    state: Readonly<RestrictedOptionsState> = {coreGroups: undefined,};

    componentDidMount = async (): Promise<void> => {
        try {
            const coreGroups = await getProjectGroups();
            this.setState({ coreGroups });
        } catch (e) {
            console.error('RestrictedOptions: failed to load initialize project groups', e);
        }
    };

    render() {
        const { model, onCheckChange, onSelect } = this.props;
        const { coreGroups } = this.state;

        return (
            <div>
                <SectionHeading title="Restricted List Options" />
                <RestrictedIssueInput
                    model={model}
                    onCheckChange={onCheckChange}
                    onSelect={onSelect}
                />
                <RestrictedIssueGroupInput
                    model={model}
                    coreGroups={coreGroups}
                    onSelect={onSelect}
                />
            </div>
        );
    }
}

export class SingularItemNameInput extends PureComponent<IssuesListDefBasicPropertiesInputsProps> {
    render() {
        const { model, onInputChange } = this.props;
        const value = model.singularItemName === null ? '' : model.singularItemName;
        return (
            <Row className="margin-top">
                <Col xs={3} lg={4}>
                    <DomainFieldLabel
                        label="Singular Item Name"
                        helpTipBody={ISSUES_LIST_DEF_SINGULAR_PLURAL_TIP}
                        required={false}
                    />
                </Col>

                <Col xs={9} lg={8}>
                    <FormControl id="singularItemName" type="text" value={value} onChange={onInputChange} />
                </Col>
            </Row>
        );
    }
}

export class PluralItemNameInput extends PureComponent<IssuesListDefBasicPropertiesInputsProps> {
    render() {
        const { model, onInputChange } = this.props;
        const value = model.pluralItemName === null ? '' : model.pluralItemName;
        return (
            <Row className="margin-top">
                <Col xs={3} lg={4}>
                    <DomainFieldLabel
                        label="Plural Items Name"
                        helpTipBody={ISSUES_LIST_DEF_SINGULAR_PLURAL_TIP}
                        required={false}
                    />
                </Col>

                <Col xs={9} lg={8}>
                    <FormControl id="pluralItemName" type="text" value={value} onChange={onInputChange} />
                </Col>
            </Row>
        );
    }
}

export class CommentSortDirectionDropDown extends PureComponent<IssuesListDefBasicPropertiesInputsProps> {
    onChange = (name: string, formValue: any, selected: any): void => {
        if (selected) {
            this.props.onSelect?.(name, selected.id);
        }
    };

    render() {
        const { model } = this.props;

        const sortDirectionOptions = [
            { label: 'Oldest first', id: 'ASC' },
            { label: 'Newest first', id: 'DESC' },
        ];

        return (
            <Row className="margin-top">
                <Col xs={3} lg={4}>
                    <DomainFieldLabel
                        label="Comment Sort Direction"
                        helpTipBody={ISSUES_LIST_DEF_SORT_DIRECTION_TIP}
                        required={false}
                    />
                </Col>

                <Col xs={9} lg={8}>
                    <SelectInput
                        name="commentSortDirection"
                        options={sortDirectionOptions}
                        inputClass="col-xs-12"
                        valueKey="id"
                        onChange={this.onChange}
                        value={model.commentSortDirection ?? 'ASC'}
                        clearable={false}
                    />
                </Col>
            </Row>
        );
    }
}

export class AssignedToGroupInput extends PureComponent<AssignmentOptionsInputProps, any> {
    onChange = (name: string, formValue: any, selected: Principal, ref: any): void => {
        const groupId = selected ? selected.userId : undefined;
        this.props.onGroupChange(groupId);
        this.props.onSelect(name, groupId);
    };

    render() {
        const { model, coreGroups } = this.props;

        return (
            <Row className="margin-top">
                <Col xs={3} lg={4}>
                    <DomainFieldLabel
                        label="Populate ‘Assigned To’ Field from"
                        helpTipBody={ISSUES_LIST_GROUP_ASSIGN_TIP}
                        required={false}
                    />
                </Col>
                <Col xs={9} lg={8}>
                    {!coreGroups ? (
                        <LoadingSpinner />
                    ) : (
                        <SelectInput
                            name="assignedToGroup"
                            options={coreGroups.toArray()}
                            placeholder="All Project Users"
                            inputClass="col-xs-12"
                            valueKey="userId"
                            labelKey="displayName"
                            onChange={this.onChange}
                            value={model.assignedToGroup ? model.assignedToGroup : undefined}
                        />
                    )}
                </Col>
            </Row>
        );
    }
}

export class DefaultUserAssignmentInput extends PureComponent<AssignmentOptionsInputProps, any> {
    onChange = (name: string, formValue: any, selected: Principal, ref: any): any => {
        this.props.onSelect(name, selected ? selected.userId : undefined);
    };

    render() {
        const { model, coreUsers } = this.props;

        return (
            <Row className="margin-top">
                <Col xs={3} lg={4}>
                    <DomainFieldLabel
                        label="Default User Assignment"
                        helpTipBody={ISSUES_LIST_USER_ASSIGN_TIP}
                        required={false}
                    />
                </Col>
                <Col xs={9} lg={8}>
                    {!coreUsers ? (
                        <LoadingSpinner />
                    ) : (
                        <SelectInput
                            name="assignedToUser"
                            options={coreUsers?.toArray()}
                            placeholder="Unassigned"
                            inputClass="col-xs-12"
                            valueKey="userId"
                            labelKey="displayName"
                            onChange={this.onChange}
                            value={model.assignedToUser}
                        />
                    )}
                </Col>
            </Row>
        );
    }
}

export class DefaultRelatedFolderInput extends PureComponent<AssignmentOptionsInputProps, any> {
    onChange = (name: string, formValue: any, selected: IssuesRelatedFolder, ref: any): any => {
        this.props.onSelect(name, selected ? selected.key : undefined);
    };

    render() {
        const { model, relatedFolders } = this.props;

        return (
            <Row className="margin-top">
                <Col xs={3} lg={4}>
                    <DomainFieldLabel
                        label="Default Related Issue Folder"
                        helpTipBody={ISSUES_LIST_RELATED_FOLDER_TIP}
                        required={false}
                    />
                </Col>
                <Col xs={9} lg={8}>
                    {!relatedFolders ? (
                        <LoadingSpinner />
                    ) : (
                        <SelectInput
                            name="relatedFolderName"
                            options={relatedFolders?.toArray()}
                            placeholder="Unassigned"
                            inputClass="col-xs-12"
                            valueKey="key"
                            labelKey="displayName"
                            onChange={this.onChange}
                            value={model.relatedFolderName}
                        />
                    )}
                </Col>
            </Row>
        );
    }
}

export class RestrictedIssueInput extends PureComponent<RestrictedOptionsProps> {
    render() {
        const { model, onCheckChange} = this.props;

        return (
            <Row className="margin-top">
                <Col xs={3} lg={4}>
                    <DomainFieldLabel
                        label="Restrict Issue List"
                        helpTipBody={ISSUES_LIST_RESTRICTED_TRACKER_TIP}
                    />
                </Col>
                <Col xs={9} lg={8}>
                    <input
                        type="checkbox"
                        name="restrictedIssueList"
                        checked={model.restrictedIssueList}
                        onChange={onCheckChange}
                    />
                </Col>
            </Row>
        );
    }
}

export class RestrictedIssueGroupInput extends PureComponent<RestrictedOptionsProps> {
    onChange = (name: string, formValue: any, selected: Principal, ref: any): void => {
        const groupId = selected ? selected.userId : undefined;
        this.props.onSelect(name, groupId);
    };

    render() {
        const { model, coreGroups } = this.props;

        return (
            <Row className="margin-top">
                <Col xs={3} lg={4}>
                    <DomainFieldLabel
                        label="Additional Group with Access"
                        helpTipBody={ISSUES_LIST_RESTRICTED_GROUP_TIP}
                    />
                </Col>
                <Col xs={9} lg={8}>
                    {!coreGroups ? (
                        <LoadingSpinner />
                    ) : (
                        <SelectInput
                            name="restrictedIssueListGroup"
                            options={coreGroups?.toArray()}
                            placeholder="Unassigned"
                            inputClass="col-xs-12"
                            valueKey="userId"
                            labelKey="displayName"
                            onChange={this.onChange}
                            value={model.restrictedIssueListGroup}
                            disabled={!model.restrictedIssueList}
                        />
                    )}
                </Col>
            </Row>
        );
    }
}
