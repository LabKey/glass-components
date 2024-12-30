import { ActionURL, Ajax, Utils } from '@labkey/api';

import { Container } from '../base/models/Container';
import { handleRequestFailure } from '../../util/utils';
import { SAMPLE_MANAGER_APP_PROPERTIES } from '../../app/constants';
import { FolderConfigurableDataType } from '../entities/models';
import { getFolderDataTypeExclusions } from '../entities/actions';
import { isAppHomeFolder } from '../../app/utils';
import { fetchContainers } from '../permissions/actions';
import { ModuleContext } from '../base/ServerContext';
import { naturalSortByProperty } from '../../../public/sort';
import { HOME_PATH, HOME_TITLE } from '../navigation/constants';

export interface FolderSettingsOptions {
    allowUserSpecifiedNames?: boolean;
    disabledAssayDesigns?: number[];
    disabledDashboardSampleTypes?: number[];
    disabledDataClasses?: number[];
    disabledSampleTypes?: number[];
    disabledStorageLocations?: number[];
    name?: string;
    nameAsTitle?: boolean;
    prefix?: string;
    title?: string;
}

export interface UpdateContainerSettingsOptions {
    defaultDateFormat?: string;
    defaultDateFormatInherited?: boolean;
    defaultDateTimeFormat?: string;
    defaultDateTimeFormatInherited?: boolean;
    defaultTimeFormat?: string;
    defaultTimeFormatInherited?: boolean;
}

export interface AuditSettingsResponse {
    requireUserComments: boolean;
}

export interface FolderAPIWrapper {
    archiveFolder: (archive: boolean, containerPath?: string) => Promise<Container>;
    createFolder: (options: FolderSettingsOptions, containerPath?: string) => Promise<Container>;
    getAuditSettings: (containerPath?: string) => Promise<AuditSettingsResponse>;
    getContainers: (
        container?: Container,
        moduleContext?: ModuleContext,
        includeStandardProperties?: boolean,
        includeEffectivePermissions?: boolean,
        includeTopFolder?: boolean,
        excludeArchived?: boolean
    ) => Promise<Container[]>;
    getDataTypeExcludedContainers: (dataType: FolderConfigurableDataType, dataTypeRowId: number) => Promise<string[]>;
    getFolderDataTypeExclusions: (excludedContainer?: string, reload?: boolean) => Promise<{ [key: string]: number[] }>;
    getMultipleDataTypeExcludedContainers: (
        dataType: FolderConfigurableDataType,
        dataTypeRowIds: number[]
    ) => Promise<string[]>;
    renameFolder: (options: FolderSettingsOptions, containerPath?: string) => Promise<Container>;
    setAuditCommentsRequired: (isRequired: boolean, containerPath?: string) => Promise<void>;
    updateContainerDataExclusions: (options: FolderSettingsOptions, containerPath?: string) => Promise<void>;
    updateContainerLookAndFeelSettings: (
        options: UpdateContainerSettingsOptions,
        containerPath?: string
    ) => Promise<void>;
}

export class ServerFolderAPIWrapper implements FolderAPIWrapper {
    createFolder = (options: FolderSettingsOptions, containerPath?: string): Promise<Container> => {
        return new Promise((resolve, reject) => {
            Ajax.request({
                url: ActionURL.buildURL(
                    SAMPLE_MANAGER_APP_PROPERTIES.controllerName,
                    'createFolder.api',
                    containerPath
                ),
                method: 'POST',
                jsonData: options,
                success: Utils.getCallbackWrapper(({ folder }) => {
                    resolve(new Container(folder));
                }),
                failure: handleRequestFailure(reject, 'Failed to create folder'),
            });
        });
    };

    archiveFolder = (archive: boolean = true, containerPath?: string): Promise<Container> => {
        return new Promise((resolve, reject) => {
            Ajax.request({
                url: ActionURL.buildURL(
                    SAMPLE_MANAGER_APP_PROPERTIES.controllerName,
                    'archiveFolder.api',
                    containerPath
                ),
                method: 'POST',
                jsonData: {
                    archive,
                },
                success: Utils.getCallbackWrapper(({ folder }) => {
                    resolve(new Container(folder));
                }),
                failure: handleRequestFailure(reject, 'Failed to ' + (archive ? 'archive' : 'restore') + ' folder'),
            });
        });
    };

    renameFolder = (options: FolderSettingsOptions, containerPath?: string): Promise<Container> => {
        return new Promise((resolve, reject) => {
            Ajax.request({
                url: ActionURL.buildURL(
                    SAMPLE_MANAGER_APP_PROPERTIES.controllerName,
                    'renameFolder.api',
                    containerPath
                ),
                method: 'POST',
                jsonData: options,
                success: Utils.getCallbackWrapper(({ data }) => {
                    resolve(new Container(data.folder));
                }),
                failure: handleRequestFailure(reject, 'Failed to rename folder.'),
            });
        });
    };

    getAuditSettings = (containerPath?: string): Promise<AuditSettingsResponse> => {
        return new Promise((resolve, reject) => {
            Ajax.request({
                url: ActionURL.buildURL('audit', 'getAuditSettings', containerPath),
                method: 'POST',
                success: Utils.getCallbackWrapper(response => {
                    resolve(response);
                }),
                failure: handleRequestFailure(reject, 'Failed to retrieve audit settings.'),
            });
        });
    };

