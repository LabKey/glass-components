import { useCallback, useEffect, useRef } from 'react';

import { RequestHandler } from '../request';

export interface UseRequestHandler {
    requestHandler: RequestHandler;
    resetRequestHandler: () => void;
}

/**
 * React hook that encapsulates handling for aborting stale XMLHttpRequests.
 * NK: In general, I'd like to make it easier to handle aborting requests within our applications.
 * This is a first crack at it but could certainly be improved/extended before being made available more broadly.
 */
export function useRequestHandler(abortOnDismount = false): UseRequestHandler {
    const requestRef = useRef<XMLHttpRequest>(undefined);

    // This requestHandler aborts prior search requests in the event that another search request is made
    const requestHandler = useCallback<RequestHandler>(request => {
        requestRef.current?.abort();
        requestRef.current = request;
    }, []);

    const resetRequestHandler = useCallback(() => {
        requestRef.current = undefined;
    }, []);

    useEffect(() => {
        if (!abortOnDismount) return;

        // eslint-disable-next-line consistent-return
        return () => {
            requestRef.current?.abort();
            requestRef.current = undefined;
        };

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return { requestHandler, resetRequestHandler };
}
