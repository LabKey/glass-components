import React, { ChangeEvent, FC, memo, PropsWithChildren, ReactNode, useCallback, useState } from 'react';
import classNames from 'classnames';

import { Modal } from '../../../Modal';

import { getSubmitButtonClass } from '../../../app/utils';

import { DomainFieldLabel } from '../DomainFieldLabel';

import { HelpLink } from '../../../util/helpLinks';

import { SelectInput } from '../../forms/input/SelectInput';

import { LabelHelpTip } from '../../base/LabelHelpTip';

import { DomainDesignerRadio } from '../DomainDesignerRadio';

import { AdvancedSettingsForm, EachItemSettings, EntireListSettings, ListModel } from './models';

export const DATA_INDEXING_TIP =
    'Not recommend for large lists with frequent updates, since updating any item will cause re-indexing of the entire list.';
export const DOCUMENT_TITLE_TIP =
    'Any text you want displayed and indexed as the search result title. There are no substitution parameters available for this title. Leave the document title blank to use the default title.';
export const CUSTOM_TEMPLATE_TIP = 'Example: ${Key} ${value}';

export const DISPLAY_TITLE_TIP = (
    <>
        Choose a field to identify this list when other lists or datasets have lookups into this list. When “Auto” is
        enabled, LabKey will select the title field for you by using:
        <ul>
            <li>The first non-lookup string column</li>
            <li>The primary key, if there are no string fields</li>
        </ul>
    </>
);
export const DISCUSSION_LINKS_TIP =
    'Optionally allow one or more discussion links to be shown on the details view of each list item.';
export const SEARCH_INDEXING_TIP = 'Controls how this list is indexed for full-text search.';
export const MULTI_FOLDER_TIP =
    'Allows data in this list to span multiple folders. Note that multi-folder lists do not allow PHI annotations on their fields.';

interface DisplayTitleProps {
    model: ListModel;
    onSelectChange: (name, formValue, selected) => void;
    titleColumn: string;
}

export const DisplayTitle: FC<DisplayTitleProps> = memo(({ model, onSelectChange, titleColumn }) => {
    const fields = model.domain.fields.filter(field => !field.isCalculatedField());
    const disabled = fields.size === 0;
    const placeholder = disabled ? 'No fields have been defined yet' : 'Auto';

    return (
        <div className="list__advanced-settings-modal__display-title">
            <SelectInput
                name="titleColumn"
                options={fields.toArray()}
                placeholder={placeholder}
                inputClass="" // This attr is necessary for proper styling
                valueKey="name"
                labelKey="name"
                disabled={disabled}
                onChange={onSelectChange}
                value={titleColumn}
            />
        </div>
    );
});

interface DiscussionLinksProps {
    discussionSetting: number;
    onRadioChange: (evt: any) => void;
}

// TODO: use RadioGroupInput instead
const DISCUSSION_RADIO_NAME = 'discussionSetting';
const DiscussionInputs: FC<DiscussionLinksProps> = memo(({ onRadioChange, discussionSetting }) => (
    <div className="form-group">
        <DomainDesignerRadio
            name={DISCUSSION_RADIO_NAME}
            value={0}
            checked={discussionSetting === 0}
            onChange={onRadioChange}
        >
            Disable discussions
        </DomainDesignerRadio>

        <DomainDesignerRadio
            name={DISCUSSION_RADIO_NAME}
            value={1}
            checked={discussionSetting === 1}
            onChange={onRadioChange}
        >
            Allow one discussion per item
        </DomainDesignerRadio>

        <DomainDesignerRadio
            name={DISCUSSION_RADIO_NAME}
            value={2}
            checked={discussionSetting === 2}
            onChange={onRadioChange}
        >
            Allow multiple discussions per item
        </DomainDesignerRadio>
    </div>
));

interface TitleIndexFieldProps {
    name: string;
    onInputChange: (evt: any) => void;
    titleTemplate: string;
}

