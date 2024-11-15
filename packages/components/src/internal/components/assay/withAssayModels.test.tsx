import React, { FC, ReactElement } from 'react';
import { render, waitFor } from '@testing-library/react';

import { TEST_LKSM_PROFESSIONAL_MODULE_CONTEXT } from '../../productFixtures';
import { AssayDefinitionModel } from '../../AssayDefinitionModel';

import { LoadingState } from '../../../public/LoadingState';
import { AssayProtocolModel } from '../domainproperties/assay/models';

import { ComponentsAPIWrapper, getTestAPIWrapper } from '../../APIWrapper';

import { AssayStateModel } from './models';
import { InjectedAssayModel, withAssayModels, withAssayModelsFromLocation } from './withAssayModels';
import { AssayAPIWrapper } from './APIWrapper';

const WithAssayModelsComponentImpl: FC<InjectedAssayModel> = () => <div id="with-assay-models" />;

const WithAssayModelsComponent = withAssayModels(WithAssayModelsComponentImpl);

function createAPIWrapper(overrides: Partial<AssayAPIWrapper> = {}): ComponentsAPIWrapper {
    return getTestAPIWrapper(jest.fn, {
        assay: {
            ...getTestAPIWrapper(jest.fn).assay,
            getAssayDefinitions: jest.fn().mockResolvedValue([]),
            ...overrides,
        },
    });
}

describe('withAssayModels', () => {
    test('load definitions', async () => {
        // Arrange
        const api = createAPIWrapper();

        // Act
        render(<WithAssayModelsComponent api={api} moduleContext={TEST_LKSM_PROFESSIONAL_MODULE_CONTEXT} />);

        await waitFor(() => {
            expect(document.getElementById('with-assay-models')).toBeDefined();
        });

        // Assert
        expect(api.assay.getAssayDefinitions).toHaveBeenCalledTimes(1);
        expect(api.assay.getProtocol).not.toHaveBeenCalled();
    });
    test('load definition failure', async () => {
        // Arrange
        const expectedError = 'load definitions failed!';
        const api = createAPIWrapper({
            getAssayDefinitions: jest.fn().mockRejectedValue(expectedError),
        });
        let injectedAssayModel: AssayStateModel;

        const WrappedTestComponent = withAssayModels(({ assayModel }): ReactElement => {
            injectedAssayModel = assayModel;
            return <div />;
        });

        // Act
        render(<WrappedTestComponent api={api} moduleContext={TEST_LKSM_PROFESSIONAL_MODULE_CONTEXT} />);

        await waitFor(() => {
            expect(injectedAssayModel.definitionsLoadingState).toEqual(LoadingState.LOADED);
        });

        // Assert
        expect(injectedAssayModel.definitionsError).toEqual(expectedError);
    });
    test('load protocol', async () => {
        // Arrange
        const expectedAssayContainerPath = '/My/Assay/Container';
        const expectedAssayId = 456;
        const expectedAssayName = 'WellDefinedAssay';

        const api = createAPIWrapper({
            getAssayDefinitions: jest
                .fn()
                .mockResolvedValue([AssayDefinitionModel.create({ id: expectedAssayId, name: expectedAssayName })]),
        });

        // Act
        render(
            <WithAssayModelsComponent
                api={api}
                assayContainerPath={expectedAssayContainerPath}
                assayName={expectedAssayName}
                moduleContext={TEST_LKSM_PROFESSIONAL_MODULE_CONTEXT}
            />
        );

        await waitFor(() => {
            expect(api.assay.getProtocol).toHaveBeenCalled();
        });

        // Assert
        expect(api.assay.getProtocol).toHaveBeenCalledWith({
            containerPath: expectedAssayContainerPath,
            protocolId: expectedAssayId,
        });
    });
    test('load protocol does not exist', async () => {
        // Arrange
        const nonExistentAssayName = 'IDoNotExistAssay';
        const api = createAPIWrapper();
        let injectedAssayModel: AssayStateModel;

        const WrappedTestComponent = withAssayModels(({ assayModel }): ReactElement => {
            injectedAssayModel = assayModel;
            return <div />;
        });

        // Act
        render(
            <WrappedTestComponent
                api={api}
                assayName={nonExistentAssayName}
                moduleContext={TEST_LKSM_PROFESSIONAL_MODULE_CONTEXT}
            />
        );

        await waitFor(() => {
            expect(injectedAssayModel.protocolLoadingState).toEqual(LoadingState.LOADED);
        });

        // Assert
        // Should not attempt to load the protocol if it is not found in the definitions
        expect(api.assay.getProtocol).not.toHaveBeenCalled();

        // Sets protocol error
        expect(injectedAssayModel.protocolError).toEqual(
            `Load protocol failed. Unable to resolve assay definition for assay name "${nonExistentAssayName}".`
        );
    });
    test('load protocol failure', async () => {
        // Arrange
        const expectedError = 'load protocol failed!';
        const assayName = 'SomeAssayDefinition';
        const api = createAPIWrapper({
            getAssayDefinitions: jest
                .fn()
                .mockResolvedValue([AssayDefinitionModel.create({ id: 123, name: assayName })]),
            getProtocol: jest.fn().mockRejectedValue(expectedError),
        });
        let injectedAssayModel: AssayStateModel;

        const WrappedTestComponent = withAssayModels(({ assayModel }): ReactElement => {
            injectedAssayModel = assayModel;
            return <div />;
        });

        // Act
        render(
            <WrappedTestComponent
                api={api}
                assayName={assayName}
                moduleContext={TEST_LKSM_PROFESSIONAL_MODULE_CONTEXT}
            />
        );

        await waitFor(() => {
            expect(injectedAssayModel.protocolLoadingState).toEqual(LoadingState.LOADED);
        });

        // Assert
        expect(injectedAssayModel.protocolError).toEqual(expectedError);
    });
    test('reload assays', async () => {
        // Arrange
        const api = createAPIWrapper();
        let injectedReloadAssays: () => Promise<void>;
        let injectedAssayModel: AssayStateModel;

        const WrappedTestComponent = withAssayModels(({ assayModel, reloadAssays }): ReactElement => {
            injectedAssayModel = assayModel;
            injectedReloadAssays = reloadAssays;
            return <div />;
        });

        // Act
        render(<WrappedTestComponent api={api} moduleContext={TEST_LKSM_PROFESSIONAL_MODULE_CONTEXT} />);

        // Load definitions
        await waitFor(() => {
            expect(injectedAssayModel.definitionsLoadingState).toEqual(LoadingState.LOADED);
        });
        expect(api.assay.getAssayDefinitions).toHaveBeenCalledTimes(1);
        expect(injectedReloadAssays).toBeDefined();

        // Trigger a reload of the injected reload action
        await waitFor(() => {
            injectedReloadAssays();
        });

        // (Re)load definitions
        await waitFor(() => {
            expect(injectedAssayModel.definitionsLoadingState).toEqual(LoadingState.LOADED);
        });

        // Assert
        expect(api.assay.clearAssayDefinitionCache).toHaveBeenCalledTimes(1);
        expect(api.assay.getAssayDefinitions).toHaveBeenCalledTimes(2);
    });
});

