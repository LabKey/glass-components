import React from 'react';

import { TIMELINE_DATA } from '../../../test/data/constants';

import { TEST_USER_APP_ADMIN } from '../../userFixtures';

import { renderWithAppContext } from '../../test/reactTestLibraryHelpers';

import { TimelineEventModel } from './models';
import { TimelineView } from './TimelineView';

const events: TimelineEventModel[] = [];
TIMELINE_DATA.forEach(event => events.push(TimelineEventModel.create(event, 'UTC')));

describe('<TimelineView />', () => {
    test('Disable selection', () => {
        const component = (
            <TimelineView
                events={events}
                showRecentFirst={false}
                selectionDisabled={true}
                onEventSelection={jest.fn()}
                selectedEvent={null}
                selectedEntityConnectionInfo={null}
            />
        );

        const { container } = renderWithAppContext(component, { serverContext: { user: TEST_USER_APP_ADMIN } });
        expect(container).toMatchSnapshot();
    });

    test('Hide user link', () => {
        const component = (
            <TimelineView
                events={events}
                showRecentFirst={false}
                selectionDisabled={true}
                onEventSelection={jest.fn()}
                selectedEvent={null}
                selectedEntityConnectionInfo={null}
            />
        );

        const { container } = renderWithAppContext(component, { serverContext: { user: TEST_USER_APP_ADMIN } });
        expect(container).toMatchSnapshot();
    });

    test('with selection, completed entity', () => {
        const component = (
            <TimelineView
                events={events}
                showRecentFirst={false}
                selectionDisabled={true}
                onEventSelection={jest.fn()}
                selectedEvent={events[1]}
                selectedEntityConnectionInfo={[{ firstEvent: events[1], lastEvent: events[5], isCompleted: true }]}
            />
        );

        const { container } = renderWithAppContext(component, { serverContext: { user: TEST_USER_APP_ADMIN } });
        expect(container).toMatchSnapshot();
    });

    test('with selection, open entity', () => {
        const component = (
            <TimelineView
                events={events}
                showRecentFirst={false}
                selectionDisabled={true}
                onEventSelection={jest.fn()}
                selectedEvent={events[7]}
                selectedEntityConnectionInfo={[{ firstEvent: events[2], lastEvent: events[7], isCompleted: false }]}
            />
        );

        expect(document.querySelectorAll('.timeline-info-icon')).toHaveLength(0);
        const { container } = renderWithAppContext(component, { serverContext: { user: TEST_USER_APP_ADMIN } });
        expect(container).toMatchSnapshot();
    });

    test('with getInfoBubbleContent', () => {
        const getInfoBubbleContent = (event: TimelineEventModel) => {
            return {
                title: 'info',
                content: <span>hello</span>,
            };
        };
        renderWithAppContext(
            <TimelineView
                events={events}
                showRecentFirst={false}
                selectionDisabled={true}
                onEventSelection={jest.fn()}
                selectedEvent={events[7]}
                selectedEntityConnectionInfo={null}
                getInfoBubbleContent={getInfoBubbleContent}
            />,
            { serverContext: { user: TEST_USER_APP_ADMIN } }
        );

        expect(document.querySelectorAll('.timeline-info-icon')).toHaveLength(8);
        expect(document.querySelectorAll('.user-link')).toHaveLength(7);
        expect(document.querySelectorAll('.field-text-nowrap')).toHaveLength(8);

        // test unknown user display
        expect(document.querySelectorAll('.user-link')[0].textContent).toBe('Vader');
        expect(document.querySelectorAll('.field-text-nowrap')[7].textContent).toBe('<unknown user>');
    });
});
