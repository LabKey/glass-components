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
import React, { ReactNode } from 'react';
import { Checkbox, Input, Textarea } from 'formsy-react-components';

import { LabelOverlay } from '../LabelOverlay';
import {
    AliasRenderer,
    AppendUnits,
    QueryDateInput,
    DatePickerInput,
    FileColumnRenderer,
    LabelColorRenderer,
    MultiValueRenderer,
    QueryColumn,
    SchemaQuery,
    SampleTypeImportAliasRenderer,
    SourceTypeImportAliasRenderer,
} from '../../../..';

import { QuerySelect } from '../QuerySelect';
import { resolveDetailFieldValue, resolveRenderer } from '../renderers';

import { AssayRunReferenceRenderer } from '../../../renderers/AssayRunReferenceRenderer';

import { getUnFormattedNumber } from '../../../util/Date';

import { _defaultRenderer, Renderer, RenderOptions } from './DetailDisplay';

export function titleRenderer(col: QueryColumn): React.ReactNode {
    // If the column cannot be edited, return the label as is
    if (!col.isEditable()) {
        return <span className="field__un-editable">{col.caption}</span>;
    }

    return <LabelOverlay column={col} />;
}

function detailNonEditableRenderer(col: QueryColumn, data: any): ReactNode {
    return <div className="field__un-editable">{_defaultRenderer(data)}</div>;
}

// TODO: Merge this functionality with <QueryFormInputs />
export function resolveDetailEditRenderer(
    col: QueryColumn,
    options?: RenderOptions,
    fileInputRenderer = detailNonEditableRenderer
): Renderer {
    return data => {
        const editable = col.isEditable();

        // If the column cannot be edited, return as soon as possible
        // Render the value with the defaultRenderer and a class that grays it out
        if (!editable) {
            return detailNonEditableRenderer(col, data);
        }

        let value = resolveDetailFieldValue(data, false);

        if (col.inputRenderer) {
            const renderer = resolveRenderer(col);

            if (renderer) {
                return renderer(col, col.name, value, true);
            }

            throw new Error(`"${col.inputRenderer}" is not a valid inputRenderer.`);
        }

        if (col.isPublicLookup()) {
            // undefined 'displayAsLookup' just respects the lookup.
            // Must be explicitly false to prevent drop-down.
            if (col.displayAsLookup !== false) {
                // 29232: When displaying a lookup, always use the value
                const multiple = col.isJunctionLookup();
                const joinValues = multiple && !col.isDataInput();

                return (
                    <QuerySelect
                        componentId={col.fieldKey}
                        displayColumn={col.lookup.displayColumn}
                        inputClass="col-sm-12"
                        joinValues={joinValues}
                        label={col.caption}
                        maxRows={10}
                        multiple={multiple}
                        name={col.name}
                        placeholder="Select or type to search..."
                        required={col.required}
                        schemaQuery={SchemaQuery.create(col.lookup.schemaName, col.lookup.queryName)}
                        value={resolveDetailFieldValue(data, true)}
                        valueColumn={col.lookup.keyColumn}
                        containerPath={col.lookup.containerPath}
                    />
                );
            }
        }

        if (col.inputType === 'textarea') {
            return (
                <Textarea
                    changeDebounceInterval={0}
                    cols={4}
                    elementWrapperClassName={[{ 'col-sm-9': false }, 'col-sm-12']}
                    name={col.name}
                    required={col.required}
                    rows={4}
                    validatePristine={true}
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
                    <Checkbox
                        name={col.name}
                        // Issue 43299: Ignore "required" property for boolean columns as this will
                        // cause any false value (i.e. unchecked) to prevent submission.
                        // required={col.required}
                        validatePristine={true}
                        value={value && value.toString().toLowerCase() === 'true'}
                    />
                );
            case 'date':
                if (options?.useDatePicker && (!value || typeof value === 'string')) {
                    return (
                        <DatePickerInput
                            showLabel={false}
                            wrapperClassName="col-sm-12"
                            name={col.name}
                            queryColumn={col}
                            value={value}
                        />
                    );
                } else if (typeof value === 'string') {
                    return (
                        <QueryDateInput
                            showLabel={false}
                            elementWrapperClassName={[{ 'col-sm-9': false }, 'col-sm-12']}
                            name={col.name}
                            queryColumn={col}
                            validatePristine={true}
                            value={value}
                        />
                    );
                }
            default:
                let validations, validationError;

                if (col.jsonType === 'int' || col.jsonType === 'float') {
                    const unformat = getUnFormattedNumber(value);
                    if (unformat !== undefined && unformat !== null) {
                        value = unformat.toString();
                    }
                    validations = col.jsonType === 'int' ? 'isInt' : 'isFloat';
                    validationError = 'Expected type: ' + col.jsonType;
                }

                return (
                    <Input
                        changeDebounceInterval={0}
                        type="text"
                        name={col.name}
                        validatePristine={true}
                        validations={validations}
                        validationError={validationError}
                        value={value}
                        required={col.required}
                        elementWrapperClassName={[{ 'col-sm-9': false }, 'col-sm-12']}
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
            case 'sampletypeimportaliasrenderer':
                renderer = d => <SampleTypeImportAliasRenderer data={d} />;
                break;
            case 'sourcetypeimportaliasrenderer':
                renderer = d => <SourceTypeImportAliasRenderer data={d} />;
                break;
            default:
                break;
        }
    }

    return renderer;
}