    setAuditCommentsRequired = (requireUserComments: boolean, containerPath?: string): Promise<void> => {
        return new Promise((resolve, reject) => {
            Ajax.request({
                url: ActionURL.buildURL('audit', 'saveAuditSettings', containerPath),
                method: 'POST',
                jsonData: { requireUserComments },
                success: Utils.getCallbackWrapper(() => {
                    resolve();
                }),
                failure: handleRequestFailure(reject, 'Failed to save setting for audit comment requirements.'),
            });
        });
    };

    updateContainerDataExclusions = (options: FolderSettingsOptions, containerPath?: string): Promise<void> => {
        return new Promise((resolve, reject) => {
            Ajax.request({
                url: ActionURL.buildURL(
                    SAMPLE_MANAGER_APP_PROPERTIES.controllerName,
                    'updateContainerDataExclusion.api',
                    containerPath
                ),
                method: 'POST',
                jsonData: options,
                success: Utils.getCallbackWrapper(({ data }) => {
                    resolve();
                }),
                failure: handleRequestFailure(reject, 'Failed to update folder data type'),
            });
        });
    };

    updateContainerLookAndFeelSettings = (
        options: UpdateContainerSettingsOptions,
        containerPath?: string
    ): Promise<void> => {
        return new Promise((resolve, reject) => {
            Ajax.request({
                url: ActionURL.buildURL('admin', 'updateContainerSettings.api', containerPath),
                method: 'POST',
                jsonData: options,
                success: Utils.getCallbackWrapper(() => {
                    resolve();
                }),
                failure: handleRequestFailure(reject, 'Failed to update folder look and feel settings'),
            });
        });
    };

    getDataTypeExcludedContainers = (
        dataType: FolderConfigurableDataType,
        dataTypeRowId: number
    ): Promise<string[]> => {
        if (!dataType || !dataTypeRowId) {
            return Promise.resolve(undefined);
        }
        return new Promise((resolve, reject) => {
            Ajax.request({
                url: ActionURL.buildURL(SAMPLE_MANAGER_APP_PROPERTIES.controllerName, 'getDataTypeExclusion.api'),
                method: 'GET',
                params: {
                    dataType,
                    dataTypeRowId,
                },
                success: Utils.getCallbackWrapper(response => {
                    resolve(response['excludedContainers']);
                }),
                failure: handleRequestFailure(reject, 'Failed to get excluded folders'),
            });
        });
    };

    getMultipleDataTypeExcludedContainers = (
        dataType: FolderConfigurableDataType,
        dataTypeRowIds: number[]
    ): Promise<string[]> => {
        if (!dataType || !dataTypeRowIds || !dataTypeRowIds.length) {
            return Promise.resolve(undefined);
        }

        return new Promise((resolve, reject) => {
            const promises = [];

            dataTypeRowIds.forEach(id => {
                promises.push(this.getDataTypeExcludedContainers(dataType, id));
            });
            const excludedFolderSet = new Set();
            Promise.all(promises)
                .then(results => {
                    results.forEach(exclusions => exclusions.forEach(e => excludedFolderSet.add(e)));
                    const folderList = [];
                    excludedFolderSet.forEach(f => {
                        folderList.push(f);
                    });
                    resolve(folderList);
                })
                .catch(reason => {
                    console.error('Unable to retrieve data type exclusions', reason);
                    reject(reason);
                });
        });
    };

    getContainers = (
        container?: Container,
        moduleContext?: ModuleContext,
        includeStandardProperties?: boolean,
        includeEffectivePermissions?: boolean,
        includeTopFolder?: boolean,
        excludeArchived?: boolean
    ): Promise<Container[]> => {
        return new Promise((resolve, reject) => {
            const topFolderPath = isAppHomeFolder(container, moduleContext) ? container.path : container.parentPath;
            fetchContainers({
                containerPath: topFolderPath,
                includeEffectivePermissions,
                includeStandardProperties,
                includeWorkbookChildren: false,
                includeSubfolders: true,
                depth: 1,
            })
                .then(containers => {
                    const folders = containers
                        // if user doesn't have permissions to the parent/project, the response will come back with an empty Container object
                        .filter(c => c !== undefined && c.id !== '');

                    const childFolders = folders.filter(
                        c => c.path !== topFolderPath && (!excludeArchived || !c.isArchived)
                    );
                    // Issue 45805: sort folders by title as server-side sorting is insufficient
                    childFolders.sort(naturalSortByProperty('title'));

                    if (!includeTopFolder) {
                        resolve(childFolders);
                    } else {
                        const top = folders.find(c => c.path === topFolderPath);
                        const allContainers = top
                            ? [{ ...top, title: top.path === HOME_PATH ? HOME_TITLE : top.title } as Container]
                            : [];
                        allContainers.push(...childFolders);
                        resolve(allContainers);
                    }
                })
                .catch(error => {
                    reject(error);
                });
        });
    };

    getFolderDataTypeExclusions = getFolderDataTypeExclusions;
}

/**
 * Note: Intentionally does not use jest.fn() to avoid jest becoming an implicit external package dependency.
 */
export function getFolderTestAPIWrapper(
    mockFn = (): any => () => {},
    overrides: Partial<FolderAPIWrapper> = {}
): FolderAPIWrapper {
    return {
        archiveFolder: mockFn(),
        createFolder: mockFn(),
        renameFolder: mockFn(),
        getAuditSettings: mockFn(),
        setAuditCommentsRequired: mockFn(),
        updateContainerDataExclusions: mockFn(),
        getDataTypeExcludedContainers: mockFn(),
        getFolderDataTypeExclusions: mockFn(),
        getMultipleDataTypeExcludedContainers: mockFn(),
        updateContainerLookAndFeelSettings: mockFn(),
        getContainers: mockFn(),
        ...overrides,
    };
}
