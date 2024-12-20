import React, { FC, memo, PropsWithChildren, ReactNode, useCallback, useMemo } from 'react';
import { List, Map } from 'immutable';

import classNames from 'classnames';

import {
    ASSAY_EDIT_PLATE_TEMPLATE_TOPIC,
    CONFIGURE_SCRIPTING_TOPIC,
    HelpLink,
    PROGRAMMATIC_QC_TOPIC,
    RUN_PROPERTIES_TOPIC,
} from '../../../util/helpLinks';
import { DomainFieldLabel, DomainFieldLabelProps } from '../DomainFieldLabel';
import { AutoLinkToStudyDropdown } from '../AutoLinkToStudyDropdown';
import { buildURL } from '../../../url/AppURL';
import { Container } from '../../base/models/Container';
import { AddEntityButton } from '../../buttons/AddEntityButton';
import { RemoveEntityButton } from '../../buttons/RemoveEntityButton';
import { FileAttachmentForm } from '../../../../public/files/FileAttachmentForm';
import { getWebDavFiles, getWebDavUrl, uploadWebDavFileToUrl } from '../../../../public/files/WebDav';
import { Alert } from '../../base/Alert';
import { AttachmentCard, IAttachment } from '../../../renderers/AttachmentCard';
import { getAttachmentTitleFromName } from '../../../renderers/FileColumnRenderer';
import { setCopyValue } from '../../../events';
import { getFileExtension } from '../../files/actions';
import { resolveErrorMessage } from '../../../util/messaging';
import { FilterCriteriaRenderer } from '../../../FilterCriteriaRenderer';
import { DisableableButton } from '../../buttons/DisableableButton';

import { AssayProtocolModel } from './models';
import { FORM_IDS, SCRIPTS_DIR } from './constants';
import { getScriptEngineForExtension, getValidPublishTargets } from './actions';
import { useFilterCriteriaContext } from './FilterCriteriaContext';

interface AssayPropertiesInputProps extends DomainFieldLabelProps, PropsWithChildren {
    colSize?: number;
    hideAdvancedProperties?: boolean;
}

export const AssayPropertiesInput: FC<AssayPropertiesInputProps> = memo(props => {
    const { hideAdvancedProperties, children, colSize = 9, ...domainFieldProps } = props;
    const colXs = colSize ? 'col-xs-' + colSize : undefined;

    return (
        <div className="row margin-top">
            <div
                className={classNames('col col-xs-3', {
                    'col-lg-2': hideAdvancedProperties,
                    'col-lg-4': !hideAdvancedProperties,
                })}
            >
                <DomainFieldLabel {...domainFieldProps} />
            </div>
            <div
                className={classNames('col', colXs, {
                    'col-lg-10': hideAdvancedProperties,
                    'col-lg-8': !hideAdvancedProperties,
                })}
            >
                {children}
            </div>
        </div>
    );
});

AssayPropertiesInput.displayName = 'AssayPropertiesInput';

interface InputProps {
    canRename?: boolean;
    hideAdvancedProperties?: boolean;
    model: AssayProtocolModel;
    onChange: (evt) => void;
}

export const NameInput: FC<InputProps> = memo(props => (
    <AssayPropertiesInput label="Name" required={true} hideAdvancedProperties={props.hideAdvancedProperties}>
        <input
            className="form-control"
            id={FORM_IDS.ASSAY_NAME}
            type="text"
            placeholder="Enter a name for this assay"
            value={props.model.name || ''}
            onChange={props.onChange}
            disabled={!props.model.isNew() && !props.canRename}
        />
    </AssayPropertiesInput>
));

export const DescriptionInput: FC<InputProps> = memo(props => (
    <AssayPropertiesInput
        label="Description"
        hideAdvancedProperties={props.hideAdvancedProperties}
        helpTipBody={<p>A short description for this assay design.</p>}
    >
        <textarea
            className="form-control"
            id={FORM_IDS.ASSAY_DESCRIPTION}
            value={props.model.description || ''}
            onChange={props.onChange}
        />
    </AssayPropertiesInput>
));

