import React, { FC, memo, useCallback, useMemo, useState } from 'react';

import { Filter } from '@labkey/api';

import { isLoading } from '../public/LoadingState';

import { QueryColumn } from '../public/QueryColumn';

import { Modal } from './Modal';
import { DomainDesign, FilterCriteria, FilterCriteriaMap } from './components/domainproperties/models';
import { useLoadableState } from './useLoadableState';
import { LoadingSpinner } from './components/base/LoadingSpinner';
import { ChoicesListItem } from './components/base/ChoicesListItem';
import { FilterExpressionView } from './components/search/FilterExpressionView';
import { useAppContext } from './AppContext';
import { FilterCriteriaColumns } from './components/assay/models';
import { AssayProtocolModel } from './components/domainproperties/assay/models';

type BaseFilterCriteriaField = Omit<FilterCriteria, 'op' | 'value'>;
interface FilterCriteriaField extends BaseFilterCriteriaField {
    isKeyField: boolean;
}
type FieldLoader = () => Promise<FilterCriteriaField[]>;
type ReferenceFieldFetcher = (
    protocolId: number,
    columnNames: string[],
    containerPath: string
) => Promise<FilterCriteriaColumns>;

function fieldLoaderFactory(
    protocolId: number,
    container: string,
    domain: DomainDesign,
    fetch: ReferenceFieldFetcher
): FieldLoader {
    return async () => {
        const sourceFields = domain.fields
            .filter(field => {
                // Note: Maybe this logic should be in the APIWrapper.getFilterCriteriaColumns?
                const dataType = field.dataType.name;
                return field.measure && (dataType === 'double' || dataType === 'int');
            })
            .map(field => field.name)
            .toArray();
        const referenceFields = await fetch(protocolId, sourceFields, container);

        return Object.keys(referenceFields).reduce((result, sourceName) => {
            const sourceField = domain.fields.find(field => field.name === sourceName);
            result.push({
                name: sourceField.name,
                propertyId: sourceField.propertyId,
                isKeyField: sourceField.isPrimaryKey || sourceField.isUniqueIdField(),
            });
            return result.concat(
                referenceFields[sourceName].map((rawField, index) => ({
                    name: rawField.name,
                    propertyId: rawField.propertyId === 0 ? sourceField.propertyId * 100 + index : rawField.propertyId,
                    referencePropertyId: sourceField.propertyId,
                    isKeyField: false,
                }))
            );
        }, [] as FilterCriteriaField[]);
    };
}

/**
 * openTo: The propertyId of the domain field you want to open the modal to
 */
interface Props {
    onClose: () => void;
    onSave: (filterCriteria: FilterCriteriaMap) => void;
    openTo?: number;
    protocolModel: AssayProtocolModel;
}

