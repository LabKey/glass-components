import { List, Map } from 'immutable';
import { Utils } from '@labkey/api';

import { QueryInfo } from '../../../../public/QueryInfo';

function arrayListIsEqual(valueArr: Array<string | number>, nestedModelList: List<Map<string, any>>): boolean {
    let matched = 0;
    // Loop through the submitted array and the existing list and compare values.
    // If values match, add tally. If submitted values length is same as existing list, consider them equal.
    // Note: caller should have checked against empty array and list before function.
    nestedModelList.forEach(nestedField => {
        return valueArr.forEach(nestedVal => {
            if (nestedField.get('value') === nestedVal || nestedField.get('displayValue') === nestedVal) {
                matched++;
            }
        });
    });

    return matched === valueArr.length;
}

export function extractChanges(
    queryInfo: QueryInfo,
    currentData: Map<string, any>,
    formValues: Record<string, any>
): Record<string, any> {
    const changedValues = {};
    // Loop through submitted formValues and check against existing currentData from server
    Object.keys(formValues).forEach(field => {
        // Issue 52038: we expect the field values here to be fieldKey, but fall back to looking for the column by name
        let col = queryInfo.getColumn(field);
        if (!col) col = queryInfo.getColumnFromName(field);

        let existingValue = currentData.get(col.name);
        const changedValue = formValues[field];

        // If nested value, will need to do deeper check
        if (List.isList(existingValue)) {
            // If the submitted value and existing value are empty, do not update field
            if (!changedValue && existingValue.size === 0) {
                return false;
            }
            // Issue 52038: store changedValues using column name as key not fieldKey since server won't recognize
                // the fields if you use fieldKey and thus no changes will be saved.
            // If the submitted value is empty and there is an existing value, should update field
            else if (!changedValue && existingValue.size > 0) {
                // Issue 46102
                // Do not set the field to changedValue, it may be undefined, which causes us to treat the value as if
                // it has not changed, making it impossible to clear the value.
                changedValues[col.name] = [];
            } else {
                // If submitted value array and existing value array are different size, should update field
                if (changedValue.length !== existingValue.size) {
                    changedValues[col.name] = changedValue;
                }
                // If submitted value array and existing array are the same size, need to compare full contents
                else if (changedValue.length === existingValue.size) {
                    if (!arrayListIsEqual(changedValue, existingValue)) {
                        changedValues[col.name] = changedValue;
                    }
                }
            }
        } else if (changedValue != currentData.getIn([col.name, 'value'])) {
            existingValue = currentData.getIn([col.name, 'value']);
            const column = queryInfo.getColumn(field);
            let newValue = changedValue;
            // A date field needs to be checked specially
            if (column?.jsonType === 'date') {
                // Ensure dates have same formatting
                const newDate = new Date(newValue);
                const origDate = new Date(existingValue);
                // If submitted value is same as existing date down to the minute (issue 40139), do not update
                let newDateValue = newDate.setUTCSeconds(0, 0);
                let origDateValue = origDate.setUTCSeconds(0, 0);
                // If original date doesn't have timestamp, then only check date to hour
                if (Utils.isString(newValue) && newValue.indexOf(':') === -1) {
                    newDateValue = newDate.setUTCHours(0, 0, 0, 0);
                    origDateValue = origDate.setUTCHours(0, 0, 0, 0);
                }

                if (newDateValue === origDateValue) {
                    return false;
                }
            } else if (column?.inputType === 'file') {
                // for file inputs, newValue of undefined means that it wasn't changed
                if (newValue === undefined || existingValue === newValue) {
                    return false;
                }
            } else if (column?.jsonType === 'string') {
                if (Utils.isString(newValue)) {
                    newValue = newValue.trim();
                }
                if (existingValue === newValue) {
                    return false;
                }
            }

            changedValues[col.name] = newValue === undefined ? null : newValue;
        }
    });

    return changedValues;
}
