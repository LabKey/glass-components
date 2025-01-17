import React, { act } from 'react';
import { render } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import {
    AssayPropertiesInput,
    AssayStatusInput,
    AutoLinkCategoryInput,
    AutoLinkDataInput,
    BackgroundUploadInput,
    DescriptionInput,
    DetectionMethodsInput,
    EditableResultsInput,
    EditableRunsInput,
    MetadataInputFormatsInput,
    ModuleProvidedScriptsInput,
    NameInput,
    PlateMetadataInput,
    PlateTemplatesInput,
    QCStatesInput,
    SaveScriptDataInput,
    TransformScriptsInput,
} from './AssayPropertiesInput';

import { AssayProtocolModel, Status } from './models';

describe('AssayPropertiesInput', () => {
    function validate(text: string, required = false, helpTip = false, inputCount = 1) {
        expect(document.querySelectorAll('.col').length).toBe(2);
        const labelHTML = document.querySelector('.domain-no-wrap').innerHTML;
        expect(labelHTML).toContain(text);
        if (required) {
            expect(labelHTML).toContain(' *');
        } else {
            expect(labelHTML).not.toContain(' *');
        }
        if (helpTip) {
            expect(labelHTML).toContain('label-help-icon');
        } else {
            expect(labelHTML).not.toContain('label-help-icon');
        }
        expect(document.querySelectorAll('input').length).toBe(inputCount);
    }

    test('default properties', () => {
        render(
            <AssayPropertiesInput label="TestProperty">
                <input type="checkbox" id="checkbox-test-id" />
            </AssayPropertiesInput>
        );
        validate('TestProperty');
        expect(document.querySelectorAll('.col-xs-9').length).toBe(1);
    });

    test('with custom props', () => {
        render(
            <AssayPropertiesInput colSize={5} helpTipBody={<div>testing</div>} label="TestProperty" required>
                <input type="checkbox" id="checkbox-test-id" />
            </AssayPropertiesInput>
        );
        validate('TestProperty', true, true);
        expect(document.querySelectorAll('.col-xs-5').length).toBe(1);
    });

    test('NameInput, new protocol', () => {
        render(<NameInput model={AssayProtocolModel.create({})} onChange={jest.fn} />);
        validate('Name', true);
        expect(document.querySelector('input').getAttribute('disabled')).toBe(null);
    });

    test('NameInput, existing protocol canRename false', () => {
        render(<NameInput model={AssayProtocolModel.create({ protocolId: 1 })} onChange={jest.fn} canRename={false} />);
        validate('Name', true);
        expect(document.querySelector('input').getAttribute('disabled')).toBe('');
    });

    test('NameInput, existing protocol canRename true', () => {
        render(<NameInput model={AssayProtocolModel.create({ protocolId: 1 })} onChange={jest.fn} canRename={true} />);
        validate('Name', true);
        expect(document.querySelector('input').getAttribute('disabled')).toBe(null);
    });

    test('DescriptionInput', () => {
        render(<DescriptionInput model={AssayProtocolModel.create({})} onChange={jest.fn} />);
        validate('Description', false, true, 0);
        expect(document.querySelectorAll('textarea').length).toBe(1);
    });

    test('QCStatesInput', () => {
        render(<QCStatesInput model={AssayProtocolModel.create({ qcEnabled: true })} onChange={jest.fn} />);
        validate('States', false, true);
        expect(document.querySelector('input').getAttribute('checked')).toBe('');
    });

    test('PlateTemplatesInput', () => {
        render(
            <PlateTemplatesInput
                model={AssayProtocolModel.create({ availablePlateTemplates: [] })}
                onChange={jest.fn}
            />
        );
        validate('Template', true, true, 0);
        expect(document.querySelectorAll('.col-xs-6').length).toBe(1);
        expect(document.querySelectorAll('select').length).toBe(1);
        expect(document.querySelector('.labkey-text-link').getAttribute('href')).toContain(
            'plate/plateTemplateList.view'
        );
    });

    test('DetectionMethodsInput', () => {
        render(
            <DetectionMethodsInput
                model={AssayProtocolModel.create({ availableDetectionMethods: [] })}
                onChange={jest.fn}
            />
        );
        validate('Method', true, false, 0);
        expect(document.querySelectorAll('.col-xs-6').length).toBe(1);
        expect(document.querySelectorAll('select').length).toBe(1);
    });

    test('MetadataInputFormatsInput', () => {
        render(
            <MetadataInputFormatsInput
                model={AssayProtocolModel.create({ availableMetadataInputFormats: {} })}
                onChange={jest.fn}
            />
        );
        validate('Format', true, true, 0);
        expect(document.querySelectorAll('.col-xs-6').length).toBe(1);
        expect(document.querySelectorAll('select').length).toBe(1);
    });

    test('AssayStatusInput', () => {
        render(<AssayStatusInput model={AssayProtocolModel.create({ status: Status.Active })} onChange={jest.fn} />);
        validate('Active', false, true);
        expect(document.querySelector('input').getAttribute('checked')).toBe('');
    });

    test('EditableRunsInput', () => {
        render(<EditableRunsInput model={AssayProtocolModel.create({ editableRuns: true })} onChange={jest.fn} />);
        validate('Runs', false, true);
        expect(document.querySelector('input').getAttribute('checked')).toBe('');
    });

    test('EditableResultsInput', () => {
        render(
            <EditableResultsInput model={AssayProtocolModel.create({ editableResults: true })} onChange={jest.fn} />
        );
        validate('Results', false, true);
        expect(document.querySelector('input').getAttribute('checked')).toBe('');
    });

    test('BackgroundUploadInput', () => {
        render(
            <BackgroundUploadInput model={AssayProtocolModel.create({ backgroundUpload: true })} onChange={jest.fn} />
        );
        validate('Background', false, true);
        expect(document.querySelector('input').getAttribute('checked')).toBe('');
    });

    test('AutoLinkDataInput', async () => {
        await act(async () => {
            render(<AutoLinkDataInput model={AssayProtocolModel.create({})} onChange={jest.fn} />);
        });
        validate('Study', false, true, 0);
        expect(document.querySelector('select')).toBeInTheDocument();
    });

    test('AutoLinkCategoryInput', () => {
        render(<AutoLinkCategoryInput model={AssayProtocolModel.create({})} onChange={jest.fn} />);
        validate('Category', false, true);
    });

    test('PlateMetadataInput', () => {
        render(<PlateMetadataInput model={AssayProtocolModel.create({ plateMetadata: true })} onChange={jest.fn} />);
        validate('Metadata', false, true);
        expect(document.querySelector('input').getAttribute('checked')).toBe('');
    });

    test('SaveScriptDataInput, new protocol', () => {
        render(<SaveScriptDataInput model={AssayProtocolModel.create({ saveScriptFiles: true })} onChange={jest.fn} />);
        validate('Debugging', false, true);
        expect(document.querySelector('input').getAttribute('checked')).toBe('');
        expect(document.querySelectorAll('.transform-script--download-link').length).toBe(0);
    });

    test('SaveScriptDataInput, existing protocol', () => {
        render(
            <SaveScriptDataInput
                model={AssayProtocolModel.create({ protocolId: 1, saveScriptFiles: true })}
                onChange={jest.fn}
            />
        );
        validate('Debugging', false, true);
        expect(document.querySelector('input').getAttribute('checked')).toBe('');
        expect(document.querySelectorAll('.transform-script--download-link').length).toBe(1);
        expect(document.querySelector('a').getAttribute('href')).toContain(
            '/labkey/assay/downloadSampleQCData.view?rowId=1'
        );
    });

    test('ModuleProvidedScriptsInput', () => {
        render(
            <ModuleProvidedScriptsInput model={AssayProtocolModel.create({ moduleTransformScripts: ['a', 'b'] })} />
        );
        validate('Scripts', false, true, 0);
        expect(document.querySelectorAll('.module-transform-script').length).toBe(2);
    });

    test('TransformScriptsInput', async () => {
        render(
            <TransformScriptsInput
                model={AssayProtocolModel.create({
                    protocolId: 1,
                    domains: [{ container: 'test' }],
                    protocolTransformScripts: [{ scriptPath: 'a' }, { scriptPath: 'b' }],
                })}
                onChange={jest.fn}
            />
        );
        expect(document.querySelectorAll('.col').length).toBe(6);
        const labelHTML = document.querySelector('.domain-no-wrap').innerHTML;
        expect(labelHTML).toContain('Scripts');
        expect(labelHTML).not.toContain(' *');
        expect(labelHTML).toContain('label-help-icon');
        expect(document.querySelectorAll('input').length).toBe(4);
        expect(document.querySelectorAll('.transform-script-card').length).toBe(2);
        const addButton = document.querySelector('.transform-script--add-button');
        expect(addButton.getAttribute('disabled')).toBe(null);
        expect(document.querySelectorAll('.transform-script--manage-link').length).toBe(1);
        expect(document.querySelector('.labkey-text-link').getAttribute('href')).toBe(
            '/labkey/_webdav/test/%40scripts'
        );

        // click on the add scripts button and verify additional elements
        expect(document.querySelectorAll('.transform-script-add--radio').length).toBe(0);
        expect(document.querySelectorAll('.container--removal-icon').length).toBe(0);
        await act(async () => {
            await userEvent.click(addButton.querySelector('.container--action-button'));
        });
        expect(document.querySelectorAll('.container--removal-icon').length).toBe(1);
        const radios = document.querySelectorAll('.transform-script-add--radio');
        expect(radios.length).toBe(2);
        expect(radios[0].getAttribute('checked')).toBe(''); // file radio checked by default
        expect(radios[1].getAttribute('checked')).toBe(null); // path radio
        expect(document.querySelectorAll('.transform-script-add--path').length).toBe(0);
        await act(async () => {
            await userEvent.click(radios[1]); // select the path radio
        });
        expect(document.querySelectorAll('.transform-script-add--path').length).toBe(1);
    });
});
