import React, { FC, memo, useCallback, useMemo, useState } from 'react';

import { Filter } from '@labkey/api';

import { isLoading } from '../public/LoadingState';

import { QueryColumn } from '../public/QueryColumn';

import { Modal } from './Modal';
import { DomainField, FilterCriteria, FilterCriteriaMap, IDomainField } from './components/domainproperties/models';
import { useLoadableState } from './useLoadableState';
import { LoadingSpinner } from './components/base/LoadingSpinner';
import { ChoicesListItem } from './components/base/ChoicesListItem';
import { FilterExpressionView } from './components/search/FilterExpressionView';
import { useAppContext } from './AppContext';
import { FilterCriteriaColumns } from './components/assay/models';
import { AssayProtocolModel } from './components/domainproperties/assay/models';

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
    const domain = useMemo(
        () => protocolModel.domains.find(domain => domain.isNameSuffixMatch('Data')),
        [protocolModel.domains]
    );
    const [filterCriteria, setFilterCriteria] = useState<FilterCriteriaMap>(() => {
        // Initialize the filterCriteria from the existing domain fields
        return domain.fields.reduce((result, field) => {
            if (field.filterCriteria) {
                for (const criteria of field.filterCriteria) {
                    if (!result[criteria.name]) result[criteria.name] = [];
                    result[criteria.name].push(criteria);
                }
            }
            return result;
        }, {} as FilterCriteriaMap);
    });
    const load = useCallback(() => {
        const columnNames = domain.fields
            .filter(field => {
                // Note: Maybe this logic should be in the APIWrapper.getFilterCriteriaColumns?
                const dataType = field.dataType.name;
                return field.measure && (dataType === 'double' || dataType === 'int');
            })
            .map(field => field.name)
            .toArray();
        return api.assay.getFilterCriteriaColumns(protocolModel.protocolId, columnNames, protocolModel.container);
    }, [api.assay, domain.fields, protocolModel.container, protocolModel.protocolId]);
    const { loadingState, value: filterCriteriaColumns } = useLoadableState<FilterCriteriaColumns>(load);
    const [selectedFieldName, setSelectedFieldName] = useState<string>(() => {
        return domain.fields.find(field => field.propertyId === openTo)?.name;
    });

    // The array of all fields, including the fields on the domain, and the fields returned from the
    // FilterCriteriaColumns API
    const allFields = useMemo(() => {
        if (filterCriteriaColumns === undefined) return [];
        return Object.keys(filterCriteriaColumns).reduce((result, key) => {
            // Push the original column
            result.push(domain.fields.find(f => f.name === key).toJS());
            // Concat the loaded columns from the FilterCriteriaColumns API
            return result.concat(filterCriteriaColumns[key]);
        }, [] as IDomainField[]);
    }, [domain.fields, filterCriteriaColumns]);

    // The currently selected DomainField
    const currentField = useMemo(() => {
        const rawField = allFields.find(field => field.name === selectedFieldName);
        if (rawField === undefined) return undefined;
        return DomainField.create(rawField);
    }, [allFields, selectedFieldName]);

    // The currently selected QueryColumn (needed by FilterExpressionView)
    const currentColumn: QueryColumn = useMemo(() => {
        if (currentField === undefined) return undefined;
        return new QueryColumn({
            fieldKey: currentField.name,
            caption: currentField.name,
            isKeyField: currentField.isPrimaryKey || currentField.isUniqueIdField(),
        });
    }, [currentField]);
    const onSelect = useCallback((idx: number) => setSelectedFieldName(allFields[idx].name), [allFields]);
    const onFieldFilterUpdate = useCallback(
        (newFilters: Filter.IFilter[]) => {
            setFilterCriteria(current => {
                const domainField = allFields.find(field => field.name === selectedFieldName);
                return {
                    ...current,
                    [domainField.name]: newFilters.map(filter => ({
                        name: domainField.name.indexOf('_') > -1 ? domainField.name : '', // FIXME: HACK
                        op: filter.getFilterType().getURLSuffix(),
                        // propertyId: domainField.propertyId,
                        propertyId: undefined, // TODO: this results in an error for computed fields
                        referencePropertyId: undefined, // TODO: wire this up for reference properties
                        value: filter.getValue(),
                    })),
                };
            });
        },
        [allFields, selectedFieldName]
    );
    const onConfirm = useCallback(() => onSave(filterCriteria), [filterCriteria, onSave]);
    const loading = isLoading(loadingState);
    const fieldFilters = useMemo(() => {
        if (!selectedFieldName) return undefined;

        const domainField = allFields.find(field => field.name === selectedFieldName);

        if (!domainField) return undefined;

        const fieldFilterCriteria: FilterCriteria[] = filterCriteria[domainField.name] ?? [];

        return fieldFilterCriteria.map(fc => Filter.create(fc.name, fc.value, Filter.Types[fc.op.toUpperCase()]));
    }, [allFields, filterCriteria, selectedFieldName]);

    console.log(filterCriteria);

    return (
        <Modal bsSize="lg" title="Hit Selection Criteria" onCancel={onClose} onConfirm={onConfirm} confirmText="Apply">
            {loading && <LoadingSpinner />}
            {!loading && (
                <div className="filter-criteria-modal-body field-modal__container row">
                    <div className="col-sm-4 field-modal__col">
                        <div className="field-modal__col-title">Fields</div>
                        <div className="field-modal__col-content">
                            <div className="list-group">
                                {allFields.map((column, index) => (
                                    <ChoicesListItem
                                        active={column.name === selectedFieldName}
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
