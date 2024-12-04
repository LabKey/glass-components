import React, {
    cloneElement,
    Children,
    FC,
    useRef,
    ReactElement,
    useState,
    useCallback,
    MutableRefObject,
    CSSProperties,
    useMemo,
    PropsWithChildren,
    useEffect,
} from 'react';
import { createPortal } from 'react-dom';

import classNames from 'classnames';

import { usePortalRef } from './hooks';
import { generateId } from './util/utils';

interface OverlayTriggerState<T extends Element = HTMLDivElement> {
    onClick: (event) => void;
    onMouseEnter: () => void;
    onMouseLeave: () => void;
    portalEl: HTMLElement;
    show: boolean;
    targetRef: MutableRefObject<T>;
}

/**
 * useOverlayTriggerState is a useful hook for when you want to render an overlay, but you can't use OverlayTrigger
 * because you can't wrap your component in an arbitrary div.
 *
 * See additional docs at components/docs/overlays.md
 *
 * @param id the id to use for the portal
 * @param hoverEventsEnabled whether onMouseEnter/Leave will trigger the show state
 * @param clickEventEnabled whether onClick with trigger the showState
 * @param delay the amount, in ms, to delay before showing the overlay
 */
export function useOverlayTriggerState<T extends Element = HTMLDivElement>(
    id: string,
    hoverEventsEnabled: boolean,
    clickEventEnabled: boolean,
    delay: number = undefined
): OverlayTriggerState<T> {
    const targetRef = useRef<T>(null);
    const portalEl = usePortalRef('overlay-trigger-portal-' + id);
    const [show, setShow] = useState<boolean>(false);
    const [_, setTimeoutId] = useState<number>(undefined);
    const onMouseEnter = useCallback(() => {
        if (!hoverEventsEnabled) return;

        if (delay) {
            setTimeoutId(window.setTimeout(() => setShow(true), delay));
            return;
        }

        setShow(true);
    }, [delay, hoverEventsEnabled]);
    const onMouseOut = useCallback(() => {
        if (!hoverEventsEnabled) return;

        setTimeoutId(currentId => {
            if (currentId) window.clearTimeout(currentId);
            return undefined;
        });

        setShow(false);
    }, [hoverEventsEnabled]);

    const onClick = useCallback(
        event => {
            if (!clickEventEnabled) return;
            const isToggle = event.target === targetRef.current;
            const insideToggle = portalEl?.contains(event.target);
            if (isToggle || !insideToggle) {
                setShow(_show => !_show);
            }
        },
        [clickEventEnabled]
    );

    const onDocumentClick = useCallback(event => {
        const isToggle = event.target === targetRef.current;
        const insideToggle = portalEl?.contains(event.target);
        if (!isToggle && !insideToggle) {
            setShow(false);
        }
    }, []);

    useEffect(() => {
        if (clickEventEnabled) {
            if (show) {
                document.addEventListener('click', onDocumentClick);
            }
            return () => {
                document.removeEventListener('click', onDocumentClick);
            };
        }
    }, [onDocumentClick, show, clickEventEnabled]);

    return {
        onClick,
        onMouseEnter,
        onMouseLeave: onMouseOut,
        portalEl,
        show,
        targetRef,
    };
}

export interface OverlayComponent<O extends Element = HTMLDivElement> {
    targetRef?: MutableRefObject<O>;
}

export type TriggerType = 'click' | 'hover';

interface Props extends PropsWithChildren {
    className?: string;
    delay?: number;
    id?: string;
    overlay: ReactElement<OverlayComponent>; // See note in doc string below
    style?: CSSProperties;
    triggerType?: TriggerType;
}

/**
 * Wraps a ReactElement with an inline-block element that has the appropriate handlers to trigger the visibility of an
 * overlay. Can be triggered by hover or click. There are a few caveats to using this component:
 *  - Your `overlay` component must have a prop called `targetRef`, which this component will inject
 *      - Your `overlay` component should probably be using the `useOverlayPositioning` hook in order to position itself
 *  - There should only be one child element to this component, we use React.Children.only to assert this
 *  - The child element to this must take a "ref" prop, and it must set that ref on the element you want to render the
 *  overlay in relation to
 *      - The easiest way to accomplish this is to make the child of this component a low level element such as div,
 *      span, button, etc.
 *      - If you need to make a proper component the direct child of this you can wrap your component with forwardRef,
 *      but you will still need to pass that injected ref to a low level tag like div, span, etc.
 *          - https://react.dev/reference/react/forwardRef
 *
 * See additional docs at components/docs/overlays.md
 */
export const OverlayTrigger: FC<Props> = ({
    children,
    className,
    delay = undefined,
    id,
    overlay,
    triggerType = 'hover',
    style,
}) => {
    const id_ = useMemo(() => id ?? generateId(), [id]);
    const { onMouseEnter, onMouseLeave, onClick, portalEl, show, targetRef } = useOverlayTriggerState(
        id_,
        triggerType === 'hover',
        triggerType === 'click',
        delay
    );
    const clonedChild = cloneElement(Children.only(children) as ReactElement, { ref: targetRef });
    const className_ = classNames('overlay-trigger', className);
    const clonedContent = cloneElement(overlay, { targetRef });

    return (
        <div
            className={className_}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            onClick={onClick}
            style={style}
        >
            {clonedChild}

            {show && createPortal(clonedContent, portalEl)}
        </div>
    );
};
OverlayTrigger.displayName = 'OverlayTrigger';
