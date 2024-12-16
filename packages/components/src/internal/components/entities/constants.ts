import { List } from 'immutable';

import { SCHEMAS } from '../../schemas';

import { DELETE_ASSAY_RUNS_TOPIC, DELETE_SAMPLES_TOPIC } from '../../util/helpLinks';

import { SAMPLE_TYPE_KEY, SAMPLES_KEY } from '../../app/constants';

import { SAMPLE_STORAGE_COLUMNS_WITH_SUBSELECT_EXPR } from '../samples/constants';

import { SchemaQuery } from '../../../public/SchemaQuery';

import { SAMPLE_PROPERTY_ALL_SAMPLE_TYPE } from '../search/constants';

import { EntityDataType } from './models';
import { sampleDeleteDependencyText } from './utils';
import { Query, QueryKey } from '@labkey/api';

const DATA_OPERATION_CONFIRMATION_ACTION = 'getDataOperationConfirmationData.api';
const SAMPLE_OPERATION_CONFIRMATION_ACTION = 'getMaterialOperationConfirmationData.api';
const ASSAY_RUN_OPERATION_CONFIRMATION_ACTION = 'getAssayRunOperationConfirmationData.api';
const ASSAY_RESULTS_OPERATION_CONFIRMATION_ACTION = 'getAssayResultsOperationConfirmationData.api';

export const AssayRunDataType: EntityDataType = {
    deleteHelpLinkTopic: DELETE_ASSAY_RUNS_TOPIC,
    typeListingSchemaQuery: SCHEMAS.ASSAY_TABLES.ASSAY_LIST,
    listingSchemaQuery: SCHEMAS.EXP_TABLES.ASSAY_RUNS,
    instanceSchemaName: SCHEMAS.ASSAY_TABLES.SCHEMA,
    operationConfirmationControllerName: 'assay',
    operationConfirmationActionName: ASSAY_RUN_OPERATION_CONFIRMATION_ACTION,
    nounSingular: 'run',
    nounPlural: 'runs',
    typeNounSingular: 'Assay Design',
    typeNounAsParentSingular: 'Assay Design',
    nounAsParentPlural: 'Assay Runs',
    nounAsParentSingular: 'Assay Run',
    descriptionSingular: 'assay run',
    descriptionPlural: 'assay runs',
    uniqueFieldKey: 'RowId',
    dependencyText: undefined,
    folderConfigurableDataType: 'AssayDesign',
};

export const AssayResultDataType: EntityDataType = {
    deleteHelpLinkTopic: undefined,
    typeListingSchemaQuery: SCHEMAS.ASSAY_TABLES.ASSAY_LIST,
    listingSchemaQuery: undefined,
    instanceSchemaName: undefined,
    supportHasNoValueInQuery: true,
    getInstanceSchemaQuery: (assayNameEncoded: string) => {
        return new SchemaQuery('assay.General.' + QueryKey.encodePart(assayNameEncoded), 'data');
    },
    getInstanceDataType: (schemaQuery: SchemaQuery) => {
        return QueryKey.decodePart(schemaQuery.schemaName.replace('assay.General.', ''));
    },
    operationConfirmationControllerName: 'assay',
    operationConfirmationActionName: ASSAY_RESULTS_OPERATION_CONFIRMATION_ACTION,
    nounSingular: 'result',
    nounPlural: 'results',
    typeNounSingular: 'Assay Design',
    typeNounAsParentSingular: 'Assay Design',
    nounAsParentPlural: 'Assays', // use short label for Sample Finder
    nounAsParentSingular: 'Assay',
    descriptionSingular: 'assay result',
    descriptionPlural: 'assay results',
    uniqueFieldKey: 'RowId',
    dependencyText: undefined,
    filterCardHeaderClass: 'filter-card__header-purple',
    sampleFinderCardType: 'assaydata',
    folderConfigurableDataType: 'AssayDesign',
};

export enum AssayRunOperation {
    Delete,
    Edit,
    Move,
}

export const SamplePropertyDataType: EntityDataType = {
    allowSingleParentTypeFilter: true,
    allowRelativeDateFilter: true,
    typeListingSchemaQuery: SCHEMAS.EXP_TABLES.SAMPLE_SETS,
    listingSchemaQuery: undefined,
    instanceSchemaName: undefined,
    getInstanceSchemaQuery: (queryName: string) => {
        if (queryName === SAMPLE_PROPERTY_ALL_SAMPLE_TYPE.query) return SCHEMAS.EXP_TABLES.MATERIALS;
        return new SchemaQuery('samples', queryName);
    },
    getInstanceDataType: (schemaQuery: SchemaQuery, altQueryName?: string) => {
        return altQueryName ?? schemaQuery.queryName;
    },
    operationConfirmationControllerName: 'experiment',
    operationConfirmationActionName: undefined,
    nounSingular: 'sample',
    nounPlural: 'samples',
    nounAsParentSingular: 'Sample',
    nounAsParentPlural: 'Samples',
    typeNounSingular: 'Sample Type',
    typeNounAsParentSingular: 'Sample Type',
    descriptionSingular: 'sample type',
    descriptionPlural: 'sample types',
    uniqueFieldKey: 'Name',
    dependencyText: undefined,
    deleteHelpLinkTopic: DELETE_SAMPLES_TOPIC,
    filterCardHeaderClass: 'filter-card__header-orange',
    sampleFinderCardType: 'sampleproperty',
    folderConfigurableDataType: 'SampleType',
};

