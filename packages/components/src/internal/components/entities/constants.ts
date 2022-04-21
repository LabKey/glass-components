import { List } from 'immutable';

import { SCHEMAS } from '../../schemas';

import { DELETE_SAMPLES_TOPIC } from '../../util/helpLinks';

import { SAMPLE_TYPE_KEY } from '../../app/constants';

import { SAMPLE_STORAGE_COLUMNS_WITH_SUBSELECT_EXPR } from '../samples/constants';

import { EntityDataType } from './models';

export const DATA_DELETE_CONFIRMATION_ACTION = 'getDataDeleteConfirmationData.api';
export const SAMPLE_DELETE_CONFIRMATION_ACTION = 'getMaterialOperationConfirmationData.api';
export const ENTITY_CREATION_METRIC = 'entityCreation';

export const SampleTypeDataType: EntityDataType = {
    typeListingSchemaQuery: SCHEMAS.EXP_TABLES.SAMPLE_SETS,
    listingSchemaQuery: SCHEMAS.EXP_TABLES.MATERIALS,
    instanceSchemaName: SCHEMAS.SAMPLE_SETS.SCHEMA,
    appUrlPrefixParts: ['samples'],
    operationConfirmationActionName: SAMPLE_DELETE_CONFIRMATION_ACTION,
    nounSingular: 'sample',
    nounPlural: 'samples',
    nounAsParentSingular: 'Parent',
    nounAsParentPlural: 'Parents',
    typeNounSingular: 'Sample Type',
    typeNounAsParentSingular: 'Parent Type',
    descriptionSingular: 'parent sample type',
    descriptionPlural: 'parent sample types',
    uniqueFieldKey: 'Name',
    dependencyText: 'derived sample or assay data dependencies',
    deleteHelpLinkTopic: DELETE_SAMPLES_TOPIC,
    inputColumnName: 'Inputs/Materials/First',
    ancestorColumnName: 'Ancestors/Samples',
    inputTypeValueField: 'lsid',
    insertColumnNamePrefix: 'MaterialInputs/',
    editTypeAppUrlPrefix: SAMPLE_TYPE_KEY,
    importFileAction: 'importSamples',
    filterCardHeaderClass: 'filter-card__header-success',
    exprColumnsWithSubSelect: SAMPLE_STORAGE_COLUMNS_WITH_SUBSELECT_EXPR,
};

export const DataClassDataType: EntityDataType = {
    typeListingSchemaQuery: SCHEMAS.EXP_TABLES.DATA_CLASSES,
    listingSchemaQuery: SCHEMAS.EXP_TABLES.DATA,
    instanceSchemaName: SCHEMAS.DATA_CLASSES.SCHEMA,
    operationConfirmationActionName: DATA_DELETE_CONFIRMATION_ACTION,
    nounSingular: 'data',
    nounPlural: 'data',
    typeNounSingular: 'Data Type',
    typeNounAsParentSingular: 'Data Type',
    nounAsParentPlural: 'Data Types',
    nounAsParentSingular: 'Parent',
    descriptionSingular: 'parent type',
    descriptionPlural: 'parent types',
    uniqueFieldKey: 'Name',
    dependencyText: 'derived sample dependencies',
    deleteHelpLinkTopic: 'dataClass', // no topic specific to deleting data classes yet, so we refer to data classes in general
    inputColumnName: 'Inputs/Data/First',
    ancestorColumnName: 'Ancestors/OtherData',
    inputTypeValueField: 'rowId',
    insertColumnNamePrefix: 'DataInputs/',
    importFileAction: 'importData',
    filterCardHeaderClass: 'filter-card__header-primary',
};

export const ParentEntityLineageColumns = List.of('Inputs/Materials/First', 'Inputs/Data/First');

export const ParentEntityRequiredColumns = SCHEMAS.CBMB.concat(
    'LSID',
    'Name',
    'Folder',
    'RowId',
    'Description',
    'AliquotedFromLSID/Name',
    'RootMaterialLSID',
    'RootMaterialLSID/Name',
    'RootMaterialLSID/Description'
).concat(ParentEntityLineageColumns);
