import React, { FC, memo, useCallback, useMemo, useState } from 'react';

import { isLoading } from '../public/LoadingState';

import { QueryColumn } from '../public/QueryColumn';

import { Modal } from './Modal';
import { DomainDesign, DomainField } from './components/domainproperties/models';
import { AssayProtocolModel, HitCriteria, hitCriteriaKey } from './components/domainproperties/assay/models';
import { useLoadableState } from './useLoadableState';
import { LoadingSpinner } from './components/base/LoadingSpinner';
import { ChoicesListItem } from './components/base/ChoicesListItem';
import { useHitCriteriaContext } from './components/domainproperties/assay/HitCriteriaContext';
import { FilterExpressionView } from './components/search/FilterExpressionView';

async function fetchQueryColumns(domain: DomainDesign): Promise<QueryColumn[]> {
    // TODO: use API to load fields so we get the extra fields like STD Deviation, Median, etc.
    return domain.fields
        .map(field => {
            return new QueryColumn({
                fieldKey: field.name,
                caption: field.name,
                isKeyField: field.isPrimaryKey || field.isUniqueIdField(),
            });
        })
        .toArray();
}

/**
 * openTo: The propertyId of the domain field you want to open the modal to
 */
interface Props {
    loadQueryColumns?: (domain: DomainDesign) => Promise<QueryColumn[]>;
    model: AssayProtocolModel;
    onClose: () => void;
    onSave: (hitCriteria: HitCriteria) => void;
    openTo?: number;
}

export const HitCriteriaModal: FC<Props> = memo(props => {
    const { loadQueryColumns = fetchQueryColumns, model, onClose, onSave, openTo } = props;
    const { hitCriteria: initialHitCriteria } = useHitCriteriaContext();
    const [hitCriteria, setHitCriteria] = useState<HitCriteria>(initialHitCriteria);
    const domain = useMemo(() => model.domains.find(domain => domain.isNameSuffixMatch('Data')), [model.domains]);
    const load = useCallback(() => loadQueryColumns(domain), [loadQueryColumns, domain]);
    const { loadingState, value: columns } = useLoadableState<QueryColumn[]>(load);
    const [selectedFieldKey, setSelectedFieldKey] = useState<string>(() => {
        return domain.fields.find(field => field.propertyId === openTo)?.name;
    });
    const currentColumn = useMemo(
        () => columns?.find(column => column.fieldKey === selectedFieldKey),
        [columns, selectedFieldKey]
    );
    const onSelect = useCallback((idx: number) => setSelectedFieldKey(columns[idx].fieldKey), [columns]);
    const onFieldFilterUpdate = useCallback(
        newFilters => {
            setHitCriteria(current => {
                const domainField = domain.fields.find(field => field.name === currentColumn.fieldKey);
                const key = hitCriteriaKey(domainField);
                return {
                    ...current,
                    [key]: newFilters,
                };
            });
        },
        [currentColumn?.fieldKey, domain.fields]
    );
    const onConfirm = useCallback(() => onSave(hitCriteria), [hitCriteria, onSave]);
    const loading = isLoading(loadingState);
    const fieldFilters = useMemo(() => {
        if (!selectedFieldKey) return undefined;

        const domainField = domain.fields.find(field => field.name === selectedFieldKey);
        console.log('hitCriteriaKey:', hitCriteriaKey(domainField));
        console.log('hitCriteria:', hitCriteria);
        return hitCriteria[hitCriteriaKey(domainField)];
    }, [domain.fields, hitCriteria, selectedFieldKey]);

    console.log('Field Filters:', fieldFilters);

    return (
        <Modal bsSize="lg" title="Hit Selection Criteria" onCancel={onClose} onConfirm={onConfirm} confirmText="Apply">
            {loading && <LoadingSpinner />}
            {!loading && (
                <div className="hit-criteria-modal-body field-modal__container row">
                    <div className="col-sm-4 field-modal__col">
                        <div className="field-modal__col-title">Fields</div>
                        <div className="field-modal__col-content">
                            <div className="list-group">
                                {columns.map((column, index) => (
                                    <ChoicesListItem
                                        active={column.fieldKey === selectedFieldKey}
                                        index={index}
                                        key={index}
                                        label={column.caption}
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
