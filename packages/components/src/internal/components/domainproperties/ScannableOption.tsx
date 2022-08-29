import React, { FC, memo, useCallback } from 'react';
import { Col, FormControl, Row } from 'react-bootstrap';

import { DomainFieldLabel } from './DomainFieldLabel';
import { createFormInputId, createFormInputName } from './utils';
import { DOMAIN_FIELD_SCANNABLE_OPTION } from './constants';
import { isFieldFullyLocked } from './propertiesUtil';
import { ITypeDependentProps } from './models';

export interface ScannableProps extends ITypeDependentProps {
    appPropertiesOnly?: boolean;
    scannable?: boolean;
    showScannableOption?: boolean;
}

export const ScannableOption: FC<ScannableProps> = memo(props => {
    const { domainIndex, index, lockType, scannable = false, appPropertiesOnly, showScannableOption, onChange } = props;
    if (!appPropertiesOnly || !showScannableOption) return null;

    const handleOptionToggle = useCallback(
        (event: any): void => {
            const { id, checked } = event.target;
            onChange?.(id, checked);
        },
        [onChange]
    );

    return (
        <>
            <Row>
                <Col xs={3}>
                    <div className="domain-field-label">
                        <DomainFieldLabel
                            label="Barcode Field"
                            helpTipBody={
                                'When using the Find Samples dialog from the search bar and choosing the\n' +
                                '                                        "Barcodes" option, fields\n' +
                                '                                        that are designated as Barcode fields will be queried\n' +
                                '                                        along with any UniqueId fields for this sample type.'
                            }
                        />
                    </div>
                </Col>
            </Row>
            <Row>
                <Col xs={12} className="domain-text-options-col">
                    <FormControl
                        type="checkbox"
                        id={createFormInputId(DOMAIN_FIELD_SCANNABLE_OPTION, domainIndex, index)}
                        name={createFormInputName(DOMAIN_FIELD_SCANNABLE_OPTION)}
                        className="domain-text-option-scannable"
                        onChange={handleOptionToggle}
                        disabled={isFieldFullyLocked(lockType)}
                        checked={scannable}
                    />
                    <span>Search this field when scanning samples</span>
                </Col>
            </Row>
        </>
    );
});
