import { createContext, useContext } from 'react';
import { HitCriteria } from './models';

export interface HitCriteriaContextState {
    hitCriteria: HitCriteria;
    openModal: (openToPropertyId?: number) => void;
}

export const HitCriteriaContext = createContext<HitCriteriaContextState>(undefined);

export const useHitCriteriaContext = () => useContext(HitCriteriaContext);
