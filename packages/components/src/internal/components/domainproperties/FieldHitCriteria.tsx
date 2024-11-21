import React, { FC, memo, useCallback, useMemo } from 'react';

import { SectionHeading } from './SectionHeading';
import { DomainField } from './models';
import { useHitCriteriaContext } from './assay/HitCriteriaContext';
import { HitCriteriaRenderer } from '../../HitCriteriaRenderer';

interface Props {
    field: DomainField;
}

export const FieldHitCriteria: FC<Props> = memo(({ field }) => {
    const { propertyId } = field;
    const context = useHitCriteriaContext();
    const openModal = context?.openModal;
    const onClick = useCallback(() => openModal(propertyId), [openModal, propertyId]);
    // TODO: need to get the generate field (STD Dev, Median, etc)
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
                    <HitCriteriaRenderer criteria={context.hitCriteria} fields={fields} />
                </div>
            </div>
        </div>
    );
});
