import React, {
    Children,
    createContext,
    FC,
    MouseEvent,
    PropsWithChildren,
    ReactElement,
    ReactNode,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from 'react';
import classNames from 'classnames';

import { cancelEvent } from './events';
import { generateId } from './util/utils';

function tabId(id: string, eventKey: string): string {
    return `${id}-tab-${eventKey}`;
}

function paneId(id: string, eventKey: string): string {
    return `${id}-pane-${eventKey}`;
}

interface TabContext {
    activeKey: string;
    id: string;
}

const Context = createContext<TabContext>(undefined);

interface TabProps extends PropsWithChildren {
    children?: ReactNode;
    className?: string;
    disabled?: boolean;
    eventKey: string;
    title: ReactNode;
}

export const Tab: FC<TabProps> = ({ children, className, eventKey }) => {
    const { id, activeKey } = useContext(Context);
    const active = activeKey === eventKey;
    const className_ = classNames('tab-pane', className, { active });
    return (
        <div
            aria-labelledby={tabId(id, eventKey)}
            aria-hidden={!active}
            className={className_}
            id={paneId(id, eventKey)}
            role="tabpanel"
        >
            {children}
        </div>
    );
};

interface TabsProps {
    activeKey?: string;
    children: ReactElement<TabProps> | Array<ReactElement<TabProps>>;
    className?: string;
    contentCls?: string;
    onSelect?: (eventKey: string) => void;
}

export const Tabs: FC<TabsProps> = props => {
    const { children, onSelect, contentCls = 'tab-content' } = props;
    const id = useMemo(() => generateId('tabs'), []);
    const className = classNames('lk-tabs', props.className);
    const [activeKey, setActiveKey] = useState<string>(() => {
        if (props.activeKey !== undefined) return props.activeKey;
        // Child is null if we do something like {canSeeSpecialTab && (<Tab eventKey="specialTab">...</Tab>}
        const firstNotNull = Children.toArray(children).find(child => {
            return child !== null;
        }) as ReactElement<TabProps>;
        return firstNotNull.props.eventKey;
    });
    const tabContext = useMemo(() => ({ id, activeKey }), [id, activeKey]);
    const onTabClick = useCallback(
        (event: MouseEvent<HTMLAnchorElement>) => {
            cancelEvent(event);
            const targetEventKey = event.currentTarget.dataset.eventKey;
            if (onSelect !== undefined) onSelect(targetEventKey);
            else setActiveKey(targetEventKey);
        },
        [onSelect]
    );

    // Need this useEffect to allow for controlled usages of the selected tab state
    useEffect(() => {
        if (props.activeKey !== undefined) setActiveKey(props.activeKey);
    }, [props.activeKey]);

    const tabs = useMemo(() => {
        return Children.map(children, (child: ReactElement<TabProps>) => {
            // Child is null if we do something like {canSeeSpecialTab && (<Tab eventKey="specialTab">...</Tab>}
            if (child === null) return null;
            const eventKey = child?.props?.eventKey;
            const title = child?.props?.title;
            const disabled = child?.props?.disabled;
            const active = eventKey === activeKey;
            const tabClassName = classNames({ active, disabled });
            return (
                <li className={tabClassName} key={eventKey} role="presentation">
                    <a
                        aria-controls={paneId(id, eventKey)}
                        aria-selected={active}
                        data-event-key={eventKey}
                        href="#"
                        id={tabId(id, eventKey)}
                        onClick={disabled ? cancelEvent : onTabClick}
                        role="tab"
                    >
                        {title}
                    </a>
                </li>
            );
        });
    }, [children, activeKey, id, onTabClick]);

    return (
        <div className={className}>
            <ul className="nav nav-tabs" role="tablist">
                {tabs}
            </ul>
            <div className={contentCls}>
                <Context.Provider value={tabContext}>{children}</Context.Provider>
            </div>
        </div>
    );
};
