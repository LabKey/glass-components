/*
 * Copyright (c) 2019 LabKey Corporation
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
import * as React from 'react';
import { fromJS, Map } from "immutable";
import { storiesOf } from "@storybook/react";
import { boolean, number, withKnobs } from '@storybook/addon-knobs'


import { gridInit } from "../actions";
import { getStateQueryGridModel } from "../models";
import { getQueryGridModel } from "../global";
import { withFormSteps, WithFormStepsProps } from "../components/forms/FormStep";
import { RunDataPanel } from "../components/assay/RunDataPanel";
import { RunPropertiesPanel } from "../components/assay/RunPropertiesPanel";
import { BatchPropertiesPanel } from "../components/assay/BatchPropertiesPanel";
import { AssayImportPanels } from "../components/assay/AssayImportPanels";
import { getRunPropertiesModel } from '../components/assay/actions';
import { AssayReimportHeader } from "../components/assay/AssayReimportHeader";

import { ASSAY_WIZARD_MODEL } from "../test/data/constants";
import assayDefJSON from '../test/data/assayDefinitionModel.json';

import './stories.scss'
import { AssayDefinitionModel, AssayUploadTabs } from '../components/base/models/model';

class RunDataPanelWrapperImpl extends React.Component<WithFormStepsProps, any> {

    componentDidMount(): void {
        gridInit(this.getQueryGridModel(), false, this);
        const runPropertiesModel =  getRunPropertiesModel(ASSAY_WIZARD_MODEL.assayDef, '123');
        gridInit(runPropertiesModel, true, this);
    }

    getQueryGridModel() {
        const model = getStateQueryGridModel('assayImportRunDataPanel', ASSAY_WIZARD_MODEL.queryInfo.schemaQuery, {
            editable: true,
            allowSelection: false,
            bindURL: false
        });

        return getQueryGridModel(model.getId()) || model;
    }

    onFileChange = (attachments: Map<string, File>) => {
        console.log(attachments);
    };

    onFileRemoval = (attachmentName: string) => {
        console.log(attachmentName);
    };

    onChange = (inputName: string, fieldValues: any) => {
        console.log(inputName, fieldValues);
    };

    render() {
        return (
            <RunDataPanel
                currentStep={this.props.currentStep}
                wizardModel={ASSAY_WIZARD_MODEL}
                gridModel={this.getQueryGridModel()}
                onFileChange={this.onFileChange}
                onFileRemoval={this.onFileRemoval}
                onTextChange={this.onChange}
                allowBulkRemove={true}
            />
        )
    }
}

const RunDataPanelWrapper = withFormSteps<WithFormStepsProps>(RunDataPanelWrapperImpl, {
    currentStep: AssayUploadTabs.Files,
    furthestStep: AssayUploadTabs.Grid,
    hasDependentSteps: false
});

storiesOf('AssayImportPanels', module)
    .addDecorator(withKnobs)
    .add("BatchPropertiesPanel", () => {

        function onChange(fieldValues: any) {
            console.log(fieldValues);
        }

        return (
            <BatchPropertiesPanel model={ASSAY_WIZARD_MODEL} onChange={onChange}/>
        )
    })
    .add("RunPropertiesPanel", () => {

        function onChange(fieldValues: any) {
            console.log(fieldValues);
        }

        return (
            <RunPropertiesPanel model={ASSAY_WIZARD_MODEL} onChange={onChange}/>
        )
    })
    .add("RunDataPanel", () => {
        return (
            <RunDataPanelWrapper/>
        )
    })
    .add("AssayImportPanels", () => {
        return (
            <AssayImportPanels
                assayDefinition={ASSAY_WIZARD_MODEL.assayDef}
                onCancel={() => console.log('onCancel clicked')}
                onComplete={(response) => console.log('onComplete', response)}
                allowBulkRemove={true}
            />
        )
    }, {
        notes: "For uploading files, choose a .tsv or .csv file to see the duplicate modal.  Choose a .xls or .xlsx file for the no duplicate experience.  Any other file extension will produce an error message."
    })
    .add("AssayImportPanels for re-import", () => {
        return (
            <AssayImportPanels
                assayDefinition={ASSAY_WIZARD_MODEL.assayDef}
                onCancel={() => console.log("onCancel clicked")}
                onComplete={(response) => console.log("onComplete", response)}
                runId={number("RunId", "568")}
            />
        )
    })
    .add("AssayReimportHeader", () => {
        const assay = AssayDefinitionModel.create(assayDefJSON);
        const runData = fromJS({
            'RowId': "10",
            'Name':  'Test Name'
        });
        return (
            <AssayReimportHeader
                hasBatchProperties={boolean("Has batch properties?", false)}
                assay={assay}
                replacedRunProperties={runData}
            />
        )
    });
