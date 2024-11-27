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
import React, { PureComponent, ReactNode } from 'react';
import { Filter, getServerContext, Utils } from '@labkey/api';
import { List, OrderedMap } from 'immutable';

import { Operation } from '../../../public/QueryColumn';

import { Container } from '../base/models/Container';

import { Modal } from '../../Modal';
import { MAX_EDITABLE_GRID_ROWS } from '../../constants';
import { FormButtons } from '../../FormButtons';

import { EntityCreationTypeModel } from '../samples/models';
import { QueryInfo } from '../../../public/QueryInfo';
import { formatDate, formatDateTime } from '../../util/Date';
import { Alert } from '../base/Alert';
import { LoadingSpinner } from '../base/LoadingSpinner';

import { getAppHomeFolderPath } from '../../app/utils';

import { ComponentsAPIWrapper, getDefaultAPIWrapper } from '../../APIWrapper';

import { Formsy } from './formsy';

import { QueryInfoQuantity } from './QueryInfoQuantity';
import { QueryFormInputs, QueryFormInputsProps } from './QueryFormInputs';
import { getFieldEnabledFieldName } from './utils';
import { CommentTextArea } from './input/CommentTextArea';

export interface QueryInfoFormProps extends Omit<QueryFormInputsProps, 'onFieldsEnabledChange'> {
    api?: ComponentsAPIWrapper;
    asModal?: boolean;
    canSubmitNotDirty?: boolean;
    cancelText?: string;
    countText?: string;
    creationTypeOptions?: EntityCreationTypeModel[];
    disabled?: boolean;
    errorCallback?: (error: any) => void;
    errorMessagePrefix?: string;
    footer?: ReactNode;
    header?: ReactNode;
    hideButtons?: boolean;
    includeCommentField?: boolean;
    includeCountField?: boolean;
    isLoading?: boolean;
    isSubmittedText?: string;
    isSubmittingText?: string;
    maxCount?: number;
    onFormChange?: () => void;
    // allow passing of full form data, compare with onFormChange
    onFormChangeWithData?: (formData?: any) => void;
    onHide?: () => void;
    onSubmit?: (data: OrderedMap<string, any>, comment?: string) => Promise<any>;
    onSubmitForEdit?: (data: OrderedMap<string, any>, comment?: string) => Promise<any>;
    onSuccess?: (data: any, submitForEdit: boolean, comment?: string) => void;
    operation?: Operation;
    pluralNoun?: string;
    queryFilters?: Record<string, List<Filter.IFilter>>;
    // required by QueryInfoForm
    queryInfo: QueryInfo; // for filtering lookup values in the form
    showErrorsAtBottom?: boolean;
    singularNoun?: string;
    stickyButtons?: boolean;
    submitForEditText?: string;
    submitText?: string;
    title?: string;
}

interface State {
    canSubmit: boolean;
    comment: string;
    count: number;
    errorMsg: string;
    fieldEnabledCount: number;
    isDirty: boolean;
    isSubmitted: boolean;
    isSubmitting: boolean;
    requiresUserComment: boolean;
    submitForEdit: boolean;
}

export class QueryInfoForm extends PureComponent<QueryInfoFormProps, State> {
    formRef: React.RefObject<Formsy>;

    static defaultProps: Partial<QueryInfoFormProps> = {
        api: getDefaultAPIWrapper(),
        canSubmitNotDirty: true,
        includeCountField: true,
        countText: 'Quantity',
        cancelText: 'Cancel',
        stickyButtons: true,
        submitForEditText: 'Edit with Grid',
        submitText: 'Submit',
        isSubmittedText: 'Submitted',
        isSubmittingText: 'Submitting...',
        maxCount: MAX_EDITABLE_GRID_ROWS,
        creationTypeOptions: [],
        pluralNoun: 'rows',
    };

    constructor(props: QueryInfoFormProps) {
        super(props);

        this.formRef = React.createRef();

        this.state = {
            fieldEnabledCount: !props.allowFieldDisable || !props.initiallyDisableFields ? 1 : 0, // initial value of 1 is really just a boolean at this point
            canSubmit: !props.includeCountField && !props.checkRequiredFields,
            isSubmitted: false,
            isSubmitting: false,
            isDirty: false,
            errorMsg: undefined,
            count: undefined,
            submitForEdit: false,
            comment: undefined,
            requiresUserComment: true,
        };
    }

    componentDidMount() {
        const { api, includeCommentField } = this.props;
        if (includeCommentField) {
            (async () => {
                try {
                    const { container } = getServerContext();
                    const response = await api.folder.getAuditSettings(getAppHomeFolderPath(new Container(container)));
                    this.setState({ requiresUserComment: !!response?.requireUserComments });
                } catch {
                    this.setState({ requiresUserComment: false });
                }
            })();
        }
    }

