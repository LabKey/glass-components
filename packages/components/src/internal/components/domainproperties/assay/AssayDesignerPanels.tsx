import React, { FC, memo, useCallback, useMemo } from 'react';
import { List, Map } from 'immutable';

import { getDefaultAPIWrapper } from '../../../APIWrapper';
import { DomainPropertiesAPIWrapper } from '../APIWrapper';

import {
    DomainDesign,
    DomainFieldIndexChange,
    HeaderRenderer,
    IDomainFormDisplayOptions,
    IFieldChange,
} from '../models';

import { getDomainPanelStatus, handleDomainUpdates, scrollDomainErrorIntoView } from '../actions';

import DomainForm from '../DomainForm';
import { BaseDomainDesigner, InjectedBaseDomainDesignerProps, withBaseDomainDesigner } from '../BaseDomainDesigner';

import { DEFAULT_DOMAIN_FORM_DISPLAY_OPTIONS } from '../constants';

import { GENERAL_ASSAY_PROVIDER_NAME } from '../../assay/constants';

import { DataTypeFoldersPanel } from '../DataTypeFoldersPanel';

import { AssayRunDataType } from '../../entities/constants';

import { FolderConfigurableDataType } from '../../entities/models';

import { HitCriteriaModal } from '../../../HitCriteriaModal';

import { saveAssayDesign } from './actions';
import { AssayProtocolModel, HitCriteria } from './models';
import { AssayPropertiesPanel } from './AssayPropertiesPanel';
import { HitCriteriaContext } from './HitCriteriaContext';

const PROPERTIES_PANEL_INDEX = 0;
const DOMAIN_PANEL_INDEX = 1;

interface AssayDomainFormProps
    extends Omit<InjectedBaseDomainDesignerProps, 'onFinish' | 'setSubmitting' | 'submitting'> {
    api: DomainPropertiesAPIWrapper;
    appDomainHeaders: Map<string, HeaderRenderer>;
    domain: DomainDesign;
    domainFormDisplayOptions: IDomainFormDisplayOptions;
    hideAdvancedProperties?: boolean;
    index: number;
    onDomainChange: (
        index: number,
        updatedDomain: DomainDesign,
        dirty: boolean,
        rowIndexChange?: DomainFieldIndexChange[],
        changes?: List<IFieldChange>
    ) => void;
    protocolModel: AssayProtocolModel;
}

const AssayDomainForm: FC<AssayDomainFormProps> = memo(props => {
    const {
        api,
        appDomainHeaders,
        currentPanelIndex,
        domain,
        domainFormDisplayOptions,
        firstState,
        hideAdvancedProperties,
        index,
        onDomainChange,
        onTogglePanel,
        protocolModel,
        validatePanel,
        visitedPanels,
    } = props;
    const onChange = useCallback(
        (updatedDomain, dirty, rowIndexChange, changes) => {
            onDomainChange(index, updatedDomain, dirty, rowIndexChange, changes);
        },
        [index, onDomainChange]
    );
    const onToggle = useCallback(
        (collapsed: boolean, callback: () => void) => {
            onTogglePanel(index + DOMAIN_PANEL_INDEX, collapsed, callback);
        },
        [index, onTogglePanel]
    );
    const appDomainHeaderRenderer = useMemo(() => {
        if (!appDomainHeaders) return;

        const headerKey = appDomainHeaders.keySeq().find(key => domain.isNameSuffixMatch(key));

        return appDomainHeaders.get(headerKey);
    }, [appDomainHeaders, domain]);
    const displayOptions = useMemo(() => {
        const isGpat = protocolModel.providerName === GENERAL_ASSAY_PROVIDER_NAME;
        const isResultsDomain = domain.isNameSuffixMatch('Data');
        const isRunDomain = domain.isNameSuffixMatch('Run');
        const hideFilePropertyType =
            domainFormDisplayOptions.hideFilePropertyType && !domain.isNameSuffixMatch('Batch') && !isRunDomain;
        const hideInferFromFile = !isGpat || !isResultsDomain;
        const textChoiceLockedForDomain = !(
            (isRunDomain && protocolModel.editableRuns) ||
            (isResultsDomain && protocolModel.editableResults)
        );
        return {
            ...domainFormDisplayOptions,
            domainKindDisplayName: 'assay design',
            hideFilePropertyType,
            hideInferFromFile,
            textChoiceLockedForDomain,
            showHitCriteria: isResultsDomain,
        };
    }, [
        domain,
        domainFormDisplayOptions,
        protocolModel.editableResults,
        protocolModel.editableRuns,
        protocolModel.providerName,
    ]);
    return (
        <DomainForm
            key={domain.domainId || index}
            api={api}
            index={domain.domainId || index}
            domainIndex={index}
            domain={domain}
            headerPrefix={protocolModel?.name}
            controlledCollapse
            initCollapsed={currentPanelIndex !== index + DOMAIN_PANEL_INDEX}
            validate={validatePanel === index + DOMAIN_PANEL_INDEX}
            panelStatus={
                protocolModel.isNew()
                    ? getDomainPanelStatus(index + DOMAIN_PANEL_INDEX, currentPanelIndex, visitedPanels, firstState)
                    : 'COMPLETE'
            }
            helpTopic={null} // null so that we don't show the "learn more about this tool" link for these domains
            onChange={onChange}
            onToggle={onToggle}
            appDomainHeaderRenderer={appDomainHeaderRenderer}
            modelDomains={protocolModel.domains}
            appPropertiesOnly={hideAdvancedProperties}
            domainFormDisplayOptions={displayOptions}
        >
            <div>{domain.description}</div>
        </DomainForm>
    );
});

