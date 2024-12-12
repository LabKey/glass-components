import React, { FC, memo, useMemo } from 'react';

import { Filter } from '@labkey/api';

import { DomainField } from './components/domainproperties/models';

function getFilterDisplaySymbol(op: string) {
    const filterType = Object.values(Filter.Types).find(ft => ft.getURLSuffix() === op);
    return filterType.getDisplaySymbol();
}

interface FieldWithCriteria {
    field: DomainField;
}

const FilterCriteriaField: FC<FieldWithCriteria> = memo(({ field }) => {
    return (
        <>
            {field.filterCriteria.map(criteria => (
                <li className="hit-criteria-renderer__field-value" key={criteria.name + criteria.op + criteria.value}>
                    {criteria.name} {getFilterDisplaySymbol(criteria.op)} {criteria.value}
                </li>
            ))}
        </>
    );
});

interface Props {
    fields: DomainField[];
}

export const FilterCriteriaRenderer: FC<Props> = memo(({ fields }) => {
    const fieldsWithCriteria = useMemo(() => fields.filter(field => field.filterCriteria), [fields]);

    return (
        <ul className="hit-criteria-renderer">
            {fieldsWithCriteria.map(field => (
                <FilterCriteriaField field={field} key={field.propertyId} />
            ))}
        </ul>
    );
});