const TitleIndexField: FC<TitleIndexFieldProps> = memo(({ name, titleTemplate, onInputChange }) => (
    <div>
        <DomainFieldLabel label="Document title" helpTipBody={DOCUMENT_TITLE_TIP} />
        <span>
            <input
                className="form-control list__advanced-settings-modal__text-field"
                id={name}
                type="text"
                placeholder="Use default"
                value={titleTemplate == null ? '' : titleTemplate}
                onChange={onInputChange}
            />
        </span>
    </div>
));

interface MetadataIndexFieldProps {
    indexSetting: number;
    name: string;
    onRadioChange: (evt: any) => void;
}

// Note: Currently the radio values go from high to low in order to correspond with the previous
// designer's order of radio options. Once the old designer is deprecated, we could change these to
// count from low to high.
// TODO: use RadioGroupInput instead
const MetadataIndexField: FC<MetadataIndexFieldProps> = memo(({ indexSetting, name, onRadioChange }) => (
    <div className="form-group">
        <DomainDesignerRadio name={name} value={2} checked={indexSetting === 2} onChange={onRadioChange}>
            Include both metadata and data
            <LabelHelpTip title="Warning">{DATA_INDEXING_TIP}</LabelHelpTip>
        </DomainDesignerRadio>
        <DomainDesignerRadio name={name} value={1} checked={indexSetting === 1} onChange={onRadioChange}>
            Include data only
            <LabelHelpTip title="Warning">{DATA_INDEXING_TIP}</LabelHelpTip>
        </DomainDesignerRadio>
        <DomainDesignerRadio name={name} value={0} checked={indexSetting === 0} onChange={onRadioChange}>
            Include metadata only (name and description of list and fields)
        </DomainDesignerRadio>
    </div>
));

interface IndexFieldProps {
    bodySetting: number;
    bodyTemplate: string;
    name: string;
    onInputChange: (evt: any) => void;
    onRadioChange: (evt: any) => void;
}

export const IndexField: FC<IndexFieldProps> = memo(props => {
    const { name, onRadioChange, bodySetting, bodyTemplate, onInputChange } = props;
    const id = name === 'entireListBodySetting' ? 'entireListBodyTemplate' : 'eachItemBodyTemplate';

    // TODO: Use RadioGroupInput instead
    return (
        <div>
            <div className="form-group">
                <DomainDesignerRadio name={name} value={0} checked={bodySetting === 0} onChange={onRadioChange}>
                    Index all non-PHI text fields
                </DomainDesignerRadio>
                <DomainDesignerRadio name={name} value={1} checked={bodySetting === 1} onChange={onRadioChange}>
                    Index all non-PHI fields (text, number, date, and boolean)
                </DomainDesignerRadio>
                <DomainDesignerRadio name={name} value={2} checked={bodySetting === 2} onChange={onRadioChange}>
                    Index using custom template
                    <LabelHelpTip>{CUSTOM_TEMPLATE_TIP}</LabelHelpTip>
                </DomainDesignerRadio>
            </div>

            {bodySetting === 2 && (
                <input
                    id={id}
                    type="text"
                    value={bodyTemplate}
                    onChange={onInputChange}
                    className="form-control list__advanced-settings-modal__custom-template-text-field"
                />
            )}
        </div>
    );
});

interface SingleDocumentIndexFieldsProps extends EntireListSettings {
    onInputChange: (evt: any) => void;
    onRadioChange: (evt: any) => void;
}

export const SingleDocumentIndexFields: FC<SingleDocumentIndexFieldsProps> = memo(props => {
    const {
        onRadioChange,
        onInputChange,
        entireListTitleTemplate,
        entireListIndexSetting,
        entireListBodySetting,
        entireListBodyTemplate,
    } = props;

    return (
        <div className="list__advanced-settings-modal__single-doc-fields">
            <TitleIndexField
                titleTemplate={entireListTitleTemplate}
                name="entireListTitleTemplate"
                onInputChange={onInputChange}
            />

            <MetadataIndexField
                name="entireListIndexSetting"
                onRadioChange={onRadioChange}
                indexSetting={entireListIndexSetting}
            />

            <IndexField
                name="entireListBodySetting"
                onRadioChange={onRadioChange}
                onInputChange={onInputChange}
                bodySetting={entireListBodySetting}
                bodyTemplate={entireListBodyTemplate}
            />
        </div>
    );
});

