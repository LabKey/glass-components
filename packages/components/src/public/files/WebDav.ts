import { Map, Record } from 'immutable';

import { ActionURL, Ajax, Utils } from '@labkey/api';
import {DEFAULT_FILE, IFile} from "../../internal/components/files/models";

export class WebDavFile extends Record(DEFAULT_FILE) implements IFile {
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

    static create(values): WebDavFile {
        const webDavFile = new WebDavFile(values);

        return webDavFile.merge({
            canDelete: values.canDelete,
            canEdit: values.canEdit,
            canRead: values.canRead,
            canRename: values.canRename,
            canUpload: values.canUpload,
            isCollection: values.collection,
            isLeaf: values.leaf,
            createdBy: values.createdby,
            created: values.creationdate,
            lastModified: values.lastmodified,
            downloadUrl: values.href ? values.href + '?contentDisposition=attachment' : undefined,
            name: values.text,
            contentType: values.contenttype || webDavFile.contentType,
        }) as WebDavFile;
    }
}

function getWebDavUrl(
    containerPath: string,
    directory?: string,
    createIntermediates?: boolean,
    skipAtFiles?: boolean,
    asJSON?: boolean
): string {
    let url = `${ActionURL.getContextPath()}/_webdav${ActionURL.encodePath(containerPath)}`;

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
                        return filtered.set(file.text, WebDavFile.create(file));
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