export const QCStatesInput: FC<InputProps> = memo(props => (
    <AssayPropertiesInput
        label="QC States"
        helpTipBody={
            <p>
                If enabled, QC states can be configured and assigned on a per run basis to control the visibility of
                imported run data. Users not in the QC Analyst role will not be able to view non-public data.
            </p>
        }
    >
        <input type="checkbox" id={FORM_IDS.QC_ENABLED} checked={props.model.qcEnabled} onChange={props.onChange} />
    </AssayPropertiesInput>
));

export const PlateTemplatesInput: FC<InputProps> = memo(props => (
    <AssayPropertiesInput
        label="Plate Template"
        required={true}
        colSize={6}
        hideAdvancedProperties={props.hideAdvancedProperties}
        helpTipBody={
            <p>
                Specify the plate template definition used to map spots or wells on the plate to data fields in this
                assay design. <HelpLink topic={ASSAY_EDIT_PLATE_TEMPLATE_TOPIC}>More info</HelpLink>
            </p>
        }
    >
        <select
            className="form-control"
            id={FORM_IDS.PLATE_TEMPLATE}
            onChange={props.onChange}
            value={props.model.selectedPlateTemplate}
        >
            <option key="_empty" value={null} />
            {props.model.availablePlateTemplates.map((type, i) => (
                <option key={i} value={type}>
                    {type}
                </option>
            ))}
        </select>
        <a className="labkey-text-link" href={buildURL('plate', 'plateTemplateList')}>
            Configure Templates
        </a>
    </AssayPropertiesInput>
));

export const DetectionMethodsInput: FC<InputProps> = memo(props => (
    <AssayPropertiesInput
        label="Detection Method"
        required
        colSize={6}
        hideAdvancedProperties={props.hideAdvancedProperties}
    >
        <select
            className="form-control"
            id={FORM_IDS.DETECTION_METHOD}
            onChange={props.onChange}
            value={props.model.selectedDetectionMethod}
        >
            <option key="_empty" value={null} />
            {props.model.availableDetectionMethods.map(method => (
                <option key={method} value={method}>
                    {method}
                </option>
            ))}
        </select>
    </AssayPropertiesInput>
));

export const MetadataInputFormatsInput: FC<InputProps> = memo(props => (
    <AssayPropertiesInput
        label="Metadata Input Format"
        required={true}
        colSize={6}
        hideAdvancedProperties={props.hideAdvancedProperties}
        helpTipBody={
            <>
                <p>
                    <strong>Manual: </strong> Metadata is provided as form based manual entry.
                </p>
                <p>
                    <strong>File Upload (metadata only): </strong> Metadata is provided from a file upload (separate
                    from the run data file).
                </p>
                <p>
                    <strong>Combined File Upload (metadata & run data): </strong> Metadata and run data are combined
                    into a single file upload.
                </p>
            </>
        }
    >
        <select
            className="form-control"
            id={FORM_IDS.METADATA_INPUT_FORMAT}
            onChange={props.onChange}
            value={props.model.selectedMetadataInputFormat}
        >
            {Object.keys(props.model.availableMetadataInputFormats).map((key, i) => (
                <option key={i} value={key}>
                    {props.model.availableMetadataInputFormats[key]}
                </option>
            ))}
        </select>
    </AssayPropertiesInput>
));

export const AssayStatusInput: FC<InputProps> = memo(props => (
    <AssayPropertiesInput
        label="Active"
        hideAdvancedProperties={props.hideAdvancedProperties}
        helpTipBody={
            <p>If disabled, this assay design will be considered archived, and will be hidden in certain views.</p>
        }
    >
        <input type="checkbox" id={FORM_IDS.STATUS} checked={props.model.isActive()} onChange={props.onChange} />
    </AssayPropertiesInput>
));

