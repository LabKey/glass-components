import React, { FC, memo, ReactNode, useCallback, useEffect, useMemo, useState } from 'react';

import { OrderedMap } from 'immutable';

import { IParentAlias, IParentOption } from '../entities/models';
import { SCHEMAS } from '../../schemas';
import { AddEntityButton } from '../buttons/AddEntityButton';
import { generateId } from '../../util/utils';

import { PARENT_ALIAS_HELPER_TEXT } from '../../constants';

import { LabelHelpTip } from '../base/LabelHelpTip';

import { ParentAliasRow } from './ParentAliasRow';
import { DomainFieldLabel } from './DomainFieldLabel';

interface Props {
    addEntityHelp: ReactNode;
    dataClassAliasCaption?: string;
    dataClassParentageLabel?: string;
    dataClassTypeCaption?: string;
    hideRequiredCheck?: boolean;
    idPrefix: string;
    includeDataClass?: boolean;
    includeSampleSet?: boolean;
    onAddParentAlias: (id: string, newAlias: IParentAlias) => void;
    onParentAliasChange: (id: string, field: string, newValue: any) => void;
    onRemoveParentAlias: (id: string) => void;
    parentAliasHelpText?: string;
    parentAliases?: OrderedMap<string, IParentAlias>;
    parentOptions: IParentOption[];
    sampleAliasCaption?: string;
    sampleTypeCaption?: string;
    schema: string;
    showAddBtn?: boolean;
    updateDupeParentAliases?: (id: string) => void;
    useSeparateDataClassesAliasMenu?: boolean;
}

const sampleSetAliasFilterFn = (alias: IParentAlias): boolean => {
    return alias.parentValue?.schema === SCHEMAS.SAMPLE_SETS.SCHEMA;
};

const sampleSetOptionFilterFn = (option: IParentOption): boolean => {
    return option?.schema === SCHEMAS.SAMPLE_SETS.SCHEMA;
};

const dataClassAliasFilterFn = (alias: IParentAlias): boolean => {
    return alias.parentValue?.schema === SCHEMAS.DATA_CLASSES.SCHEMA;
};

export const dataClassOptionFilterFn = (option: IParentOption): boolean => {
    return option?.schema === SCHEMAS.DATA_CLASSES.SCHEMA;
};

