import React, { PureComponent } from 'react';
import { List, Map, OrderedMap } from 'immutable';

import { caseInsensitive, DefaultRenderer, QueryColumn } from '../../..';
import { isSampleStatusEnabled } from '../../app/utils';
import { SAMPLE_STATE_COLUMN_NAME } from './constants';

interface SampleAliquotDetailHeaderProps {
    aliquotHeaderDisplayColumns: List<QueryColumn>;
    row: Map<string, any>;
}

export class SampleAliquotDetailHeader extends PureComponent<SampleAliquotDetailHeaderProps> {
    renderAliquotDetailSubHeader(header: string) {
        return (
            <div className="bottom-spacing">
                <b>{header}</b>
            </div>
        );
    }

    renderDetailRow(label: string, data: any, key: any) {
        return (
            <tr key={key}>
                <td>{label}</td>
                <td>
                    <DefaultRenderer data={data} />
                </td>
            </tr>
        );
    }

    render() {
        const { row, aliquotHeaderDisplayColumns } = this.props;
        const newRow = row.reduce((newRow, value, key) => {
            return newRow.set(key.toLowerCase(), value);
        }, OrderedMap<string, any>());

        const description = newRow.get('description');
        const created = newRow.get('created');
        const status = newRow.get(SAMPLE_STATE_COLUMN_NAME.toLowerCase());
        const createdBy = newRow.get('createdby');
        const parent = newRow.get('aliquotedfromlsid/name');

        return (
            <>
                <table className="table table-responsive table-condensed detail-component--table__fixed sample-aliquots-details-table">
                    <tbody>
                        {this.renderDetailRow('Aliquoted from', parent, 'aliquotedfrom')}
                        {this.renderDetailRow('Aliquoted by', createdBy, 'aliquotedby')}
                        {this.renderDetailRow('Aliquot date', created, 'aliquoteddate')}
                        {this.renderDetailRow('Aliquot description', description, 'aliquoteddescription')}
                        {isSampleStatusEnabled() && this.renderDetailRow('Aliquot status', status, 'aliquotedstatus')}
                        {aliquotHeaderDisplayColumns.map((aliquotCol, key) => {
                            return this.renderDetailRow(
                                aliquotCol.caption,
                                newRow.get(aliquotCol.fieldKey.toLowerCase()),
                                key
                            );
                        })}
                    </tbody>
                </table>
            </>
        );
    }
}
