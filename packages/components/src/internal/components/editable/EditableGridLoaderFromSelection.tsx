/*
 * Copyright (c) 2019 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { Map } from 'immutable';

import { getSelectedDataDeprecated } from '../../actions';

import { QueryModel } from '../../../public/QueryModel/QueryModel';
import { QueryInfo } from '../../../public/QueryInfo';
import { QueryColumn } from '../../../public/QueryColumn';

import { EditorMode, EditorModel, EditableGridLoader, GridResponse } from './models';

export class EditableGridLoaderFromSelection implements EditableGridLoader {
    columns: QueryColumn[];
    extraColumns?: QueryColumn[];
    id: string;
    idsNotPermitted: number[];
    idsNotToUpdate: number[];
    fieldsNotToUpdate: string[];
    mode: EditorMode;
    model: QueryModel;
    omittedColumns: string[];
    queryModel: QueryModel;
    queryInfo: QueryInfo;
    requiredColumns: string[];
    updateData: any;

    constructor(
        id: string,
        queryModel: QueryModel,
        // FIXME: the types I'm seeing passed as updateData imply Map<string, any> is the correct type, however assuming
        //  that makes the code fall over
        updateData: any,
        requiredColumns?: string[],
        omittedColumns?: string[],
        columns?: QueryColumn[],
        idsNotToUpdate?: number[],
        fieldsNotToUpdate?: string[],
        idsNotPermitted?: number[],
        extraColumns?: QueryColumn[]
    ) {
        this.columns = columns;
        this.extraColumns = extraColumns;
        this.id = id;
        this.mode = EditorMode.Update;
        this.queryModel = queryModel;
        this.queryInfo = queryModel.queryInfo;
        this.updateData = updateData || {};
        this.requiredColumns = requiredColumns || [];
        this.omittedColumns = omittedColumns || [];
        this.idsNotToUpdate = idsNotToUpdate || [];
        this.fieldsNotToUpdate = fieldsNotToUpdate || [];
        this.idsNotPermitted = idsNotPermitted || [];
    }

    async fetch(): Promise<GridResponse> {
        const { queryName, queryParameters, schemaName, sortString, viewName } = this.queryModel;
        const selectedIds = this.queryModel.getSelectedIds(this.idsNotPermitted);
        // TODO: when going form Bulk Update -> Edit in Grid this getSelectedData call is redundant, as our
        //  BulkUpdateForm gives us the selected data. In a future PR we'll update this loader to optionally accept the
        //  already existing selection data. See SamplesEditableGrid for an example that is passed selectionData.
        const { data, dataIds } = await getSelectedDataDeprecated(
            schemaName,
            queryName,
            selectedIds,
            this.queryModel.getRequestColumnsString(this.requiredColumns, this.omittedColumns, true),
            sortString,
            queryParameters,
            viewName
        );

        return {
            data: EditorModel.convertQueryDataToEditorData(
                data,
                // Coerce to Map<string, any> because despite types seeming to align they're getting clobbered somewhere
                // and we're not actually passing Map<string, any>.
                Map<string, any>(this.updateData),
                this.idsNotToUpdate,
                this.fieldsNotToUpdate
            ),
            dataIds,
        };
    }
}