export const EditableRunsInput: FC<InputProps> = memo((props: InputProps) => (
    <AssayPropertiesInput
        label="Editable Runs"
        hideAdvancedProperties={props.hideAdvancedProperties}
        helpTipBody={
            <p>
                If enabled, users with sufficient permissions can edit values at the run level after the initial import
                is complete. These changes will be audited.
            </p>
        }
    >
        <input
            type="checkbox"
            id={FORM_IDS.EDITABLE_RUNS}
            checked={props.model.editableRuns}
            onChange={props.onChange}
        />
    </AssayPropertiesInput>
));

export const EditableResultsInput: FC<InputProps> = memo(props => (
    <AssayPropertiesInput
        label="Editable Results"
        hideAdvancedProperties={props.hideAdvancedProperties}
        helpTipBody={
            <p>
                If enabled, users with sufficient permissions can edit and delete at the individual results row level
                after the initial import is complete. New result rows cannot be added to existing runs. These changes
                will be audited.
            </p>
        }
    >
        <input
            type="checkbox"
            id={FORM_IDS.EDITABLE_RESULTS}
            checked={props.model.editableResults}
            onChange={props.onChange}
        />
    </AssayPropertiesInput>
));

export const BackgroundUploadInput: FC<InputProps> = memo(props => (
    <AssayPropertiesInput
        label="Import in Background"
        helpTipBody={
            <p>
                If enabled, assay imports will be processed as jobs in the data pipeline. If there are any errors during
                the import, they can be viewed from the log file for that job.
            </p>
        }
    >
        <input
            type="checkbox"
            id={FORM_IDS.BACKGROUND_UPLOAD}
            checked={props.model.backgroundUpload}
            onChange={props.onChange}
        />
    </AssayPropertiesInput>
));

interface AutoLinkDataInputState {
    containers: Container[];
}

export class AutoLinkDataInput extends React.PureComponent<InputProps, AutoLinkDataInputState> {
    constructor(props) {
        super(props);

        this.state = {
            containers: undefined,
        };
    }

    componentDidMount(): void {
        getValidPublishTargets(this.props.model.container)
            .then(containers => {
                this.setState({ containers });
            })
            .catch(response => {
                this.setState({ containers: [] });
            });
    }

    render() {
        const { model, onChange } = this.props;
        const { containers } = this.state;

        return (
            <AssayPropertiesInput
                label="Auto-Link Data to Study"
                helpTipBody={
                    <>
                        <p>
                            When new runs are imported, automatically link their data rows to the specified target
                            study. Only rows that include subject and visit/date information will be linked.
                        </p>
                        <p>
                            The user performing the import must have insert permission in the target study and the
                            corresponding dataset.
                        </p>
                    </>
                }
            >
                <AutoLinkToStudyDropdown
                    containers={containers}
                    onChange={onChange}
                    autoLinkTarget={FORM_IDS.AUTO_LINK_TARGET}
                    value={model.autoCopyTargetContainerId}
                />
            </AssayPropertiesInput>
        );
    }
}

export const AutoLinkCategoryInput: FC<InputProps> = memo(({ model, onChange }) => (
    <AssayPropertiesInput
        label="Linked Dataset Category"
        helpTipBody={
            <>
                <p>
                    Specify the desired category for the Assay Dataset that will be created (or appended to) in the
                    target study when rows are linked. If the category you specify does not exist, it will be created.
                </p>
                <p>
                    If the Assay Dataset already exists, this setting will not overwrite a previously assigned category.
                    Leave blank to use the default category of "Uncategorized".
                </p>
            </>
        }
    >
        <input
            className="form-control"
            id={FORM_IDS.AUTO_LINK_CATEGORY}
            type="text"
            value={model.autoLinkCategory}
            onChange={onChange}
        />
    </AssayPropertiesInput>
));

interface ModuleProvidedScriptsInputProps {
    model: AssayProtocolModel;
}

