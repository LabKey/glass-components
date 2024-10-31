import React from 'react';

import { act } from '@testing-library/react';

import { userEvent } from '@testing-library/user-event';

import { renderWithAppContext } from '../../test/reactTestLibraryHelpers';

import { createFormInputId } from './utils';
import { DOMAIN_FIELD_FORMAT, DOMAIN_FIELD_NOT_LOCKED } from './constants';
import { DateTimeFieldOptions } from './DateTimeFieldOptions';
import { isValidAltDateTimeFormatOptions } from '../../util/Date';

const DEFAULT_PROP = {
    index: 1,
    domainIndex: 1,
    label: 'Date and Time Field Options',
    onChange: jest.fn(),
    lockType: DOMAIN_FIELD_NOT_LOCKED,
    type: 'dateTime',
};

const APP_CONTEXT = {
    container: {
        formats: {
            dateFormat: 'yyyy-MM-dd',
            dateTimeFormat: 'yyyy-MM-dd HH:mm',
            timeFormat: 'HH:mm',
        },
    },
};

const APP_CONTEXT_INVALID = {
    container: {
        formats: {
            dateFormat: 'yyyy-MM-DD',
            dateTimeFormat: 'yyyy MM dd HH:mm aa',
            timeFormat: 'hh:mm aa',
        },
    },
};

function verifyInputs(
    type: string,
    inherit: boolean,
    date: string = 'yyyy-MM-dd',
    time: string = 'HH:mm',
    dateInvalid?: boolean,
    timeInvalid?: boolean
) {
    expect(document.querySelector('.domain-field-section-heading').textContent).toBe(DEFAULT_PROP.label);
    const inheritCheckboxId = createFormInputId(
        DOMAIN_FIELD_FORMAT + '_inherit' + type,
        DEFAULT_PROP.domainIndex,
        DEFAULT_PROP.index
    );
    const checkbox = document.getElementById(inheritCheckboxId);
    expect(checkbox.hasAttribute('checked')).toEqual(inherit);

    const selectInputs = document.querySelectorAll('.select-input__control');
    expect(selectInputs.length).toEqual(type === 'dateTime' ? 2 : 1);
    expect(selectInputs[0].hasAttribute('aria-disabled')).toEqual(inherit);

    const skipDatePreview = dateInvalid || isValidAltDateTimeFormatOptions(date);
    const skipTimePreview = timeInvalid || isValidAltDateTimeFormatOptions(time);
    if (type === 'dateTime') {
        expect(selectInputs[1].hasAttribute('aria-disabled')).toEqual(inherit);
        expect(selectInputs[0].textContent.startsWith(date + (skipDatePreview ? '' : ' ('))).toBeTruthy();
        expect(selectInputs[1].textContent.startsWith(time ? time + (skipTimePreview ? '' : ' (') : '<none>')).toBeTruthy();
    } else if (type === 'date') {
        expect(selectInputs[0].textContent.startsWith(date + (skipDatePreview ? '' : ' ('))).toBeTruthy();
    } else {
        expect(selectInputs[0].textContent.startsWith(time + (skipTimePreview ? '' : ' ('))).toBeTruthy();
    }

    expect(document.querySelectorAll('.fa-exclamation-circle')).toHaveLength(dateInvalid || timeInvalid ? 1 : 0);
}

