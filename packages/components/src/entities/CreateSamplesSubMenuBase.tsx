import React, { FC, memo, useCallback, useMemo, useState } from 'react';
import { List } from 'immutable';
import { withRouter, WithRouterProps } from 'react-router';

import { SchemaQuery } from '../public/SchemaQuery';
import { QueryModel } from '../public/QueryModel/QueryModel';
import { MenuOption, SubMenu } from '../internal/components/menus/SubMenu';
import { AppURL } from '../internal/url/AppURL';
import { SOURCES_KEY } from '../internal/app/constants';
import { SCHEMAS } from '../internal/schemas';
import { getCrossFolderSelectionResult } from '../internal/components/entities/actions';

import { isSamplesSchema } from '../internal/components/samples/utils';
import {
    ALIQUOT_CREATION,
    CHILD_SAMPLE_CREATION,
    DERIVATIVE_CREATION,
    POOLED_SAMPLE_CREATION,
    SampleCreationType,
    SampleCreationTypeModel,
} from '../internal/components/samples/models';
import { MAX_EDITABLE_GRID_ROWS } from '../internal/constants';

import { setSnapshotSelections } from '../internal/actions';
import { LoadingSpinner } from '../internal/components/base/LoadingSpinner';
import { caseInsensitive } from '../internal/util/utils';

import { isProjectContainer } from '../internal/app/utils';

import { CrossFolderSelectionResult } from '../internal/components/entities/models';

import { EntityCrossProjectSelectionConfirmModal } from './EntityCrossProjectSelectionConfirmModal';

import { SampleCreationTypeModal } from './SampleCreationTypeModal';
import { getSampleWizardURL, SampleTypeWizardURLResolver } from './utils';

export interface CreateSamplesSubMenuBaseProps {
    allowPooledSamples?: boolean;
    currentProductId?: string;
    getOptions: (useOnClick: boolean, disabledMsg: string, itemActionFn: (key: string) => any) => List<MenuOption>;
    inlineItemsCount?: number;
    isSelectingSamples?: (schemaQuery: SchemaQuery) => boolean;
    maxParentPerSample: number;
    menuCurrentChoice?: string;
    menuText?: string;
    parentKey?: string;
    parentQueryModel?: QueryModel;
    parentType?: string;
    sampleWizardURL?: SampleTypeWizardURLResolver;
    selectedType?: SampleCreationType;
    selectionData?: Record<any, any>;
    selectionNoun?: string;
    selectionNounPlural?: string;
    skipCrossFolderCheck?: boolean;
    targetProductId?: string;
    useSelectionData?: boolean;
}

