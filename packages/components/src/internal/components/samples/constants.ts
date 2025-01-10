import { Filter } from '@labkey/api';

import { IDomainField } from '../domainproperties/models';

import { SAMPLE_TYPE } from '../domainproperties/PropDescType';

import { FindField } from './models';

export enum ALIQUOT_FILTER_MODE {
    aliquots = 'aliquots',
    all = 'all',
    none = 'none',
    samples = 'samples', // when using grid filter with 'is blank'
}

export enum SELECTION_KEY_TYPE {
    inventoryItems = 'inventoryItems',
    snapshot = 'snapshot',
}

export const FIND_BY_IDS_QUERY_PARAM = 'findByIdsKey';

export const UNIQUE_ID_FIND_FIELD: FindField = {
    nounSingular: 'Barcode',
    nounPlural: 'Barcodes',
    name: 'uniqueIds',
    helpTextTitle: 'Barcode Fields',
    helpText:
        'The ids provided will be matched against all Unique ID fields or any fields marked as Barcodes as defined in your sample types.',
    label: 'Barcodes',
    storageKeyPrefix: 'u:',
};
export const SAMPLE_ID_FIND_FIELD: FindField = {
    nounSingular: 'Sample ID',
    nounPlural: 'Sample IDs',
    name: 'sampleIds',
    label: 'Sample IDs',
    storageKeyPrefix: 's:',
};

export const IS_ALIQUOT_COL = 'IsAliquot';

export const SAMPLE_STATE_COLUMN_NAME = 'SampleState';
export const SAMPLE_STATE_TYPE_COLUMN_NAME = 'SampleState/StatusType';
export const SAMPLE_STATE_DESCRIPTION_COLUMN_NAME = 'SampleState/Description';
export const SAMPLE_STATE_COLOR_COLUMN_NAME = 'SampleState/Color';

export const SAMPLE_STATUS_REQUIRED_COLUMNS = [
    SAMPLE_STATE_COLUMN_NAME,
    SAMPLE_STATE_TYPE_COLUMN_NAME,
    SAMPLE_STATE_DESCRIPTION_COLUMN_NAME,
    SAMPLE_STATE_COLOR_COLUMN_NAME,
];

export enum SampleOperation {
    EditMetadata,
    EditLineage,
    AddToStorage,
    UpdateStorageMetadata,
    RemoveFromStorage,
    AddToPicklist,
    Delete,
    AddToWorkflow,
    RemoveFromWorkflow,
    AddAssayData,
    LinkToStudy,
    RecallFromStudy,
    Move,
}

export enum SampleStateType {
    Available = 'Available',
    Consumed = 'Consumed',
    Locked = 'Locked',
}

export const permittedOps = {
    [SampleStateType.Available]: new Set(
        Object.keys(SampleOperation)
            .filter(val => !isNaN(parseInt(val)))
            .map(val => parseInt(val))
    ),
    [SampleStateType.Consumed]: new Set([
        SampleOperation.EditMetadata,
        SampleOperation.EditLineage,
        SampleOperation.RemoveFromStorage,
        SampleOperation.AddToPicklist,
        SampleOperation.Delete,
        SampleOperation.AddToWorkflow,
        SampleOperation.RemoveFromWorkflow,
        SampleOperation.AddAssayData,
        SampleOperation.LinkToStudy,
        SampleOperation.RecallFromStudy,
        SampleOperation.Move,
    ]),
    [SampleStateType.Locked]: new Set([SampleOperation.AddToPicklist]),
};

export const operationRestrictionMessage = {
    [SampleOperation.EditMetadata]: {
        all: 'updating of their data without also changing the status',
        singular: 'updating of its data',
        plural: 'updating of their data',
        recommendation: 'Either change the status here or remove these samples from your selection',
    },
    [SampleOperation.EditLineage]: {
        all: 'updating of their lineage',
        singular: 'updating of its lineage',
        plural: 'updating of their lineage',
    },
    [SampleOperation.AddToStorage]: {
        all: 'adding them to storage',
        singular: 'adding it to storage',
        plural: 'adding them to storage',
    },
    [SampleOperation.UpdateStorageMetadata]: {
        all: 'updating their storage data',
        singular: 'updating its storage data',
        plural: 'updating their storage data',
    },
    [SampleOperation.RemoveFromStorage]: {
        all: 'removing them from storage',
        singular: 'removing it from storage',
        plural: 'removing them from storage',
    },
    [SampleOperation.AddToPicklist]: {
        all: 'adding them to a picklist',
        singular: 'adding it to a picklist',
        plural: 'adding them to a picklist',
    },
    // [SampleOperation.Delete]: {
    //    Not needed because included from the server side response
    // },
    [SampleOperation.AddToWorkflow]: {
        all: 'adding them to a job',
        singular: 'adding it to a job',
        plural: 'adding them to a job',
    },
    [SampleOperation.RemoveFromWorkflow]: {
        all: 'removing them from a job',
        singular: 'removing it from a job',
        plural: 'removing them from a job',
    },
    [SampleOperation.AddAssayData]: {
        all: 'adding associated assay data',
        singular: 'adding associated assay data',
        plural: 'adding associated assay data',
    },
    // [SampleOperation.LinkToStudy]: {
    //    Not needed because check is done on LKS page
    // },
    // [SampleOperation.RecallFromStudy]: {
    //    Not needed because only possible from LKS
    // }
};

