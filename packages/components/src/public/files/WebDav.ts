import { Map, Record } from 'immutable';

import { ActionURL, Ajax, Utils } from '@labkey/api';

import { DEFAULT_FILE, IFile } from '../../internal/components/files/models';

export interface IFileExtended extends IFile {
    collection: boolean; // Gets coerced to isCollection
    contenttype: string; // Gets coerced to contentType
    creationdate: string; // Gets coerced to created
    href: string; // Gets coerced to downloadUrl
    lastmodified: string; // Gets coerced to lastModified
    leaf: boolean; // Gets coerced to isLeaf
    text: string; // Gets coerced to name
}

export class WebDavFile implements IFile {
    declare canDelete: boolean;
    declare canEdit: boolean;
    declare canRead: boolean;
    declare canRename: boolean;
    declare canUpload: boolean;
    declare contentLength: number;
    declare contentType: string;
    declare created: string;
    declare createdBy: string;
    declare createdById: number;
    declare dataFileUrl: string;
    declare description: string;
    declare downloadUrl: string;
    declare href: string;
    declare id: string;
    declare iconFontCls: string;
    declare isCollection: boolean;
    declare isLeaf: boolean;
    declare lastModified: string;
    declare name: string;
    declare options: string;
    declare propertiesRowId?: number;

    constructor(props: IFileExtended) {
        const { collection, contenttype, creationdate, href, lastmodified, leaf, text, ...validProps } = props;

        if (collection !== undefined) validProps.isCollection = collection;
        if (contenttype !== undefined) validProps.contentType = contenttype;
        if (creationdate !== undefined) validProps.created = creationdate;
        if (href !== undefined) validProps.downloadUrl = href + '?contentDisposition=attachment';
        if (lastmodified !== undefined) validProps.lastModified = lastmodified;
        if (leaf !== undefined) validProps.isLeaf = leaf;
        if (text !== undefined) validProps.name = text;

        Object.assign(this, DEFAULT_FILE, validProps);
    }
}

function getWebDavUrl(
    containerPath: string,
    directory?: string,
    createIntermediates?: boolean,
    skipAtFiles?: boolean,
    asJSON?: boolean
): string {
    const containerPath_ = containerPath?.startsWith('/') ? containerPath : '/' + containerPath;
    let url = `${ActionURL.getContextPath()}/_webdav${ActionURL.encodePath(containerPath_)}`;

    if (!skipAtFiles) url += '/' + encodeURIComponent('@files');
    if (directory) url += '/' + encodeURIComponent(directory).replace(/%2F/g, '/');
    if (createIntermediates) url += '?createIntermediates=' + createIntermediates;
    if (asJSON) url += '?method=JSON';

    return url;
}

export function getWebDavFiles(
    containerPath: string,
    directory?: string,
    includeDirectories?: boolean,
    skipAtFiles?: boolean,
    alternateFilterCondition?: (file: any) => boolean
): Promise<Map<string, any>> {
    return new Promise((resolve, reject) => {
        return Ajax.request({
            url: getWebDavUrl(containerPath, directory, false, skipAtFiles, true),
            success: Utils.getCallbackWrapper(response => {
                // Filter directories and create webdav files
                const filteredFiles = response.files.reduce((filtered, file) => {
                    const filterCondition = alternateFilterCondition
                        ? alternateFilterCondition(file)
                        : includeDirectories || !file.collection;
                    if (filterCondition) {
                        return filtered.set(file.text, new WebDavFile(file));
                    } else {
                        return filtered;
                    }
                }, Map<string, WebDavFile>());
                resolve(Map({ files: filteredFiles, permissions: response.permissions }));
            }),
            failure: Utils.getCallbackWrapper(
                response => {
                    console.error('Problem retrieving webDav files for container ' + containerPath);
                    reject(response);
                },
                null,
                false
            ),
        });
    });
}

export function uploadWebDavFile(
    file: File,
    containerPath: string,
    directory?: string,
    createIntermediates?: boolean
): Promise<string> {
    return new Promise((resolve, reject) => {
        const form = new FormData();
        form.append('file', file);

        Ajax.request({
            url: getWebDavUrl(containerPath, directory, createIntermediates),
            method: 'POST',
            form,
            success: Utils.getCallbackWrapper(() => {
                resolve(file.name);
            }),
            failure: Utils.getCallbackWrapper(
                () => {
                    console.error('failure uploading file ' + file.name);
                    reject(file.name);
                },
                null,
                false
            ),
        });
    });
}

export function createWebDavDirectory(
    containerPath: string,
    directory: string,
    createIntermediates?: boolean
): Promise<string> {
    return new Promise((resolve, reject) => {
        Ajax.request({
            url: getWebDavUrl(containerPath, directory, createIntermediates),
            method: 'MKCOL',
            success: Utils.getCallbackWrapper(() => {
                resolve(directory);
            }),
            failure: Utils.getCallbackWrapper(
                () => {
                    console.error('failure creating directory ' + directory);
                    reject(directory);
                },
                null,
                false
            ),
        });
    });
}

export function deleteWebDavResource(containerPath: string, directoryOrFilePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
        Ajax.request({
            url: getWebDavUrl(containerPath, directoryOrFilePath),
            method: 'DELETE',
            success: Utils.getCallbackWrapper(() => {
                resolve(directoryOrFilePath);
            }),
            failure: Utils.getCallbackWrapper(
                () => {
                    console.error('failure deleting resource ' + directoryOrFilePath);
                    reject(directoryOrFilePath);
                },
                null,
                false
            ),
        });
    });
}
