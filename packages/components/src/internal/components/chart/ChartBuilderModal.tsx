import React, { FC, Fragment, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import classNames from 'classnames';

import { PermissionTypes, Utils } from '@labkey/api';

import { generateId } from '../../util/utils';
import { LABKEY_VIS } from '../../constants';
import { Modal } from '../../Modal';

import { SelectInput, SelectInputOption } from '../forms/input/SelectInput';

import { naturalSortByProperty } from '../../../public/sort';

import { LoadingSpinner } from '../base/LoadingSpinner';

import { QueryModel } from '../../../public/QueryModel/QueryModel';
import { RequiresModelAndActions } from '../../../public/QueryModel/withQueryModels';

import { useServerContext } from '../base/ServerContext';
import { hasPermissions } from '../base/models/User';

import { Alert } from '../base/Alert';
import { FormButtons } from '../../FormButtons';

import { getContainerFilter } from '../../query/api';

import { SVGIcon } from '../base/SVGIcon';

import { deleteChart, saveChart, SaveReportConfig } from './actions';

import { ChartConfig, ChartQueryConfig, GenericChartModel } from './models';

interface AggregateFieldInfo {
    name: string;
    value: string;
}

export interface ChartFieldInfo {
    aggregate?: AggregateFieldInfo;
    // allowMultiple?: boolean; // not yet supported, will be part of a future dev story
    label: string;
    name: string;
    nonNumericOnly?: boolean;
    numericOnly?: boolean;
    required: boolean;
}

export interface ChartTypeInfo {
    fields: ChartFieldInfo[];
    hidden?: boolean;
    imgUrl: string;
    name: string;
    title: string;
}

const HIDDEN_CHART_TYPES = ['time_chart'];
const RIGHT_COL_FIELDS = ['color', 'shape', 'series'];
export const MAX_ROWS_PREVIEW = 100000;
export const MAX_POINT_DISPLAY = 10000;
const BLUE_HEX_COLOR = '3366FF';
const BAR_CHART_AGGREGATE_NAME = 'aggregate-method';
const BAR_CHART_AGGREGATE_METHODS = [
    { label: 'Count (non-blank)', value: 'COUNT' },
    { label: 'Sum', value: 'SUM' },
    { label: 'Min', value: 'MIN' },
    { label: 'Max', value: 'MAX' },
    { label: 'Mean', value: 'MEAN' },
    { label: 'Median', value: 'MEDIAN' },
];

const ICONS = {
    bar_chart: 'bar_chart',
    box_plot: 'box_plot',
    pie_chart: 'pie_chart',
    scatter_plot: 'xy_scatter',
    line_plot: 'xy_line',
};

export const getChartRenderMsg = (chartConfig: ChartConfig, rowCount: number, isPreview: boolean): string => {
    const msg = [];
    if (isPreview && rowCount === MAX_ROWS_PREVIEW) {
        msg.push(`The preview is being limited to ${MAX_ROWS_PREVIEW.toLocaleString()} rows.`);
    }
    if (chartConfig.renderType === 'line_plot' && rowCount > chartConfig.geomOptions.binThreshold) {
        msg.push(`The number of individual points exceeds ${MAX_POINT_DISPLAY.toLocaleString()}.`);
        msg.push('Data points will not be shown on this line plot.');
    } else if (chartConfig.renderType === 'scatter_plot' && rowCount > MAX_POINT_DISPLAY) {
        msg.push(`The number of individual points exceeds ${MAX_POINT_DISPLAY.toLocaleString()}.`);
        msg.push('The data is now grouped by density.');
    }
    return msg.length === 0 ? undefined : msg.join(' ');
};

export const getSelectOptions = (
    model: QueryModel,
    chartType: ChartTypeInfo,
    field: ChartFieldInfo
): SelectInputOption[] => {
    const allowableTypes = LABKEY_VIS.GenericChartHelper.getAllowableTypes(field);

    return model.queryInfo
        .getDisplayColumns(model.viewName)
        .filter(col => {
            const colType = col.displayFieldJsonType || col.jsonType;
            const hasMatchingType = allowableTypes.indexOf(colType) > -1;
            const isMeasureDimensionMatch = LABKEY_VIS.GenericChartHelper.isMeasureDimensionMatch(
                chartType.name,
                field,
                col.measure,
                col.dimension
            );
            return hasMatchingType || isMeasureDimensionMatch;
        })
        .sort(naturalSortByProperty('caption'))
        .map(col => ({ label: col.caption, value: col.fieldKey, data: col }));
};

export const getChartBuilderQueryConfig = (
    model: QueryModel,
    fieldValues: Record<string, SelectInputOption>,
    chartConfig: ChartConfig,
    savedConfig: ChartQueryConfig
): ChartQueryConfig => {
    const { schemaQuery, containerPath } = model;
    const { schemaName, queryName, viewName } = schemaQuery;

    return {
        maxRows: -1, // this will be saved with the queryConfig, but we will override it for the preview in the modal
        requiredVersion: '13.2',
        schemaName: savedConfig?.schemaName || schemaName,
        queryName: savedConfig?.queryName || queryName,
        viewName: savedConfig?.viewName || viewName,
        columns: Object.values(fieldValues)
            .filter(field => field?.value)
            .map(field => field.value),
        sort: LABKEY_VIS.GenericChartHelper.getQueryConfigSortKey(chartConfig.measures),
        filterArray: savedConfig?.filterArray ?? [],
        containerPath: savedConfig?.containerPath || containerPath,
    } as ChartQueryConfig;
};

export const getChartBuilderChartConfig = (
    chartType: ChartTypeInfo,
    fieldValues: Record<string, SelectInputOption>,
    savedConfig: ChartConfig
): ChartConfig => {
    const config = {
        renderType: chartType.name,
        measures: {},
        scales: {
            ...savedConfig?.scales,
        },
        labels: {
            main: '',
            subtitle: '',
            ...savedConfig?.labels,
        },
        pointType: savedConfig?.pointType ?? 'all',
        geomOptions: {
            binShape: 'hex',
            binSingleColor: '000000',
            binThreshold: MAX_POINT_DISPLAY,
            boxFillColor: chartType.name === 'box_plot' ? 'none' : BLUE_HEX_COLOR,
            chartLayout: 'single',
            chartSubjectSelection: 'subjects',
            colorPaletteScale: 'ColorDiscrete',
            colorRange: 'BlueWhite',
            displayIndividual: true,
            displayAggregate: false,
            errorBars: 'None',
            gradientColor: 'FFFFFF',
            gradientPercentage: 95,
            hideDataPoints: false,
            hideTrendLine: false,
            lineColor: '000000',
            lineWidth: chartType.name === 'line_plot' ? 3 : 1,
            marginBottom: null,
            marginLeft: null,
            marginRight: null,
            marginTop: 20, // this will be saved with the chartConfig, but we will override it for the preview in the modal
            opacity: chartType.name === 'bar_chart' || chartType.name === 'line_plot' ? 1.0 : 0.5,
            pieHideWhenLessThanPercentage: 5,
            pieInnerRadius: 0,
            pieOuterRadius: 80,
            piePercentagesColor: '333333',
            pointFillColor: BLUE_HEX_COLOR,
            pointSize: chartType.name === 'box_plot' ? 3 : 5,
            position: chartType.name === 'box_plot' ? 'jitter' : null,
            showOutliers: true,
            showPiePercentages: true,
            ...savedConfig?.geomOptions,
        },
    } as ChartConfig;

    chartType.fields.forEach(field => {
        if (fieldValues[field.name]?.value) {
            config.measures[field.name] = {
                fieldKey: fieldValues[field.name].data.fieldKey,
                name: fieldValues[field.name].value,
                label: fieldValues[field.name].label,
                queryName: fieldValues[field.name].data.queryName,
                schemaName: fieldValues[field.name].data.schemaName,
                type:
                    fieldValues[field.name].data.displayFieldJsonType ||
                    fieldValues[field.name].data.jsonType ||
                    fieldValues[field.name].data.type,
            };

            // check if the field has an aggregate method (bar chart y-axis only)
            if (fieldValues[BAR_CHART_AGGREGATE_NAME] && field.name === 'y') {
                config.measures[field.name].aggregate = { ...fieldValues[BAR_CHART_AGGREGATE_NAME] };
            }

            // update axis label if it is a new report or if the saved report that didn't have this measure or was using the default field label for the axis label
            if (
                !savedConfig ||
                !savedConfig.measures[field.name] ||
                savedConfig.labels[field.name] === savedConfig.measures[field.name].label
            ) {
                config.labels[field.name] = fieldValues[field.name].label;
            }
        }
    });

    if (
        chartType.name === 'bar_chart' &&
        (!savedConfig ||
            !savedConfig.labels?.['y'] ||
            savedConfig.labels?.['y'] === getDefaultBarChartAxisLabel(savedConfig))
    ) {
        config.labels['y'] = getDefaultBarChartAxisLabel(config);
    }

    return config;
};

export const getDefaultBarChartAxisLabel = (config: ChartConfig): string => {
    const aggregate = config.measures.y?.aggregate;
    const prefix = (aggregate?.name ?? aggregate?.label ?? 'Sum') + ' of ';
    return config.measures.y ? prefix + config.measures.y.label : 'Count';
};

interface ChartTypeSideBarProps {
    chartTypes: ChartTypeInfo[];
    onChange: (e: React.MouseEvent<HTMLDivElement>) => void;
    savedChartModel: GenericChartModel;
    selectedType: ChartTypeInfo;
}

const ChartTypeSideBar: FC<ChartTypeSideBarProps> = memo(props => {
    const { chartTypes, savedChartModel, selectedType, onChange } = props;

    return (
        <>
            {chartTypes.map(type => {
                const selected = selectedType.name === type.name;
                const selectable = !savedChartModel && selectedType.name !== type.name;

                return (
                    <div
                        key={type.name}
                        className={classNames('chart-builder-type', { selected, selectable })}
                        data-name={type.name}
                        onClick={onChange}
                    >
                        <SVGIcon height={null} iconSrc={!selected ? ICONS[type.name] + '_gray' : ICONS[type.name]} />
                        <div className="title">{type.title}</div>
                    </div>
                );
            })}
        </>
    );
});

interface ChartTypeQueryFormProps {
    canShare: boolean;
    fieldValues: Record<string, SelectInputOption>;
    model: QueryModel;
    name: string;
    onNameChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    onSelectFieldChange: (key: string, _: any, selectedOption: SelectInputOption) => void;
    onToggleShared: () => void;
    savedChartModel: GenericChartModel;
    selectedType: ChartTypeInfo;
    shared: boolean;
}

const ChartTypeQueryForm: FC<ChartTypeQueryFormProps> = memo(props => {
    const {
        canShare,
        onNameChange,
        name,
        shared,
        onToggleShared,
        selectedType,
        fieldValues,
        model,
        onSelectFieldChange,
    } = props;

    const leftColFields = useMemo(() => {
        return selectedType.fields.filter(
            field => !RIGHT_COL_FIELDS.includes(field.name) && (selectedType.name !== 'bar_chart' || field.name !== 'y')
        );
    }, [selectedType]);
    const rightColFields = useMemo(() => {
        return selectedType.fields.filter(
            field => RIGHT_COL_FIELDS.includes(field.name) || (selectedType.name === 'bar_chart' && field.name === 'y')
        );
    }, [selectedType]);

    return (
        <div className="chart-builder-type-inputs">
            <div className="row">
                <div className="col-xs-4">
                    <label>Name *</label>
                    <input
                        className="form-control"
                        name="name"
                        placeholder="Enter a name"
                        type="text"
                        onChange={onNameChange}
                        value={name}
                    />
                    {canShare && (
                        <div className="checkbox-input">
                            <input name="shared" type="checkbox" checked={shared} onChange={onToggleShared} />
                            <span onClick={onToggleShared}>Make this chart available to all users</span>
                        </div>
                    )}
                </div>
                <div className="col-xs-4 fields-col">
                    {leftColFields.map(field => (
                        <div key={field.name}>
                            <label>
                                {field.label}
                                {field.required && ' *'}
                            </label>
                            <SelectInput
                                showLabel={false}
                                inputClass="col-xs-12"
                                placeholder="Select a field"
                                name={field.name}
                                options={getSelectOptions(model, selectedType, field)}
                                onChange={onSelectFieldChange}
                                value={fieldValues[field.name]?.value}
                            />
                        </div>
                    ))}
                </div>
                <div className="col-xs-4 fields-col">
                    {rightColFields.map(field => (
                        <Fragment key={field.name}>
                            <div>
                                <label>
                                    {field.label}
                                    {field.required && ' *'}
                                </label>
                                <SelectInput
                                    showLabel={false}
                                    inputClass="col-xs-12"
                                    placeholder="Select a field"
                                    name={field.name}
                                    options={getSelectOptions(model, selectedType, field)}
                                    onChange={onSelectFieldChange}
                                    value={fieldValues[field.name]?.value}
                                />
                            </div>
                            {selectedType.name === 'bar_chart' && fieldValues.y?.value && (
                                <div>
                                    <label>Y Axis Aggregate Method *</label>
                                    <SelectInput
                                        showLabel={false}
                                        clearable={false}
                                        inputClass="col-xs-12"
                                        placeholder="Select aggregate method"
                                        name={BAR_CHART_AGGREGATE_NAME}
                                        options={BAR_CHART_AGGREGATE_METHODS}
                                        onChange={onSelectFieldChange}
                                        value={fieldValues[BAR_CHART_AGGREGATE_NAME]?.value ?? 'SUM'}
                                    />
                                </div>
                            )}
                        </Fragment>
                    ))}
                </div>
            </div>
        </div>
    );
});

interface ChartPreviewProps {
    fieldValues: Record<string, SelectInputOption>;
    hasRequiredValues: boolean;
    model: QueryModel;
    savedChartModel: GenericChartModel;
    selectedType: ChartTypeInfo;
    setReportConfig: (config: SaveReportConfig) => void;
}

const ChartPreview: FC<ChartPreviewProps> = memo(props => {
    const { hasRequiredValues, model, selectedType, fieldValues, savedChartModel, setReportConfig } = props;
    const divId = useMemo(() => generateId('chart-'), []);
    const ref = useRef<HTMLDivElement>(undefined);
    const containerFilter = useMemo(() => getContainerFilter(model.containerPath), [model.containerPath]);
    const [loadingData, setLoadingData] = useState<boolean>(false);
    const [previewMsg, setPreviewMsg] = useState<string>();

    useEffect(() => {
        if (ref?.current) ref.current.innerHTML = '';
        setPreviewMsg(undefined);

        if (!hasRequiredValues) return;

        const width = ref?.current.getBoundingClientRect().width || 750;

        const chartConfig = getChartBuilderChartConfig(
            selectedType,
            fieldValues,
            savedChartModel?.visualizationConfig?.chartConfig
        );
        const queryConfig = getChartBuilderQueryConfig(
            model,
            fieldValues,
            chartConfig,
            savedChartModel?.visualizationConfig?.queryConfig
        );

        // add model filters, parameters, and containerFilter plus maxRows to the queryConfig for the preview, but not to save with the chart
        const queryConfig_ = {
            ...queryConfig,
            containerFilter,
            filterArray: [...model.loadRowsFilters(true)],
            parameters: model.queryParameters,
            maxRows: MAX_ROWS_PREVIEW,
        };

        setLoadingData(true);
        LABKEY_VIS.GenericChartHelper.queryChartData(divId, queryConfig_, measureStore => {
            const rowCount = LABKEY_VIS.GenericChartHelper.getMeasureStoreRecords(measureStore).length;
            const _previewMsg = getChartRenderMsg(chartConfig, rowCount, true);

            if (rowCount > MAX_POINT_DISPLAY) {
                if (chartConfig.renderType === 'box_plot') {
                    chartConfig.pointType = 'outliers';
                    chartConfig.geomOptions.boxFillColor = BLUE_HEX_COLOR;
                } else if (chartConfig.renderType === 'line_plot') {
                    chartConfig.geomOptions.hideDataPoints = true;
                }
            }

            // adjust height, width, and marginTop for the chart config for the preview, but not to save with the chart
            var chartConfig_ = {
                ...chartConfig,
                height: 350,
                width,
            };
            if (!savedChartModel || savedChartModel.visualizationConfig.chartConfig.geomOptions.marginTop === 20) {
                chartConfig_.geomOptions.marginTop = 10;
            }

            if (ref?.current) ref.current.innerHTML = ''; // clear again, right before render
            LABKEY_VIS.GenericChartHelper.generateChartSVG(divId, chartConfig_, measureStore);

            setPreviewMsg(_previewMsg);
            setLoadingData(false);
            setReportConfig({
                schemaName: queryConfig.schemaName,
                queryName: queryConfig.queryName,
                viewName: queryConfig.viewName,
                renderType: chartConfig.renderType,
                jsonData: {
                    chartConfig,
                    queryConfig: {
                        ...queryConfig,
                        filterArray: queryConfig.filterArray.map(f => ({
                            name: f['name'] ?? f.getColumnName(),
                            value: f['value'] ?? f.getValue(),
                            type: f['type'] ?? f.getFilterType().getURLSuffix(),
                        })),
                    },
                },
            });
        });
    }, [divId, model, hasRequiredValues, selectedType, fieldValues, savedChartModel, containerFilter, setReportConfig]);

    return (
        <>
            <label>Preview</label>
            {previewMsg && <span className="chart-builder-preview-msg gray-text pull-right">{previewMsg}</span>}
            {!hasRequiredValues && <div className="gray-text">Select required fields to preview the chart.</div>}
            {hasRequiredValues && (
                <div className="chart-builder-preview-body">
                    {loadingData && (
                        <div className="chart-loading-mask">
                            <div className="chart-loading-mask__background" />
                            <LoadingSpinner wrapperClassName="loading-spinner" msg="Loading Preview..." />
                        </div>
                    )}
                    <div className="svg-chart__chart" id={divId} ref={ref} />
                </div>
            )}
        </>
    );
});

interface ChartBuilderFooterProps {
    afterDelete: () => void;
    disabled: boolean;
    onCancel: () => void;
    onSaveChart: () => void;
    savedChartModel: GenericChartModel;
    saving: boolean;
    setError: (error: string) => void;
}

const ChartBuilderFooter: FC<ChartBuilderFooterProps> = memo(props => {
    const { savedChartModel, onSaveChart, onCancel, setError, afterDelete, saving, disabled } = props;
    const [deleting, setDeleting] = useState<boolean>(false);
    const [showConfirmDelete, setShowConfirmDelete] = useState<boolean>(false);

    const onCancel_ = useCallback(() => {
        onCancel();
    }, [onCancel]);

    const onDeleteChart = useCallback(() => {
        setShowConfirmDelete(true);
    }, []);

    const onCancelDelete = useCallback(() => {
        setShowConfirmDelete(false);
        setError(undefined);
    }, [setError]);

    const onConfirmDelete = useCallback(async () => {
        setDeleting(true);
        setError(undefined);
        try {
            await deleteChart(savedChartModel.id);
            setDeleting(false);
            afterDelete();
        } catch (e) {
            setError(e.exception ?? e);
            setDeleting(false);
        }
    }, [savedChartModel, setError, afterDelete]);

    if (showConfirmDelete) {
        return (
            <div className="form-buttons">
                <div className="form-buttons__left" />
                <div className="form-buttons__right">
                    Are you sure you want to permanently delete this chart?
                    <button className="btn btn-default" onClick={onCancelDelete} type="button" disabled={deleting}>
                        Cancel
                    </button>
                    <button className="btn btn-danger" onClick={onConfirmDelete} type="button" disabled={deleting}>
                        {deleting ? 'Deleting...' : 'Delete'}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <FormButtons sticky={false}>
            <button className="btn btn-default" onClick={onCancel_} type="button">
                Cancel
            </button>
            {savedChartModel?.canDelete && (
                <button className="btn btn-danger" onClick={onDeleteChart} type="button">
                    Delete Chart
                </button>
            )}
            <button className="btn btn-success" onClick={onSaveChart} type="button" disabled={saving || disabled}>
                {saving
                    ? savedChartModel
                        ? 'Saving Chart...'
                        : 'Creating Chart...'
                    : savedChartModel
                      ? 'Save Chart'
                      : 'Create Chart'}
            </button>
        </FormButtons>
    );
});

interface ChartBuilderModalProps extends RequiresModelAndActions {
    onHide: (successMsg?: string) => void;
    savedChartModel?: GenericChartModel;
}

export const ChartBuilderModal: FC<ChartBuilderModalProps> = memo(({ actions, model, onHide, savedChartModel }) => {
    const CHART_TYPES = LABKEY_VIS?.GenericChartHelper.getRenderTypes();
    const { user } = useServerContext();
    const canShare = useMemo(
        () => savedChartModel?.canShare ?? hasPermissions(user, [PermissionTypes.ShareReportPermission]),
        [savedChartModel, user]
    );
    const chartTypes: ChartTypeInfo[] = useMemo(
        () => CHART_TYPES.filter(type => !type.hidden && !HIDDEN_CHART_TYPES.includes(type.name)),
        [CHART_TYPES]
    );
    const [saving, setSaving] = useState<boolean>(false);
    const [error, setError] = useState<string>();
    const [reportConfig, setReportConfig] = useState<SaveReportConfig>();
    const [selectedType, setSelectedChartType] = useState<ChartTypeInfo>(chartTypes[0]);
    const [name, setName] = useState<string>('');
    const [shared, setShared] = useState<boolean>(canShare);
    const [fieldValues, setFieldValues] = useState<Record<string, SelectInputOption>>({});

    useEffect(
        () => {
            if (savedChartModel) {
                setSelectedChartType(
                    chartTypes.find(c => savedChartModel?.visualizationConfig.chartConfig.renderType === c.name)
                );
                setName(savedChartModel.name);
                setShared(savedChartModel.shared);

                const measures = savedChartModel.visualizationConfig?.chartConfig?.measures || {};
                const fieldValues_ = Object.keys(measures).reduce((result, key) => {
                    let measure = measures[key];
                    if (measure) {
                        // Currently only supporting a single measure per axis (i.e. not supporting y-axis left/right)
                        if (Utils.isArray(measure)) measure = measure[0];
                        result[key] = { label: measure.label, value: measure.name, data: measure };
                    }
                    return result;
                }, {});

                // special case for the bar chart aggregate method
                if (measures.y?.aggregate) {
                    fieldValues_[BAR_CHART_AGGREGATE_NAME] = { ...measures.y.aggregate };
                }

                setFieldValues(fieldValues_);
            }
        },
        [
            /* on mount only */
        ]
    );

    const hasName = useMemo(() => name?.trim().length > 0, [name]);
    const hasRequiredValues = useMemo(() => {
        return selectedType.fields.find(field => field.required && !fieldValues[field.name]) === undefined;
    }, [selectedType, fieldValues]);

    const onChartTypeChange = useCallback(
        e => {
            // don't allow changing chart type for a saved report
            if (savedChartModel) return;

            const selectedName = e.target.getAttribute('data-name') ?? e.target.parentElement.getAttribute('data-name');
            setSelectedChartType(chartTypes.find(type => type.name === selectedName) || chartTypes[0]);
            setFieldValues({});
        },
        [chartTypes, savedChartModel]
    );

    const onNameChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        setName(event.target.value);
    }, []);

    const onToggleShared = useCallback(() => {
        setShared(prev => !prev);
    }, []);

    const onSelectFieldChange = useCallback((key: string, _, selectedOption: SelectInputOption) => {
        setReportConfig(undefined); // clear report config state, it will be reset after the preview loads
        setFieldValues(prev => ({ ...prev, [key]: selectedOption }));
    }, []);

    const onSaveChart = useCallback(async () => {
        const _reportConfig = {
            ...reportConfig,
            reportId: savedChartModel?.reportId,
            name: name?.trim(),
            public: shared,
        } as SaveReportConfig;

        setSaving(true);
        setError(undefined);
        try {
            const response = await saveChart(_reportConfig);
            setSaving(false);
            onHide(`Successfully ${savedChartModel ? 'updated' : 'created'} chart: ${_reportConfig.name}.`);

            // clear the selected report, if we are saving/updating it, so that it will refresh in ChartPanel.tsx
            await actions.selectReport(model.id, undefined);
            await actions.loadCharts(model.id);
            actions.selectReport(model.id, response.reportId);
        } catch (e) {
            setError(e.exception ?? e);
            setSaving(false);
        }
    }, [savedChartModel, reportConfig, name, shared, actions, model.id, onHide]);

    const afterDelete = useCallback(async () => {
        onHide('Successfully deleted chart: ' + savedChartModel.name + '.');
        await actions.selectReport(model.id, undefined);
        await actions.loadCharts(model.id);
    }, [actions, model.id, onHide, savedChartModel]);

    const onCancel = useCallback(() => {
        onHide();
    }, [onHide]);

    const footer = (
        <ChartBuilderFooter
            afterDelete={afterDelete}
            disabled={!hasName || !hasRequiredValues || !reportConfig}
            onCancel={onCancel}
            onSaveChart={onSaveChart}
            savedChartModel={savedChartModel}
            saving={saving}
            setError={setError}
        />
    );

    return (
        <Modal
            className="chart-builder-modal"
            onCancel={onCancel}
            title={savedChartModel ? 'Edit Chart' : 'Create Chart'}
            footer={footer}
        >
            {error && <Alert>{error}</Alert>}
            <div className="row">
                <div className="col-xs-1 col-left">
                    <ChartTypeSideBar
                        chartTypes={chartTypes}
                        onChange={onChartTypeChange}
                        selectedType={selectedType}
                        savedChartModel={savedChartModel}
                    />
                </div>
                <div className="col-xs-11 col-right">
                    <ChartTypeQueryForm
                        canShare={canShare}
                        fieldValues={fieldValues}
                        model={model}
                        name={name}
                        onNameChange={onNameChange}
                        onSelectFieldChange={onSelectFieldChange}
                        onToggleShared={onToggleShared}
                        savedChartModel={savedChartModel}
                        shared={shared}
                        selectedType={selectedType}
                    />
                    <div className="row margin-top">
                        <div className="col-xs-12">
                            <ChartPreview
                                savedChartModel={savedChartModel}
                                fieldValues={fieldValues}
                                model={model}
                                hasRequiredValues={hasRequiredValues}
                                selectedType={selectedType}
                                setReportConfig={setReportConfig}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    );
});
