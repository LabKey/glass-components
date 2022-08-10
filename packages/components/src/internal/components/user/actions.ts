import moment from 'moment';
import { Map, OrderedMap } from 'immutable';
import {Ajax, Filter, PermissionRoles, PermissionTypes, Query, Security, Utils} from '@labkey/api';

import {
    buildURL,
    caseInsensitive,
    hasAllPermissions, resolveErrorMessage,
    SchemaQuery, SCHEMAS,
    selectRows,
    SHARED_CONTAINER_PATH,
    User
} from '../../..';

import { APPLICATION_SECURITY_ROLES, SITE_SECURITY_ROLES } from '../permissions/constants';

import { processRequest } from '../../query/api';

import { ChangePasswordModel } from './models';
import {OntologyModel} from "../ontology/models";

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
        return APPLICATION_SECURITY_ROLES.get(PermissionRoles.Reader);
    }

    return 'Unknown Role';
}

export function getUserLastLogin(userProperties: Record<string, any>, dateFormat?: string): string {
    const lastLogin = caseInsensitive(userProperties, 'lastlogin');
    return lastLogin ? moment(lastLogin).format(dateFormat) : undefined;
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

export function updateUserDetails(schemaQuery: SchemaQuery, data: FormData): Promise<any> {
    return new Promise((resolve, reject) => {
        Ajax.request({
            url: buildURL('user', 'updateUserDetails.api'),
            method: 'POST',
            form: data,
            success: Utils.getCallbackWrapper((response, request) => {
                if (processRequest(response, request, reject)) return;
                resolve(response);
            }),
            failure: Utils.getCallbackWrapper(error => {
                reject(error);
            }),
        });
    });
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

export function getPasswordRuleInfo(): Promise<any> {
    return new Promise<any>((resolve, reject) => {
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

export function resetPassword(email: string): Promise<any> {
    return new Promise((resolve, reject) => {
        Ajax.request({
            url: buildURL('security', 'adminResetPassword.api'),
            method: 'POST',
            params: { email },
            success: Utils.getCallbackWrapper(response => {
                resolve({
                    resetPassword: true,
                    email,
                });
            }),
            failure: Utils.getCallbackWrapper(response => {
                reject(response);
            }),
        });
    });
}

export function getUserSharedContainerPermissions(): Promise<string[]> {
    return new Promise((resolve, reject) => {
        Security.getUserPermissions({
            containerPath: SHARED_CONTAINER_PATH,
            success: response => {
                const { container } = response;
                resolve(container.effectivePermissions);
            },
            failure: error => {
                reject(error);
            },
        });
    });
}