export const DEFAULT_SAMPLE_FIELD_CONFIG = {
    required: true,
    dataType: SAMPLE_TYPE,
    conceptURI: SAMPLE_TYPE.conceptURI,
    rangeURI: SAMPLE_TYPE.rangeURI,
    lookupSchema: 'exp',
    lookupQuery: 'Materials',
    lookupType: { ...SAMPLE_TYPE },
    name: 'SampleID',
    label: 'Sample ID',
} as Partial<IDomainField>;

export const ALIQUOTED_FROM_COL = 'AliquotedFrom';
const STATUS_COL = 'Status';

export const AMOUNT_AND_UNITS_COLUMNS = ['StoredAmount', 'Units'];

export const AMOUNT_AND_UNITS_COLUMNS_LC = AMOUNT_AND_UNITS_COLUMNS.map(col => col.toLowerCase());

export const SAMPLE_STORAGE_COLUMNS = [
    'StorageLocation',
    'StorageRow',
    'StorageCol',
    'StorageUnit',
    'StorageUnitLabel',
    'RawAmount',
    'RawUnits',
    'FreezeThawCount',
    'EnteredStorage',
    'CheckedOut',
    'CheckedOutBy',
    'StorageComment',
];

export const SAMPLE_STORAGE_COLUMNS_LC = SAMPLE_STORAGE_COLUMNS.map(col => col.toLowerCase());

export const SAMPLE_STORAGE_COLUMNS_WITH_SUBSELECT_EXPR = [
    'SourceProtocolLSID',
    'StorageStatus',
    'SampleTypeUnits',
    'FreezeThawCount',
    'CheckedOutBy',
    'StorageRow',
    'StorageCol',
    'CheckedOut',
    'StorageLocation',
];

export const SAMPLE_INSERT_EXTRA_COLUMNS = [...AMOUNT_AND_UNITS_COLUMNS, ...SAMPLE_STORAGE_COLUMNS, ALIQUOTED_FROM_COL];

// those lookup values are at Home project level, no need to reload on target folder change
export const SAMPLE_ALL_PROJECT_LOOKUP_FIELDS = ['SampleState', 'Units'];

export const SAMPLE_DATA_EXPORT_CONFIG = {
    'exportAlias.name': DEFAULT_SAMPLE_FIELD_CONFIG.label,
    'exportAlias.aliquotedFromLSID': ALIQUOTED_FROM_COL,
    'exportAlias.aliquotedFromLSID/name': ALIQUOTED_FROM_COL,
    'exportAlias.sampleState': STATUS_COL,
    'exportAlias.storedAmount': 'Amount',
    'exportAlias.folder': 'Folder',
};

// Issue 46037: Some plate-based assays (e.g., NAB) create samples with a bogus 'Material' sample type, which should get excluded everywhere in the application
export const SAMPLES_WITH_TYPES_FILTER = Filter.create('SampleSet', 'Material', Filter.Types.NEQ);

export const SAMPLE_DOMAIN_DEFAULT_SYSTEM_FIELDS = [
    {
        Name: 'Name',
        Label: 'Sample ID',
        DataType: 'Text',
        Required: true,
        // For user clarity, below text differs intentionally from schema browser
        Description: 'Unique ID generated from the Naming Pattern or Aliquot Naming Pattern',
        Disableble: false,
    },
    {
        Name: 'SampleState',
        Label: 'Status',
        DataType: 'Integer',
        Required: false,
        Description: 'Represents the status of the sample',
        Disableble: false,
    },
    {
        Name: 'Description',
        Label: 'Description',
        DataType: 'Text',
        Required: false,
        Description: 'Contains a Description for this sample',
        Disableble: true,
    },
    {
        Name: 'MaterialExpDate',
        Label: 'Expiration Date',
        DataType: 'DateTime',
        Required: false,
        Description: 'The date that this sample expires on',
        Disableble: true,
    },
    {
        Name: 'StoredAmount',
        Label: 'Amount',
        DataType: 'Decimal (floating point)',
        Required: false,
        Description: 'The amount of this sample',
        Disableble: true,
    },
    {
        Name: 'Units',
        Label: 'Units',
        DataType: 'Text',
        Required: false,
        Description: 'The units associated with the Amount value for this sample',
        Disableble: true,
    },
    {
        Name: 'AliquotCount',
        Label: 'Aliquots Created Count',
        DataType: 'Integer',
        Required: false,
        Description: '',
        Disableble: true,
    },
];

