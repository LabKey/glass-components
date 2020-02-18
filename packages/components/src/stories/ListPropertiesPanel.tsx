import React from 'react';
import { storiesOf } from '@storybook/react';
import { boolean, withKnobs } from '@storybook/addon-knobs';
import { Record } from 'immutable';

import { ListModel } from '../components/domainproperties/models';
import { ListPropertiesPanel } from '../components/domainproperties/list/ListPropertiesPanel';
import {ListDesignerPanels} from '../components/domainproperties/list/ListDesignerPanels';

import './stories.scss';
import {AdvancedSettings} from "../components/domainproperties/list/ListPropertiesAdvancedSettings";


const json = {
    "domainDesign" : {
        "domainId" : 2280,
        "name" : "NIMHDemographics",
        "domainURI" : "urn:lsid:labkey.com:IntList.Folder-950:NIMHDemographics",
        "description" : null,
        "container" : "ea23d322-acd6-1037-8e6d-25f311da6f8b",
        "allowFileLinkProperties" : false,
        "allowAttachmentProperties" : true,
        "allowFlagProperties" : true,
        "showDefaultValueSettings" : true,
        "defaultDefaultValueType" : "FIXED_EDITABLE",
        "defaultValueOptions" : [ "FIXED_EDITABLE", "LAST_ENTERED" ],
        "fields" : [ {
            "propertyId" : 26820,
            "propertyURI" : "urn:lsid:labkey.com:IntList.Folder-950:NIMHDemographics.SubjectID",
            "container" : "ea23d322-acd6-1037-8e6d-25f311da6f8b",
            "ontologyURI" : null,
            "name" : "SubjectID",
            "description" : null,
            "rangeURI" : "http://www.w3.org/2001/XMLSchema#int",
            "conceptURI" : null,
            "label" : "Subject ID",
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
            "scale" : 10,
            "redactedText" : null,
            "isPrimaryKey" : true,
            "lockType" : "PartiallyLocked",
            "conditionalFormats" : [ ],
            "excludeFromShifting" : false,
            "propertyValidators" : [ ],
            "typeEditable" : true,
            "preventReordering" : false,
            "disableEditing" : false,
            "URL" : null,
            "PHI" : "NotPHI"
        }, {
            "propertyId" : 26821,
            "propertyURI" : "urn:lsid:labkey.com:IntList.Folder-950:NIMHDemographics.Name",
            "container" : "ea23d322-acd6-1037-8e6d-25f311da6f8b",
            "ontologyURI" : null,
            "name" : "Name",
            "description" : null,
            "rangeURI" : "http://www.w3.org/2001/XMLSchema#string",
            "conceptURI" : null,
            "label" : "Name",
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
            "isPrimaryKey" : false,
            "lockType" : "NotLocked",
            "conditionalFormats" : [ ],
            "excludeFromShifting" : false,
            "propertyValidators" : [ {
                "type" : "Length",
                "name" : "Text Length",
                "properties" : { },
                "errorMessage" : null,
                "description" : null,
                "rowId" : 14802,
                "new" : true,
                "expression" : "~lte=4000"
            } ],
            "typeEditable" : true,
            "preventReordering" : false,
            "disableEditing" : false,
            "URL" : null,
            "PHI" : "NotPHI"
        }, {
            "propertyId" : 26822,
            "propertyURI" : "urn:lsid:labkey.com:IntList.Folder-950:NIMHDemographics.Family",
            "container" : "ea23d322-acd6-1037-8e6d-25f311da6f8b",
            "ontologyURI" : null,
            "name" : "Family",
            "description" : null,
            "rangeURI" : "http://www.w3.org/2001/XMLSchema#string",
            "conceptURI" : null,
            "label" : "Family",
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
            "isPrimaryKey" : false,
            "lockType" : "NotLocked",
            "conditionalFormats" : [ ],
            "excludeFromShifting" : false,
            "propertyValidators" : [ {
                "type" : "Length",
                "name" : "Text Length",
                "properties" : { },
                "errorMessage" : null,
                "description" : null,
                "rowId" : 14803,
                "new" : true,
                "expression" : "~lte=4000"
            } ],
            "typeEditable" : true,
            "preventReordering" : false,
            "disableEditing" : false,
            "URL" : null,
            "PHI" : "NotPHI"
        }, {
            "propertyId" : 26823,
            "propertyURI" : "urn:lsid:labkey.com:IntList.Folder-950:NIMHDemographics.Mother",
            "container" : "ea23d322-acd6-1037-8e6d-25f311da6f8b",
            "ontologyURI" : null,
            "name" : "Motherss",
            "description" : null,
            "rangeURI" : "http://www.w3.org/2001/XMLSchema#string",
            "conceptURI" : null,
            "label" : "Mother'",
            "searchTerms" : null,
            "semanticType" : null,
            "format" : null,
            "required" : false,
            "hidden" : false,
            "lookupContainer" : null,
            "lookupSchema" : "lists",
            "lookupQuery" : "NIMHDemographics",
            "defaultValueType" : null,
            "defaultValue" : null,
            "defaultDisplayValue" : "[none]",
            "mvEnabled" : false,
            "importAliases" : null,
            "shownInInsertView" : true,
            "shownInUpdateView" : true,
            "shownInDetailsView" : true,
            "measure" : false,
            "dimension" : true,
            "recommendedVariable" : false,
            "defaultScale" : "LINEAR",
            "facetingBehaviorType" : "AUTOMATIC",
            "scale" : 4000,
            "redactedText" : null,
            "isPrimaryKey" : false,
            "lockType" : "NotLocked",
            "conditionalFormats" : [ ],
            "excludeFromShifting" : false,
            "propertyValidators" : [ {
                "type" : "Length",
                "name" : "Text Length",
                "properties" : { },
                "errorMessage" : null,
                "description" : null,
                "rowId" : 14804,
                "new" : true,
                "expression" : "~lte=4000"
            } ],
            "typeEditable" : true,
            "preventReordering" : false,
            "disableEditing" : false,
            "URL" : null,
            "PHI" : "NotPHI"
        }, {
            "propertyId" : 26824,
            "propertyURI" : "urn:lsid:labkey.com:IntList.Folder-950:NIMHDemographics.Father",
            "container" : "ea23d322-acd6-1037-8e6d-25f311da6f8b",
            "ontologyURI" : null,
            "name" : "Father",
            "description" : null,
            "rangeURI" : "http://www.w3.org/2001/XMLSchema#string",
            "conceptURI" : null,
            "label" : "Fathersdaf",
            "searchTerms" : null,
            "semanticType" : null,
            "format" : null,
            "required" : false,
            "hidden" : false,
            "lookupContainer" : null,
            "lookupSchema" : "lists",
            "lookupQuery" : "NIMHDemographics",
            "defaultValueType" : null,
            "defaultValue" : null,
            "defaultDisplayValue" : "[none]",
            "mvEnabled" : false,
            "importAliases" : null,
            "shownInInsertView" : true,
            "shownInUpdateView" : true,
            "shownInDetailsView" : true,
            "measure" : false,
            "dimension" : true,
            "recommendedVariable" : false,
            "defaultScale" : "LINEAR",
            "facetingBehaviorType" : "AUTOMATIC",
            "scale" : 4000,
            "redactedText" : null,
            "isPrimaryKey" : false,
            "lockType" : "NotLocked",
            "conditionalFormats" : [ ],
            "excludeFromShifting" : false,
            "propertyValidators" : [ {
                "type" : "Length",
                "name" : "Text Length",
                "properties" : { },
                "errorMessage" : null,
                "description" : null,
                "rowId" : 14805,
                "new" : true,
                "expression" : "~lte=4000"
            } ],
            "typeEditable" : true,
            "preventReordering" : false,
            "disableEditing" : false,
            "URL" : null,
            "PHI" : "NotPHI"
        }, {
            "propertyId" : 26825,
            "propertyURI" : "urn:lsid:labkey.com:IntList.Folder-950:NIMHDemographics.Species",
            "container" : "ea23d322-acd6-1037-8e6d-25f311da6f8b",
            "ontologyURI" : null,
            "name" : "Species",
            "description" : null,
            "rangeURI" : "http://www.w3.org/2001/XMLSchema#string",
            "conceptURI" : null,
            "label" : "Species",
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
            "isPrimaryKey" : false,
            "lockType" : "NotLocked",
            "conditionalFormats" : [ ],
            "excludeFromShifting" : false,
            "propertyValidators" : [ {
                "type" : "Length",
                "name" : "Text Length",
                "properties" : { },
                "errorMessage" : null,
                "description" : null,
                "rowId" : 14806,
                "new" : true,
                "expression" : "~lte=4000"
            } ],
            "typeEditable" : true,
            "preventReordering" : false,
            "disableEditing" : false,
            "URL" : "/list/grid.view?name=NIMHDemographics&query.Species~eq=${Species}",
            "PHI" : "NotPHI"
        }, {
            "propertyId" : 26826,
            "propertyURI" : "urn:lsid:labkey.com:IntList.Folder-950:NIMHDemographics.Image",
            "container" : "ea23d322-acd6-1037-8e6d-25f311da6f8b",
            "ontologyURI" : null,
            "name" : "Image",
            "description" : null,
            "rangeURI" : "http://www.labkey.org/exp/xml#attachment",
            "conceptURI" : null,
            "label" : "Image",
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
            "isPrimaryKey" : false,
            "lockType" : "NotLocked",
            "conditionalFormats" : [ ],
            "excludeFromShifting" : false,
            "propertyValidators" : [ ],
            "typeEditable" : true,
            "preventReordering" : false,
            "disableEditing" : false,
            "URL" : "https://www.labkey.org/files/home/Demos/ListDemo/sendFile.view?fileName=%40files%2F${SubjectID}.png&renderAs=IMAGE",
            "PHI" : "NotPHI"
        }, {
            "propertyId" : 26827,
            "propertyURI" : "urn:lsid:labkey.com:IntList.Folder-950:NIMHDemographics.Occupation",
            "container" : "ea23d322-acd6-1037-8e6d-25f311da6f8b",
            "ontologyURI" : null,
            "name" : "Occupation",
            "description" : null,
            "rangeURI" : "http://www.w3.org/2001/XMLSchema#string",
            "conceptURI" : null,
            "label" : "Occupation",
            "searchTerms" : null,
            "semanticType" : null,
            "format" : null,
            "required" : false,
            "hidden" : false,
            "lookupContainer" : null,
            "lookupSchema" : "samples",
            "lookupQuery" : "LookUpToSampleset2",
            "defaultValueType" : null,
            "defaultValue" : null,
            "defaultDisplayValue" : "[none]",
            "mvEnabled" : false,
            "importAliases" : null,
            "shownInInsertView" : true,
            "shownInUpdateView" : true,
            "shownInDetailsView" : true,
            "measure" : false,
            "dimension" : true,
            "recommendedVariable" : false,
            "defaultScale" : "LINEAR",
            "facetingBehaviorType" : "AUTOMATIC",
            "scale" : 4000,
            "redactedText" : null,
            "isPrimaryKey" : false,
            "lockType" : "NotLocked",
            "conditionalFormats" : [ ],
            "excludeFromShifting" : false,
            "propertyValidators" : [ {
                "type" : "Length",
                "name" : "Text Length",
                "properties" : { },
                "errorMessage" : null,
                "description" : null,
                "rowId" : 14807,
                "new" : true,
                "expression" : "~lte=4000"
            } ],
            "typeEditable" : true,
            "preventReordering" : false,
            "disableEditing" : false,
            "URL" : null,
            "PHI" : "NotPHI"
        }, {
            "propertyId" : 26828,
            "propertyURI" : "urn:lsid:labkey.com:IntList.Folder-950:NIMHDemographics.MaritalStatus",
            "container" : "ea23d322-acd6-1037-8e6d-25f311da6f8b",
            "ontologyURI" : null,
            "name" : "MaritalStatus",
            "description" : null,
            "rangeURI" : "http://www.w3.org/2001/XMLSchema#string",
            "conceptURI" : null,
            "label" : "Marital Status",
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
            "isPrimaryKey" : false,
            "lockType" : "NotLocked",
            "conditionalFormats" : [ ],
            "excludeFromShifting" : false,
            "propertyValidators" : [ {
                "type" : "Length",
                "name" : "Text Length",
                "properties" : { },
                "errorMessage" : null,
                "description" : null,
                "rowId" : 14808,
                "new" : true,
                "expression" : "~lte=4000"
            } ],
            "typeEditable" : true,
            "preventReordering" : false,
            "disableEditing" : false,
            "URL" : null,
            "PHI" : "NotPHI"
        }, {
            "propertyId" : 26829,
            "propertyURI" : "urn:lsid:labkey.com:IntList.Folder-950:NIMHDemographics.CurrentStatus",
            "container" : "ea23d322-acd6-1037-8e6d-25f311da6f8b",
            "ontologyURI" : null,
            "name" : "CurrentStatus",
            "description" : null,
            "rangeURI" : "http://www.w3.org/2001/XMLSchema#string",
            "conceptURI" : null,
            "label" : "Current Status",
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
            "isPrimaryKey" : false,
            "lockType" : "NotLocked",
            "conditionalFormats" : [ ],
            "excludeFromShifting" : false,
            "propertyValidators" : [ {
                "type" : "Length",
                "name" : "Text Length",
                "properties" : { },
                "errorMessage" : null,
                "description" : null,
                "rowId" : 14809,
                "new" : true,
                "expression" : "~lte=4000"
            } ],
            "typeEditable" : true,
            "preventReordering" : false,
            "disableEditing" : false,
            "URL" : null,
            "PHI" : "NotPHI"
        }, {
            "propertyId" : 26830,
            "propertyURI" : "urn:lsid:labkey.com:IntList.Folder-950:NIMHDemographics.Gender",
            "container" : "ea23d322-acd6-1037-8e6d-25f311da6f8b",
            "ontologyURI" : null,
            "name" : "Gender",
            "description" : null,
            "rangeURI" : "http://www.w3.org/2001/XMLSchema#string",
            "conceptURI" : null,
            "label" : "Gender",
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
            "isPrimaryKey" : false,
            "lockType" : "NotLocked",
            "conditionalFormats" : [ ],
            "excludeFromShifting" : false,
            "propertyValidators" : [ {
                "type" : "Length",
                "name" : "Text Length",
                "properties" : { },
                "errorMessage" : null,
                "description" : null,
                "rowId" : 14810,
                "new" : true,
                "expression" : "~lte=4000"
            } ],
            "typeEditable" : true,
            "preventReordering" : false,
            "disableEditing" : false,
            "URL" : null,
            "PHI" : "NotPHI"
        }, {
            "propertyId" : 26831,
            "propertyURI" : "urn:lsid:labkey.com:IntList.Folder-950:NIMHDemographics.BirthDate",
            "container" : "ea23d322-acd6-1037-8e6d-25f311da6f8b",
            "ontologyURI" : null,
            "name" : "BirthDate",
            "description" : null,
            "rangeURI" : "http://www.w3.org/2001/XMLSchema#dateTime",
            "conceptURI" : null,
            "label" : "Birth Date",
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
            "scale" : 100,
            "redactedText" : null,
            "isPrimaryKey" : false,
            "lockType" : "NotLocked",
            "conditionalFormats" : [ ],
            "excludeFromShifting" : false,
            "propertyValidators" : [ ],
            "typeEditable" : true,
            "preventReordering" : false,
            "disableEditing" : false,
            "URL" : null,
            "PHI" : "NotPHI"
        }, {
            "propertyId" : 26832,
            "propertyURI" : "urn:lsid:labkey.com:IntList.Folder-950:NIMHDemographics.CartoonAvailable",
            "container" : "ea23d322-acd6-1037-8e6d-25f311da6f8b",
            "ontologyURI" : null,
            "name" : "CartoonAvailable",
            "description" : null,
            "rangeURI" : "http://www.w3.org/2001/XMLSchema#boolean",
            "conceptURI" : null,
            "label" : "Cartoon Available",
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
            "scale" : 10,
            "redactedText" : null,
            "isPrimaryKey" : false,
            "lockType" : "NotLocked",
            "conditionalFormats" : [ ],
            "excludeFromShifting" : false,
            "propertyValidators" : [ ],
            "typeEditable" : true,
            "preventReordering" : false,
            "disableEditing" : false,
            "URL" : "https://www.labkey.org/files/home/Demos/ListDemo/sendFile.view?fileName=%40files%2F${SubjectID}.png&renderAs=IMAGE",
            "PHI" : "NotPHI"
        } ],
        "indices" : [ ],
        "schemaName" : null,
        "queryName" : null,
        "templateDescription" : null,
        "instructions" : null
    },
    "domainKindName" : "IntList",
    "options" : {
        "entityId" : "ea23d3e0-acd6-1037-8e6d-25f311da6f8b",
        "createdBy" : 1005,
        "created" : 1567119770398,
        "modifiedBy" : 1005,
        "modified" : 1581358929514,
        "containerId" : "ea23d322-acd6-1037-8e6d-25f311da6f8b",
        "name" : "NIMHDemographics",
        "lastIndexed" : 1581358687000,
        "keyName" : "SubjectID",
        "titleColumn" : "Name",
        "listId" : 277,
        "domainId" : 2280,
        "keyType" : "Integer",
        "discussionSetting" : 1,
        "allowDelete" : true,
        "allowUpload" : true,
        "allowExport" : true,
        "entireListIndex" : false,
        "entireListIndexSetting" : 0,
        "entireListTitleSetting" : 0,
        "entireListTitleTemplate" : null,
        "entireListBodySetting" : 1,
        "entireListBodyTemplate" : null,
        "eachItemIndex" : true,
        "eachItemTitleSetting" : 1,
        "eachItemTitleTemplate" : "dafsfadsfdsa",
        "eachItemBodySetting" : 0,
        "eachItemBodyTemplate" : null,
        "fileAttachmentIndex" : false,
        "discussionSettingEnum" : "OnePerItem",
        "entireListIndexSettingEnum" : "MetaData",
        "entireListTitleSettingEnum" : "Standard",
        "entireListBodySettingEnum" : "AllFields",
        "eachItemTitleSettingEnum" : "Custom",
        "eachItemBodySettingEnum" : "TextOnly",
        "description" : null,
        "containerPath" : "/Tutorials/Lists"
    }
};
const defaultSettings = {
    "entityId" : null,
    "createdBy" : 0,
    "created" : "1969-12-31 16:00:00.000",
    "modifiedBy" : 0,
    "modified" : "1969-12-31 16:00:00.000",
    "containerId" : null,
    "listId" : 0,
    "name" : null,
    "domainId" : 0,
    "keyName" : null,
    "keyType" : null,
    "titleColumn" : null,
    "description" : null,
    "lastIndexed" : null,
    "discussionSetting" : "None",
    "allowDelete" : true,
    "allowUpload" : true,
    "allowExport" : true,
    "entireListIndex" : false,
    "entireListIndexSetting" : "MetaData",
    "entireListTitleSetting" : "Standard",
    "entireListTitleTemplate" : null,
    "entireListBodySetting" : "TextOnly",
    "entireListBodyTemplate" : null,
    "eachItemIndex" : false,
    "eachItemTitleSetting" : "Standard",
    "eachItemTitleTemplate" : null,
    "eachItemBodySetting" : "TextOnly",
    "eachItemBodyTemplate" : null,
    "fileAttachmentIndex" : false,
    "containerPath" : ""
};

