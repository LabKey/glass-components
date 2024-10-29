import React, { FC, memo, ReactNode, useMemo } from 'react';
import { List, OrderedMap } from 'immutable';
import numeral from 'numeral';
import { Query } from '@labkey/api';

import classNames from 'classnames';

import { DETAIL_TABLE_CLASSES } from '../constants';

import { decodePart } from '../../../../public/SchemaQuery';

import { Operation, QueryColumn } from '../../../../public/QueryColumn';
import { DefaultRenderer } from '../../../renderers/DefaultRenderer';
import { LabelHelpTip } from '../../base/LabelHelpTip';

import { LabelOverlay } from '../LabelOverlay';

import { QuerySelect } from '../QuerySelect';
import { resolveInputRenderer } from '../input/InputRenderFactory';
import { resolveDetailFieldValue } from '../utils';

import { AssayRunReferenceRenderer } from '../../../renderers/AssayRunReferenceRenderer';

import { SampleStatusRenderer } from '../../../renderers/SampleStatusRenderer';
import { TextChoiceInput } from '../input/TextChoiceInput';

import { DatePickerInput } from '../input/DatePickerInput';
import { MultiValueRenderer } from '../../../renderers/MultiValueRenderer';
import { AliasRenderer } from '../../../renderers/AliasRenderer';
import { AppendUnits } from '../../../renderers/AppendUnits';
import { LabelColorRenderer } from '../../../renderers/LabelColorRenderer';
import { FileColumnRenderer } from '../../../renderers/FileColumnRenderer';
import { SampleTypeImportAliasRenderer, SourceTypeImportAliasRenderer } from '../../../renderers/ImportAliasRenderer';
import { SelectInputChange } from '../input/SelectInput';
import { TextAreaInput } from '../input/TextAreaInput';
import { TextInput } from '../input/TextInput';
import { CheckboxInput } from '../input/CheckboxInput';
import { NoLinkRenderer } from '../../../renderers/NoLinkRenderer';
import { UserDetailsRenderer } from '../../../renderers/UserDetailsRenderer';
import { ExpirationDateColumnRenderer } from '../../../renderers/ExpirationDateColumnRenderer';
import { getContainerFilterForLookups } from '../../../query/api';
import { FolderColumnRenderer } from '../../../renderers/FolderColumnRenderer';

export type Renderer = (data: any, row?: any) => ReactNode;

export interface RenderOptions {
    /** A container filter that will be applied to all query-based inputs in this form */
    containerFilter?: Query.ContainerFilter;
    /** A container path that will be applied to all query-based inputs on this form */
    containerPath?: string;
    hideLabel?: boolean;
}

export interface EditRendererOptions extends RenderOptions {
    autoFocus?: boolean;
    onBlur?: () => void;
    onSelectChange?: SelectInputChange;
    placeholder?: string;
}

export type DetailRenderer = (
    column: QueryColumn,
    options?: RenderOptions,
    fileInputRenderer?: (col: QueryColumn, data: any) => ReactNode,
    onAdditionalFormDataChange?: (name: string, value: any) => any
) => Renderer;

export type TitleRenderer = (column: QueryColumn) => ReactNode;

export function defaultTitleRenderer(col: QueryColumn): React.ReactNode {
    // If the column cannot be edited, return the label as is
    if (!col.isEditable()) {
        return <span>{col.caption}</span>;
    }

    return (
        <LabelOverlay
            column={col}
            required={
                col.required || col.nameExpression !== undefined /* Issue 43561: Support name expression fields */
            }
        />
    );
}

export const _defaultRenderer = (col: QueryColumn): Renderer => {
    return data => <DefaultRenderer col={col} data={data} />;
};