const CreateSamplesSubMenuBaseImpl: FC<CreateSamplesSubMenuBaseProps & WithRouterProps> = memo(props => {
    const {
        allowPooledSamples,
        menuCurrentChoice,
        menuText,
        parentType,
        parentKey,
        parentQueryModel,
        getOptions,
        maxParentPerSample,
        sampleWizardURL,
        isSelectingSamples,
        selectedType,
        inlineItemsCount,
        currentProductId,
        targetProductId,
        selectionNoun,
        selectionNounPlural,
        skipCrossFolderCheck,
        router,
        selectionData,
        useSelectionData,
    } = props;

    const [sampleCreationURL, setSampleCreationURL] = useState<string | AppURL>();
    const [selectedOption, setSelectedOption] = useState<string>();
    const [crossFolderSelectionResult, setCrossFolderSelectionResult] = useState<CrossFolderSelectionResult>();
    const selectionsAreSet = !useSelectionData || selectionData;
    const allowCrossFolderDerive = !isProjectContainer(); // Issue 46853: LKSM/LKB Projects: should allow derivation of samples within projects when parent/source is in Home
    const useSnapshotSelection = useMemo(() => {
        return parentQueryModel?.filterArray.length > 0;
    }, [parentQueryModel?.filterArray]);

    const selectionKey = useMemo(() => {
        if (!parentQueryModel?.hasSelections) return null;

        return parentQueryModel.selectionKey;
    }, [parentQueryModel?.hasSelections, parentQueryModel?.selectionKey]);

    const selectedQuantity = parentQueryModel ? parentQueryModel.selections?.size ?? 0 : 1;
    const schemaQuery = parentQueryModel?.schemaQuery;

    const selectingSampleParents = useMemo(() => {
        return isSelectingSamples
            ? isSelectingSamples(schemaQuery)
            : isSamplesSchema(schemaQuery) || schemaQuery?.schemaName === SCHEMAS.DATA_CLASSES.SCHEMA;
    }, [isSelectingSamples, schemaQuery]);

    let disabledMsg: string;
    if (selectedType === SampleCreationType.PooledSamples && selectedQuantity < 2) {
        disabledMsg = `Select two or more ${isSamplesSchema(schemaQuery) ? 'samples' : 'items'}.`;
    } else if (selectedQuantity === 0) {
        disabledMsg = `Select one or more ${isSamplesSchema(schemaQuery) ? 'samples' : 'items'}.`;
    } else if (selectedType === SampleCreationType.PooledSamples && selectedQuantity > maxParentPerSample) {
        disabledMsg = `At most ${maxParentPerSample} ${
            isSamplesSchema(schemaQuery) ? 'samples' : 'items'
        } can be selected for pooling.`;
    } else if (selectedQuantity > MAX_EDITABLE_GRID_ROWS) {
        disabledMsg = `At most ${MAX_EDITABLE_GRID_ROWS} ${
            isSamplesSchema(schemaQuery) ? 'samples' : 'items'
        } can be selected.`;
    }

    const useOnClick = parentKey !== undefined || (parentQueryModel && selectedQuantity > 0 && selectingSampleParents);

    const onSampleCreationMenuSelect = useCallback(
        (key: string) => {
            const appURL: string | AppURL = sampleWizardURL(
                key,
                parentKey,
                selectionKey,
                useSnapshotSelection,
                currentProductId,
                targetProductId
            );

            if (useOnClick) {
                setSelectedOption(key);
                setSampleCreationURL(appURL);
            } else {
                return appURL;
            }
        },
        [sampleWizardURL, useOnClick, parentKey, currentProductId, targetProductId, selectionKey, useSnapshotSelection]
    );

    const onSampleCreationMenuSelectOnClick = useCallback(
        async (key: string) => {
            // check cross folder selection
            if (
                parentQueryModel &&
                selectedQuantity > 0 &&
                selectingSampleParents &&
                !skipCrossFolderCheck &&
                !allowCrossFolderDerive
            ) {
                setCrossFolderSelectionResult(undefined);
                const dataType = parentQueryModel.schemaName === SCHEMAS.DATA_CLASSES.SCHEMA ? 'data' : 'sample';
                if (useSnapshotSelection) await setSnapshotSelections(selectionKey, [...parentQueryModel.selections]);
                const result = await getCrossFolderSelectionResult(parentQueryModel.id, dataType, useSnapshotSelection);

                if (result.crossFolderSelectionCount > 0) {
                    let verb = 'Create';
                    if (selectedType === SampleCreationType.PooledSamples) {
                        verb = 'Pool';
                    } else if (selectedType === SampleCreationType.Aliquots) {
                        verb = 'Aliquot';
                    } else if (selectedType === SampleCreationType.Derivatives) {
                        verb = 'Derive';
                    }

                    const totalSelectionCount = result.crossFolderSelectionCount + result.currentFolderSelectionCount;
                    setCrossFolderSelectionResult({
                        ...result,
                        title: 'Cannot ' + verb + (totalSelectionCount > 1 ? ' Samples' : ' Sample'),
                    });
                    return;
                }
            }

            return onSampleCreationMenuSelect(key);
        },
        [
            parentQueryModel,
            selectedQuantity,
            selectingSampleParents,
            skipCrossFolderCheck,
            allowCrossFolderDerive,
            onSampleCreationMenuSelect,
            useSnapshotSelection,
            selectionKey,
            selectedType,
        ]
    );

    const onCancel = useCallback(() => {
        setSampleCreationURL(undefined);
        setSelectedOption(undefined);
    }, []);

    const onSampleCreationSubmit = useCallback(
        async (creationType: SampleCreationType, numPerParent?: number) => {
            if (selectionData) {
                await setSnapshotSelections(
                    parentQueryModel.selectionKey,
                    Object.values(selectionData).map(row => caseInsensitive(row, 'RowId').value)
                );
            }
            if (sampleCreationURL instanceof AppURL) {
                router.push(sampleCreationURL.addParams({ creationType, numPerParent }).toString());
            } else {
                window.location.href = sampleCreationURL + `&creationType=${creationType}&numPerParent=${numPerParent}`;
            }
        },
        [router, sampleCreationURL, parentQueryModel?.selectionKey, selectionData]
    );

    const dismissCrossFolderError = useCallback(() => {
        setCrossFolderSelectionResult(undefined);
    }, []);

    const sampleOptions = [
        {
            ...DERIVATIVE_CREATION,
            selected: selectedType === SampleCreationType.Derivatives,
        } as SampleCreationTypeModel,
    ];
    if (selectedOption && selectedOption === menuCurrentChoice) {
        if (allowPooledSamples) {
            sampleOptions.push({
                ...POOLED_SAMPLE_CREATION,
                selected: selectedType === SampleCreationType.PooledSamples,
            });
        }
        sampleOptions.push({
            ...ALIQUOT_CREATION,
            selected: !selectedType || selectedType === SampleCreationType.Aliquots,
        });
    }

    let noun = 'Sample';
    let nounPlural = 'Samples';

    if (selectedOption?.toLowerCase() === SCHEMAS.SAMPLE_SETS.MIXTURE_BATCHES.queryName.toLowerCase()) {
        noun = 'Mixture Batch';
        nounPlural = 'Mixture Batches';
    } else if (selectedOption?.toLowerCase() === SCHEMAS.SAMPLE_SETS.RAW_MATERIALS.queryName.toLowerCase()) {
        noun = 'Raw Material';
        nounPlural = 'Raw Materials';
    }

    if (!selectionsAreSet) return <LoadingSpinner />;

    return (
        <>
            <SubMenu
                currentMenuChoice={menuCurrentChoice}
                extractCurrentMenuChoice={false}
                options={
                    getOptions
                        ? getOptions(
                              useOnClick,
                              disabledMsg,
                              disabledMsg
                                  ? undefined
                                  : useOnClick
                                  ? onSampleCreationMenuSelectOnClick
                                  : onSampleCreationMenuSelect
                          )
                        : undefined
                }
                text={menuText}
                inlineItemsCount={inlineItemsCount}
            />
            {sampleCreationURL && (
                <SampleCreationTypeModal
                    show={true}
                    showIcons={true}
                    parentCount={selectedQuantity}
                    options={parentType === SOURCES_KEY ? [CHILD_SAMPLE_CREATION] : sampleOptions}
                    onCancel={onCancel}
                    onSubmit={onSampleCreationSubmit}
                    selectionKey={useSelectionData ? undefined : selectionKey}
                    selectionData={selectionData}
                    noun={noun}
                    nounPlural={nounPlural}
                />
            )}
            {crossFolderSelectionResult && (
                <EntityCrossProjectSelectionConfirmModal
                    crossFolderSelectionCount={crossFolderSelectionResult.crossFolderSelectionCount}
                    currentFolderSelectionCount={crossFolderSelectionResult.currentFolderSelectionCount}
                    onDismiss={dismissCrossFolderError}
                    title={crossFolderSelectionResult.title}
                    noun={selectionNoun}
                    nounPlural={selectionNounPlural}
                />
            )}
        </>
    );
});

CreateSamplesSubMenuBaseImpl.defaultProps = {
    allowPooledSamples: true,
    menuText: 'Create Samples',
    sampleWizardURL: getSampleWizardURL,
    selectionNoun: 'sample',
    selectionNounPlural: 'samples',
};

export const CreateSamplesSubMenuBase = withRouter<CreateSamplesSubMenuBaseProps>(CreateSamplesSubMenuBaseImpl);
