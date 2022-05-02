import React, { FC, memo, ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { Button, MenuItem, Panel, SplitButton } from 'react-bootstrap';
import { Filter, getServerContext } from '@labkey/api';

import {
    Alert,
    ALIQUOT_FILTER_MODE,
    AssayStateModel,
    caseInsensitive,
    createNotification,
    InjectedAssayModel,
    isLoading,
    isSampleOperationPermitted,
    LoadingSpinner,
    naturalSortByProperty,
    QueryModel,
    RequiresModelAndActions,
    SampleAliquotViewSelector,
    SampleOperation,
    SchemaQuery,
    TabbedGridPanel,
    User,
} from '../../..';

import { withAssayModels } from '../assay/withAssayModels';
import { getImportItemsForAssayDefinitions } from '../assay/actions';

// These need to be direct imports from files to avoid circular dependencies in index.ts
import { InjectedQueryModels, withQueryModels } from '../../../public/QueryModel/withQueryModels';

import { ComponentsAPIWrapper, getDefaultAPIWrapper } from '../../APIWrapper';

import { getSampleAssayQueryConfigs, SampleAssayResultViewConfig } from './actions';
import { getSampleStatusType } from './utils';

interface Props {
    api?: ComponentsAPIWrapper;
    sampleId?: string;
    sampleModel?: QueryModel;
    showAliquotViewSelector?: boolean;
    sampleAliquotType?: ALIQUOT_FILTER_MODE;
    sourceId?: number | string;
    sourceSampleRows?: Array<Record<string, any>>;
    sourceAliquotRows?: Array<Record<string, any>>;
    emptyAssayDefDisplay?: ReactNode;
    emptyAssayResultDisplay?: ReactNode;
    emptyAliquotViewMsg?: string;
    emptySampleViewMsg?: string;
    user: User;
}

export const AssayResultPanel: FC = ({ children }) => {
    return (
        <Panel>
            <Panel.Heading>Assay Results</Panel.Heading>
            <Panel.Body>{children}</Panel.Body>
        </Panel>
    );
};

const ASSAY_GRID_ID_PREFIX = 'assay-detail';
const UNFILTERED_PREFIX = 'unfiltered-';
const UNFILTERED_GRID_ID_PREFIX = UNFILTERED_PREFIX + ASSAY_GRID_ID_PREFIX;

interface SampleAssayDetailButtonsOwnProps {
    activeSampleAliquotType?: ALIQUOT_FILTER_MODE;
    assayModel: AssayStateModel;
    isSourceSampleAssayGrid?: boolean;
    onSampleAliquotTypeChange?: (mode: ALIQUOT_FILTER_MODE) => void;
    sampleModel: QueryModel;
    user: User;
}

type SampleAssayDetailButtonsProps = SampleAssayDetailButtonsOwnProps & RequiresModelAndActions;

// exported for jest testing
export const SampleAssayDetailButtons: FC<SampleAssayDetailButtonsProps> = props => {
    const { assayModel, model, sampleModel, user } = props;

    if (!user.hasInsertPermission()) {
        return null;
    }

    let currentAssayHref: string;
    const menuItems = [];

    getImportItemsForAssayDefinitions(assayModel, sampleModel).forEach((href, assay) => {
        if (model?.title === assay.name) {
            currentAssayHref = href;
        }

        menuItems.push(
            <MenuItem href={href} key={assay.id}>
                {assay.name}
            </MenuItem>
        );
    });

    if (menuItems.length === 0 || currentAssayHref === undefined) {
        return null;
    } else if (menuItems.length === 1) {
        return (
            <Button bsStyle="success" href={currentAssayHref} id="importDataSingleButton">
                Import Data
            </Button>
        );
    } else {
        return (
            <SplitButton bsStyle="success" href={currentAssayHref} id="importDataDropDown" title="Import Data">
                {menuItems}
            </SplitButton>
        );
    }
};

// export for jest testing
export const SampleAssayDetailButtonsRight: FC<SampleAssayDetailButtonsProps> = props => {
    const { activeSampleAliquotType, onSampleAliquotTypeChange, isSourceSampleAssayGrid } = props;

    // NOTE: not checking isSampleAliquotSelectorEnabled() here since we always want to show the selector for this
    // use case because it doesn't have a grid column to apply the filter directly

    return (
        <>
            <SampleAliquotViewSelector
                aliquotFilterMode={activeSampleAliquotType}
                updateAliquotFilter={onSampleAliquotTypeChange}
                headerLabel={
                    isSourceSampleAssayGrid ? 'Show Assay Data with Source Samples' : 'Show Assay Data with Samples'
                }
                samplesLabel={isSourceSampleAssayGrid ? 'Derived Samples Only' : 'Sample Only'}
                allLabel={isSourceSampleAssayGrid ? 'Derived Samples or Aliquots' : 'Sample or Aliquots'}
            />
        </>
    );
};

// export for jest testing
export const getSampleAssayDetailEmptyText = (
    hasRows: boolean,
    activeSampleAliquotType?: ALIQUOT_FILTER_MODE,
    emptySampleViewMsg?: string,
    emptyAliquotViewMsg?: string
): string => {
    if (!activeSampleAliquotType || activeSampleAliquotType === ALIQUOT_FILTER_MODE.all || hasRows) {
        return undefined;
    }

    if (activeSampleAliquotType === ALIQUOT_FILTER_MODE.aliquots) {
        return emptyAliquotViewMsg ?? 'No assay results available for aliquots of this sample.';
    }

    return (
        emptySampleViewMsg ??
        "Assay results are available for this sample's aliquots, but not available for this sample."
    );
};

interface OwnProps {
    onSampleAliquotTypeChange?: (mode: ALIQUOT_FILTER_MODE) => void;
    activeSampleAliquotType?: ALIQUOT_FILTER_MODE;
    showImportBtn?: boolean;
    isSourceSampleAssayGrid?: boolean;
    onTabChange: (tabId: string) => void;
    activeTabId?: string;
    user: User;
}

type SampleAssayDetailBodyProps = Props & InjectedAssayModel & OwnProps;

// export for jest testing
export const SampleAssayDetailBodyImpl: FC<SampleAssayDetailBodyProps & InjectedQueryModels> = memo(props => {
    const {
        actions,
        assayModel,
        queryModels,
        sampleModel,
        showImportBtn,
        isSourceSampleAssayGrid,
        showAliquotViewSelector,
        onSampleAliquotTypeChange,
        activeSampleAliquotType,
        emptyAssayDefDisplay,
        emptyAssayResultDisplay,
        emptyAliquotViewMsg,
        emptySampleViewMsg,
        onTabChange,
        activeTabId,
        user,
    } = props;
    const allModels = Object.values(queryModels);
    const allLoaded = allModels.every(model => !model.isLoading);

    useEffect(() => {
        actions.loadAllModels(true);
    }, [actions]);

    const { queryModelsWithData, tabOrder } = useMemo(() => {
        const models: Record<string, QueryModel> = {};
        let targetQueryModels = Object.values(queryModels);
        const isFilteredView =
            showAliquotViewSelector &&
            activeSampleAliquotType !== null &&
            activeSampleAliquotType !== ALIQUOT_FILTER_MODE.all;
        if (isFilteredView) {
            targetQueryModels = [];
            Object.values(queryModels).forEach(model => {
                if (model.id?.indexOf(UNFILTERED_GRID_ID_PREFIX) === 0) targetQueryModels.push(model);
            });
        }

        targetQueryModels.forEach(model => {
            let targetModel = model;
            if (isFilteredView) {
                targetModel = Object.values(queryModels).find(
                    m => m.id === model.id.substring(UNFILTERED_PREFIX.length)
                );
            }
            if (model.hasRows) {
                models[targetModel.id] = targetModel;
            }
        });

        return {
            queryModelsWithData: models,
            tabOrder: Object.values(models)
                .sort(naturalSortByProperty('title'))
                .map(model => model.id),
        };
    }, [activeSampleAliquotType, queryModels, showAliquotViewSelector]);

    const getEmptyText = useCallback(
        activeModel => {
            return getSampleAssayDetailEmptyText(
                activeModel?.hasRows,
                activeSampleAliquotType,
                emptySampleViewMsg,
                emptyAliquotViewMsg
            );
        },
        [activeSampleAliquotType, emptyAliquotViewMsg, emptySampleViewMsg]
    );

    if (allModels.length === 0) {
        if (emptyAssayDefDisplay) return <>{emptyAssayDefDisplay}</>;

        return (
            <AssayResultPanel>
                <Alert bsStyle="warning">
                    There are no assay designs defined that reference this sample type as either a result field or run
                    property.
                </Alert>
            </AssayResultPanel>
        );
    }

    if (!allLoaded) {
        return (
            <AssayResultPanel>
                <LoadingSpinner />
            </AssayResultPanel>
        );
    }

    if (Object.keys(queryModelsWithData).length === 0) {
        if (emptyAssayResultDisplay) return <>{emptyAssayResultDisplay}</>;

        return (
            <AssayResultPanel>
                <Alert bsStyle="warning">
                    No assay results available for this sample.
                    {isSampleOperationPermitted(
                        getSampleStatusType(sampleModel?.getRow()),
                        SampleOperation.AddAssayData
                    ) && (
                        <>
                            To import assay data, use the <b>Import Assay Data</b> option from the &nbsp;
                            <i className="fa fa-bars" />
                            &nbsp; menu above.
                        </>
                    )}
                </Alert>
            </AssayResultPanel>
        );
    }

    const sampleName = sampleModel.getRowValue('Name');

    return (
        <TabbedGridPanel
            actions={actions}
            alwaysShowTabs
            ButtonsComponent={showImportBtn ? SampleAssayDetailButtons : undefined}
            buttonsComponentProps={{
                assayModel,
                sampleModel,
                onSampleAliquotTypeChange,
                activeSampleAliquotType,
                isSourceSampleAssayGrid,
                user,
            }}
            ButtonsComponentRight={showAliquotViewSelector ? SampleAssayDetailButtonsRight : undefined}
            getEmptyText={getEmptyText}
            loadOnMount={false}
            queryModels={queryModelsWithData}
            showRowCountOnTabs
            tabOrder={tabOrder}
            onTabSelect={onTabChange}
            activeModelId={activeTabId}
            title="Assay Results"
            // exportFilename={sampleModel.name + '_assay_results'}
            exportFilename={sampleName + '_assay_results'}
        />
    );
});

// exported for jest testing
export const SampleAssayDetailBody = withQueryModels<SampleAssayDetailBodyProps>(SampleAssayDetailBodyImpl);

// exported for jest testing
export const SampleAssayDetailImpl: FC<Props & InjectedAssayModel> = props => {
    const {
        api,
        assayModel,
        sampleId,
        sampleModel,
        sampleAliquotType,
        showAliquotViewSelector,
        sourceSampleRows,
        sourceAliquotRows,
        sourceId,
    } = props;

    const [activeSampleAliquotType, setActiveSampleAliquotType] = useState<ALIQUOT_FILTER_MODE>(
        sampleAliquotType ?? ALIQUOT_FILTER_MODE.all
    );

    const isSourceSampleAssayGrid = useMemo(() => {
        // using type conversion comparison (i.e. == and !=) to check for both null and undefined
        return sampleId == null && sourceSampleRows != null;
    }, [sampleId, sourceSampleRows]);

    const [aliquotRows, setAliquotRows] = useState<Array<Record<string, any>>>(undefined);
    useEffect(() => {
        if (!showAliquotViewSelector || !sampleId) return;

        api.samples
            .getSampleAliquotRows(sampleId)
            .then(aliquots => {
                setAliquotRows(aliquots);
            })
            .catch(() => {
                createNotification({
                    alertClass: 'danger',
                    message: 'Unable to load sample aliquots. Your session may have expired.',
                });
            });
    }, [api, sampleId, showAliquotViewSelector]);

    const [sampleAssayResultViewConfigs, setSampleAssayResultViewConfigs] =
        useState<SampleAssayResultViewConfig[]>(undefined);
    useEffect(() => {
        api.samples
            .getSampleAssayResultViewConfigs()
            .then(setSampleAssayResultViewConfigs)
            .catch(() => {
                setSampleAssayResultViewConfigs([]);
            });
    }, [api]);

    const loadingDefinitions =
        isLoading(assayModel.definitionsLoadingState) || sampleAssayResultViewConfigs === undefined;

    const onSampleAliquotTypeChange = useCallback(type => {
        setActiveSampleAliquotType(type);
    }, []);

    const sampleRows = useMemo(() => {
        if (!showAliquotViewSelector || (!isSourceSampleAssayGrid && !aliquotRows)) return [sampleModel.getRow()];

        if (isSourceSampleAssayGrid) {
            if (activeSampleAliquotType === ALIQUOT_FILTER_MODE.all) return [...sourceSampleRows, ...sourceAliquotRows];
            return activeSampleAliquotType === ALIQUOT_FILTER_MODE.aliquots ? sourceAliquotRows : sourceSampleRows;
        }

        if (activeSampleAliquotType === ALIQUOT_FILTER_MODE.all) return [sampleModel.getRow(), ...aliquotRows];
        return activeSampleAliquotType === ALIQUOT_FILTER_MODE.aliquots ? aliquotRows : [sampleModel.getRow()];
    }, [
        sampleModel,
        aliquotRows,
        activeSampleAliquotType,
        showAliquotViewSelector,
        sourceSampleRows,
        sourceAliquotRows,
        sourceId,
        isSourceSampleAssayGrid,
    ]);

    const allSampleRows = useMemo(() => {
        if (!showAliquotViewSelector || (!isSourceSampleAssayGrid && !aliquotRows)) return [sampleModel.getRow()];

        return isSourceSampleAssayGrid
            ? [...sourceSampleRows, ...sourceAliquotRows]
            : [sampleModel.getRow(), ...aliquotRows];
    }, [
        sampleModel,
        aliquotRows,
        showAliquotViewSelector,
        sourceSampleRows,
        sourceAliquotRows,
        sourceId,
        isSourceSampleAssayGrid,
    ]);

    const sampleIds = useMemo(() => sampleRows.map(row => caseInsensitive(row, 'RowId').value), [sampleRows]);
    const allSampleIds = useMemo(() => allSampleRows.map(row => caseInsensitive(row, 'RowId').value), [allSampleRows]);

    const key = useMemo(() => {
        return (sampleId ?? sourceId) + '-' + activeSampleAliquotType;
    }, [sampleId, sourceId, activeSampleAliquotType]);

    const [activeTabId, setActiveTabId] = useState<string>(undefined);
    const onTabChange = useCallback((tab: string) => {
        setActiveTabId(tab);
    }, []);

    const canImportData = useMemo(() => {
        return isSampleOperationPermitted(getSampleStatusType(sampleModel?.getRow()), SampleOperation.AddAssayData);
    }, [sampleModel]);

    const queryConfigs = useMemo(() => {
        if (loadingDefinitions) {
            return {};
        }

        const queryGridSuffix = sampleId ?? sourceId + '-source';
        const sampleSchemaQuery = isSourceSampleAssayGrid ? undefined : sampleModel.queryInfo.schemaQuery;
        const _configs = getSampleAssayQueryConfigs(
            assayModel,
            sampleIds,
            queryGridSuffix,
            ASSAY_GRID_ID_PREFIX,
            false,
            sampleSchemaQuery
        );

        let configs = _configs.reduce((_configs, config) => {
            const modelId = config.id;
            _configs[modelId] = config;
            return _configs;
        }, {});

        // keep tab when "all" view has data, but filtered view is blank
        const includeUnfilteredConfigs =
            showAliquotViewSelector && activeSampleAliquotType && activeSampleAliquotType !== ALIQUOT_FILTER_MODE.all;
        if (includeUnfilteredConfigs) {
            const _unfilteredConfigs = getSampleAssayQueryConfigs(
                assayModel,
                allSampleIds,
                queryGridSuffix,
                UNFILTERED_GRID_ID_PREFIX,
                false,
                sampleSchemaQuery
            );

            const unfilteredConfigs = _unfilteredConfigs.reduce((_configs, config) => {
                const modelId = config.id;
                _configs[modelId] = config;
                return _configs;
            }, {});

            configs = { ...configs, ...unfilteredConfigs };
        }

        // add in the config objects for those module-defined sample assay result views (e.g. TargetedMS module),
        // note that the moduleName from the config must be active/enabled in the container
        const activeModules = getServerContext().container.activeModules;
        sampleAssayResultViewConfigs.forEach(config => {
            if (activeModules?.indexOf(config.moduleName) > -1) {
                const baseConfig = {
                    title: config.title,
                    schemaQuery: SchemaQuery.create(config.schemaName, config.queryName, config.viewName),
                    containerFilter: config.containerFilter,
                };

                let modelId = `${ASSAY_GRID_ID_PREFIX}:${config.title}:${sampleId}`;
                let sampleFilterValues = sampleRows.map(
                    row => caseInsensitive(row, config.sampleRowKey ?? 'RowId')?.value
                );
                configs[modelId] = {
                    ...baseConfig,
                    id: modelId,
                    baseFilters: [Filter.create(config.filterKey, sampleFilterValues, Filter.Types.IN)],
                };

                if (includeUnfilteredConfigs) {
                    modelId = `${UNFILTERED_GRID_ID_PREFIX}:${config.title}:${sampleId}`;
                    sampleFilterValues = allSampleRows.map(
                        row => caseInsensitive(row, config.sampleRowKey ?? 'RowId')?.value
                    );
                    configs[modelId] = {
                        ...baseConfig,
                        id: modelId,
                        baseFilters: [Filter.create(config.filterKey, sampleFilterValues, Filter.Types.IN)],
                    };
                }
            }
        });

        return configs;
    }, [
        assayModel.definitions,
        loadingDefinitions,
        sampleModel,
        sampleId,
        sampleIds,
        activeSampleAliquotType,
        showAliquotViewSelector,
        sourceId,
        allSampleIds,
        isSourceSampleAssayGrid,
        sampleAssayResultViewConfigs,
        sourceSampleRows,
    ]);

    if (loadingDefinitions || (showAliquotViewSelector && !isSourceSampleAssayGrid && !aliquotRows)) {
        return (
            <AssayResultPanel>
                <LoadingSpinner />
            </AssayResultPanel>
        );
    }

    return (
        <SampleAssayDetailBody
            {...props}
            key={key}
            queryConfigs={queryConfigs}
            onSampleAliquotTypeChange={onSampleAliquotTypeChange}
            activeSampleAliquotType={activeSampleAliquotType}
            showImportBtn={!isSourceSampleAssayGrid && canImportData}
            isSourceSampleAssayGrid={isSourceSampleAssayGrid}
            onTabChange={onTabChange}
            activeTabId={activeTabId}
        />
    );
};

SampleAssayDetailImpl.defaultProps = {
    api: getDefaultAPIWrapper(),
};

export const SampleAssayDetail = withAssayModels(SampleAssayDetailImpl);
