import React, { FC, memo, useCallback, useEffect, useState } from 'react';
import DatePicker from 'react-datepicker';
import { Dropdown, FormControl } from 'react-bootstrap';

import { Filter } from '@labkey/api';

import { QueryColumn } from '../../../public/QueryColumn';
import { SelectInput } from '../forms/input/SelectInput';
import {
    App,
    formatDateTime,
    OntologyBrowserFilterPanel,
    parseDate
} from '../../../index';

import { formatDate, isDateTimeCol } from '../../util/Date';

import {
    getFilterSelections,
    getFilterTypePlaceHolder,
    getFilterOptionsForType,
    getUpdatedFilters,
    getUpdatedFilterSelection,
} from './utils';
import { FieldFilterOption, FilterSelection } from './models';
import { CONCEPT_CODE_CONCEPT_URI } from "../domainproperties/constants";

interface Props {
    field: QueryColumn;
    fieldFilters: Filter.IFilter[];
    onFieldFilterUpdate?: (newFilters: Filter.IFilter[], index: number) => void;
    filterTypesToExclude?: string[];
}

export const FilterExpressionView: FC<Props> = memo(props => {
    const { field, fieldFilters, onFieldFilterUpdate, filterTypesToExclude } = props;

    const [fieldFilterOptions, setFieldFilterOptions] = useState<FieldFilterOption[]>(undefined);
    const [activeFilters, setActiveFilters] = useState<FilterSelection[]>([]);
    const [removeFilterCount, setRemoveFilterCount] = useState<number>(0);
    const [expandedOntologyKey, setExpandedOntologyKey] = useState<string>(undefined);

    useEffect(() => {
        const filterOptions = getFilterOptionsForType(field, App.isOntologyEnabled(), filterTypesToExclude);
        setFieldFilterOptions(filterOptions);
        setActiveFilters(getFilterSelections(fieldFilters, filterOptions));
    }, [field]); // leave fieldFilters out of deps list, fieldFilters is used to init once

    const unusedFilterOptions = useCallback(
        (thisIndex: number): FieldFilterOption[] => {
            const otherIndex = thisIndex == 1 ? 0 : 1;
            return fieldFilterOptions?.filter(
                option =>
                    (thisIndex == 0 || !option.isSoleFilter) &&
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
        (fieldname: any, filterUrlSuffix: any, filterIndex: number) => {
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
        [activeFilters]
    );

    const updateDateFilterFieldValue = useCallback(
        (filterIndex: number, newValue: any, isTime: boolean, isSecondInput?: boolean) => {
            const newDate = newValue ? (isTime ? formatDateTime(newValue) : formatDate(newValue)) : null;
            const update: Partial<FilterSelection> = {};
            if (isSecondInput) {
                update.secondFilterValue = newDate;
            } else {
                update.firstFilterValue = newDate;
            }

            updateFilter(filterIndex, activeFilters[filterIndex]?.filterType, newDate, isSecondInput);
            updateActiveFilters(filterIndex, update);
        },
        [activeFilters]
    );

    const updateOntologyFieldValue = useCallback((filterIndex: number, newValue: string, isSecondInput?: boolean) => {
        const update: Partial<FilterSelection> = {};
        if (isSecondInput) {
            update.secondFilterValue = newValue;
        } else {
            update.firstFilterValue = newValue;
        }

        updateFilter(filterIndex, activeFilters[filterIndex]?.filterType, newValue, isSecondInput);
        updateActiveFilters(filterIndex, update);
    }, [activeFilters]);

    const onOntologyFilterExpand = useCallback((ontologyBrowserKey: string, expand: boolean) => {
        if (!expand)
            setExpandedOntologyKey(undefined);
        else
            setExpandedOntologyKey(ontologyBrowserKey);
    }, []);

    const renderFilterInput = useCallback(
        (placeholder: string, filterIndex: number, isMultiValueInput?: boolean, isSecondInput?: boolean, expandedOntologyKey?: string) => {
            const { filterType, firstFilterValue, secondFilterValue } = activeFilters[filterIndex];
            if (!filterType || !filterType.valueRequired) return null;

            const suffix = '-' + filterIndex + (isSecondInput ? '-second' : '');
            const valueRaw = isSecondInput ? secondFilterValue : firstFilterValue;

            const jsonType = field.getDisplayFieldJsonType();
            const isConceptColumn = jsonType === 'string' && field.conceptURI === CONCEPT_CODE_CONCEPT_URI && App.isOntologyEnabled();

            if (jsonType === 'date') {
                const showTimeStamp = isDateTimeCol(field);
                return (
                    <DatePicker
                        autoComplete="off"
                        className="form-control filter-expression__input"
                        wrapperClassName="form-group filter-expression__input-wrapper"
                        selectsEnd
                        isClearable
                        required
                        selected={valueRaw ? parseDate(valueRaw) : undefined}
                        name={'field-value-date' + suffix}
                        onChange={newDate =>
                            updateDateFilterFieldValue(filterIndex, newDate, showTimeStamp, isSecondInput)
                        }
                        dateFormat={showTimeStamp ? App.getDateTimeFormat() : App.getDateFormat()}
                        showTimeSelect={showTimeStamp}
                    />
                );
            } else if (jsonType === 'boolean') {
                return (
                    <>
                        <div key="field-value-bool-true">
                            <input
                                checked={valueRaw == 'true'}
                                className=""
                                type="radio"
                                name={'field-value-bool' + suffix}
                                value="true"
                                onChange={event => updateBooleanFilterFieldValue(filterIndex, event)}
                            />{' '}
                            TRUE
                        </div>
                        <div key="field-value-bool-false">
                            <input
                                checked={valueRaw != 'true'}
                                className=""
                                type="radio"
                                name={'field-value-bool' + suffix}
                                value="false"
                                onChange={event => updateBooleanFilterFieldValue(filterIndex, event)}
                            />{' '}
                            FALSE
                        </div>
                    </>
                );
            }

            if (!isMultiValueInput && (jsonType === 'int' || jsonType === 'float')) {
                return (
                    <FormControl
                        className="form-control filter-expression__input"
                        step={jsonType === 'int' ? 1 : undefined}
                        name={'field-value-text' + suffix}
                        onChange={event => updateTextFilterFieldValue(filterIndex, event, true)}
                        pattern={jsonType === 'int' ? '-?[0-9]*' : undefined}
                        type="number"
                        value={valueRaw ?? ''}
                        placeholder={placeholder}
                        required
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
                />
            );

            if (isConceptColumn) {
                const ontologyBrowserKey = filterIndex + '-' + (isSecondInput ? '2' : '1');
                const expanded = expandedOntologyKey === ontologyBrowserKey;
                return (
                    <div>
                        {textInput}
                        <Dropdown
                            className="ontology-browser__menu"
                            componentClass="div"
                            id="ontology-browser__menu"
                            onToggle={() => onOntologyFilterExpand(ontologyBrowserKey, !expanded)}
                            open={expanded}
                        >
                            <Dropdown.Toggle useAnchor={true}>
                                <span>{expanded ? 'Close Browser' : `Find ${field.caption} By Tree` }</span>
                            </Dropdown.Toggle>
                            <Dropdown.Menu>
                                <OntologyBrowserFilterPanel
                                    ontologyId={field.sourceOntology}
                                    conceptSubtree={field.conceptSubtree}
                                    filterValue={valueRaw}
                                    filterType={Filter.getFilterTypeForURLSuffix(filterType.value)}
                                    onFilterChange={(filterValue) => updateOntologyFieldValue(filterIndex, filterValue, isSecondInput)}
                                />
                            </Dropdown.Menu>
                        </Dropdown>
                    </div>
                );
            }

            return textInput;
        },
        [field, activeFilters]
    );

    const renderFilterTypeInputs = useCallback(
        (filterIndex: number) => {
            if (filterIndex >= activeFilters.length) return null;

            const { filterType } = activeFilters[filterIndex];
            if (!filterType || !filterType.valueRequired) return null;

            const isBetweenOperator = filterType.betweenOperator;
            const isMultiValueInput = filterType.value === 'in' || filterType.value === 'notin';
            const placeholder = getFilterTypePlaceHolder(filterType.value, field.getDisplayFieldJsonType());

            if (!isBetweenOperator) return renderFilterInput(placeholder, filterIndex, isMultiValueInput, false, expandedOntologyKey);

            return (
                <>
                    {renderFilterInput(placeholder, filterIndex, isMultiValueInput, false, expandedOntologyKey)}
                    <div className="filter-expression__and-op">and</div>
                    {renderFilterInput(placeholder, filterIndex, isMultiValueInput, true, expandedOntologyKey)}
                </>
            );
        },
        [field, activeFilters, expandedOntologyKey]
    );

    const shouldShowSecondFilter = useCallback((): boolean => {
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
                onChange={(fieldname: any, filterUrlSuffix: any) =>
                    onFieldFilterTypeChange(fieldname, filterUrlSuffix, 0)
                }
                options={unusedFilterOptions(0)}
            />
            {renderFilterTypeInputs(0)}
            {shouldShowSecondFilter() && (
                <>
                    <div className="filter-modal__col-sub-title">and</div>
                    <SelectInput
                        key="filter-expression-field-filter-type"
                        name="filter-expression-field-filter-type"
                        containerClass="form-group filter-expression__input-wrapper"
                        inputClass="filter-expression__input-select"
                        placeholder="Select a filter type..."
                        value={activeFilters[1]?.filterType?.value}
                        onChange={(fieldname: any, filterUrlSuffix: any) =>
                            onFieldFilterTypeChange(fieldname, filterUrlSuffix, 1)
                        }
                        options={unusedFilterOptions(1)}
                    />
                    {renderFilterTypeInputs(1)}
                </>
            )}
        </div>
    );
});