interface SeparateDocumentIndexFieldsProps extends EachItemSettings {
    onInputChange: (evt: any) => void;
    onRadioChange: (evt: any) => void;
}

export const SeparateDocumentIndexFields: FC<SeparateDocumentIndexFieldsProps> = memo(props => {
    const { onRadioChange, onInputChange, eachItemTitleTemplate, eachItemBodySetting, eachItemBodyTemplate } = props;

    return (
        <div className="list__advanced-settings-modal__single-doc-fields">
            <TitleIndexField
                titleTemplate={eachItemTitleTemplate}
                name="eachItemTitleTemplate"
                onInputChange={onInputChange}
            />

            <IndexField
                name="eachItemBodySetting"
                onRadioChange={onRadioChange}
                onInputChange={onInputChange}
                bodySetting={eachItemBodySetting}
                bodyTemplate={eachItemBodyTemplate}
            />
        </div>
    );
});

interface FolderSettingsProps {
    multiFolder: boolean;
    onCheckboxChange: (name, checked) => void;
}

export const FolderSettings: FC<FolderSettingsProps> = memo(({ multiFolder, onCheckboxChange }) => {
    const onMultiFolderChange = useCallback(
        (event: ChangeEvent<HTMLInputElement>): void => {
            onCheckboxChange('multiFolder', event.target.checked);
        },
        [onCheckboxChange]
    );

    return (
        <div className="list__advanced-settings-modal__index-checkbox">
            <label>
                <input checked={multiFolder} type="checkbox" onChange={onMultiFolderChange} />
                Multi-folder <LabelHelpTip title="Multi-folder">{MULTI_FOLDER_TIP}</LabelHelpTip>
            </label>
        </div>
    );
});

interface CollapsibleFieldsProps extends PropsWithChildren {
    checked: boolean;
    collapseFields: () => void;
    expandFields: (expandedSection: string) => void;
    expanded: boolean;
    identifier: string;
    onCheckboxChange: (name: string, checked: boolean) => void;
    title: string;
}

const CollapsibleFields: FC<CollapsibleFieldsProps> = memo(props => {
    const { checked, children, collapseFields, expandFields, expanded, identifier, onCheckboxChange, title } = props;
    const icon = classNames('fa', 'fa-lg', { 'fa-angle-down': expanded, 'fa-angle-right': !expanded });
    const expand = useCallback((): void => {
        // The logic in here could be moved up to the parent component.
        expandFields(expanded ? '' : identifier);
    }, [expandFields, expanded, identifier]);
    const onChange = useCallback(
        (event: ChangeEvent<HTMLInputElement>): void => {
            const checked_ = event.target.checked;
            onCheckboxChange(identifier, checked_);

            if (checked_ && !expanded) {
                expand();
            } else if (!checked_ && expanded) {
                collapseFields();
            }
        },
        [collapseFields, expand, expanded, identifier, onCheckboxChange]
    );

    return (
        <div className="list__advanced-settings-modal__collapsible-field">
            <span className={icon} onClick={expand} />

            <div className="form-group">
                <label>
                    <input checked={checked} onChange={onChange} type="checkbox" />

                    {title}
                </label>
            </div>

            {expanded && children}
        </div>
    );
});

interface SearchIndexingProps {
    eachItemIndex: boolean;
    eachItemIndexSettings: EachItemSettings;
    entireListIndex: boolean;
    entireListIndexSettings: EntireListSettings;
    fileAttachmentIndex: boolean;
    onCheckboxChange: (name, checked) => void;
    onInputChange: (evt: any) => void;
    onRadioChange: (evt: any) => void;
}

