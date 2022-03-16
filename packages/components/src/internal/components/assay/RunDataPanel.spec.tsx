import { mount } from 'enzyme';
import React from 'react';
import renderer from 'react-test-renderer';
import { FormTabs, LoadingState, QueryModel, withFormSteps, WithFormStepsProps } from '../../..';
import { ASSAY_WIZARD_MODEL } from '../../../test/data/constants';
import { AssayUploadTabs } from '../../constants';
import { EditorModel } from '../../models';

import { RunDataPanel } from './RunDataPanel';
import { mountWithServerContext } from '../../testHelpers';
import { TEST_USER_EDITOR } from '../../../test/data/users';

let MODEL_ID_NOT_LOADED = 'not loaded';
let MODEL_ID_LOADED = 'loaded';

interface OwnProps {
    allowBulkRemove?: boolean;
    showTabs?: boolean;
}
type Props = OwnProps & WithFormStepsProps;

class RunDataPanelWrapperImpl extends React.Component<Props, any> {
    render() {
        const { currentStep, allowBulkRemove, showTabs } = this.props;
        const { queryInfo } = ASSAY_WIZARD_MODEL;
        const queryModel = new QueryModel({
            id: MODEL_ID_LOADED,
            schemaQuery: queryInfo.schemaQuery,
        }).mutate({
            rows: {},
            orderedRows: [],
            rowsLoadingState: LoadingState.LOADED,
            queryInfoLoadingState: LoadingState.LOADED,
            queryInfo,
        });
        const editorModel = new EditorModel({ id: MODEL_ID_LOADED });

        return (
            <RunDataPanel
                allowBulkRemove={allowBulkRemove}
                currentStep={currentStep}
                editorModel={editorModel}
                onFileChange={jest.fn()}
                onFileRemoval={jest.fn()}
                onGridChange={jest.fn()}
                onTextChange={jest.fn()}
                queryModel={queryModel}
                showTabs={showTabs}
                wizardModel={ASSAY_WIZARD_MODEL}
            />
        );
    }
}

const RunDataPanelWrapper = withFormSteps(RunDataPanelWrapperImpl, {
    currentStep: AssayUploadTabs.Files,
    furthestStep: AssayUploadTabs.Grid,
    hasDependentSteps: false,
});

describe('<RunDataPanel/>', () => {
    test('loading state based on gridModel', () => {
        const queryModel = new QueryModel({
            id: MODEL_ID_LOADED,
            schemaQuery: ASSAY_WIZARD_MODEL.queryInfo.schemaQuery,
        });
        const editorModel = new EditorModel({ id: MODEL_ID_NOT_LOADED });
        const component = (
            <RunDataPanel
                currentStep={AssayUploadTabs.Files}
                editorModel={editorModel}
                onFileChange={jest.fn()}
                onFileRemoval={jest.fn()}
                onGridChange={jest.fn()}
                onTextChange={jest.fn()}
                queryModel={queryModel}
                wizardModel={ASSAY_WIZARD_MODEL}
            />
        );

        const tree = renderer.create(component).toJSON();
        expect(tree).toMatchSnapshot();
    });

    test('default props', () => {
        const component = mountWithServerContext(<RunDataPanelWrapper />, {user: TEST_USER_EDITOR});

        expect(component).toMatchSnapshot();
    });

    test('custom display props', () => {
        const component = mountWithServerContext(<RunDataPanelWrapper allowBulkRemove={true} fullWidth={true} />, {user: TEST_USER_EDITOR});
        expect(component).toMatchSnapshot();
    });

    test('showsTabs', () => {
        let wrapper = mountWithServerContext(<RunDataPanelWrapper showTabs={true} />, {user: TEST_USER_EDITOR});
        expect(wrapper.find(FormTabs)).toHaveLength(1);
        wrapper.unmount();

        wrapper = mountWithServerContext(<RunDataPanelWrapper showTabs={false} />, {user: TEST_USER_EDITOR});
        expect(wrapper.find(FormTabs)).toHaveLength(0);
        wrapper.unmount();
    });
});
