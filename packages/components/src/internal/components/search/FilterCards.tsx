import React, { FC, memo, useCallback } from 'react';

import { EntityDataType } from '../entities/models';
import { capitalizeFirstChar } from '../../util/utils';

import { FieldFilter, FilterProps } from './models';
import { FilterValueDisplay } from './FilterValueDisplay';

interface GroupedFilterProps {
    filterArray: FieldFilter[]
    onFilterValueExpand: (cardIndex: number, fieldFilter: FieldFilter) => void;
}

export const GroupedFilterValues: FC<GroupedFilterProps> = memo((props) => {
    const { filterArray, onFilterValueExpand } = props;
    const groupedFilters = {};
    filterArray?.forEach(filter => {
        if (!groupedFilters[filter.fieldKey]) {
            groupedFilters[filter.fieldKey] = [];
        }
        groupedFilters[filter.fieldKey].push(filter);
    });
    const rows = [];
    Object.keys(groupedFilters).forEach(key => {
        groupedFilters[key].forEach((fieldFilter, index) => {
            rows.push(
                <tr key={key + "-" + index} className="filter-display__row">
                    {(index === 0) &&
                        <td className="filter-display__field-label">{fieldFilter.fieldCaption}:</td>}
                    {(index !== 0) && <td className={"filter-display__field-boolean"}>and</td>}
                    <td className="filter-display__filter-content">
                        <FilterValueDisplay
                            filter={fieldFilter.filter}
                            onFilterValueExpand={() => onFilterValueExpand(index, fieldFilter)}
                        />
                    </td>
                </tr>
            )
        });
    })
    return <>{rows}</>;
});


interface FilterEditProps extends FilterProps {
    onDelete: (index) => void;
    onEdit: (index) => void;
    onAdd: (entityDataType: EntityDataType) => void;
    onFilterValueExpand?: (cardIndex: number, fieldFilter: FieldFilter) => void;
}

// exported for jest testing
export const FilterCard: FC<FilterEditProps> = memo(props => {
    const {
        entityDataType,
        filterArray,
        index,
        onAdd,
        onDelete,
        onEdit,
        schemaQuery,
        onFilterValueExpand,
        dataTypeDisplayName,
    } = props;

    const _onAdd = useCallback(() => {
        onAdd(entityDataType);
    }, [onAdd, entityDataType]);

    const _onEdit = useCallback(() => {
        onEdit(index);
    }, [onEdit, index]);

    const _onDelete = useCallback(() => {
        onDelete(index);
    }, [onDelete, index]);

    if (!schemaQuery) {
        return (
            <>
                <div className="filter-cards__card filter-cards__popout" onClick={_onAdd}>
                    <div className={'filter-card__header without-secondary ' + entityDataType.filterCardHeaderClass}>
                        <div className="primary-text">
                            {capitalizeFirstChar(entityDataType.nounAsParentSingular)} Properties
                        </div>
                    </div>
                    <div className="filter-card__empty-content">+</div>
                </div>
            </>
        );
    }

    const dataTypeName = dataTypeDisplayName ?? schemaQuery.queryName;
    return (
        <>
            <div className="filter-cards__card">
                <div className={'filter-card__header ' + entityDataType.filterCardHeaderClass}>
                    <div className="pull-left">
                        <div className="secondary-text">{capitalizeFirstChar(entityDataType.nounAsParentSingular)}</div>
                        <div className="primary-text">{dataTypeName}</div>
                    </div>
                    <div className="pull-right actions">
                        {onEdit && <i className="fa fa-pencil action-icon" onClick={_onEdit} title="Edit filter" />}
                        {onDelete && (
                            <i className="fa fa-trash action-icon" onClick={_onDelete} title="Remove filter" />
                        )}
                    </div>
                </div>
                <div className="filter-card__card-content">
                    {!filterArray?.length && (
                        <>
                            <hr />
                            <div>
                                Showing all samples with {dataTypeName}{' '}
                                {entityDataType.nounAsParentSingular.toLowerCase()}s
                            </div>
                        </>
                    )}
                    {!!filterArray?.length && (
                        <table>
                            <tbody>
                                <GroupedFilterValues
                                   filterArray={filterArray}
                                    onFilterValueExpand={onFilterValueExpand}
                                />
                                {/*{filterArray.map((fieldFilter, index) => (*/}
                                {/*    <tr key={fieldFilter.fieldKey + "-" + index} className="filter-display__row">*/}
                                {/*        <td className="filter-display__field-label">{fieldFilter.fieldCaption}:</td>*/}
                                {/*        <td className="filter-display__filter-content">*/}
                                {/*            <FilterValueDisplay*/}
                                {/*                filter={fieldFilter.filter}*/}
                                {/*                onFilterValueExpand={() => onFilterValueExpand(index, fieldFilter)}*/}
                                {/*            />*/}
                                {/*        </td>*/}
                                {/*    </tr>*/}
                                {/*))}*/}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </>
    );
});

interface Props {
    cards: FilterProps[];
    className?: string;
    onFilterDelete?: (index) => void;
    onFilterEdit?: (index) => void;
    onAddEntity: (entityDataType: EntityDataType) => void;
    onFilterValueExpand?: (cardIndex: number, fieldFilter: FieldFilter) => void;
}

export const FilterCards: FC<Props> = props => (
    <div className={'filter-cards ' + props.className}>
        {props.cards.map((cardProps, i) => (
            <FilterCard
                {...cardProps}
                onAdd={props.onAddEntity}
                onDelete={props.onFilterDelete}
                onEdit={props.onFilterEdit}
                index={i}
                key={i}
                onFilterValueExpand={props.onFilterValueExpand}
            />
        ))}
    </div>
);
