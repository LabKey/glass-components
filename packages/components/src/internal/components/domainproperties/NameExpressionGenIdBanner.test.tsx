import React from 'react';

import { render } from '@testing-library/react';

import { waitFor } from '@testing-library/dom';

import { getTestAPIWrapper } from '../../APIWrapper';

import { NotificationsContextProvider } from '../notifications/NotificationsContext';

import { getEntityTestAPIWrapper } from '../entities/APIWrapper';

import { NameExpressionGenIdBanner } from './NameExpressionGenIdBanner';
import { getDomainPropertiesTestAPIWrapper } from './APIWrapper';

describe('NameExpressionGenIdBanner', () => {
    test('with existing data', async () => {
        const { container } = render(
            <NotificationsContextProvider>
                <NameExpressionGenIdBanner
                    dataTypeName="Data1"
                    rowId={100}
                    kindName="DataClass"
                    api={getTestAPIWrapper(jest.fn, {
                        domain: getDomainPropertiesTestAPIWrapper(jest.fn, {
                            getGenId: jest.fn().mockResolvedValue(123),
                        }),
                        entity: getEntityTestAPIWrapper(jest.fn, {
                            isDataTypeEmpty: jest.fn().mockResolvedValue(false),
                        }),
                    })}
                />
            </NotificationsContextProvider>
        );
        await waitFor(() => {
            expect(document.querySelectorAll('.genid-alert').length).toEqual(1);
        });
        expect(container).toMatchSnapshot();
    });

    test('without existing data, genId = 1 (0)', async () => {
        const { container } = render(
            <NotificationsContextProvider>
                <NameExpressionGenIdBanner
                    dataTypeName="Data1"
                    rowId={100}
                    kindName="DataClass"
                    api={getTestAPIWrapper(jest.fn, {
                        domain: getDomainPropertiesTestAPIWrapper(jest.fn, {
                            getGenId: jest.fn().mockResolvedValue(0),
                        }),
                        entity: getEntityTestAPIWrapper(jest.fn, {
                            isDataTypeEmpty: jest.fn().mockResolvedValue(true),
                        }),
                    })}
                />
            </NotificationsContextProvider>
        );
        await waitFor(() => {
            expect(document.querySelectorAll('.genid-alert').length).toEqual(1);
        });
        expect(container).toMatchSnapshot();
    });

    test('without existing data, genId > 1', async () => {
        const { container } = render(
            <NotificationsContextProvider>
                <NameExpressionGenIdBanner
                    dataTypeName="Data1"
                    rowId={100}
                    kindName="DataClass"
                    api={getTestAPIWrapper(jest.fn, {
                        domain: getDomainPropertiesTestAPIWrapper(jest.fn, {
                            getGenId: jest.fn().mockResolvedValue(123),
                        }),
                        entity: getEntityTestAPIWrapper(jest.fn, {
                            isDataTypeEmpty: jest.fn().mockResolvedValue(true),
                        }),
                    })}
                />
            </NotificationsContextProvider>
        );
        await waitFor(() => {
            expect(document.querySelectorAll('.genid-alert').length).toEqual(1);
        });
        expect(container).toMatchSnapshot();
    });
});
