import { createContext, useContext } from 'react';

import { AssayProtocolModel } from './models';

export interface FilterCriteriaState {
    openModal: (openToPropertyId?: number) => void;
    protocolModel: AssayProtocolModel;
}

export const FilterCriteriaContext = createContext<FilterCriteriaState>(undefined);

export const useFilterCriteriaContext = () => useContext(FilterCriteriaContext);
