import { useCallback, useEffect, useRef } from 'react';

import { RequestHandler } from '../request';

export interface UseRequestHandler {
    requestHandler: RequestHandler;
    resetRequestHandler: () => void;
}

/**
 * React hook that encapsulates handling for aborting stale XMLHttpRequests.
 * Sometimes there are requests that the client makes that can often be made "stale" by the
 * user taking a subsequent action that will enqueue another request. This simplifies state handling
 * as you no longer need to worry about multiple request race conditions.
 *
 * A simple example is a user typing into an input to search against some API. This might necessitate rapid requests
 * be fired off where any in-flight requests are now stale.
 * Example:
 * ```tsx
 * const SearchInput: FC = (props) => {
 *     const { api } = props;
 *     const [searchQuery, setSearchQuery] = useState<string>();
 *     const [searchResult, setSearchResult] = useState();
 *     const { requestHandler, resetRequestHandler } = useRequestHandler();
 *
 *     const search = useCallback(async (query: string) => {
 *         try {
 *             const result = await api.search({ query, requestHandler });
 *             resetRequestHandler();
 *             setSearchResult(result);
 *         } catch (e) {
 *             // Request may have been aborted/cancelled
 *             aborted = e.status === 0;
 *             if (!aborted) {
 *                 setError('Search failed!');
 *             }
 *         }
 *     }, [api.search, resetRequestHandler]);
 *
 *     const onChange = useCallback<ChangeEventHandler<HTMLInputElement>>(evt => {
 *         setSearchQuery(evt.target.value);
 *     }, []);
 *
 *     const useEffect(() => {
 *         // The input changed, fire off another query
 *         // (in reality you would debounce this but keeping it simple here)
 *         search(searchQuery);
 *     }, [search, searchQuery]);
 *
 *     return (
 *         <div>
 *             <input name="searchQuery" onChange={onChange} />
 *             <SearchResult searchResult={searchResult} />
 *         </div>
 *     );
 * };
 * ```
 */
export function useRequestHandler(abortOnDismount = false): UseRequestHandler {
    const requestRef = useRef<XMLHttpRequest>(undefined);

    // This requestHandler aborts prior search requests in the event that another request is made
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
