import React, { ComponentType, FC, memo, useCallback, useEffect, useState } from 'react';

import { ActionURL, AuditBehaviorTypes } from '@labkey/api';

import { List } from 'immutable';

import { capitalizeFirstChar } from '../../util/utils';
import { EntityDataType } from '../entities/models';
import { Section } from '../base/Section';
import { SchemaQuery } from '../../../public/SchemaQuery';

import { SamplesTabbedGridPanel } from '../samples/SamplesTabbedGridPanel';
import { SAMPLE_DATA_EXPORT_CONFIG } from '../samples/constants';
import {
    InjectedQueryModels,
    RequiresModelAndActions,
    withQueryModels,
} from '../../../public/QueryModel/withQueryModels';
import { User } from '../base/models/User';
import { SamplesEditableGridProps } from '../samples/SamplesEditableGrid';

import { SamplesManageButtonSections } from '../samples/utils';
import { LoadingSpinner } from '../base/LoadingSpinner';

import { Alert } from '../base/Alert';
import { SampleGridButtonProps } from '../samples/models';
import { QueryConfig } from '../../../public/QueryModel/QueryModel';
import { invalidateQueryDetailsCache } from '../../query/api';
import { getPrimaryAppProperties } from '../../app/utils';

import { removeFinderGridView, saveFinderGridView } from './actions';
import { FilterCards } from './FilterCards';
import {
    getFieldFilterKey,
    getFinderStartText,
    getFinderViewColumnsConfig,
    getSampleFinderQueryConfigs,
    searchFiltersFromJson,
    searchFiltersToJson
} from './utils';
import { EntityFieldFilterModal } from './EntityFieldFilterModal';

import {FieldFilter, FilterProps} from "./models";

const SAMPLE_FINDER_TITLE = 'Find Samples';
const SAMPLE_FINDER_CAPTION = 'Find samples that meet all the criteria defined below';

interface SampleFinderSamplesGridProps {
    user: User;
    getSampleAuditBehaviorType: () => AuditBehaviorTypes;
    samplesEditableGridProps: Partial<SamplesEditableGridProps>;
    excludedCreateMenuKeys?: string[];
    gridButtons?: ComponentType<SampleGridButtonProps & RequiresModelAndActions>;
    gridButtonProps?: any;
    sampleTypeNames: string[];
}

interface Props extends SampleFinderSamplesGridProps {
    parentEntityDataTypes: EntityDataType[];
}

interface SampleFinderHeaderProps {
    parentEntityDataTypes: EntityDataType[];
    onAddEntity: (entityType: EntityDataType) => void;
}

export const SampleFinderHeaderButtons: FC<SampleFinderHeaderProps> = memo(props => {
    const { parentEntityDataTypes, onAddEntity } = props;

    return (
        <div>
            Find by:
            {parentEntityDataTypes.map(parentEntityType => (
                <button
                    key={parentEntityType.nounSingular}
                    className="btn btn-default margin-left"
                    onClick={() => {
                        onAddEntity(parentEntityType);
                    }}
                >
                    <i className="fa fa-plus-circle container--addition-icon" />{' '}
                    {capitalizeFirstChar(parentEntityType.nounAsParentSingular)} Properties
                </button>
            ))}
        </div>
    );
});

function getLocalStorageKey(): string {
    return getPrimaryAppProperties().productId + ActionURL.getContainer() + '-SampleFinder';
}

