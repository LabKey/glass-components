import React, { FC, memo, useMemo } from 'react';
import { Filter } from '@labkey/api';

import { DomainField } from './components/domainproperties/models';
import { HitCriteria, hitCriteriaKey } from './components/domainproperties/assay/models';

interface FieldWithCriteria {
    criteria: Filter.IFilter[];
    field: DomainField;
}

const HitCriteriaField: FC<FieldWithCriteria> = memo(({ criteria, field }) => {
    return (
        <>
            {criteria.map((filter, index) => (
                // eslint-disable-next-line react/no-array-index-key
                <li className="hit-criteria-renderer__field-value" key={index}>
                    {field.name} {filter.getFilterType().getDisplaySymbol()} {filter.getValue()}
                </li>
            ))}
        </>
    );
});

interface Props {
    criteria: HitCriteria;
    fields: DomainField[];
}

export const HitCriteriaRenderer: FC<Props> = memo(({ fields, criteria }) => {
    const fieldsWithCriteria = useMemo(
        () =>
            fields.reduce((result, field) => {
                const key = hitCriteriaKey(field);
                if (criteria[key]) result.push({ field, criteria: criteria[key] });
                return result;
            }, [] as FieldWithCriteria[]),
        [fields, criteria]
    );

    return (
        <ul className="hit-criteria-renderer">
            {fieldsWithCriteria.map(field => (
                <HitCriteriaField criteria={field.criteria} field={field.field} key={field.field.propertyId} />
            ))}
        </ul>
    );
});
