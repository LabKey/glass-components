import { Map, Record } from 'immutable';

import { ActionURL, Ajax, Utils } from '@labkey/api';

import { DEFAULT_FILE, IFile } from './models';

export class WebDavFile extends Record(DEFAULT_FILE) implements IFile {
    contentLength: number;
    created: string;
    createdBy: string;
    createdById: number;
    dataFileUrl: string;
    description: string;
    downloadUrl: string;
    href: string;
    id: string;
    iconFontCls: string;
    isCollection: boolean;
    isLeaf: boolean;
    lastModified: string;
    name: string;
    propertiesRowId?: number;

    constructor(params?: IFile) {
        params ? super(params) : super();
    }

    static create(values): WebDavFile {
        const webDavFile = new WebDavFile(values);

        return webDavFile.merge({
            isCollection: values.collection,
            isLeaf: values.leaf,
            createdBy: values.createdby,
            created: values.creationdate,
            lastModified: values.lastmodified,
            downloadUrl: values.href ? values.href + '?contentDisposition=attachment' : undefined,
            name: values.text,
        }) as WebDavFile;
    }
}

function getWebDavUrl(containerPath: string, directory?: string, createIntermediates?: boolean) {
    let url =
        ActionURL.getContextPath() +
        '/_webdav' +
        ActionURL.encodePath(containerPath) +
        '/' +
        encodeURIComponent('@files');

    if (directory) {
        url += '/' + directory;
    }

    if (createIntermediates) {
        url += '?createIntermediates=' + createIntermediates;
    }

    return url;
}

export function getWebDavFiles(
    containerPath: string,
    directory?: string,
    includeDirectories?: boolean
): Promise<Map<string, WebDavFile>> {
    return new Promise((resolve, reject) => {
        const url = getWebDavUrl(containerPath, directory);

        return Ajax.request({
            url: url + '?method=JSON',
            method: 'GET',
            success: Utils.getCallbackWrapper(response => {
                // Filter directories and create webdav files
                const filteredFiles = response.files.reduce((filtered, file) => {
                    if (includeDirectories || !file.collection) {
                        return filtered.set(file.text, WebDavFile.create(file));
                    }
                }, Map<string, WebDavFile>());

                resolve(filteredFiles);
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

        const url = getWebDavUrl(containerPath, directory, createIntermediates);

        Ajax.request({
            url,
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