export const ModuleProvidedScriptsInput: FC<ModuleProvidedScriptsInputProps> = props => (
    <AssayPropertiesInput
        label="Module-Provided Scripts"
        helpTipBody={
            <>
                <p>
                    These scripts are part of the assay type and cannot be removed. They will run after any custom
                    scripts configured above.
                </p>
                <p>
                    The extension of the script file identifies the scripting engine that will be used to run the
                    validation script. For example, a script named test.pl will be run with the Perl scripting engine.
                    The scripting engine must be configured on the Views and Scripting page in the Admin Console.{' '}
                    <HelpLink topic={CONFIGURE_SCRIPTING_TOPIC}>More info</HelpLink>
                </p>
            </>
        }
    >
        {props.model.moduleTransformScripts
            .map((script, i) => (
                <div key={i} className="module-transform-script" style={{ overflowWrap: 'break-word' }}>
                    {script}
                </div>
            ))
            .toArray()}
    </AssayPropertiesInput>
);

enum AddingScriptType {
    file,
    path,
}

interface TransformScriptsInputProps {
    model: AssayProtocolModel;
    onChange: (id: string, value: any) => void;
}

interface TransformScriptsInputState {
    addingScript: AddingScriptType;
    addingScriptPath: string;
    error: string;
}

export class TransformScriptsInput extends React.PureComponent<TransformScriptsInputProps, TransformScriptsInputState> {
    readonly state = { error: undefined, addingScript: undefined, addingScriptPath: '' };

    toggleAddingScript = (): void => {
        this.setState(state => ({
            addingScript: state.addingScript === undefined ? AddingScriptType.file : undefined,
            addingScriptPath: '',
            error: undefined,
        }));
    };

    onChangeAddingScriptType = (evt: any): void => {
        const value = evt.target.value ?? evt.target.getAttribute('data-value');
        this.setState({ addingScript: value === 'file' ? AddingScriptType.file : AddingScriptType.path });
    };

    addScript = (path?: string) => {
        const scripts = this.props.model.protocolTransformScripts
            ? this.props.model.protocolTransformScripts
            : List<string>();
        this.applyChanges(scripts.push(path ?? ''));
        this.toggleAddingScript();
    };

    removeScript = (index: number) => {
        this.applyChanges(this.props.model.protocolTransformScripts.filter((script, i) => i !== index));
    };

    applyChanges(updatedScripts: any) {
        this.props.onChange(FORM_IDS.PROTOCOL_TRANSFORM_SCRIPTS, updatedScripts);
    }

    onScriptPathChange = (evt: any): void => {
        this.setState({ addingScriptPath: evt.target.value });
    };

    onAddScriptPath = async (): Promise<void> => {
        if (this.state.addingScript !== AddingScriptType.path) return;

        const { model } = this.props;
        this.setState({ error: undefined });

        try {
            const value = this.state.addingScriptPath?.trim() ?? '';
            if (value.length > 0) {
                await getScriptEngineForExtension(getFileExtension(value), model.container);
                this.addScript(value);
            }
        } catch (e) {
            this.setState({ error: resolveErrorMessage(e) });
        }
    };

    onAddScriptFile = async (files: Map<string, File>): Promise<void> => {
        if (this.state.addingScript !== AddingScriptType.file) return;

        const { model } = this.props;
        this.setState({ error: undefined });

        try {
            await getScriptEngineForExtension(getFileExtension(files.first()?.name), model.container);

            const url = getWebDavUrl(model.container, SCRIPTS_DIR, false, true);
            const fileName = await uploadWebDavFileToUrl(files.first(), url, false);
            const scriptFiles = await getWebDavFiles(model.container, SCRIPTS_DIR, false, true);
            const filePath = scriptFiles.get('files')?.get(fileName)?.dataFileUrl;

            // dataFileUrl comes back encoded and with a "file://" prefix
            if (filePath) {
                this.addScript(decodeURIComponent(filePath.replace('file://', '')));
            }
        } catch (e) {
            this.setState({ error: resolveErrorMessage(e) });
        }
    };

    onRemoveScript = (attachment: IAttachment): void => {
        this.applyChanges(
            this.props.model.protocolTransformScripts.filter(script => script !== attachment.description)
        );
    };

