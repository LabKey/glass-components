/*
 * Copyright (c) 2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import * as React from 'react'
import { List, Map } from 'immutable'
import { QueryColumn, QueryGridModel } from '@glass/models'
import { OmniBox, Action, ActionValue, ActionValueCollection, FilterAction, SearchAction, SortAction, ViewAction } from '@glass/omnibox'

import { Location, getLocation, replaceParameters } from "../../util/URL";

const emptyList = List<QueryColumn>();

/**
 * This is a mapping of actions with their associated URL param. It is keyed by the name of action
 * that a user can supply for a URLBox to the prop 'actions'.
 */
const urlActions = {
    filter: FilterAction,
    search: SearchAction,
    sort: SortAction,
    view: ViewAction
};

function isLocationEqual(locationA: Location, locationB: Location): boolean {
    return locationA && locationB &&
        locationA.pathname === locationB.pathname &&
        locationA.search === locationB.search;
}

interface URLBoxProps {
    actions?: Array<string>
    queryModel: QueryGridModel
}

interface URLBoxState {
    changeLock?: boolean,
    location: Location
}

export class URLBox extends React.Component<URLBoxProps, URLBoxState> {

    static defaultProps = {
        actions: ['filter', 'search', 'sort', 'view']
    };

    constructor(props: URLBoxProps) {
        super(props);

        this.onOmniBoxChange = this.onOmniBoxChange.bind(this);
        this.requestColumns = this.requestColumns.bind(this);
        this.requestModel = this.requestModel.bind(this);

        this.state = {
            changeLock: false,
            location: getLocation()
        };
    }

    shouldComponentUpdate(nextProps: URLBoxProps, nextState: URLBoxState): boolean {
        return !nextState.changeLock && !isLocationEqual(this.state.location, nextState.location);
    }

    private getColumns(): List<QueryColumn> {
        if (this.props.queryModel) {
            return this.props.queryModel.getColumns();
        }

        return emptyList;
    }

    onOmniBoxChange(actionValueCollection: Array<ActionValueCollection>, boxActions: Array<Action>) {
        const { queryModel} = this.props;
        const location = getLocation();

        let params = Map<string, string>().asMutable();

        if (actionValueCollection.length > 0) {
            for (let i=0; i < actionValueCollection.length; i++) {
                let actionParams = actionValueCollection[i].action.buildParams(actionValueCollection[i].values);
                for (let p=0; p < actionParams.length; p++) {
                    params.set(encodeURIComponent(actionParams[p].paramKey), encodeURIComponent(actionParams[p].paramValue));
                }
            }
        }

        if (location && location.query) {
            location.query.map((value, key) => {
                for (let i=0; i < boxActions.length; i++) {
                    if (!params.has(key) && boxActions[i].matchParam(key, value)) {
                        params.set(key, undefined);
                    }
                }
            });
        }

        // TODO: Find a better way to clear paging upon dependent updates.  Should paging be a filter?
        if (params.size > 0) {
            params.set(queryModel.urlPrefix ? queryModel.urlPrefix + '.p' : 'p', undefined);
        }

        // TODO: This is a overly simplified mechanism for suppressing unwanted updates. Figure out a better model
        // for piping URL updates
        this.setState({
            changeLock: true
        });

        replaceParameters(location, params.asImmutable());

        this.setState({
            changeLock: false,
            location: getLocation()
        });
    }

    mapParamsToActionValues(): {actions: Array<Action>, values: Array<ActionValue>} {
        const { queryModel } = this.props;
        const location = getLocation();
        const urlPrefix = queryModel ? queryModel.urlPrefix : undefined;

        let actions: Array<Action> = [];
        let actionValues = [];
        let actionsProp = this.props.actions;

        // setup known URL actions
        for (let i=0; i < actionsProp.length; i++) {
            if (actionsProp[i].toLowerCase() in urlActions) {
                let urlAction = urlActions[actionsProp[i].toLowerCase()];
                actions.push(new urlAction(this.requestColumns, urlPrefix, this.requestModel));
            }
        }

        // match each parameter against an action
        if (location && location.query) {
            location.query.map((value: any, key) => {
                let paramValues: Array<string>;

                if (value instanceof Array) {
                    paramValues = value;
                }
                else {
                    paramValues = [value];
                }

                for (let a=0; a < actions.length; a++) {
                    for (let p=0; p < paramValues.length; p++) {
                        if (actions[a].matchParam(key, paramValues[p])) {

                            // location returns decoded parameters
                            let values = actions[a].parseParam(key, paramValues[p]);

                            for (let v=0; v < values.length; v++) {

                                if (typeof values[v] === 'string') {
                                    actionValues.push({
                                        action: actions[a],
                                        value: values[v]
                                    })
                                }
                                else {
                                    actionValues.push(Object.assign({}, values[v], {
                                        action: actions[a]
                                    }));
                                }
                            }
                        }
                    }
                }
            });
        }

        return {
            actions,
            values: actionValues
        }
    }

    requestColumns(): Promise<List<QueryColumn>> {
        return Promise.resolve(this.getColumns());
    }

    requestModel(): Promise<QueryGridModel> {
        return Promise.resolve(this.props.queryModel);
    }

    render() {
        const { queryModel } = this.props;
        const { actions, values } = this.mapParamsToActionValues();

        return (
            <OmniBox
                actions={actions}
                onChange={this.onOmniBoxChange}
                values={values}
                disabled={queryModel.isError}
            />
        )
    }
}