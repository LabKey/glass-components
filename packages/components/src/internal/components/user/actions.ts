import { OrderedMap } from 'immutable';
import { Ajax, PermissionRoles, PermissionTypes, Utils } from '@labkey/api';

import { buildURL } from '../../url/AppURL';
import { hasAllPermissions, hasAnyPermissions, User } from '../base/models/User';
import { caseInsensitive } from '../../util/utils';

import { APPLICATION_SECURITY_ROLES, SITE_SECURITY_ROLES } from '../administration/constants';

import { formatDate, parseDate } from '../../util/Date';

import { ChangePasswordModel } from './models';

export function getUserProperties(userId: number): Promise<any> {
    return new Promise((resolve, reject) => {
        return Ajax.request({
            url: buildURL(
                'user',
                'getUserProps.api',
                { userId },
                {
                    container: '/', // always use root container for this API call
                }
            ),
            success: Utils.getCallbackWrapper(response => {
                resolve(response);
            }),
            failure: Utils.getCallbackWrapper(response => {
                reject(response);
            }),
        });
    });
}

export function getUserPermissionsDisplay(user: User): string[] {
    const permissions = [];

    if (user.isAdmin) {
        permissions.push('Administrator');
    } else {
        if (hasAllPermissions(user, [PermissionTypes.DesignDataClass])) {
            permissions.push('Data Class Designer');
        }
        if (hasAllPermissions(user, [PermissionTypes.DesignSampleSet])) {
            permissions.push('Sample Set Designer');
        }
        if (hasAllPermissions(user, [PermissionTypes.DesignAssay])) {
            permissions.push('Assay Designer');
        }
        permissions.push(user.canUpdate ? 'Editor' : user.canInsert ? 'Author' : 'Reader');
    }

    return permissions;
}

export function getUserRoleDisplay(user: User): string {
    if (user.isAppAdmin()) {
        return SITE_SECURITY_ROLES.get(PermissionRoles.ApplicationAdmin);
    }

    if (hasAllPermissions(user, [PermissionTypes.Admin])) {
        return 'Administrator';
    }

    if (user.hasUpdatePermission()) {
        return APPLICATION_SECURITY_ROLES.get(PermissionRoles.Editor);
    }

    if (hasAllPermissions(user, [PermissionTypes.EditStorageData])) {
        return 'Storage Editor';
    }

    if (hasAllPermissions(user, [PermissionTypes.DesignStorage])) {
        return 'Storage Designer';
    }

    if (hasAllPermissions(user, [PermissionTypes.Read])) {
        if (
            hasAnyPermissions(user, [
                PermissionTypes.DesignAssay,
                PermissionTypes.DesignDataClass,
                PermissionTypes.DesignSampleSet,
            ])
        )
            return 'Data Type Designer';

        return APPLICATION_SECURITY_ROLES.get(PermissionRoles.Reader);
    }

    return 'Unknown Role';
}

export function getUserLastLogin(userProperties: Record<string, any>, dateFormat?: string): string {
    const lastLogin = caseInsensitive(userProperties, 'lastlogin');
    if (!lastLogin) return undefined;

    const parsedDate = parseDate(lastLogin);
    return parsedDate ? formatDate(parsedDate, undefined, dateFormat) : undefined;
}

export function getUserDetailsRowData(user: User, data: OrderedMap<string, any>, avatar: File): FormData {
    const formData = new FormData();
    const row = { UserId: user.id, ...data.toJS() };

    Object.keys(row).forEach(key => {
        let value = row[key];

        // need to convert booleans to string for save
        if (value !== null && Utils.isBoolean(value)) {
            value = value.toString();
        }

        // need to remove email from the posted data since that is not an updatable value for this action
        if (key.toLowerCase() === 'email') {
            value = undefined;
        }

        if (value !== undefined) {
            formData.append(key, value);
        }
    });

    // add in the avatar file, if a new one was added (note that we do want to let through the value of "null" since
    // that is used to indicate to the server to delete the current avatar file)
    if (avatar !== undefined) {
        formData.append('Avatar', avatar);
    }

    return formData;
}

export function changePassword(model: ChangePasswordModel): Promise<any> {
    return new Promise((resolve, reject) => {
        Ajax.request({
            url: buildURL('login', 'changePasswordApi.api'),
            method: 'POST',
            params: model.toJS(),
            success: Utils.getCallbackWrapper(response => {
                resolve(response);
            }),
            failure: Utils.getCallbackWrapper(response => {
                reject(response);
            }),
        });
    });
}

export interface PasswordRuleInfo {
    full: string;
    shouldShowPasswordGuidance: boolean;
    summary: string;
}

export function getPasswordRuleInfo(): Promise<PasswordRuleInfo> {
    return new Promise((resolve, reject) => {
        return Ajax.request({
            url: buildURL('login', 'getPasswordRulesInfo.api'),
            method: 'GET',
            success: Utils.getCallbackWrapper(response => {
                resolve(response);
            }),
            failure: Utils.getCallbackWrapper(response => {
                reject(response);
            }),
        });
    });
}

export function updateUsersActiveState(userIds: number[], reactivate: boolean): Promise<any> {
    return updateUsersState(userIds, false, reactivate);
}

export function deleteUsers(userIds: number[]): Promise<any> {
    return updateUsersState(userIds, true, false);
}

function updateUsersState(userIds: number[], isDelete: boolean, isActivate: boolean): Promise<any> {
    return new Promise((resolve, reject) => {
        Ajax.request({
            url: buildURL('user', 'updateUsersStateApi.api'),
            method: 'POST',
            params: {
                userId: userIds,
                delete: isDelete,
                activate: isActivate,
            },
            success: Utils.getCallbackWrapper(response => {
                resolve(response);
            }),
            failure: Utils.getCallbackWrapper(response => {
                reject(response);
            }),
        });
    });
}

export type ResetPasswordResponse = {
    resetPassword: boolean;
    userId: number;
};

export function resetPassword(userId: number): Promise<ResetPasswordResponse> {
    return new Promise((resolve, reject) => {
        Ajax.request({
            url: buildURL('security', 'adminResetPassword.api'),
            method: 'POST',
            params: { userId },
            success: Utils.getCallbackWrapper(() => {
                resolve({ userId, resetPassword: true });
            }),
            failure: Utils.getCallbackWrapper(error => {
                console.error('Failed to reset password.', error);
                reject(error);
            }),
        });
    });
}