function processFields(
    queryColumns: List<QueryColumn>,
    detailRenderer?: DetailRenderer,
    titleRenderer?: TitleRenderer,
    options?: RenderOptions,
    fileInputRenderer?: (col: QueryColumn, data: any) => ReactNode,
    onAdditionalFormDataChange?: (name: string, value: any) => any
): OrderedMap<string, DetailField> {
    return queryColumns.reduce((fields, c) => {
        const fieldKey = c.fieldKey.toLowerCase();

        return fields.set(
            fieldKey,
            new DetailField({
                fieldKey,
                title: c.caption,
                renderer:
                    detailRenderer?.(c, options, fileInputRenderer, onAdditionalFormDataChange) ?? _defaultRenderer(c),
                titleRenderer: titleRenderer ? titleRenderer(c) : <span title={c.fieldKey}>{c.caption}</span>,
            })
        );
    }, OrderedMap<string, DetailField>());
}

interface DetailFieldProps {
    fieldKey: string;
    index?: string;
    renderer: Renderer;
    title: string;
    titleRenderer: ReactNode;
}

// TODO: export this class and make users import the set of fields or indexes
class DetailField {
    fieldKey: string;
    index?: string;
    title: string;
    renderer: Renderer;
    titleRenderer: ReactNode;

    constructor(config: DetailFieldProps) {
        this.fieldKey = config.fieldKey;
        this.index = config.index;
        this.title = config.title;
        this.renderer = config.renderer;
        this.titleRenderer = config.titleRenderer;
    }
}

export interface DetailDisplaySharedProps extends RenderOptions {
    asPanel?: boolean;
    detailEditRenderer?: DetailRenderer;
    detailRenderer?: DetailRenderer;
    editingMode?: boolean;
    fieldHelpTexts?: Record<string, string>;
    fileInputRenderer?: (col: QueryColumn, data: any) => ReactNode;
    onAdditionalFormDataChange?: (name: string, value: any) => any;
    tableCls?: string;
    titleRenderer?: TitleRenderer;
}

interface DetailDisplayProps extends DetailDisplaySharedProps {
    data: any;
    displayColumns: List<QueryColumn>;
}

