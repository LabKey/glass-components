import React from 'react';

export const CHART_MEASURES_AND_DIMENSIONS_TOPIC = "chartTrouble";
export const MISSING_VALUES_TOPIC = "manageMissing";
export const PROPERTY_FIELDS_PHI_TOPIC = "propertyFields#phi";
export const ADVANCED_PROPERTY_FIELDS_TOPIC =  "propertyFields#advanced";

export const FIELD_EDITOR_TOPIC = "fieldEditor";
export const ADVANCED_FIELD_EDITOR_TOPIC = FIELD_EDITOR_TOPIC + "#advanced";
export const FIELD_EDITOR_RANGE_VALIDATION_TOPIC = FIELD_EDITOR_TOPIC + "#range";
export const FIELD_EDITOR_REGEX_TOPIC = FIELD_EDITOR_TOPIC + "#regex";
export const FIELD_EDITOR_CONDITIONAL_FORMAT_TOPIC = FIELD_EDITOR_TOPIC + "#conditional";
export const FIELD_EDITOR_SAMPLE_TYPES_TOPIC = FIELD_EDITOR_TOPIC + "#samp";
export const DATE_FORMATS_TOPIC = 'dateFormats#date';
export const NUMBER_FORMATS_TOPIC = 'dateFormats#number';

export const ASSAY_EDIT_PLATE_TEMPLATE_TOPIC = 'editPlateTemplate';
export const CONFIGURE_SCRIPTING_TOPIC =  "configureScripting";
export const PROGRAMMATIC_QC_TOPIC = "programmaticQC";
export const DEFINE_ASSAY_SCHEMA_TOPIC = "defineAssaySchema";
export const DEFINE_DATA_CLASS_TOPIC = "dataClass";

export const DELETE_SAMPLES_TOPIC = "viewSampleSets#delete";
export const DERIVE_SAMPLES_TOPIC = 'deriveSamples';
export const DERIVE_SAMPLES_ALIAS_TOPIC = DERIVE_SAMPLES_TOPIC + '#alias';
// export const DERIVE_SAMPLES_GRAPH_TOPIC = DERIVE_SAMPLES_TOPIC + '#graph';
// export const DERIVE_SAMPLES_GRID_TOPIC = DERIVE_SAMPLES_TOPIC + '#grid';

export const URL_ENCODING_TOPIC = 'urlEncoding';

export const SEARCH_SYNTAX_TOPIC = "luceneSearch";
export const DATA_IMPORT_TOPIC = 'dataImport';

export function getHelpLink(topic: string) {
    return LABKEY.helpLinkPrefix + topic;
}

export function helpLinkNode(topic: string, text: React.ReactNode, className?: string): React.ReactNode {
    return (
        <a target="_blank" href={getHelpLink(topic)} className={className}>{text}</a>
    );
}
