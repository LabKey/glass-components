import React, { FC, memo, useCallback, useEffect, useMemo, useState } from 'react';
import classNames from 'classnames';

import { List } from 'immutable';

import { FIELD_EDITOR_CALC_COLS_TOPIC, HelpLink, LABKEY_SQL_TOPIC } from '../../util/helpLinks';

import { resolveErrorMessage } from '../../util/messaging';

import { createFormInputId, createFormInputName } from './utils';
import { DOMAIN_FIELD_CLIENT_SIDE_ERROR, DOMAIN_FIELD_VALUE_EXPRESSION, SEVERITY_LEVEL_WARN } from './constants';
import { DomainField, DomainFieldError, SystemField } from './models';
import { SectionHeading } from './SectionHeading';
import { isFieldFullyLocked, isFieldPartiallyLocked } from './propertiesUtil';
import { CALCULATED_TYPE, PropDescType } from './PropDescType';
import { parseCalculatedColumn } from './actions';

// export for jest testing
export const typeToDisplay = (type: string): string => {
    if (!type || type.toLowerCase() === 'other') {
        return 'Unknown';
    } else if (type.toLowerCase() === 'int' || type.toLowerCase() === 'integer') {
        return 'Integer';
    } else if (type.toLowerCase() === 'double' || type.toLowerCase() === 'decimal') {
        return 'Decimal (floating point)';
    } else if (type.toLowerCase() === 'varchar') {
        return 'Text';
    } else if (type.toLowerCase() === 'date') {
        return 'Date Time';
    }
    return type;
};

// export for jest testing
export const getColumnTypeMap = (
    domainFields: List<DomainField>,
    systemFields: SystemField[]
): Record<string, string> => {
    const colTypeMap = {};
    // Issue 51169: add some default system fields
    colTypeMap['Created'] = 'DATETIME';
    colTypeMap['CreatedBy'] = 'INTEGER';
    colTypeMap['Modified'] = 'DATETIME';
    colTypeMap['ModifiedBy'] = 'INTEGER';

    systemFields?.forEach(df => {
        colTypeMap[df.Name] = df.DataType.toUpperCase();
    });
    domainFields?.forEach(df => {
        if (df.dataType.name !== CALCULATED_TYPE.name) {
            colTypeMap[df.name] = df.dataType.name.toLowerCase() === 'int' ? 'INTEGER' : df.dataType.name.toUpperCase();
        }
    });
    return colTypeMap;
};

export const getPHIColumnNames = (domainFields: List<DomainField>): string[] => {
    if (!domainFields) return [];

    return domainFields
        .filter(df => df.isPHI())
        .map(df => df.name)
        .toArray();
};

const HELP_TIP_BODY = (
    <div className="domain-field-fixed-tooltip">
        <p>Define the SQL expression to use for this calculated field.</p>
        <p>
            The expression must be valid LabKey SQL and can use the default system fields, custom fields, constants, and
            operators. Learn more about using <HelpLink topic={LABKEY_SQL_TOPIC}>LabKey SQL</HelpLink>.
        </p>
    </div>
);

interface Props {
    domainIndex: number;
    field: DomainField;
    getDomainFields: () => { domainFields: List<DomainField>; systemFields: SystemField[] };
    index: number;
    onChange: (fieldId: string, value: any, index?: number, expand?: boolean, skipDirtyCheck?: boolean) => void;
}

