import React, {
    FC,
    forwardRef,
    memo,
    MouseEvent,
    MutableRefObject,
    PropsWithChildren,
    ReactElement,
    ReactNode,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import classNames from 'classnames';

import { generateId } from './util/utils';
import { cancelEvent } from './events';

export type BSStyle = 'success' | 'danger' | 'default' | 'primary' | 'info';
const DROPDOWN_MENU_CLASS = 'dropdown-menu';

/**
 * There are a few narrow cases where clicking on something in a dropdown menu will trigger a click event on the actual
 * <ul> element. This handler cancels the event if the user triggers such an event.
 */
function handleMenuClick(event: MouseEvent<HTMLUListElement>): void {
    const target = event.target as HTMLElement;

    if (target.classList.contains(DROPDOWN_MENU_CLASS)) {
        cancelEvent(event);
    }
}

interface ToggleState<T> {
    onClick: (event: MouseEvent<T>) => void;
    open: boolean;
    setOpen: (show: boolean) => void;
    toggleRef: MutableRefObject<T>;
}

function useToggleState<T extends HTMLElement>(): ToggleState<T> {
    const toggleRef = useRef<T>();
    const [open, setOpen] = useState<boolean>(false);
    const onClick = useCallback(event => {
        event.preventDefault(); // Needed so DropdownMenu doesn't navigate to home page on click
        setOpen(o => !o);
    }, []);

    // onDocumentClick closes the menu if the user clicks on a MenuItem or outside the menu
    const onDocumentClick = useCallback(event => {
        // Don't take action if we're clicking the toggle, as that handles open/close on its own
        const isToggle = event.target === toggleRef.current;
        const insideToggle = toggleRef.current?.contains(event.target);
        if (isToggle || insideToggle) return;
        setOpen(false);
    }, []);

    useEffect(() => {
        // We only want to listen for clicks on the document if the menu is open
        if (open) {
            // Note: capture: true is very important here. It's needed so that we always handle the event
            document.addEventListener('click', onDocumentClick);
        }

        return () => {
            document.removeEventListener('click', onDocumentClick);
        };
    }, [open, onDocumentClick]);

    return { onClick, open, setOpen, toggleRef };
}

interface DropdownMenuProps extends PropsWithChildren {
    asAnchor?: boolean;
    className?: string;
    label?: string;
    pullRight?: boolean;
    title: ReactNode;
}

/**
 * See docs in docs/dropdowns.md
 */
export const DropdownMenu: FC<DropdownMenuProps> = props => {
    const { children, label, pullRight, title, asAnchor = true } = props;
    const id = useMemo(() => generateId('dropdown-anchor-'), []);
    const { onClick, open, toggleRef } = useToggleState<HTMLAnchorElement>();
    const className = classNames('lk-dropdown', 'dropdown', props.className, { open });
    const menuClassName = classNames(DROPDOWN_MENU_CLASS, { 'dropdown-menu-right': pullRight });

    const elemProps = {
        'aria-haspopup': true,
        'aria-expanded': open,
        className: 'dropdown-toggle',
        id,
        onClick,
        ref: toggleRef,
        role: 'button',
        title: label,
    };

    return (
        <div className={className}>
            {asAnchor && (
                <a {...elemProps} href="#">
                    {title}
                    <span className="caret" />
                </a>
            )}
            {!asAnchor && <span {...elemProps}>{title}</span>}

            <ul className={menuClassName} onClick={handleMenuClick}>
                {children}
            </ul>
        </div>
    );
};
DropdownMenu.displayName = 'DropdownMenu';

interface DropdownButtonProps {
    bsStyle?: BSStyle;
    buttonClassName?: string;
    children: ReactNode;
    className?: string;
    disabled?: boolean;
    dropup?: boolean;
    noCaret?: boolean;
    onClick?: () => void;
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
    pullRight?: boolean;
    title: ReactNode;
}

/**
 * See docs in docs/dropdowns.md
 */
export const DropdownButton = forwardRef<HTMLDivElement, DropdownButtonProps>((props, ref) => {
    const {
        bsStyle = 'default',
        children,
        disabled = false,
        dropup = false,
        noCaret = false,
        onClick,
        onMouseEnter,
        onMouseLeave,
        pullRight = false,
        title,
    } = props;
    const id = useMemo(() => generateId('dropdown-button-'), []);
    const { onClick: onToggleClick, open, toggleRef } = useToggleState<HTMLButtonElement>();
    const className = classNames('lk-dropdown', 'btn-group', props.className, { open, dropdown: !dropup, dropup });
    const buttonClassName = classNames('btn', 'btn-' + bsStyle, 'dropdown-toggle', props.buttonClassName);
    const menuClassName = classNames(DROPDOWN_MENU_CLASS, { 'dropdown-menu-right': pullRight });
    const caretClassName = classNames('caret', { 'no-margin': !title });
    const onClick_ = useCallback(
        event => {
            onToggleClick(event);
            onClick?.();
        },
        [onToggleClick, onClick]
    );

    return (
        <div className={className} ref={ref} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
            <button
                aria-haspopup="true"
                aria-expanded={open}
                className={buttonClassName}
                disabled={disabled}
                id={id}
                onClick={onClick_}
                ref={toggleRef}
                role="button"
                type="button"
            >
                {title}
                {!noCaret && <span className={caretClassName} />}
            </button>
            <ul className={menuClassName} aria-labelledby={id} onClick={handleMenuClick} role="menu">
                {children}
            </ul>
        </div>
    );
});
DropdownButton.displayName = 'DropdownButton';

interface SplitButtonProps extends Omit<DropdownButtonProps, 'noCaret' | 'onMouseEnter' | 'onMouseLeave'> {
    buttonDisabled?: boolean;
    // Used to disable the main button
    href?: string;
    menuDisabled?: boolean;
    toggleClassName?: string; // Used to disable the menu toggle button
}

/**
 * See docs in docs/dropdowns.md
 */
export const SplitButton: FC<SplitButtonProps> = memo(props => {
    const {
        bsStyle = 'default',
        buttonDisabled = false,
        children,
        disabled = false, // Used to disable the main button and menu toggle at the same time
        dropup = false,
        href,
        menuDisabled = false,
        onClick,
        pullRight,
        title,
    } = props;
    const { onClick: onToggleClick, open, toggleRef } = useToggleState<HTMLButtonElement>();
    const wrapperClassName = classNames('split-button-dropdown', 'btn-group', props.className, {
        open,
        dropdown: !dropup,
        dropup,
    });
    const buttonClassName = classNames('split-button-dropdown__button', 'btn', 'btn-' + bsStyle, props.buttonClassName);
    const toggleClassName = classNames('btn', 'btn-' + bsStyle, 'dropdown-toggle', props.toggleClassName);
    const menuClassName = classNames(DROPDOWN_MENU_CLASS, { 'dropdown-menu-right': pullRight });
    const id = useMemo(() => generateId('dropdown-button-'), []);

    if (!href && !onClick) {
        console.warn('SplitButton is missing href and onClick, did you forget to add one of these props?');
    }

    let button: ReactElement;

    if (href !== undefined) {
        button = (
            <a href={href} className={buttonClassName}>
                {title}
            </a>
        );
    } else {
        button = (
            <button className={buttonClassName} onClick={onClick} disabled={disabled || buttonDisabled} type="button">
                {title}
            </button>
        );
    }

    return (
        <div className={wrapperClassName}>
            {button}
            <button
                aria-haspopup="true"
                aria-expanded={open}
                className={toggleClassName}
                disabled={disabled || menuDisabled}
                id={id}
                onClick={onToggleClick}
                ref={toggleRef}
                role="button"
                type="button"
            >
                <span className="caret no-margin" />
            </button>
            <ul className={menuClassName} aria-labelledby={id} onClick={handleMenuClick} role="menu">
                {children}
            </ul>
        </div>
    );
});
SplitButton.displayName = 'SplitButton';

interface MenuHeaderProps {
    className?: string;
    text: string;
}

/**
 * See docs in docs/dropdowns.md
 */
export const MenuHeader: FC<MenuHeaderProps> = ({ className, text }) => (
    <li className={classNames('lk-dropdown-header', 'dropdown-header', className)} role="heading" onClick={cancelEvent}>
        {text}
    </li>
);
MenuHeader.displayName = 'MenuHeader';

/**
 * See docs in docs/dropdowns.md
 */
export const MenuDivider = (): ReactElement => <li className="divider" role="separator" onClick={cancelEvent} />;

export interface MenuItemProps {
    active?: boolean;
    children: ReactNode;
    className?: string;
    disabled?: boolean;
    href?: string;
    onClick?: () => void;
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
    rel?: string;
    target?: string;
    title?: string;
}

/**
 * See docs in docs/dropdowns.md
 */
export const MenuItem = forwardRef<HTMLLIElement, MenuItemProps>((props, ref) => {
    const {
        active = false,
        children,
        disabled,
        href = '#',
        onClick,
        onMouseEnter,
        onMouseLeave,
        rel,
        target,
        title,
    } = props;
    const className = classNames('lk-menu-item', props.className, { active, disabled });
    const onClick_ = useCallback(
        (e: MouseEvent<HTMLAnchorElement>) => {
            // If the user didn't override the href, then we prevent default in order to prevent the browser from
            // navigating us to the home page
            if (disabled || href === '#') {
                e.preventDefault();
            }

            // We have to prevent the document handler from executing in the disabled case because by the time it
            // executes React will have already updated the DOM, so it cannot tell that you clicked on a disabled item
            if (disabled) cancelEvent(e);

            if (!disabled && onClick) onClick();
        },
        [disabled, href, onClick]
    );
    return (
        <li className={className} role="presentation" ref={ref} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
            <a onClick={onClick_} href={href} rel={rel} role="menuitem" target={target} title={title}>
                {children}
            </a>
        </li>
    );
});
MenuItem.displayName = 'MenuItem';
