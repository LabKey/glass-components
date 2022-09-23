import React, { FC, memo, useCallback } from 'react';
import { Button, MenuItem } from 'react-bootstrap';

import { Filter } from '@labkey/api';

import { QueryModel } from '../../../public/QueryModel/QueryModel';

import { AppURL } from '../../url/AppURL';

import { FIND_SAMPLES_BY_FILTER_KEY } from '../../app/constants';

import { formatDateTime } from '../../util/Date';

import { EntityDataType } from '../entities/models';

import { ResponsiveMenuButton } from '../buttons/ResponsiveMenuButton';

import { getSampleFinderLocalStorageKey, searchFiltersToJson } from './utils';
import { FieldFilter } from './models';

const getFieldFilter = (model: QueryModel, filter: Filter.IFilter): FieldFilter => {
    const colName = filter.getColumnName();
    const column = model.getColumn(colName);

    return {
        fieldKey: column?.fieldKey ?? colName,
        fieldCaption: column?.caption ?? colName,
        filter,
        jsonType: column?.jsonType ?? 'string',
    } as FieldFilter;
};

interface Props {
    asSubMenu?: boolean;
    entityDataType: EntityDataType;
    model: QueryModel;
}

export const FindDerivativesButton: FC<Props> = memo(props => {
    const { model, entityDataType, asSubMenu } = props;

    const onClick = useCallback(() => {
        const currentTimestamp = new Date();
        const sessionViewName = 'Searched ' + formatDateTime(currentTimestamp);

        // only using viewFilters and user defined filters (filterArray), intentionally leaving out baseFilters
        let fieldFilters = [];
        fieldFilters = fieldFilters.concat(model.viewFilters.map(filter => getFieldFilter(model, filter)));
        fieldFilters = fieldFilters.concat(model.filterArray.map(filter => getFieldFilter(model, filter)));

        sessionStorage.setItem(
            getSampleFinderLocalStorageKey(),
            searchFiltersToJson(
                [
                    {
                        schemaQuery: model.schemaQuery,
                        filterArray: fieldFilters,
                        entityDataType,
                        dataTypeDisplayName: model.title ?? model.queryInfo.title ?? model.queryName,
                    },
                ],
                0,
                currentTimestamp
            )
        );

        window.location.href = AppURL.create('search', FIND_SAMPLES_BY_FILTER_KEY)
            .addParam('view', sessionViewName)
            .toHref();
    }, [entityDataType, model]);

    if (!model.queryInfo) return null;

    if (asSubMenu) {
        const items = <MenuItem onClick={onClick}>Find Derivatives</MenuItem>;
        return <ResponsiveMenuButton id="samples-finder-menu" items={items} text="Find" asSubMenu={asSubMenu} />;
    }

    return (
        <Button className="responsive-menu" onClick={onClick}>
            Find Derivatives
        </Button>
    );
});