export const CalculatedFieldOptions: FC<Props> = memo(props => {
    const { index, field, domainIndex, onChange, getDomainFields } = props;
    const [loading, setLoading] = useState<boolean>(!field.isNew());
    const [error, setError] = useState<string>(undefined);
    const [parsedType, setParsedType] = useState<string>(undefined);
    const isNew = useMemo(() => field.isNew(), [field]);

    const handleChange = useCallback(
        (evt: any): void => {
            onChange(evt.target.id, evt.target.value);
            setError(undefined);
            setParsedType(undefined);
        },
        [onChange]
    );

    const validateExpression = useCallback(
        async (value: string, isExpressionChange = true): Promise<void> => {
            setLoading(true);
            setError(undefined);
            setParsedType(undefined);
            const { domainFields, systemFields } = getDomainFields();
            const colTypeMap = getColumnTypeMap(domainFields, systemFields);
            const phiColumns = getPHIColumnNames(domainFields);
            try {
                const response = await parseCalculatedColumn(value, colTypeMap, phiColumns);
                setError(response.error);
                setParsedType(response.type);

                const warningId = createFormInputId(DOMAIN_FIELD_CLIENT_SIDE_ERROR, domainIndex, index);
                if (response.error) {
                    const domainFieldWarning = new DomainFieldError({
                        message: 'Field expression is invalid.',
                        fieldName: field.name,
                        propertyId: undefined,
                        severity: SEVERITY_LEVEL_WARN,
                        rowIndexes: List<number>([index]),
                    });
                    onChange(warningId, domainFieldWarning, index, false, true);
                } else if (isExpressionChange) {
                    onChange(warningId, undefined, index, false, true);
                }
            } catch (e) {
                setError(resolveErrorMessage(e) ?? 'Failed to validate expression.');
            } finally {
                setLoading(false);
            }
        },
        [domainIndex, field.name, getDomainFields, index, onChange]
    );

    const handleBlur = useCallback(
        (evt: any): void => {
            const value = evt.target.value;
            validateExpression(value, true);
        },
        [validateExpression]
    );

    useEffect(
        () => {
            if (!isNew) {
                validateExpression(field.valueExpression, false);
            }
        },
        [
            /* on mount only */
        ]
    );

    return (
        <div
            className={classNames({
                'margin-bottom': !!field?.rangeURI && !PropDescType.isString(field.rangeURI),
            })}
        >
            <div className="row">
                <div className="col-xs-12 col-md-6">
                    <SectionHeading title="Expression" cls="bottom-padding" helpTipBody={HELP_TIP_BODY} />
                    <textarea
                        className="form-control"
                        rows={6}
                        value={field.valueExpression || ''}
                        id={createFormInputId(DOMAIN_FIELD_VALUE_EXPRESSION, domainIndex, index)}
                        name={createFormInputName(DOMAIN_FIELD_VALUE_EXPRESSION)}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        disabled={
                            isFieldPartiallyLocked(field.lockType) ||
                            isFieldFullyLocked(field.lockType) ||
                            field.lockExistingField
                        }
                    />
                    <div className="domain-field-calc-footer">
                        {error && <div className="error">{error}</div>}
                        {!error && parsedType && (
                            <div className="validated">
                                Validated. Calculated data type is "{typeToDisplay(parsedType)}".
                            </div>
                        )}
                        {loading && <div>Validating expression...</div>}
                        {!error && !loading && !parsedType && field.valueExpression?.length > 0 && (
                            <div className="validate-link">Click to validate</div>
                        )}
                    </div>
                </div>
                <div className="col-xs-12 col-md-6 domain-field-calc-examples">
                    <b>Examples</b>
                    <table>
                        <tbody>
                            <tr>
                                <td>Addition:</td>
                                <td className="code">numericField1 + numericField2</td>
                            </tr>
                            <tr>
                                <td>Subtraction:</td>
                                <td className="code">numericField1 - numericField2</td>
                            </tr>
                            <tr>
                                <td>Multiplication:</td>
                                <td className="code">numericField1 * numericField2</td>
                            </tr>
                            <tr>
                                <td>Division:</td>
                                <td className="code">numericField1 / nonZeroField1</td>
                            </tr>
                        </tbody>
                    </table>
                    <HelpLink topic={FIELD_EDITOR_CALC_COLS_TOPIC}>Click for more examples</HelpLink>
                </div>
            </div>
        </div>
    );
});

CalculatedFieldOptions.displayName = 'CalculatedFieldOptions';