export interface AssayDesignerPanelsProps {
    allowFolderExclusion?: boolean;
    api?: DomainPropertiesAPIWrapper;
    appDomainHeaders?: Map<string, HeaderRenderer>;
    appIsValidMsg?: (model: AssayProtocolModel) => string;
    appPropertiesOnly?: boolean;
    beforeFinish?: (model: AssayProtocolModel) => void;
    containerTop?: number; // This sets the top of the sticky header, default is 0
    domainFormDisplayOptions?: IDomainFormDisplayOptions;
    hideAdvancedProperties?: boolean;
    hideEmptyBatchDomain?: boolean;
    initModel: AssayProtocolModel;
    onCancel: () => void;
    onChange?: (model: AssayProtocolModel) => void;
    onComplete: (model: AssayProtocolModel) => void;
    saveBtnText?: string;
}

type Props = AssayDesignerPanelsProps & InjectedBaseDomainDesignerProps;

interface State {
    modalOpen: boolean;
    openTo?: number;
    protocolModel: AssayProtocolModel;
}

// Exported for testing
export class AssayDesignerPanelsImpl extends React.PureComponent<Props, State> {
    static defaultProps = {
        api: getDefaultAPIWrapper().domain,
        domainFormDisplayOptions: DEFAULT_DOMAIN_FORM_DISPLAY_OPTIONS,
    };

    constructor(props: Props) {
        super(props);

        this.state = {
            modalOpen: false,
            openTo: undefined,
            protocolModel: props.initModel,
        };
    }

    onDomainChange = (
        index: number,
        updatedDomain: DomainDesign,
        dirty: boolean,
        rowIndexChange?: DomainFieldIndexChange[],
        changes?: List<IFieldChange>
    ): void => {
        const { onChange } = this.props;

        this.setState(
            state => {
                const domains = state.protocolModel.domains.map((domain, i) => {
                    if (i === index) {
                        return updatedDomain ?? handleDomainUpdates(domain, changes);
                    }
                    return domain;
                });
                const updatedModel = state.protocolModel.merge({ domains }) as AssayProtocolModel;

                return {
                    protocolModel: updatedModel,
                };
            },
            () => {
                // Issue 39918: use the dirty property that DomainForm onChange passes
                if (dirty) {
                    onChange?.(this.state.protocolModel);
                }
            }
        );
    };

    shouldSkipBatchDomain(domain: DomainDesign): boolean {
        return (
            this.props.hideEmptyBatchDomain && domain && domain.isNameSuffixMatch('Batch') && domain.fields.size === 0
        );
    }

