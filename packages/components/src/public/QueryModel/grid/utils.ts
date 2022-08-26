import { List } from 'immutable';

import { ActionValue } from './actions/Action';
import { Change, ChangeType } from './model';
import {QueryColumn} from "../../QueryColumn";

/**
 * From the supplied columnName this method will determine which columns in the "columns" list
 * match based on name. If none match, then the columnName will attempt to resolve against each
 * column's shortCaption (see QueryColumn).
 * @param columns
 * @param columnName
 * @returns {List<QueryColumn>}
 */
export function parseColumns(columns: List<QueryColumn>, columnName: string): List<QueryColumn> {
    const _columnName = columnName ? columnName.toLowerCase() : '';

    // First, attempt to match by column name/lookup
    const nameMatches = columns
        .filter(c => {
            if (_columnName.indexOf('/') > -1) {
                if (c.isLookup()) {
                    const name = _columnName.split('/')[0];
                    return c.name.toLowerCase() === name;
                }

                return false;
            }

            return c.name.toLowerCase() === _columnName;
        })
        .toList();

    // Second, if there are no matches by column name/lookup, attempt to match by column shortCaption
    if (nameMatches.size === 0) {
        return columns.filter(c => c.shortCaption.toLowerCase() === _columnName).toList();
    }

    return nameMatches;
}

/**
 * Determines what the field key should be from a supplied columnName.
 * If a column (QueryColumn) is supplied it will override the columnName for either
 * the column's lookup column or the column's name.
 * @param columnName
 * @param column
 * @returns {any}
 */
export function resolveFieldKey(columnName: string, column?: QueryColumn): string {
    return column?.resolveFieldKey() ?? columnName;
}

export function getSearchValueAction(actionValues: ActionValue[], value: string): Change {
    const hasNewSearch = value?.length > 0;
    const existingSearchIndex = actionValues.findIndex(actionValue => actionValue.action.keyword === 'search');

    let change = hasNewSearch ? ({ type: ChangeType.add } as Change) : undefined;
    if (existingSearchIndex > -1) {
        if (hasNewSearch) {
            change = { type: ChangeType.modify, index: existingSearchIndex };
        } else {
            change = { type: ChangeType.remove, index: existingSearchIndex };
        }
    }
    return change;
}

export function filterActionValuesByType(actionValues: ActionValue[], keyword: string): ActionValue[] {
    return actionValues.filter(actionValue => actionValue.action.keyword === keyword);
}