describe('DateTimeFieldOptions', () => {
    test('DateTime type, no format', async () => {
        const props = {
            ...DEFAULT_PROP,
            type: 'dateTime',
        };

        await act(async () => {
            renderWithAppContext(<DateTimeFieldOptions {...props} />, {
                appContext: APP_CONTEXT,
            });
        });

        verifyInputs('dateTime', true);

        const checkbox = document.querySelector('input[type="checkbox"]');
        await act(() => userEvent.click(checkbox));
        expect(DEFAULT_PROP.onChange).toHaveBeenCalledTimes(1);
    });

    test('DateTime type, with valid format', async () => {
        const props = {
            ...DEFAULT_PROP,
            format: 'yyyy-MMM-dd hh:mm a',
            type: 'dateTime',
        };

        await act(async () => {
            renderWithAppContext(<DateTimeFieldOptions {...props} />, {
                appContext: APP_CONTEXT,
            });
        });

        verifyInputs('dateTime', false, 'yyyy-MMM-dd', 'hh:mm a', false, false);
    });

    test('DateTime type, with invalid date format', async () => {
        const props = {
            ...DEFAULT_PROP,
            format: 'yyyy/MM/dd hh:mm a',
            type: 'dateTime',
        };

        await act(async () => {
            renderWithAppContext(<DateTimeFieldOptions {...props} />, {
                appContext: APP_CONTEXT,
            });
        });

        verifyInputs('dateTime', false, 'yyyy/MM/dd hh:mm a', '', true, false);

        // toggle to inherit, should get rid of warning
        const checkbox = document.querySelector('input[type="checkbox"]');
        await act(() => userEvent.click(checkbox));
        expect(DEFAULT_PROP.onChange).toHaveBeenCalledTimes(2);
        expect(document.querySelectorAll('.fa-exclamation-circle')).toHaveLength(0);
    });

    test('DateTime type, with invalid time format', async () => {
        const props = {
            ...DEFAULT_PROP,
            format: 'yyyy-MMM-dd hh:mm aa',
            type: 'dateTime',
        };

        await act(async () => {
            renderWithAppContext(<DateTimeFieldOptions {...props} />, {
                appContext: APP_CONTEXT,
            });
        });

        verifyInputs('dateTime', false, 'yyyy-MMM-dd hh:mm aa', '', true, false);

        // toggle to inherit, should get rid of warning
        const checkbox = document.querySelector('input[type="checkbox"]');
        await act(() => userEvent.click(checkbox));
        expect(DEFAULT_PROP.onChange).toHaveBeenCalledTimes(3);
        expect(document.querySelectorAll('.fa-exclamation-circle')).toHaveLength(0);
    });

    test('DateTime type, with valid date and empty time', async () => {
        const props = {
            ...DEFAULT_PROP,
            format: 'yyyy-MMM-dd',
            type: 'dateTime',
        };

        await act(async () => {
            renderWithAppContext(<DateTimeFieldOptions {...props} />, {
                appContext: APP_CONTEXT,
            });
        });

        verifyInputs('dateTime', false, 'yyyy-MMM-dd', '');
    });

    test('Date type, with override', async () => {
        const props = {
            ...DEFAULT_PROP,
            format: 'ddMMMyyyy',
            type: 'date',
        };

        await act(async () => {
            renderWithAppContext(<DateTimeFieldOptions {...props} />, {
                appContext: APP_CONTEXT,
            });
        });

        verifyInputs('date', false, 'ddMMMyyyy', null, false, false);
    });

    test('Date type, with invalid override', async () => {
        const props = {
            ...DEFAULT_PROP,
            format: 'ddMMM-yyyy',
            type: 'date',
        };

        await act(async () => {
            renderWithAppContext(<DateTimeFieldOptions {...props} />, {
                appContext: APP_CONTEXT,
            });
        });

        verifyInputs('date', false, 'ddMMM-yyyy', null, true, false);
        // toggle to inherit, should get rid of warning
        const checkbox = document.querySelector('input[type="checkbox"]');
        await act(() => userEvent.click(checkbox));
        expect(DEFAULT_PROP.onChange).toHaveBeenCalledTimes(4);
        expect(document.querySelectorAll('.fa-exclamation-circle')).toHaveLength(0);
    });

    test('Date type, with alternative format override', async () => {
        const props = {
            ...DEFAULT_PROP,
            format: 'dateTime',
            type: 'date',
        };

        await act(async () => {
            renderWithAppContext(<DateTimeFieldOptions {...props} />, {
                appContext: APP_CONTEXT,
            });
        });

        verifyInputs('date', false, 'dateTime', null, false, false);
    });

    test('Time type, with invalid override', async () => {
        const props = {
            ...DEFAULT_PROP,
            format: 'kk:mm',
            type: 'time',
        };

        await act(async () => {
            renderWithAppContext(<DateTimeFieldOptions {...props} />, {
                appContext: APP_CONTEXT,
            });
        });

        verifyInputs('time', false, null, 'kk:mm', false, true);
        // toggle to inherit, should get rid of warning
        const checkbox = document.querySelector('input[type="checkbox"]');
        await act(() => userEvent.click(checkbox));
        expect(DEFAULT_PROP.onChange).toHaveBeenCalledTimes(5);
        expect(document.querySelectorAll('.fa-exclamation-circle')).toHaveLength(0);
    });

    test('Time type, with empty time', async () => {
        const props = {
            ...DEFAULT_PROP,
            format: '',
            type: 'time',
        };

        await act(async () => {
            renderWithAppContext(<DateTimeFieldOptions {...props} />, {
                appContext: APP_CONTEXT,
            });
        });

        verifyInputs('time', true, null, 'HH:mm');
    });
});
