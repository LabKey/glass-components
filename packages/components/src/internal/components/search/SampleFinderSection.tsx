import React, { FC, memo, useCallback, useState } from 'react';
import { Section } from '../base/Section';
import { EntityDataType } from '../entities/models';
import { capitalizeFirstChar } from '../../util/utils';
import { EntityFieldFilterModal } from './EntityFieldFilterModal';
import { Filter } from '@labkey/api';
import { SchemaQuery } from '../../../public/SchemaQuery';
import { FilterCardProps, FilterCards } from './FilterCards';

const SAMPLE_FINDER_TITLE = "Find Samples";
const SAMPLE_FINDER_CAPTION = "Find samples that meet all of these criteria";

interface Props {
    parentEntityDataTypes: EntityDataType[];
}

export const SampleFinderSection: FC<Props> = memo((props) => {
    const { parentEntityDataTypes } = props;

    const [showFilterModal, setShowFilterModal] = useState<boolean>(false);
    const [chosenEntityType, setChosenEntityType] = useState<EntityDataType>(undefined);
    const [filterCards, setFilterCards] = useState<FilterCardProps[]>([]);

    const onAddEntity = useCallback((entityType: EntityDataType) => {
        setChosenEntityType(entityType);
        setShowFilterModal(true);
    }, []);

    const onFilterEdit = useCallback((index: number) => {
        console.log("onFilterEdit for index " + index + ": Not yet implemented.");
        setShowFilterModal(true);
    }, [filterCards]);

    const onFilterDelete = useCallback((index: number) => {
        const newFilterCards = [...filterCards];
        newFilterCards.splice(index, 1);
        setFilterCards(newFilterCards);
    }, [filterCards]);

    const onFilterClose = () => {
        setShowFilterModal(false);
    };

    const onFind = useCallback((schemaQuery: SchemaQuery, filterArray: Filter.IFilter[])  => {
        onFilterClose();
        let newFilterCards = [...filterCards];
        newFilterCards.push({
            schemaQuery,
            filterArray,
            entityDataType: chosenEntityType,
            index: filterCards.length,
            onAdd: onAddEntity,
            onDelete: onFilterDelete,
        });
        setFilterCards(newFilterCards);
    }, [setFilterCards, filterCards, onFilterEdit, onFilterDelete, chosenEntityType]);

    let hintText = "Start by adding ";
    let names = parentEntityDataTypes.map(entityType => entityType.nounAsParentSingular).join(", ");
    const lastComma = names.lastIndexOf(",");
    if (lastComma >= 0) {
        names = names.substr(0, lastComma) + " or " + names.substr(lastComma + 1);
    }
    hintText += names + " properties.";
    return (
        <Section title={SAMPLE_FINDER_TITLE} caption={SAMPLE_FINDER_CAPTION} context={(
            <div>
                Search by:
                {parentEntityDataTypes.map((parentEntityType) => (
                    <button className="btn btn-default margin-left" onClick={() => { onAddEntity(parentEntityType) }}>
                        <i className="fa fa-plus-circle container--addition-icon" /> {capitalizeFirstChar(parentEntityType.nounAsParentSingular)} Properties
                    </button>
                ))}
            </div>
        )}
        >
            {filterCards.length == 0 ?
                <>
                    <FilterCards className="empty" cards={parentEntityDataTypes.map((entityDataType) => ({
                        entityDataType,
                        onAdd: onAddEntity
                    }))} />
                    <div className="filter-hint">{hintText}</div>
                </>
                :
                <FilterCards cards={filterCards} />
            }
            {showFilterModal && (
                <EntityFieldFilterModal
                    onCancel={onFilterClose}
                    entityDataType={chosenEntityType}
                    onFind={onFind}
                />
            )}
        </Section>
    )
})