export const DetailDisplay: FC<DetailDisplayProps> = memo(props => {
    const {
        asPanel = false,
        containerFilter,
        containerPath,
        data,
        displayColumns,
        editingMode = false,
        fileInputRenderer,
        fieldHelpTexts,
        onAdditionalFormDataChange,
        tableCls,
    } = props;

    const detailRenderer = useMemo(() => {
        if (editingMode) {
            return props.detailEditRenderer ?? resolveDetailEditRenderer;
        }
        return props.detailRenderer ?? resolveDetailRenderer;
    }, [props.detailRenderer, props.detailEditRenderer, editingMode]);

    const titleRenderer = useMemo(() => {
        return props.titleRenderer ?? (editingMode ? defaultTitleRenderer : undefined);
    }, [props.titleRenderer, editingMode]);

    let body;

    if (data.size === 0) {
        body = <div>No data available.</div>;
    } else {
        const options = { containerFilter, containerPath } as RenderOptions;
        if (editingMode) options.hideLabel = true;

        const fields = processFields(
            displayColumns,
            detailRenderer,
            titleRenderer,
            options,
            fileInputRenderer,
            onAdditionalFormDataChange
        );

        body = (
            <div>
                {data.map((row: any, i: number) => {
                    // key safety
                    const newRow = row.reduce((newRow, value, key) => {
                        return newRow.set(key.toLowerCase(), value);
                    }, OrderedMap<string, any>());

                    return (
                        <table className={classNames(DETAIL_TABLE_CLASSES, tableCls)} key={i}>
                            <tbody>
                                {fields
                                    .map((field, key) => {
                                        const labelHelp = fieldHelpTexts?.[key];
                                        // 'data-caption' tag for test hooks
                                        return (
                                            <tr key={key}>
                                                <td>
                                                    {field.titleRenderer}
                                                    {labelHelp && (
                                                        <LabelHelpTip
                                                            popoverClassName="detail-display-label-help-tip-popover"
                                                            title={field.title}
                                                        >
                                                            {labelHelp}
                                                        </LabelHelpTip>
                                                    )}
                                                </td>
                                                <td
                                                    className="text__wrap"
                                                    data-caption={field.title}
                                                    data-fieldkey={field.fieldKey}
                                                >
                                                    {field.renderer(
                                                        newRow.get(decodePart(key)) ?? newRow.get(key),
                                                        row
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })
                                    .toArray()}
                            </tbody>
                        </table>
                    );
                })}
            </div>
        );
    }

    if (asPanel) {
        return (
            <div className="panel panel-default">
                <div className="panel-heading">Details</div>
                <div className="panel-body">{body}</div>
            </div>
        );
    }

    return body;
});

DetailDisplay.displayName = 'DetailDisplay';

function detailNonEditableRenderer(col: QueryColumn, data: any): ReactNode {
    return <div className="field__un-editable">{_defaultRenderer(col)(data)}</div>;
}

const DETAIL_INPUT_WRAPPER_CLASS_NAME = 'col-sm-12';

// TODO: Merge this functionality with <QueryFormInputs />
export function resolveDetailEditRenderer(
    col: QueryColumn,
    options?: EditRendererOptions,
    fileInputRenderer = detailNonEditableRenderer,
    onAdditionalFormDataChange?: (name: string, value: any) => any
): Renderer {
    return (data, row) => {
        // If the column cannot be edited, return as soon as possible
        // Render the value with the defaultRenderer and a class that grays it out
        if (!col.isEditable()) {
            return detailNonEditableRenderer(col, data);
        }

        const showLabel = !options?.hideLabel ?? false;
        let value = resolveDetailFieldValue(data);

        const ColumnInputRenderer = resolveInputRenderer(col);
        if (ColumnInputRenderer) {
            return (
                <ColumnInputRenderer
                    col={col}
                    containerFilter={options?.containerFilter}
                    containerPath={options?.containerPath}
                    data={row}
                    formsy
                    inputClass={DETAIL_INPUT_WRAPPER_CLASS_NAME}
                    key={col.name}
                    onAdditionalFormDataChange={onAdditionalFormDataChange}
                    onSelectChange={options?.onSelectChange}
                    selectInputProps={{ inputClass: DETAIL_INPUT_WRAPPER_CLASS_NAME, showLabel }}
                    showLabel={showLabel}
                    value={value}
                />
            );
        }

        if (col.isPublicLookup()) {
            // undefined 'displayAsLookup' just respects the lookup.
            // Must be explicitly false to prevent drop-down.
            if (col.displayAsLookup !== false) {
                // Issue 29232: When displaying a lookup, always use the value
                const multiple = col.isJunctionLookup();
                const joinValues = multiple && !col.isDataInput();
                const queryFilters = col.lookup.hasQueryFilters(Operation.update)
                    ? List(col.lookup.getQueryFilters(Operation.update))
                    : undefined;

                return (
                    <QuerySelect
                        autoFocus={options?.autoFocus}
                        containerFilter={
                            col.lookup.containerFilter ?? options?.containerFilter ?? getContainerFilterForLookups()
                        }
                        containerPath={col.lookup.containerPath ?? options?.containerPath}
                        description={col.description}
                        displayColumn={col.lookup.displayColumn}
                        formsy
                        inputClass={DETAIL_INPUT_WRAPPER_CLASS_NAME}
                        joinValues={joinValues}
                        key={col.fieldKey}
                        label={col.caption}
                        maxRows={10}
                        multiple={multiple}
                        name={col.name}
                        onBlur={options?.onBlur}
                        onQSChange={options?.onSelectChange}
                        placeholder={options?.placeholder ?? 'Select or type to search...'}
                        queryFilters={queryFilters}
                        required={col.required}
                        schemaQuery={col.lookup.schemaQuery}
                        showLabel={showLabel}
                        value={value}
                        valueColumn={col.lookup.keyColumn}
                    />
                );
            }
        }

        if (col.validValues) {
            return (
                <TextChoiceInput
                    formsy
                    inputClass={DETAIL_INPUT_WRAPPER_CLASS_NAME}
                    queryColumn={col}
                    value={value}
                    autoFocus={options?.autoFocus}
                    onBlur={options?.onBlur}
                    onChange={options?.onSelectChange}
                    placeholder={options?.placeholder ?? 'Select or type to search...'}
                    showLabel={showLabel}
                />
            );
        }

        if (col.inputType === 'textarea') {
            return (
                <TextAreaInput
                    cols={4}
                    elementWrapperClassName={DETAIL_INPUT_WRAPPER_CLASS_NAME}
                    queryColumn={col}
                    rows={4}
                    showLabel={showLabel}
                    validatePristine
                    value={value}
                />
            );
        }

        if (col.inputType === 'file') {
            return fileInputRenderer(col, data);
        }

        switch (col.jsonType) {
            case 'boolean':
                return (
                    <CheckboxInput
                        queryColumn={col}
                        showLabel={showLabel}
                        value={value && value.toString().toLowerCase() === 'true'}
                        wrapperClassName={DETAIL_INPUT_WRAPPER_CLASS_NAME}
                    />
                );
            case 'date':
            case 'time':
                if (!value || typeof value === 'string') {
                    return (
                        <DatePickerInput
                            queryColumn={col}
                            showLabel={showLabel}
                            value={value}
                            wrapperClassName={DETAIL_INPUT_WRAPPER_CLASS_NAME}
                            initValueFormatted
                        />
                    );
                }
            default:
                let validationError;

                if (col.jsonType === 'int' || col.jsonType === 'float') {
                    const unformat = value ? numeral(value).value() : value;
                    if (unformat !== undefined && unformat !== null) {
                        value = unformat.toString();
                    }
                    validationError = 'Expected type: ' + col.jsonType;
                }

                return (
                    <TextInput
                        elementWrapperClassName={DETAIL_INPUT_WRAPPER_CLASS_NAME}
                        queryColumn={col}
                        // Issue 43561: Support name expression fields
                        // NK: If a name expression is applied, then the server does not mark the field as required as
                        // it will be generated. This is OK for the insert scenario, however, for update a value is
                        // still required as the name expression won't be run upon update. Here we mark the input as
                        // required if the nameExpression is not defined to force the form to require a value.
                        required={col.required || col.nameExpression !== undefined}
                        showLabel={showLabel}
                        validatePristine
                        validationError={validationError}
                        value={value}
                    />
                );
        }
    };
}

export function resolveDetailRenderer(column: QueryColumn): Renderer {
    let renderer; // defaults to undefined -- leave it up to the details

    if (column?.detailRenderer) {
        switch (column.detailRenderer.toLowerCase()) {
            case 'multivaluedetailrenderer':
                renderer = d => <MultiValueRenderer data={d} />;
                break;
            case 'aliasrenderer':
                renderer = d => <AliasRenderer data={d} view="detail" />;
                break;
            case 'appendunits':
                renderer = d => <AppendUnits data={d} col={column} />;
                break;
            case 'assayrunreference':
                renderer = d => <AssayRunReferenceRenderer data={d} />;
                break;
            case 'labelcolorrenderer':
                renderer = d => <LabelColorRenderer data={d} />;
                break;
            case 'filecolumnrenderer':
                renderer = d => <FileColumnRenderer data={d} col={column} />;
                break;
            case 'foldercolumnrenderer':
                renderer = d => <FolderColumnRenderer data={d} />;
                break;
            case 'nolinkrenderer':
                renderer = d => <NoLinkRenderer data={d} />;
                break;
            case 'sampletypeimportaliasrenderer':
                renderer = d => <SampleTypeImportAliasRenderer data={d} />;
                break;
            case 'sourcetypeimportaliasrenderer':
                renderer = d => <SourceTypeImportAliasRenderer data={d} />;
                break;
            case 'samplestatusrenderer':
                renderer = (d, r) => <SampleStatusRenderer row={r} />;
                break;
            case 'userdetailsrenderer':
                renderer = d => <UserDetailsRenderer data={d} />;
                break;
            case 'expirationdatecolumnrenderer':
                renderer = d => <ExpirationDateColumnRenderer data={d} col={column} tableCell={false} />;
                break;
            default:
                break;
        }
    }

    return renderer;
}
