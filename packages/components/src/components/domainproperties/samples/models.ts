import {fromJS, Map, OrderedMap, Record, Set} from "immutable";
import {SEVERITY_LEVEL_ERROR} from "../constants";
import { DomainDesign, DomainDetails } from "../models";
import { IParentOption } from "../../entities/models";

export class SampleTypeModel extends Record({
    rowId: undefined,
    name: undefined,
    nameReadOnly: false,
    nameExpression: undefined,
    description: undefined,
    parentAliases: undefined,
    importAliases: undefined,
    domainId: undefined,
    domain: undefined,
}) {
    rowId: number;
    name: string;
    nameReadOnly?: boolean;
    nameExpression: string;
    description: string;
    parentAliases?: OrderedMap<string, IParentAlias>;
    importAliases?: Map<string, string>;
    domainId?: number;
    domain?: DomainDesign;

    constructor(values?: {[key:string]: any}) {
        super(values);
    }

    static create(raw?: DomainDetails, name?: string): SampleTypeModel {
        if (!raw)
            return new SampleTypeModel();

        let domain = raw.domainDesign ?
            raw.domainDesign :
            DomainDesign.create({});

        const {options} = raw;
        let importAliases = Map<string,string>();
        if (options) {
            let aliases = options.get('importAliases') || {};
            importAliases = Map<string,string>(fromJS(aliases));
        }

        return new SampleTypeModel({
            ...options.toJS(),
            name,
            nameReadOnly: raw.nameReadOnly,
            importAliases,
            domain
        });
    }

    static serialize(model: SampleTypeModel): any {
        const domain = DomainDesign.serialize(model.domain);
        return model.merge({domain}).toJS();
    }

    isNew(): boolean {
        return !this.rowId;
    };

    static isValid(model: SampleTypeModel) {
        const errDomain = !!model.domain.domainException && model.domain.domainException.severity === SEVERITY_LEVEL_ERROR;
        return !errDomain && model.hasValidProperties();
    }

    /**
     * Check if IParentAlias is invalid
     * @param alias
     */
    static parentAliasInvalid(alias: IParentAlias): boolean {
        if (!alias)
            return true;

        //return true if alias is null or blank; or if parentValue option is not set
        return !alias.alias || alias.alias.trim() === '' || !alias.parentValue || alias.isDupe;
    }

    hasValidProperties(): boolean {
        const {parentAliases} = this;
        const hasInvalidAliases = parentAliases && parentAliases.size > 0 && parentAliases.find(SampleTypeModel.parentAliasInvalid);

        return ((this.name !== undefined && this.name !== null && this.name.trim().length > 0)
            && !hasInvalidAliases
        );
    }

    /**
     * returns a Set of ids corresponding to the aliases that have duplicate alias values
     */
    getDuplicateAlias(): Set<string> {
        const {parentAliases} = this;
        let dupesAliases = Set<string>();
        let dupeIds = Set<string>();

        parentAliases.forEach((alias:IParentAlias) => {
            if (dupesAliases.has(alias.alias))
                dupeIds = dupeIds.add(alias.id);
            else
                dupesAliases = dupesAliases.add(alias.alias);
        });

        return dupeIds;
    }
}

export interface IParentAlias {
    alias: string;
    id: string; //generated by panel used for removal, not saved
    parentValue: IParentOption;
    ignoreAliasError: boolean
    ignoreSelectError: boolean
    isDupe?: boolean
}