    onFinish = (): void => {
        const { setSubmitting } = this.props;
        const { protocolModel } = this.state;
        const appIsValidMsg = this.getAppIsValidMsg();
        const textChoiceValidMsg = this.getTextChoiceUpdatesValidMsg();
        const isValid = protocolModel.isValid() && textChoiceValidMsg === undefined && appIsValidMsg === undefined;

        this.props.onFinish(isValid, this.saveDomain);

        if (!isValid) {
            const exception =
                appIsValidMsg !== undefined
                    ? appIsValidMsg
                    : (textChoiceValidMsg ?? protocolModel.getFirstDomainFieldError());
            const updatedModel = protocolModel.set('exception', exception) as AssayProtocolModel;
            setSubmitting(false, () => {
                this.setState(
                    () => ({ protocolModel: updatedModel }),
                    () => {
                        scrollDomainErrorIntoView();
                    }
                );
            });
        }
    };

    saveDomain = (): void => {
        const { beforeFinish, setSubmitting } = this.props;
        const { protocolModel } = this.state;

        beforeFinish?.(protocolModel);

        saveAssayDesign(protocolModel)
            .then(response => {
                this.setState(() => ({ protocolModel }));
                setSubmitting(false, () => {
                    this.props.onComplete(response);
                });
            })
            .catch(errorModel => {
                setSubmitting(false, () => {
                    this.setState(
                        () => ({ protocolModel: errorModel }),
                        () => {
                            scrollDomainErrorIntoView();
                        }
                    );
                });
            });
    };

    getAppIsValidMsg(): string {
        const { appIsValidMsg } = this.props;
        const { protocolModel } = this.state;

        return !appIsValidMsg ? undefined : appIsValidMsg(protocolModel);
    }

    getTextChoiceUpdatesValidMsg(): string {
        const { protocolModel } = this.state;

        const runDomain = protocolModel.getDomainByNameSuffix('Run');
        if (runDomain && !protocolModel.editableRuns && this.domainHasTextChoiceUpdates(runDomain)) {
            return 'Text choice value updates are not allowed when assay does not allow "Editable Runs".';
        }

        const dataDomain = protocolModel.getDomainByNameSuffix('Data');
        if (dataDomain && !protocolModel.editableResults && this.domainHasTextChoiceUpdates(dataDomain)) {
            return 'Text choice value updates are not allowed when assay does not allow "Editable Results".';
        }

        return undefined;
    }

    domainHasTextChoiceUpdates(domain: DomainDesign): boolean {
        return (
            domain.fields.find(field => {
                const valueUpdates = field.textChoiceValidator?.extraProperties?.valueUpdates ?? {};
                return Object.keys(valueUpdates).length > 0;
            }) !== undefined
        );
    }

    onAssayPropertiesChange = (protocolModel: AssayProtocolModel): void => {
        this.setState({ protocolModel }, () => {
            this.props.onChange?.(protocolModel);
        });
    };

    onUpdateExcludedFolders = (_: FolderConfigurableDataType, excludedContainerIds: string[]): void => {
        const { protocolModel } = this.state;
        const newModel = protocolModel.merge({ excludedContainerIds }) as AssayProtocolModel;
        this.onAssayPropertiesChange(newModel);
    };

    openModal = (openTo?: number): void => {
        this.setState({ modalOpen: true, openTo });
    };

    closeModal = (): void => {
        this.setState({ modalOpen: false, openTo: undefined });
    };

    saveHitCriteria = (hitCriteria: HitCriteria) => {
        this.setState(current => {
            // Note: use protocolModel.set instead of merge so hitCriteria doesn't get converted to an immutable object
            return {
                modalOpen: false,
                openTo: undefined,
                protocolModel: current.protocolModel.set('hitCriteria', hitCriteria) as AssayProtocolModel,
            };
        });
    };

    togglePropertiesPanel = (collapsed, callback): void => {
        this.props.onTogglePanel(PROPERTIES_PANEL_INDEX, collapsed, callback);
    };

