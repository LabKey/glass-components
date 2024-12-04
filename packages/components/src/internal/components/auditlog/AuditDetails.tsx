/*
 * Copyright (c) 2016-2018 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { Component, PropsWithChildren, ReactNode } from 'react';
import { List, Map } from 'immutable';

import { User } from '../base/models/User';
import { capitalizeFirstChar } from '../../util/utils';
import { GridColumn } from '../base/models/GridColumn';
import { Grid } from '../base/Grid';

import { UserLink } from '../user/UserLink';

import { getEventDataValueDisplay } from './utils';
import { AuditDetailsModel } from './models';

interface Props extends PropsWithChildren {
    changeDetails?: AuditDetailsModel;
    emptyMsg?: string;
    fieldValueRenderer?: (label, value, displayValue) => any;
    gridColumnRenderer?: (data: any, row: any, displayValue: any) => any;
    gridData?: List<Map<string, any>>;
    rowId?: number;
    summary?: string;
    title?: string;
    user: User;
}

export class AuditDetails extends Component<Props> {
    static defaultProps = {
        title: 'Audit Event Details',
        emptyMsg: 'No audit event selected.',
    };

    static isUserFieldLabel(field: string): boolean {
        return ['created by', 'createdby', 'modified by', 'modifiedby'].indexOf(field.toLowerCase()) > -1;
    }

    getValueDisplay = (field: string, value: string): any => {
        const { fieldValueRenderer } = this.props;

        let displayVal: any = value;
        if (value == null || value === '') displayVal = 'NA';

        if (AuditDetails.isUserFieldLabel(field) && value !== undefined) {
            displayVal = <UserLink userId={parseInt(value, 10)} />;
        }

        if (fieldValueRenderer) displayVal = fieldValueRenderer(field, value, displayVal);

        return displayVal;
    };

    renderRow(field: string, oldVal: string, newVal: string, isUpdate: boolean, isInsert: boolean): ReactNode {
        const { user } = this.props;

        if (!user.isSignedIn && AuditDetails.isUserFieldLabel(field)) return null;

        const oldValue = this.getValueDisplay(field, oldVal);
        const newValue = this.getValueDisplay(field, newVal);
        const changed = oldValue !== newValue;

        return (
            <div className="row margin-bottom" key={field}>
                <div className="left-padding right-padding">
                    <span className="audit-detail-row-label right-padding">{capitalizeFirstChar(field)}</span>
                </div>
                <div className="left-padding right-padding">
                    {isInsert && <span className="new-audit-value">{newValue}</span>}
                    {isUpdate && changed && (
                        <>
                            <span className="display-light old-audit-value right-padding">{oldValue}</span>
                            <i className="fa fa-long-arrow-right right-padding" />
                            <span className="new-audit-value">{newValue}</span>
                        </>
                    )}
                    {isUpdate && !changed && (
                        <span className="display-light old-audit-value right-padding">{oldValue}</span>
                    )}
                    {!isInsert && !isUpdate && <span className="display-light old-audit-value">{oldValue}</span>}
                </div>
            </div>
        );
    }

    renderChanges() {
        const { changeDetails } = this.props;

        const isUpdate = changeDetails.isUpdate();
        const isInsert = changeDetails.isInsert();
        const usedFields = [];

        let oldFields, newFields;
        if (changeDetails.oldData) {
            oldFields = changeDetails.oldData.entrySeq().map(([field, value]) => {
                let newValue;
                if (changeDetails.newData) {
                    newValue = changeDetails.newData.get(field);
                    usedFields.push(field);
                }

                return this.renderRow(field, value, newValue, isUpdate, isInsert);
            });
        }

        if (changeDetails.newData) {
            newFields = changeDetails.newData.entrySeq().map(([field, value]) => {
                if (usedFields.indexOf(field) >= 0) return null;

                return this.renderRow(field, undefined, value, isUpdate, isInsert);
            });
        }

        return (
            <>
                {oldFields}
                {newFields}
            </>
        );
    }

    getGridColumns = (): List<GridColumn> => {
        const { user, gridColumnRenderer } = this.props;
        return List<GridColumn>([
            new GridColumn({
                index: 'field',
                title: 'Field',
                showHeader: false,
            }),
            new GridColumn({
                index: 'value',
                title: 'Value',
                showHeader: false,
                cell: (data, row) => {
                    let display;
                    if (row.get('isUser')) {
                        display = <UserLink userId={row.get('value')} />;
                    } else if (Map.isMap(data) && data.get('urlType') === 'user') {
                        display = <UserLink userId={data.get('value')} userDisplayValue={data.get('displayValue')} />;
                    } else {
                        display = getEventDataValueDisplay(data, user.isAdmin);
                    }

                    if (gridColumnRenderer) display = gridColumnRenderer(data, row, display);

                    return display;
                },
            }),
        ]);
    };

    render() {
        const { changeDetails, children, emptyMsg, gridData, rowId, summary, title } = this.props;

        return (
            <div className="panel panel-default">
                <div className="panel-heading">{title}</div>
                <div className="panel-body">
                    {children}
                    {!rowId && <div>{emptyMsg}</div>}
                    {!!rowId && (
                        <>
                            {summary && (
                                <div className="row margin-bottom display-light">
                                    <div className="col-xs-12">{summary}</div>
                                </div>
                            )}
                            {gridData && <Grid data={gridData} columns={this.getGridColumns()} showHeader={false} />}
                            {changeDetails && this.renderChanges()}
                        </>
                    )}
                </div>
            </div>
        );
    }
}
