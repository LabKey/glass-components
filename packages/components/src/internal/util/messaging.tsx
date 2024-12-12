import React, { ReactNode } from 'react';

import { Utils } from '@labkey/api';

import { capitalizeFirstChar } from './utils';

// TODO rename as actionErrorMessage
export function getActionErrorMessage(problemStatement: string, noun: string, showRefresh = true): React.ReactNode {
    return (
        <span>
            {problemStatement}
            &nbsp;Your session may have expired or the {noun} may no longer be valid.
            {showRefresh && (
                <>
                    &nbsp;Try <a onClick={() => window.location.reload()}>refreshing the page</a>.
                </>
            )}
        </span>
    );
}

export function deleteSuccessMessage(noun: string, count?: number, additionalInfo?: string): string {
    const countStr = count === undefined ? '' : count;
    return 'Successfully deleted ' + countStr.toLocaleString() + ' ' + noun + '. ' + (additionalInfo || '');
}

export function deleteErrorMessage(noun: string): ReactNode {
    return getActionErrorMessage('There was a problem deleting the ' + noun + '. ', noun);
}

const IllegalArgumentMessage = 'java.lang.illegalargumentexception:';
const ClassCastMessage = 'cannot be cast to class';
const NullPointerExceptionMessage = 'java.lang.nullpointerexception';
const ExperimentExceptionMessage = 'org.labkey.api.exp.experimentexception:';

function trimExceptionPrefix(exceptionMessage: string, message: string): string {
    const startIndex = message.toLowerCase().indexOf(exceptionMessage);
    return message.substring(startIndex + exceptionMessage.length).trim();
}

function resolveDuplicatesAsName(errorMsg: string, noun: string, nounPlural?: string, verb?: string): string {
    // N.B. Issues 48050 and 48209: only for Postgres since the error message from SQL server doesn't provide a
    // reasonable way to parse a multi-field key in the face of names that may contain commas and spaces. Seems
    // better to show a generic message instead of an incorrectly parsed name.
    const keyMatch = errorMsg.match(/Key \(([^)]+)\)=\(([^)]+)\) already exists./);
    let name;
    if (keyMatch) {
        const numParts = keyMatch[1].split(', ').length;
        let index = 0;
        for (let i = 0; i < numParts - 1; i++) {
            index = keyMatch[2].indexOf(', ', index + 1);
        }
        if (index < keyMatch[2].length) {
            if (numParts > 1) {
                // one for comma and one for space
                name = keyMatch[2].substring(index + 2);
            } else {
                name = keyMatch[2];
            }
        }
    }
    let retMsg = `There was a problem ${verb || 'creating'} your ${nounPlural || noun || 'data'}.`;
    if (name) {
        retMsg += ` Duplicate name '${name}' found.`;
    } else {
        retMsg += ` Check the existing ${nounPlural || noun} for possible duplicates and make sure any referenced ${
            nounPlural || noun
        } are still valid.`;
    }
    return retMsg;
}

// exported for jest
export function makePresentParticiple(verb: string): string {
    if (!verb) {
        return verb;
    }
    if (verb.charAt(verb.length - 1) === 'e') {
        return verb.substring(0, verb.length - 1) + 'ing';
    } else {
        return verb + 'ing';
    }
}