    onCopyScriptPath = (attachment: IAttachment): void => {
        const handleCopy = (event: ClipboardEvent): void => {
            setCopyValue(event, attachment.description);
            event.preventDefault();
            document.removeEventListener('copy', handleCopy, true);
        };
        document.addEventListener('copy', handleCopy, true);
        document.execCommand('copy');
    };

    renderLabel(): ReactNode {
        return (
            <div className="col col-xs-3 col-lg-4">
                <DomainFieldLabel
                    label="Transform Scripts"
                    helpTipBody={
                        <>
                            <p>Upload a transform script file or enter the full path to an existing file.</p>
                            <p>
                                Transform scripts run before the assay data is imported and can reshape the data file to
                                match the expected import format.{' '}
                                <HelpLink topic={PROGRAMMATIC_QC_TOPIC} useDefaultUrl>
                                    More info
                                </HelpLink>
                            </p>
                            <p>
                                The extension of the script file identifies the scripting engine that will be used. The
                                scripting engine must be configured on the Views and Scripting page in the Admin
                                Console.{' '}
                                <HelpLink topic={CONFIGURE_SCRIPTING_TOPIC} useDefaultUrl>
                                    More info
                                </HelpLink>
                            </p>
                        </>
                    }
                />
            </div>
        );
    }

    render(): ReactNode {
        const { model } = this.props;
        const { error, addingScript, addingScriptPath } = this.state;
        const protocolTransformScripts = model.protocolTransformScripts || List<string>();
        const protocolTransformAttachments = protocolTransformScripts.map(script => {
            return { name: getAttachmentTitleFromName(script), description: script };
        });

        return (
            <>
                {protocolTransformAttachments.map((attachment, i) => {
                    return (
                        <div key={i} className="row margin-top">
                            {i === 0 ? this.renderLabel() : <div className="col col-xs-3 col-lg-4" />}
                            <div className="col col-xs-9 col-lg-8">
                                <AttachmentCard
                                    outerCls="transform-script-card"
                                    allowRemove
                                    allowDownload={false}
                                    attachment={attachment}
                                    copyNoun="path"
                                    noun="path"
                                    onRemove={this.onRemoveScript}
                                    onCopyLink={this.onCopyScriptPath}
                                />
                            </div>
                        </div>
                    );
                })}
                {addingScript !== undefined && (
                    <div className="row transform-script-add">
                        {protocolTransformScripts.size === 0 ? (
                            this.renderLabel()
                        ) : (
                            <div className="col col-xs-3 col-lg-4" />
                        )}
                        <div className="col col-xs-8 col-lg-8">
                            <input
                                className="transform-script-add--radio"
                                checked={addingScript === AddingScriptType.file}
                                type="radio"
                                name="transformScriptAddType"
                                value="file"
                                onChange={this.onChangeAddingScriptType}
                            />
                            <div
                                className="transform-script-add--label"
                                data-value="file"
                                onClick={this.onChangeAddingScriptType}
                            >
                                Upload file
                            </div>
                            <input
                                className="transform-script-add--radio"
                                checked={addingScript === AddingScriptType.path}
                                type="radio"
                                name="transformScriptAddType"
                                value="path"
                                onChange={this.onChangeAddingScriptType}
                            />
                            <div
                                className="transform-script-add--label"
                                data-value="path"
                                onClick={this.onChangeAddingScriptType}
                            >
                                Enter file path
                            </div>
                            <RemoveEntityButton
                                labelClass="domain-remove-icon pull-right"
                                onClick={this.toggleAddingScript}
                            />
                            {addingScript === AddingScriptType.file && (
                                <FileAttachmentForm
                                    allowDirectories={false}
                                    allowMultiple={false}
                                    compact
                                    showLabel={false}
                                    onFileChange={this.onAddScriptFile}
                                />
                            )}
                            {addingScript === AddingScriptType.path && (
                                <div className="transform-script-add--path">
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={addingScriptPath}
                                        onChange={this.onScriptPathChange}
                                    />
                                    <button type="button" className="btn btn-primary" onClick={this.onAddScriptPath}>
                                        Apply
                                    </button>
                                </div>
                            )}
                            {error && <Alert>{error}</Alert>}
                        </div>
                    </div>
                )}
                <div className="row margin-top">
                    {protocolTransformScripts.size === 0 && addingScript === undefined ? (
                        this.renderLabel()
                    ) : (
                        <div className="col col-xs-3 col-lg-4" />
                    )}
                    <div className="col col-xs-9 col-lg-8">
                        <AddEntityButton
                            entity="Script"
                            containerClass="transform-script--add-button"
                            onClick={this.toggleAddingScript}
                            disabled={addingScript !== undefined}
                        />
                        <div className="transform-script--manage-link">
                            <a
                                href={getWebDavUrl(model.container, SCRIPTS_DIR, false, true)}
                                target="_blank"
                                className="labkey-text-link"
                                rel="noopener noreferrer"
                            >
                                Manage script files
                            </a>
                        </div>
                    </div>
                </div>
            </>
        );
    }
}