class Wrapped extends React.Component<any, any> {
    constructor(props) {
        super(props);

        let model = ListModel.create(this.props.data);
        this.state = {model};
    }

    onRadioChange = (e) => {
        console.log("onRadioChange", e.target.name, e.target.value);
    };


    render() {
        return(
            <ListDesignerPanels
                model={this.state.model}
            />
        );
    }
}

class WrappedNew extends React.Component<any, any> {
    constructor(props) {
        super(props);

        let model = ListModel.create(null, this.props.data);
        this.state = {model};
    }

    onRadioChange = (e) => {
        console.log("onRadioChange", e.target.name, e.target.value);
    };


    render() {
        return(
            <ListDesignerPanels
                model={this.state.model}
            />
        );
    }
}

{/*<AdvancedSettings title={"Advanced Settings"} model={this.state.model} onInputChange={this.onRadioChange}/>*/}


// class Test extends React.Component<any, any> {
//     constructor(props) {
//         super(props);
//         this.state = {};
//     }
//
//     componentDidMount() {
//         const thing = A.create();
//         this.setState = {() => ({thing}), () => {console.log(this.state)}};
//     }
//
//     render() {
//         const a = Record({ a: 1, b: 2 });
//
//
//
//         return(
//             <div>
//
//             </div>
//         );
//     }
// }

//
// storiesOf("ListPropertiesPanel", module)
//     .addDecorator(withKnobs)
//     .add("Hello World", () => {
//         return (
//             <ListPropertiesPanel
//                 panelStatus={'COMPLETE'}
//                 collapsible={true}
//                 model={ListModel }
//             />
//         )
//     })
// ;

storiesOf("Advanced Settings", module)
    .addDecorator(withKnobs)
    .add("with existing list", () => {
        return (
            <Wrapped data={json}/>
        )
    })
;

storiesOf("Advanced Settings", module)
    .addDecorator(withKnobs)
    .add("with new list", () => {
        return (
            <WrappedNew data={defaultSettings}/>
        )
    })
;
