import React, {FC, memo, ReactNode, useCallback, useEffect, useMemo, useState} from "react";
import {ParentAliasRow} from "./ParentAliasRow";
import {Map, OrderedMap} from "immutable";
import {IParentAlias, IParentOption} from "../entities/models";
import {PARENT_ALIAS_HELPER_TEXT} from "../../constants";
import {SCHEMAS} from "../../schemas";
import {Col, Row} from "react-bootstrap";
import {AddEntityButton} from "../buttons/AddEntityButton";
import {generateId} from "../../util/utils";

interface Props {
    parentAliases?: OrderedMap<string, IParentAlias>,
    parentOptions: IParentOption[];
    updateDupeParentAliases?: (id: string) => void;
    sampleAliasCaption?: string;
    sampleTypeCaption?: string;
    dataClassAliasCaption?: string;
    dataClassTypeCaption?: string;
    dataClassParentageLabel?: string;
    onParentAliasChange: (id: string, field: string, newValue: any) => void;
    onRemoveParentAlias: (id: string) => void;
    includeSampleSet?: boolean;
    includeDataClass?: boolean;
    showAddBtn?: boolean;
    idPrefix: string;
    onAddParentAlias: (id: string, newAlias: IParentAlias) => void;
    schema: string;
    addEntityHelp: ReactNode;
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
        addEntityHelp
    } = props;

    const [aliasCaption, setAliasCaption] = useState<string>(undefined);
    const [helpMsg, setHelpMsg] = useState<string>(undefined);
    const [parentTypeCaption, setParentTypeCaption] = useState<string>(undefined);
    const [filteredParentOptions, setFilteredParentOptions] = useState<IParentOption[]>(undefined);
    const [filteredParentAliases, setFilteredParentAliases] = useState<IParentAlias[]>(undefined);

    useEffect(() => {
        if (!parentAliases || !parentOptions) return;

        let filteredParentAliases = OrderedMap<string, IParentAlias>();
        let filteredParentOptions = [];
        let aliasCaption;
        let parentTypeCaption;

        let helpMsg;
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

            helpMsg = PARENT_ALIAS_HELPER_TEXT.replace('parentage', dataClassParentageLabel);
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

    return (<>
        {filteredParentAliases?.map((alias) => (
            <ParentAliasRow
                key={alias.id}
                id={alias.id}
                parentAlias={alias}
                parentOptions={filteredParentOptions}
                onAliasChange={onParentAliasChange}
                onRemove={onRemoveParentAlias}
                updateDupeParentAliases={updateDupeParentAliases}
                aliasCaption={aliasCaption}
                parentTypeCaption={parentTypeCaption}
                helpMsg={helpMsg}
            />
        ))}
        {showAddBtn && (
            <Row>
                <Col xs={2} />
                <Col xs={10}>
                            <span>
                                <AddEntityButton
                                    entity={aliasCaption}
                                    onClick={() => addParentAlias()}
                                    helperBody={addEntityHelp}
                                />
                            </span>
                </Col>
            </Row>
        )}
    </>);
});
