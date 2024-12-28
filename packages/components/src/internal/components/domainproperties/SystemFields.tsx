import React, { FC, memo, ReactNode, useCallback, useMemo, useState } from 'react';

import classNames from 'classnames';

import { Grid } from '../base/Grid';

import { GridColumn } from '../base/models/GridColumn';

import { SystemField } from './models';
import { Collapsible } from './Collapsible';

interface Props {
    disabledSystemFields?: string[];
    fields: SystemField[];
    onSystemFieldEnable: (field: string, checked: boolean) => void;
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
        setCollapsed(c => !c);
    }, []);

    const gridData = useMemo<SystemField[]>(() => {
        const data: SystemField[] = [];
        const disabledFieldsLc: string[] = [];
        disabledSystemFields?.forEach(field => {
            disabledFieldsLc.push(field.toLowerCase());
        });
        fields.forEach(field => {
            const dataRow = { ...field };
            const fieldName = field.Name;
            dataRow.Enabled = disabledFieldsLc.indexOf(fieldName?.toLowerCase()) === -1;
            data.push(dataRow);
        });
        return data;
    }, [fields, disabledSystemFields]);

    const systemFieldColumns = useMemo<GridColumn[]>(() => {
        const enabledColumn = new GridColumn({
            index: 'Enabled',
            title: 'Enabled',
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            cell: (selected: boolean, row: any): ReactNode => {
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
        return [enabledColumn, ...SYSTEM_FIELD_GRID_COLS];
    }, [onSystemFieldEnable]);

    return (
        <>
            <div className="domain-system-fields">
                <div className="domain-system-fields-header">
                    <div className="domain-system-fields-header__text" onClick={onToggle}>
                        Default System Fields
                    </div>
                    <div className="domain-system-fields-header__icon" onClick={onToggle}>
                        <i className={classNames('fa fa-lg', collapsed ? 'fa-chevron-right' : 'fa-chevron-down')} />
                    </div>
                </div>
            </div>

            <Collapsible expanded={!collapsed}>
                <div className="domain-system-fields__grid">
                    <Grid data={gridData} condensed columns={systemFieldColumns} />
                </div>
            </Collapsible>

            <div className="domain-custom-fields-header__text">Custom Fields</div>
        </>
    );
});
SystemFields.displayName = 'SystemFields';
