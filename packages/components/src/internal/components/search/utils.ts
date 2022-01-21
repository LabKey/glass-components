import { Filter } from "@labkey/api";

import { EntityDataType } from '../entities/models';
import { JsonType } from "../domainproperties/PropDescType";

export function getFinderStartText(parentEntityDataTypes: EntityDataType[]) {
    const hintText = 'Start by adding ';
    let names = parentEntityDataTypes.map(entityType => entityType.nounAsParentSingular).join(', ');
    const lastComma = names.lastIndexOf(',');
    if (lastComma >= 0) {
        names = names.substr(0, lastComma) + ' or' + names.substr(lastComma + 1);
    }
    return hintText + names + ' properties.';
}

export const SAMPLE_SEARCH_FILTER_TYPES_TO_EXCLUDE = [Filter.Types.CONTAINS.getURLSuffix(), Filter.Types.DOES_NOT_CONTAIN.getURLSuffix(), Filter.Types.DOES_NOT_START_WITH.getURLSuffix(), Filter.Types.STARTS_WITH.getURLSuffix(), Filter.Types.CONTAINS_ONE_OF.getURLSuffix(), Filter.Types.CONTAINS_NONE_OF.getURLSuffix()];

export function getSampleFinderFilterTypesForType(jsonType: JsonType) : any[] {
    let filterList = Filter.getFilterTypesForType(jsonType)
        .filter(function(result) {
            return SAMPLE_SEARCH_FILTER_TYPES_TO_EXCLUDE.indexOf(result.getURLSuffix()) === -1;
        })
    ;

    if (jsonType === 'date') {
        filterList.push(Filter.Types.BETWEEN);
        filterList.push(Filter.Types.NOT_BETWEEN);
    }

    let filters = [];

    filterList.forEach(filter => {
        let urlSuffix = filter.getURLSuffix();
        if (urlSuffix === '')
            urlSuffix = 'any';
        filters.push({
            value: urlSuffix,
            label: filter.getDisplayText(),
            valueRequired: filter.isDataValueRequired(),
            multiValue: filter.isMultiValued(),
            betweenOperator: ['between', 'notbetween'].indexOf(urlSuffix) > -1
        });
    })

    return filters;
}