export const FilterCriteriaModal: FC<Props> = memo(({ onClose, onSave, openTo, protocolModel }) => {
    const { api } = useAppContext();
    const { protocolId, container } = protocolModel;
    const domain = useMemo(
        () => protocolModel.domains.find(domain => domain.isNameSuffixMatch('Data')),
        [protocolModel.domains]
    );

    const [filterCriteria, setFilterCriteria] = useState<FilterCriteriaMap>(() => {
        return domain.fields.reduce((result, field) => {
            if (field.filterCriteria) result.set(field.propertyId, [...field.filterCriteria]);
            return result;
        }, new Map<number, FilterCriteria[]>());
    });
    const loader = useMemo(
        () => fieldLoaderFactory(protocolId, container, domain, api.assay.getFilterCriteriaColumns),
        [api.assay.getFilterCriteriaColumns, container, domain, protocolId]
    );
    const { loadingState, value: filterCriteriaFields } = useLoadableState<FilterCriteriaField[]>(loader);

    const [selectedFieldId, setSelectedFieldId] = useState<number>(openTo);

    const onSelect = useCallback(
        (idx: number) => setSelectedFieldId(filterCriteriaFields[idx].propertyId),
        [filterCriteriaFields]
    );

    const onFieldFilterUpdate = useCallback(
        (newFilters: Filter.IFilter[]) => {
            setFilterCriteria(current => {
                const filterCriteriaField = filterCriteriaFields.find(field => field.propertyId === selectedFieldId);
                // Use the referencePropertyId if it exists, because all filterCriteria are stored on the parent field
                const sourcePropertyId = filterCriteriaField.referencePropertyId ?? filterCriteriaField.propertyId;
                // Remove the existing filter criteria for the filterCriteriaField
                const existingValues = current
                    .get(sourcePropertyId)
                    .filter(value => value.propertyId !== filterCriteriaField.propertyId);
                const newValues = newFilters.map(filter => ({
                    name: filterCriteriaField.name,
                    op: filter.getFilterType().getURLSuffix(),
                    propertyId: filterCriteriaField.propertyId,
                    referencePropertyId: filterCriteriaField.referencePropertyId,
                    value: filter.getValue(),
                }));
                const updated = new Map(current);
                updated.set(sourcePropertyId, existingValues.concat(newValues));
                return updated;
            });
        },
        [filterCriteriaFields, selectedFieldId]
    );

    const onConfirm = useCallback(() => onSave(filterCriteria), [filterCriteria, onSave]);

    const fieldFilters = useMemo(() => {
        const filterCriteriaField = filterCriteriaFields?.find(field => field.propertyId === selectedFieldId);

        if (!filterCriteriaField) return undefined;

        const sourcePropertyId = filterCriteriaField.referencePropertyId ?? filterCriteriaField.propertyId;
        return filterCriteria
            .get(sourcePropertyId)
            .filter(value => value.propertyId === filterCriteriaField.propertyId)
            .map(fc => Filter.create(fc.name, fc.value, Filter.Types[fc.op.toUpperCase()]));
    }, [filterCriteriaFields, filterCriteria, selectedFieldId]);

    const currentColumn: QueryColumn = useMemo(() => {
        const currentField = filterCriteriaFields?.find(field => field.propertyId === selectedFieldId);
        if (currentField === undefined) return undefined;
        return new QueryColumn({
            fieldKey: currentField.name,
            caption: currentField.name,
            isKeyField: currentField.isKeyField,
        });
    }, [filterCriteriaFields, selectedFieldId]);

    const loading = isLoading(loadingState);
    const hasFields = filterCriteriaFields !== undefined && filterCriteriaFields.length > 0;

    return (
        <Modal bsSize="lg" title="Hit Selection Criteria" onCancel={onClose} onConfirm={onConfirm} confirmText="Apply">
            {loading && <LoadingSpinner />}
            {!loading && (
                <div className="filter-criteria-modal-body field-modal__container row">
                    <div className="col-sm-4 field-modal__col">
                        <div className="field-modal__col-title">Fields</div>
                        <div className="field-modal__col-content">
                            <div className="list-group">
                                {!hasFields && <div className="field-modal__empty-msg padding">No fields defined yet.</div>}
                                {filterCriteriaFields?.map((column, index) => (
                                    <ChoicesListItem
                                        active={filterCriteriaFields[index].propertyId === selectedFieldId}
                                        index={index}
                                        key={column.name}
                                        label={column.name}
                                        onSelect={onSelect}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="col-sm-8 field-modal__col">
                        <div className="field-modal__col-title">Filter Criteria</div>
                        <div className="field-modal__col-content field-modal__values">
                            {!currentColumn && <div className="field-modal__empty-msg">Select a field.</div>}
                            {currentColumn && (
                                <FilterExpressionView
                                    field={currentColumn}
                                    fieldFilters={fieldFilters}
                                    onFieldFilterUpdate={onFieldFilterUpdate}
                                />
                            )}
                        </div>
                    </div>
                </div>
            )}
        </Modal>
    );
});