export const SearchIndexing: FC<SearchIndexingProps> = memo(props => {
    const {
        onRadioChange,
        onCheckboxChange,
        onInputChange,
        entireListIndex,
        entireListIndexSettings,
        eachItemIndex,
        eachItemIndexSettings,
        fileAttachmentIndex,
    } = props;
    const [expanded, setExpanded] = useState<string>('');
    const collapseFields = useCallback(() => setExpanded(''), []);
    const onIndexFileAttachmentsChange = useCallback(
        (event: ChangeEvent<HTMLInputElement>): void => {
            onCheckboxChange('fileAttachmentIndex', event.target.checked);
        },
        [onCheckboxChange]
    );

    return (
        <div>
            <CollapsibleFields
                expanded={expanded === 'entireListIndex'}
                title="Index entire list as a single document"
                identifier="entireListIndex"
                expandFields={setExpanded}
                collapseFields={collapseFields}
                checked={entireListIndex}
                onCheckboxChange={onCheckboxChange}
            >
                <SingleDocumentIndexFields
                    onRadioChange={onRadioChange}
                    onInputChange={onInputChange}
                    {...entireListIndexSettings}
                />
            </CollapsibleFields>

            <CollapsibleFields
                expanded={expanded === 'eachItemIndex'}
                title="Index each item as a separate document"
                identifier="eachItemIndex"
                expandFields={setExpanded}
                collapseFields={collapseFields}
                checked={eachItemIndex}
                onCheckboxChange={onCheckboxChange}
            >
                <SeparateDocumentIndexFields
                    onRadioChange={onRadioChange}
                    onInputChange={onInputChange}
                    {...eachItemIndexSettings}
                />
            </CollapsibleFields>

            <div className="list__advanced-settings-modal__index-checkbox form-group">
                <label>
                    <input checked={fileAttachmentIndex} onChange={onIndexFileAttachmentsChange} type="checkbox" />
                    Index file attachments
                </label>
            </div>
        </div>
    );
});

interface SettingsContainerProps extends PropsWithChildren {
    tipBody?: string | JSX.Element;
    tipTitle?: string;
    title: string;
}

const SettingsContainer: FC<SettingsContainerProps> = memo(({ children, title, tipBody, tipTitle }) => (
    <div className="list__advanced-settings-modal__section-container">
        <div className="list__advanced-settings-modal__heading">
            <span className="list__bold-text"> {title} </span>
            {tipBody && <LabelHelpTip title={tipTitle || title}>{tipBody}</LabelHelpTip>}
        </div>

        {children}
    </div>
));

interface AdvancedSettingsProps {
    applyAdvancedProperties: (advancedSettingsForm: AdvancedSettingsForm) => void;
    model: ListModel;
    title: string;
}

interface AdvancedSettingsState extends AdvancedSettingsForm {
    modalOpen?: boolean;
}

export class AdvancedSettings extends React.PureComponent<AdvancedSettingsProps, Partial<AdvancedSettingsState>> {
    constructor(props) {
        super(props);
        const initialState = this.getInitialState();

        this.state = {
            modalOpen: false,
            ...initialState,
        } as AdvancedSettingsState;
    }

    getInitialState = (): AdvancedSettingsState => {
        const model = this.props.model;

        return {
            titleColumn: model.titleColumn,
            discussionSetting: model.discussionSetting,
            fileAttachmentIndex: model.fileAttachmentIndex,

            // entire list
            entireListIndex: model.entireListIndex,
            // document title
            entireListTitleTemplate: model.entireListTitleTemplate,
            // metadata/data
            entireListIndexSetting: model.entireListIndexSetting,
            // index
            entireListBodySetting: model.entireListBodySetting,
            entireListBodyTemplate: model.entireListBodyTemplate,

            // each item
            eachItemIndex: model.eachItemIndex,
            // document title
            eachItemTitleTemplate: model.eachItemTitleTemplate,
            // index
            eachItemBodySetting: model.eachItemBodySetting,
            eachItemBodyTemplate: model.eachItemBodyTemplate,

            multiFolder: model.multiFolder,
        };
    };

    toggleModal = (isModalOpen: boolean): void => {
        this.setState({ modalOpen: isModalOpen });

        // If modal is re-opened, reset unsaved values
        if (isModalOpen) {
            this.setState(this.getInitialState());
        }
    };

