import { Container as IContainer } from '@labkey/api';

export interface ContainerDateFormats {
    dateFormat: string;
    dateTimeFormat: string;
    numberFormat: string;
    timeFormat: string;
}

const defaultContainer: IContainer = {
    activeModules: [],
    effectivePermissions: [],
    folderType: '',
    formats: {
        dateFormat: '',
        dateTimeFormat: '',
        numberFormat: '',
        timeFormat: '',
    },
    hasRestrictedActiveModule: false,
    iconHref: '',
    id: '',
    isContainerTab: false,
    isArchived: false,
    isWorkbook: false,
    name: '',
    parentId: '',
    parentPath: '',
    path: '',
    sortOrder: 0,
    startUrl: '',
    title: '',
    type: '',
};

/**
 * Model for org.labkey.api.data.Container as returned by Container.toJSON()
 */
export class Container implements IContainer {
    declare activeModules: string[];
    declare effectivePermissions: string[];
    declare folderType: string;
    declare formats: ContainerDateFormats;
    declare hasRestrictedActiveModule: boolean;
    declare iconHref: string;
    declare id: string;
    declare isArchived: boolean;
    declare isContainerTab: boolean;
    declare isWorkbook: boolean;
    declare name: string;
    declare parentId: string;
    declare parentPath: string;
    declare path: string;
    declare sortOrder: number;
    declare startUrl: string;
    declare title: string;
    declare type: string;

    constructor(props) {
        Object.assign(this, defaultContainer, props);
    }

    /**
     * Verify if the given moduleName parameter is in the array of active modules for this container object.
     * Note that this check is case-sensitive.
     * @param moduleName
     */
    hasActiveModule(moduleName: string): boolean {
        return this.activeModules?.indexOf(moduleName) > -1;
    }

    get isFolder(): boolean {
        return this.type === 'folder' && !this.isRoot;
    }

    get isProject(): boolean {
        return this.type === 'project' && !this.isRoot;
    }

    get isRoot(): boolean {
        return this.path === '/';
    }

    get isSharedProject(): boolean {
        return this.path === '/Shared';
    }
}
