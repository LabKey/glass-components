import React from 'react';
import { Button, ModalTitle } from 'react-bootstrap';
import { mount } from 'enzyme';

import { makeTestActions, makeTestQueryModel } from '../../../public/QueryModel/testUtils';
import { SchemaQuery } from '../../../public/SchemaQuery';
import { LoadingState } from '../../../public/LoadingState';
import { SelectInput } from '../forms/input/SelectInput';
import { Alert } from '../base/Alert';

import { QueryInfo } from '../../../public/QueryInfo';

import { waitForLifecycle } from '../../testHelpers';
import { getTestAPIWrapper } from '../../APIWrapper';
import { InjectedQueryModels } from '../../../public/QueryModel/withQueryModels';

import { PrintLabelsModalImpl, PrintModalProps } from './PrintLabelsModal';

describe('<PrintLabelsModal/>', () => {
    let actions;
    let queryModels;
    const TEST_SCHEMA = 'testSchema';
    const TEST_QUERY = 'testQuery';

    const DEFAULT_PROPS = (): PrintModalProps & InjectedQueryModels => {
        return {
            api: getTestAPIWrapper(),
            show: true,
            sampleIds: [],
            showSelection: true,
            printServiceUrl: 'test',
            queryModels,
            actions,
            model: queryModels.sampleModel,
        };
    };

    beforeAll(() => {
        actions = makeTestActions();
        queryModels = {
            sampleModel: makeTestQueryModel(new SchemaQuery(TEST_SCHEMA, TEST_QUERY), QueryInfo.create({})).mutate({
                queryInfoLoadingState: LoadingState.LOADED,
                rowsLoadingState: LoadingState.LOADED,
            }),
            singleSampleModel: makeTestQueryModel(
                new SchemaQuery(TEST_SCHEMA, TEST_QUERY),
                QueryInfo.create({})
            ).mutate({
                queryInfoLoadingState: LoadingState.LOADED,
                rowsLoadingState: LoadingState.LOADED,
            }),
        };
    });

    test('no selections', () => {
        const wrapper = mount(<PrintLabelsModalImpl {...DEFAULT_PROPS()} />);

        expect(wrapper.find(ModalTitle).text()).toBe('Print Labels with BarTender');
        expect(wrapper.find(SelectInput)).toHaveLength(2);
        expect(wrapper.find('div.modal-body').text()).toContain('Select samples to print labels for.');
        expect(wrapper.find(Button).prop('disabled')).toBe(true);

        wrapper.unmount();
    });

    test('single sample with selection', async () => {
        const wrapper = mount(<PrintLabelsModalImpl {...DEFAULT_PROPS()} sampleIds={['1']} />);
        wrapper.setState({ labelTemplate: 'alpha' });
        await waitForLifecycle(wrapper);

        expect(wrapper.find(ModalTitle).text()).toBe('Print Labels for 1 Sample with BarTender');
        expect(wrapper.find(SelectInput)).toHaveLength(2);
        expect(wrapper.find('div.modal-body').text()).toContain(
            "Confirm you've selected the samples you want and the proper label template."
        );
        expect(wrapper.find(Button).prop('disabled')).toBe(false);

        wrapper.unmount();
    });

    test('single sample without selection', async () => {
        const wrapper = mount(<PrintLabelsModalImpl {...DEFAULT_PROPS()} sampleIds={['1']} showSelection={false} />);

        wrapper.setState({ labelTemplate: 'alpha' });
        await waitForLifecycle(wrapper);

        expect(wrapper.find(ModalTitle).text()).toBe('Print Labels for 1 Sample with BarTender');
        expect(wrapper.find(SelectInput)).toHaveLength(1);
        expect(wrapper.find('div.modal-body').text()).toContain(
            'Choose the number of copies of the label for this sample'
        );
        expect(wrapper.find(Button).prop('disabled')).toBe(false);

        wrapper.unmount();
    });

    test('multiple labels', async () => {
        const wrapper = mount(<PrintLabelsModalImpl {...DEFAULT_PROPS()} sampleIds={['1', '2', '3']} />);

        wrapper.setState({ labelTemplate: 'alpha' });
        await waitForLifecycle(wrapper);

        expect(wrapper.find(ModalTitle).text()).toBe('Print Labels for 3 Samples with BarTender');
        expect(wrapper.find(SelectInput)).toHaveLength(2);
        expect(wrapper.find('div.modal-body').text()).toContain(
            "Confirm you've selected the samples you want and the proper label template."
        );
        expect(wrapper.find(Button).prop('disabled')).toBe(false);
    });

    test('no label template', () => {
        const wrapper = mount(<PrintLabelsModalImpl {...DEFAULT_PROPS()} sampleIds={['1', '2', '3']} />);
        expect(wrapper.find(Button).prop('disabled')).toBe(true);
    });

    test('no copy count', () => {
        const wrapper = mount(<PrintLabelsModalImpl {...DEFAULT_PROPS()} sampleIds={['1', '2', '3']} />);
        wrapper.setState({ numCopies: undefined });
        expect(wrapper.find(Button).prop('disabled')).toBe(true);
    });

    test('submitting', () => {
        const wrapper = mount(<PrintLabelsModalImpl {...DEFAULT_PROPS()} sampleIds={['1', '2', '3']} />);
        wrapper.setState({ submitting: true });
        expect(wrapper.find(Button).prop('disabled')).toBe(true);
    });

    test('error', async () => {
        const wrapper = mount(<PrintLabelsModalImpl {...DEFAULT_PROPS()} />);
        // TODO this should use override the print method and test the error handlers...
        wrapper.setState({ error: "We've got a problem" });
        await waitForLifecycle(wrapper);

        const alert = wrapper.find(Alert);
        expect(alert).toHaveLength(1);
        expect(alert.text()).toBe("We've got a problem");
        wrapper.unmount();
    });
});