export const DomainParentAliases: FC<Props> = memo(props => {
    const {
        parentAliases,
        parentOptions,
        updateDupeParentAliases,
        sampleAliasCaption,
        sampleTypeCaption,
        dataClassAliasCaption,
        dataClassTypeCaption,
        dataClassParentageLabel,
        onParentAliasChange,
        onRemoveParentAlias,
        includeSampleSet,
        includeDataClass,
        showAddBtn,
        idPrefix,
        onAddParentAlias,
        schema,
        parentAliasHelpText,
        useSeparateDataClassesAliasMenu,
        hideRequiredCheck,
    } = props;

    const [aliasCaption, setAliasCaption] = useState<string>();
    const [helpMsg, setHelpMsg] = useState<string>();
    const [parentTypeCaption, setParentTypeCaption] = useState<string>();
    const [filteredParentOptions, setFilteredParentOptions] = useState<IParentOption[]>();
    const [filteredParentAliases, setFilteredParentAliases] = useState<IParentAlias[]>();

    useEffect(() => {
        if (!parentAliases || !parentOptions) return;

        let filteredParentAliases = OrderedMap<string, IParentAlias>();
        let filteredParentOptions: IParentOption[] = [];
        let aliasCaption: string;
        let parentTypeCaption: string;
        let helpMsg: string;

        if (includeSampleSet && includeDataClass) {
            filteredParentAliases = parentAliases;
            filteredParentOptions = parentOptions;
        } else if (includeSampleSet) {
            filteredParentAliases = parentAliases.filter(sampleSetAliasFilterFn) as OrderedMap<string, IParentAlias>;
            filteredParentOptions = parentOptions.filter(sampleSetOptionFilterFn);
            aliasCaption = sampleAliasCaption;
            parentTypeCaption = sampleTypeCaption;
        } else if (includeDataClass) {
            filteredParentAliases = parentAliases.filter(dataClassAliasFilterFn) as OrderedMap<string, IParentAlias>;
            filteredParentOptions = parentOptions.filter(dataClassOptionFilterFn);
            aliasCaption = dataClassAliasCaption;
            parentTypeCaption = dataClassTypeCaption;

            helpMsg = parentAliasHelpText.replace(
                'parentage',
                dataClassParentageLabel ? dataClassParentageLabel : 'parentage'
            );
        }
        if (includeSampleSet && !(includeDataClass && useSeparateDataClassesAliasMenu)) {
            aliasCaption = 'Parent';
        }

        setAliasCaption(aliasCaption);
        setParentTypeCaption(parentTypeCaption);
        setHelpMsg(helpMsg);
        setFilteredParentOptions(filteredParentOptions);
        setFilteredParentAliases(filteredParentAliases?.valueSeq()?.toArray());
    }, [parentAliases, parentOptions]);

    const addParentAlias = useCallback(() => {
        // Generates a temporary id for add/delete of the import aliases
        const newId = generateId(idPrefix);

        const newParentAlias = {
            id: newId,
            alias: '',
            parentValue: { schema },
            ignoreAliasError: true,
            ignoreSelectError: true,
            isDupe: false,
        };

        onAddParentAlias(newId, newParentAlias);
    }, [idPrefix, onAddParentAlias, schema]);

    const getFilteredParentOptions = useCallback(
        (currentAlias: IParentAlias): IParentOption[] => {
            const exclude = [];
            const current = currentAlias?.parentValue?.value;
            filteredParentAliases?.forEach(usedAlias => {
                const used = usedAlias.parentValue.value;
                if (used && current !== used) exclude.push(used);
            });
            return filteredParentOptions?.filter(option => exclude.indexOf(option.value) === -1);
        },
        [filteredParentOptions, filteredParentAliases]
    );

    const hasMoreToAdd = useMemo(() => {
        const added = [];
        filteredParentAliases?.forEach(usedAlias => {
            added.push(usedAlias.parentValue.value);
        });

        return filteredParentOptions?.find(option => added.indexOf(option.value) === -1);
    }, [filteredParentOptions, filteredParentAliases]);

    return (
        <>
            {filteredParentAliases?.length > 0 && (
                <div className="bottom-padding">
                    <div className="row domain-floating-hdr">
                        <div className="col-xs-2">
                            <DomainFieldLabel label={aliasCaption + 's'} />
                        </div>
                        <div className="col-xs-10">
                            <div className="col-xs-4 bold-text">{aliasCaption} Type *</div>
                            <div className="col-xs-4 bold-text">
                                File Import Column Name *
                                <LabelHelpTip title={aliasCaption + ' alias'} required={true}>
                                    {helpMsg ?? PARENT_ALIAS_HELPER_TEXT}
                                </LabelHelpTip>
                            </div>
                            {!hideRequiredCheck && <div className="col-xs-2 bold-text">Required</div>}
                        </div>
                    </div>
                    {filteredParentAliases?.map(alias => (
                        <ParentAliasRow
                            key={alias.id}
                            id={alias.id}
                            parentAlias={alias}
                            parentOptions={getFilteredParentOptions(alias)}
                            onAliasChange={onParentAliasChange}
                            onRemove={onRemoveParentAlias}
                            updateDupeParentAliases={updateDupeParentAliases}
                            aliasCaption={aliasCaption + ' alias'}
                            parentTypeCaption={parentTypeCaption}
                            helpMsg={helpMsg}
                            hideRequiredCheck={hideRequiredCheck}
                        />
                    ))}
                </div>
            )}
            {showAddBtn && (
                <div className="row">
                    <div className="col-xs-2" />
                    <div className="col-xs-10">
                        <span>
                            <AddEntityButton
                                entity={'a ' + aliasCaption}
                                onClick={addParentAlias}
                                disabled={!hasMoreToAdd}
                            />
                        </span>
                    </div>
                </div>
            )}
        </>
    );
});
