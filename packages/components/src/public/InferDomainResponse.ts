import { fromJS, List, Record } from 'immutable';

import { Ajax, Utils } from '@labkey/api';

import { buildURL } from '../internal/url/AppURL';
import { processRequest } from '../internal/query/api';

import { QueryColumn } from './QueryColumn';

export class InferDomainResponse extends Record({
    data: List<any>(),
    fields: List<QueryColumn>(),
    reservedFields: List<QueryColumn>(),
    commentLineCount: undefined,
}) {
    declare data: List<any>;
    declare fields: List<QueryColumn>;
    declare reservedFields: List<QueryColumn>;
    declare commentLineCount?: number;

    static create(rawModel): InferDomainResponse {
        let data = List<any>();
        let fields = List<QueryColumn>();
        let reservedFields = List<QueryColumn>();

        if (rawModel) {
            if (rawModel.data) {
                data = fromJS(rawModel.data);
            }

            if (rawModel.fields) {
                fields = List(rawModel.fields.map(field => new QueryColumn(field)));
            }

            if (rawModel.reservedFields) {
                reservedFields = List(rawModel.reservedFields.map(field => new QueryColumn(field)));
            }
        }

        return new InferDomainResponse({
            data,
            fields,
            reservedFields,
            commentLineCount: rawModel.commentLineCount
        });
    }
}

export function inferDomainFromFile(
    file: File | string, // file or webdav url path
    numLinesToInclude: number,
    domainKindName?: string
): Promise<InferDomainResponse> {
    return new Promise((resolve, reject) => {
        const form = new FormData();
        form.append('file', file);
        form.append('checkCommentLineCount', 'true');
        form.append('numLinesToInclude', numLinesToInclude ? (numLinesToInclude + 1).toString() : undefined);
        if (domainKindName) {
            form.append('domainKindName', domainKindName);
        }

        Ajax.request({
            url: buildURL('property', 'inferDomain'),
            method: 'POST',
            form,
            success: Utils.getCallbackWrapper((response, request) => {
                if (processRequest(response, request, reject)) return;
                resolve(InferDomainResponse.create(response));
            }),
            failure: Utils.getCallbackWrapper(error => {
                console.error(error);
                reject(
                    'There was a problem determining the fields in the uploaded file.  Please check the format of the file.'
                );
            }),
        });
    });
}
