import React, { FC, memo, useCallback, useMemo, useState } from 'react';
import { List } from 'immutable';

import {
    ALIQUOT_CREATION,
    App,
    AppURL,
    CHILD_SAMPLE_CREATION,
    DERIVATIVE_CREATION,
    MenuOption,
    POOLED_SAMPLE_CREATION,
    QueryGridModel,
    QueryModel,
    SampleCreationType,
    SampleCreationTypeModal,
    SchemaQuery,
    SubMenu,
} from '../../..';

interface CreateSamplesSubMenuProps {
    getOptions: (useOnClick: boolean, disabledMsg: string, itemActionFn: (key: string) => any) => List<MenuOption>;
    maxParentPerSample: number;
    isSelectingSamples: (schemaQuery: SchemaQuery) => boolean;
    navigate: (url: string | AppURL) => any;
    menuCurrentChoice?: string;
    menuText?: string;
    parentType?: string;
    parentKey?: string;
    parentModel?: QueryGridModel;
    parentQueryModel?: QueryModel;
    sampleWizardURL?: (targetSampleType?: string, parent?: string) => AppURL;
    getProductSampleWizardURL?: (targetSampleType?: string, parent?: string, selectionKey?: string) => string | AppURL;
    allowPooledSamples?: boolean;
    selectedItems?: Record<string, any>;
}

export const CreateSamplesSubMenuBase: FC<CreateSamplesSubMenuProps> = memo(props => {
    const {
        allowPooledSamples,
        menuCurrentChoice,
        menuText,
        parentType,
        parentKey,
        parentModel,
        parentQueryModel,
        navigate,
        getOptions,
        maxParentPerSample,
        sampleWizardURL,
        getProductSampleWizardURL,
        isSelectingSamples,
        selectedItems,
    } = props;

    const [sampleCreationURL, setSampleCreationURL] = useState<string | AppURL>();
    const [selectedOption, setSelectedOption] = useState<string>();

    const selectedQuantity = parentModel?.selectedQuantity ?? parentQueryModel?.selections.size ?? 1;

    const schemaQuery = parentModel ?
        SchemaQuery.create(parentModel.schema.toLowerCase(), parentModel.query)
        : parentQueryModel.schemaQuery;

    const selectingSampleParents = useMemo(() => {
        return isSelectingSamples(schemaQuery);
    }, [isSelectingSamples, schemaQuery]);

    let disabledMsg: string;
    if (selectedQuantity > maxParentPerSample) {
        disabledMsg = `At most ${maxParentPerSample} ${selectingSampleParents ? 'samples' : 'items'} can be selected`;
    }

    const useOnClick = parentKey !== undefined || (selectingSampleParents && selectedQuantity > 0);

    const selectionKey = useMemo(() => {
        let selectionKey: string = null;
        if ((parentModel?.allowSelection && parentModel.selectedIds.size > 0) || parentQueryModel?.hasSelections) {
            selectionKey = parentModel?.getId() || parentQueryModel?.id;
        }
        return selectionKey;
    }, [parentModel, parentQueryModel]);

    const onSampleCreationMenuSelect = useCallback(
        (key: string) => {
            let appURL: string | AppURL;

            if (sampleWizardURL) {
                appURL = sampleWizardURL(key, parentKey);
                if (selectionKey) appURL = appURL.addParam('selectionKey', selectionKey);
            } else if (getProductSampleWizardURL) {
                appURL = getProductSampleWizardURL(key, parentKey, selectionKey);
            }

            if (useOnClick) {
                setSelectedOption(key);
                setSampleCreationURL(appURL);
            } else {
                return appURL;
            }
        },
        [useOnClick, parentKey, selectionKey, setSampleCreationURL, setSelectedOption]
    );

    const onCancel = useCallback(() => {
        setSampleCreationURL(undefined);
        setSelectedOption(undefined);
    }, [setSampleCreationURL, setSelectedOption]);

    const onSampleCreationSubmit = useCallback(
        (creationType: SampleCreationType, numPerParent?: number) => {
            if (sampleCreationURL instanceof AppURL)
                navigate(sampleCreationURL.addParams({ creationType, numPerParent }));
            else {
                window.location.href = sampleCreationURL + `&creationType=${creationType}&numPerParent=${numPerParent}`;
            }
        },
        [navigate, sampleCreationURL]
    );

    const sampleOptions = [DERIVATIVE_CREATION];
    if (allowPooledSamples) sampleOptions.push(POOLED_SAMPLE_CREATION);
    if (selectedOption && selectedOption === menuCurrentChoice)
        sampleOptions.push({ ...ALIQUOT_CREATION, selected: true });

    return (
        <>
            <SubMenu
                currentMenuChoice={menuCurrentChoice}
                key={App.SAMPLES_KEY}
                options={
                    getOptions
                        ? getOptions(useOnClick, disabledMsg, disabledMsg ? undefined : onSampleCreationMenuSelect)
                        : undefined
                }
                text={menuText ?? 'Create Samples'}
            />
            {sampleCreationURL && (
                <SampleCreationTypeModal
                    show={true}
                    showIcons={true}
                    parentCount={selectedQuantity}
                    options={parentType === App.SOURCES_KEY ? [CHILD_SAMPLE_CREATION] : sampleOptions}
                    onCancel={onCancel}
                    onSubmit={onSampleCreationSubmit}
                    selectionKey={selectedItems ? undefined : selectionKey}
                    selectedItems={selectedItems}
                />
            )}
        </>
    );
});

CreateSamplesSubMenuBase.defaultProps = {
    allowPooledSamples: true,
};
