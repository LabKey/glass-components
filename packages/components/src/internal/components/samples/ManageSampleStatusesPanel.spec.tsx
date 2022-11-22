import React from 'react';
import { mount, ReactWrapper } from 'enzyme';
import { Button } from 'react-bootstrap';

import { waitForLifecycle } from '../../testHelpers';
import { LoadingSpinner } from '../base/LoadingSpinner';
import { AddEntityButton } from '../buttons/AddEntityButton';
import { Alert } from '../base/Alert';
import { DomainFieldLabel } from '../domainproperties/DomainFieldLabel';
import { SelectInput } from '../forms/input/SelectInput';
import { ConfirmModal } from '../base/ConfirmModal';
import { ChoicesListItem } from '../base/ChoicesListItem';

import { getTestAPIWrapper } from '../../APIWrapper';

import { SampleState } from './models';
import { ManageSampleStatusesPanel, SampleStatusDetail, SampleStatusesList } from './ManageSampleStatusesPanel';

import { getSamplesTestAPIWrapper } from './APIWrapper';

describe('ManageSampleStatusesPanel', () => {
    const DEFAULT_PROPS = {
        api: getTestAPIWrapper(jest.fn, {
            samples: getSamplesTestAPIWrapper(jest.fn, {
                getSampleStatuses: () => Promise.resolve([new SampleState()]),
            }),
        }),
    };

    function validate(wrapper: ReactWrapper, hasError = false): void {
        expect(wrapper.find(LoadingSpinner)).toHaveLength(0);
        expect(wrapper.find(Alert)).toHaveLength(hasError ? 1 : 0);

        expect(wrapper.find('.panel')).toHaveLength(1);
        expect(wrapper.find('.panel-heading')).toHaveLength(1);

        const elCount = !hasError ? 1 : 0;
        expect(wrapper.find('.choices-container')).toHaveLength(elCount);
        expect(wrapper.find(SampleStatusesList)).toHaveLength(elCount);
        expect(wrapper.find(AddEntityButton)).toHaveLength(elCount);
        expect(wrapper.find(SampleStatusDetail)).toHaveLength(elCount);
    }

    test('loading', async () => {
        const wrapper = mount(<ManageSampleStatusesPanel {...DEFAULT_PROPS} />);
        expect(wrapper.find(LoadingSpinner)).toHaveLength(1);
        await waitForLifecycle(wrapper);
        validate(wrapper);
        wrapper.unmount();
    });

    test('no states', async () => {
        const wrapper = mount(
            <ManageSampleStatusesPanel
                {...DEFAULT_PROPS}
                api={getTestAPIWrapper(jest.fn, {
                    samples: getSamplesTestAPIWrapper(jest.fn, {
                        getSampleStatuses: () => Promise.resolve([]),
                    }),
                })}
            />
        );
        await waitForLifecycle(wrapper);
        validate(wrapper);
        expect(wrapper.find(SampleStatusesList).prop('states').length).toBe(0);
        expect(wrapper.find(SampleStatusDetail).prop('state')).toBe(null);
        wrapper.unmount();
    });

    test('with states and selection', async () => {
        const wrapper = mount(<ManageSampleStatusesPanel {...DEFAULT_PROPS} />);
        await waitForLifecycle(wrapper);
        validate(wrapper);
        expect(wrapper.find(SampleStatusesList).prop('states').length).toBe(1);
        expect(wrapper.find(SampleStatusesList).prop('selected')).toBe(undefined);
        expect(wrapper.find(SampleStatusDetail).prop('state')).toBeUndefined();

        // click on a status row to select it
        wrapper.find('.list-group-item').first().simulate('click');
        await waitForLifecycle(wrapper);
        validate(wrapper);
        expect(wrapper.find(SampleStatusesList).prop('states').length).toBe(1);
        expect(wrapper.find(SampleStatusesList).prop('selected')).toBe(0);
        expect(wrapper.find(SampleStatusDetail).prop('state')).toBeDefined();

        wrapper.unmount();
    });

    test('error retrieving states', async () => {
        const wrapper = mount(
            <ManageSampleStatusesPanel
                {...DEFAULT_PROPS}
                api={getTestAPIWrapper(jest.fn, {
                    samples: getSamplesTestAPIWrapper(jest.fn, {
                        getSampleStatuses: () => Promise.reject({ exception: 'Failure' }),
                    }),
                })}
            />
        );
        await waitForLifecycle(wrapper);
        validate(wrapper, true);
        wrapper.unmount();
    });

    test('add new', async () => {
        const wrapper = mount(<ManageSampleStatusesPanel {...DEFAULT_PROPS} />);
        await waitForLifecycle(wrapper);
        validate(wrapper);
        expect(wrapper.find(SampleStatusesList).prop('states').length).toBe(1);
        expect(wrapper.find(SampleStatusesList).prop('selected')).toBe(undefined);
        expect(wrapper.find(SampleStatusDetail).prop('state')).toBeUndefined();
        expect(wrapper.find(SampleStatusDetail).prop('addNew')).toBe(false);
        expect(wrapper.find(AddEntityButton).prop('disabled')).toBe(false);

        wrapper.find('.btn').simulate('click');
        await waitForLifecycle(wrapper);
        validate(wrapper);
        expect(wrapper.find(SampleStatusesList).prop('states').length).toBe(1);
        expect(wrapper.find(SampleStatusesList).prop('selected')).toBe(-1);
        expect(wrapper.find(SampleStatusDetail).prop('state')).toBeUndefined();
        expect(wrapper.find(SampleStatusDetail).prop('addNew')).toBe(true);
        expect(wrapper.find(AddEntityButton).prop('disabled')).toBe(true);

        wrapper.unmount();
    });
});

