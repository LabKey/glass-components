import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export const useNotAuthorized = (identifier?: any, initialState = false) => {
    const [notAuthorized, setNotAuthorized] = useState(initialState);
    const [message, setMessage] = useState<string>();

    const onNotAuthorized = useCallback(
        (authMessage?: string) => {
            setMessage(authMessage);
            setNotAuthorized(true);
        },
        [setNotAuthorized, setMessage]
    );

    useEffect(() => {
        setNotAuthorized(initialState);
    }, [identifier, initialState]);

    return { notAuthorized, onNotAuthorized, message };
};

export const useNotFound = (identifier: any) => {
    const [notFound, setNotFound] = useState(false);

    const onNotFound = useCallback(() => {
        setNotFound(true);
    }, [setNotFound]);

    useEffect(() => {
        setNotFound(false);
    }, [identifier]);

    return { notFound, onNotFound };
};

// Creates a div with portalId and injects it into the DOM as the last child of the <body> tag
export function createPortalContainer(portalId): HTMLDivElement {
    const popoverElement = document.createElement('div');
    popoverElement.setAttribute('id', portalId);
    document.body.appendChild(popoverElement);
    return popoverElement;
}

/**
 * usePortalRef is a method that automatically injects a DOM element for your portal into the document body, and returns
 * a ref that can be used with ReactDOM.createPortal. It will automatically remove the portal element from the DOM when
 * your component unmounts.
 * @param portalId The unique id to give the portal. The portal id can be re-used among several related components that
 * need to be rendered in a portal, each component using usePortalRef will get a unique DOM element within the shared
 * portal element. The shared portal element will be automatically removed from the DOM when no components are actively
 * using the portalId.
 */
export function usePortalRef(portalId): HTMLDivElement {
    const portalElementRef = useRef<HTMLDivElement>(null);

    if (portalElementRef.current === null) {
        portalElementRef.current = document.createElement('div');
    }

    useEffect(() => {
        let portalContainer = document.querySelector(`#${portalId}`);

        if (!portalContainer) {
            portalContainer = createPortalContainer(portalId);
        }

        portalContainer.appendChild(portalElementRef.current);

        return () => {
            portalElementRef.current.remove();

            // We only remove the portalContainer if it has no children, that way if two different components share the
            // same portal id we only remove the portal container after all of them have stopped using it.
            if (!portalContainer.childElementCount) {
                portalContainer.remove();
            }
        };
    }, []);

    return portalElementRef.current;
}

export interface UseTimeout {
    clear: () => void;
    set: (handler: TimerHandler, timeout?: number) => void;
}

/**
 * Hook that provides timeout functionality. This utilizes a React.Ref to track a timeout and provides
 * analogous functions to `clear()` (wraps `clearTimeout()`) and `set()` (wraps `setTimeout()`).
 * Notes:
 * - Automatically clears the timeout on upon dismount of the hook.
 * - Nothing will change in the timeout after it is established so it is safe to include
 *   in hook dependency lists (e.g. `useEffect(() => {}, [timeout])`) and know it will not cause
 *   further execution of the hook.
 *
 * Example:
 * ```tsx
 * const SomeComponent: FC = (props) => {
 *     const { mutatedProp } = props;
 *     const [result, setResult] = useState();
 *
 *     // Instantiate the hook to access the timeout interface
 *     const timeout = useTimeout();
 *
 *     // Function that is called when the timeout as completed
 *     const debouncedLoad = useCallback(async () => {
 *         const result_ = await api.load(mutatedProp);
 *         setResult(result_);
 *     }, [mutatedProp]);
 *
 *     useEffect(() => {
 *         // The mutatedProp has changed and is not available.
 *         // Ensure no subsequent calls to the timeout callback are invoked.
 *         if (!mutatedProp) {
 *             timeout.clear();
 *             return;
 *         }
 *
 *         // Set the callback and start the timeout.
 *         timeout.set(debouncedLoad, 1_000);
 *     }, [mutatedProp, timeout]);
 *
 *     return <div />;
 * };
 * ```
 */
export function useTimeout(): UseTimeout {
    const ref = useRef<number>(undefined);

    const clear = useCallback(() => {
        if (ref.current !== undefined) {
            clearTimeout(ref.current);
            ref.current = undefined;
        }
    }, []);

    const set = useCallback(
        (handler: TimerHandler, timeout?: number): void => {
            clear();
            ref.current = setTimeout(handler, timeout);
        },
        [clear]
    );

    // Cancel the timeout when unmounted
    useEffect(() => clear, [clear]);

    return useMemo(() => ({ clear, set }), [clear, set]);
}

interface ModalState {
    close: () => void;
    open: () => void;
    show: boolean;
}

type voidFn = () => void;

/**
 * Hook that provides the basic state management boilerplate necessary to open/close a modal.
 * @param openCallback an optional callback to be called when the modal is opened
 */
export function useModalState(openCallback?: voidFn): ModalState {
    const [show, setShow] = useState<boolean>(false);
    const open = useCallback(() => {
        if (openCallback !== undefined) openCallback();
        setShow(true);
    }, [openCallback]);
    const close = useCallback(() => setShow(false), []);
    return useMemo(() => ({ close, open, show }), [close, open, show]);
}
