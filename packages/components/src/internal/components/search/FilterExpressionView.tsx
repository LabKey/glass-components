import React, { FC, memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Filter } from '@labkey/api';

import { QueryColumn } from '../../../public/QueryColumn';
import { SelectInput } from '../forms/input/SelectInput';

import { getJsonDateFormatString, getJsonTimeFormatString } from '../../util/Date';

import { isOntologyEnabled } from '../../app/utils';

import { DatePickerInput } from '../forms/input/DatePickerInput';

import { OntologyBrowserFilterPanel } from '../ontology/OntologyBrowserFilterPanel';

import {
    getFilterSelections,
    getFilterTypePlaceHolder,
    getFilterOptionsForType,
    getUpdatedFilters,
    getUpdatedFilterSelection,
} from './utils';
import { FieldFilterOption, FilterSelection } from './models';

interface Props {
    allowRelativeDateFilter?: boolean;
    disabled?: boolean;
    field: QueryColumn;
    fieldFilters: Filter.IFilter[];
    includeAllAncestorFilter?: boolean;
    onFieldFilterUpdate?: (newFilters: Filter.IFilter[], index: number) => void;
}

export const FilterExpressionView: FC<Props> = memo(props => {
    const { allowRelativeDateFilter, field, fieldFilters, onFieldFilterUpdate, disabled, includeAllAncestorFilter } =
        props;

    const [fieldFilterOptions, setFieldFilterOptions] = useState<FieldFilterOption[]>(undefined);
    const [activeFilters, setActiveFilters] = useState<FilterSelection[]>([]);
    const [removeFilterCount, setRemoveFilterCount] = useState<number>(0);
    const [expandedOntologyKey, setExpandedOntologyKey] = useState<string>(undefined);

    useEffect(() => {
        const filterOptions = getFilterOptionsForType(field, includeAllAncestorFilter);
        setFieldFilterOptions(filterOptions);
        setActiveFilters(getFilterSelections(fieldFilters, filterOptions));
    }, [field]); // leave fieldFilters out of deps list, fieldFilters is used to init once

    const unusedFilterOptions = useCallback(
        (thisIndex: number): FieldFilterOption[] => {
            const otherIndex = thisIndex === 1 ? 0 : 1;
            return fieldFilterOptions?.filter(
                option =>
                    (thisIndex === 0 || !option.isSoleFilter) &&
                    activeFilters[otherIndex]?.filterType.value !== option.value
            );
        },
        [fieldFilterOptions, activeFilters]
    );

    const updateFilter = useCallback(
        (
            filterIndex: number,
            newFilterType: FieldFilterOption,
            newFilterValue?: any,
            isSecondValue?: boolean,
            clearBothValues?: boolean
        ) => {
            onFieldFilterUpdate(
                getUpdatedFilters(
                    field,
                    activeFilters,
                    filterIndex,
                    newFilterType,
                    newFilterValue,
                    isSecondValue,
                    clearBothValues
                ),
                filterIndex
            );
        },
        [field, activeFilters]
    );

    const updateActiveFilters = useCallback(
        (filterIndex: number, newFilterSelection: Partial<FilterSelection>) => {
            const filterSelection = {
                ...activeFilters[filterIndex],
                ...newFilterSelection,
            };

            if (filterSelection.filterType) {
                if (filterSelection.filterType.isSoleFilter) {
                    setActiveFilters([filterSelection]);
                } else {
                    setActiveFilters(currentFilters => {
                        return [
                            ...currentFilters.slice(0, filterIndex),
                            filterSelection,
                            ...currentFilters.slice(filterIndex + 1),
                        ];
                    });
                }
            } else {
                setActiveFilters(currentFilters => {
                    return [...currentFilters.slice(0, filterIndex), ...currentFilters.slice(filterIndex + 1)];
                });
                // When a filter is removed, we need to recreate the selectInputs so they pick up the value from the
                // filter that got shifted into the place that was removed. This doesn't happen through normal channels
                // because this is part of the onChange callback for the selectInput, and it has protections against
                // infinitely updating as a result of the onChange action.
                setRemoveFilterCount(count => count + 1);
            }
        },
        [activeFilters]
    );

    const onFieldFilterTypeChange = useCallback(
        (filterUrlSuffix: string, filterIndex: number) => {
            const newActiveFilterType = fieldFilterOptions?.find(option => option.value === filterUrlSuffix);
            const { shouldClear, filterSelection } = getUpdatedFilterSelection(
                newActiveFilterType,
                activeFilters[filterIndex]
            );

            updateFilter(filterIndex, newActiveFilterType, filterSelection.firstFilterValue, false, shouldClear);
            updateActiveFilters(filterIndex, filterSelection);
            setExpandedOntologyKey(undefined);
        },
        [fieldFilterOptions, activeFilters]
    );
    const onUpdateFirstField = useCallback(
        (_, filterUrlSuffix: string) => {
            onFieldFilterTypeChange(filterUrlSuffix, 0);
        },
        [onFieldFilterTypeChange]
    );
    const onUpdateSecondField = useCallback(
        (_, filterUrlSuffix: string) => {
            onFieldFilterTypeChange(filterUrlSuffix, 1);
        },
        [onFieldFilterTypeChange]
    );

    const updateBooleanFilterFieldValue = useCallback(
        (filterIndex: number, event: any) => {
            const newValue = event.target.value;

            updateFilter(filterIndex, activeFilters[filterIndex]?.filterType, newValue, false);
            updateActiveFilters(filterIndex, { firstFilterValue: newValue }); // boolean columns don't support between operators
        },
        [activeFilters]
    );

    const updateTextFilterFieldValue = useCallback(
        (filterIndex, event: any, isNumberInput?: boolean) => {
            if (disabled) return;

            let newValue = isNumberInput ? event.target.valueAsNumber : event.target.value;
            if (isNumberInput && isNaN(newValue)) newValue = null;
            const isSecondInput = event.target.name.endsWith('-second');
            const update: Partial<FilterSelection> = {};
            if (isSecondInput) {
                update.secondFilterValue = newValue;
            } else {
                update.firstFilterValue = newValue;
            }

            updateFilter(filterIndex, activeFilters[filterIndex]?.filterType, newValue, isSecondInput);
            updateActiveFilters(filterIndex, update);
        },
        [activeFilters, disabled]
    );

    const updateDateFilterFieldValue = useCallback(
        (filterIndex: number, newValue: any, isSecondInput?: boolean) => {
            const update: Partial<FilterSelection> = {};
            if (isSecondInput) {
                update.secondFilterValue = newValue;
            } else {
                update.firstFilterValue = newValue;
            }

            updateFilter(filterIndex, activeFilters[filterIndex]?.filterType, newValue, isSecondInput);
            updateActiveFilters(filterIndex, update);
        },
        [activeFilters]
    );

    const updateOntologyFieldValue = useCallback(
        (filterIndex: number, newValue: string, isSecondInput?: boolean) => {
            const update: Partial<FilterSelection> = {};
            if (isSecondInput) {
                update.secondFilterValue = newValue;
            } else {
                update.firstFilterValue = newValue;
            }

            updateFilter(filterIndex, activeFilters[filterIndex]?.filterType, newValue, isSecondInput);
            updateActiveFilters(filterIndex, update);
        },
        [activeFilters]
    );

    const onOntologyFilterExpand = useCallback((ontologyBrowserKey: string, expand: boolean) => {
        if (!expand) setExpandedOntologyKey(undefined);
        else setExpandedOntologyKey(ontologyBrowserKey);
    }, []);

    // FIXME: this is a component, it should be converted to a proper FC
    const renderFilterInput = useCallback(
        (
            placeholder: string,
            filterIndex: number,
            isMultiValueInput?: boolean,
            isSecondInput?: boolean,
            expandedOntologyKey?: string
        ) => {
            const { filterType, firstFilterValue, secondFilterValue } = activeFilters[filterIndex];
            if (!filterType || !filterType.valueRequired) return null;

            const suffix = '-' + filterIndex + (isSecondInput ? '-second' : '');
            const valueRaw = isSecondInput ? secondFilterValue : firstFilterValue;

            const jsonType = field.getDisplayFieldJsonType();
            const isConceptColumn = field.isConceptCodeColumn && isOntologyEnabled();
            const isTimeOnly = field.isTimeColumn;

            if (jsonType === 'date' || jsonType === 'time') {
                return (
                    <DatePickerInput
                        allowRelativeInput={allowRelativeDateFilter}
                        formsy={false}
                        inputClassName="form-control filter-expression__input"
                        wrapperClassName="form-group col-sm-12 filter-expression__input-wrapper"
                        queryColumn={field}
                        name={'field-value-date' + suffix}
                        value={valueRaw}
                        showLabel={false}
                        isClearable
                        hideTime={!isTimeOnly} // filter date and datetime by date only, without timepicker
                        disabled={disabled}
                        onChange={newDate => {
                            let dateStr = newDate;
                            if (typeof newDate !== 'string')
                                dateStr = isTimeOnly
                                    ? getJsonTimeFormatString(newDate)
                                    : getJsonDateFormatString(newDate);
                            updateDateFilterFieldValue(filterIndex, dateStr, isSecondInput);
                        }}
                    />
                );
            } else if (jsonType === 'boolean') {
                return (
                    <>
                        <div key="field-value-bool-true">
                            <label className="field-value-bool-label clickable">
                                <input
                                    checked={valueRaw == 'true'}
                                    className=""
                                    type="radio"
                                    name={'field-value-bool' + suffix}
                                    value="true"
                                    disabled={disabled}
                                    onChange={event => updateBooleanFilterFieldValue(filterIndex, event)}
                                />{' '}
                                TRUE
                            </label>
                        </div>
                        <div key="field-value-bool-false">
                            <label className="field-value-bool-label clickable">
                                <input
                                    checked={valueRaw && valueRaw != 'true'}
                                    className=""
                                    type="radio"
                                    name={'field-value-bool' + suffix}
                                    value="false"
                                    disabled={disabled}
                                    onChange={event => updateBooleanFilterFieldValue(filterIndex, event)}
                                />{' '}
                                FALSE
                            </label>
                        </div>
                    </>
                );
            }

            if (filterType.multiValue && !filterType.betweenOperator) {
                return (
                    <textarea
                        className="form-control filter-expression__textarea"
                        name={'field-value-text' + suffix}
                        onChange={event => updateTextFilterFieldValue(filterIndex, event)}
                        defaultValue={(valueRaw && valueRaw.replaceAll(';', '\n')) ?? ''}
                        rows={3}
                        required
                        placeholder={placeholder}
                    />
                );
            }

            if (!isMultiValueInput && (jsonType === 'int' || jsonType === 'float')) {
                return (
                    <input
                        className="form-control filter-expression__input"
                        step={jsonType === 'int' ? 1 : undefined}
                        name={'field-value-text' + suffix}
                        onChange={event => updateTextFilterFieldValue(filterIndex, event, true)}
                        pattern={jsonType === 'int' ? '-?[0-9]*' : undefined}
                        type="number"
                        value={valueRaw ?? ''}
                        placeholder={placeholder}
                        required
                        disabled={disabled}
                    />
                );
            }

            const textInput = (
                <input
                    className="form-control filter-expression__input"
                    name={'field-value-text' + suffix}
                    type="text"
                    value={valueRaw ?? ''}
                    onChange={event => updateTextFilterFieldValue(filterIndex, event)}
                    placeholder={placeholder}
                    required
                    disabled={disabled}
                />
            );

            if (isConceptColumn) {
                const ontologyBrowserKey = filterIndex + '-' + (isSecondInput ? '2' : '1');
                const expanded = expandedOntologyKey === ontologyBrowserKey;
                const onBrowserToggle = (event): void => {
                    event.preventDefault();
                    if (disabled) return;
                    onOntologyFilterExpand(ontologyBrowserKey, !expanded);
                };
                return (
                    <div className="ontology-input">
                        {textInput}
                        <div className="ontology-browser__menu">
                            <a href="#" onClick={onBrowserToggle}>
                                {expanded ? 'Close Browser' : `Find ${field.caption} By Tree`}
                                <span className="caret" />
                            </a>
                            {expanded && (
                                <OntologyBrowserFilterPanel
                                    ontologyId={field.sourceOntology}
                                    conceptSubtree={field.conceptSubtree}
                                    filterValue={valueRaw}
                                    filterType={Filter.getFilterTypeForURLSuffix(filterType.value)}
                                    onFilterChange={filterValue =>
                                        updateOntologyFieldValue(filterIndex, filterValue, isSecondInput)
                                    }
                                />
                            )}
                        </div>
                    </div>
                );
            }

            return textInput;
        },
        [field, activeFilters, disabled]
    );

    // FIXME: this is a component, it should be converted to a proper FC
    const renderFilterTypeInputs = useCallback(
        (filterIndex: number) => {
            if (filterIndex >= activeFilters.length) return null;

            const { filterType } = activeFilters[filterIndex];
            if (!filterType || !filterType.valueRequired) return null;

            const isBetweenOperator = filterType.betweenOperator;
            const isMultiValueInput = filterType.value === 'in' || filterType.value === 'notin';
            const placeholder = getFilterTypePlaceHolder(filterType.value);

            if (!isBetweenOperator)
                return renderFilterInput(placeholder, filterIndex, isMultiValueInput, false, expandedOntologyKey);

            return (
                <>
                    {renderFilterInput(placeholder, filterIndex, isMultiValueInput, false, expandedOntologyKey)}
                    <div className="filter-expression__and-op">and</div>
                    {renderFilterInput(placeholder, filterIndex, isMultiValueInput, true, expandedOntologyKey)}
                </>
            );
        },
        [field, activeFilters, expandedOntologyKey, disabled]
    );

    const shouldShowSecondFilter = useMemo((): boolean => {
        if (!activeFilters?.length) return false;

        if (activeFilters[0].filterType.isSoleFilter) return false;

        if (!activeFilters[0].filterType.valueRequired) return true;

        if (activeFilters[0].firstFilterValue === undefined) return false;

        return !activeFilters[0].filterType.betweenOperator || activeFilters[0].secondFilterValue !== undefined;
    }, [activeFilters]);

    return (
        <div className="filter-expression__panel">
            <SelectInput
                key={'filter-expression-field-filter-type-' + removeFilterCount} // we need to recreate this component when a filter is removed
                name="filter-expression-field-filter-type"
                containerClass="form-group filter-expression__input-wrapper"
                inputClass="filter-expression__input-select"
                placeholder="Select a filter type..."
                value={activeFilters[0]?.filterType?.value}
                onChange={onUpdateFirstField}
                options={unusedFilterOptions(0)}
                disabled={disabled}
            />
            {renderFilterTypeInputs(0)}
            {shouldShowSecondFilter && (
                <>
                    <div className="field-modal__col-sub-title">and</div>
                    <SelectInput
                        key="filter-expression-field-filter-type"
                        name="filter-expression-field-filter-type"
                        containerClass="form-group filter-expression__input-wrapper"
                        inputClass="filter-expression__input-select"
                        placeholder="Select a filter type..."
                        value={activeFilters[1]?.filterType?.value}
                        onChange={onUpdateSecondField}
                        options={unusedFilterOptions(1)}
                        menuPosition="fixed"
                        disabled={disabled}
                    />
                    {renderFilterTypeInputs(1)}
                </>
            )}
        </div>
    );
});
