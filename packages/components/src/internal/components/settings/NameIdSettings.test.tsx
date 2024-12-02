import React from 'react';
import { userEvent } from '@testing-library/user-event';

import { waitFor } from '@testing-library/dom';

import { BIOLOGICS_APP_PROPERTIES, SAMPLE_MANAGER_APP_PROPERTIES } from '../../app/constants';

import { getTestAPIWrapper } from '../../APIWrapper';
import { getSamplesTestAPIWrapper } from '../samples/APIWrapper';

import { renderWithAppContext } from '../../test/reactTestLibraryHelpers';

import { NameIdSettingsForm } from './NameIdSettings';

describe('NameIdSettings', () => {
    const apiWithSamples = getTestAPIWrapper(jest.fn, {
        samples: getSamplesTestAPIWrapper(jest.fn, {
            getSampleCounter: jest.fn().mockResolvedValue(5),
            hasExistingSamples: jest.fn().mockResolvedValue(true),
        }),
    });
    const apiWithCounterWithoutSamples = getTestAPIWrapper(jest.fn, {
        samples: getSamplesTestAPIWrapper(jest.fn, {
            getSampleCounter: jest.fn().mockResolvedValue(5),
            hasExistingSamples: jest.fn().mockResolvedValue(false),
        }),
    });
    const apiWithNoSamples = getTestAPIWrapper(jest.fn, {
        samples: getSamplesTestAPIWrapper(jest.fn, {
            getSampleCounter: jest.fn().mockResolvedValue(0),
        }),
    });

    let DEFAULT_PROPS;
    beforeEach(() => {
        LABKEY.moduleContext = {
            biologics: {
                productId: BIOLOGICS_APP_PROPERTIES.productId,
            },
        };

        const container = {
            id: 'testContainerId',
            title: 'TestContainer',
            path: '/testContainer',
        };

        DEFAULT_PROPS = {
            loadNameExpressionOptions: jest.fn(async () => {
                return { prefix: 'ABC-', allowUserSpecifiedNames: false };
            }),
            saveNameExpressionOptions: jest.fn(async () => {
                return [];
            }),
            api: apiWithNoSamples,
            getIsDirty: jest.fn(),
            setIsDirty: jest.fn(),
            container,
            isAppHome: true,
        };
    });

    test('on init', async () => {
        renderWithAppContext(<NameIdSettingsForm {...DEFAULT_PROPS} />);
        expect(document.querySelectorAll('.fa-spinner').length).toEqual(3);
        expect(document.querySelectorAll('.name-id-setting__prefix-field')).toHaveLength(0);
        expect(document.querySelectorAll('.checkbox')).toHaveLength(0);

        await waitFor(() => {
            expect(document.querySelectorAll('.fa-spinner').length).toEqual(0);
        });
        expect(document.querySelectorAll('.name-id-setting__setting-section')).toHaveLength(2);
        expect(document.querySelectorAll('.name-id-setting__prefix-field')).toHaveLength(1);
        expect(document.querySelectorAll('.sample-counter__setting-section')).toHaveLength(1);
        expect(document.querySelectorAll('.sample-counter__prefix-label')).toHaveLength(2);
        expect(document.querySelectorAll('.checkbox')).toHaveLength(1);
        expect(document.querySelectorAll('.form-control')).toHaveLength(3);
        expect(document.querySelectorAll('button')).toHaveLength(3);
        expect(DEFAULT_PROPS.loadNameExpressionOptions).toHaveBeenCalled();

        const counterLabel = document.querySelectorAll('div.sample-counter__prefix-label');
        expect(counterLabel.length).toEqual(2);
        expect(counterLabel[0].textContent).toBe('sampleCount');
        expect(counterLabel[1].textContent).toBe('rootSampleCount');

        const counterInputs = document.querySelectorAll('input.update-samplecount-input');
        expect(counterInputs.length).toEqual(2);
        expect(counterInputs[0].getAttribute('value')).toBe('0');
        expect(counterInputs[1].getAttribute('value')).toBe('0');
    });

    test('not app home', async () => {
        renderWithAppContext(<NameIdSettingsForm {...DEFAULT_PROPS} isAppHome={false} />);
        expect(document.querySelectorAll('.fa-spinner').length).toEqual(2);
        expect(document.querySelectorAll('.name-id-setting__prefix-field')).toHaveLength(0);
        expect(document.querySelectorAll('.checkbox')).toHaveLength(0);

        await waitFor(() => {
            expect(document.querySelectorAll('.fa-spinner').length).toEqual(0);
        });
        expect(document.querySelectorAll('.name-id-setting__setting-section')).toHaveLength(2);
        expect(document.querySelectorAll('.name-id-setting__prefix-field')).toHaveLength(1);
        expect(document.querySelectorAll('.sample-counter__setting-section')).toHaveLength(0);
        expect(document.querySelectorAll('.sample-counter__prefix-label')).toHaveLength(0);
        expect(document.querySelectorAll('.checkbox')).toHaveLength(1);
        expect(document.querySelectorAll('.form-control')).toHaveLength(1);
        expect(document.querySelectorAll('button')).toHaveLength(1);
        expect(DEFAULT_PROPS.loadNameExpressionOptions).toHaveBeenCalled();

        const counterLabel = document.querySelectorAll('div.sample-counter__prefix-label');
        expect(counterLabel.length).toEqual(0);

        const counterInputs = document.querySelectorAll('input.update-samplecount-input');
        expect(counterInputs.length).toEqual(0);
    });

    test('allowUserSpecifiedNames checkbox', async () => {
        renderWithAppContext(<NameIdSettingsForm {...DEFAULT_PROPS} />);
        await waitFor(() => {
            expect(document.querySelectorAll('.fa-spinner').length).toEqual(0);
        });

        await userEvent.click(document.querySelectorAll('input')[0]); // check
        expect(DEFAULT_PROPS.saveNameExpressionOptions).toHaveBeenCalled();
    });

    test('prefix preview', async () => {
        renderWithAppContext(<NameIdSettingsForm {...DEFAULT_PROPS} />);
        await waitFor(() => {
            expect(document.querySelectorAll('.fa-spinner').length).toEqual(0);
        });

        expect(document.querySelector('.name-id-setting__prefix-example').textContent).toContain('ABC-Blood-${GenId}');
    });

    test('apply prefix confirm modal -- cancel', async () => {
        renderWithAppContext(<NameIdSettingsForm {...DEFAULT_PROPS} />);
        await waitFor(() => {
            expect(document.querySelectorAll('.fa-spinner').length).toEqual(0);
        });

        expect(document.querySelectorAll('.modal')).toHaveLength(0);
        await userEvent.type(document.querySelectorAll('input[type="text"]')[0], 'abc');
        await userEvent.click(document.querySelectorAll('button')[0]); // Apply Prefix
        expect(document.querySelectorAll('.modal')).toHaveLength(1);
        await userEvent.click(document.querySelectorAll('.close')[0]);
        expect(document.querySelectorAll('.modal')).toHaveLength(0);
    });

    test('apply prefix confirm modal -- save', async () => {
        renderWithAppContext(<NameIdSettingsForm {...DEFAULT_PROPS} />);
        await waitFor(() => {
            expect(document.querySelectorAll('.fa-spinner').length).toEqual(0);
        });

        expect(document.querySelectorAll('.modal')).toHaveLength(0);
        await userEvent.type(document.querySelectorAll('input[type="text"]')[0], 'abc');
        await userEvent.click(document.querySelectorAll('button')[0]); // Apply Prefix
        expect(document.querySelectorAll('.modal')).toHaveLength(1);

        // Click on 'Yes, Save and Apply Prefix' button
        await userEvent.click(document.querySelector('.modal').querySelectorAll('button')[2]);
        expect(DEFAULT_PROPS.saveNameExpressionOptions).toHaveBeenCalled();
    });

    test('LKSM - not showing prefix', async () => {
        LABKEY.moduleContext = {
            samplemanagement: {
                productId: SAMPLE_MANAGER_APP_PROPERTIES.productId,
            },
        };

        renderWithAppContext(<NameIdSettingsForm {...DEFAULT_PROPS} />);
        await waitFor(() => {
            expect(document.querySelectorAll('.fa-spinner').length).toEqual(0);
        });

        expect(document.querySelectorAll('.name-id-setting__setting-section')).toHaveLength(1);
        expect(document.querySelectorAll('.name-id-setting__prefix-field')).toHaveLength(0);
        expect(document.querySelectorAll('.checkbox')).toHaveLength(1);
        expect(document.querySelectorAll('.form-control')).toHaveLength(2);
    });

    test('With counter, with existing sample', async () => {
        renderWithAppContext(<NameIdSettingsForm {...DEFAULT_PROPS} api={apiWithSamples} />);
        await waitFor(() => {
            expect(document.querySelectorAll('.fa-spinner').length).toEqual(0);
        });

        expect(document.querySelectorAll('.sample-counter__setting-section')).toHaveLength(1);
        expect(document.querySelectorAll('.sample-counter__prefix-label')).toHaveLength(2);
        expect(document.querySelectorAll('.form-control')).toHaveLength(3);
        const buttons = document.querySelectorAll('button');
        expect(buttons.length).toEqual(3);

        expect(buttons[1].textContent).toBe('Apply New sampleCount');
        expect(buttons[2].textContent).toBe('Apply New rootSampleCount');

        const counterInputs = document.querySelectorAll('input.update-samplecount-input');
        expect(counterInputs.length).toEqual(2);
        expect(counterInputs[0].getAttribute('value')).toBe('5');
        expect(counterInputs[1].getAttribute('value')).toBe('5');
    });

    test('With counter, with no existing sample', async () => {
        renderWithAppContext(<NameIdSettingsForm {...DEFAULT_PROPS} api={apiWithCounterWithoutSamples} />);
        await waitFor(() => {
            expect(document.querySelectorAll('.fa-spinner').length).toEqual(0);
        });

        expect(document.querySelectorAll('.sample-counter__setting-section')).toHaveLength(1);
        expect(document.querySelectorAll('.sample-counter__prefix-label')).toHaveLength(2);
        expect(document.querySelectorAll('.form-control')).toHaveLength(3);
        const buttons = document.querySelectorAll('button');
        expect(buttons.length).toEqual(5);

        expect(buttons[1].textContent).toBe('Apply New sampleCount');
        expect(buttons[2].textContent).toBe('Reset sampleCount');
        expect(buttons[3].textContent).toBe('Apply New rootSampleCount');
        expect(buttons[4].textContent).toBe('Reset rootSampleCount');

        const counterInputs = document.querySelectorAll('input.update-samplecount-input');
        expect(counterInputs.length).toEqual(2);
        expect(counterInputs[0].getAttribute('value')).toBe('5');
        expect(counterInputs[1].getAttribute('value')).toBe('5');
    });
});
