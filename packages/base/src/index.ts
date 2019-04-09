/*
 * Copyright (c) 2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { GRID_EDIT_INDEX, GRID_SELECTION_INDEX, GRID_CHECKBOX_OPTIONS } from './models/constants'
import {
    QueryColumn, QueryGridModel, QueryInfo, QuerySort, QueryLookup, QueryInfoStatus,
    Container, User, SchemaQuery, ViewInfo, SchemaDetails, MessageLevel, LastActionStatus,
    IQueryGridModel, IGridLoader, IGridResponse, IGridSelectionResponse, insertColumnFilter
} from './models/model'
import {
    resolveKey, resolveKeyFromJson, resolveSchemaQuery, getSchemaQuery, decodePart, encodePart,
    applyDevTools, devToolsActive, intersect, naturalSort, not, toggleDevTools, toLowerSafe
} from './utils/utils'
import {
    AppURL, buildURL, getSortFromUrl, hasParameter, imageURL, setParameter, toggleParameter
} from './url/ActionURL'
import { Alert } from './components/Alert'
import { MultiMenuButton } from './components/menus/MultiMenuButton'
import { SubMenu } from "./components/menus/SubMenu";
import { SubMenuItem } from "./components/menus/SubMenuItem";
import { CustomToggle } from './components/CustomToggle'
import { LoadingSpinner } from './components/LoadingSpinner'
import { NotFound } from './components/NotFound'
import { Page } from './components/Page'
import { PageHeader } from './components/PageHeader'
import { Progress } from './components/Progress'
import { Tip } from './components/Tip'

// Import the scss file so it will be processed in the rollup scripts
import './theme/index.scss'

// Add explicit export block for the classes and functions to be exported from this package
export {
    // constants
    GRID_EDIT_INDEX,
    GRID_SELECTION_INDEX,
    GRID_CHECKBOX_OPTIONS,

    // interfaces
    IQueryGridModel,
    IGridLoader,
    IGridResponse,
    IGridSelectionResponse,

    //models
    AppURL,
    Container,
    User,
    QueryColumn,
    QueryGridModel,
    QueryInfo,
    QuerySort,
    QueryLookup,
    QueryInfoStatus,
    SchemaDetails,
    SchemaQuery,
    ViewInfo,
    MessageLevel,
    LastActionStatus,

    //components
    Alert,
    CustomToggle,
    LoadingSpinner,
    NotFound,
    Page,
    PageHeader,
    Progress,
    MultiMenuButton,
    SubMenu,
    SubMenuItem,
    Tip,

    // util functions
    decodePart,
    encodePart,
    getSchemaQuery,
    resolveKey,
    resolveKeyFromJson,
    resolveSchemaQuery,
    insertColumnFilter,
    intersect,
    naturalSort,
    not,
    toLowerSafe,

    // url functions
    buildURL,
    getSortFromUrl,
    hasParameter,
    imageURL,
    setParameter,
    toggleParameter,

    // devTools functions
    applyDevTools,
    devToolsActive,
    toggleDevTools
}