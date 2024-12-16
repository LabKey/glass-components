/*
 * Copyright (c) 2019 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
export const DOMAIN_FIELD_PREFIX = 'domainpropertiesrow';
export const DOMAIN_FIELD_NAME = 'name';
export const DOMAIN_FIELD_TYPE = 'type';
export const DOMAIN_FIELD_ADV = 'adv';
export const DOMAIN_FIELD_EXPAND = 'expand';
export const DOMAIN_FIELD_DELETE = 'delete';
export const DOMAIN_FIELD_ROW = 'row';
export const DOMAIN_FIELD_REQUIRED = 'required';
export const DOMAIN_FIELD_SELECTED = 'selected';
export const DOMAIN_FIELD_DETAILS = 'details';
export const DOMAIN_FIELD_DESCRIPTION = 'description';
export const DOMAIN_FIELD_LABEL = 'label';
export const DOMAIN_FIELD_IMPORTALIASES = 'importAliases';
export const DOMAIN_FIELD_URL = 'URL';
export const DOMAIN_FIELD_LOOKUP_CONTAINER = 'lookupContainer';
export const DOMAIN_FIELD_LOOKUP_QUERY = 'lookupQueryValue';
export const DOMAIN_FIELD_LOOKUP_SCHEMA = 'lookupSchema';
export const DOMAIN_FIELD_FORMAT = 'format';
export const DOMAIN_FIELD_FILE_DISPLAY = 'format';
export const DOMAIN_FIELD_DEFAULT_SCALE = 'defaultScale';
export const DOMAIN_FIELD_EXCLUDE_FROM_SHIFTING = 'excludeFromShifting';
export const DOMAIN_FIELD_MEASURE = 'measure';
export const DOMAIN_FIELD_DIMENSION = 'dimension';
export const DOMAIN_FIELD_HIDDEN = 'hidden';
export const DOMAIN_FIELD_MVENABLED = 'mvEnabled';
export const DOMAIN_FIELD_PHI = 'PHI';
export const DOMAIN_FIELD_UNIQUECONSTRAINT = 'uniqueConstraint';
export const DOMAIN_FIELD_RECOMMENDEDVARIABLE = 'recommendedVariable';
export const DOMAIN_FIELD_SHOWNINDETAILSVIEW = 'shownInDetailsView';
export const DOMAIN_FIELD_SHOWNININSERTVIEW = 'shownInInsertView';
export const DOMAIN_FIELD_SHOWNINUPDATESVIEW = 'shownInUpdateView';
export const DOMAIN_FIELD_CLIENT_SIDE_ERROR = 'error';
export const DOMAIN_FIELD_SAMPLE_TYPE = 'sampleTypeSelect';
export const DOMAIN_FIELD_DEFAULT_VALUE_TYPE = 'defaultValueType';
export const DOMAIN_FIELD_DEFAULT_VALUE = 'defaultValue';
export const DOMAIN_FIELD_DEFAULT_DISPLAY_VALUE = 'defaultDisplayValue';
export const DOMAIN_FIELD_ONTOLOGY_SOURCE = 'sourceOntology';
export const DOMAIN_FIELD_ONTOLOGY_SUBTREE_COL = 'conceptSubtree';
export const DOMAIN_FIELD_ONTOLOGY_LABEL_COL = 'conceptLabelColumn';
export const DOMAIN_FIELD_ONTOLOGY_IMPORT_COL = 'conceptImportColumn';
export const DOMAIN_FIELD_ONTOLOGY_PRINCIPAL_CONCEPT = 'principalConceptCode';
export const DOMAIN_FIELD_DERIVATION_DATA_SCOPE = 'derivationDataScope';
export const DOMAIN_FIELD_VALUE_EXPRESSION = 'valueExpression';

// TextFieldOptions
export const DOMAIN_FIELD_MAX_LENGTH = 'maxLength';
export const DOMAIN_FIELD_CUSTOM_LENGTH = 'customLength';
export const DOMAIN_FIELD_SCALE = 'scale';
export const DOMAIN_FIELD_SCANNABLE_OPTION = 'scannable';

export const DOMAIN_COND_FORMAT = 'conditionalFormat';
export const DOMAIN_REGEX_VALIDATOR = 'regexValidator';
export const DOMAIN_RANGE_VALIDATOR = 'rangeValidator';

export const DOMAIN_COND_FORMATS = 'conditionalFormats';
export const DOMAIN_REGEX_VALIDATORS = 'regexValidators';
export const DOMAIN_RANGE_VALIDATORS = 'rangeValidators';

export const DOMAIN_VALIDATOR_EXPRESSION = 'expression';
export const DOMAIN_VALIDATOR_DESCRIPTION = 'description';
export const DOMAIN_VALIDATOR_ERRORMESSAGE = 'errorMessage';
export const DOMAIN_VALIDATOR_FAILONMATCH = 'failOnMatch';
export const DOMAIN_VALIDATOR_NAME = 'name';
export const DOMAIN_VALIDATOR_REMOVE = 'removeValidator';
export const DOMAIN_VALIDATOR_LOOKUP = 'lookupValidator';
export const DOMAIN_VALIDATOR_TEXTCHOICE = 'textChoiceValidator';

export const DOMAIN_VALIDATOR_BOLD = 'bold';
export const DOMAIN_VALIDATOR_ITALIC = 'italic';
export const DOMAIN_VALIDATOR_STRIKETHROUGH = 'strikethrough';

export const DOMAIN_CONDITIONAL_FORMAT_PREFIX = 'format.column';
export const DOMAIN_CONDITION_FORMAT_TEXT_COLOR = 'textColor';
export const DOMAIN_CONDITION_FORMAT_BACKGROUND_COLOR = 'backgroundColor';

export const DOMAIN_FIRST_FILTER_TYPE = 'firstFilterType';
export const DOMAIN_FIRST_FILTER_VALUE = 'firstFilterValue';
export const DOMAIN_SECOND_FILTER_TYPE = 'secondFilterType';
export const DOMAIN_SECOND_FILTER_VALUE = 'secondFilterValue';

export const DOMAIN_FILTER_HASANYVALUE = 'HAS_ANY_VALUE';

export const DOMAIN_FIELD_NOT_LOCKED = 'NotLocked'; // not locked, can change all properties
export const DOMAIN_FIELD_PARTIALLY_LOCKED = 'PartiallyLocked'; // can't change name and type, for example, but can change other properties
export const DOMAIN_FIELD_FULLY_LOCKED = 'FullyLocked'; // can't change any properties
export const DOMAIN_FIELD_PRIMARY_KEY_LOCKED = 'PKLocked'; // can't change data type or required properties

export const SEVERITY_LEVEL_ERROR = 'Error';
export const SEVERITY_LEVEL_WARN = 'Warning';

// Default scale types
export const DEFAULT_SCALE_LINEAR = 'LINEAR';
export const DEFAULT_SCALE_LOG = 'LOG';

// Default scale types
export const FILE_DISPLAY_INLINE = 'inline';
export const FILE_DISPLAY_ATTACHMENT = 'attachment';

// URIs for data types
export const STRING_RANGE_URI = 'http://www.w3.org/2001/XMLSchema#string';
export const MULTILINE_RANGE_URI = 'http://www.w3.org/2001/XMLSchema#multiLine';
export const BOOLEAN_RANGE_URI = 'http://www.w3.org/2001/XMLSchema#boolean';
export const INT_RANGE_URI = 'http://www.w3.org/2001/XMLSchema#int';
export const DOUBLE_RANGE_URI = 'http://www.w3.org/2001/XMLSchema#double';
export const DATETIME_RANGE_URI = 'http://www.w3.org/2001/XMLSchema#dateTime';
export const FILELINK_RANGE_URI = 'http://cpas.fhcrc.org/exp/xml#fileLink';
export const ATTACHMENT_RANGE_URI = 'http://www.labkey.org/exp/xml#attachment';
export const USER_RANGE_URI = 'http://www.labkey.org/exp/xml#int';
export const BINARY_RANGE_URI = 'http://www.w3.org/2001/XMLSchema#binary';
export const DATE_RANGE_URI = 'http://www.w3.org/2001/XMLSchema#date';
export const DECIMAL_RANGE_URI = 'http://www.w3.org/2001/XMLSchema#decimal';
export const FLOAT_RANGE_URI = 'http://www.w3.org/2001/XMLSchema#float';
export const LONG_RANGE_URI = 'http://www.w3.org/2001/XMLSchema#long';
export const TIME_RANGE_URI = 'http://www.w3.org/2001/XMLSchema#time';
export const RANGE_URIS = {
    STRING: STRING_RANGE_URI,
    MULTILINE: MULTILINE_RANGE_URI,
    BOOLEAN: BOOLEAN_RANGE_URI,
    INT: INT_RANGE_URI,
    DOUBLE: DOUBLE_RANGE_URI,
    DATETIME: DATETIME_RANGE_URI,
    FILELINK: FILELINK_RANGE_URI,
    ATTACHMENT: ATTACHMENT_RANGE_URI,
    USER: USER_RANGE_URI,
    DATE: DATE_RANGE_URI,
    TIME: TIME_RANGE_URI,
};

export const STRING_CONVERT_URIS = [STRING_RANGE_URI, MULTILINE_RANGE_URI];
export const NUMBER_CONVERT_URIS = [DOUBLE_RANGE_URI, FLOAT_RANGE_URI, DECIMAL_RANGE_URI];
export const FILE_CONVERT_URIS = [FILELINK_RANGE_URI, ATTACHMENT_RANGE_URI];
export const DATETIME_CONVERT_URIS = [DATE_RANGE_URI, TIME_RANGE_URI, DATETIME_RANGE_URI];

export const FLAG_CONCEPT_URI = 'http://www.labkey.org/exp/xml#flag';
export const PARTICIPANTID_CONCEPT_URI = 'http://cpas.labkey.com/Study#ParticipantId';
export const VISITID_CONCEPT_URI = 'http://cpas.labkey.com/Study#VisitId';
export const SAMPLE_TYPE_CONCEPT_URI = 'http://www.labkey.org/exp/xml#sample';
export const CONCEPT_CODE_CONCEPT_URI = 'http://www.labkey.org/types#conceptCode';
export const STORAGE_UNIQUE_ID_CONCEPT_URI = 'http://www.labkey.org/types#storageUniqueId';
export const TEXT_CHOICE_CONCEPT_URI = 'http://www.labkey.org/types#textChoice';
export const CREATED_TIMESTAMP_CONCEPT_URI = 'http://www.labkey.org/types#createdTimestamp';
export const MODIFIED_TIMESTAMP_CONCEPT_URI = 'http://www.labkey.org/types#modifiedTimestamp';
export const SMILES_CONCEPT_URI = 'http://www.labkey.org/exp/xml#smiles';
export const AUTO_INT_CONCEPT_URI = 'http://www.labkey.org/types#autoInt';
export const CALCULATED_CONCEPT_URI = 'http://www.labkey.org/exp/xml#calculated';

export const UNLIMITED_TEXT_LENGTH = 2147483647; // Integer.MAX_VALUE
export const MAX_TEXT_LENGTH = 4000;

export const PHILEVEL_NOT_PHI = 'NotPHI';
export const PHILEVEL_LIMITED_PHI = 'Limited';
export const PHILEVEL_FULL_PHI = 'PHI';
export const PHILEVEL_RESTRICTED_PHI = 'Restricted';

export const ALL_SAMPLES_DISPLAY_TEXT = 'All Samples';

export const DOMAIN_PHI_LEVELS = [
    { label: 'Not PHI', value: PHILEVEL_NOT_PHI },
    { label: 'Limited PHI', value: PHILEVEL_LIMITED_PHI },
    { label: 'Full PHI', value: PHILEVEL_FULL_PHI },
    { label: 'Restricted PHI', value: PHILEVEL_RESTRICTED_PHI },
];

export const DOMAIN_EDITABLE_DEFAULT = 'FIXED_EDITABLE';
export const DOMAIN_NON_EDITABLE_DEFAULT = 'FIXED_NON_EDITABLE';
export const DOMAIN_LAST_ENTERED_DEFAULT = 'LAST_ENTERED';

export const DOMAIN_DEFAULT_TYPES = {
    [DOMAIN_EDITABLE_DEFAULT]: 'Editable default',
    [DOMAIN_NON_EDITABLE_DEFAULT]: 'Fixed value',
    [DOMAIN_LAST_ENTERED_DEFAULT]: 'Last entered',
};

export const FIELD_NAME_CHAR_WARNING_MSG = 'Field name contains special characters.';
export const FIELD_NAME_CHAR_WARNING_INFO =
    'SQL queries, R scripts, and other code are easiest to write when field ' +
    'names contain only a combination of letters, numbers, and underscores, and start with a letter or underscore. ' +
    'Exporting fields that abide by this format are also easier to work with in analysis applications such as SAS, ' +
    'SPSS, and MATLAB.';

export const FIELD_EMPTY_TEXT_CHOICE_WARNING_MSG = 'No text choice values defined.';
export const TEXT_CHOICE_PHI_NOTE =
    'Note: These text choice options are visible to all administrators, including those not granted any PHI reader role.';
export const FIELD_EMPTY_TEXT_CHOICE_WARNING_INFO =
    'This field is defined as a "Text Choice" field, but no values have been added. Expand the field and use the ' +
    '"Add Values" button to define the set of choices for this field.';

export const PROPERTIES_PANEL_ERROR_MSG = 'Contains errors or is missing required values.';
export const PREFIX_SUBSTITUTION_EXPRESSION = '${folderPrefix}'; // Must match FOLDER_PREFIX_EXPRESSION in platform/.../NameExpressionOptionService.java
export const PROPERTIES_PANEL_NAMING_PATTERN_WARNING_MSG = `Naming Pattern does not utilize the ID/Name prefix substitution token ${PREFIX_SUBSTITUTION_EXPRESSION}. The following prefix value will not be used`;

export const DEFAULT_DOMAIN_FORM_DISPLAY_OPTIONS = {
    hideRequired: false,
    hideValidators: false,
    isDragDisabled: false,
    hideTextOptions: false,
    phiLevelDisabled: false,
    hideAddFieldsButton: false,
    disableMvEnabled: false,
    hideImportData: false,
    hideFilePropertyType: false,
    hideStudyPropertyTypes: false,
    hideImportExport: false,
    hideConditionalFormatting: false,
};

export const DERIVATION_DATA_SCOPES = {
    CHILD_ONLY: 'ChildOnly',
    PARENT_ONLY: 'ParentOnly',
    ALL: 'All',
};

export const MAX_VALID_TEXT_CHOICES = 200;

export const LOOKUP_VALIDATOR_VALUES = { type: 'Lookup', name: 'Lookup Validator' };

export const DOMAIN_ERROR_ID = 'domain-error';