describe('SampleStatusesList', () => {
    const DEFAULT_PROPS = {
        states: [],
        selected: undefined,
        onSelect: jest.fn,
    };

    function validate(wrapper: ReactWrapper, count = 0): void {
        expect(wrapper.find('.choices-list__empty-message')).toHaveLength(count === 0 ? 1 : 0);
        expect(wrapper.find('.list-group')).toHaveLength(1);
        expect(wrapper.find(ChoicesListItem)).toHaveLength(count);
    }

    test('no states', () => {
        const wrapper = mount(<SampleStatusesList {...DEFAULT_PROPS} />);
        validate(wrapper);
        wrapper.unmount();
    });

    test('with states, no selection', () => {
        const states = [new SampleState(), new SampleState()];
        const wrapper = mount(<SampleStatusesList {...DEFAULT_PROPS} states={states} />);
        validate(wrapper, states.length);
        expect(wrapper.find(ChoicesListItem).first().prop('active')).toBe(false);
        expect(wrapper.find(ChoicesListItem).last().prop('active')).toBe(false);
        wrapper.unmount();
    });

    test('with states, with selection', () => {
        const states = [new SampleState(), new SampleState()];
        const wrapper = mount(<SampleStatusesList {...DEFAULT_PROPS} states={states} selected={1} />);
        validate(wrapper, states.length);
        expect(wrapper.find(ChoicesListItem).first().prop('active')).toBe(false);
        expect(wrapper.find(ChoicesListItem).last().prop('active')).toBe(true);
        wrapper.unmount();
    });
});