    enableSubmitButton = (): void => {
        if (this.state.fieldEnabledCount > 0) this.setState({ canSubmit: true });
    };

    disableSubmitButton = (): void => {
        this.setState({ canSubmit: false });
    };

    handleChange = (): void => {
        const { onFormChange, onFormChangeWithData } = this.props;

        onFormChange?.();

        // for tabbed bulk edit/editable grid, needs a way to pass form data from bulk to editable grid without submit
        if (onFormChangeWithData) {
            const row = this.formRef?.['current']?.['getModel']?.();
            if (row) {
                const updatedRow = this.getUpdatedFields(row, ['numItems', 'creationType']);
                onFormChangeWithData(updatedRow);
            }
        }

        if (!this.state.isDirty) {
            this.setState({ isDirty: true });
        }
    };

    handleSubmitError = (error: any): void => {
        console.error(error);
        const errorMsg = error ? error.exception : 'Your session may have expired or the form may no longer be valid.';
        this.setState({
            errorMsg: 'There was an error submitting the data. ' + errorMsg, // TODO add some actionable text here
            isSubmitting: false,
        });
    };

    getUpdatedFields = (data: any, additionalFields?: string[]): OrderedMap<string, any> => {
        const { submitForEdit } = this.state;

        const fieldsToUpdate = this.props.queryInfo.columns.filter(column => {
            const enabledKey = getFieldEnabledFieldName(column);
            return data[enabledKey] === undefined || data[enabledKey] === 'true';
        });

        let filteredData = OrderedMap<string, any>();
        for (const key in data) {
            if (data.hasOwnProperty(key)) {
                if (fieldsToUpdate.has(key.toLowerCase()) || additionalFields.indexOf(key) !== -1) {
                    // Date values are Dates not strings. We convert them to strings in the desired format here.
                    // They are converted back to Dates when saving to the server.
                    const col = this.props.queryInfo?.getColumn(key);
                    if (submitForEdit && col?.jsonType === 'date') {
                        if (col.isDateOnlyColumn)
                            filteredData = filteredData.set(key, formatDate(data[key], null, col.format));
                        else filteredData = filteredData.set(key, formatDateTime(data[key], null, col.format));
                    } else if (col?.jsonType === 'string' && typeof data[key] === 'string') {
                        filteredData = filteredData.set(key, data[key]?.trim());
                    } else {
                        filteredData = filteredData.set(key, data[key]);
                    }
                }
            }
        }

        return filteredData;
    };

    handleValidSubmit = (row: any): void => {
        const { errorCallback, onSubmit, onSubmitForEdit, onSuccess } = this.props;
        const { submitForEdit, comment } = this.state;

        this.setState({
            errorMsg: undefined,
            isSubmitting: true,
        });
        const updatedRow = this.getUpdatedFields(row, ['numItems', 'creationType']);
        const submitFn = submitForEdit ? onSubmitForEdit : onSubmit;

        submitFn(updatedRow, comment).then(
            data => {
                this.setState({
                    errorMsg: undefined,
                    isSubmitted: true,
                    isSubmitting: false,
                    isDirty: false,
                });
                if (Utils.isFunction(onSuccess)) {
                    return onSuccess(data, submitForEdit, comment);
                }
            },
            error => {
                this.handleSubmitError(error);
                if (Utils.isFunction(errorCallback)) {
                    return errorCallback(error);
                }
            }
        );
    };

    isValid = (count: number): boolean => {
        const { maxCount } = this.props;

        return !maxCount || (count !== undefined && count > 0 && count <= maxCount);
    };

    renderError = (): ReactNode => {
        const { errorMessagePrefix } = this.props;
        const { errorMsg } = this.state;
        if (errorMsg) {
            return (
                <Alert>
                    {errorMessagePrefix && <strong>{errorMessagePrefix}</strong>} {errorMsg}
                </Alert>
            );
        }
        return null;
    };

    setSubmittingForEdit = (): void => {
        this.setSubmitting(true);
    };

    setSubmittingForSave = (): void => {
        this.setSubmitting(false);
    };

    setSubmitting = (submitForEdit: boolean): void => {
        this.setState({ submitForEdit }, () => {
            // HACK: when we're rendering as a modal we render the buttons outside the Formsy form, so we need to
            // manually trigger submit via the ref, and we have to do it after the state has been updated or the Edit in
            // Grid button will not work.
            if (this.props.asModal) {
                this.formRef.current.submit();
            }
        });
    };

    onHide = (): void => {
        this.props.onHide?.();
    };

    onCountChange = (count: number): void => {
        this.setState({ count });
    };

    onCommentChange = (comment: string): void => {
        this.setState({ comment });
    };

    onFieldsEnabledChange = (fieldEnabledCount: number): void => {
        this.setState({ fieldEnabledCount });
    };

