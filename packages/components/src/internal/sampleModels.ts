import { ComponentType } from 'react';
import { Query } from '@labkey/api';

import { QueryModel } from '../public/QueryModel/QueryModel';
import { InjectedQueryModels, RequiresModelAndActions } from '../public/QueryModel/withQueryModels';
import { SchemaQuery } from '../public/SchemaQuery';

import { TabbedGridPanelProps } from '../public/QueryModel/TabbedGridPanel';

import { User } from './components/base/models/User';
import { EntityDataType } from './components/entities/models';
import { SampleGridButtonProps } from './components/samples/models';
import { ALIQUOT_FILTER_MODE } from './components/samples/constants';

export interface SamplesTabbedGridPanelComponentProps {
    // TODO: We seem to be very confused about requiresModelReload. Every time SamplesTabbedGrid passes it as true it is
    //  also calling loadModel on the underlying QueryModel. Consumers of SamplesTabbedGridPanel vary in how they treat
    //  the flag, to the point that we seem to have a misunderstanding of what it is for:
    //  1. Some components check the flag and reload their underlying QueryModel if it is true, which is redundant
    //  2. Some components never check the flag, and always reload their underlying QueryModel, which defeats the
    //  purpose of the flag
    //  3. Some components check the flag, and then reload some other data/model. This seems like the one valid use case
    //  (see PickListOverview, WorkflowSamplesPage)
    afterSampleActionComplete?: (requiresModelReload?: boolean) => void;
    asPanel?: boolean;
    autoLoad?: boolean;
    containerFilter?: Query.ContainerFilter;
    createBtnParentEntityType?: EntityDataType;
    createBtnParentKey?: string;
    getIsDirty?: () => boolean; // TODO make getIsDirty/setIsDirty required props: Issue 51863
    gridButtonProps?: any;
    gridButtons?: ComponentType<SampleGridButtonProps & RequiresModelAndActions>;
    initialTabId?: string; // use if you have multiple tabs but want to start on something other than the first one
    isAllSamplesTab?: (schemaQuery: SchemaQuery) => boolean;
    modelId?: string; // if a usage wants to just show a single GridPanel, they should provide a modelId prop
    onEditToggle?: (isEditing: boolean) => void;
    onSampleTabSelect?: (modelId: string) => void;
    sampleAliquotType?: ALIQUOT_FILTER_MODE; // the init sampleAliquotType, requires all query models to have completed loading queryInfo prior to rendering of the component
    samplesEditableGridProps?: Partial<SamplesEditableGridProps>;
    setIsDirty?: (isDirty: boolean) => void;
    showLabelOption?: boolean;
    tabRowCounts?: Record<string, number>;
    tabbedGridPanelProps?: Partial<TabbedGridPanelProps>;
    user: User;
}

export type SamplesTabbedGridPanel = ComponentType<SamplesTabbedGridPanelComponentProps & InjectedQueryModels>;

export interface SampleStorageLocationComponentProps {
    actionChangeCount?: number;
    currentProductId?: string;
    onUpdate?: () => void;
    sampleId: string | number;
    sampleQueryModel: QueryModel;
    updateAllowed: boolean;
    user: User;
}

export type SampleStorageLocation = ComponentType<SampleStorageLocationComponentProps>;

export interface SampleStorageMenuComponentProps {
    onUpdate?: (skipChangeCount?: boolean) => void;
    sampleModel: QueryModel;
    sampleUser: User;
}

export type SampleStorageMenu = ComponentType<SampleStorageMenuComponentProps>;

export type SampleGridButton = ComponentType<SampleGridButtonProps & RequiresModelAndActions>;

// This interface stores app-wide settings passed to the LineageEditableGrid
export interface LineageEditableGridProps {
    parentDataTypes: EntityDataType[];
}

// This interface stores app-wide settings that get passed to our SamplesEditableGrid. It extends
// LineageEditableGridProps because the settings are passed to SamplesTabbedGridPanel as one object.
export interface SamplesEditableGridProps extends LineageEditableGridProps {
    samplesGridRequiredColumns?: string[];
}
