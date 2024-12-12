import { createContext, useContext } from 'react';

export interface FilterCriteriaState {
    openModal: (openToPropertyId?: number) => void;
}

export const FilterCriteriaContext = createContext<FilterCriteriaState>(undefined);

export const useFilterCriteriaContext = () => useContext(FilterCriteriaContext);
