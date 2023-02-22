import React, { FC, memo, ReactNode, useCallback, useMemo, useState } from 'react';
import { List } from "immutable";

import classNames from 'classnames';

import { Collapse } from 'react-bootstrap';

import { Grid } from '../base/Grid';

import { SystemField } from './models';
import { EXPAND_TRANSITION } from './constants';
import { GridColumn } from "../base/models/GridColumn";

interface Props {
    fields: SystemField[];
    onSystemFieldEnable: (field: string, checked: boolean) => void;
    disabledSystemFields?: string[];
}

const SYSTEM_FIELD_GRID_COLS = [
    new GridColumn({
        index: 'Name',
        title: 'Name',
    }),
    new GridColumn({
        index: 'Label',
        title: 'Label',
    }),
    new GridColumn({
        index: 'DataType',
        title: 'Data Type',
    }),
    new GridColumn({
        index: 'Required',
        title: 'Required',
        cell: (selected: boolean): ReactNode => {
            return (
                // eslint-disable-next-line react/jsx-no-bind
                <input
                    className="grid-panel__row-checkbox"
                    type="checkbox"
                    disabled={true}
                    checked={selected === true}
                />
            );
        },
    }),
    new GridColumn({
        index: 'Description',
        title: 'Description',
    }),
];

export const SystemFields: FC<Props> = memo(({ fields, disabledSystemFields, onSystemFieldEnable }) => {
    const [collapsed, setCollapsed] = useState<boolean>(false);

    const onToggle = useCallback(() => {
        setCollapsed(!collapsed);
    }, [collapsed]);

    const gridData : SystemField[] = useMemo(() => {
        const data : SystemField[] = [];
        const disabledFieldsLc = [];
        disabledSystemFields?.forEach(field => {
            disabledFieldsLc.push(field.toLowerCase());
        });
        fields.forEach(field => {
            const dataRow = {...field};
            const fieldName = field.Name;
            dataRow.Enabled = disabledFieldsLc.indexOf(fieldName?.toLowerCase()) === -1;
            data.push(dataRow);
        });
        return data;
    }, [fields, disabledSystemFields]);

    const systemFieldColumns : List<any> = useMemo(() => {
        const enabledColumn = new GridColumn({
            index: 'Enabled',
            title: 'Enabled',
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            cell: (selected: boolean, row: any): ReactNode => {
                // const onChange = (event): void => this.selectRow(row, event);
                // const disabled = isLoading || isLoadingSelections;

                const onChange = (event): void => {
                    const checked = event.target.checked === true;
                    onSystemFieldEnable(row.get('Name'), checked);
                };
                return (
                    // eslint-disable-next-line react/jsx-no-bind
                    <input
                        className="grid-panel__row-checkbox"
                        type="checkbox"
                        disabled={!row.get('Disableble')}
                        checked={selected === true}
                        onChange={onChange} // eslint-disable-line
                    />
                );
            },
        });
        return List([enabledColumn, ...SYSTEM_FIELD_GRID_COLS]);
    }, [onSystemFieldEnable]);

    return (
        <>
            <div className="domain-system-fields">
                <div className="domain-system-fields-header">
                    <div className="domain-system-fields-header__icon" onClick={onToggle}>
                        <i className={classNames('fa fa-lg', collapsed ? 'fa-plus-square' : 'fa-minus-square')} />
                    </div>
                    <div className="domain-system-fields-header__text" onClick={onToggle}>
                        Default System Fields
                    </div>
                </div>
            </div>

            <Collapse in={!collapsed} timeout={EXPAND_TRANSITION}>
                <div className="domain-system-fields__grid">
                    <Grid data={gridData} condensed={true} columns={systemFieldColumns}/>
                </div>
            </Collapse>

            <div className="domain-custom-fields-header__text"> Custom Fields </div>
        </>
    );
});
