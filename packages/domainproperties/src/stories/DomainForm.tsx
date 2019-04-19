/*
 * Copyright (c) 2019 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0
 */
import * as React from 'react'
import { storiesOf } from '@storybook/react'
import { boolean, number, text, withKnobs } from '@storybook/addon-knobs'

import DomainForm from "../components/DomainForm"
import { DomainDesign } from "../models";
import './stories.scss'

storiesOf("DomainForm", module)
    .addDecorator(withKnobs)
    .add("with empty domain", () => {
        const domain = new DomainDesign();

        return (
            <DomainForm domain={domain}/>
        )
    })
    .add("with knobs", () => {
        const domain = new DomainDesign({
            "domainId" : 3162,
            "name" : "Study",
            "domainURI" : "urn:lsid:labkey.com:Study.Project-556:Study",
            "description" : null,
            "container" : "E0EA3E55-3420-1035-8057-68FEA9BFB3A0",
            "fields" : [ {
                "propertyId" : 392739,
                "propertyURI" : "urn:lsid:labkey.com:Study.Project-556:Study#FieldText",
                "container" : "E0EA3E55-3420-1035-8057-68FEA9BFB3A0",
                "ontologyURI" : null,
                "name" : "FieldText",
                "description" : null,
                "rangeURI" : "http://www.w3.org/2001/XMLSchema#string",
                "conceptURI" : null,
                "label" : null,
                "searchTerms" : null,
                "semanticType" : null,
                "format" : null,
                "required" : true,
                "hidden" : false,
                "lookupContainer" : null,
                "lookupSchema" : null,
                "lookupQuery" : null,
                "defaultValueType" : null,
                "defaultValue" : null,
                "defaultDisplayValue" : "[none]",
                "mvEnabled" : false,
                "importAliases" : null,
                "shownInInsertView" : true,
                "shownInUpdateView" : true,
                "shownInDetailsView" : true,
                "measure" : false,
                "dimension" : false,
                "recommendedVariable" : false,
                "defaultScale" : "LINEAR",
                "facetingBehaviorType" : "AUTOMATIC",
                "scale" : 4000,
                "redactedText" : null,
                "conditionalFormats" : [ ],
                "typeEditable" : true,
                "preventReordering" : false,
                "disableEditing" : false,
                "propertyValidators" : [ {
                    "type" : "Length",
                    "name" : "Text Length",
                    "properties" : { },
                    "errorMessage" : null,
                    "description" : null,
                    "new" : true,
                    "rowId" : 203522,
                    "expression" : "~lte=4000"
                } ],
                "excludeFromShifting" : false,
                "URL" : null,
                "PHI" : "NotPHI"
            }, {
                "propertyId" : 392740,
                "propertyURI" : "urn:lsid:labkey.com:Study.Project-556:Study#FieldInteger",
                "container" : "E0EA3E55-3420-1035-8057-68FEA9BFB3A0",
                "ontologyURI" : null,
                "name" : "FieldInteger",
                "description" : null,
                "rangeURI" : "http://www.w3.org/2001/XMLSchema#int",
                "conceptURI" : null,
                "label" : null,
                "searchTerms" : null,
                "semanticType" : null,
                "format" : null,
                "required" : false,
                "hidden" : false,
                "lookupContainer" : null,
                "lookupSchema" : null,
                "lookupQuery" : null,
                "defaultValueType" : null,
                "defaultValue" : null,
                "defaultDisplayValue" : "[none]",
                "mvEnabled" : false,
                "importAliases" : null,
                "shownInInsertView" : true,
                "shownInUpdateView" : true,
                "shownInDetailsView" : true,
                "measure" : true,
                "dimension" : false,
                "recommendedVariable" : false,
                "defaultScale" : "LINEAR",
                "facetingBehaviorType" : "AUTOMATIC",
                "scale" : 4000,
                "redactedText" : null,
                "conditionalFormats" : [ ],
                "typeEditable" : true,
                "preventReordering" : false,
                "disableEditing" : false,
                "propertyValidators" : [ ],
                "excludeFromShifting" : false,
                "URL" : null,
                "PHI" : "NotPHI"
            }, {
                "propertyId" : 392741,
                "propertyURI" : "urn:lsid:labkey.com:Study.Project-556:Study#FieldDouble",
                "container" : "E0EA3E55-3420-1035-8057-68FEA9BFB3A0",
                "ontologyURI" : null,
                "name" : "FieldDouble",
                "description" : null,
                "rangeURI" : "http://www.w3.org/2001/XMLSchema#double",
                "conceptURI" : null,
                "label" : null,
                "searchTerms" : null,
                "semanticType" : null,
                "format" : null,
                "required" : true,
                "hidden" : false,
                "lookupContainer" : null,
                "lookupSchema" : null,
                "lookupQuery" : null,
                "defaultValueType" : null,
                "defaultValue" : null,
                "defaultDisplayValue" : "[none]",
                "mvEnabled" : false,
                "importAliases" : null,
                "shownInInsertView" : true,
                "shownInUpdateView" : true,
                "shownInDetailsView" : true,
                "measure" : true,
                "dimension" : false,
                "recommendedVariable" : false,
                "defaultScale" : "LINEAR",
                "facetingBehaviorType" : "AUTOMATIC",
                "scale" : 4000,
                "redactedText" : null,
                "conditionalFormats" : [ ],
                "typeEditable" : true,
                "preventReordering" : false,
                "disableEditing" : false,
                "propertyValidators" : [ ],
                "excludeFromShifting" : false,
                "URL" : null,
                "PHI" : "NotPHI"
            }, {
                "propertyId" : 392742,
                "propertyURI" : "urn:lsid:labkey.com:Study.Project-556:Study#FieldDate",
                "container" : "E0EA3E55-3420-1035-8057-68FEA9BFB3A0",
                "ontologyURI" : null,
                "name" : "FieldDate",
                "description" : null,
                "rangeURI" : "http://www.w3.org/2001/XMLSchema#dateTime",
                "conceptURI" : null,
                "label" : null,
                "searchTerms" : null,
                "semanticType" : null,
                "format" : null,
                "required" : false,
                "hidden" : false,
                "lookupContainer" : null,
                "lookupSchema" : null,
                "lookupQuery" : null,
                "defaultValueType" : null,
                "defaultValue" : null,
                "defaultDisplayValue" : "[none]",
                "mvEnabled" : false,
                "importAliases" : null,
                "shownInInsertView" : true,
                "shownInUpdateView" : true,
                "shownInDetailsView" : true,
                "measure" : false,
                "dimension" : false,
                "recommendedVariable" : false,
                "defaultScale" : "LINEAR",
                "facetingBehaviorType" : "AUTOMATIC",
                "scale" : 4000,
                "redactedText" : null,
                "conditionalFormats" : [ ],
                "typeEditable" : true,
                "preventReordering" : false,
                "disableEditing" : false,
                "propertyValidators" : [ ],
                "excludeFromShifting" : false,
                "URL" : null,
                "PHI" : "NotPHI"
            }, {
                "propertyId" : 392743,
                "propertyURI" : "urn:lsid:labkey.com:Study.Project-556:Study#FieldMultiLine",
                "container" : "E0EA3E55-3420-1035-8057-68FEA9BFB3A0",
                "ontologyURI" : null,
                "name" : "FieldMultiLine",
                "description" : null,
                "rangeURI" : "http://www.w3.org/2001/XMLSchema#multiLine",
                "conceptURI" : null,
                "label" : null,
                "searchTerms" : null,
                "semanticType" : null,
                "format" : null,
                "required" : false,
                "hidden" : false,
                "lookupContainer" : null,
                "lookupSchema" : null,
                "lookupQuery" : null,
                "defaultValueType" : null,
                "defaultValue" : null,
                "defaultDisplayValue" : "[none]",
                "mvEnabled" : false,
                "importAliases" : null,
                "shownInInsertView" : true,
                "shownInUpdateView" : true,
                "shownInDetailsView" : true,
                "measure" : false,
                "dimension" : false,
                "recommendedVariable" : false,
                "defaultScale" : "LINEAR",
                "facetingBehaviorType" : "AUTOMATIC",
                "scale" : 4000,
                "redactedText" : null,
                "conditionalFormats" : [ ],
                "typeEditable" : true,
                "preventReordering" : false,
                "disableEditing" : false,
                "propertyValidators" : [ ],
                "excludeFromShifting" : false,
                "URL" : null,
                "PHI" : "NotPHI"
            }, {
                "propertyId" : 392744,
                "propertyURI" : "urn:lsid:labkey.com:Study.Project-556:Study#FieldBoolean",
                "container" : "E0EA3E55-3420-1035-8057-68FEA9BFB3A0",
                "ontologyURI" : null,
                "name" : "FieldBoolean",
                "description" : null,
                "rangeURI" : "http://www.w3.org/2001/XMLSchema#boolean",
                "conceptURI" : null,
                "label" : null,
                "searchTerms" : null,
                "semanticType" : null,
                "format" : null,
                "required" : false,
                "hidden" : false,
                "lookupContainer" : null,
                "lookupSchema" : null,
                "lookupQuery" : null,
                "defaultValueType" : null,
                "defaultValue" : null,
                "defaultDisplayValue" : "[none]",
                "mvEnabled" : false,
                "importAliases" : null,
                "shownInInsertView" : true,
                "shownInUpdateView" : true,
                "shownInDetailsView" : true,
                "measure" : false,
                "dimension" : false,
                "recommendedVariable" : false,
                "defaultScale" : "LINEAR",
                "facetingBehaviorType" : "AUTOMATIC",
                "scale" : 4000,
                "redactedText" : null,
                "conditionalFormats" : [ ],
                "typeEditable" : true,
                "preventReordering" : false,
                "disableEditing" : false,
                "propertyValidators" : [ ],
                "excludeFromShifting" : false,
                "URL" : null,
                "PHI" : "NotPHI"
            } ],
            "indices" : [ ],
            "schemaName" : null,
            "queryName" : null,
            "templateDescription" : null
        });

        return (
            <DomainForm
                domain={domain}
                // onSubmit={}
                // onChange={}
            />
        )
    });