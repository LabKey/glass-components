/*
 * Copyright (c) 2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { FC, memo, PureComponent, ReactNode } from 'react';
import { List, Map } from 'immutable';

import { Filter } from '@labkey/api';
import { SetURLSearchParams, useSearchParams } from 'react-router-dom';

import { getSelected } from '../../actions';

import { QueryModel } from '../../../public/QueryModel/QueryModel';
import { removeParameters } from '../../util/URL';

import { UserLimitSettings } from '../permissions/actions';

import { User } from '../base/models/User';
import { SecurityPolicy, SecurityRole } from '../permissions/models';
import { SCHEMAS } from '../../schemas';
import { isLoading, LoadingState } from '../../../public/LoadingState';
import { DisableableButton } from '../buttons/DisableableButton';
import { ManageDropdownButton } from '../buttons/ManageDropdownButton';
import { SelectionMenuItem } from '../menus/SelectionMenuItem';
import { GridPanel } from '../../../public/QueryModel/GridPanel';
import { LoadingSpinner } from '../base/LoadingSpinner';
import { capitalizeFirstChar } from '../../util/utils';

import { InjectedQueryModels, withQueryModels } from '../../../public/QueryModel/withQueryModels';

import { MenuItem } from '../../dropdowns';

import { Container } from '../base/models/Container';

import { isAppHomeFolder } from '../../app/utils';

import { CreateUsersModal } from './CreateUsersModal';
import { UserDetailsPanel } from './UserDetailsPanel';
import { UserActivateChangeConfirmModal } from './UserActivateChangeConfirmModal';
import { UserDeleteConfirmModal } from './UserDeleteConfirmModal';

const OMITTED_COLUMNS = [
    'phone',
    'im',
    'mobile',
    'pager',
    'groups',
    'firstName',
    'lastName',
    'description',
    'expirationDate',
];

interface OwnProps {
    // option to disable the reset password UI pieces for this component
    allowResetPassword?: boolean;
    container: Container;
    // optional array of role options, objects with id and label values (i.e. [{id: "org.labkey.api.security.roles.ReaderRole", label: "Reader (default)"}])
    // note that the createNewUser action will not use this value but it will be passed back to the onCreateComplete
    newUserRoleOptions?: any[];
    onCreateComplete: (response: any, roles: string[]) => void;
    onUsersStateChangeComplete: (response: any) => void;
    policy: SecurityPolicy;
    rolesByUniqueName?: Map<string, SecurityRole>;
    // searchParams/setSearchParams can be removed as props if we convert to an FC and use the useSearchParams hook
    searchParams: URLSearchParams;
    setSearchParams: SetURLSearchParams;
    showDetailsPanel?: boolean;
    user: User;
    userLimitSettings?: Partial<UserLimitSettings>;
}

type Props = OwnProps & InjectedQueryModels;

interface State {
    selectedUserId: number;
    // valid options are 'create', 'deactivate', 'reactivate', 'delete', undefined
    showDialog: string;
    // valid options are 'active', 'inactive', 'all'
    usersView: string;
}

export class UsersGridPanelImpl extends PureComponent<Props, State> {
    static defaultProps = {
        showDetailsPanel: true,
        allowResetPassword: true,
    };

    constructor(props: Props) {
        super(props);

        this.state = {
            // location is really only undefined when running in jest tests because the react-router context isn't
            // properly setup.
            usersView: this.getUsersView(this.props.searchParams.get('usersView')),
            showDialog: undefined,
            selectedUserId: undefined,
        };
    }

    componentDidMount(): void {
        this.setLastSelectedId();
        this.initQueryModel(this.state.usersView);
    }

    componentDidUpdate(prevProps: Readonly<Props>, prevState: Readonly<State>): void {
        this.setLastSelectedId();
        if (this.state.usersView !== prevState.usersView) {
            this.initQueryModel(this.state.usersView);
        } else if (prevProps.policy !== undefined && this.props.policy !== prevProps.policy) {
            // if we had a policy and it changed (ex. user was deactivated or deleted from detail panel), then load model
            this.reloadUsersModel();
        }

        const curUsersView = this.props.searchParams.get('usersView');

        if (curUsersView !== null) {
            this.setState({ usersView: this.getUsersView(curUsersView) });
            removeParameters(this.props.setSearchParams, 'usersView');
        }
    }

    initQueryModel = (usersView: string): void => {
        const { actions, container } = this.props;
        const baseFilters = usersView === 'all' ? [] : [Filter.create('active', usersView === 'active')];

        actions.addModel(
            {
                id: this.getUsersModelId(),
                containerPath: container.path,
                schemaQuery: SCHEMAS.CORE_TABLES.USERS,
                baseFilters,
                omittedColumns: OMITTED_COLUMNS,
                bindURL: true,
                urlPrefix: usersView, // each model needs to have its own urlPrefix for paging to work across models
                includeTotalCount: true,
                useSavedSettings: true,
            },
            true,
            true
        );
    };

    getUsersView(paramVal: string): string {
        return paramVal === 'inactive' || paramVal === 'all' ? paramVal : 'active'; // default to view active users
    }

    getUsersModelId(): string {
        return 'user-management-users-' + this.state.usersView;
    }

    getUsersModel(): QueryModel {
        return this.props.queryModels[this.getUsersModelId()];
    }

    toggleViewActive = (viewName: string): void => {
        this.setState({ usersView: viewName });
    };

    closeDialog = (): void => {
        this.toggleDialog(undefined);
    };

    toggleDialog = (name: string, requiresSelection = false): void => {
        if (requiresSelection && !this.getUsersModel().hasSelections) {
            this.setState({ showDialog: undefined });
        } else {
            this.setState({ showDialog: name });
        }
    };

    onCreateComplete = (response: any, roles: string[]): void => {
        this.closeDialog();
        this.onRowSelectionChange(this.getUsersModel(), undefined, false); // clear selected user details
        this.props.onCreateComplete(response, roles);
        this.reloadUsersModel();
    };

    reloadUsersModel(): void {
        this.props.actions.loadModel(this.getUsersModelId(), true, true);
    }

    onUsersStateChangeComplete = (response: any, resetSelection = true): void => {
        this.closeDialog();
        if (resetSelection) {
            this.onRowSelectionChange(this.getUsersModel(), undefined, false); // clear selected user details
        }
        this.props.onUsersStateChangeComplete(response);
        this.reloadUsersModel();
    };

    onRowSelectionChange = (model: QueryModel, row: any, checked: boolean): void => {
        let selectedUserId;

        if (checked) {
            // if a specific row has been selected, use that rows UserId value
            // else use the last userId in the selected array
            if (row) {
                selectedUserId = row.getIn(['UserId', 'value']);
            } else if (model.hasSelections) {
                selectedUserId = this.getLastSelectedId();
            }
        }

        this.updateSelectedUserId(selectedUserId);
    };

    updateSelectedUserId(selectedUserId: number): void {
        if (this.state.selectedUserId !== selectedUserId) {
            this.setState(() => ({ selectedUserId }));
        }
    }

    getLastSelectedId(): number {
        const selectedIds = this.getUsersModel().selections;
        return selectedIds.size > 0 ? parseInt(Array.from(selectedIds).pop()) : undefined;
    }

    setLastSelectedId(): void {
        const model = this.getUsersModel();
        if (!model || isLoading(model.selectionsLoadingState)) return;

        // if the model has already loaded selections, we can use that to reselect the last user
        // otherwise, query the server for the selection key for this model and use that response (issue 39374)
        if (model.selectionsLoadingState === LoadingState.LOADED) {
            this.updateSelectedUserId(this.getLastSelectedId());
        } else {
            // TODO: This seems wrong, we should just do nothing, eventually the selections will load and we'll be able
            //  to set the user id. If we don't automatically load selections we can manually call loadSelections via
            //  model actions.
            getSelected(
                model.id,
                false,
                model.schemaQuery,
                model.filters,
                model.containerPath,
                model.queryParameters,
                model.containerFilter
            ).then(response => {
                const selectedUserId =
                    response.selected.length > 0 ? parseInt(List.of(...response.selected).last()) : undefined;
                this.updateSelectedUserId(selectedUserId);
            });
        }
    }

    getUserLimitRemainingUsers(): number {
        const { userLimitSettings } = this.props;
        return userLimitSettings?.userLimit ? userLimitSettings.remainingUsers : undefined;
    }

    renderButtons = () => {
        const { user } = this.props;
        const { usersView } = this.state;
        const model = this.getUsersModel();

        return (
            <div className="btn-group">
                {user.hasAddUsersPermission() && (
                    <DisableableButton
                        bsStyle="success"
                        onClick={() => this.toggleDialog('create')}
                        disabledMsg={
                            this.getUserLimitRemainingUsers() === 0 ? 'User limit has been reached' : undefined
                        }
                    >
                        Create
                    </DisableableButton>
                )}
                <ManageDropdownButton showIcon={false}>
                    {user.hasManageUsersPermission() && usersView === 'active' && (
                        <SelectionMenuItem
                            text="Deactivate Users"
                            onClick={() => this.toggleDialog('deactivate', true)}
                            queryModel={model}
                            nounPlural="users"
                        />
                    )}
                    {user.hasManageUsersPermission() && (
                        <SelectionMenuItem
                            text="Delete Users"
                            onClick={() => this.toggleDialog('delete', true)}
                            queryModel={model}
                            nounPlural="users"
                        />
                    )}
                    {user.hasManageUsersPermission() && usersView === 'inactive' && (
                        <SelectionMenuItem
                            text="Reactivate Users"
                            maxSelection={this.getUserLimitRemainingUsers()}
                            maxSelectionDisabledMsg={
                                this.getUserLimitRemainingUsers() === 0 ? 'User limit has been reached' : undefined
                            }
                            onClick={() => this.toggleDialog('reactivate', true)}
                            queryModel={model}
                            nounPlural="users"
                        />
                    )}
                    {usersView !== 'active' && (
                        <MenuItem onClick={() => this.toggleViewActive('active')}>View Active Users</MenuItem>
                    )}
                    {usersView !== 'all' && (
                        <MenuItem onClick={() => this.toggleViewActive('all')}>View All Users</MenuItem>
                    )}
                    {usersView !== 'inactive' && (
                        <MenuItem onClick={() => this.toggleViewActive('inactive')}>View Inactive Users</MenuItem>
                    )}
                </ManageDropdownButton>
            </div>
        );
    };

    render(): ReactNode {
        const { newUserRoleOptions, user, showDetailsPanel, actions, userLimitSettings, container } = this.props;
        const { selectedUserId, showDialog, usersView } = this.state;
        const model = this.getUsersModel();

        // don't pass container from this.props as we want to check serverContext.container
        const isAppHome = isAppHomeFolder();

        return (
            <>
                <div className="row">
                    <div className={`col-xs-12 col-md-${showDetailsPanel ? 8 : 12}`}>
                        {!model && <LoadingSpinner />}
                        {model && (
                            <GridPanel
                                actions={actions}
                                model={model}
                                loadOnMount={false}
                                title={'Application ' + capitalizeFirstChar(usersView) + ' Users'}
                                ButtonsComponent={() => this.renderButtons()}
                                highlightLastSelectedRow
                                showChartMenu={false}
                            />
                        )}
                    </div>
                    {showDetailsPanel && (
                        <div className="col-xs-12 col-md-4">
                            <UserDetailsPanel
                                {...this.props}
                                currentUser={user}
                                userId={selectedUserId}
                                onUsersStateChangeComplete={this.onUsersStateChangeComplete}
                                showPermissionListLinks={isAppHome}
                            />
                        </div>
                    )}
                </div>
                {user.hasAddUsersPermission() && showDialog === 'create' && (
                    <CreateUsersModal
                        container={container}
                        userLimitSettings={userLimitSettings}
                        roleOptions={newUserRoleOptions}
                        onComplete={this.onCreateComplete}
                        onCancel={this.closeDialog}
                    />
                )}
                {user.hasManageUsersPermission() && (showDialog === 'reactivate' || showDialog === 'deactivate') && (
                    <UserActivateChangeConfirmModal
                        userIds={model.getSelectedIdsAsInts()}
                        reactivate={showDialog === 'reactivate'}
                        onComplete={this.onUsersStateChangeComplete}
                        onCancel={this.closeDialog}
                    />
                )}
                {user.hasManageUsersPermission() && showDialog === 'delete' && (
                    <UserDeleteConfirmModal
                        userIds={model.getSelectedIdsAsInts()}
                        onComplete={this.onUsersStateChangeComplete}
                        onCancel={this.closeDialog}
                    />
                )}
            </>
        );
    }
}

const UsersGridPanelWithModels = withQueryModels<OwnProps>(UsersGridPanelImpl);

type PanelProps = Omit<OwnProps, 'searchParams' | 'setSearchParams'>;

export const UsersGridPanel: FC<PanelProps> = memo(props => {
    const [searchParams, setSearchParams] = useSearchParams();
    return <UsersGridPanelWithModels {...props} searchParams={searchParams} setSearchParams={setSearchParams} />;
});
