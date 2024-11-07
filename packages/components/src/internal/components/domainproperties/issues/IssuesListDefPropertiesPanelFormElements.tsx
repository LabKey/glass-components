import React, { PureComponent } from 'react';

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
import { IssuesAPIWrapper } from './actions';

interface IssuesListDefBasicPropertiesInputsProps {
    model: IssuesListDefModel;
    onInputChange?: (any) => void;
    onSelect?: (name: string, value: any) => any;
}

interface AssignmentOptionsProps {
    api: IssuesAPIWrapper;
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
    api: IssuesAPIWrapper;
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
        const { api, model } = this.props;

        try {
            const coreGroups = await api.getProjectGroups();
            const relatedFolders = await api.getRelatedFolders(model.issueDefName);
            this.setState({ coreGroups, relatedFolders });
        } catch (e) {
            console.error('AssignmentOptions: failed to load initialize project groups and related folders.', e);
        }

        await this.loadUsersForGroup(this.props.model.assignedToGroup);
    };

    loadUsersForGroup = async (groupId: number): Promise<void> => {
        try {
            const coreUsers = await this.props.api.getUsersForGroup(groupId);
            this.setState({ coreUsers });
        } catch (e) {
            console.error(`AssignmentOptions: failed to load users for group ${groupId}`, e);
        }
    };

    render() {
        const { model, onSelect } = this.props;
        const { coreUsers, coreGroups, relatedFolders } = this.state;

        return (
            <div className="col-xs-12 col-md-6">
                <SectionHeading title="Assignment Options" />
                <AssignedToGroupInput
                    model={model}
                    coreGroups={coreGroups}
                    onSelect={onSelect}
                    onGroupChange={this.loadUsersForGroup}
                />
                <DefaultUserAssignmentInput model={model} coreUsers={coreUsers} onSelect={onSelect} />
                <DefaultRelatedFolderInput model={model} relatedFolders={relatedFolders} onSelect={onSelect} />
            </div>
        );
    }
}

export class RestrictedOptions extends PureComponent<RestrictedOptionsProps> {
    render() {
        const { api, model, onCheckChange, onSelect } = this.props;

        return (
            <div>
                <SectionHeading title="Restricted List Options" />
                <RestrictedIssueInput api={api} model={model} onCheckChange={onCheckChange} onSelect={onSelect} />
                <RestrictedIssueGroupInput api={api} model={model} onSelect={onSelect} />
            </div>
        );
    }
}

export class SingularItemNameInput extends PureComponent<IssuesListDefBasicPropertiesInputsProps> {
    render() {
        const { model, onInputChange } = this.props;
        const value = model.singularItemName === null ? '' : model.singularItemName;
        return (
            <div className="row margin-top">
                <div className="col-xs-3 col-lg-4">
                    <DomainFieldLabel
                        label="Singular Item Name"
                        helpTipBody={ISSUES_LIST_DEF_SINGULAR_PLURAL_TIP}
                        required={false}
                    />
                </div>

                <div className="col-xs-9 col-lg-8">
                    <input
                        className="form-control"
                        id="singularItemName"
                        type="text"
                        value={value}
                        onChange={onInputChange}
                    />
                </div>
            </div>
        );
    }
}

export class PluralItemNameInput extends PureComponent<IssuesListDefBasicPropertiesInputsProps> {
    render() {
        const { model, onInputChange } = this.props;
        const value = model.pluralItemName === null ? '' : model.pluralItemName;
        return (
            <div className="row margin-top">
                <div className="col-xs-3 col-lg-4">
                    <DomainFieldLabel
                        label="Plural Items Name"
                        helpTipBody={ISSUES_LIST_DEF_SINGULAR_PLURAL_TIP}
                        required={false}
                    />
                </div>

                <div className="col-xs-9 col-lg-8">
                    <input
                        className="form-control"
                        id="pluralItemName"
                        type="text"
                        value={value}
                        onChange={onInputChange}
                    />
                </div>
            </div>
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
            <div className="row margin-top">
                <div className="col-xs-3 col-lg-4">
                    <DomainFieldLabel
                        label="Comment Sort Direction"
                        helpTipBody={ISSUES_LIST_DEF_SORT_DIRECTION_TIP}
                        required={false}
                    />
                </div>

                <div className="col-xs-9 col-lg-8">
                    <SelectInput
                        name="commentSortDirection"
                        options={sortDirectionOptions}
                        inputClass="col-xs-12"
                        valueKey="id"
                        onChange={this.onChange}
                        value={model.commentSortDirection ?? 'ASC'}
                        clearable={false}
                    />
                </div>
            </div>
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
            <div className="row margin-top">
                <div className="col-xs-3 col-lg-4">
                    <DomainFieldLabel
                        label="Populate 'Assigned To' Field from"
                        helpTipBody={ISSUES_LIST_GROUP_ASSIGN_TIP}
                        required={false}
                    />
                </div>
                <div className="col-xs-9 col-lg-8">
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
                </div>
            </div>
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
            <div className="row margin-top">
                <div className="col-xs-3 col-lg-4">
                    <DomainFieldLabel
                        label="Default User Assignment"
                        helpTipBody={ISSUES_LIST_USER_ASSIGN_TIP}
                        required={false}
                    />
                </div>
                <div className="col-xs-9 col-lg-8">
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
                </div>
            </div>
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
            <div className="row margin-top">
                <div className="col-xs-3 col-lg-4">
                    <DomainFieldLabel
                        label="Default Related Issue Folder"
                        helpTipBody={ISSUES_LIST_RELATED_FOLDER_TIP}
                        required={false}
                    />
                </div>
                <div className="col-xs-9 col-lg-8">
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
                </div>
            </div>
        );
    }
}

export class RestrictedIssueInput extends PureComponent<RestrictedOptionsProps> {
    render() {
        const { model, onCheckChange } = this.props;

        return (
            <div className="row margin-top">
                <div className="col-xs-3 col-lg-4">
                    <DomainFieldLabel label="Restrict Issue List" helpTipBody={ISSUES_LIST_RESTRICTED_TRACKER_TIP} />
                </div>
                <div className="col-xs-9 col-lg-8">
                    <input
                        type="checkbox"
                        name="restrictedIssueList"
                        checked={model.restrictedIssueList}
                        onChange={onCheckChange}
                    />
                </div>
            </div>
        );
    }
}

export class RestrictedIssueGroupInput extends PureComponent<RestrictedOptionsProps> {
    state: Readonly<RestrictedOptionsState> = { coreGroups: undefined };

    componentDidMount = async (): Promise<void> => {
        try {
            const coreGroups = await this.props.api.getProjectGroups();
            this.setState({ coreGroups });
        } catch (e) {
            console.error('RestrictedOptions: failed to load initialize project groups', e);
        }
    };

    onChange = (name: string, formValue: any, selected: Principal, ref: any): void => {
        const groupId = selected ? selected.userId : undefined;
        this.props.onSelect(name, groupId);
    };

    render() {
        const { model } = this.props;
        const { coreGroups } = this.state;

        return (
            <div className="row margin-top">
                <div className="col-xs-3 col-lg-4">
                    <DomainFieldLabel
                        label="Additional Group with Access"
                        helpTipBody={ISSUES_LIST_RESTRICTED_GROUP_TIP}
                    />
                </div>
                <div className="col-xs-9 col-lg-8">
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
                </div>
            </div>
        );
    }
}
