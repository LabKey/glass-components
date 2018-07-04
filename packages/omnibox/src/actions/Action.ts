/*
 * Copyright (c) 2018 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
/**
 * The Action interface specifies the functionality that must be implemented for an Action to participate
 * in the OmniBox action framework. Action's are considered stateless so a given instance of a type of Action
 * may be transient.
 */
export interface Action {
    /**
     * This is the keyword the user uses to activate this action. This should consist of one word
     * with no spaces. A special case is the keyword can be the empty string '' which will result
     * in that action being the default action.
     */
    keyword: string

    /**
     * This is a shorthand font awesome icon class. E.g. "globe" would apply the icon fa-globe.
     * http://fontawesome.io/icons
     */
    iconCls: string

    /**
     * This is a one word label used to describe the action. Only needs to be specified if the keyword is not
     * sufficient. Usages default to display the keyword.
     */
    oneWordLabel?: string

    /**
     * An optional label that provides additional context to the user about what the action will do. This is used
     * in conjunction with the keyword/oneWordLabel when displaying an Action's option.
     * Example:
     *      keyword: "hello", optionLabel: "planet"
     * Would display:
     *      hello planet
     */
    optionalLabel?: string

    /**
     * Called to provide the final value from the current input. Only called when the current input is
     * considered complete. The input is marked complete in a variety of ways (e.g. user hits enter, clicks an
     * option marked as isComplete (see ActionOption.isComplete), leaves the input box, etc). The returned Value
     * can mark itself as invalid, in cases where it may not be complete, by setting the Value.isValid to false and
     * the value will not be applied.
     * @param tokens - The current tokenized input value.
     */
    completeAction: (tokens: Array<string>) => Promise<Value>

    /**
     * Called to provide the set of ActionOption's for the current input.
     * @param tokens - The current tokenized input value.
     */
    fetchOptions: (tokens: Array<string>) => Promise<Array<ActionOption>>

    /**
     * Called to determine if the incoming Action is equivalent to this Action. This allows for more subtle
     * comparison then a.keyword === b.keyword and determines how an action will be treated with respect
     * to the set of Value's for Action's of this type.
     * @param action
     */
    isEqual: (action: Action) => boolean

    /**
     * Allows Actions to convert a set of ActionValue's into a set of paramKey/paramValue pairs for URL
     * parameters. This allows for mapping 1-1, N-1, 1-M, N-M.
     * @param actionValues
     */
    buildParams: (actionValues: Array<ActionValue>) => Array<{paramKey: string, paramValue: string}>

    /**
     * Allows Actions to examine a paramKey/paramValue pair to determine if the Action will
     * bind that URL parameter.
     * @param paramKey
     * @param paramValue
     */
    matchParam: (paramKey: string, paramValue: any) => boolean

    /**
     * If a paramKey/paramValue has been matched via Action.matchParam then the pair can be handled
     * here to generate a Value.
     * @param paramKey
     * @param paramValue
     */
    parseParam: (paramKey: string, paramValue: any) => Array<string> | Array<Value>
}

export interface Value {
    value: string

    displayValue?: string
    isReadOnly?: boolean
    isRemovable?: boolean
    isValid?: boolean
    param?: any
}

export interface ActionValue extends Value {
    action: Action
}

export interface ActionValueCollection {
    action: Action
    values: Array<ActionValue>
}

export interface ActionOption {
    label: string

    action?: Action
    value?: string
    appendValue?: boolean
    isAction?: boolean
    isComplete?: boolean
    isSelected?: boolean
    isOverwrite?: boolean
    nextLabel?: string
    selectable?: boolean
}