/*
 * Copyright (c) 2021 LabKey Corporation
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
import { Filter, Query } from '@labkey/api';
import React, { createContext, PropsWithChildren, ReactElement, useContext, useMemo } from 'react';

import { QueryConfigMap } from '../public/QueryModel/withQueryModels';
import { SchemaQuery } from '../public/SchemaQuery';

import { ComponentsAPIWrapper, getDefaultAPIWrapper } from './APIWrapper';
import {
    NotebookNotificationSettings,
    NotebookContainerSettings,
    FolderStorageSelection,
    WorkflowNotificationSettings,
    ReferencingNotebooks,
} from './app/models';
import { User } from './components/base/models/User';
import { DomainDetails } from './components/domainproperties/models';
import { EntityDataType } from './components/entities/models';
import { DetailRenderer } from './components/forms/detail/DetailDisplay';
import { ALIQUOT_FILTER_MODE } from './components/samples/constants';
import {
    AddSamplesToStorageModal,
    JobsButton,
    JobsMenuOptions,
    SampleStorageButton,
    WorkflowGrid,
} from './components/samples/models';
import {
    SampleGridButton,
    SamplesEditableGridProps,
    SampleStorageLocation,
    SampleStorageMenu,
    SamplesTabbedGridPanel,
} from './sampleModels';

export interface AdminAppContext {
    FolderStorageSelectionComponent?: FolderStorageSelection;
    NotebookContainerSettingsComponent: NotebookContainerSettings;
    NotebookNotificationSettingsComponent: NotebookNotificationSettings;
    WorkflowNotificationSettingsComponent: WorkflowNotificationSettings;
    extraPermissionRoles: string[][];
    folderDataTypes?: EntityDataType[];
    sampleTypeDataType?: EntityDataType;
}

export interface SampleTypeAppContext {
    AddSamplesToStorageModalComponent: AddSamplesToStorageModal;
    JobsButtonComponent: JobsButton;
    ReferencingNotebooksComponent: ReferencingNotebooks;
    SampleGridButtonComponent: SampleGridButton;
    SampleStorageButtonComponent: SampleStorageButton;
    SampleStorageLocationComponent: SampleStorageLocation;
    SampleStorageMenuComponent: SampleStorageMenu;
    SamplesTabbedGridPanelComponent: SamplesTabbedGridPanel;
    WorkflowGridComponent: WorkflowGrid;
    assayProviderType?: string;
    controllerName: string;
    dataClassAliasCaption?: string;
    dataClassParentageLabel?: string;
    dataClassTypeCaption?: string;
    detailRenderer?: DetailRenderer;
    downloadTemplateExcludeColumns?: string[];
    getMetricUnitOptions: () => any[];
    getSamplesEditableGridProps: (user: User) => Partial<SamplesEditableGridProps>;
    getWorkflowGridQueryConfigs?: (
        visibleTabs: string[],
        gridPrefix: string,
        userId: number,
        userGroupIds: number[],
        schemaQuery?: SchemaQuery,
        initialFilters?: Filter.IFilter[],
        sampleLSID?: string,
        sourceLSID?: string,
        activeSampleAliquotType?: ALIQUOT_FILTER_MODE,
        containerPath?: string,
        containerFilter?: Query.ContainerFilter
    ) => QueryConfigMap;
    hideConditionalFormatting: boolean;
    importHelpLinkTopic: string;
    isValidParentOptionFn?: (row: any, isDataClass: boolean) => boolean;
    lineagePagePermissions: string[];
    parentDataTypes: EntityDataType[];
    readOnlyQueryNames?: string[];
    sampleTypeListingCaption: string;
    samplesGridRequiredColumns: string[];
    showParentLabelPrefix: boolean;
    showStudyProperties: boolean;
    useSeparateDataClassesAliasMenu: boolean;
    validateNewSampleTypeUnit: (sampleSet: DomainDetails, newUnit: string) => Promise<any>;
}

export interface AssayAppContext {
    JobsMenuOptionsComponent: JobsMenuOptions;
    ReferencingNotebooksComponent: ReferencingNotebooks;
    assayProviderType?: string;
    assayTypes?: string[];
    detailRenderer?: DetailRenderer;
    excludedAssayProviders?: string[];
    jobNotificationProvider: string; // pipeline job not workflow job
    qcEnabledForApp?: boolean;
    requireSampleField?: boolean;
    showProviderName?: boolean;
}

export interface AppContext {
    admin?: AdminAppContext;
    api?: ComponentsAPIWrapper;
    assay?: AssayAppContext;
    sampleType?: SampleTypeAppContext;
}

export type ExtendableAppContext<T> = T & AppContext;

// The "any" used here should be fine, it gets re-typed in useAppContext, so as long as you're using that and providing
// a type (e.g. useAppContext<MyAppContextType>()) you'll be fine.
const Context = createContext<ExtendableAppContext<any>>(undefined);

export interface AppContextProviderProps<T> {
    initialContext?: ExtendableAppContext<T>;
}

/**
 * AppContextProvider is a generic, where the type T is a type that extends AppContext. This allows consuming
 * applications to add their own custom attributes to the AppContext. There are a few general rules to follow when
 * adding new properties to the AppContext:
 *   - Be judicious when adding something to the AppContext, only add something when you really need it accessible all
 *     over your app, at any level in the React Component tree
 *   - AppContext is not mutable by design, this is where static app-level pieces of configuration should live, the
 *     AppContext state should never change during runtime
 *   - If it needs to be accessed by anything in ui-components, then it should live on the AppContext in above
 *   - If it is app specific, then it should live on the Type (T) that you pass to this component
 *   - If it is app specific, and it's accessed by something in ui-components, then consider changing the design of
 *       of your components so they do not depend on something app specific, or have them take an equivalent prop
 *       that you pass to the component from your context aware app (there should be a few examples of how to accomplish
 *       this, ask around if you need an example)
 *
 * Example code:
 * ```ts
 * interface MyAppSettings {
 *     specialFeatureEnabled: boolean;
 * }
 *
 * // This interface is so we can namespace all of the settings for our App, keeping them  clearly separated from other
 * // settings that may be on the context.
 * interface WithMyAppSettings {
 *     myAppSettings: MyAppSettings;
 * }
 *
 * type MyAppSpecificContext = ExtendableAppContext<WithMyAppSettings>;
 *
 * const MY_APP_CONTEXT = {
 *     myAppSettings: { specialFeatureEnabled: getSpecialFeatureFlagFromLocalStorage() };
 * };
 *
 * const MyApp: FC = () => {
 *     <AppContextProvider initialContext={MY_APP_CONTEXT}>
 *         <MyComponentThatUsesContext />
 *     </AppContextProvider>
 * };
 *
 * const MyComponentThatUsesContext: FC = () => {
 *     const { myAppSettings } = useAppContext<MyAppSpecificContext>();
 *     const message = `Special Feature is ${myAppSettings.specialFeatureEnabled ? 'Enabled' : 'Disabled'}`
 *     return <p>{message}</p>;
 * };
 * ```
 */
export function AppContextProvider<T>({
    children,
    initialContext,
}: PropsWithChildren<AppContextProviderProps<T>>): ReactElement {
    const value = useMemo<AppContext>(
        () => ({
            // Provide a default API so that external users don't have to specify it
            api: getDefaultAPIWrapper(),
            ...initialContext,
        }),
        [initialContext]
    );

    return <Context.Provider value={value}>{children}</Context.Provider>;
}

/**
 * To use the AppContext provided by a AppContextProvider, use this convenient hook. If you find yourself constantly
 * grabbing the same attribute or two from useAppContext it may be convenient to create a wrapper around this hook
 * that grabs only what you need, this is most helpful for our packages like Workflow e.g.:
 *
 * ```ts
 * const useMyAppContext = (): MyAppSettings => {
 *     const appContext = useAppContext<MyAppSpecificContext>();
 *     return appContext.myAppSettings;
 * };
 *
 * // Then, in your component:
 *
 * const { specialFeatureEnabled } = useMyAppContext();
 * ```
 */
export function useAppContext<T>(): ExtendableAppContext<T> {
    const context = useContext<ExtendableAppContext<T>>(Context);
    if (context === undefined) {
        throw new Error('useAppContext must be used within a AppContext.Provider');
    }
    return context;
}
