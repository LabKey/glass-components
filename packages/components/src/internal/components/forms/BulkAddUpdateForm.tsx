import React, { FC, useMemo } from 'react';
import { List, Map } from 'immutable';
import {Alert} from "react-bootstrap";

import {Filter} from "@labkey/api";

import { capitalizeFirstChar, getCommonDataValues } from '../../util/utils';
import { EditorModel } from '../../models';
import { QueryInfoForm, QueryInfoFormProps } from './QueryInfoForm';

interface BulkAddUpdateFormProps extends Omit<QueryInfoFormProps, 'fieldValues'> {
    data: Map<any, Map<string, any>>;
    dataKeys: List<any>;
    editorModel: EditorModel;
    selectedRowIndexes: List<number>;
    queryFilters?: {[key: string]: List<Filter.IFilter>};
    warning?: string;
}

export const BulkAddUpdateForm: FC<BulkAddUpdateFormProps> = props => {
    const { data, dataKeys, editorModel, queryInfo, selectedRowIndexes, warning, ...queryInfoFormProps } = props;
    const {
        pluralNoun,
        singularNoun,
        submitForEditText = `Finish Editing ${capitalizeFirstChar(pluralNoun)}`,
        title = 'Update ' + selectedRowIndexes.size + ' ' + (selectedRowIndexes.size === 1 ? singularNoun : pluralNoun),
    } = queryInfoFormProps;

    const fieldValues = useMemo(() => {
        const editorData = editorModel
            .getRawDataFromGridData(data, dataKeys, queryInfo, false)
            .filter((val, index) => selectedRowIndexes.contains(index))
            .toMap();
        return getCommonDataValues(editorData);
    }, [data, dataKeys, editorModel, queryInfo, selectedRowIndexes]);

    return (
        <>
            {warning && <Alert bsStyle="warning">{warning}</Alert>}
            <QueryInfoForm
                {...queryInfoFormProps}
                fieldValues={fieldValues}
                queryInfo={queryInfo.getInsertQueryInfo()}
                submitForEditText={submitForEditText}
                title={title}
                hideButtons={!queryInfoFormProps.asModal}
            />
        </>

    );
};

BulkAddUpdateForm.defaultProps = {
    allowFieldDisable: true,
    asModal: true,
    checkRequiredFields: false,
    includeCountField: false,
    initiallyDisableFields: true,
    pluralNoun: 'rows',
    showLabelAsterisk: true,
    singularNoun: 'row',
};

BulkAddUpdateForm.displayName = 'BulkAddUpdateForm';
