/*
 * Copyright (c) 2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { PureComponent, ReactNode } from 'react';
import { List, Map } from 'immutable';
import { Col, MenuItem, Row } from 'react-bootstrap';
import { ActionURL, Filter } from '@labkey/api';

import {
    capitalizeFirstChar,
    DisableableButton,
    GridPanel,
    isLoading,
    LoadingSpinner,
    LoadingState,
    ManageDropdownButton,
    SCHEMAS,
    SecurityPolicy,
    SecurityRole,
    SelectionMenuItem,
    User,
} from '../../..';

import { getLocation, getRouteFromLocationHash, replaceParameter } from '../../util/URL';
import { getBrowserHistory } from '../../util/global';

import { getSelected } from '../../actions';

import { QueryModel } from '../../../public/QueryModel/QueryModel';

import { InjectedQueryModels, withQueryModels } from '../../../public/QueryModel/withQueryModels';

import { UserLimitSettings } from '../permissions/actions';

import { UserDeleteConfirmModal } from './UserDeleteConfirmModal';
import { UserActivateChangeConfirmModal } from './UserActivateChangeConfirmModal';
import { UserDetailsPanel } from './UserDetailsPanel';
import { CreateUsersModal } from './CreateUsersModal';

const OMITTED_COLUMNS = [
    'phone',
    'im',
    'mobile',
    'pager',
    'groups',
    'hasPassword',
    'firstName',
    'lastName',
    'description',
    'expirationDate',
];

interface OwnProps {
    user: User;
    onCreateComplete: (response: any, roles: string[]) => any;
    onUsersStateChangeComplete: (response: any) => any;
    policy: SecurityPolicy;
    rolesByUniqueName?: Map<string, SecurityRole>;
    showDetailsPanel?: boolean;
    userLimitSettings?: UserLimitSettings;

    // optional array of role options, objects with id and label values (i.e. [{id: "org.labkey.api.security.roles.ReaderRole", label: "Reader (default)"}])
    // note that the createNewUser action will not use this value but it will be passed back to the onCreateComplete
    newUserRoleOptions?: any[];

    // option to disable the reset password UI pieces for this component
    allowResetPassword?: boolean;
}

type Props = OwnProps & InjectedQueryModels;

interface State {
    usersView: string; // valid options are 'active', 'inactive', 'all'
    showDialog: string; // valid options are 'create', 'deactivate', 'reactivate', 'delete', undefined
    selectedUserId: number;
    unlisten: any;
}

// exported for jest testing
export class UsersGridPanelImpl extends PureComponent<Props, State> {
    static defaultProps = {
        showDetailsPanel: true,
        allowResetPassword: true,
    };

    constructor(props: Props) {
        super(props);

        // add a URL listener specifically for the usersView param so that we can change the GridPanel data accordingly without a route change
        const unlisten = getBrowserHistory().listen(location => {
            if (getRouteFromLocationHash(location.hash) === '#/admin/users') {
                // if the usersView param is defined and has changed, set state to trigger re-render with proper QueryModel
                const paramValue = ActionURL.getParameters(location.hash).usersView;
                const usersView = this.getUsersView(paramValue);
                if (paramValue && this.state.usersView !== usersView) {
                    this.setState(() => ({
                        usersView,
                        selectedUserId: undefined, // clear selected user anytime we change views
                    }));

                    replaceParameter(getLocation(), 'usersView', undefined);
                }
            }
        });

        this.state = {
            usersView: this.getUsersView(getLocation().query.get('usersView')),
            showDialog: undefined,
            selectedUserId: undefined,
            unlisten,
        };
    }

    componentDidMount() {
        this.setLastSelectedId();
        this.initQueryModel(this.state.usersView);
    }

    componentDidUpdate(prevProps: Readonly<Props>, prevState: Readonly<State>, snapshot?: any) {
        this.setLastSelectedId();
        if (this.state.usersView !== prevState.usersView) {
            this.initQueryModel(this.state.usersView);
        } else if (this.props.policy !== prevProps.policy) {
            this.reloadUsersModel();
        }
    }

    componentWillUnmount() {
        const { unlisten } = this.state;
        if (unlisten) {
            unlisten();
        }
    }

    initQueryModel(usersView: string) {
        const { actions, user } = this.props;
        const baseFilters = usersView === 'all' ? [] : [Filter.create('active', usersView === 'active')];

        actions.addModel(
            {
                id: this.getUsersModelId(),
                schemaQuery: SCHEMAS.CORE_TABLES.USERS,
                baseFilters,
                omittedColumns: OMITTED_COLUMNS,
                bindURL: true,
                urlPrefix: usersView, // each model needs to have its own urlPrefix for paging to work across models
            },
            true,
            true
        );
    }

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
        this.setState(() => ({ usersView: viewName }));
    };

    closeDialog = (): void => {
        this.toggleDialog(undefined);
    };

    toggleDialog = (name: string, requiresSelection = false): void => {
        if (requiresSelection && !this.getUsersModel().hasSelections) {
            this.setState(() => ({ showDialog: undefined }));
        } else {
            this.setState(() => ({ showDialog: name }));
        }
    };

    onCreateComplete = (response: any, roles: string[]): void => {
        this.closeDialog();
        this.onRowSelectionChange(this.getUsersModel(), undefined, false); // clear selected user details
        this.props.onCreateComplete(response, roles);
        this.reloadUsersModel();
    };

    reloadUsersModel(): void {
        this.props.actions.loadModel(this.getUsersModelId(), true);
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
            getSelected(
                model.id,
                model.schemaName,
                model.queryName,
                List.of(...model.filters),
                model.containerPath,
                model.queryParameters
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
                <ManageDropdownButton id="users-manage-btn">
                    {user.hasManageUsersPermission() && usersView === 'active' && (
                        <SelectionMenuItem
                            id="deactivate-users-menu-item"
                            text="Deactivate Users"
                            onClick={() => this.toggleDialog('deactivate', true)}
                            queryModel={model}
                            nounPlural="users"
                        />
                    )}
                    {user.hasManageUsersPermission() && (
                        <SelectionMenuItem
                            id="delete-users-menu-item"
                            text="Delete Users"
                            onClick={() => this.toggleDialog('delete', true)}
                            queryModel={model}
                            nounPlural="users"
                        />
                    )}
                    {user.hasManageUsersPermission() && usersView === 'inactive' && (
                        <SelectionMenuItem
                            id="reactivate-users-menu-item"
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
                        <MenuItem id="viewactive-users-menu-item" onClick={() => this.toggleViewActive('active')}>
                            View Active Users
                        </MenuItem>
                    )}
                    {usersView !== 'all' && (
                        <MenuItem id="viewall-users-menu-item" onClick={() => this.toggleViewActive('all')}>
                            View All Users
                        </MenuItem>
                    )}
                    {usersView !== 'inactive' && (
                        <MenuItem id="viewinactive-users-menu-item" onClick={() => this.toggleViewActive('inactive')}>
                            View Inactive Users
                        </MenuItem>
                    )}
                </ManageDropdownButton>
            </div>
        );
    };

    render(): ReactNode {
        const { newUserRoleOptions, user, showDetailsPanel, actions, userLimitSettings } = this.props;
        const { selectedUserId, showDialog, usersView } = this.state;
        const model = this.getUsersModel();

        return (
            <>
                <Row>
                    <Col xs={12} md={showDetailsPanel ? 8 : 12}>
                        {!model && <LoadingSpinner />}
                        {model && (
                            <GridPanel
                                actions={actions}
                                model={model}
                                loadOnMount={false}
                                title={capitalizeFirstChar(usersView) + ' Users'}
                                ButtonsComponent={() => this.renderButtons()}
                                highlightLastSelectedRow
                                hideEmptyViewMenu={false}
                            />
                        )}
                    </Col>
                    {showDetailsPanel && (
                        <Col xs={12} md={4}>
                            <UserDetailsPanel
                                {...this.props}
                                userId={selectedUserId}
                                onUsersStateChangeComplete={this.onUsersStateChangeComplete}
                            />
                        </Col>
                    )}
                </Row>
                <CreateUsersModal
                    show={user.hasAddUsersPermission() && showDialog === 'create'}
                    userLimitSettings={userLimitSettings}
                    roleOptions={newUserRoleOptions}
                    onComplete={this.onCreateComplete}
                    onCancel={this.closeDialog}
                />
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

export const UsersGridPanel = withQueryModels(UsersGridPanelImpl);
