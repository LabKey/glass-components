import { ActionURL, PermissionTypes, UserWithPermissions } from '@labkey/api';

interface IUserProps extends UserWithPermissions {
    permissionsList: string[];
    groups?: number[];
}

const defaultUser: IUserProps = {
    id: 0,

    canDelete: false,
    canDeleteOwn: false,
    canInsert: false,
    canUpdate: false,
    canUpdateOwn: false,

    displayName: 'guest',
    email: 'guest',
    phone: null,
    avatar: ActionURL.getContextPath() + '/_images/defaultavatar.png',

    isAdmin: false,
    isAnalyst: false,
    isDeveloper: false,
    isGuest: true,
    isRootAdmin: false,
    isSignedIn: false,
    isSystemAdmin: false,
    isTrusted: false,

    maxAllowedPhi: undefined,
    permissionsList: undefined,

    groups: undefined,
};

/**
 * Model for org.labkey.api.security.User as returned by User.getUserProps()
 */
export class User implements IUserProps {
    declare id: number;

    declare canDelete: boolean;
    declare canDeleteOwn: boolean;
    declare canInsert: boolean;
    declare canUpdate: boolean;
    declare canUpdateOwn: boolean;

    declare displayName: string;
    declare email: string;
    declare phone: string;
    declare avatar: string;

    declare isAdmin: boolean;
    declare isAnalyst: boolean;
    declare isDeveloper: boolean;
    declare isGuest: boolean;
    declare isRootAdmin: boolean;
    declare isSignedIn: boolean;
    declare isSystemAdmin: boolean;
    declare isTrusted: boolean;

    declare maxAllowedPhi: string;
    declare permissionsList: string[];

    declare groups: number[];

    constructor(props) {
        Object.assign(this, defaultUser, props);
    }

    static getDefaultUser(): User {
        return new User(defaultUser);
    }

    hasAdminPermission(): boolean {
        return hasAllPermissions(this, [PermissionTypes.Admin], false);
    }

    hasUpdatePermission(): boolean {
        return hasAllPermissions(this, [PermissionTypes.Update]);
    }

    hasInsertPermission(): boolean {
        return hasAllPermissions(this, [PermissionTypes.Insert]);
    }

    hasDeletePermission(): boolean {
        return hasAllPermissions(this, [PermissionTypes.Delete]);
    }

    hasDesignAssaysPermission(): boolean {
        return hasAllPermissions(this, [PermissionTypes.DesignAssay]);
    }

    hasDesignSampleTypesPermission(): boolean {
        return hasAllPermissions(this, [PermissionTypes.DesignSampleSet]);
    }

    hasManageUsersPermission(): boolean {
        return hasAllPermissions(this, [PermissionTypes.UserManagement], false);
    }

    isAppAdmin(): boolean {
        return hasAllPermissions(this, [PermissionTypes.ApplicationAdmin], false);
    }

    hasAddUsersPermission(): boolean {
        return hasAllPermissions(this, [PermissionTypes.AddUser], false);
    }

    hasSampleWorkflowDeletePermission(): boolean {
        return hasAllPermissions(this, [PermissionTypes.SampleWorkflowDelete]);
    }
}

/**
 * Determines if a user has the permissions given.
 * @param user User in question
 * @param perms Array of permission strings (See models/constants)
 * @param checkIsAdmin Indicates if user.isAdmin should override check. Defaults to true.
 * @param permissionCheck Sets which "has permissions" check logic is used.
 *   `all` - Require user to have all of the specified permissions (default).
 *   `any` - Require user to have any of the specified permissions.
 */
export function hasPermissions(
    user: User,
    perms: string[],
    checkIsAdmin = true,
    permissionCheck: 'all' | 'any' = 'all'
): boolean {
    if (checkIsAdmin && user.isAdmin) {
        return perms?.length > 0;
    } else if (perms) {
        const allPerms = user.permissionsList ?? [];

        if (permissionCheck === 'any') {
            return perms.some(p => allPerms.indexOf(p) > -1);
        } else {
            return perms.every(p => allPerms.indexOf(p) > -1);
        }
    }

    return false;
}

/**
 * Determines if a user has all the permissions given. If the user has only some of these permissions, returns false.
 * @param user User in question
 * @param perms Array of permission strings (See models/constants)
 * @param checkIsAdmin Indicates if user.isAdmin should override check
 */
export function hasAllPermissions(user: User, perms: string[], checkIsAdmin?: boolean): boolean {
    return hasPermissions(user, perms, checkIsAdmin, 'all');
}

/**
 * Determines if a user has any of the permissions given. If the user has any of the permissions then return true.
 * @param user User in question
 * @param perms Array of permission strings (See models/constants)
 * @param checkIsAdmin Indicates if user.isAdmin should override check
 */
export function hasAnyPermissions(user: User, perms: string[], checkIsAdmin?: boolean): boolean {
    return hasPermissions(user, perms, checkIsAdmin, 'any');
}
