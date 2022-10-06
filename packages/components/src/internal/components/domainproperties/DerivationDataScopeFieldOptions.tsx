import React, { FC, memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Col, Radio, Row } from 'react-bootstrap';

import { Alert } from '../base/Alert';

import { createFormInputId } from './utils';
import { isFieldFullyLocked } from './propertiesUtil';
import { DERIVATION_DATA_SCOPES, DOMAIN_FIELD_DERIVATION_DATA_SCOPE } from './constants';
import { IDerivationDataScope, ITypeDependentProps } from './models';
import { SectionHeading } from './SectionHeading';
import { PropDescType } from './PropDescType';

interface Props extends ITypeDependentProps {
    config?: IDerivationDataScope;
    fieldDataType?: PropDescType;
    isExistingField?: boolean;
    value?: string;
}

export const DerivationDataScopeFieldOptions: FC<Props> = memo(props => {
    const { domainIndex, index, onChange, config, lockType, value, label, isExistingField, fieldDataType } = props;

    const [isExistingParentOnly, setIsExistingParentOnly] = useState<boolean>(false);
    const [isChildOnlyValidOption, setIsChildOnlyValidOption] = useState<boolean>(false);
    const [isParentOnlyValidOption, setIsParentOnlyValidOption] = useState<boolean>(false);
    const [hasScopeChange, setHasScopeChange] = useState<boolean>(false);
    const [isExistingNonScopedField, setIsExistingNonScopedField] = useState<boolean>(false);

    useEffect(() => {
        setIsExistingParentOnly(isExistingField && (!value || value === DERIVATION_DATA_SCOPES.PARENT_ONLY));
        setIsChildOnlyValidOption(!isExistingField || value === DERIVATION_DATA_SCOPES.CHILD_ONLY);
        setIsParentOnlyValidOption(!isExistingField || !value || value === DERIVATION_DATA_SCOPES.PARENT_ONLY);
        if (isExistingField && config.dataTypeFilter && fieldDataType && !config.dataTypeFilter(fieldDataType))
            setIsExistingNonScopedField(true); // scenario: modify from Unique Id column to other colum types
    }, [domainIndex, index, isExistingField]); // don't use config or value in dependency, only evaluate once per index

    const inputId = useMemo(() => {
        return createFormInputId(DOMAIN_FIELD_DERIVATION_DATA_SCOPE, domainIndex, index);
    }, [domainIndex, index]);

    const isFullyLocked = useMemo(() => {
        return isFieldFullyLocked(lockType);
    }, [lockType]);

    const onRadioChange = useCallback(
        event => {
            if (isExistingParentOnly && event.target.value === DERIVATION_DATA_SCOPES.ALL) setHasScopeChange(true);
            else setHasScopeChange(false);
            onChange(inputId, event.target.value);
        },
        [inputId, onChange, isExistingParentOnly]
    );

    if (!config.show) return null;

    if (config.dataTypeFilter && fieldDataType && !config.dataTypeFilter(fieldDataType)) return null;

    return (
        <div className="margin-bottom">
            <Row>
                <Col xs={12}>
                    <SectionHeading
                        title={label ?? config.sectionTitle}
                        cls="domain-field-section-hdr"
                        helpTipBody={config.helpLinkNode}
                    />
                </Col>
            </Row>
            <Row>
                <Col xs={12}>
                    <div className="derivation_scope_options_container">
                        <Radio
                            name={inputId}
                            value={DERIVATION_DATA_SCOPES.PARENT_ONLY}
                            checked={
                                (!value && !isExistingNonScopedField) || value === DERIVATION_DATA_SCOPES.PARENT_ONLY
                            }
                            onChange={onRadioChange}
                            disabled={isFullyLocked || !isParentOnlyValidOption}
                        >
                            {config.labelParent}
                        </Radio>
                        <Radio
                            name={inputId}
                            value={DERIVATION_DATA_SCOPES.CHILD_ONLY}
                            checked={value === DERIVATION_DATA_SCOPES.CHILD_ONLY}
                            onChange={onRadioChange}
                            disabled={isFullyLocked || !isChildOnlyValidOption}
                        >
                            {config.labelChild}
                        </Radio>
                        <Radio
                            name={inputId}
                            value={DERIVATION_DATA_SCOPES.ALL}
                            checked={value === DERIVATION_DATA_SCOPES.ALL || (!value && isExistingNonScopedField)}
                            onChange={onRadioChange}
                            disabled={isFullyLocked}
                        >
                            {config.labelAll}
                        </Radio>
                    </div>
                </Col>
            </Row>
            {hasScopeChange && config.scopeChangeWarning && (
                <Row>
                    <Alert bsStyle="warning" className="aliquot-alert-warning">
                        {config.scopeChangeWarning}
                    </Alert>
                </Row>
            )}
        </div>
    );
});

DerivationDataScopeFieldOptions.defaultProps = {
    config: {
        show: true,
        sectionTitle: 'Derivation Data Scope',
        labelAll: 'Editable for parent and child data independently',
        labelChild: 'Editable for child data only',
        labelParent: 'Editable for parent data only (default)',
    },
};
