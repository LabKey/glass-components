import { Container, ContainerDateFormats } from './components/base/models/Container';
import { AppContext } from './AppContext';
import { getTestAPIWrapper } from './APIWrapper';
import { getSecurityTestAPIWrapper } from './components/security/APIWrapper';

const TEST_DATE_FORMATS: ContainerDateFormats = {
    dateFormat: 'yyyy-MM-dd',
    dateTimeFormat: 'yyyy-MM-dd HH:mm',
    numberFormat: null,
    timeFormat: 'HH:mm',
};

const TEST_PROJECT_CONTAINER_CONFIG = {
    activeModules: ['a', 'b', 'c'],
    formats: TEST_DATE_FORMATS,
    id: 'a685712e-0900-103a-9486-0131958dce60',
    isContainerTab: false,
    isWorkbook: false,
    name: 'TestProjectContainer',
    parentId: '785eb92a-95aa-1039-9db0-ffabf47c5c38',
    parentPath: '/',
    path: '/TestProjectContainer',
    title: 'Test Project Container',
    type: 'project',
};

export const TEST_PROJECT_CONTAINER = new Container(TEST_PROJECT_CONTAINER_CONFIG);
export const TEST_PROJECT_CONTAINER_ADMIN = new Container({
    ...TEST_PROJECT_CONTAINER_CONFIG,
    effectivePermissions: [
        'org.labkey.api.security.permissions.AdminPermission',
        'org.labkey.api.security.permissions.AddUserPermission',
    ],
});

export const TEST_PROJECT = new Container({
    ...TEST_PROJECT_CONTAINER_CONFIG,
    rootId: TEST_PROJECT_CONTAINER_CONFIG.parentId,
});

const TEST_FOLDER_CONTAINER_CONFIG = {
    activeModules: ['a', 'b', 'c'],
    formats: TEST_DATE_FORMATS,
    id: 'b685712f-0800-103a-9286-0131958dcf60',
    isContainerTab: false,
    isWorkbook: false,
    name: 'TestFolderContainer',
    parentId: TEST_PROJECT_CONTAINER.id,
    parentPath: TEST_PROJECT_CONTAINER.path,
    path: `${TEST_PROJECT_CONTAINER.path}/TestFolderContainer`,
    title: 'Test Folder Container',
    type: 'folder',
};
export const TEST_FOLDER_CONTAINER = new Container(TEST_FOLDER_CONTAINER_CONFIG);
export const TEST_ARCHIVED_FOLDER_CONTAINER = new Container({
    ...TEST_FOLDER_CONTAINER_CONFIG,
    name: 'ArchiveFolderContainer',
    id: 'b685712f-0800-103a-9286-8131958dcf60',
    path: `${TEST_PROJECT_CONTAINER.path}/ArchiveFolderContainer`,
    title: 'Archived Folder Container',
    isArchived: true,
});
export const TEST_FOLDER_CONTAINER_ADMIN = new Container({
    ...TEST_FOLDER_CONTAINER_CONFIG,
    effectivePermissions: ['org.labkey.api.security.permissions.AdminPermission'],
});

const TEST_FOLDER_OTHER_CONTAINER_CONFIG = {
    activeModules: ['a', 'b', 'c'],
    formats: TEST_DATE_FORMATS,
    id: 'b685712f-0800-103a-9286-0131958dcf69',
    isContainerTab: false,
    isWorkbook: false,
    name: 'OtherTestFolderContainer',
    parentId: TEST_PROJECT_CONTAINER.id,
    parentPath: TEST_PROJECT_CONTAINER.path,
    path: `${TEST_PROJECT_CONTAINER.path}/OtherTestFolderContainer`,
    title: 'Other Test Folder Container',
    type: 'folder',
};
export const TEST_FOLDER_OTHER_CONTAINER = new Container(TEST_FOLDER_OTHER_CONTAINER_CONFIG);
export const TEST_FOLDER_OTHER_CONTAINER_ADMIN = new Container({
    ...TEST_FOLDER_OTHER_CONTAINER_CONFIG,
    effectivePermissions: ['org.labkey.api.security.permissions.AdminPermission'],
});

export const createTestProjectAppContextAdmin = (mockFn = (): any => () => {}): Partial<AppContext> => {
    return {
        api: getTestAPIWrapper(mockFn, {
            security: getSecurityTestAPIWrapper(mockFn, {
                fetchContainers: mockFn().mockResolvedValue([
                    TEST_PROJECT_CONTAINER_ADMIN,
                    TEST_FOLDER_CONTAINER_ADMIN,
                ]),
            }),
        }),
    };
};

export const createTestProjectAppContextNonAdmin = (mockFn = (): any => () => {}): Partial<AppContext> => {
    return {
        api: getTestAPIWrapper(mockFn, {
            security: getSecurityTestAPIWrapper(mockFn, {
                fetchContainers: mockFn().mockResolvedValue([TEST_PROJECT_CONTAINER, TEST_FOLDER_CONTAINER]),
            }),
        }),
    };
};