export function resolveErrorMessage(
    error: any,
    noun = 'data',
    nounPlural?: string,
    verbPresent?: string,
    duplicatesMessageResolver?: (errorMsg: string, noun: string, nounPlural?: string, verb?: string) => string,
    returnInitialMsg = false
): string {
    const verbPresParticiple = makePresentParticiple(verbPresent);
    let errorMsg;
    if (!error) {
        return undefined;
    }
    if (typeof error === 'string') {
        errorMsg = error;
    } else if (error.message) {
        errorMsg = error.message;
    } else if (error.msg) {
        errorMsg = error.msg;
    } else if (error.exception) {
        errorMsg = error.exception;
    }
    if (returnInitialMsg) {
        return errorMsg;
    } else if (errorMsg) {
        const lcMessage = errorMsg.toLowerCase();
        const duplicatesResolver = duplicatesMessageResolver ?? resolveDuplicatesAsName;
        if (
            lcMessage.indexOf('violates unique constraint') >= 0 ||
            lcMessage.indexOf('violation of unique key constraint') >= 0 ||
            lcMessage.indexOf('cannot insert duplicate key row') >= 0
        ) {
            return duplicatesResolver(errorMsg, noun, nounPlural, verbPresent);
        } else if (
            lcMessage.indexOf('violates foreign key constraint') >= 0 ||
            lcMessage.indexOf('conflicted with the foreign key constraint') >= 0
        ) {
            return `There was a problem ${verbPresParticiple || 'creating'} your ${noun || 'data'}. Check the data fields to make
            sure they contain or reference valid values.`;
        } else if (lcMessage.indexOf(ClassCastMessage) >= 0 || lcMessage.indexOf('bad sql grammar') >= 0) {
            return `There was a problem ${verbPresParticiple || 'creating'} your ${noun || 'data'}.  Check that the format of the data matches the expected type for each field.`;
        } else if (lcMessage.indexOf('existing row was not found') >= 0) {
            return `We could not find the ${noun || 'data'} ${
                verbPresent ? 'to ' + verbPresent : ''
            }.  Try refreshing your page to see if it has been deleted.`;
        } else if (
            lcMessage.indexOf('communication failure') >= 0 ||
            lcMessage.match(/query.*in schema.*doesn't exist/) !== null ||
            lcMessage.match(/query.*in schema.*does not exist/) !== null
        ) {
            return `There was a problem ${verbPresParticiple || 'retrieving'} your ${
                noun || 'data'
            }. Your session may have expired or the ${
                noun || 'data'
            } may no longer be valid.  Try refreshing your page.`;
        } else if (lcMessage.indexOf('either rowid or lsid is required') >= 0) {
            return `There was a problem ${verbPresParticiple || 'retrieving or updating'} your ${
                noun || 'data'
            }.  The request did not contain the proper identifiers.  Make sure the ${noun || 'data'} are still valid.`;
        } else if (lcMessage.indexOf('unable to set genid to ') === 0) {
            // genId display value should be 1 larger than DB value
            const prefix = 'Unable to set genId to ';
            const numberEndInd = lcMessage.indexOf(' ', prefix.length + 1);
            const numberStr = lcMessage.substring(prefix.length, numberEndInd);
            return prefix + (parseInt(numberStr, 10) + 1) + lcMessage.substring(numberEndInd);
        } else if (lcMessage.indexOf(IllegalArgumentMessage) >= 0) {
            return trimExceptionPrefix(IllegalArgumentMessage, errorMsg);
        } else if (lcMessage.indexOf('at least one of "file", "runfilepath", or "datarows" is required') >= 0) {
            return `No data provided to ${verbPresent || 'import'}.`;
        } else if (lcMessage.indexOf(NullPointerExceptionMessage) >= 0) {
            return `There was a problem ${verbPresParticiple || 'processing'} your ${
                noun || 'data'
            }. This may be a problem in the application. Contact your administrator.`;
        } else if (lcMessage.indexOf(ExperimentExceptionMessage) >= 0) {
            return trimExceptionPrefix(ExperimentExceptionMessage, errorMsg);
        } else if (lcMessage.indexOf("cannot update data that don't belong to the current container.") >= 0) {
            return `There was a problem ${verbPresParticiple || 'importing'} your ${noun.toLowerCase() || 'data'}. One or more ${
                noun.toLowerCase() || 'data'
            } already exist in a different folder.`;
        } else if (lcMessage.indexOf('inventory:item: row: ') >= 0) {
            return trimExceptionPrefix('inventory:item: row: ', errorMsg);
        } else if (lcMessage.indexOf('could not create unique index') >= 0) {
            const startIndex = lcMessage.indexOf('detail: key (');
            const fieldname =
                startIndex > -1 ? 'for field ' + lcMessage.substring(startIndex + 13, lcMessage.indexOf(')=(')) : '';
            return `Unable to create a unique constraint ${fieldname} because duplicate values already exists in the data.`;
        } else if (errorMsg.indexOf('Invalid SampleSet name "') >= 0) {
            return errorMsg.replace('. Domain', '. Sample type').replace('Invalid SampleSet name "', 'Invalid sample type name "');
        } else if (errorMsg.indexOf('Invalid DataClass name "') >= 0) {
            return errorMsg.replace('. Domain', '. Source type').replace('Invalid DataClass name "', 'Invalid source type name "');
        } else if (errorMsg.indexOf('Invalid Assay Design name "') >= 0) {
            return errorMsg.replace('. Domain', '. Assay Design');
        } else if (errorMsg.indexOf('ERROR: invalid byte sequence for encoding') > -1) {
            if (errorMsg.indexOf('0x00') > 0)
                return verbPresent === 'import'
                    ? "Import file contains unsupported 'NULL' characters."
                    : "'NULL' is an unsupported character.";
            return verbPresent === 'import'
                ? 'Import file contains unsupported characters.'
                : 'Unsupported characters detected.';
        }
    }
    return errorMsg;
}

export function getConfirmDeleteMessage(verbNoun = 'Deletion'): ReactNode {
    return (
        <p className="top-padding">
            <strong>{capitalizeFirstChar(verbNoun)} cannot be undone.</strong>
            &nbsp;Do you want to proceed?
        </p>
    );
}

export function getPermissionRestrictionMessage(
    totalCount: number,
    noPermissionCount: number,
    nounSingular: string,
    nounPlural: string,
    verb: string,
    verbSuffix?: string
): string {
    if (!noPermissionCount) {
        return '';
    }

    const noun = totalCount === 1 ? nounSingular : nounPlural;

    if (noPermissionCount === totalCount) {
        return `You don't have the required permission to ${verb} the selected ${noun}${verbSuffix ?? ''}.`;
    }

    const notPermittedNoun = Utils.pluralize(noPermissionCount, nounSingular, nounPlural);
    return `Selection includes ${notPermittedNoun} that you do not have permission to ${verb}${verbSuffix ?? ''}. Only the ${nounPlural} that you have permission for will be updated.`;
}
