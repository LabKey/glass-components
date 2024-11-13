/*
 * Copyright (c) 2018-2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { FC } from 'react';
import { Map } from 'immutable';
import { getServerContext, Utils } from '@labkey/api';

import classNames from 'classnames';

import { Modal } from '../../Modal';
import { caseInsensitive } from '../../util/utils';
import { LoadingSpinner } from '../base/LoadingSpinner';
import { formatDate, getDateFNSDateTimeFormat, parseDate } from '../../util/Date';
import { SecurityPolicy, SecurityRole } from '../permissions/models';
import { EffectiveRolesList } from '../permissions/EffectiveRolesList';

import { GroupsList } from '../permissions/GroupsList';
import { AppURL, createProductUrlFromPartsWithContainer } from '../../url/AppURL';
import { User } from '../base/models/User';
import { getDefaultAPIWrapper } from '../../APIWrapper';
import { SecurityAPIWrapper } from '../security/APIWrapper';
import { Container } from '../base/models/Container';
import { getRolesByUniqueName } from '../permissions/actions';

import { getCurrentAppProperties, getPrimaryAppProperties } from '../../app/utils';

import { UserResetPasswordConfirmModal } from './UserResetPasswordConfirmModal';
import { UserDeleteConfirmModal } from './UserDeleteConfirmModal';
import { UserActivateChangeConfirmModal } from './UserActivateChangeConfirmModal';

interface UserDetailRowProps {
    label: string;
    value: React.ReactNode;
}

const UserDetailRow: FC<UserDetailRowProps> = ({ label, value }) => {
    return (
        <div className="row">
            <div className="col-xs-4 principal-detail-label">{label}</div>
            <div className="col-xs-8 principal-detail-value">{value}</div>
        </div>
    );
};

interface Props {
    allowDelete?: boolean;
    allowResetPassword?: boolean;
    api?: SecurityAPIWrapper;
    container?: Container;
    currentUser: User;
    displayName?: string;
    isSelf?: boolean;
    onUsersStateChangeComplete?: (response: any, resetSelection: boolean) => void;
    policy?: SecurityPolicy;
    rolesByUniqueName?: Map<string, SecurityRole>;
    rootPolicy?: SecurityPolicy;
    showGroupListLinks?: boolean;
    showPermissionListLinks?: boolean;
    toggleDetailsModal?: () => void;
    userId: number;
}

interface State {
    loading: boolean;
    policy?: SecurityPolicy;
    rolesByUniqueName?: Map<string, SecurityRole>;
    showDialog: string;
    userProperties: Record<string, any>;
}

export class UserDetailsPanel extends React.PureComponent<Props, State> {
    static defaultProps = {
        allowDelete: true,
        allowResetPassword: true,
        api: getDefaultAPIWrapper().security,
        showGroupListLinks: true,
        showPermissionListLinks: true,
    };

    constructor(props: Props) {
        super(props);

        this.state = {
            loading: false,
            policy: undefined,
            rolesByUniqueName: undefined,
            showDialog: undefined,
            userProperties: undefined,
        };
    }

    componentDidMount(): void {
        this.loadUserDetails();
        this.loadPolicyAndRoles();
    }

    componentDidUpdate(prevProps: Readonly<Props>): void {
        if (this.props.userId !== prevProps.userId) {
            this.loadUserDetails();
        }
    }

    loadPolicyAndRoles = async (): Promise<void> => {
        const { policy, rolesByUniqueName, container, currentUser, api } = this.props;

        if (currentUser.isAdmin && !policy && !rolesByUniqueName && container) {
            try {
                const policy_ = await api.fetchPolicy(container.id);
                const roles = await api.fetchRoles();
                this.setState({ policy: policy_, rolesByUniqueName: getRolesByUniqueName(roles) });
            } catch (e) {
                console.error(e);
            }
        }
    };

    loadUserDetails = async (): Promise<void> => {
        const { userId, isSelf, api, displayName } = this.props;

        if (!userId) {
            this.setState({ userProperties: undefined });
            return;
        }

        this.setState({ loading: true });

        try {
            if (isSelf) {
                const response = await api.getUserProperties(userId);
                this.setState({ userProperties: response.props });
            } else {
                const response = await api.getUserPropertiesForOther(userId);
                if (!Utils.isEmptyObj(response)) {
                    this.setState({ userProperties: response });
                } else {
                    this.setState({ userProperties: { UserId: userId, DisplayName: displayName } });
                }
            }
        } catch (e) {
            this.setState({ userProperties: undefined });
        }

        this.setState({ loading: false });
    };

    toggleDialog = (name: string): void => {
        this.setState({ showDialog: name });
    };

    onUsersStateChangeComplete = (response: any, isDelete: boolean): void => {
        this.toggleDialog(undefined); // close dialog
        if (!isDelete) {
            this.loadUserDetails(); // reload to pickup new user state
        }

        this.props.onUsersStateChangeComplete?.(response, isDelete);
    };

    renderUserProp(label: string, prop: string, formatDate_ = false) {
        let value = caseInsensitive(this.state.userProperties, prop);
        if (formatDate_ && value) {
            const date = parseDate(value);
            if (date) {
                value = formatDate(date, undefined, getDateFNSDateTimeFormat());
            }
        } else if (value === undefined) {
            value = 'unknown';
        }

        return <UserDetailRow label={label} value={value} />;
    }

    renderButtons() {
        const { allowDelete, allowResetPassword } = this.props;
        const { userProperties } = this.state;

        if (!userProperties) return null;

        const isActive = caseInsensitive(userProperties, 'active');

        return (
            <>
                <hr className="principal-hr" />
                {allowResetPassword && isActive && (
                    <button className="btn btn-default" onClick={() => this.toggleDialog('reset')} type="button">
                        Reset Password
                    </button>
                )}
                {allowDelete && (
                    <button
                        className="pull-right btn btn-default"
                        style={{ marginLeft: '10px' }}
                        onClick={() => this.toggleDialog('delete')}
                        type="button"
                    >
                        Delete
                    </button>
                )}
                <button
                    className="pull-right btn btn-default"
                    style={{ marginLeft: '10px' }}
                    onClick={() => this.toggleDialog(isActive ? 'deactivate' : 'reactivate')}
                    type="button"
                >
                    {isActive ? 'Deactivate' : 'Reactivate'}
                </button>
            </>
        );
    }

    renderBody() {
        const {
            showGroupListLinks,
            showPermissionListLinks,
            currentUser,
            policy,
            rolesByUniqueName,
            rootPolicy,
            userId,
        } = this.props;
        const { loading, userProperties } = this.state;

        if (loading) {
            return <LoadingSpinner />;
        }

        if (userProperties) {
            const description = caseInsensitive(userProperties, 'description');
            let name = caseInsensitive(userProperties, 'firstName') ?? '';
            if (name) {
                name += ' ';
            }
            name += caseInsensitive(userProperties, 'lastName') ?? '';
            const hasPassword = caseInsensitive(userProperties, 'hasPassword');

            return (
                <>
                    {!!name && <UserDetailRow label="Name" value={name} />}
                    {this.renderUserProp('Email', 'email')}

                    {description && <>{this.renderUserProp('Description', 'description')}</>}

                    <hr className="principal-hr" />
                    {this.renderUserProp('Last Login', 'lastLogin', true)}
                    {this.renderUserProp('Created', 'created', true)}

                    <hr className="principal-hr" />
                    {this.renderUserProp('User ID', 'userId')}
                    {!!hasPassword && <UserDetailRow label="Has Password" value={hasPassword.toString()} />}

                    <EffectiveRolesList
                        currentUser={currentUser}
                        policy={policy ?? this.state.policy}
                        rolesByUniqueName={rolesByUniqueName ?? this.state.rolesByUniqueName}
                        rootPolicy={rootPolicy}
                        showLinks={showPermissionListLinks}
                        userId={userId}
                    />
                    <GroupsList groups={caseInsensitive(userProperties, 'groups')} showLinks={showGroupListLinks} />
                </>
            );
        }

        return <div>No user selected.</div>;
    }

    renderHeader() {
        const { loading, userProperties } = this.state;
        if (loading || !userProperties) return 'User Details';

        const displayName = caseInsensitive(userProperties, 'displayName');
        const active = caseInsensitive(userProperties, 'active');

        return (
            <>
                <span>{displayName}</span>
                {active !== undefined && (
                    <span
                        className={classNames('margin-left status-pill', {
                            active,
                            inactive: !active,
                        })}
                    >
                        {active ? 'Active' : 'Inactive'}
                    </span>
                )}
            </>
        );
    }

    render() {
        const { userId, allowDelete, allowResetPassword, toggleDetailsModal, onUsersStateChangeComplete } = this.props;
        const { showDialog, userProperties } = this.state;
        const { user, project } = getServerContext();
        const isSelf = userId === user.id;
        const currentProductId = getCurrentAppProperties()?.productId;
        const targetProductId = getPrimaryAppProperties()?.productId;
        // We do not currently support user management in sub folders, so we create the management URL for the project
        // container.
        const manageUrl = createProductUrlFromPartsWithContainer(
            targetProductId,
            currentProductId,
            project.path,
            { usersView: 'all', 'all.UserId~eq': userId },
            'admin',
            'users'
        );

        if (toggleDetailsModal) {
            const footer = (
                <a
                    className="pull-right btn btn-default"
                    href={manageUrl instanceof AppURL ? manageUrl.toHref() : manageUrl}
                >
                    Manage
                </a>
            );
            return (
                <Modal
                    onCancel={toggleDetailsModal}
                    className="user-detail-modal"
                    footer={user.isAdmin ? footer : undefined}
                    title={this.renderHeader()}
                >
                    {this.renderBody()}
                </Modal>
            );
        }

        return (
            <div className="panel panel-default user-details-panel">
                <div className="panel-heading">{this.renderHeader()}</div>
                <div className="panel-body">
                    {this.renderBody()}
                    {!isSelf && onUsersStateChangeComplete && this.renderButtons()}
                    {allowResetPassword && showDialog === 'reset' && (
                        <UserResetPasswordConfirmModal
                            email={caseInsensitive(userProperties, 'email')}
                            userId={caseInsensitive(userProperties, 'userId')}
                            hasLogin={Utils.isString(caseInsensitive(userProperties, 'lastLogin'))}
                            onComplete={response => this.onUsersStateChangeComplete(response, false)}
                            onCancel={() => this.toggleDialog(undefined)}
                        />
                    )}
                    {(showDialog === 'reactivate' || showDialog === 'deactivate') && (
                        <UserActivateChangeConfirmModal
                            userIds={[userId]}
                            reactivate={showDialog === 'reactivate'}
                            onComplete={response => this.onUsersStateChangeComplete(response, false)}
                            onCancel={() => this.toggleDialog(undefined)}
                        />
                    )}
                    {allowDelete && showDialog === 'delete' && (
                        <UserDeleteConfirmModal
                            userIds={[userId]}
                            onComplete={response => this.onUsersStateChangeComplete(response, true)}
                            onCancel={() => this.toggleDialog(undefined)}
                        />
                    )}
                </div>
            </div>
        );
    }
}