export const SampleFinderSection: FC<Props> = memo(props => {
    const { sampleTypeNames, parentEntityDataTypes, ...gridProps } = props;

    const [filterChangeCounter, setFilterChangeCounter] = useState<number>(0);
    const [chosenEntityType, setChosenEntityType] = useState<EntityDataType>(undefined);
    const [filters, setFilters] = useState<FilterProps[]>([]);
    const [filterExpandedStatusMap, setFilterExpandedStatusMap] = useState<{[key: string] : boolean }>({});

    useEffect(() => {
        const finderSessionDataStr = sessionStorage.getItem(getLocalStorageKey());
        if (finderSessionDataStr) {
            const finderSessionData = searchFiltersFromJson(finderSessionDataStr);
            if (finderSessionData.filters) {
                setFilters(finderSessionData.filters);
            }
            if (finderSessionData.filterChangeCounter !== undefined) {
                setFilterChangeCounter(finderSessionData.filterChangeCounter);
            }
        }
    }, []);

    const getSelectionKeyPrefix = (): string => {
        return 'sampleFinder-' + filterChangeCounter;
    };

    const updateFilters = (filterChangeCounter: number, filters: FilterProps[]) => {
        setFilters(filters);
        setFilterChangeCounter(filterChangeCounter);
        sessionStorage.setItem(
            getLocalStorageKey(),
            searchFiltersToJson(filters, filterChangeCounter)
        );
    };

    const onAddEntity = useCallback((entityType: EntityDataType) => {
        setChosenEntityType(entityType);
    }, []);

    const onFilterEdit = useCallback(
        (index: number) => {
            setChosenEntityType(parentEntityDataTypes[index]);
            // TODO update filters as well
            updateFilters(filterChangeCounter + 1, filters);
        },
        [parentEntityDataTypes, filterChangeCounter]
    );

    const onFilterDelete = useCallback(
        (index: number) => {
            const newFilterCards = [...filters];
            newFilterCards.splice(index, 1);

            updateFilters(filterChangeCounter + 1, newFilterCards);
        },
        [filters, filterChangeCounter]
    );

    const onFilterClose = () => {
        setChosenEntityType(undefined);
    };

    const onFind = useCallback(
        (schemaName: string, dataTypeFilters : {[key: string] : FieldFilter[]}) => {
            const newFilterCards = [...filters].filter(filter => {
                return filter.entityDataType.instanceSchemaName !== chosenEntityType.instanceSchemaName;
            });
            Object.keys(dataTypeFilters).forEach(queryName => {
                newFilterCards.push({
                    schemaQuery: SchemaQuery.create(schemaName, queryName),
                    filterArray: dataTypeFilters[queryName],
                    entityDataType: chosenEntityType
                });
            })

            onFilterClose();
            updateFilters(filterChangeCounter + 1, newFilterCards);
        },
        [filters, filterChangeCounter, onFilterEdit, onFilterDelete, chosenEntityType]
    );

    const toggleFieldFilterExpandStatus = useCallback((fieldFilter: FieldFilter, schemaQuery?: SchemaQuery) => {
        const fieldKey = getFieldFilterKey(fieldFilter, schemaQuery);
        const expanded = !!filterExpandedStatusMap?.[fieldKey];
        setFilterExpandedStatusMap({
            ...filterExpandedStatusMap,
            [fieldKey]: !expanded
        })

    }, [filterExpandedStatusMap]);

    return (
        <Section
            title={SAMPLE_FINDER_TITLE}
            caption={SAMPLE_FINDER_CAPTION}
            context={
                <SampleFinderHeaderButtons parentEntityDataTypes={parentEntityDataTypes} onAddEntity={onAddEntity} />
            }
        >
            {filters.length == 0 ? (
                <>
                    <FilterCards
                        className="empty"
                        cards={parentEntityDataTypes.map(entityDataType => ({
                            entityDataType,
                        }))}
                        onAddEntity={onAddEntity}
                    />
                    <div className="filter-hint">{getFinderStartText(parentEntityDataTypes)}</div>
                </>
            ) : (
                <>
                    <FilterCards
                        cards={filters}
                        onFilterDelete={onFilterDelete}
                        filterExpandedStatusMap={filterExpandedStatusMap}
                        toggleFieldFilterExpandStatus={toggleFieldFilterExpandStatus}
                        onAddEntity={onAddEntity}
                    />
                    <SampleFinderSamples
                        {...gridProps}
                        cards={filters}
                        sampleTypeNames={sampleTypeNames}
                        selectionKeyPrefix={getSelectionKeyPrefix()}
                        filterChangeCounter={filterChangeCounter}
                    />
                </>
            )}
            {chosenEntityType !== undefined && (
                <EntityFieldFilterModal onCancel={onFilterClose} cards={filters} entityDataType={chosenEntityType} onFind={onFind} />
            )}
        </Section>
    );
});