    toggleFoldersPanel = (collapsed, callback): void => {
        const { protocolModel } = this.state;
        this.props.onTogglePanel(protocolModel.domains.size + 1, collapsed, callback);
    };

    render() {
        const {
            allowFolderExclusion,
            api,
            appDomainHeaders,
            appPropertiesOnly,
            hideAdvancedProperties,
            domainFormDisplayOptions,
            currentPanelIndex,
            validatePanel,
            visitedPanels,
            firstState,
            onTogglePanel,
            submitting,
            onCancel,
            saveBtnText,
        } = this.props;
        const { modalOpen, openTo, protocolModel } = this.state;
        const isGpat = protocolModel.providerName === GENERAL_ASSAY_PROVIDER_NAME;

        const hitCriteriaState = {
            openModal: this.openModal,
            hitCriteria: protocolModel.hitCriteria,
        };
        const panelStatus = protocolModel.isNew()
            ? getDomainPanelStatus(PROPERTIES_PANEL_INDEX, currentPanelIndex, visitedPanels, firstState)
            : 'COMPLETE';

        return (
            <BaseDomainDesigner
                name={protocolModel.name}
                exception={protocolModel.exception}
                domains={protocolModel.domains}
                hasValidProperties={protocolModel.hasValidProperties()}
                visitedPanels={visitedPanels}
                submitting={submitting}
                onCancel={onCancel}
                onFinish={this.onFinish}
                saveBtnText={saveBtnText}
            >
                <HitCriteriaContext.Provider value={hitCriteriaState}>
                    <AssayPropertiesPanel
                        model={protocolModel}
                        onChange={this.onAssayPropertiesChange}
                        controlledCollapse
                        initCollapsed={currentPanelIndex !== PROPERTIES_PANEL_INDEX}
                        panelStatus={panelStatus}
                        validate={validatePanel === PROPERTIES_PANEL_INDEX}
                        appPropertiesOnly={appPropertiesOnly}
                        hideAdvancedProperties={hideAdvancedProperties}
                        hideStudyProperties={
                            !!domainFormDisplayOptions && domainFormDisplayOptions.hideStudyPropertyTypes
                        }
                        onToggle={this.togglePropertiesPanel}
                        canRename={isGpat}
                    />
                    {/* Note: We cannot filter this array because onChange needs the correct index for each domain */}
                    {protocolModel.domains.toArray().map((domain, i) => {
                        // optionally hide the Batch Fields domain from the UI
                        if (this.shouldSkipBatchDomain(domain)) return null;

                        return (
                            <AssayDomainForm
                                api={api}
                                appDomainHeaders={appDomainHeaders}
                                domain={domain}
                                domainFormDisplayOptions={domainFormDisplayOptions}
                                index={i}
                                key={domain.name}
                                onDomainChange={this.onDomainChange}
                                protocolModel={protocolModel}
                                currentPanelIndex={currentPanelIndex}
                                firstState={firstState}
                                onTogglePanel={onTogglePanel}
                                validatePanel={validatePanel}
                                visitedPanels={visitedPanels}
                            />
                        );
                    })}
                    {modalOpen && (
                        <HitCriteriaModal
                            model={protocolModel}
                            onClose={this.closeModal}
                            openTo={openTo}
                            onSave={this.saveHitCriteria}
                        />
                    )}
                </HitCriteriaContext.Provider>
                {appPropertiesOnly && allowFolderExclusion && (
                    <DataTypeFoldersPanel
                        controlledCollapse
                        dataTypeRowId={protocolModel?.protocolId}
                        dataTypeName={protocolModel?.name}
                        entityDataType={AssayRunDataType}
                        initCollapsed={currentPanelIndex !== protocolModel.domains.size + 1}
                        onToggle={this.toggleFoldersPanel}
                        onUpdateExcludedFolders={this.onUpdateExcludedFolders}
                    />
                )}
            </BaseDomainDesigner>
        );
    }
}

export const AssayDesignerPanels = withBaseDomainDesigner<AssayDesignerPanelsProps>(AssayDesignerPanelsImpl);
AssayDesignerPanels.displayName = 'AssayDesignerPanels';