describe('SampleStatusDetail', () => {
    const STATE = new SampleState({ label: 'Available', description: 'desc', stateType: 'Available', inUse: false });
    const DEFAULT_PROPS = {
        addNew: false,
        state: STATE,
        onActionComplete: jest.fn,
    };

    function validate(wrapper: ReactWrapper, hasState = true, showSelect = true, inputCount = 3): void {
        expect(wrapper.find('.choices-detail__empty-message')).toHaveLength(!hasState && showSelect ? 1 : 0);
        expect(wrapper.find('form')).toHaveLength(hasState ? 1 : 0);
        expect(wrapper.find(DomainFieldLabel)).toHaveLength(hasState ? 3 : 0);
        expect(wrapper.find('input')).toHaveLength(hasState ? inputCount : 0);
    }

    test('show select message', async () => {
        const wrapper = mount(<SampleStatusDetail {...DEFAULT_PROPS} state={undefined} />);
        await waitForLifecycle(wrapper);
        validate(wrapper, false);
        wrapper.unmount();
    });

    test('do not show select message', async () => {
        const wrapper = mount(<SampleStatusDetail {...DEFAULT_PROPS} state={null} />);
        await waitForLifecycle(wrapper);
        validate(wrapper, false, false);
        wrapper.unmount();
    });

    test('input values from state', async () => {
        const wrapper = mount(<SampleStatusDetail {...DEFAULT_PROPS} />);
        await waitForLifecycle(wrapper);
        validate(wrapper);
        expect(wrapper.find('input[name="label"]').prop('value')).toBe(STATE.label);
        expect(wrapper.find('input[name="label"]').prop('disabled')).toBe(false);
        expect(wrapper.find('textarea').prop('value')).toBe(STATE.description);
        expect(wrapper.find('textarea').prop('disabled')).toBe(false);
        expect(wrapper.find(SelectInput).prop('value')).toBe(STATE.stateType);
        expect(wrapper.find(SelectInput).prop('disabled')).toBe(false);
        expect(wrapper.find(Button)).toHaveLength(2);
        expect(wrapper.find(Button).first().text()).toContain('Delete');
        expect(wrapper.find(Button).first().prop('disabled')).toBe(false);
        expect(wrapper.find(Button).last().text()).toBe('Save');
        expect(wrapper.find(Button).last().prop('disabled')).toBe(true); // save initially disabled
        wrapper.unmount();
    });

    test('in use disabled', async () => {
        const inUseState = new SampleState({ label: 'Available', stateType: 'Available', inUse: true });
        const wrapper = mount(<SampleStatusDetail {...DEFAULT_PROPS} state={inUseState} />);
        await waitForLifecycle(wrapper);
        validate(wrapper, true, true, 2);
        expect(wrapper.find('input[name="label"]').prop('disabled')).toBe(false);
        expect(wrapper.find('textarea').prop('disabled')).toBe(false);
        expect(wrapper.find(SelectInput).prop('disabled')).toBe(true);
        expect(wrapper.find(Button)).toHaveLength(2);
        expect(wrapper.find(Button).first().text()).toContain('Delete');
        expect(wrapper.find(Button).first().prop('disabled')).toBe(true); // delete disabled
        expect(wrapper.find(Button).last().text()).toBe('Save');
        expect(wrapper.find(Button).last().prop('disabled')).toBe(true); // save initially disabled
        wrapper.unmount();
    });

    test('save button disabled', async () => {
        const wrapper = mount(<SampleStatusDetail {...DEFAULT_PROPS} />);
        await waitForLifecycle(wrapper);
        validate(wrapper);
        expect(wrapper.find('.btn-success').prop('disabled')).toBe(true); // save initially disabled
        wrapper
            .find('input')
            .first()
            .simulate('change', { target: { name: 'label', value: 'new label' } });
        await waitForLifecycle(wrapper);
        expect(wrapper.find('.btn-success').prop('disabled')).toBe(false);
        wrapper.unmount();
    });

    test('add new', async () => {
        const wrapper = mount(<SampleStatusDetail {...DEFAULT_PROPS} addNew />);
        await waitForLifecycle(wrapper);
        validate(wrapper);
        expect(wrapper.find(Button)).toHaveLength(2);
        expect(wrapper.find(Button).first().text()).toBe('Cancel');
        expect(wrapper.find(Button).first().prop('disabled')).toBe(false);
        wrapper.unmount();
    });

    test('show confirm delete', async () => {
        const wrapper = mount(<SampleStatusDetail {...DEFAULT_PROPS} />);
        await waitForLifecycle(wrapper);
        validate(wrapper);
        expect(wrapper.find(ConfirmModal)).toHaveLength(0);
        wrapper.find(Button).first().simulate('click'); // click delete button
        await waitForLifecycle(wrapper);
        expect(wrapper.find(ConfirmModal)).toHaveLength(1);
        wrapper.unmount();
    });
});
