import { Dispatch, SetStateAction, useCallback, useEffect, useMemo, useState } from 'react';

import { LoadingState } from '../public/LoadingState';

import { resolveErrorMessage } from './util/messaging';

interface LoadableState<T> {
    error: string;
    load: () => Promise<void>;
    loadingState: LoadingState;
    setError: Dispatch<SetStateAction<string>>;
    setLoadingState: Dispatch<SetStateAction<LoadingState>>;
    setValue: Dispatch<SetStateAction<T>>;
    value: T;
}

type Loader<T> = () => Promise<T>;

export function useLoadableState<T>(loader: Loader<T>): LoadableState<T> {
    const [error, setError] = useState<string>(undefined);
    const [loadingState, setLoadingState] = useState<LoadingState>(LoadingState.INITIALIZED);
    const [value, setValue] = useState<T>(undefined);
    const load = useCallback(async () => {
        setLoadingState(LoadingState.LOADING);

        try {
            const result = await loader();
            setValue(result);
        } catch (e) {
            setError(resolveErrorMessage(e));
        } finally {
            setLoadingState(LoadingState.LOADED);
        }
    }, [loader]);
    const state = useMemo(
        () => ({
            error,
            load,
            loadingState,
            setError,
            setLoadingState,
            setValue,
            value,
        }),
        [error, load, loadingState, value]
    );

    useEffect(() => {
        load();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    return state;
}
