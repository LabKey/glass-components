import React, { FC, memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Col, Nav, NavItem, Row, Tab } from 'react-bootstrap';

import { ActionURL, Ajax, Utils } from '@labkey/api';

import { Map } from 'immutable';

import { useNotificationsContext } from '../notifications/NotificationsContext';

import { handleRequestFailure } from '../../util/utils';

import { isLoading, LoadingState } from '../../../public/LoadingState';

import { AssayContainerLocation } from './AssayContainerLocation';
import { SpecialtyAssayPanel } from './SpecialtyAssayPanel';
import { AssayDesignUploadPanel } from './AssayDesignUploadPanel';
import { StandardAssayPanel } from './StandardAssayPanel';
import { GENERAL_ASSAY_PROVIDER_NAME } from './constants';

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
    defaultTab?: AssayPickerTabs;
    excludedProviders?: string[];
    hasPremium: boolean;
    onChange: (model: AssayPickerSelectionModel) => void;
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
            success: Utils.getCallbackWrapper(data => {
                resolve(data);
            }),
            failure: handleRequestFailure(reject, 'Failed to load assay providers'),
        });
    });
};

const getSelectedProvider = (providers: AssayProvider[], name: string): AssayProvider => {
    return providers?.find(p => p.name === name);
};

export const AssayPicker: FC<AssayPickerProps> = memo(props => {
    const {
        defaultTab = AssayPickerTabs.STANDARD_ASSAY_TAB,
        showImport,
        showContainerSelect,
        onChange,
        excludedProviders,
        hasPremium,
    } = props;
    const [loadingState, setLoadingState] = useState<LoadingState>();
    const [providers, setProviders] = useState<AssayProvider[]>([]);
    const [containers, setContainers] = useState<Record<string, string>>();
    const [provider, setProvider] = useState<AssayProvider>();
    const [container, setContainer] = useState<string>('');
    const [file, setFile] = useState<File>();
    const [tab, setTab] = useState<AssayPickerTabs>(defaultTab);
    const isLoaded = !isLoading(loadingState);

    // useNotificationsContext will not always be available depending on if the app wraps the NotificationsContext.Provider
    let _createNotification;
    try {
        _createNotification = useNotificationsContext().createNotification;
    } catch (e) {
        // this is expected for LKS usages, so don't throw or console.error
    }

    useEffect(() => {
        setLoadingState(LoadingState.LOADING);
        (async () => {
            try {
                const options = await queryAssayProviders();
                let providers_ = options.providers;
                if (excludedProviders) {
                    providers_ = providers_.filter(p => excludedProviders.indexOf(p.name) === -1);
                }

                setProviders(providers_);
                setContainers(options.locations);
                setContainer(options.defaultLocation);
            } catch (error) {
                _createNotification?.({ message: error, alertClass: 'danger' });
            } finally {
                setLoadingState(LoadingState.LOADED);
            }
        })();
    }, [_createNotification, excludedProviders]);

    useEffect(() => {
        onChange?.({
            container,
            file,
            provider,
            tab,
        });
    }, [onChange, provider, container, file, tab]);

    const selectProvider = useCallback(
        (name: string) => {
            setProvider(getSelectedProvider(providers, name));
        },
        [providers]
    );

    const onSelectTab = useCallback(
        (tab_: AssayPickerTabs) => {
            setTab(tab_);

            if (tab_ === AssayPickerTabs.STANDARD_ASSAY_TAB) {
                selectProvider(GENERAL_ASSAY_PROVIDER_NAME);
            } else if (tab_ === AssayPickerTabs.SPECIALTY_ASSAY_TAB) {
                if (providers.length > 0 && (!provider || provider.name === GENERAL_ASSAY_PROVIDER_NAME)) {
                    selectProvider(providers.filter(p => p.name !== GENERAL_ASSAY_PROVIDER_NAME)[0].name);
                }
            }
        },
        [provider, providers, selectProvider]
    );

    useEffect(() => {
        if (isLoaded) {
            onSelectTab(defaultTab);
        }
    }, [isLoaded]); // eslint-disable-line react-hooks/exhaustive-deps

    const onContainerChange = useCallback(value => {
        setContainer(value);
    }, []);

    const standardProvider = useMemo((): AssayProvider => {
        if (providers) {
            return getSelectedProvider(providers, 'General');
        }
        return undefined;
    }, [providers]);

    const onFileRemove = useCallback(() => {
        setFile(undefined);
    }, []);

    const onFileSelect = useCallback((files: Map<string, File>): void => {
        setFile(files.values().next().value);
    }, []);

    const containerSelect = useMemo(() => {
        if (!showContainerSelect) {
            return null;
        }

        return (
            <Row>
                <Col xs={6}>
                    <AssayContainerLocation locations={containers} selected={container} onChange={onContainerChange} />
                </Col>
            </Row>
        );
    }, [containers, container, onContainerChange, showContainerSelect]);

    return (
        <Tab.Container
            activeKey={tab}
            defaultActiveKey={AssayPickerTabs.STANDARD_ASSAY_TAB}
            id="assay-picker-tabs"
            onSelect={onSelectTab as any}
        >
            <Row className="clearfix">
                <Col sm={12}>
                    <Nav bsStyle="tabs">
                        <NavItem eventKey={AssayPickerTabs.STANDARD_ASSAY_TAB}>Standard Assay</NavItem>
                        <NavItem eventKey={AssayPickerTabs.SPECIALTY_ASSAY_TAB}>Specialty Assays</NavItem>
                        {showImport && <NavItem eventKey={AssayPickerTabs.XAR_IMPORT_TAB}>Import Assay Design</NavItem>}
                    </Nav>
                </Col>
                <Col sm={12}>
                    <Tab.Content animation>
                        <Tab.Pane className="margin-bottom margin-top" eventKey={AssayPickerTabs.STANDARD_ASSAY_TAB}>
                            <StandardAssayPanel provider={standardProvider}>
                                {showContainerSelect && <div className="margin-top">{containerSelect}</div>}
                            </StandardAssayPanel>
                        </Tab.Pane>
                        <Tab.Pane className="margin-bottom margin-top" eventKey={AssayPickerTabs.SPECIALTY_ASSAY_TAB}>
                            <SpecialtyAssayPanel
                                hasPremium={hasPremium}
                                onChange={selectProvider}
                                selected={provider}
                                values={providers}
                            >
                                {showContainerSelect && providers.length > 1 && (
                                    <div className="margin-top">{containerSelect}</div>
                                )}
                            </SpecialtyAssayPanel>
                        </Tab.Pane>
                        {showImport && (
                            <Tab.Pane className="margin-bottom margin-top" eventKey={AssayPickerTabs.XAR_IMPORT_TAB}>
                                <AssayDesignUploadPanel onFileChange={onFileSelect} onFileRemove={onFileRemove}>
                                    {showContainerSelect && <div className="margin-bottom">{containerSelect}</div>}
                                </AssayDesignUploadPanel>
                            </Tab.Pane>
                        )}
                    </Tab.Content>
                </Col>
            </Row>
        </Tab.Container>
    );
});
