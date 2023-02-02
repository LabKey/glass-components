import React, { FC, memo, ReactNode, useMemo } from 'react';
import { List, OrderedMap } from 'immutable';
import { Panel } from 'react-bootstrap';
import { Query } from '@labkey/api';

import { DETAIL_TABLE_CLASSES } from '../constants';

import { decodePart } from '../../../../public/SchemaQuery';

import { QueryColumn } from '../../../../public/QueryColumn';
import { DefaultRenderer } from '../../../renderers/DefaultRenderer';
import { LabelHelpTip } from '../../base/LabelHelpTip';

import { LabelOverlay } from '../LabelOverlay';

import { QuerySelect } from '../QuerySelect';
import { resolveInputRenderer } from '../input/InputRenderFactory';
import { resolveDetailFieldValue } from '../utils';

import { AssayRunReferenceRenderer } from '../../../renderers/AssayRunReferenceRenderer';

import { getUnFormattedNumber } from '../../../util/Date';

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
    titleRenderer?: TitleRenderer;
}

interface DetailDisplayProps extends DetailDisplaySharedProps {
    data: any;
    displayColumns: List<QueryColumn>;
}

export const DetailDisplay: FC<DetailDisplayProps> = memo(props => {
    const {
        asPanel,
        containerFilter,
        containerPath,
        data,
        displayColumns,
        editingMode,
        fileInputRenderer,
        fieldHelpTexts,
        onAdditionalFormDataChange,
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
                        <table className={DETAIL_TABLE_CLASSES} key={i}>
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
                                                        <LabelHelpTip title={field.title}>{labelHelp}</LabelHelpTip>
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
            <Panel>
                <Panel.Heading>Details</Panel.Heading>
                <Panel.Body>{body}</Panel.Body>
            </Panel>
        );
    }

    return body;
});

DetailDisplay.defaultProps = {
    asPanel: false,
    editingMode: false,
};

DetailDisplay.displayName = 'DetailDisplay';

function detailNonEditableRenderer(col: QueryColumn, data: any): ReactNode {
    return <div className="field__un-editable">{_defaultRenderer(col)(data)}</div>;
}

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
        let value = resolveDetailFieldValue(data, col.isLookup());

        const ColumnInputRenderer = resolveInputRenderer(col);
        if (ColumnInputRenderer) {
            return (
                <ColumnInputRenderer
                    col={col}
                    containerFilter={options?.containerFilter}
                    containerPath={options?.containerPath}
                    data={row}
                    formsy
                    inputClass="col-sm-12"
                    key={col.name}
                    onAdditionalFormDataChange={onAdditionalFormDataChange}
                    onSelectChange={options?.onSelectChange}
                    selectInputProps={{ inputClass: 'col-sm-12', showLabel }}
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

                return (
                    <QuerySelect
                        key={col.fieldKey}
                        containerFilter={col.lookup.containerFilter ?? options?.containerFilter}
                        containerPath={col.lookup.containerPath ?? options?.containerPath}
                        description={col.description}
                        displayColumn={col.lookup.displayColumn}
                        formsy
                        inputClass="col-sm-12"
                        joinValues={joinValues}
                        label={col.caption}
                        maxRows={10}
                        multiple={multiple}
                        name={col.name}
                        autoFocus={options?.autoFocus}
                        onBlur={options?.onBlur}
                        onQSChange={options?.onSelectChange}
                        placeholder={options?.placeholder ?? 'Select or type to search...'}
                        required={col.required}
                        schemaQuery={col.lookup.schemaQuery}
                        showLabel={showLabel}
                        value={resolveDetailFieldValue(data, true)}
                        valueColumn={col.lookup.keyColumn}
                    />
                );
            }
        }

        if (col.validValues) {
            return (
                <TextChoiceInput
                    formsy
                    inputClass="col-sm-12"
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
                    elementWrapperClassName={[{ 'col-sm-9': false }, 'col-sm-12']}
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
                // boolean checkbox state needs to be based off of the data value (not formattedValue)
                value = resolveDetailFieldValue(data, false, true);

                return (
                    <CheckboxInput
                        queryColumn={col}
                        showLabel={showLabel}
                        value={value && value.toString().toLowerCase() === 'true'}
                        wrapperClassName="col-sm-12"
                    />
                );
            case 'date':
                if (!value || typeof value === 'string') {
                    return (
                        <DatePickerInput
                            queryColumn={col}
                            showLabel={showLabel}
                            value={value}
                            wrapperClassName="col-sm-12"
                        />
                    );
                }
            default:
                let validationError;

                if (col.jsonType === 'int' || col.jsonType === 'float') {
                    const unformat = getUnFormattedNumber(value);
                    if (unformat !== undefined && unformat !== null) {
                        value = unformat.toString();
                    }
                    validationError = 'Expected type: ' + col.jsonType;
                }

                return (
                    <TextInput
                        elementWrapperClassName={[{ 'col-sm-9': false }, 'col-sm-12']}
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
            default:
                break;
        }
    }

    return renderer;
}
