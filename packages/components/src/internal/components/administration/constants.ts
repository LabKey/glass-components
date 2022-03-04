import { PermissionRoles } from '@labkey/api';
import { Map } from 'immutable';

const ROLE_ACTION_DESCRIPTION = 'and creating and editing sample types, source types, assay designs, and job templates.';

export const SECURITY_ROLE_DESCRIPTIONS = Map<string, string>([
    [PermissionRoles.ApplicationAdmin, 'Application Administrators have full control over the application. This includes user management, permission assignments, ' + ROLE_ACTION_DESCRIPTION],
    [PermissionRoles.ProjectAdmin, 'Project Administrators have full control over the application in this project container. This includes user management, permission assignments, ' + ROLE_ACTION_DESCRIPTION],
    [PermissionRoles.FolderAdmin, 'Folder Administrators have control over the folder specific pieces of the application. This includes permission assignments, ' + ROLE_ACTION_DESCRIPTION],
    [PermissionRoles.Editor, 'Editors may add new information or edit data related to samples, sources, assays, jobs, but not storage locations.'],
    [PermissionRoles.Reader, 'Readers have a read-only view of the application.'],
]);

export const HOSTED_APPLICATION_SECURITY_ROLES = Map<string, string>([
    [PermissionRoles.Editor, 'Editor'],
    [PermissionRoles.Reader, 'Reader'],
]);