describe('withAssayModelsFromLocation', () => {
    test('sets "assayName" from location', async () => {
        const expectedAssayName = 'SomeAssay';
        // @ts-ignore
        const rrd = require('react-router-dom');
        rrd.__setParams({ protocol: expectedAssayName });
        // Arrange
        const expectedAssayDefinition = AssayDefinitionModel.create({ id: 123, name: expectedAssayName });
        const expectedAssayProtocol = AssayProtocolModel.create({ name: 'SomeProtocol' });

        const api = createAPIWrapper({
            getAssayDefinitions: jest.fn().mockResolvedValue([expectedAssayDefinition]),
            getProtocol: jest.fn().mockResolvedValue(expectedAssayProtocol),
        });
        let injectedAssayDefinition: AssayDefinitionModel;
        let injectedAssayModel: AssayStateModel;
        let injectedAssayProtocol: AssayProtocolModel;

        const WrappedTestComponent = withAssayModelsFromLocation(
            ({ assayDefinition, assayModel, assayProtocol }): ReactElement => {
                injectedAssayDefinition = assayDefinition;
                injectedAssayModel = assayModel;
                injectedAssayProtocol = assayProtocol;
                return <div />;
            }
        );

        // Act
        render(<WrappedTestComponent api={api} moduleContext={TEST_LKSM_PROFESSIONAL_MODULE_CONTEXT} />);

        // Load protocol
        await waitFor(() => {
            expect(injectedAssayModel.protocolLoadingState).toEqual(LoadingState.LOADED);
        });

        // Assert
        expect(injectedAssayDefinition).toEqual(expectedAssayDefinition);
        expect(injectedAssayProtocol).toEqual(expectedAssayProtocol);
    });
});