    openModal = (): void => this.toggleModal(true);

    closeModal = (): void => this.toggleModal(false);

    onRadioChange = (e: ChangeEvent<HTMLInputElement>): void => {
        const name = e.currentTarget.name;
        const value = e.target.value;
        this.setState({ [name]: parseInt(value, 10) });
    };

    onCheckboxChange = (name, checked): void => {
        this.setState({ [name]: checked });
    };

    onInputChange = (e: ChangeEvent<HTMLInputElement>): void => {
        const id = e.target.id;
        const value = e.target.value;

        this.setState({ [id]: value });
    };

    onSelectChange = (name, formValue, selected): void => {
        const value = selected ? selected.name : '<AUTO>';
        this.setState({ [name]: value });
    };

    applyChanges = (): void => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { modalOpen, ...advancedSettingsForm } = this.state;
        this.props.applyAdvancedProperties(advancedSettingsForm as AdvancedSettingsForm);
        this.toggleModal(false);
    };

    render(): ReactNode {
        const {
            modalOpen,
            discussionSetting,
            fileAttachmentIndex,
            entireListIndex,
            entireListTitleTemplate,
            entireListIndexSetting,
            entireListBodySetting,
            eachItemIndex,
            eachItemTitleTemplate,
            eachItemBodySetting,
            titleColumn,
            entireListBodyTemplate,
            eachItemBodyTemplate,
            multiFolder,
        } = this.state;
        const { title, model } = this.props;
        const entireListIndexSettings = {
            entireListTitleTemplate,
            entireListIndexSetting,
            entireListBodySetting,
            entireListBodyTemplate,
        };
        const eachItemIndexSettings = {
            eachItemTitleTemplate,
            eachItemBodySetting,
            eachItemBodyTemplate,
        };
        const footer = (
            <>
                <button
                    className="domain-adv-footer domain-adv-cancel-btn btn btn-default"
                    onClick={this.closeModal}
                    type="button"
                >
                    Cancel
                </button>

                <HelpLink className="domain-adv-footer domain-adv-link" topic="createListOptions#advanced">
                    Get help with list settings
                </HelpLink>

                <button
                    className={`domain-adv-footer domain-adv-apply-btn btn btn-${getSubmitButtonClass()}`}
                    onClick={this.applyChanges}
                    type="button"
                >
                    Apply
                </button>
            </>
        );

        return (
            <>
                <button className="domain-field-float-right btn btn-default" onClick={this.openModal} type="button">
                    {title}
                </button>

                {modalOpen && (
                    <Modal footer={footer} onCancel={this.closeModal} title="Advanced List Settings">
                        <SettingsContainer title="Default Display Field" tipBody={DISPLAY_TITLE_TIP}>
                            <DisplayTitle
                                model={model}
                                onSelectChange={this.onSelectChange}
                                titleColumn={titleColumn}
                            />
                        </SettingsContainer>

                        <SettingsContainer title="Discussion Threads" tipBody={DISCUSSION_LINKS_TIP}>
                            <DiscussionInputs
                                onRadioChange={this.onRadioChange}
                                discussionSetting={discussionSetting}
                            />
                        </SettingsContainer>

                        <SettingsContainer title="Search Indexing Options" tipBody={SEARCH_INDEXING_TIP}>
                            <SearchIndexing
                                onRadioChange={this.onRadioChange}
                                onCheckboxChange={this.onCheckboxChange}
                                onInputChange={this.onInputChange}
                                entireListIndex={entireListIndex}
                                entireListIndexSettings={entireListIndexSettings}
                                eachItemIndex={eachItemIndex}
                                eachItemIndexSettings={eachItemIndexSettings}
                                fileAttachmentIndex={fileAttachmentIndex}
                            />
                        </SettingsContainer>

                        <SettingsContainer title="Folder settings">
                            <FolderSettings multiFolder={multiFolder} onCheckboxChange={this.onCheckboxChange} />
                        </SettingsContainer>
                    </Modal>
                )}
            </>
        );
    }
}
