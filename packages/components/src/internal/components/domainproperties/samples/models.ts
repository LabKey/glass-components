import { fromJS, Map, OrderedMap, Record, Set } from 'immutable';

import { DomainDesign, DomainDetails, IDomainField } from '../models';
import { IParentAlias } from '../../entities/models';
import { getDuplicateAlias, parentAliasInvalid } from '../utils';

export class SampleTypeModel extends Record({
    rowId: undefined,
    name: undefined,
    nameReadOnly: false,
    nameExpression: undefined,
    aliquotNameExpression: undefined,
    description: undefined,
    labelColor: undefined,
    metricUnit: undefined,
    parentAliases: undefined,
    importAliases: undefined,
    domainId: undefined,
    domain: undefined,
    autoLinkTargetContainerId: undefined,
    autoLinkCategory: undefined,
    excludedContainerIds: undefined,
    exception: undefined,
}) {
    declare rowId: number;
    declare name: string;
    declare nameReadOnly?: boolean;
    declare nameExpression: string;
    declare aliquotNameExpression: string;
    declare description: string;
    declare labelColor: string;
    declare metricUnit: string;
    declare parentAliases?: OrderedMap<string, IParentAlias>;
    declare importAliases?: Map<string, string>;
    declare domainId?: number;
    declare domain?: DomainDesign;
    declare autoLinkTargetContainerId: string;
    declare autoLinkCategory: string;
    declare excludedContainerIds?: string[];
    declare exception: string;

    static create(raw?: DomainDetails, name?: string): SampleTypeModel {
        const options = raw?.options;
        let importAliases = Map<string, string>();
        if (options) {
            const aliases = options.get('importAliases') || {};
            importAliases = Map<string, string>(fromJS(aliases));
        }

        return new SampleTypeModel({
            ...options?.toJS(),
            aliquotNameExpression: options?.get('aliquotNameExpression') || '',
            name,
            nameReadOnly: raw?.nameReadOnly,
            importAliases,
            labelColor: options?.get('labelColor') || undefined, // helps to convert null to undefined
            metricUnit: options?.get('metricUnit') || undefined,
            domain: raw?.domainDesign ?? DomainDesign.create({}),
        });
    }

    static serialize(model: SampleTypeModel): any {
        const domain = DomainDesign.serialize(model.domain);
        return model.merge({ domain }).toJS();
    }

    isNew(): boolean {
        return !this.rowId;
    }

    isValid(defaultNameFieldConfig?: Partial<IDomainField>, metricUnitRequired?: boolean) {
        return (
            this.hasValidProperties() &&
            !this.hasInvalidNameField(defaultNameFieldConfig) &&
            getDuplicateAlias(this.parentAliases, true).size === 0 &&
            !this.domain.hasInvalidFields() &&
            this.isMetricUnitValid(metricUnitRequired)
        );
    }

    isMetricUnitValid(metricUnitRequired?: boolean) {
        return !metricUnitRequired || this.metricUnit != null;
    }

    hasValidProperties(): boolean {
        const { parentAliases } = this;
        const hasInvalidAliases =
            parentAliases && parentAliases.size > 0 && parentAliases.find(parentAliasInvalid) !== undefined;

        return this.name !== undefined && this.name !== null && this.name.trim().length > 0 && !hasInvalidAliases;
    }

    hasInvalidNameField(defaultNameFieldConfig: Partial<IDomainField>): boolean {
        return this.domain && defaultNameFieldConfig ? this.domain.hasInvalidNameField(defaultNameFieldConfig) : false;
    }

    get containerPath(): string {
        return this.domain.container;
    }
}

export interface MetricUnitProps {
    includeMetricUnitProperty?: boolean;
    metricUnitHelpMsg?: string;
    metricUnitLabel?: string;
    metricUnitOptions?: any[];
    metricUnitRequired?: boolean;
}

export interface AliquotNamePatternProps {
    aliquotNameExpressionInfoUrl?: string;
    aliquotNameExpressionPlaceholder?: string;
    showAliquotNameExpression?: boolean;
}
