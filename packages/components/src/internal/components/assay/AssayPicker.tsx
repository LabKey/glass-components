import React, { FC, memo, SyntheticEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { Col, Nav, NavItem, Row, Tab, TabContainer } from 'react-bootstrap';
import { useImmer } from 'use-immer';

import { ActionURL, Ajax, Utils } from '@labkey/api';

import { Map } from 'immutable';

import { useNotificationsContext } from '../notifications/NotificationsContext';

import { GENERAL_ASSAY_PROVIDER_NAME } from './actions';
import { AssayContainerLocation } from './AssayContainerLocation';
import { SpecialtyAssayPanel } from './SpecialtyAssayPanel';
import { AssayDesignUploadPanel } from './AssayDesignUploadPanel';
import { StandardAssayPanel } from './StandardAssayPanel';

export interface AssayProvider {
    description: string;
    fileTypes: string[];
    name: string;
}

interface AssayProvidersOptions {
    defaultLocation: string;
    locations: { [key: string]: string };
    providers: AssayProvider[];
}

export enum AssayPickerTabs {
    SPECIALTY_ASSAY_TAB = 'specialty',
    STANDARD_ASSAY_TAB = 'standard',
    XAR_IMPORT_TAB = 'import',
}

interface AssayPickerProps {
    excludedProviders?: string[];
    hasPremium: boolean;
    onChange: (model: AssayPickerSelectionModel) => void;
    selectedTab?: AssayPickerTabs;
    showContainerSelect: boolean;
    showImport: boolean;
}

export interface AssayPickerSelectionModel {
    container: string;
    file?: File;
    provider: AssayProvider;
    tab: AssayPickerTabs;
}

const queryAssayProviders = (): Promise<AssayProvidersOptions> => {
    return new Promise((resolve, reject) => {
        Ajax.request({
            url: ActionURL.buildURL('assay', 'getAssayTypeSelectOptions.api'),
            method: 'GET',
            scope: this,
            success: Utils.getCallbackWrapper(data => {
                resolve(data as AssayProvidersOptions);
            }),
            failure: Utils.getCallbackWrapper(error => {
                reject(error);
            }),
        });
    });
};

const getSelectedProvider = (providers: AssayProvider[], name: string): AssayProvider => {
    return providers?.find(p => {
        return p.name === name;
    });
};

export const AssayPicker: FC<AssayPickerProps> = memo(props => {
    const { showImport, showContainerSelect, onChange, selectedTab, excludedProviders, hasPremium } = props;
    const { createNotification } = useNotificationsContext();
    const [providers, setProviders] = useState<AssayProvider[]>();
    const [containers, setContainers] = useState<{ [key: string]: string }>();
    const [assaySelectionModel, setAssaySelectionModel] = useImmer<AssayPickerSelectionModel>({
        provider: undefined,
        container: '',
        file: undefined,
        tab: undefined,
    });

    useEffect(() => {
        queryAssayProviders()
            .then(options => {
                let providers = options.providers;
                if (excludedProviders) {
                    providers = providers.filter(provider => excludedProviders.indexOf(provider.name) === -1);
                }

                setProviders(providers);
                setContainers(options.locations);

                setAssaySelectionModel(draft => {
                    draft.container = options.defaultLocation;
                });
            })
            .catch(error => {
                console.error(error);
                createNotification({ message: error, alertClass: 'danger' });
            });
    }, [createNotification, excludedProviders]);

    useEffect(() => {
        onTabChange((selectedTab ?? AssayPickerTabs.STANDARD_ASSAY_TAB) as any);
    }, [providers]);

    useEffect(() => {
        if (onChange) {
            onChange(assaySelectionModel);
        }
    }, [onChange, assaySelectionModel]);

    const onSelectedProviderChange = useCallback(
        value => {
            const provider = getSelectedProvider(providers, value);
            // setSelectedProvider(provider);

            setAssaySelectionModel(draft => {
                draft.provider = provider;
            });
        },
        [providers]
    );

    const onTabChange = useCallback(
        (event: SyntheticEvent<TabContainer, Event>) => {
            const tab: AssayPickerTabs = event as any; // Crummy cast to make TS happy

            setAssaySelectionModel(draft => {
                draft.tab = tab;
            });

            if (tab === AssayPickerTabs.STANDARD_ASSAY_TAB) {
                setAssaySelectionModel(draft => {
                    draft.provider = getSelectedProvider(providers, GENERAL_ASSAY_PROVIDER_NAME);
                });
            } else if (tab === AssayPickerTabs.SPECIALTY_ASSAY_TAB) {
                if (providers?.length > 0) {
                    if (
                        !assaySelectionModel.provider ||
                        assaySelectionModel.provider.name == GENERAL_ASSAY_PROVIDER_NAME
                    ) {
                        onSelectedProviderChange(providers[0].name);
                    }
                }
            }
        },
        [onSelectedProviderChange, providers]
    );

    const onContainerChange = useCallback(value => {
        setAssaySelectionModel(draft => {
            draft.container = value;
        });
    }, []);

    const standardProvider = useMemo((): AssayProvider => {
        if (providers) {
            return getSelectedProvider(providers, 'General');
        }
        return undefined;
    }, [providers]);

    const onFileRemove = useCallback((name: string) => {
        setAssaySelectionModel(draft => {
            draft.file = undefined;
        });
    }, []);

    const onFileSelect = useCallback((files: Map<string, File>): void => {
        const file = files.values().next().value;
        setAssaySelectionModel(draft => {
            draft.file = file;
        });
    }, []);

    const containerSelect = useMemo(() => {
        return (
            <Row>
                <Col xs={6}>
                    <AssayContainerLocation
                        locations={containers}
                        selected={assaySelectionModel.container}
                        onChange={onContainerChange}
                    />
                </Col>
            </Row>
        );
    }, [containers, assaySelectionModel.container, onContainerChange]);

    return (
        <div>
            <Tab.Container
                id="assay-picker-tabs"
                onSelect={onTabChange}
                activeKey={assaySelectionModel.tab}
                defaultActiveKey={AssayPickerTabs.STANDARD_ASSAY_TAB}
            >
                <Row className="clearfix">
                    <Col sm={12}>
                        <Nav bsStyle="tabs">
                            <NavItem eventKey={AssayPickerTabs.STANDARD_ASSAY_TAB}>Standard Assay</NavItem>
                            <NavItem eventKey={AssayPickerTabs.SPECIALTY_ASSAY_TAB}>Specialty Assays</NavItem>
                            {showImport && (
                                <NavItem eventKey={AssayPickerTabs.XAR_IMPORT_TAB}>Import Assay Design</NavItem>
                            )}
                        </Nav>
                    </Col>
                    <Col sm={12}>
                        <Tab.Content animation>
                            <Tab.Pane
                                className="margin-bottom margin-top"
                                eventKey={AssayPickerTabs.STANDARD_ASSAY_TAB}
                            >
                                <StandardAssayPanel provider={standardProvider}>
                                    {showContainerSelect && <div className="margin-top">{containerSelect}</div>}
                                </StandardAssayPanel>
                            </Tab.Pane>
                            <Tab.Pane
                                className="margin-bottom margin-top"
                                eventKey={AssayPickerTabs.SPECIALTY_ASSAY_TAB}
                            >
                                <SpecialtyAssayPanel
                                    values={providers}
                                    selected={assaySelectionModel.provider}
                                    onChange={onSelectedProviderChange}
                                    hasPremium={hasPremium}
                                >
                                    {showContainerSelect && providers?.length > 1 && (
                                        <div className="margin-top">{containerSelect}</div>
                                    )}
                                </SpecialtyAssayPanel>
                            </Tab.Pane>
                            {showImport && (
                                <Tab.Pane
                                    className="margin-bottom margin-top"
                                    eventKey={AssayPickerTabs.XAR_IMPORT_TAB}
                                >
                                    <AssayDesignUploadPanel onFileChange={onFileSelect} onFileRemove={onFileRemove}>
                                        {showContainerSelect && <div className="margin-bottom">{containerSelect}</div>}
                                    </AssayDesignUploadPanel>
                                </Tab.Pane>
                            )}
                        </Tab.Content>
                    </Col>
                </Row>
            </Tab.Container>
        </div>
    );
});