export const SampleTypeDataType: EntityDataType = {
    typeListingSchemaQuery: SCHEMAS.EXP_TABLES.SAMPLE_SETS,
    listingSchemaQuery: SCHEMAS.EXP_TABLES.MATERIALS,
    instanceKey: SAMPLES_KEY,
    instanceSchemaName: SCHEMAS.SAMPLE_SETS.SCHEMA,
    appUrlPrefixParts: ['samples'],
    operationConfirmationControllerName: 'experiment',
    operationConfirmationActionName: SAMPLE_OPERATION_CONFIRMATION_ACTION,
    moveNoun: 'samples',
    nounSingular: 'sample',
    nounPlural: 'samples',
    nounAsParentSingular: 'Parent',
    nounAsParentPlural: 'Parents',
    typeNounSingular: 'Sample Type',
    typeNounAsParentSingular: 'Parent Type',
    descriptionSingular: 'parent sample type',
    descriptionPlural: 'parent sample types',
    uniqueFieldKey: 'Name',
    dependencyText: sampleDeleteDependencyText,
    deleteHelpLinkTopic: DELETE_SAMPLES_TOPIC,
    inputColumnName: 'Inputs/Materials/First',
    ancestorColumnName: 'Ancestors/Samples',
    inputTypeValueField: 'lsid',
    insertColumnNamePrefix: 'MaterialInputs/',
    editTypeAppUrlPrefix: SAMPLE_TYPE_KEY,
    importFileAction: 'importSamples',
    filterCardHeaderClass: 'filter-card__header-success',
    exprColumnsWithSubSelect: SAMPLE_STORAGE_COLUMNS_WITH_SUBSELECT_EXPR,
    typeIcon: 'sample_set',
    sampleFinderCardType: 'sampleparent',
    supportsCrossTypeImport: true,
    folderConfigurableDataType: 'SampleType',
    labelColorCol: 'labelcolor',
};

export const SampleParentDataType = {
    ...SampleTypeDataType,
    nounPlural: 'Parents',
    nounSingular: 'Parent',
    containerFilter: Query.containerFilter.currentPlusProjectAndShared,
};

export const DataClassDataType: EntityDataType = {
    typeListingSchemaQuery: SCHEMAS.EXP_TABLES.DATA_CLASSES,
    listingSchemaQuery: SCHEMAS.EXP_TABLES.DATA,
    instanceSchemaName: SCHEMAS.DATA_CLASSES.SCHEMA,
    operationConfirmationControllerName: 'experiment',
    operationConfirmationActionName: DATA_OPERATION_CONFIRMATION_ACTION,
    moveNoun: 'sources',
    nounSingular: 'Source',
    nounPlural: 'Sources',
    nounAsParentSingular: 'Source',
    nounAsParentPlural: 'Sources',
    typeNounSingular: 'Source Type',
    typeNounAsParentSingular: 'Source Type',
    descriptionSingular: 'parent type',
    descriptionPlural: 'parent types',
    uniqueFieldKey: 'Name',
    dependencyText: 'derived data or sample dependencies',
    deleteHelpLinkTopic: 'dataClass#prevent',
    inputColumnName: 'Inputs/Data/First',
    ancestorColumnName: 'Ancestors/OtherData',
    inputTypeValueField: 'rowId',
    insertColumnNamePrefix: 'DataInputs/',
    importFileAction: 'importData',
    filterCardHeaderClass: 'filter-card__header-primary',
    typeIcon: 'source_type',
    sampleFinderCardType: 'dataclassparent',
    folderConfigurableDataType: 'DataClass',
};

export const ParentEntityLineageColumns = List.of('Inputs/Materials/First', 'Inputs/Data/First');

export const ParentEntityRequiredColumns = SCHEMAS.CBMB.concat(
    'LSID',
    'Name',
    'Folder',
    'RowId',
    'Description',
    'AliquotedFromLSID/Name',
    'RootMaterialRowId',
    'RootMaterialRowId/Name',
    'RootMaterialRowId/Description'
).concat(ParentEntityLineageColumns);

export enum DataOperation {
    Edit,
    EditLineage,
    Delete,
    Move,
}

export const SAMPLE_SET_IMPORT_PREFIX = 'materialInputs/';
export const DATA_CLASS_IMPORT_PREFIX = 'dataInputs/';
