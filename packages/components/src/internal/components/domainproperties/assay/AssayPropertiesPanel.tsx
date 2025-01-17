import React, { FC, memo, PropsWithChildren, useCallback, useEffect, useState } from 'react';
import { Utils } from '@labkey/api';

import { DEFINE_ASSAY_SCHEMA_TOPIC } from '../../../util/helpLinks';
import { HelpTopicURL } from '../HelpTopicURL';
import {
    InjectedDomainPropertiesPanelCollapseProps,
    withDomainPropertiesPanelCollapse,
} from '../DomainPropertiesPanelCollapse';
import { SectionHeading } from '../SectionHeading';
import { BasePropertiesPanel, BasePropertiesPanelProps } from '../BasePropertiesPanel';

import {
    hasModule,
    isAssayQCEnabled,
    isPlatesEnabled,
    isPremiumProductEnabled,
    isTransformScriptsEnabled,
} from '../../../app/utils';

import { useServerContext } from '../../base/ServerContext';

import { AssayProtocolModel, Status } from './models';
import {
    AssayStatusInput,
    AutoLinkCategoryInput,
    AutoLinkDataInput,
    BackgroundUploadInput,
    DescriptionInput,
    DetectionMethodsInput,
    EditableResultsInput,
    EditableRunsInput,
    FilterCriteriaInput,
    MetadataInputFormatsInput,
    ModuleProvidedScriptsInput,
    NameInput,
    PlateMetadataInput,
    PlateTemplatesInput,
    QCStatesInput,
    SaveScriptDataInput,
    TransformScriptsInput,
} from './AssayPropertiesInput';
import { BOOLEAN_FIELDS, FORM_ID_PREFIX, FORM_IDS, PROPERTIES_HEADER_ID } from './constants';

interface AssayPropertiesFormProps extends PropsWithChildren {
    appPropertiesOnly?: boolean;
    canRename?: boolean;
    hideAdvancedProperties?: boolean;
    hideStudyProperties?: boolean;
    model: AssayProtocolModel;
    onChange: (model: AssayProtocolModel) => void;
}

const AssayPropertiesForm: FC<AssayPropertiesFormProps> = memo(props => {
    const { appPropertiesOnly, hideAdvancedProperties, children, hideStudyProperties, model, onChange, canRename } =
        props;
    const { moduleContext } = useServerContext();

    const onValueChange = useCallback(
        (id, value): void => {
            const newModel = model.merge({
                [id.replace(FORM_ID_PREFIX, '')]: Utils.isString(value) ? value.trimStart() : value,
            }) as AssayProtocolModel;

            onChange(newModel);
        },
        [model, onChange]
    );

    const onInputChange = useCallback(
        (evt): void => {
            const id = evt.target.id;
            let value = evt.target.value;

            // special case for checkboxes to use "checked" property of target
            if (BOOLEAN_FIELDS.indexOf(id) > -1) {
                value = evt.target.checked;
            }

            // special case for empty string, set as null instead
            if (Utils.isString(value) && value?.trimStart().length === 0) {
                value = null;
            }

            onValueChange(id, value);
        },
        [onValueChange]
    );

    const onStatusChange = useCallback(
        (evt): void => {
            const id = evt.target.id;
            const value = evt.target.checked ? Status.Active : Status.Archived;

            const newModel = model.merge({
                [id.replace(FORM_ID_PREFIX, '')]: value,
            }) as AssayProtocolModel;

            onChange(newModel);
        },
        [model, onChange]
    );

    useEffect(() => {
        if (
            model.editableResults === false &&
            model.protocolTransformScripts?.filter(config => config.runOnEdit).size > 0
        ) {
            const newProtocolTransformScripts = model.protocolTransformScripts.map(config => {
                return { ...config, runOnEdit: false };
            });
            onValueChange(FORM_IDS.PROTOCOL_TRANSFORM_SCRIPTS, newProtocolTransformScripts);
        }
    }, [model.editableResults, model.protocolTransformScripts, onValueChange]);

    return (
        <form>
            {children && (
                <div className="row">
                    <div className="col-xs-12">{children}</div>
                </div>
            )}

            <div className={`col-xs-12 col-lg-${hideAdvancedProperties ? 12 : 6}`}>
                <div className="domain-field-padding-bottom">
                    <SectionHeading title="Basic Properties" />
                    <NameInput
                        model={model}
                        onChange={onInputChange}
                        hideAdvancedProperties={hideAdvancedProperties}
                        canRename={canRename}
                    />
                    <DescriptionInput
                        model={model}
                        onChange={onInputChange}
                        hideAdvancedProperties={hideAdvancedProperties}
                    />
                    {model.allowDetectionMethodSelection() && (
                        <DetectionMethodsInput
                            model={model}
                            onChange={onInputChange}
                            hideAdvancedProperties={hideAdvancedProperties}
                        />
                    )}
                    {model.allowMetadataInputFormatSelection() && (
                        <MetadataInputFormatsInput
                            model={model}
                            onChange={onInputChange}
                            hideAdvancedProperties={hideAdvancedProperties}
                        />
                    )}
                    {!hideAdvancedProperties && model.allowQCStates && isAssayQCEnabled(moduleContext) && (
                        <QCStatesInput model={model} onChange={onInputChange} />
                    )}
                    {isPremiumProductEnabled(moduleContext) && (
                        <AssayStatusInput
                            model={model}
                            onChange={onStatusChange}
                            hideAdvancedProperties={hideAdvancedProperties}
                        />
                    )}
                </div>
                <div className="domain-field-padding-bottom">
                    <SectionHeading title="Editing Settings" />
                    <EditableRunsInput
                        model={model}
                        onChange={onInputChange}
                        hideAdvancedProperties={hideAdvancedProperties}
                    />
                    {model.allowEditableResults && (
                        <EditableResultsInput
                            model={model}
                            onChange={onInputChange}
                            hideAdvancedProperties={hideAdvancedProperties}
                        />
                    )}
                </div>
            </div>

            {!hideAdvancedProperties && (
                <div className="col-xs-12 col-lg-6">
                    <div className="domain-field-padding-bottom">
                        <SectionHeading title="Import Settings" />
                        {model.allowBackgroundUpload && (
                            <BackgroundUploadInput model={model} onChange={onInputChange} />
                        )}
                        {model.allowTransformationScript && isTransformScriptsEnabled(moduleContext) && (
                            <TransformScriptsInput model={model} onChange={onValueChange} />
                        )}
                        {model.allowTransformationScript && isTransformScriptsEnabled(moduleContext) && (
                            <SaveScriptDataInput model={model} onChange={onInputChange} />
                        )}
                        {model.moduleTransformScripts?.size > 0 && <ModuleProvidedScriptsInput model={model} />}
                    </div>
                </div>
            )}

            {(!appPropertiesOnly || isPlatesEnabled(moduleContext)) && (
                <div className="col-xs-12 col-lg-6">
                    <div className="domain-field-padding-bottom">
                        <SectionHeading title="Plate Settings" />
                        {model.allowPlateTemplateSelection() && (
                            <PlateTemplatesInput
                                model={model}
                                onChange={onInputChange}
                                hideAdvancedProperties={hideAdvancedProperties}
                            />
                        )}
                        {model.allowPlateMetadata && <PlateMetadataInput model={model} onChange={onInputChange} />}

                        {model.allowPlateMetadata && <FilterCriteriaInput model={model} onChange={onInputChange} />}
                    </div>
                </div>
            )}

            {!hideAdvancedProperties && !hideStudyProperties && hasModule('study', moduleContext) && (
                <div className="col-xs-12 col-lg-6">
                    <div className="domain-field-padding-bottom">
                        <SectionHeading title="Link to Study Settings" />
                        <AutoLinkDataInput model={model} onChange={onInputChange} />
                        <AutoLinkCategoryInput model={model} onChange={onInputChange} />
                    </div>
                </div>
            )}
        </form>
    );
});