    renderButtons = (): ReactNode => {
        const {
            asModal,
            cancelText,
            canSubmitNotDirty,
            disabled,
            includeCommentField,
            submitForEditText,
            submitText,
            isSubmittedText,
            isSubmittingText,
            onSubmit,
            onSubmitForEdit,
            pluralNoun,
            singularNoun,
            stickyButtons,
            hideButtons,
        } = this.props;

        const {
            count,
            comment,
            canSubmit,
            fieldEnabledCount,
            isSubmitting,
            isSubmitted,
            submitForEdit,
            isDirty,
            requiresUserComment,
        } = this.state;

        if (hideButtons) return null;

        const hasValidUserComment = comment?.trim()?.length > 0;

        const inProgressText = isSubmitted ? isSubmittedText : isSubmitting ? isSubmittingText : undefined;
        const suffix = count > 1 ? pluralNoun : singularNoun;
        const showCancel = this.props.onHide !== undefined || this.props.asModal;

        return (
            <FormButtons sticky={stickyButtons && !asModal}>
                {showCancel && (
                    <button className="test-loc-cancel-button btn btn-default" onClick={this.onHide} type="button">
                        {cancelText}
                    </button>
                )}

                {includeCommentField && (
                    <CommentTextArea
                        actionName="Update"
                        containerClassName="inline-comment"
                        onChange={this.onCommentChange}
                        requiresUserComment={requiresUserComment}
                        inline
                    />
                )}

                {onSubmitForEdit && submitForEditText && (
                    <button
                        className={`test-loc-submit-for-edit-button btn btn-${onSubmit ? 'default' : 'success'}`}
                        disabled={disabled || isSubmitting || !canSubmit || count === 0}
                        onClick={this.setSubmittingForEdit}
                        type="submit"
                    >
                        {submitForEdit && inProgressText ? inProgressText : submitForEditText}
                    </button>
                )}

                {submitText && onSubmit && (
                    <button
                        className="test-loc-submit-button btn btn-success"
                        disabled={
                            disabled ||
                            isSubmitting ||
                            fieldEnabledCount === 0 ||
                            !canSubmit ||
                            count === 0 ||
                            !(canSubmitNotDirty || isDirty) ||
                            (includeCommentField && requiresUserComment && !hasValidUserComment)
                        }
                        onClick={this.setSubmittingForSave}
                        type="submit"
                    >
                        {!submitForEdit && inProgressText ? inProgressText : submitText}
                        {suffix ? ' ' + suffix : null}
                    </button>
                )}
            </FormButtons>
        );
    };

    render() {
        // Include all props to support extraction of queryFormInputProps
        const {
            api,
            asModal,
            canSubmitNotDirty,
            cancelText,
            countText,
            creationTypeOptions,
            errorCallback,
            footer,
            header,
            includeCountField,
            includeCommentField,
            isLoading,
            isSubmittedText,
            isSubmittingText,
            maxCount,
            onFormChange,
            onHide,
            onSubmit,
            onSubmitForEdit,
            onSuccess,
            pluralNoun,
            showErrorsAtBottom,
            singularNoun,
            submitForEditText,
            submitText,
            title,
            ...queryFormInputProps
        } = this.props;
        const { queryInfo } = queryFormInputProps;

        if (!queryInfo || queryInfo.isLoading) {
            return null;
        }
        let content;
        const showQuantityHeader = includeCountField || creationTypeOptions.length > 0;
        if (isLoading) {
            content = <LoadingSpinner />;
        } else {
            content = (
                <div className="query-info-form">
                    {header}
                    {!showErrorsAtBottom && this.renderError()}
                    <Formsy
                        className="form-horizontal"
                        onValidSubmit={this.handleValidSubmit}
                        onValid={this.enableSubmitButton}
                        onChange={this.handleChange}
                        onInvalid={this.disableSubmitButton}
                        ref={this.formRef}
                    >
                        <QueryInfoQuantity
                            creationTypeOptions={creationTypeOptions}
                            includeCountField={includeCountField}
                            maxCount={maxCount}
                            countText={countText}
                            onCountChange={this.onCountChange}
                        />
                        {(header || showQuantityHeader) && <hr />}
                        <QueryFormInputs
                            {...queryFormInputProps}
                            onFieldsEnabledChange={this.onFieldsEnabledChange}
                            pluralNoun={pluralNoun}
                        />
                        {footer}
                        {showErrorsAtBottom && this.renderError()}
                        {!asModal && this.renderButtons()}
                    </Formsy>
                </div>
            );
        }

        if (asModal) {
            return (
                <Modal
                    bsSize="lg"
                    className="form-modal"
                    footer={this.renderButtons()}
                    onCancel={this.onHide}
                    title={title}
                >
                    {content}
                </Modal>
            );
        }

        return content;
    }
}
