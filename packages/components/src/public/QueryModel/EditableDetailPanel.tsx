import React, { FC, ReactNode, useCallback, useState } from 'react';
import { fromJS } from 'immutable';
import { AuditBehaviorTypes, Query } from '@labkey/api';

import { Formsy } from '../../internal/components/forms/formsy';
import { DetailPanelHeader } from '../../internal/components/forms/detail/DetailPanelHeader';
import { DetailRenderer } from '../../internal/components/forms/detail/DetailDisplay';
import { extractChanges } from '../../internal/components/forms/detail/utils';
import { FormButtons } from '../../internal/FormButtons';

import { QueryColumn } from '../QueryColumn';
import { FileInput } from '../../internal/components/forms/input/FileInput';
import { resolveErrorMessage } from '../../internal/util/messaging';
import { Alert } from '../../internal/components/base/Alert';

import { useDataChangeCommentsRequired } from '../../internal/components/forms/input/useDataChangeCommentsRequired';
import { CommentTextArea } from '../../internal/components/forms/input/CommentTextArea';

import { useAppContext } from '../../internal/AppContext';

import { QueryModel } from './QueryModel';

import { DetailPanel, DetailPanelWithModel } from './DetailPanel';

export interface EditableDetailPanelProps {
    appEditable?: boolean;
    asSubPanel?: boolean;
    canUpdate: boolean;
    containerFilter?: Query.ContainerFilter;
    containerPath?: string;
    detailEditRenderer?: DetailRenderer;
    detailHeader?: ReactNode;
    detailRenderer?: DetailRenderer;
    disabled?: boolean;
    editColumns?: QueryColumn[];
    model: QueryModel;
    onAdditionalFormDataChange?: (name: string, value: any) => any;
    onBeforeUpdate?: (row: Record<string, any>) => void;
    onCommentChange?: (comment: string) => void;
    onEditToggle?: (editing: boolean) => void;
    onUpdate: () => void;
    queryColumns?: QueryColumn[];
    submitText?: string;
    title?: string;
}

