import { SCHEMAS } from '../../schemas';

export const GENERAL_ASSAY_PROVIDER_NAME = 'General';

export const PLATE_METADATA_COLUMN = 'PlateMetadata';
export const PLATE_TEMPLATE_COLUMN = 'PlateTemplate';

// TODO make this an array
export const RUN_PROPERTIES_REQUIRED_COLUMNS = SCHEMAS.CBMB.concat(
    'Name',
    'RowId',
    'ReplacesRun',
    'ReplacedByRun',
    'DataOutputs',
    'DataOutputs/DataFileUrl',
    'Batch',
    'Folder',
    // Below Columns are required for us to render the WorkflowTask in EditableDetails components
    'WorkflowTask',
    'WorkflowTask/Run',
    'Protocol/RowId'
).toList();

