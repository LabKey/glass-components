import React, { FC, memo } from 'react';
import { EntityDataType } from '../entities/models';
import { Filter } from '@labkey/api';
import { capitalizeFirstChar } from '../../util/utils';
import { SchemaQuery } from '../../../public/SchemaQuery';

export interface FilterCardProps {
    entityDataType: EntityDataType;
    filterArray?: Filter.IFilter[]; // the filters to be used in conjunction with the schemaQuery
    schemaQuery?: SchemaQuery;
    index?: number;
    onAdd: (entityDataType: EntityDataType) => void;
    onEdit?: (index: number) => void;
    onDelete?: (index: number) => void;
}

export const FilterCard: FC<FilterCardProps> = memo(props => {
    const { entityDataType, filterArray, index, onAdd, onDelete, onEdit, schemaQuery } = props;

    if (!schemaQuery) {
        return (
            <>
                <div className="filter-cards__card" onClick={() => onAdd(entityDataType)}>
                    <div className={"filter-card__header without-secondary " + entityDataType.filterCardHeaderClass}>
                        <div className={"primary-text"}>{capitalizeFirstChar(entityDataType.nounAsParentSingular)} Properties</div>
                    </div>
                    <div className="filter-card__empty-content">
                        +
                    </div>
                </div>
            </>
        );
    }
    return (
        <>
            <div className={'filter-cards__card'}>
                <div className={"filter-card__header " + entityDataType.filterCardHeaderClass}>
                    <div className={"pull-left"}>
                    <div className={"secondary-text"}>{capitalizeFirstChar(entityDataType.nounAsParentSingular)}</div>
                    <div className={"primary-text"}>{capitalizeFirstChar(schemaQuery.queryName)}</div>
                    </div>
                    <div className={"pull-right actions"}>
                        {onEdit && <i className={"fa fa-pencil action-icon"} onClick={() => onEdit(index)}/>}
                        {onDelete && <i className={"fa fa-trash action-icon"} onClick={() => onDelete(index)}/>}
                    </div>
                </div>
                <div className="filter-card__card-content">
                    {!filterArray?.length && (
                        <>
                            <hr/>
                            <div>Showing all {schemaQuery.queryName} Samples</div>
                        </>
                    )}
                    {!!filterArray?.length && <>Filter view coming soon ...</>}
                </div>
            </div>

        </>
    );
});


interface Props {
    cards: FilterCardProps[];
    className?: string;
}

export const FilterCards: FC<Props> = props => (
    <div className={"filter-cards " + props.className}>
        {props.cards.map((cardProps, i) => (
            <FilterCard {...cardProps} index={i} key={i}/>
        ))}
    </div>
);