export const EditableDetailPanel: FC<EditableDetailPanelProps> = props => {
    const {
        containerPath,
        model,
        onBeforeUpdate,
        onCommentChange,
        onEditToggle,
        onUpdate,
        appEditable,
        containerFilter,
        disabled,
        detailEditRenderer,
        detailHeader,
        detailRenderer,
        asSubPanel,
        canUpdate,
        editColumns,
        queryColumns,
        submitText = 'Save',
        title,
        onAdditionalFormDataChange,
    } = props;

    const { api } = useAppContext();
    const [canSubmit, setCanSubmit] = useState<boolean>(false);
    const [editing, setEditing] = useState<boolean>(false);
    const [error, setError] = useState<string>(undefined);
    const [warning, setWarning] = useState<string>(undefined);
    const [comment, setComment] = useState<string>();
    const { requiresUserComment } = useDataChangeCommentsRequired();
    const _onCommentChange = useCallback(
        _comment => {
            setComment(_comment);
            onCommentChange?.(_comment);
        },
        [onCommentChange]
    );

    const hasValidUserComment = comment?.trim()?.length > 0;

    const toggleEditing = useCallback((): void => {
        const updated = !editing;
        setEditing(updated);
        setWarning(undefined);
        setError(undefined);
        onEditToggle?.(updated);
    }, [editing, onEditToggle]);

    const disableSubmitButton = useCallback((): void => {
        setCanSubmit(false);
    }, []);

    const enableSubmitButton = useCallback((): void => {
        setCanSubmit(true);
    }, []);

    const handleFormChange = useCallback((): void => {
        setWarning(undefined);
    }, []);

    const fileInputRenderer = useCallback((col: QueryColumn, data: any): ReactNode => {
        return <FileInput formsy initialValue={data} name={col.fieldKey} queryColumn={col} showLabel={false} />;
    }, []);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleSubmit = useCallback(
        async (values: Record<string, any>): Promise<void> => {
            const { queryInfo } = model;
            const row = model.getRow();
            const updatedValues = extractChanges(queryInfo, fromJS(model.getRow()), values);

            if (Object.keys(updatedValues).length === 0) {
                setCanSubmit(false);
                setError(undefined);
                setWarning('No changes detected. Please update the form and click save.');
                return;
            }

            // iterate the set of pkCols for this QueryInfo -- include value from queryData
            queryInfo.getPkCols().forEach(pkCol => {
                const pkVal = row[pkCol.fieldKey]?.value;

                if (pkVal !== undefined && pkVal !== null) {
                    updatedValues[pkCol.fieldKey] = pkVal;
                } else {
                    console.warn('Unable to find value for pkCol "' + pkCol.fieldKey + '"');
                }
            });

            try {
                onBeforeUpdate?.(updatedValues);

                await api.query.updateRows({
                    auditBehavior: AuditBehaviorTypes.DETAILED,
                    containerPath,
                    rows: [updatedValues],
                    schemaQuery: queryInfo.schemaQuery,
                    auditUserComment: comment,
                });

                setEditing(false);
                onUpdate?.(); // eslint-disable-line no-unused-expressions
                onEditToggle?.(false); // eslint-disable-line no-unused-expressions
            } catch (e) {
                setError(resolveErrorMessage(e, 'data', undefined, 'update'));
                setWarning(undefined);
            }
        },
        [model, onBeforeUpdate, api.query, containerPath, comment, onUpdate, onEditToggle]
    );

    const isEditable = !model.isLoading && model.hasRows && (model.queryInfo?.isAppEditable() || appEditable);

    const panel = (
        <div className={`panel ${editing ? 'panel-info' : 'panel-default'}`}>
            <DetailPanelHeader
                isEditable={isEditable && canUpdate}
                editing={editing}
                title={title}
                onClick={toggleEditing}
                warning={warning}
            />

            <div className="panel-body">
                <div className="detail__editing">
                    {error && <Alert>{error}</Alert>}

                    {!editing && (detailHeader ?? null)}

                    {!editing && (
                        <DetailPanel
                            containerFilter={containerFilter}
                            containerPath={containerPath}
                            detailRenderer={detailRenderer}
                            editingMode={false}
                            model={model}
                            queryColumns={queryColumns}
                        />
                    )}

                    {/* When editing load a model that includes the update columns and editing mode rendering */}
                    {editing && (
                        <DetailPanelWithModel
                            containerFilter={containerFilter}
                            containerPath={containerPath}
                            detailEditRenderer={detailEditRenderer}
                            detailRenderer={detailRenderer}
                            editColumns={editColumns}
                            editingMode
                            fileInputRenderer={fileInputRenderer}
                            onAdditionalFormDataChange={onAdditionalFormDataChange}
                            queryConfig={{
                                ...model.queryConfig,
                                // Issue 46478: Include update columns in request columns to ensure values are available
                                requiredColumns: model.requiredColumns.concat(
                                    model.updateColumns.map(col => col.fieldKey)
                                ),
                            }}
                        />
                    )}
                </div>
            </div>
        </div>
    );

    if (editing) {
        return (
            <Formsy
                onChange={handleFormChange}
                onValidSubmit={handleSubmit}
                onValid={enableSubmitButton}
                onInvalid={disableSubmitButton}
            >
                {panel}

                <FormButtons>
                    <button className="btn btn-default" type="button" onClick={toggleEditing}>
                        Cancel
                    </button>
                    <CommentTextArea
                        actionName="Update"
                        containerClassName="inline-comment"
                        onChange={_onCommentChange}
                        requiresUserComment={requiresUserComment}
                        inline
                    />
                    <button
                        className="btn btn-success"
                        type="submit"
                        disabled={!canSubmit || (requiresUserComment && !hasValidUserComment) || disabled}
                    >
                        {submitText}
                    </button>
                </FormButtons>

                {asSubPanel && <div className="panel-divider-padding" />}
            </Formsy>
        );
    }

    return panel;
};

EditableDetailPanel.displayName = 'EditableDetailPanel';
