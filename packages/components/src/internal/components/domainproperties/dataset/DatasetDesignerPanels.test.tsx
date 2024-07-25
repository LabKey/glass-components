/*
 * Copyright (c) 2020 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import React from 'react';
import userEvent from '@testing-library/user-event';

import { act } from 'react-dom/test-utils';

import { renderWithAppContext } from '../../../test/reactTestLibraryHelpers';

import { NEW_DATASET_MODEL_WITHOUT_DATASPACE } from '../../../../test/data/constants';
import { getDomainPropertiesTestAPIWrapper } from '../APIWrapper';

import { PROPERTIES_PANEL_ERROR_MSG } from '../constants';

import { DatasetDesignerPanels } from './DatasetDesignerPanels';

import { DatasetModel } from './models';

describe('Dataset Designer', () => {
    test('for alert/message', async () => {
        await act(async () => {
            renderWithAppContext(
                <DatasetDesignerPanels
                    api={getDomainPropertiesTestAPIWrapper(jest.fn)}
                    initModel={DatasetModel.create(NEW_DATASET_MODEL_WITHOUT_DATASPACE)}
                    onCancel={jest.fn()}
                    onComplete={jest.fn()}
                />
            );
        });

        const datasetHeader = document.querySelector('div#dataset-header-id');
        expect(document.getElementsByClassName('domain-panel-header-collapsed')).toHaveLength(1);
        expect(document.getElementsByClassName('domain-panel-header-expanded')).toHaveLength(1);

        await act(async () => {
            userEvent.click(datasetHeader);
        });

        expect(document.getElementsByClassName('domain-panel-header-collapsed')).toHaveLength(2);
        expect(document.getElementsByClassName('domain-panel-header-expanded')).toHaveLength(0);

        const alerts = document.getElementsByClassName('alert');
        expect(alerts).toHaveLength(2);
        expect(alerts[0].textContent).toContain(PROPERTIES_PANEL_ERROR_MSG);
        expect(alerts[1].textContent).toContain('Please correct errors in the properties panel before saving.');
    });
});
