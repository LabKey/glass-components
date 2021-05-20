import { List } from 'immutable';
import { PermissionTypes } from '@labkey/api';

import { User } from '../..';

export const TEST_USER_GUEST = new User({
    canDelete: false,
    canDeleteOwn: false,
    canInsert: false,
    canUpdate: false,
    canUpdateOwn: false,
    isAdmin: false,
    isAnalyst: false,
    isDeveloper: false,
    isGuest: true,
    isRootAdmin: false,
    isSignedIn: false,
    isSystemAdmin: false,
    isTrusted: false,
    permissionsList: List<string>([PermissionTypes.Read]),
});

export const TEST_USER_READER = new User({
    id: 1200,
    canDelete: false,
    canDeleteOwn: false,
    canInsert: false,
    canUpdate: false,
    canUpdateOwn: false,
    displayName: 'ReaderDisplayName',
    isAdmin: false,
    isAnalyst: false,
    isDeveloper: false,
    isGuest: false,
    isRootAdmin: false,
    isSignedIn: true,
    isSystemAdmin: false,
    isTrusted: false,
    permissionsList: List<string>([PermissionTypes.Read]),
});

export const TEST_USER_AUTHOR = new User({
    id: 1300,
    canDelete: false,
    canDeleteOwn: false,
    canInsert: true,
    canUpdate: false,
    canUpdateOwn: false,
    displayName: 'AuthorDisplayName',
    isAdmin: false,
    isAnalyst: true,
    isDeveloper: false,
    isGuest: false,
    isRootAdmin: false,
    isSignedIn: true,
    isSystemAdmin: false,
    isTrusted: true,
    permissionsList: List<string>([PermissionTypes.Read, PermissionTypes.Insert]),
});

export const TEST_USER_EDITOR = new User({
    id: 1100,
    canDelete: true,
    canDeleteOwn: true,
    canInsert: true,
    canUpdate: true,
    canUpdateOwn: true,
    displayName: 'EditorDisplayName',
    isAdmin: false,
    isAnalyst: true,
    isDeveloper: false,
    isGuest: false,
    isRootAdmin: false,
    isSignedIn: true,
    isSystemAdmin: false,
    isTrusted: true,
    permissionsList: List<string>([
        PermissionTypes.Delete,
        PermissionTypes.Read,
        PermissionTypes.Insert,
        PermissionTypes.Update,
        PermissionTypes.ManagePicklists
    ]),
});

export const TEST_USER_ASSAY_DESIGNER = new User({
    id: 1400,
    canDelete: false,
    canDeleteOwn: false,
    canInsert: false,
    canUpdate: false,
    canUpdateOwn: false,
    displayName: 'AssayDesignerDisplayName',
    isAdmin: false,
    isAnalyst: false,
    isDeveloper: false,
    isGuest: false,
    isRootAdmin: false,
    isSignedIn: true,
    isSystemAdmin: false,
    isTrusted: false,
    permissionsList: List<string>([PermissionTypes.Read, PermissionTypes.DesignAssay]),
});

export const TEST_USER_FOLDER_ADMIN = new User({
    id: 1005,
    canDelete: true,
    canDeleteOwn: true,
    canInsert: true,
    canUpdate: true,
    canUpdateOwn: true,
    displayName: 'FolderAdminDisplayName',
    isAdmin: true,
    isAnalyst: true,
    isDeveloper: true,
    isGuest: false,
    isRootAdmin: false,
    isSignedIn: true,
    isSystemAdmin: false,
    isTrusted: true,
    permissionsList: List<string>([
        PermissionTypes.Delete,
        PermissionTypes.Read,
        PermissionTypes.DesignDataClass,
        PermissionTypes.DesignSampleSet,
        PermissionTypes.DesignAssay,
        PermissionTypes.Insert,
        PermissionTypes.Update,
        PermissionTypes.Admin,
    ]),
});

export const TEST_USER_APP_ADMIN = new User({
    id: 1005,
    canDelete: true,
    canDeleteOwn: true,
    canInsert: true,
    canUpdate: true,
    canUpdateOwn: true,
    displayName: 'AppAdminDisplayName',
    isAdmin: true,
    isAnalyst: false,
    isDeveloper: false,
    isGuest: false,
    isRootAdmin: true,
    isSignedIn: true,
    isSystemAdmin: false,
    isTrusted: false,
    permissionsList: List<string>([
        PermissionTypes.Delete,
        PermissionTypes.Read,
        PermissionTypes.DesignDataClass,
        PermissionTypes.DesignSampleSet,
        PermissionTypes.DesignAssay,
        PermissionTypes.Insert,
        PermissionTypes.Update,
        PermissionTypes.Admin,
        PermissionTypes.UserManagement,
        PermissionTypes.ApplicationAdmin,
    ]),
});
