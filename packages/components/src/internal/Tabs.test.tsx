import React, { useCallback, useState } from 'react';
import { render } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import { Tab, Tabs } from './Tabs';

describe('Tabs', () => {
    test('Uncontrolled', async () => {
        render(
            <Tabs>
                <Tab eventKey="one" title="Tab One">
                    <p>One</p>
                </Tab>
                <Tab eventKey="two" title="Tab Two">
                    <p>Two</p>
                </Tab>
            </Tabs>
        );

        let tabs = document.querySelectorAll('li');
        const tabContents = document.querySelectorAll('.tab-pane');
        expect(tabs).toHaveLength(2);
        expect(tabContents).toHaveLength(2);
        expect(tabs[0].textContent).toEqual('Tab One');
        expect(tabs[0].classList[0]).toEqual('active');
        expect(tabContents[0].textContent).toEqual('One');
        expect(tabs[1].textContent).toEqual('Tab Two');
        expect(tabContents[1].textContent).toEqual('Two');

        await userEvent.click(document.querySelectorAll('li a')[1]);
        tabs = document.querySelectorAll('li');
        expect(tabs[0].classList).toHaveLength(0);
        expect(tabs[1].classList[0]).toEqual('active');
    });

    const ControlledTabs = props => {
        const [activeKey, setActiveKey] = useState('two');
        const onSelect = useCallback(
            (...args) => {
                props.onSelect(...args);
                setActiveKey(args[0]);
            },
            [props.onSelect]
        );
        return (
            <Tabs activeKey={activeKey} onSelect={onSelect}>
                <Tab eventKey="one" title="Tab One">
                    <p>One</p>
                </Tab>
                <Tab eventKey="two" title="Tab Two">
                    <p>Two</p>
                </Tab>
            </Tabs>
        );
    };

    test('Controlled', async () => {
        const onSelect = jest.fn();
        render(<ControlledTabs onSelect={onSelect} />);
        let tabs = document.querySelectorAll('li');
        expect(tabs[0].classList).toHaveLength(0);
        expect(tabs[1].classList[0]).toEqual('active');
        await userEvent.click(document.querySelectorAll('li a')[0]);
        expect(onSelect).toHaveBeenCalledWith('one');
        tabs = document.querySelectorAll('li');
        expect(tabs[0].classList[0]).toEqual('active');
        expect(tabs[1].classList).toHaveLength(0);
    });

    const SometimesRenderChildren = () => {
        const [activeKey, setActiveKey] = useState('one');
        const onSelect = useCallback(tabKey => {
            setActiveKey(tabKey);
        }, []);

        return (
            <Tabs activeKey={activeKey} onSelect={onSelect}>
                <Tab eventKey="one" title="Tab One">
                    <p>One</p>
                </Tab>
                <Tab eventKey="two" title="Tab Two">
                    <p>Two</p>
                </Tab>
                {activeKey !== 'one' && (
                    <Tab eventKey="three" title="Secret Third Tab">
                        <p>Wow I'm a secret!</p>
                    </Tab>
                )}
            </Tabs>
        );
    };

    test('Children that are not rendered', async () => {
        render(<SometimesRenderChildren />);
        let tabs = document.querySelectorAll('li');
        expect(tabs).toHaveLength(2);
        await userEvent.click(document.querySelectorAll('li a')[1]);
        tabs = document.querySelectorAll('li');
        expect(tabs).toHaveLength(3);
        expect(tabs[2].textContent).toEqual('Secret Third Tab');
    });

    test('No children within Tab', () => {
        render(
            <Tabs>
                <Tab eventKey="one" title="Tab One" />
                <Tab eventKey="two" title="Tab Two" />
            </Tabs>
        );

        const tabs = document.querySelectorAll('li');
        const tabContents = document.querySelectorAll('.tab-pane');
        expect(tabs).toHaveLength(2);
        expect(tabContents).toHaveLength(2);
        expect(tabContents[0].textContent).toEqual('');
        expect(tabContents[1].textContent).toEqual('');
        expect(document.querySelectorAll('.tab-content')).toHaveLength(1);
    });
    test('ReactNode for title', () => {
        render(
            <Tabs contentCls="override-cls">
                <Tab eventKey="one" title="Tab One">
                    <p>One</p>
                </Tab>
                <Tab
                    eventKey="two"
                    title={
                        <span>
                            Tab Two <span className="fa fa-check-circle" />
                        </span>
                    }
                >
                    <p>Two</p>
                </Tab>
            </Tabs>
        );
        const tab = document.querySelector('li span.fa-check-circle');
        expect(tab).not.toBeNull();
        expect(document.querySelectorAll('.tab-content')).toHaveLength(0);
        expect(document.querySelectorAll('.override-cls')).toHaveLength(1);
    });
});