interface SampleFinderSamplesProps extends SampleFinderSamplesGridProps {
    cards: FilterProps[];
    filterChangeCounter: number;
    selectionKeyPrefix: string;
}

export const SampleFinderSamplesImpl: FC<SampleFinderSamplesGridProps & InjectedQueryModels> = memo(props => {
    const { actions, queryModels, gridButtons, excludedCreateMenuKeys } = props;
    const [isLoading, setIsLoading] = useState<boolean>(true);

    useEffect(() => {
        const allModelsLoaded = Object.values(queryModels).filter(model => model.isLoading).length == 0;
        if (allModelsLoaded && isLoading) {
            const promises = [];
            Object.values(queryModels).forEach(queryModel => {
                const { hasUpdates, columns } = getFinderViewColumnsConfig(queryModel);
                if (hasUpdates) {
                    promises.push(saveFinderGridView(queryModel.schemaQuery, columns));
                }
            });
            Promise.all(promises)
                .then(schemaQueries => {
                    // since we have updated views, we need to invalidate the details cache so we pick up the new views
                    schemaQueries.forEach(schemaQuery => {
                        invalidateQueryDetailsCache(schemaQuery);
                    });
                    setIsLoading(false);
                })
                .catch(reason => {
                    console.error('Error saving all finder views.', reason);
                    setIsLoading(false);
                });
        }
    }, [queryModels]);

    useEffect(() => {
        return () => {
            if (queryModels) {
                for (const queryModel of Object.values(queryModels)) {
                    (async () => {
                        try {
                            await removeFinderGridView(queryModel);
                        } catch (error) {
                            // ignore; already logged
                        }
                    })();
                }
            }
        };
    }, []);

    if (isLoading) return <LoadingSpinner />;

    return (
        <>
            <SamplesTabbedGridPanel
                {...props}
                withTitle={false}
                asPanel={false}
                actions={actions}
                queryModels={queryModels}
                excludedCreateMenuKeys={List<string>(excludedCreateMenuKeys)}
                gridButtons={gridButtons}
                gridButtonProps={{
                    excludedManageMenuKeys: [SamplesManageButtonSections.IMPORT],
                    excludeStartJob: true,
                }}
                tabbedGridPanelProps={{
                    alwaysShowTabs: true,
                    advancedExportOptions: SAMPLE_DATA_EXPORT_CONFIG,
                }}
            />
        </>
    );
});

const SampleFinderSamplesWithQueryModels = withQueryModels<SampleFinderSamplesGridProps>(SampleFinderSamplesImpl);

const SampleFinderSamples: FC<SampleFinderSamplesProps> = memo(props => {
    const { cards, sampleTypeNames, selectionKeyPrefix, user, ...gridProps } = props;
    const [queryConfigs, setQueryConfigs] = useState<{ [key: string]: QueryConfig }>(undefined);
    const [errors, setErrors] = useState<string>(undefined);

    useEffect(() => {
        setQueryConfigs(undefined);
        const configs = getSampleFinderQueryConfigs(user, sampleTypeNames, cards, selectionKeyPrefix);
        const promises = [];
        for (const config of Object.values(configs)) {
            promises.push(saveFinderGridView(config.schemaQuery, [{ fieldKey: 'Name' }]));
        }
        Promise.all(promises)
            .then(() => {
                setQueryConfigs(configs);
            })
            .catch(reason => {
                setErrors(reason);
            });
    }, [cards, user, sampleTypeNames, selectionKeyPrefix]);

    if (errors) return <Alert>{errors}</Alert>;

    if (!queryConfigs) return <LoadingSpinner />;

    return (
        <SampleFinderSamplesWithQueryModels
            sampleTypeNames={sampleTypeNames}
            key={selectionKeyPrefix}
            user={user}
            {...gridProps}
            autoLoad
            queryConfigs={queryConfigs}
        />
    );
});