export const SaveScriptDataInput: FC<InputProps> = memo(({ model, onChange }) => (
    <AssayPropertiesInput
        label="Save Script Data for Debugging"
        helpTipBody={
            <>
                <p>
                    Typically transform and validation script data files are deleted on script completion. For debug
                    purposes, it can be helpful to be able to view the files generated by the server that are passed to
                    the script.
                </p>
                <p>
                    If this checkbox is checked, files will be saved to a subfolder named:
                    "TransformAndValidationFiles", located in the same folder that the original script is located.
                </p>
                {!model.isNew() && (
                    <p>
                        Use the "Download template files" link to get example files for your assay design.{' '}
                        <HelpLink topic={RUN_PROPERTIES_TOPIC} useDefaultUrl>
                            More info
                        </HelpLink>
                    </p>
                )}
            </>
        }
    >
        <input type="checkbox" id={FORM_IDS.SAVE_SCRIPT_FILES} checked={model.saveScriptFiles} onChange={onChange} />
        {!model.isNew() && (
            <div className="transform-script--download-link">
                <a
                    href={buildURL('assay', 'downloadSampleQCData', {
                        rowId: model.protocolId,
                    })}
                    target="_blank"
                    className="labkey-text-link"
                    rel="noopener noreferrer"
                >
                    Download template files
                </a>
            </div>
        )}
    </AssayPropertiesInput>
));

export const PlateMetadataInput: FC<InputProps> = memo(({ model, onChange }) => (
    <AssayPropertiesInput
        label="Plate Metadata"
        helpTipBody={
            <p>
                If enabled, plate template metadata can be added on a per run basis to combine tabular data that has
                well location information with plate based data.
            </p>
        }
    >
        <input type="checkbox" id={FORM_IDS.PLATE_METADATA} checked={model.plateMetadata} onChange={onChange} />
    </AssayPropertiesInput>
));

export const FilterCriteriaInput: FC<InputProps> = memo(({ model }) => {
    const context = useFilterCriteriaContext();
    const onClick = useCallback(() => context.openModal(), [context?.openModal]);
    const domain = useMemo(() => model.domains.find(domain => domain.isNameSuffixMatch('Data')), [model.domains]);
    const fields = useMemo(() => {
        return domain?.fields.filter(df => df.isFilterCriteriaField()).toArray() ?? [];
    }, [domain]);

    if (!domain || !context) return null;

    const disabledMsg = model.plateMetadata ? undefined : 'Plate Metadata must be enabled';

    return (
        <AssayPropertiesInput label="Hit Selection Criteria">
            <div className="filter-criteria-input">
                <div className="filter-criteria-input__button">
                    <DisableableButton disabledMsg={disabledMsg} onClick={onClick}>
                        Edit Criteria
                    </DisableableButton>
                </div>
                <div className="filter-criteria-input__criteria">
                    <FilterCriteriaRenderer fields={fields} renderEmptyMessage={false} />
                </div>
            </div>
        </AssayPropertiesInput>
    );
});