export const SAMPLE_DOMAIN_INVENTORY_SYSTEM_FIELDS = [
    {
        Name: 'FreezeThawCount',
        Label: 'Freeze/Thaw Count',
        DataType: 'Integer',
        Required: false,
        Description: '',
        Disableble: true,
    },
    {
        Name: 'StorageLocation',
        Label: 'Storage Location',
        DataType: 'Text',
        Required: false,
        Description: '',
        Disableble: true,
    },
    { Name: 'StorageRow', Label: 'Storage Row', DataType: 'Text', Required: false, Description: '', Disableble: true },
    { Name: 'StorageCol', Label: 'Storage Col', DataType: 'Text', Required: false, Description: '', Disableble: true },
];

export const AMOUNT_PRECISION_ERROR_TEXT = 'Amount used is too precise for selected units.';

export const STORED_AMOUNT_FIELDS = {
    ROWID: 'RowId',
    AMOUNT: 'StoredAmount',
    UNITS: 'Units',
    RAW_AMOUNT: 'RawAmount',
    RAW_UNITS: 'RawUnits',
    FREEZE_THAW_COUNT: 'FreezeThawCount',
    AUDIT_COMMENT: 'auditUserComment',
};

export const SAMPLE_TYPE_NAME_EXPRESSION_TOPIC = 'sampleIDs#patterns';

export const DEFAULT_AVAILABLE_STATUS_COLOR = '#F0F8ED';
export const DEFAULT_CONSUMED_STATUS_COLOR = '#FCF8E3';
export const DEFAULT_LOCKED_STATUS_COLOR = '#FDE6E6';

export const SAMPLE_STATUS_COLORS = {
    [DEFAULT_LOCKED_STATUS_COLOR]: {
        color: '#BF3939',
        backgroundColor: DEFAULT_LOCKED_STATUS_COLOR,
    },
    '#FCEFE8': {
        color: '#B24712',
        backgroundColor: '#FCEFE8',
    },
    [DEFAULT_CONSUMED_STATUS_COLOR]: {
        color: '#8A6D3B',
        backgroundColor: DEFAULT_CONSUMED_STATUS_COLOR,
    },
    [DEFAULT_AVAILABLE_STATUS_COLOR]: {
        color: '#3C763D',
        backgroundColor: DEFAULT_AVAILABLE_STATUS_COLOR,
    },
    '#EBFDF8': {
        color: '#0A825E',
        backgroundColor: '#EBFDF8',
    },
    '#F1F9FC': {
        color: '#0088CC',
        backgroundColor: '#F1F9FC',
    },
    '#EBEBFD': {
        color: '#4242ED',
        backgroundColor: '#EBEBFD',
    },
    '#F7EBFD': {
        color: '#A234D9',
        backgroundColor: '#F7EBFD',
    },
    '#FDEBF7': {
        color: '#BF1F8A',
        backgroundColor: '#FDEBF7',
    },
    '#F5EEE9': {
        color: '#876444',
        backgroundColor: '#F5EEE9',
    },
    '#F7F7F7': {
        color: '#6B6B6B',
        backgroundColor: '#F7F7F7',
    },
    '#DEDEDE': {
        color: '#333333',
        backgroundColor: '#DEDEDE',
    },
    // second row
    '#F9B3B3': {
        color: '#BF3939',
        backgroundColor: '#FAEBCD',
    },
    '#FAD0BB': {
        color: '#B24712',
        backgroundColor: '#FAD0BB',
    },
    '#FAEBCC': {
        color: '#8A6D3B',
        backgroundColor: '#FAEBCC',
    },
    '#D6E9C6': {
        color: '#3C763D',
        backgroundColor: '#D6E9C6',
    },
    '#B7EDDD': {
        color: '#0A825E',
        backgroundColor: '#B7EDDD',
    },
    '#C9E6F2': {
        color: '#0088CC',
        backgroundColor: '#C9E6F2',
    },
    '#C9C9F2': {
        color: '#4242ED',
        backgroundColor: '#C9C9F2',
    },
    '#E6C0F9': {
        color: '#A234D9',
        backgroundColor: '#E6C0F9',
    },
    '#F5BCE2': {
        color: '#BF1F8A',
        backgroundColor: '#F5BCE2',
    },
    '#DED5CC': {
        color: '#876444',
        backgroundColor: '#DED5CC',
    },
    '#E0E0E0': {
        color: '#6B6B6B',
        backgroundColor: '#E0E0E0',
    },
    '#C2C2C2': {
        color: '#333333',
        backgroundColor: '#C2C2C2',
    },
};
