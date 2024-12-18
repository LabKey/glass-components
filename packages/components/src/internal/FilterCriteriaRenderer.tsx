import React, { FC, memo, useMemo } from 'react';

import { Filter } from '@labkey/api';

import { DomainField } from './components/domainproperties/models';

interface FieldWithCriteria {
    field: DomainField;
}

const FilterCriteriaField: FC<FieldWithCriteria> = memo(({ field }) => {
    return (
        <>
            {field.filterCriteria.map(criteria => (
                <li className="hit-criteria-renderer__field-value" key={criteria.name + criteria.op + criteria.value}>
                    {criteria.name} {Filter.getFilterTypeForURLSuffix(criteria.op).getDisplaySymbol()} {criteria.value}
                </li>
            ))}
        </>
    );
});
FilterCriteriaField.displayName = 'FilterCriteriaField';

interface Props {
    fields: DomainField[];
    renderEmptyMessage?: boolean;
}

export const FilterCriteriaRenderer: FC<Props> = memo(({ fields, renderEmptyMessage = true }) => {
    const fieldsWithCriteria = useMemo(
        () => fields.filter(field => field.filterCriteria && field.filterCriteria.length > 0),
        [fields]
    );
    const showEmptyMessage = fieldsWithCriteria.length === 0 && renderEmptyMessage;

    return (
        <div className="filter-criteria-renderer">
            {showEmptyMessage && (
                <div className="gray-text">
                    <em>No Hit Selection Criteria</em>
                </div>
            )}
            <ul>
                {fieldsWithCriteria.map(field => (
                    <FilterCriteriaField field={field} key={field.propertyId} />
                ))}
            </ul>
        </div>
    );
});
FilterCriteriaRenderer.displayName = 'FilterCriteriaRenderer';
