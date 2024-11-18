import { ComponentType } from 'react';
import { immerable, produce } from 'immer';
import { Filter, Query } from '@labkey/api';

import { QueryModel } from '../../../public/QueryModel/QueryModel';
import { User } from '../base/models/User';
import { AppURL } from '../../url/AppURL';

import { EntityDataType, OperationConfirmationData } from '../entities/models';

import { SamplesEditButtonSections } from './utils';
import { ALIQUOT_FILTER_MODE, SampleStateType } from './constants';

export enum EntityCreationType {
    Aliquots = 'Aliquot',
    Derivatives = 'Derive',
    FromSources = 'From sources',
    Independents = 'New samples',
    PooledSamples = 'Pool',
}

export interface EntityCreationTypeModel {
    description?: string;
    disabled?: boolean;
    disabledDescription?: string;
    iconSrc?: string;
    iconUrl?: string;
    minParentsPerSample: number;
    quantityLabel?: string;
    selected?: boolean;
    type: EntityCreationType;
    typeChoiceLabel?: string;
}

export const INDEPENDENT_SAMPLE_CREATION: EntityCreationTypeModel = {
    type: EntityCreationType.Independents,
    description: 'Create samples.',
    minParentsPerSample: 0,
    quantityLabel: 'New Samples',
};

export const DERIVATIVE_CREATION: EntityCreationTypeModel = {
    type: EntityCreationType.Derivatives,
    description: 'Create samples of different types from each selected sample.',
    disabledDescription: 'Only one parent sample type is allowed when creating derivative samples.',
    minParentsPerSample: 1,
    iconSrc: 'derivatives',
    quantityLabel: 'Derivatives Per Parent',
    typeChoiceLabel: 'Derivative Type',
};

export const POOLED_SAMPLE_CREATION: EntityCreationTypeModel = {
    type: EntityCreationType.PooledSamples,
    description: 'Combine selected samples to create new samples.',
    minParentsPerSample: 2,
    iconSrc: 'pooled',
    quantityLabel: 'New Samples from Pool',
    typeChoiceLabel: 'Sample Type',
};

export const ALIQUOT_CREATION: EntityCreationTypeModel = {
    type: EntityCreationType.Aliquots,
    description: 'Create copies that inherit data from each parent sample.',
    minParentsPerSample: 1,
    iconSrc: 'aliquots',
    quantityLabel: 'Aliquots Per Parent',
};

export interface GroupedSampleFields {
    // aliquot-specific
    aliquotFields: string[];
    // aliquot & parent rename to sharedFields
    independentFields: string[];
    // parent only
    metaFields: string[];
    metricUnit: string;
}

export interface FindField {
    helpText?: string;
    helpTextTitle?: string;
    label: string;
    name: string;
    nounPlural: string;
    nounSingular: string;
    storageKeyPrefix: string;
}

export interface SampleStatus {
    color: string;
    description?: string;
    label: string;
    statusType: SampleStateType;
}

export interface StorageActionStatusCounts {
    actionable: number;
    canBeAdded?: number;
    checkedIn?: number;
    checkedOut?: number;
    inStorage?: number;
    invalidStatus?: number;
    noPermissions?: number;
    notInStorage?: number;
    total: number;
}

// Note: this should stay in sync with the freezermanager/src/components/AddSamplesToStorageModal.tsx props
interface AddSamplesToStorageModalComponentProps {
    actionStatusCounts?: StorageActionStatusCounts;
    onCancel: () => void;
    onSuccess?: () => void;
    samplesSelectionKey?: string;
    user: User;
}

export type AddSamplesToStorageModal = ComponentType<AddSamplesToStorageModalComponentProps>;

// Note: this should stay in sync with the freezermanager/src/components/StorageButton.tsx props
interface SampleStorageButtonComponentProps {
    afterStorageUpdate?: () => void;
    isPicklist?: boolean;
    metricFeatureArea?: string;
    nounPlural?: string;
    queryModel: QueryModel;
    user: User;
}

export type SampleStorageButton = ComponentType<SampleStorageButtonComponentProps>;

// Note: this should stay in sync with the workflow/src/Components/JobsButton.tsx props
interface JobsButtonsComponentProps {
    isAssay?: boolean;
    metricFeatureArea?: string;
    model: QueryModel;
    user: User;
}

export type JobsButton = ComponentType<JobsButtonsComponentProps>;

// Note: this is meant to correspond to the JobsMenuOptions component in workflow/src/Components/JobsButton.tsx
export type JobsMenuOptions = ComponentType<JobsButtonsComponentProps>;

// Note: this should stay in sync with the workflow/src/Components/WorkflowGrid.tsx props
interface WorkflowGridComponentProps {
    containerFilter?: Query.ContainerFilter;
    containerPath?: string;
    gridPrefix?: string;
    sampleAliquotType?: ALIQUOT_FILTER_MODE;
    sampleId?: number;
    sampleLSID?: string;
    showAliquotViewSelector?: boolean;
    showStartButton?: boolean;
    showTemplateTabs?: boolean;
    user: User;
    visibleTabs?: string[];
}

export type WorkflowGrid = ComponentType<WorkflowGridComponentProps>;

export class SampleState {
    [immerable] = true;

    readonly rowId: number;
    readonly label: string;
    readonly description: string;
    readonly stateType: string;
    readonly publicData: boolean;
    readonly inUse: boolean;
    readonly isLocal: boolean;
    readonly containerPath: string;
    readonly color: string;

    constructor(values?: Partial<SampleState>) {
        Object.assign(this, values);
        if (this.publicData === undefined) {
            Object.assign(this, { publicData: false });
        }
    }

    set(name: string, value: any): SampleState {
        return this.mutate({ [name]: value });
    }

    mutate(props: Partial<SampleState>): SampleState {
        return produce<SampleState>(this, draft => {
            Object.assign(draft, props);
        });
    }

    toSampleStatus(): SampleStatus {
        return {
            description: this.description,
            label: this.label,
            color: this.color,
            statusType: SampleStateType[this.stateType],
        };
    }
}

export interface SampleGridButtonProps {
    afterSampleActionComplete?: () => void;
    afterSampleDelete?: (rowsToKeep: any[]) => void;
    createBtnParentEntityType?: EntityDataType;
    createBtnParentKey?: string;
    currentProductId?: string;
    excludeAddButton?: boolean;
    excludedMenuKeys?: SamplesEditButtonSections[];
    getJobURL?: (jobId: number) => string;
    includesMedia?: boolean;
    initAliquotMode?: ALIQUOT_FILTER_MODE;
    metricFeatureArea?: string;
    navigate?: (url: string | AppURL) => void;
    onTabbedViewAliquotSelectorUpdate?: (filter: Filter.IFilter, filterColumnToRemove?: string) => void;
    sampleFinderBaseProps?: Record<string, any>;
    showBulkUpdate?: (statusData?: OperationConfirmationData) => void;
    toggleEditLineage?: (statusData?: OperationConfirmationData) => void;
    toggleEditSamples?: (statusData?: OperationConfirmationData) => void;
}