AssayPropertiesForm.displayName = 'AssayPropertiesForm';

interface OwnProps extends AssayPropertiesFormProps {
    asPanel?: boolean;
    helpTopic?: string;
}

type Props = OwnProps & BasePropertiesPanelProps;

const AssayPropertiesPanelImpl: FC<Props & InjectedDomainPropertiesPanelCollapseProps> = memo(props => {
    const {
        appPropertiesOnly = false,
        hideAdvancedProperties = false,
        canRename,
        asPanel = true,
        children,
        helpTopic = DEFINE_ASSAY_SCHEMA_TOPIC,
        hideStudyProperties = false,
        model,
        onChange,
    } = props;
    const [isValid, setIsValid] = useState<boolean>(true);

    const updateValidStatus = useCallback(
        (newModel?: AssayProtocolModel): void => {
            const updatedModel = newModel || model;
            setIsValid(!!updatedModel?.hasValidProperties());

            // Issue 39918: only consider the model changed if there is a newModel param
            if (newModel) {
                onChange(updatedModel);
            }
        },
        [model, onChange]
    );

    const form = (
        <AssayPropertiesForm
            appPropertiesOnly={appPropertiesOnly}
            hideAdvancedProperties={hideAdvancedProperties}
            hideStudyProperties={hideStudyProperties}
            model={model}
            onChange={updateValidStatus}
            canRename={canRename}
        >
            {children}
        </AssayPropertiesForm>
    );

    if (asPanel) {
        return (
            <BasePropertiesPanel
                {...props}
                headerId={PROPERTIES_HEADER_ID}
                isValid={isValid}
                title="Assay Properties"
                updateValidStatus={updateValidStatus}
            >
                {helpTopic && <HelpTopicURL nounPlural="assays" helpTopic={helpTopic} />}
                {form}
            </BasePropertiesPanel>
        );
    }

    return form;
});

AssayPropertiesPanelImpl.displayName = 'AssayPropertiesPanelImpl';

export const AssayPropertiesPanel = withDomainPropertiesPanelCollapse<Props>(AssayPropertiesPanelImpl);
