import React, { FC, memo, useCallback, useMemo } from 'react';

import { FilterCriteriaRenderer } from '../../FilterCriteriaRenderer';

import { SectionHeading } from './SectionHeading';
import { DomainField } from './models';
import { useFilterCriteriaContext } from './assay/FilterCriteriaContext';

interface Props {
    field: DomainField;
}

export const FieldFilterCriteria: FC<Props> = memo(({ field }) => {
    const { propertyId } = field;
    const context = useFilterCriteriaContext();
    const openModal = context?.openModal;
    const onClick = useCallback(() => openModal(propertyId), [openModal, propertyId]);
    const fields = useMemo(() => [field], [field]);

    if (!context) return null;

    return (
        <div className="col-xs-12">
            <div className="row">
                <div className="col-xs-12">
                    <SectionHeading title="Hit Selection Criteria" cls="domain-field-section-hdr" />
                </div>
            </div>

            <div className="row">
                <div className="col-xs-2">
                    <button type="button" className="btn btn-default" onClick={onClick}>
                        Edit Criteria
                    </button>
                </div>
                <div className="col-xs-10">
                    <FilterCriteriaRenderer fields={fields} />
                </div>
            </div>
        </div>
    );
});
FieldFilterCriteria.displayName = 'FieldFilterCriteria';
