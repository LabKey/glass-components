import React, { FC, memo, useCallback, useMemo, useState } from 'react';
import { Modal } from 'react-bootstrap';
import classNames from 'classnames';
import { Utils } from '@labkey/api';

import { MAX_VALID_TEXT_CHOICES } from './constants';
import { getValidValuesFromArray } from './models';

interface Props {
    fieldName: string;
    onCancel: () => void;
    onApply: (values: string[]) => void;
    initialValueCount?: number;
    maxValueCount?: number;
}

export const TextChoiceAddValuesModal: FC<Props> = memo(props => {
    const { onCancel, onApply, fieldName, initialValueCount = 0, maxValueCount = MAX_VALID_TEXT_CHOICES } = props;
    const [valueStr, setValueStr] = useState<string>('');
    const parsedValues = useMemo(() => {
        return valueStr?.trim().length > 0 ? getValidValuesFromArray(valueStr.split('\n').map(v => v.trim())) : [];
    }, [valueStr]);
    const maxValuesToAdd = useMemo(() => maxValueCount - initialValueCount, [initialValueCount]);
    const hasFieldName = useMemo(() => fieldName?.length > 0, [fieldName]);

    const onChange = useCallback(evt => {
        setValueStr(evt.target.value);
    }, []);

    const _onApply = useCallback(() => {
        if (parsedValues.length <= maxValuesToAdd) {
            onApply(parsedValues);
        }
    }, [parsedValues, maxValuesToAdd, onApply]);

    return (
        <Modal show={true} onHide={onCancel}>
            <Modal.Header closeButton>
                <Modal.Title>Add Text Choice Values {hasFieldName && `for ${fieldName}`}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <p>
                    {`Enter each value on a new line. ${Utils.pluralize(
                        maxValuesToAdd,
                        'value',
                        'values'
                    )} can be added.`}
                </p>
                <textarea
                    rows={8}
                    cols={50}
                    className="textarea-fullwidth textarea-noresize"
                    placeholder="Enter new values..."
                    onChange={onChange}
                    value={valueStr}
                />
                <div
                    className={classNames('text-choice-value-count', {
                        'domain-text-choices-error': parsedValues.length > maxValuesToAdd,
                    })}
                >
                    {parsedValues.length === 1
                        ? '1 new value provided.'
                        : `${parsedValues.length} new values provided.`}
                </div>
            </Modal.Body>
            <Modal.Footer>
                <div className="pull-left">
                    <button type="button" className="btn btn-default" onClick={onCancel}>
                        Cancel
                    </button>
                </div>

                <div className="pull-right">
                    <button
                        type="button"
                        className="btn btn-success"
                        onClick={_onApply}
                        disabled={parsedValues.length === 0 || parsedValues.length > maxValuesToAdd}
                    >
                        Apply
                    </button>
                </div>
            </Modal.Footer>
        </Modal>
    );
});
